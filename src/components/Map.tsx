import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import planeIconSvg from '../assets/plane.svg';
import { fetchGlobalFlights } from '../services/opensky';
import { satelliteService } from '../services/satellites';
import { fetchLiveEarthquakes, type EarthquakeFeature } from '../services/earthquakes';
import { fetchLiveWildfires, type WildfireFeature } from '../services/wildfires';

import type { Location } from '../App';

const STYLES = {
    dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
    satellite: 'https://api.maptiler.com/maps/satellite/style.json?key=get_your_own_OpIi9ZULNHzrESv6T2vL'
};

type MapProps = {
    onMapLoaded?: (map: maplibregl.Map) => void;
    activeLayer: 'dark' | 'satellite';
    targetLocation?: Location | null;
    flightsEnabled?: boolean;
    onFlightError?: (error: string | null) => void;
    onFlightDataRefresh?: (timestamp: Date) => void;
    onFlightClick?: (flight: any) => void;
    satellitesEnabled?: boolean;
    onSatelliteClick?: (sat: { name: string, height: number } | null) => void;
    earthquakesEnabled?: boolean;
    onEarthquakeClick?: (eq: EarthquakeFeature | null) => void;
    wildfiresEnabled?: boolean;
    onWildfireClick?: (wf: WildfireFeature | null) => void;
};

export default function OSViewrMap({ onMapLoaded, activeLayer, targetLocation, flightsEnabled = false, onFlightError, onFlightDataRefresh, onFlightClick, satellitesEnabled = false, onSatelliteClick, earthquakesEnabled = false, onEarthquakeClick, wildfiresEnabled = false, onWildfireClick }: MapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Track refresh intervals and timeouts
    const pollingIntervalRef = useRef<number | null>(null);
    const eqPollingIntervalRef = useRef<number | null>(null);
    const wfPollingIntervalRef = useRef<number | null>(null);

    // Track active layer toggles for style reloads
    const flightsEnabledRef = useRef(flightsEnabled);
    const satellitesEnabledRef = useRef(satellitesEnabled);
    const earthquakesEnabledRef = useRef(earthquakesEnabled);
    const wildfiresEnabledRef = useRef(wildfiresEnabled);
    const isLoadedRef = useRef(isLoaded);

    useEffect(() => { flightsEnabledRef.current = flightsEnabled; }, [flightsEnabled]);
    useEffect(() => { satellitesEnabledRef.current = satellitesEnabled; }, [satellitesEnabled]);
    useEffect(() => { earthquakesEnabledRef.current = earthquakesEnabled; }, [earthquakesEnabled]);
    useEffect(() => { wildfiresEnabledRef.current = wildfiresEnabled; }, [wildfiresEnabled]);
    useEffect(() => { isLoadedRef.current = isLoaded; }, [isLoaded]);

    // Fetch and update global flights data
    const refreshFlights = useCallback(async () => {
        const map = mapRef.current;
        if (!map || !flightsEnabled) return;

        const response = await fetchGlobalFlights();

        if (response.error === 'rate_limit') {
            if (onFlightError) onFlightError("OpenSky Daily Rate Limit Reached (Free Tier)");
        } else if (response.error === 'api_error') {
            if (onFlightError) onFlightError("Flight API Error");
        } else {
            if (onFlightError) onFlightError(null);
        }

        if (response.timestamp && onFlightDataRefresh) {
            onFlightDataRefresh(response.timestamp);
        }

        const source = map.getSource('flights-source') as maplibregl.GeoJSONSource;
        if (source) {
            source.setData(response.data);
        }
    }, [flightsEnabled, onFlightError, onFlightDataRefresh]);

    // Setup or teardown flights based on toggle
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !isLoaded) return;

        if (flightsEnabled) {
            // Initial fetch
            refreshFlights();

            // Set up polling every 4 minutes (240000ms) to dump global flights
            pollingIntervalRef.current = window.setInterval(refreshFlights, 240000);

            // Make layer visible if it exists
            if (map.getLayer('flights-layer')) {
                map.setLayoutProperty('flights-layer', 'visibility', 'visible');
            }

            // Add interaction listeners for flights
            const handleFlightClick = (e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
                if (e.features && e.features.length > 0 && onFlightClick) {
                    onFlightClick(e.features[0]);
                }
            };
            const handleFlightEnter = () => { map.getCanvas().style.cursor = 'pointer'; };
            const handleFlightLeave = () => { map.getCanvas().style.cursor = ''; };

            map.on('click', 'flights-layer', handleFlightClick);
            map.on('mouseenter', 'flights-layer', handleFlightEnter);
            map.on('mouseleave', 'flights-layer', handleFlightLeave);

            return () => {
                if (pollingIntervalRef.current) window.clearInterval(pollingIntervalRef.current);
                map.off('click', 'flights-layer', handleFlightClick);
                map.off('mouseenter', 'flights-layer', handleFlightEnter);
                map.off('mouseleave', 'flights-layer', handleFlightLeave);
            };

        } else {
            // Teardown
            if (pollingIntervalRef.current) {
                window.clearInterval(pollingIntervalRef.current);
            }

            // Hide layer
            if (map.getLayer('flights-layer')) {
                map.setLayoutProperty('flights-layer', 'visibility', 'none');
            }
            if (onFlightClick) onFlightClick(null);

            return () => {
                if (pollingIntervalRef.current) window.clearInterval(pollingIntervalRef.current);
            };
        }
    }, [flightsEnabled, isLoaded, refreshFlights, onFlightClick]);

    // Handle Live Satellites lifecycle and animation loop
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !isLoaded) return;

        let animationFrameId: number;

        const animateSatellites = () => {
            // Only update data if the source currently exists (might be temporarily wiped during style reload)
            if (map.getSource('satellites-source')) {
                const geoJsonData = satelliteService.getSatellitePositions(new Date());
                const source = map.getSource('satellites-source') as maplibregl.GeoJSONSource;
                source.setData(geoJsonData);
            }

            // Always keep the animation loop alive while the layer toggle is on
            animationFrameId = requestAnimationFrame(animateSatellites);
        };

        if (satellitesEnabled) {
            if (map.getLayer('satellites-layer')) {
                map.setLayoutProperty('satellites-layer', 'visibility', 'visible');
            }
            satelliteService.initialize().then(() => {
                animateSatellites();
            });

            // Add interaction listeners for satellites
            const handleSatClick = (e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
                if (e.features && e.features.length > 0 && onSatelliteClick) {
                    const feature = e.features[0];
                    if (feature.properties) {
                        onSatelliteClick({
                            name: feature.properties.name,
                            height: feature.properties.height
                        });
                    }
                }
            };

            const handleSatEnter = () => { map.getCanvas().style.cursor = 'pointer'; };
            const handleSatLeave = () => { map.getCanvas().style.cursor = ''; };

            map.on('click', 'satellites-layer', handleSatClick);
            map.on('mouseenter', 'satellites-layer', handleSatEnter);
            map.on('mouseleave', 'satellites-layer', handleSatLeave);

            return () => {
                if (animationFrameId) cancelAnimationFrame(animationFrameId);
                map.off('click', 'satellites-layer', handleSatClick);
                map.off('mouseenter', 'satellites-layer', handleSatEnter);
                map.off('mouseleave', 'satellites-layer', handleSatLeave);
            };
        } else {
            if (map.getLayer('satellites-layer')) {
                map.setLayoutProperty('satellites-layer', 'visibility', 'none');
            }
            if (onSatelliteClick) onSatelliteClick(null);

            return () => {
                if (animationFrameId) cancelAnimationFrame(animationFrameId);
            };
        }
    }, [satellitesEnabled, isLoaded, onSatelliteClick]);

    // Fetch and update earthquakes data
    const refreshEarthquakes = useCallback(async () => {
        const map = mapRef.current;
        if (!map || !earthquakesEnabled) return;

        const response = await fetchLiveEarthquakes();
        const source = map.getSource('earthquakes-source') as maplibregl.GeoJSONSource;

        if (source && !response.error) {
            source.setData(response.data);
        }
    }, [earthquakesEnabled]);

    // Setup or teardown earthquakes based on toggle
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !isLoaded) return;

        if (earthquakesEnabled) {
            refreshEarthquakes();

            // USGS updates roughly every minute
            eqPollingIntervalRef.current = window.setInterval(refreshEarthquakes, 60000);

            if (map.getLayer('earthquakes-layer')) {
                map.setLayoutProperty('earthquakes-layer', 'visibility', 'visible');
            }

            // Click interaction
            const handleEqClick = (e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
                if (e.features && e.features.length > 0 && onEarthquakeClick) {
                    // Typecast the generic feature to our specific EarthquakeFeature
                    onEarthquakeClick(e.features[0] as unknown as EarthquakeFeature);
                }
            };
            const handleEqEnter = () => { map.getCanvas().style.cursor = 'pointer'; };
            const handleEqLeave = () => { map.getCanvas().style.cursor = ''; };

            map.on('click', 'earthquakes-layer', handleEqClick);
            map.on('mouseenter', 'earthquakes-layer', handleEqEnter);
            map.on('mouseleave', 'earthquakes-layer', handleEqLeave);

            return () => {
                if (eqPollingIntervalRef.current) window.clearInterval(eqPollingIntervalRef.current);
                map.off('click', 'earthquakes-layer', handleEqClick);
                map.off('mouseenter', 'earthquakes-layer', handleEqEnter);
                map.off('mouseleave', 'earthquakes-layer', handleEqLeave);
            };

        } else {
            if (eqPollingIntervalRef.current) {
                window.clearInterval(eqPollingIntervalRef.current);
            }
            if (map.getLayer('earthquakes-layer')) {
                map.setLayoutProperty('earthquakes-layer', 'visibility', 'none');
            }
            if (onEarthquakeClick) onEarthquakeClick(null);
        }
    }, [earthquakesEnabled, isLoaded, refreshEarthquakes, onEarthquakeClick]);

    // Handle NASA Wildfires layer visibility and polling
    const refreshWildfires = useCallback(async () => {
        const map = mapRef.current;
        if (!map || !wildfiresEnabled) return;

        const response = await fetchLiveWildfires();
        const source = map.getSource('wildfires-source') as maplibregl.GeoJSONSource;

        if (source && !response.error) {
            source.setData(response.data);
        }
    }, [wildfiresEnabled]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !isLoaded) return;

        if (wildfiresEnabled) {
            refreshWildfires();

            // NASA FIRMS global CSVs are updated continuously but pulling every 10 mins is safe
            wfPollingIntervalRef.current = window.setInterval(refreshWildfires, 600000);

            if (map.getLayer('wildfires-layer')) {
                map.setLayoutProperty('wildfires-layer', 'visibility', 'visible');
            }

            // Click interaction
            const handleWfClick = (e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
                if (e.features && e.features.length > 0 && onWildfireClick) {
                    onWildfireClick(e.features[0] as unknown as WildfireFeature);
                }
            };
            const handleWfEnter = () => { map.getCanvas().style.cursor = 'pointer'; };
            const handleWfLeave = () => { map.getCanvas().style.cursor = ''; };

            map.on('click', 'wildfires-layer', handleWfClick);
            map.on('mouseenter', 'wildfires-layer', handleWfEnter);
            map.on('mouseleave', 'wildfires-layer', handleWfLeave);

            // Cleanup
            return () => {
                map.off('click', 'wildfires-layer', handleWfClick);
                map.off('mouseenter', 'wildfires-layer', handleWfEnter);
                map.off('mouseleave', 'wildfires-layer', handleWfLeave);
            };
        } else {
            if (wfPollingIntervalRef.current) {
                window.clearInterval(wfPollingIntervalRef.current);
            }
            if (map.getLayer('wildfires-layer')) {
                map.setLayoutProperty('wildfires-layer', 'visibility', 'none');
            }
            if (onWildfireClick) onWildfireClick(null);
        }

        return () => {
            if (wfPollingIntervalRef.current) window.clearInterval(wfPollingIntervalRef.current);
        };
    }, [wildfiresEnabled, isLoaded, refreshWildfires, onWildfireClick]);

    const setupLayers = (map: maplibregl.Map) => {
        // Load the airplane icon
        const img = new Image();
        img.src = planeIconSvg;
        img.onload = () => {
            if (!map.hasImage('plane-icon')) {
                map.addImage('plane-icon', img);
            }
        };

        // Inject custom, correct India topographical borders to overwrite the default disputed Carto dashed lines
        if (!map.getSource('india-borders')) {
            map.addSource('india-borders', {
                type: 'geojson',
                data: '/india-borders.geojson'
            });
        }

        if (!map.getLayer('india-borders-layer')) {
            map.addLayer({
                id: 'india-borders-layer',
                type: 'line',
                source: 'india-borders',
                paint: {
                    'line-color': 'rgba(102, 102, 102, 1)', // Matches Carto layout
                    'line-width': 1.5,
                    'line-opacity': 0.8
                }
            });
        }

        if (!map.getSource('flights-source')) {
            map.addSource('flights-source', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });
        }

        if (!map.getLayer('flights-layer')) {
            map.addLayer({
                id: 'flights-layer',
                type: 'symbol',
                source: 'flights-source',
                layout: {
                    'icon-image': 'plane-icon',
                    'icon-size': 0.2,
                    'icon-rotate': ['get', 'trueTrack'],
                    'icon-rotation-alignment': 'map',
                    'icon-allow-overlap': true, // Planes often overlap
                    'icon-ignore-placement': false, // Crucial: must be false for clickable features bounds
                    'visibility': flightsEnabledRef.current ? 'visible' : 'none'
                }
            });
        }

        if (!map.getSource('satellites-source')) {
            map.addSource('satellites-source', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });
        }

        if (!map.getLayer('satellites-layer')) {
            map.addLayer({
                id: 'satellites-layer',
                type: 'circle',
                source: 'satellites-source',
                paint: {
                    'circle-radius': 2.5,
                    'circle-color': '#fff',
                    'circle-opacity': 0.8,
                    'circle-stroke-width': 12,
                    'circle-stroke-color': 'rgba(0,0,0,0)'
                },
                layout: {
                    'visibility': satellitesEnabledRef.current ? 'visible' : 'none'
                }
            });
        }

        if (!map.getSource('earthquakes-source')) {
            map.addSource('earthquakes-source', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });
        }

        if (!map.getLayer('earthquakes-layer')) {
            map.addLayer({
                id: 'earthquakes-layer',
                type: 'circle',
                source: 'earthquakes-source',
                paint: {
                    // Radius scales based on Magnitude. 
                    // Mag 1 = tiny dot, Mag 7 = huge dot
                    'circle-radius': [
                        'interpolate', ['linear'], ['get', 'mag'],
                        1, 4,
                        7, 24
                    ],
                    // Color transitions from yellow to intense red based on Magnitude
                    'circle-color': [
                        'interpolate', ['linear'], ['get', 'mag'],
                        1, '#fde047',
                        4, '#f97316',
                        6, '#ef4444',
                        8, '#991b1b'
                    ],
                    'circle-opacity': 0.7,
                    'circle-stroke-width': 1.5,
                    'circle-stroke-color': 'rgba(255,255,255,0.4)',
                    // Pulse blur effect natively via MapLibre
                    'circle-blur': 0.2
                },
                layout: {
                    'visibility': earthquakesEnabledRef.current ? 'visible' : 'none'
                }
            });
        }

        if (!map.getSource('wildfires-source')) {
            map.addSource('wildfires-source', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });
        }

        if (!map.getLayer('wildfires-layer')) {
            map.addLayer({
                id: 'wildfires-layer',
                type: 'circle',
                source: 'wildfires-source',
                paint: {
                    // Brightness temp is usually 290k - 360k+
                    'circle-radius': [
                        'interpolate', ['linear'], ['get', 'bright_ti4'],
                        300, 1.5,
                        360, 4
                    ],
                    // Colors map from deep orange to intense red/white based on brightness heat
                    'circle-color': [
                        'interpolate', ['linear'], ['get', 'bright_ti4'],
                        300, '#f97316',
                        330, '#ef4444',
                        360, '#fef08a'
                    ],
                    'circle-opacity': 0.8,
                    'circle-stroke-width': 1,
                    'circle-stroke-color': 'rgba(0, 0, 0, 0.4)',
                    'circle-blur': 0.1
                },
                layout: {
                    'visibility': wildfiresEnabledRef.current ? 'visible' : 'none'
                }
            });
        }
    };

    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        mapRef.current = new maplibregl.Map({
            container: mapContainerRef.current,
            style: STYLES[activeLayer],
            center: [-74.0060, 40.7128],
            zoom: 2.2,
            pitch: 0,
            // @ts-ignore
            projection: { type: 'globe' },
            attributionControl: false
        });

        mapRef.current.addControl(
            new maplibregl.NavigationControl({ visualizePitch: true }),
            'bottom-right'
        );

        mapRef.current.on('load', () => {
            setIsLoaded(true);
            if (mapRef.current) {
                // @ts-ignore
                window.map = mapRef.current; // Expose for debugging
                setupLayers(mapRef.current);
            }
            if (onMapLoaded && mapRef.current) {
                onMapLoaded(mapRef.current);
            }
        });

        mapRef.current.on('style.load', () => {
            if (mapRef.current) {
                try {
                    // @ts-ignore
                    mapRef.current.setProjection({ type: 'globe' });
                } catch (e) {
                    console.warn('Globe projection not supported', e);
                }

                try {
                    // @ts-ignore
                    mapRef.current.setFog({
                        color: '#0f172a',
                        'high-color': '#0f172a',
                        'horizon-blend': 0.1,
                    });
                } catch (e) { }

                // Recreate layers if style changes wipes them out
                if (isLoadedRef.current) {
                    setupLayers(mapRef.current);
                }
            }
        });

        return () => {
            mapRef.current?.remove();
            mapRef.current = null;
        };
    }, []); // Only run once for initialization

    const prevLayerRef = useRef(activeLayer);

    useEffect(() => {
        if (mapRef.current && isLoaded && activeLayer !== prevLayerRef.current) {
            mapRef.current.setStyle(STYLES[activeLayer]);
            prevLayerRef.current = activeLayer;
        }
    }, [activeLayer, isLoaded]);

    useEffect(() => {
        if (mapRef.current && isLoaded && targetLocation) {
            // Zoom out if returning to default location
            if (targetLocation.lng === -74.0060 && targetLocation.lat === 40.7128) {
                mapRef.current.flyTo({
                    center: [-74.0060, 40.7128],
                    zoom: 2.2,
                    pitch: 0,
                    speed: 1.2,
                    curve: 1.4,
                    essential: true
                });
            } else {
                mapRef.current.flyTo({
                    center: [targetLocation.lng, targetLocation.lat],
                    zoom: 12,
                    speed: 1.2,
                    curve: 1.4,
                    pitch: 60,
                    essential: true
                });
            }
        }
    }, [targetLocation, isLoaded]);

    return (
        <div className="map-container" ref={mapContainerRef}>
            {!isLoaded && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white' }}>
                    Loading globe...
                </div>
            )}
        </div>
    );
}
