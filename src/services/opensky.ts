export interface FlightData {
    icao24: string;
    callsign: string;
    originCountry: string;
    timePosition: number;
    lastContact: number;
    longitude: number;
    latitude: number;
    baroAltitude: number;
    onGround: boolean;
    velocity: number;
    trueTrack: number; // heading
    verticalRate: number;
    geoAltitude: number;
    squawk: string;
    spi: boolean;
    positionSource: number;
}

// OpenSky Network returns an array of primitives for each flight to save bytes.
// We map those indexes to our typed interface.
const parseOpenSkyFlight = (data: any[]): FlightData => ({
    icao24: data[0] ?? '',
    callsign: data[1] ? data[1].trim() : '',
    originCountry: data[2] ?? '',
    timePosition: data[3] ?? 0,
    lastContact: data[4] ?? 0,
    longitude: data[5],
    latitude: data[6],
    baroAltitude: data[7] ?? 0,
    onGround: data[8] ?? false,
    velocity: data[9] ?? 0,
    trueTrack: data[10] ?? 0,
    verticalRate: data[11] ?? 0,
    geoAltitude: data[13] ?? 0,
    squawk: data[14] ?? '',
    spi: data[15] ?? false,
    positionSource: data[16] ?? 0
});

export interface FlightResponse {
    data: GeoJSON.FeatureCollection<GeoJSON.Point>;
    error?: 'rate_limit' | 'api_error';
    timestamp?: Date;
}

export const fetchGlobalFlights = async (): Promise<FlightResponse> => {
    try {
        // Fetch all global states without bounding box to maximize data per single request
        const response = await fetch(`https://opensky-network.org/api/states/all`);
        if (!response.ok) {
            if (response.status === 429) {
                console.warn('OpenSky API rate limit reached.');
                return { data: { type: 'FeatureCollection', features: [] }, error: 'rate_limit' };
            }
            throw new Error(`OpenSky API responded with status ${response.status}`);
        }

        const data = await response.json();

        if (!data || !data.states) {
            return { data: { type: 'FeatureCollection', features: [] }, timestamp: new Date() };
        }

        const features: GeoJSON.Feature<GeoJSON.Point>[] = data.states
            .map(parseOpenSkyFlight)
            // Filter out missing coordinate data
            .filter((flight: FlightData) => flight.longitude !== null && flight.latitude !== null)
            .map((flight: FlightData) => ({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [flight.longitude, flight.latitude]
                },
                properties: {
                    ...flight,
                    // Format for easier display
                    velocity_knots: Math.round((flight.velocity || 0) * 1.94384),
                    altitude_ft: Math.round((flight.baroAltitude || 0) * 3.28084)
                }
            }));

        return {
            data: {
                type: 'FeatureCollection',
                features
            },
            timestamp: new Date()
        };
    } catch (error) {
        console.error('Error fetching global flights:', error);
        return { data: { type: 'FeatureCollection', features: [] }, error: 'api_error' };
    }
};
