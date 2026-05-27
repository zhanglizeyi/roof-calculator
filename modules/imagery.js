/**
 * Satellite Imagery Module
 * Fetches satellite images from free sources
 * Supports USGS, Google Earth, and OpenStreetMap
 */

const IMAGERY_CACHE_KEY = "roof_calc_imagery_cache";
const MAPBOX_URL = "https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static";
const GOOGLE_MAPS_URL = "https://maps.googleapis.com/maps/api/staticmap";

// Tile providers
const TILE_PROVIDERS = {
    // Esri World Imagery (free, good resolution)
    esri: {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile",
        maxZoom: 19,
        attribution: "© Esri"
    },
    // OpenStreetMap Satellite
    osm: {
        url: "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
        maxZoom: 19,
        attribution: "© OpenStreetMap"
    }
};

// Get image from cache
const getImageryCache = () => {
    try {
        const cache = localStorage.getItem(IMAGERY_CACHE_KEY);
        return cache ? JSON.parse(cache) : {};
    } catch {
        return {};
    }
};

// Save image to cache
const setImageryCache = (key, imageUrl) => {
    try {
        const cache = getImageryCache();
        cache[key] = {
            url: imageUrl,
            timestamp: Date.now()
        };
        localStorage.setItem(IMAGERY_CACHE_KEY, JSON.stringify(cache));
    } catch {
        // Cache full - silent fail
    }
};

/**
 * Get satellite imagery tile URL
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {number} zoom - Zoom level (1-19)
 * @param {string} provider - 'esri' or 'osm'
 * @returns {string} Tile URL
 */
function getSatelliteTile(lat, lon, zoom = 18, provider = 'esri') {
    const [x, y] = latLonToTile(lat, lon, zoom);
    const tileUrl = TILE_PROVIDERS[provider].url
        .replace("{z}", zoom)
        .replace("{x}", x)
        .replace("{y}", y);
    return tileUrl;
}

/**
 * Convert lat/lon to tile coordinates
 * @returns {Array} [x, y] tile coordinates
 */
function latLonToTile(lat, lon, zoom) {
    const n = Math.pow(2, zoom);
    const x = Math.floor((lon + 180) / 360 * n);
    const y = Math.floor(
        (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * n
    );
    return [x, y];
}

/**
 * Fetch satellite image as canvas
 * Uses Esri/USGS free tiles (no API key needed)
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {number} width - Image width (pixels)
 * @param {number} height - Image height (pixels)
 * @returns {Promise<HTMLCanvasElement|HTMLImageElement>} Satellite image
 */
async function getSatelliteImage(lat, lon, width = 512, height = 512, zoom = 18) {
    const cacheKey = `${lat}_${lon}_${zoom}_${width}x${height}`;
    const cache = getImageryCache();

    // Check cache (24 hour TTL)
    if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < 24 * 60 * 60 * 1000) {
        return await loadImageFromUrl(cache[cacheKey].url);
    }

    try {
        // Use Esri World Imagery (free, no API key needed)
        return createTileCanvas(lat, lon, zoom, width, height);
    } catch (error) {
        console.warn("Satellite fetch failed:", error);
        return createPlaceholderCanvas(width, height);
    }
}

/**
 * Create a canvas from satellite tiles
 * Fetches Esri World Imagery tiles (free, no API key)
 * @private
 */
async function createTileCanvas(lat, lon, zoom, width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    try {
        // Fetch Esri tile (free, no API key needed)
        const tileUrl = getSatelliteTile(lat, lon, zoom, 'esri');
        console.log("Fetching satellite tile:", tileUrl);
        
        const img = await loadImageFromUrl(tileUrl);
        ctx.drawImage(img, 0, 0, width, height);
        return canvas;
    } catch (error) {
        console.warn("Could not fetch satellite tile:", error);
        return createPlaceholderCanvas(width, height);
    }
}

/**
 * Create placeholder canvas when imagery unavailable
 * @private
 */
function createPlaceholderCanvas(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    // Create a gradient placeholder
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#87ceeb');
    gradient.addColorStop(1, '#4a90e2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Satellite Imagery', width / 2, height / 2 - 20);
    ctx.font = '14px Arial';
    ctx.fillText('(Not available for this location)', width / 2, height / 2 + 20);
    
    return canvas;
}

/**
 * Get Mapbox Static Images URL
 * @private
 */
function getMapboxStaticUrl(lat, lon, zoom, width, height) {
    // Note: Requires MAPBOX_API_KEY in environment
    // For demo, return a placeholder
    const style = "satellite-v9";
    const center = `${lon},${lat}`;
    const size = `${width}x${height}`;
    
    // This would need an API key in production
    // const token = process.env.MAPBOX_API_KEY;
    // return `${MAPBOX_URL}/${center},${zoom},0/${size}?access_token=${token}`;
    
    // Fallback for testing (returns generic static image)
    return `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${center},${zoom},0/${width}x${height}?access_token=pk.test`;
}

/**
 * Load image from URL
 * @private
 */
function loadImageFromUrl(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
        img.src = url;
    });
}

/**
 * Get image data (pixel array)
 * Allows color analysis, edge detection, etc.
 * @param {HTMLImageElement|HTMLCanvasElement} imageElement
 * @returns {ImageData} Canvas image data
 */
function getImageData(imageElement) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = imageElement.width;
    canvas.height = imageElement.height;
    
    if (imageElement instanceof HTMLCanvasElement) {
        const sourceCtx = imageElement.getContext('2d');
        ctx.putImageData(sourceCtx.getImageData(0, 0, canvas.width, canvas.height), 0, 0);
    } else {
        ctx.drawImage(imageElement, 0, 0);
    }
    
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

/**
 * Canvas helper - draw image to canvas
 * @private
 */
function drawImageToCanvas(image, canvas) {
    const ctx = canvas.getContext('2d');
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);
    return canvas;
}

/**
 * Convert canvas to blob for export
 * @param {HTMLCanvasElement} canvas
 * @returns {Promise<Blob>}
 */
function canvasToBlob(canvas) {
    return new Promise(resolve => {
        canvas.toBlob(resolve, 'image/png');
    });
}

/**
 * Convert canvas to data URL
 * @param {HTMLCanvasElement} canvas
 * @returns {string} Data URL
 */
function canvasToDataUrl(canvas) {
    return canvas.toDataURL('image/png');
}
