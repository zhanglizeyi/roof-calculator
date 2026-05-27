/**
 * Roof Calculator - Main Application
 * Coordinates all modules and handles UI
 */

const app = {
    currentAddress: null,
    currentAnalysis: null,
    debounceTimer: null,

    // Initialize app
    init() {
        this.setupEventListeners();
        this.log("Roof Calculator initialized");
    },

    // Setup event listeners
    setupEventListeners() {
        const addressInput = document.getElementById('addressInput');
        const analyzeBtn = document.getElementById('analyzeBtn');
        const newSearchBtn = document.getElementById('newSearchBtn');
        const exportBtn = document.getElementById('exportBtn');
        const saveNotesBtn = document.getElementById('saveNotesBtn');

        // Address input with autocomplete
        addressInput.addEventListener('input', (e) => this.handleAddressInput(e));
        addressInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') analyzeBtn.click();
        });

        // Analyze button
        analyzeBtn.addEventListener('click', () => this.analyzeAddress());

        // Results actions
        if (newSearchBtn) newSearchBtn.addEventListener('click', () => this.resetForm());
        if (exportBtn) exportBtn.addEventListener('click', () => this.exportResults());
        if (saveNotesBtn) saveNotesBtn.addEventListener('click', () => this.saveNotes());
    },

    // Handle address input with autocomplete
    async handleAddressInput(e) {
        const query = e.target.value.trim();
        const suggestionsDiv = document.getElementById('suggestions');
        const analyzeBtn = document.getElementById('analyzeBtn');

        clearTimeout(this.debounceTimer);

        if (query.length < 3) {
            suggestionsDiv.innerHTML = '';
            analyzeBtn.disabled = true;
            return;
        }

        this.debounceTimer = setTimeout(async () => {
            try {
                const suggestions = await geocodeSuggestions(query);
                this.displaySuggestions(suggestions, suggestionsDiv, e.target);

                // Enable analyze button if we have the address
                analyzeBtn.disabled = suggestions.length === 0;
            } catch (error) {
                this.showError(`Autocomplete error: ${error.message}`);
            }
        }, 300);
    },

    // Display address suggestions
    displaySuggestions(suggestions, container, input) {
        container.innerHTML = '';

        suggestions.forEach(suggestion => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.textContent = suggestion.displayName;
            item.addEventListener('click', () => {
                input.value = suggestion.displayName;
                container.innerHTML = '';
                this.currentAddress = suggestion.displayName;
                document.getElementById('analyzeBtn').disabled = false;
            });
            container.appendChild(item);
        });
    },

    // Main analysis function
    async analyzeAddress() {
        const addressInput = document.getElementById('addressInput');
        const address = addressInput.value.trim();

        if (!address) {
            this.showError('Please enter an address');
            return;
        }

        this.currentAddress = address;
        this.showLoading(true);

        try {
            // Step 1: Geocode address
            this.log(`Geocoding: ${address}`);
            const geocoded = await geocodeAddress(address);
            const { lat, lon } = geocoded;

            // Step 2: Get building footprint
            this.log('Fetching building footprint...');
            const footprint = await getPropertyDimensions(lat, lon);
            const footprintSqFt = footprint.footprintSqFt;

            // Step 3: Fetch satellite image
            this.log('Fetching satellite imagery...');
            const satImage = await getSatelliteImage(lat, lon, 512, 512);

            // Step 4: Detect pitch
            this.log('Analyzing roof pitch...');
            const pitch = detectRoofPitch(satImage);

            // Step 5: Identify material
            this.log('Identifying roofing material...');
            const material = identifyRoofMaterial(satImage);

            // Step 6: Detect obstructions
            this.log('Detecting roof features...');
            const obstructions = await detectRoofObstructions(satImage);

            // Step 7: Calculate roof area
            const roofAreaSqFt = calculateRoofArea(footprintSqFt, pitch.ratio);

            // Step 8: Calculate costs
            this.log('Calculating costs...');
            const costs = calculateRoofingCost({
                roofAreaSqFt,
                material,
                pitch,
                obstructions
            });

            // Store analysis
            this.currentAnalysis = {
                address,
                geocoded,
                footprint,
                satelliteImage: satImage,
                pitch,
                material,
                obstructions,
                roofAreaSqFt,
                costs,
                timestamp: new Date()
            };

            // Display results
            this.displayResults();
            this.showLoading(false);

        } catch (error) {
            this.showLoading(false);
            this.showError(`Analysis failed: ${error.message}`);
            console.error('Analysis error:', error);
        }
    },

    // Display results
    displayResults() {
        const analysis = this.currentAnalysis;
        const results = document.getElementById('resultsSection');

        // Display satellite image
        const satelliteImg = document.getElementById('satelliteImage');
        const imageContainer = document.querySelector('.satellite-image-container');
        
        try {
            if (analysis.satelliteImage) {
                if (analysis.satelliteImage instanceof HTMLCanvasElement) {
                    // Canvas to data URL
                    const dataUrl = analysis.satelliteImage.toDataURL('image/png');
                    satelliteImg.src = dataUrl;
                    satelliteImg.onload = () => {
                        console.log("✅ Satellite image loaded successfully");
                    };
                    satelliteImg.onerror = () => {
                        console.warn("Image failed to load, showing placeholder");
                        showImagePlaceholder(satelliteImg);
                    };
                } else if (analysis.satelliteImage instanceof HTMLImageElement) {
                    satelliteImg.src = analysis.satelliteImage.src;
                    satelliteImg.onload = () => {
                        console.log("✅ Satellite image loaded successfully");
                    };
                    satelliteImg.onerror = () => {
                        console.warn("Image failed to load, showing placeholder");
                        showImagePlaceholder(satelliteImg);
                    };
                }
            } else {
                showImagePlaceholder(satelliteImg);
            }
        } catch (error) {
            console.error("Error displaying satellite image:", error);
            showImagePlaceholder(satelliteImg);
        }

        // Summary
        document.getElementById('totalRoofArea').textContent = 
            `${analysis.roofAreaSqFt.toLocaleString()} sq ft`;
        document.getElementById('roofPitch').textContent = analysis.pitch.ratio;
        document.getElementById('roofMaterial').textContent = analysis.material.name;
        document.getElementById('estimatedCost').textContent = 
            formatCurrency(analysis.costs.breakdown.total);

        // Dimensions
        document.getElementById('footprintSqft').textContent = 
            `${analysis.footprint.footprintSqFt.toLocaleString()} sq ft`;
        document.getElementById('pitchRatio').textContent = analysis.pitch.ratio;
        document.getElementById('pitchMultiplier').textContent = 
            analysis.pitch.multiplier.toFixed(3);
        document.getElementById('roofAreaDetail').textContent = 
            `${analysis.roofAreaSqFt.toLocaleString()} sq ft`;

        // Material
        document.getElementById('materialName').textContent = analysis.material.name;
        document.getElementById('materialConfidence').textContent = 
            `${Math.round(analysis.material.confidence * 100)}%`;
        document.getElementById('materialLifespan').textContent = 
            analysis.material.lifespan;
        document.getElementById('materialCostPerSqft').textContent = 
            formatCurrency(analysis.material.costPerSqft.avg);

        // Obstructions
        this.displayObstructions(analysis.obstructions);

        // Costs
        const costs = analysis.costs.breakdown;
        document.getElementById('costMaterial').textContent = 
            formatCurrency(costs.material);
        document.getElementById('costObstructions').textContent = 
            formatCurrency(costs.obstructions);
        document.getElementById('costLabor').textContent = 
            formatCurrency(costs.labor);
        document.getElementById('costContingency').textContent = 
            formatCurrency(costs.contingency);
        document.getElementById('costTotal').textContent = 
            formatCurrency(costs.total);

        // Project specs
        document.getElementById('crewSize').textContent = 
            `${analysis.costs.crewSize} people`;
        document.getElementById('timeline').textContent = 
            analysis.costs.timeline.description;
        document.getElementById('laborHours').textContent = 
            `${analysis.costs.laborHours} hours`;
        document.getElementById('wasteFactor').textContent = '12%';

        // Data quality
        this.displayDataQuality(analysis);

        // Show results section
        results.classList.remove('hidden');
        results.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    // Display obstructions
    displayObstructions(obstructions) {
        const container = document.getElementById('obstructionsContainer');
        container.innerHTML = '';

        const features = [
            {
                name: 'Chimneys',
                icon: '🏚️',
                items: obstructions.chimneys || [],
                key: 'chimneys'
            },
            {
                name: 'Vents',
                icon: '🌬️',
                items: obstructions.vents || [],
                key: 'vents'
            },
            {
                name: 'Skylights',
                icon: '☀️',
                items: obstructions.skylights || [],
                key: 'skylights'
            },
            {
                name: 'Solar Panels',
                icon: '⚡',
                items: obstructions.solarPanels || [],
                key: 'solar'
            },
            {
                name: 'Pipes',
                icon: '🔧',
                items: obstructions.pipes || [],
                key: 'pipes'
            }
        ];

        features.forEach(feature => {
            if (feature.items.length > 0) {
                const item = document.createElement('div');
                item.className = 'obstruction-item';
                item.innerHTML = `
                    <h4>${feature.icon} ${feature.name}</h4>
                    <div class="obstruction-detail">
                        <span class="label">Count:</span>
                        <span class="value">${feature.items.length}</span>
                    </div>
                    <div class="obstruction-detail">
                        <span class="label">Confidence:</span>
                        <span class="value">${Math.round((feature.items[0]?.confidence || 0.5) * 100)}%</span>
                    </div>
                    <div class="obstruction-cost">
                        Impact: Included in estimate
                    </div>
                `;
                container.appendChild(item);
            }
        });

        if (container.innerHTML === '') {
            container.innerHTML = '<p style="grid-column: 1 / -1; color: #666;">No major obstructions detected</p>';
        }
    },

    // Display data quality indicators
    displayDataQuality(analysis) {
        const container = document.getElementById('dataQuality');
        container.innerHTML = '';

        const sources = [
            {
                name: 'Satellite Imagery',
                status: analysis.footprint.source === 'osm' ? 'good' : 'warning',
                note: 'OpenStreetMap data'
            },
            {
                name: 'Pitch Detection',
                status: analysis.pitch.confidence > 0.8 ? 'good' : 'warning',
                note: `${Math.round(analysis.pitch.confidence * 100)}% confidence`
            },
            {
                name: 'Material ID',
                status: analysis.material.confidence > 0.8 ? 'good' : 'warning',
                note: `${Math.round(analysis.material.confidence * 100)}% confidence`
            },
            {
                name: 'Feature Detection',
                status: analysis.obstructions.confidence > 0.6 ? 'good' : 'warning',
                note: `${Math.round(analysis.obstructions.confidence * 100)}% confidence`
            }
        ];

        sources.forEach(source => {
            const row = document.createElement('div');
            row.className = 'data-source';
            const statusClass = `status-${source.status}`;
            row.innerHTML = `
                <span class="source-name">${source.name}</span>
                <span class="source-status ${statusClass}">${source.note}</span>
            `;
            container.appendChild(row);
        });
    },

    // Export results
    exportResults() {
        const json = exportAsJSON(this.currentAnalysis);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `roof-analysis-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.log('Results exported as JSON');
    },

    // Save testing notes
    saveNotes() {
        const textarea = document.getElementById('testingNotes');
        const notes = textarea.value;
        localStorage.setItem('roof_calc_testing_notes', notes);
        alert('Notes saved!');
    },

    // Reset form
    resetForm() {
        document.getElementById('addressInput').value = '';
        document.getElementById('addressInput').focus();
        document.getElementById('resultsSection').classList.add('hidden');
        document.getElementById('errorMessage').classList.add('hidden');
        this.currentAnalysis = null;
    },

    // Show/hide loading spinner
    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        if (show) {
            spinner.classList.remove('hidden');
        } else {
            spinner.classList.add('hidden');
        }
    },

    // Show error message
    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
        setTimeout(() => {
            errorDiv.classList.add('hidden');
        }, 5000);
    },

    // Logging
    log(message) {
        console.log(`[Roof Calc] ${message}`);
    }
};

// Format currency helper (from costs.js)
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Show image placeholder
function showImagePlaceholder(imgElement) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Blue gradient background (sky-like)
    const gradient = ctx.createLinearGradient(0, 0, 512, 512);
    gradient.addColorStop(0, '#87ceeb');
    gradient.addColorStop(0.5, '#5a9dd9');
    gradient.addColorStop(1, '#4a90e2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    
    // Add building/roof icon
    ctx.fillStyle = '#d9534f';
    ctx.fillRect(100, 250, 312, 150); // Main roof
    
    ctx.fillStyle = '#a94442';
    ctx.beginPath();
    ctx.moveTo(100, 250);
    ctx.lineTo(256, 100);
    ctx.lineTo(412, 250);
    ctx.closePath();
    ctx.fill(); // Roof peak
    
    // Text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Satellite Image', 256, 450);
    ctx.font = '14px Arial';
    ctx.fillText('(Unable to load live imagery)', 256, 475);
    
    imgElement.src = canvas.toDataURL('image/png');
}

// Initialize app on load
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
