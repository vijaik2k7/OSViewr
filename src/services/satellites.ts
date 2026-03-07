import * as satellite from 'satellite.js';

export interface SatelliteFeature extends GeoJSON.Feature<GeoJSON.Point> {
    properties: {
        name: string;
        height: number;
    };
}

class SatelliteService {
    private satRecs: { name: string; satrec: satellite.SatRec }[] = [];
    private isInitialized = false;

    async initialize() {
        if (this.isInitialized) return;

        try {
            // Fetch the Active Satellites TLE dataset from CelesTrak
            const response = await fetch('https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle');
            const tleData = await response.text();

            // Parse TLEs into an array
            // Format is 3 lines per satellite:
            // Line 1: Name
            // Line 2: TLE Line 1
            // Line 3: TLE Line 2
            const lines = tleData.split('\n').map(line => line.trim());
            const parsedSatRecs = [];

            for (let i = 0; i < lines.length - 2; i += 3) {
                const name = lines[i];
                const tleLine1 = lines[i + 1];
                const tleLine2 = lines[i + 2];

                if (name && tleLine1 && tleLine2) {
                    const satrec = satellite.twoline2satrec(tleLine1, tleLine2);
                    // Filter out un-propagatable invalid elements
                    if (satrec && !satrec.error) {
                        parsedSatRecs.push({ name, satrec });
                    }
                }
            }

            this.satRecs = parsedSatRecs;
            this.isInitialized = true;
            console.log(`Loaded ${this.satRecs.length} active satellite trajectories.`);
        } catch (error) {
            console.error('Failed to load satellite TLEs:', error);
        }
    }

    getSatellitePositions(date = new Date()): GeoJSON.FeatureCollection<GeoJSON.Point> {
        if (!this.isInitialized || this.satRecs.length === 0) {
            return { type: 'FeatureCollection', features: [] };
        }

        const features: SatelliteFeature[] = [];
        const gmst = satellite.gstime(date);

        for (const { name, satrec } of this.satRecs) {
            const positionAndVelocity = satellite.propagate(satrec, date);
            if (!positionAndVelocity) continue;

            const positionEci = positionAndVelocity.position;

            if (positionEci && typeof positionEci !== 'boolean') {
                const positionGd = satellite.eciToGeodetic(positionEci, gmst);

                // Convert from radians to degrees
                const longitude = satellite.degreesLong(positionGd.longitude);
                const latitude = satellite.degreesLat(positionGd.latitude);
                const height = positionGd.height; // in km

                // Filter out obviously erratic mathematical propagations
                if (!isNaN(longitude) && !isNaN(latitude) && !isNaN(height)) {
                    features.push({
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [longitude, latitude] // MapLibre uses [lng, lat]
                        },
                        properties: {
                            name,
                            height
                        }
                    });
                }
            }
        }

        return {
            type: 'FeatureCollection',
            features
        };
    }
}

export const satelliteService = new SatelliteService();
