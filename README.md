# 🏠 Roof Calculator - Free Roofing Analysis Tool

A completely **free**, browser-based tool for analyzing roofs and estimating replacement costs.

**Status:** 🔧 Internal Testing (Beta v0.1) — Not yet public

---

## 🚀 Quick Start (Local Testing)

### Option 1: Simple HTTP Server (Recommended)

```bash
cd /data/.openclaw/workspace/roof-calculator

# Python 3
python -m http.server 8000

# Or Python 2
python -m SimpleHTTPServer 8000

# Or Node.js (if installed)
npx http-server
```

Then open: **http://localhost:8000**

### Option 2: Using `opensimple` (if available)

```bash
cd /data/.openclaw/workspace/roof-calculator
opensimple  # Starts a local server automatically
```

### Option 3: Direct File Open (Limited)

```bash
open index.html
```

⚠️ **Note:** Direct file opening may have limited functionality due to browser security restrictions (CORS). Use an HTTP server instead.

---

## 📋 What's Inside

```
roof-calculator/
├── index.html              Main page (UI)
├── style.css               Styling
├── app.js                  Main application logic
├── modules/
│   ├── geocode.js          Address → coordinates (OpenStreetMap Nominatim)
│   ├── imagery.js          Fetch satellite images
│   ├── footprint.js        Building polygon calculation
│   ├── pitch.js            Roof pitch detection
│   ├── material.js         Roofing material identification
│   ├── objects.js          Detect chimneys, vents, solar, etc.
│   └── costs.js            Cost estimation engine
├── data/
│   └── (cache files created automatically)
└── README.md               This file
```

---

## 🎯 What to Test

### Basic Functionality

- ✅ **Address Input** — Type an address, see autocomplete suggestions
  - Try: "Los Gatos, CA", "Saratoga, CA", "Los Altos Hills, CA"
  - Should show suggestions from OpenStreetMap

- ✅ **Roof Area Calculation** — Building footprint × pitch multiplier
  - Verify math: building footprint × pitch factor = total roof area
  - Example: 2,200 sq ft × 1.054 (4:12 pitch) = 2,319 sq ft ✓

- ✅ **Material Detection** — Analyzes satellite image colors
  - Most Bay Area homes: Asphalt shingles (dark gray/black)
  - Confidence score should be 60-90%

- ✅ **Cost Estimation** — Breaking down material, labor, obstructions
  - Material cost ~ 40-50% of total
  - Labor ~ 40-50% of total
  - Should be reasonable for Bay Area market

### Advanced Features

- 🔧 **Pitch Detection** — Identifies 4:12, 6:12, etc. from satellite imagery
  - Currently uses fallback (4:12 is most common, so ~60% accuracy expected)

- 🔧 **Feature Detection** — Finds chimneys, vents, solar panels
  - Currently uses pattern recognition (low confidence)
  - Will improve with ML model training

- 🔧 **Cost Breakdown** — Material + labor + obstructions + contingency
  - Verify total = material + labor + 10% contingency

### Data Sources

- **Geocoding:** OpenStreetMap Nominatim (free, unlimited)
- **Building Data:** OpenStreetMap Overpass API (free, limited rate)
- **Satellite Imagery:** USGS/Esri (free, good resolution)
- **Cost Database:** Hardcoded 2024-2025 averages (will improve)

---

## 🐛 Known Issues & Limitations (Alpha)

| Issue | Severity | Workaround |
|-------|----------|-----------|
| Object detection has low accuracy | ⚠️ Medium | Needs ML training data |
| Pitch detection is basic | ⚠️ Medium | Uses edge detection, not perfect |
| Cost estimates are hardcoded | ⚠️ Medium | Will add regional API |
| Some properties no OSM data | ⚠️ Low | Falls back to estimation |
| Mobile responsiveness needs work | ℹ️ Low | Desktop-first for now |

---

## 🧪 Testing Checklist

Use the testing notes section in the app to log observations:

### Phase 1: Data Fetching
- [ ] Address autocomplete working?
- [ ] Building footprint calculated?
- [ ] Satellite image loads?
- [ ] Does it work in offline mode? (check IndexedDB caching)

### Phase 2: Analysis
- [ ] Roof area calculation accurate?
- [ ] Pitch detection reasonable?
- [ ] Material identification makes sense?
- [ ] Obstruction detection finds features?

### Phase 3: Results
- [ ] Cost breakdown looks reasonable?
- [ ] Labor hours estimate realistic?
- [ ] Timeline and crew size sensible?
- [ ] Export JSON/CSV working?

### Phase 4: Edge Cases
- [ ] Try non-residential buildings (commercial)
- [ ] Try unusual rooflines (complex roofs)
- [ ] Try areas with minimal OSM data
- [ ] Try on mobile browser
- [ ] Test with 100+ addresses for consistency

---

## 📊 Test Addresses (Bay Area)

Use these to test:

```
✅ Good test cases:
- 1234 Oak Street, Los Gatos, CA (residential, simple roof)
- 150 Main Street, Saratoga, CA (mixed use, might have data gaps)
- 1 Apple Park Way, Cupertino, CA (famous building, lots of data)
- Random Los Gatos address (to test variability)

⚠️ Edge cases:
- PO Box or rural address (test error handling)
- High-rise building (test with different roof type)
- Address in county without good OSM coverage
```

---

## 🔧 Development Notes

### Architecture

**Frontend-Heavy Design:**
- All processing happens in browser (no backend needed yet)
- Uses free, public APIs only
- Results cached in localStorage (7-30 day TTL)
- No authentication required

**Future Backend (Optional):**
- Add caching layer to reduce API calls
- Store user analyses
- Regional pricing database
- ML model hosting for better detection

### Technologies Used

- **Frontend:** Vanilla HTML/CSS/JavaScript (no framework)
- **Geospatial:** OpenStreetMap (Nominatim, Overpass)
- **Imagery:** USGS/Esri satellite tiles
- **ML:** TensorFlow.js + COCO-SSD (when available)
- **Browser APIs:** Canvas, IndexedDB, Fetch

### Code Structure

```
index.html       ← User interface
   ↓
app.js          ← Main controller
   ↓
modules/        ← Feature modules
   ├─ geocode    (address → lat/lon)
   ├─ imagery    (fetch satellite)
   ├─ footprint  (building size)
   ├─ pitch      (roof slope)
   ├─ material   (color analysis)
   ├─ objects    (chimneys, vents, etc.)
   └─ costs      (price calculation)
```

---

## 📈 Improvement Ideas (Post-Testing)

**Priority 1 (High):**
- Train YOLO model on roof images (chimneys, vents, solar)
- Improve pitch detection with better edge detection
- Add regional pricing API or scrape contractor quotes

**Priority 2 (Medium):**
- Add light backend for caching + user accounts
- Integrate with local MLS data
- Add financing calculators (loan, payback period)
- Export to PDF report

**Priority 3 (Nice-to-Have):**
- 3D roof visualization
- Before/after photo comparison
- Contractor directory
- Insurance claim assistance

---

## 🚀 Deployment (When Ready for Public)

### Static Hosting (Free)

```bash
# Deploy to GitHub Pages
git init
git add .
git commit -m "Roof calculator v1.0"
git remote add origin https://github.com/YOUR_USERNAME/roof-calculator.git
git push -u origin main

# Enable GitHub Pages in repo settings
# URL: https://YOUR_USERNAME.github.io/roof-calculator/
```

### Or Netlify (Drop-and-Drag)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

### Or Vercel

```bash
npm i -g vercel
vercel --prod
```

**Cost: $0/month** (all three are free tier)

---

## 💬 Support & Feedback

### During Testing

- Report bugs in testing notes section
- Note any costs that seem unreasonable
- Try unusual addresses and note failures
- Compare results with real quotes from contractors

### Feedback to Include

- Address tested
- Expected vs actual results
- Any errors or odd behavior
- Suggestions for improvement
- Time taken for analysis

---

## 📝 License

**Free & Open Source** — MIT License

Feel free to use, modify, improve. When you launch publicly, consider attributing:
- OpenStreetMap contributors
- USGS for satellite data
- TensorFlow.js community

---

## 🎯 Next Steps

1. ✅ **Test locally** — Follow Quick Start above
2. 🔧 **Test with 20-50 addresses** — Log any issues
3. 📊 **Compare with real quotes** — Validate cost accuracy
4. 🚀 **Deploy to staging** — Semi-public URL for team testing
5. 📢 **Launch publicly** — When confident in accuracy

---

**Questions?** Check the console (F12) for detailed logs during analysis.

Happy testing! 🎉
