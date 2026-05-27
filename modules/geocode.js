/**
 * Geocoding Module
 * Uses OpenStreetMap Nominatim (free, no API key required)
 * Converts address to lat/lon coordinates
 */

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const CACHE_KEY = "roof_calc_geocode_cache";

// Get cached results
const getGeoCache = () => {
    try {
        const cache = localStorage.getItem(CACHE_KEY);
        return cache ? JSON.parse(cache) : {};
    } catch {
        return {};
    }
};

// Save to cache
const setGeoCache = (address, data) => {
    try {
        const cache = getGeoCache();
        cache[address] = {
            data,
            timestamp: Date.now()
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch {
        // Cache full or disabled - silent fail
    }
};

/**
 * Search for addresses and return suggestions
 * @param {string} query - Partial or full address
 * @returns {Promise<Array>} Array of address suggestions
 */
async function geocodeSuggestions(query) {
    if (!query || query.length < 3) return [];

    // Check cache first
    const cache = getGeoCache();
    if (cache[query] && Date.now() - cache[query].timestamp < 24 * 60 * 60 * 1000) {
        return cache[query].data;
    }

    try {
        const params = new URLSearchParams({
            q: query,
            format: "json",
            limit: 10,
            addressdetails: 1,
            "accept-language": "en"
        });

        const response = await fetch(`${NOMINATIM_URL}?${params}`);
        
        if (!response.ok) {
            throw new Error(`Nominatim error: ${response.status}`);
        }

        const results = await response.json();
        
        if (!Array.isArray(results)) return [];

        // Format results for display
        const suggestions = results.map(r => ({
            displayName: r.display_name,
            lat: parseFloat(r.lat),
            lon: parseFloat(r.lon),
            boundingbox: r.boundingbox,
            placeId: r.place_id
        }));

        // Cache results
        setGeoCache(query, suggestions);

        return suggestions;

    } catch (error) {
        console.error("Geocoding error:", error);
        return [];
    }
}

/**
 * Get detailed geocoding for a full address
 * @param {string} address - Full address
 * @returns {Promise<Object>} Detailed location info
 */
async function geocodeAddress(address) {
    const cache = getGeoCache();
    
    if (cache[address] && Date.now() - cache[address].timestamp < 24 * 60 * 60 * 1000) {
        return cache[address].data[0];
    }

    try {
        const params = new URLSearchParams({
            q: address,
            format: "json",
            limit: 1,
            addressdetails: 1,
            extratags: 1,
            "accept-language": "en"
        });

        const response = await fetch(`${NOMINATIM_URL}?${params}`);
        
        if (!response.ok) {
            throw new Error(`Geocoding failed: ${response.status}`);
        }

        const results = await response.json();
        
        if (!results || results.length === 0) {
            throw new Error("Address not found");
        }

        const result = {
            address: results[0].display_name,
            lat: parseFloat(results[0].lat),
            lon: parseFloat(results[0].lon),
            boundingbox: results[0].boundingbox,
            placeId: results[0].place_id,
            addressParts: results[0].address || {},
            importance: parseFloat(results[0].importance)
        };

        // Cache
        setGeoCache(address, [result]);

        return result;

    } catch (error) {
        console.error("Address geocoding error:", error);
        throw error;
    }
}

/**
 * Get bounding box for a location
 * Useful for fetching satellite imagery and building data
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {number} radiusMeters - Search radius in meters (default: 500)
 * @returns {Object} Bounding box {north, south, east, west}
 */
function getBoundingBox(lat, lon, radiusMeters = 500) {
    // Rough approximation: 1 degree ≈ 111 km
    const degreesPerMeter = 1 / 111000;
    const deltaLat = radiusMeters * degreesPerMeter;
    const deltaLon = radiusMeters * degreesPerMeter / Math.cos(lat * Math.PI / 180);

    return {
        north: lat + deltaLat,
        south: lat - deltaLat,
        east: lon + deltaLon,
        west: lon - deltaLon
    };
}

/**
 * Reverse geocoding - get address from coordinates
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<string>} Address
 */
async function reverseGeocode(lat, lon) {
    try {
        const params = new URLSearchParams({
            lat,
            lon,
            format: "json",
            addressdetails: 1,
            "accept-language": "en"
        });

        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?${params}`
        );
        
        if (!response.ok) throw new Error("Reverse geocoding failed");

        const result = await response.json();
        return result.display_name || "Unknown address";

    } catch (error) {
        console.error("Reverse geocoding error:", error);
        return null;
    }
}

/**
 * Calculate distance between two points (Haversine formula)
 * @param {number} lat1, lon1, lat2, lon2 - Coordinates
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
