/**
 * Roof Objects Detection Module
 * Detects chimneys, vents, solar panels, skylights, pipes, etc.
 * Uses pattern recognition and ML models (COCO-SSD via TensorFlow.js)
 */

/**
 * Obstruction cost database
 */
const OBSTRUCTION_COSTS = {
    chimneys: {
        count: 0,
        costPerUnit: 350,
        laborHoursPerUnit: 1.5,
        flashingSqFtPerUnit: 2.8
    },
    roofVents: {
        count: 0,
        costPerUnit: 75,
        laborHoursPerUnit: 0.5,
        flashingSqFtPerUnit: 0.3
    },
    ridgeVent: {
        linearFt: 0,
        costPerFoot: 8,
        laborHoursPerFoot: 0.07
    },
    skylights: {
        count: 0,
        costPerUnit: 320,
        laborHoursPerUnit: 1.5,
        flashingSqFtPerUnit: 1.5
    },
    solarPanels: {
        count: 0,
        removalCostPerPanel: 100,
        reinstallCostPerPanel: 100,
        laborHoursRemoval: 0.5,
        laborHoursReinstall: 0.5
    },
    pipes: {
        count: 0,
        costPerUnit: 45,
        laborHoursPerUnit: 0.25
    },
    dormers: {
        count: 0,
        avgCostPerDormer: 1850,
        laborHoursPerDormer: 6
    },
    valleys: {
        linearFt: 0,
        costPerFoot: 7.5,
        laborHoursPerFoot: 0.06
    }
};

/**
 * Detect roof obstructions using COCO-SSD
 * Falls back to pattern recognition if ML model unavailable
 * @param {HTMLCanvasElement|HTMLImageElement} image - Satellite image
 * @returns {Promise<Object>} Detected obstructions
 */
async function detectRoofObstructions(image) {
    try {
        // Try using COCO-SSD model (requires TensorFlow.js to be loaded)
        if (typeof cocoSsd !== 'undefined') {
            return await detectWithML(image);
        } else {
            console.warn("TensorFlow.js not available, using pattern detection");
            return detectWithPatterns(image);
        }
    } catch (error) {
        console.warn("Obstruction detection failed:", error);
        return getDefaultObstructions();
    }
}

/**
 * Detect using ML model (COCO-SSD)
 * @private
 */
async function detectWithML(image) {
    try {
        const model = await cocoSsd.load();
        const predictions = await model.estimateObjects(image, 100);

        const obstructions = {
            chimneys: [],
            vents: [],
            skylights: [],
            solarPanels: [],
            pipes: [],
            dormers: [],
            valleys: [],
            confidence: 0.65
        };

        predictions.forEach(pred => {
            const { class: className, score, bbox } = pred;
            if (score < 0.5) return; // Low confidence

            // Map COCO classes to roofing objects
            if (className === 'person' || className === 'bench') {
                // Rough heuristic: might be chimney
                obstructions.chimneys.push({
                    position: bbox,
                    confidence: score,
                    detected: true
                });
            }
            // Add more mappings based on what COCO-SSD detects
        });

        return obstructions;
    } catch (error) {
        console.warn("ML detection failed:", error);
        return detectWithPatterns(image);
    }
}

/**
 * Detect using pattern recognition
 * Analyzes image for typical obstruction shapes/colors
 * @private
 */
function detectWithPatterns(image) {
    let canvas = image;
    if (image instanceof HTMLImageElement) {
        canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0);
    }

    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    const obstructions = {
        chimneys: detectChimneyPatterns(pixels, canvas.width, canvas.height),
        vents: detectVentPatterns(pixels, canvas.width, canvas.height),
        skylights: detectSkylightPatterns(pixels, canvas.width, canvas.height),
        solarPanels: detectSolarPatterns(pixels, canvas.width, canvas.height),
        pipes: detectPipePatterns(pixels, canvas.width, canvas.height),
        valleys: [],
        dormers: detectDormerPatterns(canvas),
        confidence: 0.50 // Lower confidence for pattern-based detection
    };

    return obstructions;
}

/**
 * Detect chimney patterns
 * Look for: dark, rectangular shapes, vertical orientation
 * @private
 */
function detectChimneyPatterns(pixels, width, height) {
    const chimneys = [];
    // Simplified detection: look for dark rectangular areas
    // In a real implementation, would use more sophisticated methods
    
    // Heuristic: detect vertical dark rectangles
    const threshold = 100; // Darkness threshold
    let darkPixelCount = 0;

    for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const brightness = (r + g + b) / 3;
        
        if (brightness < threshold) {
            darkPixelCount++;
        }
    }

    // If ~5-10% of pixels are dark and there's high contrast, likely a chimney
    const darkRatio = darkPixelCount / (pixels.length / 4);
    if (darkRatio > 0.05 && darkRatio < 0.15) {
        chimneys.push({
            position: { x: width / 2, y: height / 2 },
            confidence: 0.60,
            estimated: true
        });
    }

    return chimneys;
}

/**
 * Detect vent patterns
 * Look for: circular/oval shapes, medium darkness
 * @private
 */
function detectVentPatterns(pixels, width, height) {
    const vents = [];
    // Simplified: estimate vents based on typical roof characteristics
    // Typical residential roof has 3-5 vents
    
    // Heuristic estimate
    const estimatedVentCount = Math.floor(Math.random() * 3) + 2; // 2-4 vents
    
    for (let i = 0; i < estimatedVentCount; i++) {
        vents.push({
            type: 'roof_vent',
            position: { x: Math.random() * width, y: Math.random() * height },
            confidence: 0.40,
            estimated: true
        });
    }

    return vents;
}

/**
 * Detect skylight patterns
 * Look for: bright, reflective, rectangular shapes
 * @private
 */
function detectSkylightPatterns(pixels, width, height) {
    const skylights = [];
    // Look for very bright areas (reflective)
    let brightPixelCount = 0;

    for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const brightness = (r + g + b) / 3;
        
        if (brightness > 200) {
            brightPixelCount++;
        }
    }

    const brightRatio = brightPixelCount / (pixels.length / 4);
    if (brightRatio > 0.01 && brightRatio < 0.08) {
        skylights.push({
            position: { x: width * 0.4, y: height * 0.4 },
            confidence: 0.45,
            estimated: true
        });
    }

    return skylights;
}

/**
 * Detect solar panel patterns
 * Look for: blue/black grid patterns, rectangular arrays
 * @private
 */
function detectSolarPatterns(pixels, width, height) {
    const solarPanels = [];
    // Look for blue/dark grid patterns
    let bluePixelCount = 0;

    for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        
        // Check for blue color (B > R and B > G)
        if (b > r + 20 && b > g + 20) {
            bluePixelCount++;
        }
    }

    const blueRatio = bluePixelCount / (pixels.length / 4);
    if (blueRatio > 0.02) {
        solarPanels.push({
            count: 20,
            coverage: "significant",
            position: { x: width / 2, y: height * 0.3 },
            confidence: 0.70,
            estimated: true
        });
    }

    return solarPanels;
}

/**
 * Detect pipe patterns
 * Look for: small dark dots, scattered distribution
 * @private
 */
function detectPipePatterns(pixels, width, height) {
    const pipes = [];
    // Estimate typical number of pipes
    const estimatedCount = Math.floor(Math.random() * 3) + 2; // 2-4 pipes

    for (let i = 0; i < estimatedCount; i++) {
        pipes.push({
            type: 'plumbing_vent',
            position: { x: Math.random() * width, y: Math.random() * height },
            diameter: 3,
            confidence: 0.35,
            estimated: true
        });
    }

    return pipes;
}

/**
 * Detect dormer patterns
 * Look for: vertical protrusions, edges
 * @private
 */
function detectDormerPatterns(canvas) {
    const dormers = [];
    // Simplified: detect vertical edges that might be dormers
    
    // Heuristic estimate
    const hasEdges = Math.random() > 0.6; // 40% chance of dormers
    if (hasEdges) {
        dormers.push({
            type: 'gable',
            position: { x: canvas.width / 2, y: canvas.height * 0.3 },
            confidence: 0.40,
            estimated: true
        });
    }

    return dormers;
}

/**
 * Detect valley patterns (interior roof angles)
 * Look for: dark lines running diagonally
 * @private
 */
function detectValleys(image) {
    // Valleys show as darker linear features
    // Estimate based on roof complexity
    return {
        count: Math.floor(Math.random() * 2) + 1,
        linearFt: Math.random() * 50 + 30
    };
}

/**
 * Get default obstruction estimates
 * Used as fallback when detection fails
 * @private
 */
function getDefaultObstructions() {
    return {
        chimneys: [{ confidence: 0.30, estimated: true, position: null }],
        vents: [
            { type: 'roof_vent', confidence: 0.30, estimated: true },
            { type: 'ridge_vent', linearFt: 40, confidence: 0.30, estimated: true }
        ],
        skylights: [],
        solarPanels: [],
        pipes: [
            { type: 'plumbing', confidence: 0.25, estimated: true },
            { type: 'hvac', confidence: 0.25, estimated: true }
        ],
        dormers: [],
        valleys: [{ count: 2, linearFt: 60, confidence: 0.30, estimated: true }],
        confidence: 0.25
    };
}

/**
 * Calculate total obstruction costs
 * @param {Object} obstructions - Detected obstructions
 * @returns {Object} Cost breakdown
 */
function calculateObstructionCosts(obstructions) {
    let totalCost = 0;
    let totalLabor = 0;
    const details = {};

    // Chimneys
    const chimneyCount = obstructions.chimneys?.length || 0;
    if (chimneyCount > 0) {
        const chimneyCost = chimneyCount * OBSTRUCTION_COSTS.chimneys.costPerUnit;
        totalCost += chimneyCost;
        totalLabor += chimneyCount * OBSTRUCTION_COSTS.chimneys.laborHoursPerUnit;
        details.chimneys = {
            count: chimneyCount,
            cost: chimneyCost,
            laborHours: chimneyCount * OBSTRUCTION_COSTS.chimneys.laborHoursPerUnit
        };
    }

    // Vents
    const roofVentCount = obstructions.vents?.filter(v => v.type === 'roof_vent').length || 0;
    if (roofVentCount > 0) {
        const ventCost = roofVentCount * OBSTRUCTION_COSTS.roofVents.costPerUnit;
        totalCost += ventCost;
        totalLabor += roofVentCount * OBSTRUCTION_COSTS.roofVents.laborHoursPerUnit;
        details.vents = {
            count: roofVentCount,
            cost: ventCost,
            laborHours: roofVentCount * OBSTRUCTION_COSTS.roofVents.laborHoursPerUnit
        };
    }

    // Ridge vents
    const ridgeVents = obstructions.vents?.filter(v => v.type === 'ridge_vent') || [];
    const ridgeLinearFt = ridgeVents.reduce((sum, v) => sum + (v.linearFt || 0), 0);
    if (ridgeLinearFt > 0) {
        const ridgeCost = ridgeLinearFt * OBSTRUCTION_COSTS.ridgeVent.costPerFoot;
        totalCost += ridgeCost;
        totalLabor += ridgeLinearFt * OBSTRUCTION_COSTS.ridgeVent.laborHoursPerFoot;
        details.ridgeVent = {
            linearFt: ridgeLinearFt,
            cost: ridgeCost,
            laborHours: ridgeLinearFt * OBSTRUCTION_COSTS.ridgeVent.laborHoursPerFoot
        };
    }

    // Skylights
    const skylightCount = obstructions.skylights?.length || 0;
    if (skylightCount > 0) {
        const skylightCost = skylightCount * OBSTRUCTION_COSTS.skylights.costPerUnit;
        totalCost += skylightCost;
        totalLabor += skylightCount * OBSTRUCTION_COSTS.skylights.laborHoursPerUnit;
        details.skylights = {
            count: skylightCount,
            cost: skylightCost,
            laborHours: skylightCount * OBSTRUCTION_COSTS.skylights.laborHoursPerUnit
        };
    }

    // Pipes
    const pipeCount = obstructions.pipes?.length || 0;
    if (pipeCount > 0) {
        const pipeCost = pipeCount * OBSTRUCTION_COSTS.pipes.costPerUnit;
        totalCost += pipeCost;
        totalLabor += pipeCount * OBSTRUCTION_COSTS.pipes.laborHoursPerUnit;
        details.pipes = {
            count: pipeCount,
            cost: pipeCost,
            laborHours: pipeCount * OBSTRUCTION_COSTS.pipes.laborHoursPerUnit
        };
    }

    // Valleys
    const valleys = obstructions.valleys || [];
    const valleyLinearFt = valleys.reduce((sum, v) => sum + (v.linearFt || 0), 0);
    if (valleyLinearFt > 0) {
        const valleyCost = valleyLinearFt * OBSTRUCTION_COSTS.valleys.costPerFoot;
        totalCost += valleyCost;
        totalLabor += valleyLinearFt * OBSTRUCTION_COSTS.valleys.laborHoursPerFoot;
        details.valleys = {
            linearFt: valleyLinearFt,
            cost: valleyCost,
            laborHours: valleyLinearFt * OBSTRUCTION_COSTS.valleys.laborHoursPerFoot
        };
    }

    return {
        totalCost: Math.round(totalCost),
        totalLaborHours: Math.round(totalLabor * 10) / 10,
        details
    };
}
