export interface EarthquakeProperties {
    mag: number;
    place: string;
    time: number;
    updated: number;
    tz: number | null;
    url: string;
    detail: string;
    felt: number | null;
    cdi: number | null;
    mmi: number | null;
    alert: string | null;
    status: string;
    tsunami: number;
    sig: number;
    net: string;
    code: string;
    ids: string;
    sources: string;
    types: string;
    nst: number | null;
    dmin: number | null;
    rms: number;
    gap: number | null;
    magType: string;
    type: string;
    title: string;
}

export type EarthquakeFeature = GeoJSON.Feature<GeoJSON.Point, EarthquakeProperties>;

export interface EarthquakeDataResponse {
    data: GeoJSON.FeatureCollection<GeoJSON.Point, EarthquakeProperties>;
    error?: 'api_error' | null;
}

/**
 * Fetches the USGS "All Earthquakes, Past Day" GeoJSON feed.
 * This endpoint updates every minute and is highly cached by the USGS.
 * It is completely free and has extremely generous rate limits.
 */
export async function fetchLiveEarthquakes(): Promise<EarthquakeDataResponse> {
    try {
        const response = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson');

        if (!response.ok) {
            throw new Error(`USGS API responded with status ${response.status}`);
        }

        const data: GeoJSON.FeatureCollection<GeoJSON.Point, EarthquakeProperties> = await response.json();

        return {
            data,
            error: null
        };
    } catch (err) {
        console.error("Error fetching earthquake data:", err);
        return {
            data: { type: 'FeatureCollection', features: [] },
            error: 'api_error'
        };
    }
}
