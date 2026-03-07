export type WildfireFeature = {
    type: 'Feature';
    geometry: {
        type: 'Point';
        coordinates: [number, number]; // [longitude, latitude]
    };
    properties: {
        bright_ti4: number; // Brightness temperature of fire pixel
        acq_date: string;
        acq_time: string;
        confidence: string;
    };
};

export type WildfiresResponse = {
    data: {
        type: 'FeatureCollection';
        features: WildfireFeature[];
    };
    error: string | null;
};

// Public NASA FIRMS endpoint for 24h global active fires (NOAA-20 VIIRS)
// Proxied via Vite to avoid CORS blocks from NASA
const FIRMS_URL = '/api/firms/data/active_fire/noaa-20-viirs-c2/csv/J1_VIIRS_C2_Global_24h.csv';

export const fetchLiveWildfires = async (): Promise<WildfiresResponse> => {
    try {
        const response = await fetch(FIRMS_URL);

        if (!response.ok) {
            return {
                data: { type: 'FeatureCollection', features: [] },
                error: `HTTP Error: ${response.status}`
            };
        }

        const csvText = await response.text();
        const lines = csvText.trim().split('\n');

        if (lines.length < 2) {
            return {
                data: { type: 'FeatureCollection', features: [] },
                error: 'No fire data available'
            };
        }

        const features: WildfireFeature[] = [];

        // Skip header at index 0
        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',');
            if (cols.length < 13) continue;

            // NASA FIRMS CSV Columns:
            // 0: latitude, 1: longitude, 2: bright_ti4, 3: scan, 4: track, 
            // 5: acq_date, 6: acq_time, 7: satellite, 8: confidence ...
            const lat = parseFloat(cols[0]);
            const lng = parseFloat(cols[1]);
            const bright_ti4 = parseFloat(cols[2]);

            if (isNaN(lat) || isNaN(lng) || isNaN(bright_ti4)) continue;

            features.push({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [lng, lat]
                },
                properties: {
                    bright_ti4,
                    acq_date: cols[5],
                    acq_time: cols[6],
                    confidence: cols[8]
                }
            });
        }

        return {
            data: {
                type: 'FeatureCollection',
                features
            },
            error: null
        };
    } catch (error) {
        console.error("Error fetching live wildfires:", error);
        return {
            data: { type: 'FeatureCollection', features: [] },
            error: error instanceof Error ? error.message : "Unknown fetch error"
        };
    }
};
