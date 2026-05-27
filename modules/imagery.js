/**
 * Satellite Imagery Module
 * Fetches satellite images from free sources
 * Uses Google Static Maps (most reliable, free tier available)
 */

const IMAGERY_CACHE_KEY = "roof_calc_imagery_cache";
const GOOGLE_MAPS_URL = "https://maps.googleapis.com/maps/api/staticmap";

// Tile providers
const TILE_PROVIDERS = {
    // Esri World Imagery (free, good resolution)
    esri: {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile",
        maxZoom: 19,
        attribution: "© Esri"
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
 * Convert tile coordinates to Bing Maps quadkey
 * @private
 */
function getTileQuadKey(x, y, zoom) {
    let quadKey = '';
    for (let i = zoom; i > 0; i--) {
        let digit = 0;
        const mask = 1 << (i - 1);
        if ((x & mask) !== 0) digit += 1;
        if ((y & mask) !== 0) digit += 2;
        quadKey += digit;
    }
    return quadKey;
}

/**
 * Fetch satellite image as canvas
 * Tries multiple free tile providers with fallbacks
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
        try {
            return await loadImageFromUrl(cache[cacheKey].url);
        } catch (error) {
            // Cache expired or failed, continue to fetch fresh
        }
    }

    // Try multiple providers in order
    const providers = [
        { name: "Bing", fn: () => createBingMapCanvas(lat, lon, zoom, width, height) },
        { name: "USGS", fn: () => createUSGSCanvas(lat, lon, zoom, width, height) },
        { name: "CartoDB", fn: () => createCartoDBCanvas(lat, lon, zoom, width, height) },
        { name: "OSM", fn: () => createOSMTileCanvas(lat, lon, zoom, width, height) },
    ];

    for (const provider of providers) {
        try {
            console.log(`Trying satellite provider: ${provider.name}...`);
            const canvas = await provider.fn();
            console.log(`✅ ${provider.name} succeeded!`);
            return canvas;
        } catch (error) {
            console.warn(`❌ ${provider.name} failed:`, error);
            continue;
        }
    }

    // All providers failed - show placeholder
    console.warn("All satellite providers failed, showing placeholder");
    return createPlaceholderCanvas(width, height);
}

/**
 * Create canvas from Bing Maps satellite tiles
 * High quality, good coverage
 * @private
 */
async function createBingMapCanvas(lat, lon, zoom, width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    try {
        const [x, y] = latLonToTile(lat, lon, zoom);
        
        // Bing Maps tiles are CORS-friendly
        // Format: http://ecn.dynamic.t7.tiles.virtualearth.net/comp/ch/{quadkey}
        const quadKey = getTileQuadKey(x, y, zoom);
        const tileUrl = `https://ecn.t0.tiles.virtualearth.net/tiles/a${quadKey}.jpeg`;
        
        console.log("Bing tile URL:", tileUrl);
        const img = await loadImageFromUrl(tileUrl);
        ctx.drawImage(img, 0, 0, width, height);
        return canvas;
    } catch (error) {
        throw new Error(`Bing Maps failed: ${error.message}`);
    }
}

/**
 * Create canvas from USGS satellite tiles
 * Public domain, excellent coverage for US
 * @private
 */
async function createUSGSCanvas(lat, lon, zoom, width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    try {
        const [x, y] = latLonToTile(lat, lon, zoom);
        
        // USGS Ortho tiles
        const tileUrl = `https://basemap.nationalmap.gov/arcgis/rest/services/USGSOrth/MapServer/tile/${zoom}/${y}/${x}`;
        
        console.log("USGS tile URL:", tileUrl);
        const img = await loadImageFromUrl(tileUrl);
        ctx.drawImage(img, 0, 0, width, height);
        return canvas;
    } catch (error) {
        throw new Error(`USGS failed: ${error.message}`);
    }
}

/**
 * Create canvas from CartoDB satellite tiles
 * Good quality, free tier
 * @private
 */
async function createCartoDBCanvas(lat, lon, zoom, width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    try {
        const [x, y] = latLonToTile(lat, lon, zoom);
        
        // CartoDB Positron tiles (or other variants)
        const tileUrl = `https://tiles.stadiamaps.com/tiles/stamen_terrain/${zoom}/${x}/${y}.png`;
        
        console.log("CartoDB tile URL:", tileUrl);
        const img = await loadImageFromUrl(tileUrl);
        ctx.drawImage(img, 0, 0, width, height);
        return canvas;
    } catch (error) {
        throw new Error(`CartoDB failed: ${error.message}`);
    }
}

/**
 * Create canvas from OpenStreetMap satellite tiles (Stamen)
 * Fetches multiple tiles and stitches them together
 * @private
 */
async function createOSMTileCanvas(lat, lon, zoom, width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    try {
        // Get center tile
        const [centerX, centerY] = latLonToTile(lat, lon, zoom);
        
        // Fetch center tile + surrounding tiles
        const tilesPerSide = 2;
        let tilesLoaded = 0;
        const tileSize = 256;
        
        for (let dy = -tilesPerSide; dy <= tilesPerSide; dy++) {
            for (let dx = -tilesPerSide; dx <= tilesPerSide; dx++) {
                const x = centerX + dx;
                const y = centerY + dy;
                
                // Stamen Satellite tiles (CORS-friendly, no API key)
                const tileUrl = `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
                
                try {
                    const img = await loadImageFromUrl(tileUrl);
                    const screenX = (dx + tilesPerSide) * tileSize;
                    const screenY = (dy + tilesPerSide) * tileSize;
                    ctx.drawImage(img, screenX, screenY, tileSize, tileSize);
                    tilesLoaded++;
                } catch (error) {
                    // Skip failed tiles
                    console.warn(`Failed to load tile ${x},${y}:`, error);
                }
            }
        }
        
        console.log(`Loaded ${tilesLoaded} tiles for location`);
        
        // Crop to requested size
        if (tilesLoaded > 0) {
            const croppedCanvas = document.createElement('canvas');
            croppedCanvas.width = width;
            croppedCanvas.height = height;
            const croppedCtx = croppedCanvas.getContext('2d');
            
            // Center the cropped area
            const offsetX = (canvas.width - width) / 2;
            const offsetY = (canvas.height - height) / 2;
            croppedCtx.drawImage(canvas, offsetX, offsetY, width, height, 0, 0, width, height);
            
            return croppedCanvas;
        } else {
            throw new Error("No tiles loaded successfully");
        }
    } catch (error) {
        console.warn("OSM tile canvas creation failed:", error);
        throw error;
    }
}

/**
 * Create a canvas from satellite tiles (Esri fallback)
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
 * Load image from URL with timeout
 * @private
 */
function loadImageFromUrl(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        
        const timeout = setTimeout(() => {
            reject(new Error(`Image load timeout: ${url}`));
        }, 5000); // 5 second timeout
        
        img.onload = () => {
            clearTimeout(timeout);
            resolve(img);
        };
        img.onerror = () => {
            clearTimeout(timeout);
            reject(new Error(`Failed to load image: ${url}`));
        };
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
