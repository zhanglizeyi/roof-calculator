/**
 * Roof Pitch Detection Module
 * Detects roof pitch (slope) from satellite imagery
 * Uses edge detection and angle analysis
 */

/**
 * Standard roof pitch ratios and their multipliers
 * Format: "rise:run" → area multiplier
 */
const STANDARD_PITCHES = {
    "0:12": { name: "Flat", multiplier: 1.0, angle: 0 },
    "2:12": { name: "Low slope", multiplier: 1.02, angle: 9.5 },
    "3:12": { name: "Low-moderate", multiplier: 1.033, angle: 14.0 },
    "4:12": { name: "Standard (most common)", multiplier: 1.054, angle: 18.4 },
    "5:12": { name: "Moderate", multiplier: 1.077, angle: 22.6 },
    "6:12": { name: "Steep", multiplier: 1.118, angle: 26.6 },
    "8:12": { name: "Very steep", multiplier: 1.202, angle: 33.7 },
    "10:12": { name: "Steep cathedral", multiplier: 1.307, angle: 40.0 },
    "12:12": { name: "45° pitch", multiplier: 1.414, angle: 45.0 }
};

/**
 * Detect roof pitch from satellite image
 * Analyzes roofline edges and calculates slope angles
 * @param {HTMLCanvasElement|HTMLImageElement} image - Satellite image
 * @returns {Object} Detected pitch info
 */
function detectRoofPitch(image) {
    try {
        // Convert image to canvas if needed
        let canvas = image;
        if (image instanceof HTMLImageElement) {
            canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = image.width;
            canvas.height = image.height;
            ctx.drawImage(image, 0, 0);
        }

        // Edge detection
        const edges = detectEdges(canvas);

        // Extract roof lines
        const roofLines = extractRoofLines(edges);

        if (roofLines.length === 0) {
            // Fallback: assume standard 4:12 pitch (most common residential)
            return {
                ratio: "4:12",
                name: STANDARD_PITCHES["4:12"].name,
                multiplier: STANDARD_PITCHES["4:12"].multiplier,
                angle: STANDARD_PITCHES["4:12"].angle,
                confidence: 0.40,
                method: "fallback"
            };
        }

        // Calculate slope angles of detected lines
        const angles = roofLines.map(line => calculateLineAngle(line));

        // Match to standard pitch
        const bestMatch = matchToStandardPitch(angles);

        return bestMatch;

    } catch (error) {
        console.warn("Pitch detection failed:", error);
        return {
            ratio: "4:12",
            multiplier: 1.054,
            confidence: 0.40,
            method: "error"
        };
    }
}

/**
 * Edge detection using Sobel operator
 * @private
 */
function detectEdges(canvas) {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    // Convert to grayscale
    const gray = new Uint8ClampedArray(canvas.width * canvas.height);
    for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        gray[i / 4] = 0.299 * r + 0.587 * g + 0.114 * b;
    }

    // Sobel edge detection
    const sobelX = new Float32Array(canvas.width * canvas.height);
    const sobelY = new Float32Array(canvas.width * canvas.height);

    for (let y = 1; y < canvas.height - 1; y++) {
        for (let x = 1; x < canvas.width - 1; x++) {
            const idx = y * canvas.width + x;
            const gx = 
                -gray[(y-1)*canvas.width+(x-1)] - 2*gray[y*canvas.width+(x-1)] - gray[(y+1)*canvas.width+(x-1)] +
                 gray[(y-1)*canvas.width+(x+1)] + 2*gray[y*canvas.width+(x+1)] + gray[(y+1)*canvas.width+(x+1)];
            
            const gy = 
                -gray[(y-1)*canvas.width+(x-1)] - 2*gray[(y-1)*canvas.width+x] - gray[(y-1)*canvas.width+(x+1)] +
                 gray[(y+1)*canvas.width+(x-1)] + 2*gray[(y+1)*canvas.width+x] + gray[(y+1)*canvas.width+(x+1)];
            
            sobelX[idx] = gx;
            sobelY[idx] = gy;
        }
    }

    // Calculate edge magnitude
    const edges = new Uint8ClampedArray(canvas.width * canvas.height);
    for (let i = 0; i < edges.length; i++) {
        edges[i] = Math.hypot(sobelX[i], sobelY[i]);
    }

    return { data: edges, width: canvas.width, height: canvas.height, sobelX, sobelY };
}

/**
 * Extract lines representing roof edges
 * @private
 */
function extractRoofLines(edges) {
    const { data, width, height, sobelX, sobelY } = edges;
    const lines = [];
    const threshold = 100; // Edge magnitude threshold

    // Simple line detection: find significant edges and group them
    for (let y = 0; y < height - 1; y++) {
        for (let x = 0; x < width - 1; x++) {
            const idx = y * width + x;
            if (data[idx] > threshold) {
                const angle = Math.atan2(sobelY[idx], sobelX[idx]);
                lines.push({
                    x,
                    y,
                    angle,
                    magnitude: data[idx]
                });
            }
        }
    }

    // Cluster similar angles
    return clusterLines(lines);
}

/**
 * Cluster lines by angle to identify roof edges
 * @private
 */
function clusterLines(lines) {
    if (lines.length === 0) return [];

    const clusters = [];
    const used = new Set();

    lines.forEach((line, i) => {
        if (used.has(i)) return;

        const cluster = [line];
        used.add(i);

        lines.forEach((other, j) => {
            if (used.has(j)) return;
            
            // Group lines with similar angles
            const angleDiff = Math.abs(line.angle - other.angle);
            if (angleDiff < 0.2 || Math.abs(angleDiff - Math.PI) < 0.2) {
                cluster.push(other);
                used.add(j);
            }
        });

        if (cluster.length > 5) {
            clusters.push(cluster);
        }
    });

    return clusters;
}

/**
 * Calculate angle of a line (in degrees)
 * @private
 */
function calculateLineAngle(cluster) {
    // Average angle of cluster
    const avgAngle = cluster.reduce((sum, line) => sum + line.angle, 0) / cluster.length;
    return Math.abs(avgAngle * 180 / Math.PI);
}

/**
 * Match detected angles to standard roof pitches
 * @private
 */
function matchToStandardPitch(angles) {
    if (angles.length === 0) {
        return {
            ratio: "4:12",
            multiplier: 1.054,
            confidence: 0.40,
            method: "default"
        };
    }

    let bestMatch = null;
    let bestScore = Infinity;

    Object.entries(STANDARD_PITCHES).forEach(([ratio, data]) => {
        const angleTarget = data.angle;
        
        // Find closest angle match
        const error = angles.reduce((sum, angle) => {
            return sum + Math.abs(angle - angleTarget);
        }, 0) / angles.length;

        if (error < bestScore) {
            bestScore = error;
            bestMatch = { ratio, ...data };
        }
    });

    // Confidence based on error
    const confidence = Math.max(0.5, 1 - (bestScore / 45));

    return {
        ...bestMatch,
        confidence: Math.round(confidence * 100) / 100,
        method: "detected",
        error: Math.round(bestScore)
    };
}

/**
 * Calculate roof area from footprint and pitch
 * @param {number} footprintSqFt - Building footprint in sq ft
 * @param {string} pitchRatio - Pitch ratio like "4:12"
 * @returns {number} Roof area in sq ft
 */
function calculateRoofArea(footprintSqFt, pitchRatio) {
    const pitch = STANDARD_PITCHES[pitchRatio];
    if (!pitch) {
        // Fallback to 4:12
        return Math.round(footprintSqFt * 1.054);
    }
    return Math.round(footprintSqFt * pitch.multiplier);
}

/**
 * Get all available pitch options
 * @returns {Object} Standard pitches
 */
function getAvailablePitches() {
    return STANDARD_PITCHES;
}

/**
 * Calculate pitch multiplier from rise:run
 * @param {number} rise - Rise value
 * @param {number} run - Run value (usually 12)
 * @returns {number} Area multiplier
 */
function calculatePitchMultiplier(rise, run = 12) {
    // Multiplier = √(rise² + run²) / run
    return Math.sqrt(rise * rise + run * run) / run;
}
