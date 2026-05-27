/**
 * Building Footprint Module
 * Uses OpenStreetMap building data to calculate property size
 * Falls back to estimations if exact data unavailable
 */

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const FOOTPRINT_CACHE_KEY = "roof_calc_footprint_cache";

// Get cache
const getFootprintCache = () => {
    try {
        const cache = localStorage.getItem(FOOTPRINT_CACHE_KEY);
        return cache ? JSON.parse(cache) : {};
    } catch {
        return {};
    }
};

// Save to cache
const setFootprintCache = (key, data) => {
    try {
        const cache = getFootprintCache();
        cache[key] = {
            data,
            timestamp: Date.now()
        };
        localStorage.setItem(FOOTPRINT_CACHE_KEY, JSON.stringify(cache));
    } catch {
        // Cache full - silent fail
    }
};

/**
 * Get building footprint from OpenStreetMap
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {number} radiusMeters - Search radius (default: 100)
 * @returns {Promise<Object>} Building polygon and area
 */
async function getBuildingFootprint(lat, lon, radiusMeters = 100) {
    const cacheKey = `${lat.toFixed(6)}_${lon.toFixed(6)}`;
    const cache = getFootprintCache();

    // Check cache (7 days TTL)
    if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < 7 * 24 * 60 * 60 * 1000) {
        return cache[cacheKey].data;
    }

    try {
        // Query OpenStreetMap for buildings
        const bbox = calculateBbox(lat, lon, radiusMeters);
        const query = `
            [out:json];
            (
                way["building"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
                relation["building"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
            );
            out geom;
        `;

        const response = await fetch(OVERPASS_URL, {
            method: "POST",
            body: query
        });

        if (!response.ok) {
            throw new Error(`Overpass API error: ${response.status}`);
        }

        const data = await response.json();

        // Find closest building
        const building = findClosestBuilding(data.elements, lat, lon);

        if (building) {
            const polygon = extractPolygon(building);
            const areaSqFt = polygonAreaToSqFt(polygon);
            
            const result = {
                source: "osm",
                polygon,
                areaSqFt,
                confidence: 0.95,
                building: building.tags || {}
            };

            setFootprintCache(cacheKey, result);
            return result;
        } else {
            // Fallback: estimate based on typical lot size
            return estimateFootprint(lat, lon);
        }

    } catch (error) {
        console.warn("OSM footprint lookup failed, using estimation:", error);
        return estimateFootprint(lat, lon);
    }
}

/**
 * Calculate bounding box
 * @private
 */
function calculateBbox(lat, lon, radiusMeters) {
    const degreesPerMeter = 1 / 111000;
    const dLat = radiusMeters * degreesPerMeter;
    const dLon = radiusMeters * degreesPerMeter / Math.cos(lat * Math.PI / 180);

    return {
        north: lat + dLat,
        south: lat - dLat,
        east: lon + dLon,
        west: lon - dLon
    };
}

/**
 * Find closest building to coordinates
 * @private
 */
function findClosestBuilding(elements, targetLat, targetLon) {
    let closest = null;
    let minDistance = Infinity;

    elements.forEach(el => {
        if (!el.geometry) return;

        // Calculate centroid of polygon
        const centroid = calculateCentroid(el.geometry);
        if (!centroid) return;

        const distance = Math.hypot(
            centroid.lat - targetLat,
            centroid.lon - targetLon
        );

        if (distance < minDistance) {
            minDistance = distance;
            closest = el;
        }
    });

    return closest;
}

/**
 * Extract polygon coordinates from OSM element
 * @private
 */
function extractPolygon(element) {
    if (!element.geometry) return null;

    return element.geometry.map(coord => [coord.lon, coord.lat]);
}

/**
 * Calculate centroid of polygon
 * @private
 */
function calculateCentroid(geometry) {
    if (!geometry || geometry.length === 0) return null;

    let sumLat = 0, sumLon = 0;
    geometry.forEach(coord => {
        sumLat += coord.lat;
        sumLon += coord.lon;
    });

    return {
        lat: sumLat / geometry.length,
        lon: sumLon / geometry.length
    };
}

/**
 * Calculate polygon area in square feet using Shoelace formula
 * @param {Array} polygon - [[lon, lat], ...]
 * @returns {number} Area in square feet
 */
function polygonAreaToSqFt(polygon) {
    if (!polygon || polygon.length < 3) return 0;

    // Convert to mercator projection for accurate area
    let area = 0;
    for (let i = 0; i < polygon.length - 1; i++) {
        const [lon1, lat1] = polygon[i];
        const [lon2, lat2] = polygon[i + 1];

        area += (lon2 - lon1) * (lat2 + lat1);
    }

    area = Math.abs(area) / 2;

    // Convert from degrees² to square feet
    // 1 degree latitude ≈ 364,000 feet
    // 1 degree longitude ≈ 288,000 feet at 40° latitude
    const metersPerDegreeLat = 111000;
    const metersPerDegreeLon = 111000 * Math.cos(polygon[0][1] * Math.PI / 180);
    const sqMeters = area * metersPerDegreeLat * metersPerDegreeLon;
    const sqFeet = sqMeters * 10.764;

    return Math.round(sqFeet);
}

/**
 * Estimate footprint when OSM data unavailable
 * Based on typical residential lot sizes in California
 * @private
 */
function estimateFootprint(lat, lon) {
    // Bay Area typical lot sizes: 5,000 - 10,000 sq ft
    // Building coverage: typically 30-40% of lot
    const estimatedLotSqFt = 7500;
    const buildingCoverageRatio = 0.35;
    const estimatedFootprintSqFt = estimatedLotSqFt * buildingCoverageRatio;

    return {
        source: "estimate",
        areaSqFt: Math.round(estimatedFootprintSqFt),
        confidence: 0.50,
        note: "Estimated from typical regional lot size (OSM data unavailable)"
    };
}

/**
 * Get property dimensions from multiple sources
 * @param {number} lat, lon - Coordinates
 * @returns {Promise<Object>} Property size info
 */
async function getPropertyDimensions(lat, lon) {
    try {
        const footprint = await getBuildingFootprint(lat, lon);
        
        return {
            footprintSqFt: footprint.areaSqFt,
            source: footprint.source,
            confidence: footprint.confidence
        };
    } catch (error) {
        console.error("Property dimensions error:", error);
        return {
            footprintSqFt: 2500,
            source: "estimate",
            confidence: 0.3,
            error: error.message
        };
    }
}

/**
 * Get lot size estimate
 * @param {number} footprintSqFt - Building footprint
 * @returns {number} Estimated lot size in sq ft
 */
function estimateLotSize(footprintSqFt) {
    // Typical building coverage: 30-40%
    const avgCoverage = 0.35;
    return Math.round(footprintSqFt / avgCoverage);
}
