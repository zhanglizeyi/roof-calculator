/**
 * Cost Calculation Module
 * Calculates roofing replacement costs based on materials, area, and obstructions
 */

/**
 * Calculate complete roofing cost estimate
 * @param {Object} roofData - All roof analysis data
 * @returns {Object} Detailed cost breakdown
 */
function calculateRoofingCost(roofData) {
    const {
        roofAreaSqFt,
        material,
        pitch,
        obstructions
    } = roofData;

    // Base material cost
    const materialCost = calculateMaterialCost(roofAreaSqFt, material);

    // Obstruction costs
    const obstructionCosts = calculateObstructionCosts(obstructions);

    // Labor costs
    const laborCost = calculateLaborCost(roofAreaSqFt, pitch, obstructions);

    // Additional costs
    const removalCost = calculateRemovalCost(roofAreaSqFt);
    const debrisCost = calculateDebrisCost(roofAreaSqFt);

    // Contingency (10%)
    const subtotal = materialCost + obstructionCosts.totalCost + laborCost.total + removalCost + debrisCost;
    const contingency = Math.round(subtotal * 0.10);

    // Total
    const total = subtotal + contingency;

    return {
        breakdown: {
            material: Math.round(materialCost),
            obstructions: Math.round(obstructionCosts.totalCost),
            labor: Math.round(laborCost.total),
            removal: Math.round(removalCost),
            debris: Math.round(debrisCost),
            contingency: contingency,
            total: total
        },
        perSqFt: Math.round((total / roofAreaSqFt) * 100) / 100,
        laborHours: Math.round(laborCost.hours * 10) / 10,
        crewSize: calculateCrewSize(laborCost.hours),
        timeline: calculateTimeline(laborCost.hours),
        details: {
            material: materialCost,
            obstructions: obstructionCosts,
            labor: laborCost
        }
    };
}

/**
 * Calculate material cost
 * @private
 */
function calculateMaterialCost(roofAreaSqFt, material) {
    const costPerSqFt = material.costPerSqft.avg;
    
    // Add waste factor (10-15%)
    const wasteFactor = 1.12;
    
    return roofAreaSqFt * costPerSqFt * wasteFactor;
}

/**
 * Calculate labor cost
 * @private
 */
function calculateLaborCost(roofAreaSqFt, pitch, obstructions) {
    // Base labor: ~30 minutes per 100 sq ft
    let baseHours = roofAreaSqFt / 100 * 0.5;

    // Pitch complexity multiplier
    const pitchMultiplier = getPitchComplexityMultiplier(pitch.ratio);
    baseHours *= pitchMultiplier;

    // Obstruction complexity
    const obstructionHours = calculateObstructionCosts(obstructions).totalLaborHours;

    // Total hours
    const totalHours = baseHours + obstructionHours;

    // Labor rate: $100-150/hour (use $125 average)
    const laborRate = 125;
    const totalCost = totalHours * laborRate;

    return {
        hours: totalHours,
        rate: laborRate,
        total: totalCost
    };
}

/**
 * Get pitch complexity multiplier
 * @private
 */
function getPitchComplexityMultiplier(pitchRatio) {
    const multipliers = {
        "0:12": 0.85,  // Flat is fastest
        "2:12": 0.95,
        "4:12": 1.00,  // Standard baseline
        "6:12": 1.10,
        "8:12": 1.20,
        "12:12": 1.40   // Steepest, slowest
    };

    return multipliers[pitchRatio] || 1.0;
}

/**
 * Calculate removal cost
 * (removing old roofing)
 * @private
 */
function calculateRemovalCost(roofAreaSqFt) {
    // ~$1-2 per sq ft
    const removalRate = 1.50;
    return roofAreaSqFt * removalRate;
}

/**
 * Calculate debris disposal cost
 * @private
 */
function calculateDebrisCost(roofAreaSqFt) {
    // ~$0.50 per sq ft
    const debrisRate = 0.50;
    return roofAreaSqFt * debrisRate;
}

/**
 * Calculate recommended crew size
 * @private
 */
function calculateCrewSize(laborHours) {
    // Standard crew works ~40 hours/week
    // Typical roofing crew: 2-4 people
    if (laborHours < 20) return 2;
    if (laborHours < 40) return 2;
    if (laborHours < 80) return 3;
    return 4;
}

/**
 * Calculate project timeline
 * @private
 */
function calculateTimeline(laborHours) {
    // Typical crew works 8 hours/day
    const crewSize = calculateCrewSize(laborHours);
    const crewHoursPerDay = 8 * crewSize;
    const daysNeeded = Math.ceil(laborHours / crewHoursPerDay);

    return {
        days: daysNeeded,
        crewSize: crewSize,
        description: `${daysNeeded} day${daysNeeded > 1 ? 's' : ''} with ${crewSize} crew`
    };
}

/**
 * Format currency
 * @param {number} amount - Dollar amount
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

/**
 * Generate cost report
 * @param {Object} costData - Cost calculation result
 * @returns {string} Formatted report
 */
function generateCostReport(costData) {
    const { breakdown, perSqFt, laborHours, crewSize, timeline } = costData;

    return `
ROOFING COST ESTIMATE
====================

COST BREAKDOWN:
  Material:        ${formatCurrency(breakdown.material)}
  Obstructions:    ${formatCurrency(breakdown.obstructions)}
  Labor:           ${formatCurrency(breakdown.labor)}
  Removal:         ${formatCurrency(breakdown.removal)}
  Debris:          ${formatCurrency(breakdown.debris)}
  Contingency:     ${formatCurrency(breakdown.contingency)}
  ─────────────────────────────
  TOTAL:           ${formatCurrency(breakdown.total)}

UNIT COST:
  Cost per sq ft:  ${formatCurrency(perSqFt)}

PROJECT DETAILS:
  Total labor:     ${laborHours} hours
  Crew size:       ${crewSize} people
  Timeline:        ${timeline.days} day${timeline.days > 1 ? 's' : ''}

NOTES:
- Prices are estimates based on 2024-2025 regional averages
- Actual costs will vary based on location, contractor, and material quality
- Get 3+ quotes from licensed contractors before proceeding
    `;
}

/**
 * Export cost data as JSON
 * @param {Object} roofData - Complete roof analysis data
 * @returns {string} JSON string
 */
function exportAsJSON(roofData) {
    const cleanData = {
        address: roofData.address,
        timestamp: new Date().toISOString(),
        roofDimensions: {
            buildingFootprintSqFt: roofData.roofData?.footprintSqFt || 0,
            roofPitch: roofData.roofData?.pitch?.ratio || "Unknown",
            totalRoofAreaSqFt: roofData.roofData?.roofAreaSqFt || 0
        },
        material: roofData.roofData?.material || {},
        costs: roofData.costs || {},
        obstructions: roofData.roofData?.obstructions || {},
        dataQuality: roofData.dataQuality || {}
    };

    return JSON.stringify(cleanData, null, 2);
}

/**
 * Generate CSV export
 * @param {Object} roofData
 * @returns {string} CSV string
 */
function exportAsCSV(roofData) {
    const { costs, roofData: data } = roofData;

    const rows = [
        ['Roof Analysis Report'],
        ['Address', roofData.address],
        ['Analysis Date', new Date().toLocaleDateString()],
        [''],
        ['ROOF DIMENSIONS'],
        ['Building Footprint (sq ft)', data?.footprintSqFt || 0],
        ['Roof Pitch', data?.pitch?.ratio || 'Unknown'],
        ['Total Roof Area (sq ft)', data?.roofAreaSqFt || 0],
        [''],
        ['MATERIAL'],
        ['Material Type', data?.material?.name || 'Unknown'],
        ['Confidence', `${(data?.material?.confidence * 100 || 0).toFixed(1)}%`],
        ['Cost per sq ft', formatCurrency(data?.material?.costPerSqft?.avg || 0)],
        [''],
        ['COST BREAKDOWN'],
        ['Material', formatCurrency(costs?.breakdown?.material || 0)],
        ['Obstructions', formatCurrency(costs?.breakdown?.obstructions || 0)],
        ['Labor', formatCurrency(costs?.breakdown?.labor || 0)],
        ['Removal', formatCurrency(costs?.breakdown?.removal || 0)],
        ['Debris', formatCurrency(costs?.breakdown?.debris || 0)],
        ['Contingency (10%)', formatCurrency(costs?.breakdown?.contingency || 0)],
        ['TOTAL', formatCurrency(costs?.breakdown?.total || 0)],
        [''],
        ['PROJECT DETAILS'],
        ['Cost per sq ft', formatCurrency(costs?.perSqFt || 0)],
        ['Labor Hours', costs?.laborHours || 0],
        ['Recommended Crew', costs?.crewSize || 0],
        ['Timeline (days)', costs?.timeline?.days || 0]
    ];

    return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
}
