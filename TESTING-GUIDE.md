# 🧪 Testing Guide — Internal Phase

## Overview

You now have a **fully functional, free roof calculator** ready for internal testing before going public.

**Status:** Beta v0.1 — All features working, needs real-world validation

---

## 📦 What You Have

✅ **Complete Frontend** — Ready to use right now
- Address autocomplete (OpenStreetMap)
- Satellite image fetching
- Building footprint calculation
- Roof pitch detection
- Material identification
- Obstruction detection
- Cost estimation
- Results export

✅ **No Backend Needed** — Runs entirely in browser
- All processing local
- Free APIs only
- Cached results
- Works offline (after first load)

✅ **Zero Deployment Friction** — Deploy whenever ready
- Can host on GitHub Pages ($0)
- Or Netlify ($0)
- Or any static host

---

## 🎯 Testing Goals

### Primary: Validate Accuracy
- [ ] Are cost estimates within 10-15% of real contractor quotes?
- [ ] Does roof area calculation match manual measurements?
- [ ] Is material detection accurate for common Bay Area roofing?

### Secondary: Find Bugs
- [ ] Crash on unusual addresses?
- [ ] Slow performance on complex roofs?
- [ ] Data accuracy issues?
- [ ] Mobile responsiveness?

### Tertiary: Gather Feedback
- [ ] What features matter most?
- [ ] What's missing?
- [ ] What confuses users?
- [ ] Would you pay for this? For what?

---

## 🚀 How to Test

### Phase 1: Local Testing (You, Alone)

**Duration:** 1-2 hours
**Goal:** Find obvious bugs

```
1. Start server:  python -m http.server 8000
2. Open:          http://localhost:8000
3. Test 20+ addresses
4. Note any crashes/errors
5. Check results against estimates (if you know rough values)
```

**Addresses to try:**
- Your own address (you know the roof!)
- Friends' addresses (validate their costs)
- Properties in different neighborhoods
- Mixed: houses, duplexes, apartments, commercial

---

### Phase 2: Validation Testing (With Contractors)

**Duration:** 2-4 weeks
**Goal:** Compare with real quotes

**Process:**
1. Get real roofing quotes (3-5 contractors)
2. Run calculator on same address
3. Compare estimates
4. Note accuracy/discrepancies
5. Adjust cost formulas if needed

**Sample validation spreadsheet:**
```
Address | Calc Est | Quote 1 | Quote 2 | Quote 3 | Avg | Accuracy
--------|----------|---------|---------|---------|-----|----------
123 Oak | $16,500  | $17,000 | $18,200 | $16,800 | $17,333 | 95%
456 Elm | $14,200  | $13,500 | $14,800 | $15,200 | $14,500 | 98%
...
```

---

### Phase 3: Edge Case Testing

**Duration:** 1 week
**Goal:** Break it (intentionally)

Try:
- [ ] Very old houses (steep roofs, dormers, valleys)
- [ ] New houses (complex roofs, solar)
- [ ] Unusual shapes (L-shaped, multiple levels)
- [ ] Flat commercial buildings
- [ ] Properties with poor OSM data
- [ ] Rural/remote addresses
- [ ] Different climates (affects material choices)

---

## 📋 Testing Template

### Test Case
**Address:** [address]
**Date:** [date]
**Tester:** [your name]

### Input
- Building footprint: ___ sq ft (verify on Zillow?)
- Roof pitch: ___ (look at photo?)
- Material: ___ (what do you see?)

### Calculated
- Roof area: ___ sq ft
- Material: ___ (confidence: __%)
- Cost estimate: $___

### Validation
- Contractor quote(s): $___, $___, $___
- Average: $___
- Accuracy: __% (calc vs avg)

### Notes
- Any errors?
- Did it find obstructions?
- Slow or fast?
- UI confusing anywhere?

---

## 🐛 Bug Report Template

When you find an issue:

```
TITLE: [Brief description]

SEVERITY: 🔴 Critical | 🟡 High | 🟢 Medium | 🔵 Low

ADDRESS: [What address triggered it]

STEPS TO REPRODUCE:
1. [Step 1]
2. [Step 2]
3. [Step 3]

EXPECTED: [What should happen]

ACTUAL: [What happened instead]

SCREENSHOT: [If helpful]

BROWSER/DEVICE: [Chrome on Mac, Safari on iPhone, etc.]

CONSOLE ERROR: [Paste from F12 console]

NOTES: [Any other context]
```

---

## 📊 Data to Collect

For each address tested, record:

| Field | Why | Example |
|-------|-----|---------|
| Address | For reference | 1234 Oak St, Los Gatos, CA |
| Building sqft | Validate footprint calc | 2,200 |
| Roof pitch | Check detection | 4:12 |
| Material | Validate detection | Asphalt |
| # of chimneys | Feature detection | 1 |
| # of vents | Feature detection | 3 |
| # of solar panels | Feature detection | 0 |
| Calc cost | Validate formula | $16,500 |
| Real quote | Compare | $17,500 |
| Accuracy % | Track precision | 94% |

---

## ✅ Acceptance Criteria (Go/No-Go)

**READY FOR PUBLIC if:**

- [ ] 90%+ of cost estimates within ±15% of real quotes
- [ ] No critical bugs (crashes, data loss)
- [ ] Material detection ~80%+ accuracy
- [ ] Pitch detection ~70%+ accuracy
- [ ] Works on all tested addresses
- [ ] Mobile responsive (or noted as desktop-only)

**NOT READY if:**

- ❌ Cost estimates consistently off by >20%
- ❌ Crashes on common addresses
- ❌ Geocoding fails for normal addresses
- ❌ Material misidentification >30% of time

---

## 🔄 Iteration Process

After testing:

1. **Collect feedback** — Consolidate all notes
2. **Identify patterns** — What's consistently wrong?
3. **Prioritize fixes** — Most impactful first
4. **Adjust formulas** — Tweak cost multipliers based on validation
5. **Re-test** — Verify fixes work
6. **Document** — Note what changed

Example:
```
FEEDBACK: All estimates are 8-12% too high
ROOT CAUSE: Labor rate assumed $125/hr, actually $110/hr locally
FIX: Adjust labor rate to $115/hr
RESULT: Estimates now within ±8%
```

---

## 🎯 Testing Timeline

**Suggested Schedule:**

| Week | Activity | Deliverable |
|------|----------|-------------|
| 1 | Local testing (your addresses) | Bug list, basic validation |
| 2-3 | Get contractor quotes | Validation spreadsheet |
| 4 | Compare & adjust formulas | Calibration complete |
| 5 | Edge case testing | Known limitations doc |
| 6 | Final refinement | Launch-ready checklist |

---

## 📝 Sign-Off Checklist

Before launching public:

- [ ] Tested with 50+ addresses
- [ ] Compared with 10+ contractor quotes
- [ ] Accuracy within acceptable range (±15%)
- [ ] All critical bugs fixed
- [ ] No crashes on normal input
- [ ] Mobile (or clearly desktop-only)
- [ ] Help/FAQ section added
- [ ] Privacy/disclaimer text added
- [ ] Cost data documented (sources, date)
- [ ] Team agrees it's launch-ready

---

## 🚀 Public Launch Prep

When tests pass:

```bash
# 1. Add disclaimer/legal
# 2. Add privacy policy
# 3. Add FAQ
# 4. Deploy to public URL
# 5. Set up analytics (optional)
# 6. Monitor for issues
# 7. Iterate based on user feedback
```

---

## 📞 Questions During Testing?

1. **Check README.md** — Full documentation
2. **Check console (F12)** — Error logs
3. **Check code comments** — Each module explains itself
4. **Email/chat notes** — Document findings

---

## 🎉 You're Ready!

Everything is set up. Start testing now:

```bash
cd /data/.openclaw/workspace/roof-calculator
python -m http.server 8000
# Open http://localhost:8000
# Start testing!
```

**Report back with findings when ready!**
