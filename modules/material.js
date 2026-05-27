/**
 * Roof Material Detection Module
 * Analyzes satellite imagery to identify roofing materials
 * Uses color histogram and texture analysis
 */

const MATERIAL_DATABASE = {
    asphalt: {
        name: "Asphalt Shingles",
        aliases: ["composition", "asphalt shingles", "standard shingles"],
        lifespan: "15-25 years",
        costPerSqft: { min: 3.50, max: 5.50, avg: 4.50 },
        colors: ["dark gray", "black", "charcoal"],
        characteristics: {
            darkness: { min: 0.3, max: 0.7 },
            saturation: { min: 0, max: 0.2 },
            reflectance: { min: 0, max: 0.3 }
        }
    },
    metal: {
        name: "Metal Roofing",
        aliases: ["steel", "aluminum", "standing seam", "metal"],
        lifespan: "40-70 years",
        costPerSqft: { min: 7.50, max: 12.00, avg: 9.75 },
        colors: ["silver", "gray", "bronze"],
        characteristics: {
            darkness: { min: 0, max: 0.6 },
            saturation: { min: 0, max: 0.1 },
            reflectance: { min: 0.5, max: 1.0 }
        }
    },
    clay: {
        name: "Clay Tile",
        aliases: ["clay", "tile", "terracotta", "spanish tile"],
        lifespan: "50-100 years",
        costPerSqft: { min: 10.00, max: 18.00, avg: 14.00 },
        colors: ["orange", "terracotta", "red", "earth tone"],
        characteristics: {
            darkness: { min: 0.2, max: 0.6 },
            hueOrange: { min: 0.7, max: 1.0 },
            reflectance: { min: 0.2, max: 0.4 }
        }
    },
    concrete: {
        name: "Concrete Tile",
        aliases: ["concrete", "concrete tiles"],
        lifespan: "30-50 years",
        costPerSqft: { min: 6.00, max: 10.00, avg: 8.00 },
        colors: ["gray", "brown", "tan"],
        characteristics: {
            darkness: { min: 0.3, max: 0.7 },
            saturation: { min: 0, max: 0.15 },
            texture: "moderate"
        }
    },
    membrane: {
        name: "Flat Membrane (TPO/EPDM)",
        aliases: ["membrane", "tpo", "epdm", "flat roof", "rubber"],
        lifespan: "20-30 years",
        costPerSqft: { min: 4.50, max: 8.00, avg: 6.25 },
        colors: ["white", "tan", "gray"],
        characteristics: {
            darkness: { min: 0, max: 0.4 },
            saturation: { min: 0, max: 0.1 },
            reflectance: { min: 0.4, max: 1.0 }
        }
    },
    wood: {
        name: "Wood Shingles/Shakes",
        aliases: ["wood", "cedar", "wood shake", "wood shingles"],
        lifespan: "20-40 years",
        costPerSqft: { min: 8.00, max: 15.00, avg: 11.50 },
        colors: ["brown", "gray", "natural"],
        characteristics: {
            darkness: { min: 0.3, max: 0.8 },
            saturation: { min: 0, max: 0.2 },
            texture: "rustic"
        }
    },
    slate: {
        name: "Slate",
        aliases: ["slate", "slate tiles"],
        lifespan: "50-200+ years",
        costPerSqft: { min: 15.00, max: 25.00, avg: 20.00 },
        colors: ["dark gray", "black", "slate gray"],
        characteristics: {
            darkness: { min: 0.5, max: 1.0 },
            saturation: { min: 0, max: 0.1 },
            reflectance: { min: 0.1, max: 0.3 }
        }
    }
};

/**
 * Identify roof material from satellite image
 * @param {HTMLCanvasElement|HTMLImageElement} image - Satellite image
 * @returns {Object} Identified material with confidence
 */
function identifyRoofMaterial(image) {
    try {
        // Convert to canvas if needed
        let canvas = image;
        if (image instanceof HTMLImageElement) {
            canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = image.width;
            canvas.height = image.height;
            ctx.drawImage(image, 0, 0);
        }

        // Extract color features
        const features = extractColorFeatures(canvas);

        // Score against each material
        const scores = scoreAgainstMaterials(features);

        // Get top match
        const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
        const [topMaterial, topScore] = sorted[0];
        const alternatives = sorted.slice(1, 3).map(([mat, score]) => ({
            material: mat,
            confidence: score
        }));

        const material = MATERIAL_DATABASE[topMaterial];

        return {
            primary: topMaterial,
            name: material.name,
            confidence: Math.min(0.99, Math.max(0.30, topScore)),
            costPerSqft: material.costPerSqft,
            lifespan: material.lifespan,
            alternatives: alternatives,
            features: features,
            method: "satellite_analysis"
        };

    } catch (error) {
        console.warn("Material detection failed:", error);
        // Fallback: asphalt is most common
        return {
            primary: "asphalt",
            name: "Asphalt Shingles",
            confidence: 0.40,
            costPerSqft: MATERIAL_DATABASE.asphalt.costPerSqft,
            lifespan: MATERIAL_DATABASE.asphalt.lifespan,
            method: "fallback",
            error: error.message
        };
    }
}

/**
 * Extract color and texture features from image
 * @private
 */
function extractColorFeatures(canvas) {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    const features = {
        colorHistogram: {
            red: [],
            green: [],
            blue: []
        },
        brightness: [],
        saturation: [],
        hue: [],
        reflectance: 0
    };

    // Sample pixels (for performance)
    const sampleRate = 4;
    for (let i = 0; i < pixels.length; i += 4 * sampleRate) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];

        // Brightness
        const brightness = (r + g + b) / 3 / 255;
        features.brightness.push(brightness);

        // Reflectance (simplified)
        const reflectance = Math.max(r, g, b) / 255;
        features.reflectance = Math.max(features.reflectance, reflectance);

        // Saturation and Hue
        const [hue, saturation] = rgbToHsv(r, g, b);
        features.hue.push(hue);
        features.saturation.push(saturation);
    }

    return {
        avgBrightness: features.brightness.reduce((a, b) => a + b, 0) / features.brightness.length,
        avgSaturation: features.saturation.reduce((a, b) => a + b, 0) / features.saturation.length,
        avgReflectance: features.reflectance,
        dominantHue: calculateDominantHue(features.hue),
        isDark: features.brightness.reduce((a, b) => a + b, 0) / features.brightness.length < 0.5,
        isLight: features.brightness.reduce((a, b) => a + b, 0) / features.brightness.length > 0.7
    };
}

/**
 * Convert RGB to HSV
 * Returns [hue (0-1), saturation (0-1), value (0-1)]
 * @private
 */
function rgbToHsv(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    let hue = 0;
    if (delta !== 0) {
        if (max === r) hue = ((g - b) / delta) % 6;
        else if (max === g) hue = (b - r) / delta + 2;
        else hue = (r - g) / delta + 4;
        hue = hue / 6;
    }

    const saturation = max === 0 ? 0 : delta / max;
    const value = max;

    return [hue, saturation, value];
}

/**
 * Calculate dominant hue from array
 * @private
 */
function calculateDominantHue(hueArray) {
    if (hueArray.length === 0) return 0;
    // Simple average (could use better clustering)
    return hueArray.reduce((a, b) => a + b, 0) / hueArray.length;
}

/**
 * Score image features against each material
 * @private
 */
function scoreAgainstMaterials(features) {
    const scores = {};

    Object.entries(MATERIAL_DATABASE).forEach(([materialKey, material]) => {
        let score = 0;

        // Score based on darkness
        if (material.name === "Asphalt Shingles") {
            if (features.isDark && !features.isLight) score += 0.4;
            if (features.avgReflectance < 0.3) score += 0.3;
            if (features.avgSaturation < 0.2) score += 0.3;
        }

        // Score based on reflectance (metal)
        if (material.name === "Metal Roofing") {
            if (features.avgReflectance > 0.6) score += 0.6;
            if (features.avgSaturation < 0.15) score += 0.4;
        }

        // Score based on orange hue (clay)
        if (material.name === "Clay Tile") {
            const hue = features.dominantHue;
            if (hue > 0.05 && hue < 0.15) score += 0.7; // Orange range
            if (features.avgSaturation > 0.4) score += 0.3;
        }

        // Score based on whiteness (membrane)
        if (material.name === "Flat Membrane (TPO/EPDM)") {
            if (features.isLight) score += 0.7;
            if (features.avgReflectance > 0.5) score += 0.3;
        }

        // Score based on darkness and slate characteristics
        if (material.name === "Slate") {
            if (features.isDark && features.avgReflectance < 0.3) score += 0.5;
        }

        // Default score if features don't match strongly
        if (score === 0) score = 0.2;

        scores[materialKey] = Math.min(1.0, score);
    });

    // Normalize scores
    const total = Object.values(scores).reduce((a, b) => a + b, 0);
    Object.keys(scores).forEach(key => {
        scores[key] = scores[key] / total;
    });

    return scores;
}

/**
 * Get material cost estimate
 * @param {string} materialType - Material key
 * @param {number} roofAreaSqFt - Roof area
 * @returns {Object} Cost breakdown
 */
function getMaterialCost(materialType, roofAreaSqFt) {
    const material = MATERIAL_DATABASE[materialType];
    if (!material) return null;

    const costPerSqft = material.costPerSqft.avg;
    const totalMaterialCost = roofAreaSqFt * costPerSqft;

    return {
        material: materialType,
        name: material.name,
        costPerSqft: costPerSqft,
        totalMaterialCost: Math.round(totalMaterialCost),
        costRange: {
            low: Math.round(roofAreaSqFt * material.costPerSqft.min),
            high: Math.round(roofAreaSqFt * material.costPerSqft.max)
        },
        lifespan: material.lifespan
    };
}

/**
 * Get all available materials
 * @returns {Object} Material database
 */
function getAvailableMaterials() {
    return MATERIAL_DATABASE;
}
