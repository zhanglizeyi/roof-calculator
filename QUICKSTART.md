# 🚀 Quick Start Guide

## In 30 Seconds

### 1. Start a Server

```bash
cd /data/.openclaw/workspace/roof-calculator
python -m http.server 8000
```

### 2. Open Browser

```
http://localhost:8000
```

### 3. Test It

- Type address: "Los Gatos, CA"
- Click "Analyze Roof"
- Wait 10-30 seconds
- See results!

---

## First Thing to Try

```
Address: 1234 Oak Street, Los Gatos, CA
Expected: ~2,300-2,500 sq ft, Asphalt shingles, $15k-20k estimate
```

---

## Common Issues

### "Address not found"
→ Try different format: "City, State" or full address

### "No imagery available"
→ Some areas have low resolution — try nearby addresses

### "Page blank or errors in console"
→ Check console (F12) for errors. Might need to reload.

### Slow analysis
→ Normal! First run takes 10-30 seconds. Cached results are instant.

---

## What Each Section Does

| Section | Purpose | What to Check |
|---------|---------|---------------|
| **Address Input** | Find the property | Autocomplete working? |
| **Roof Dimensions** | Size calculation | Footprint × pitch = area |
| **Material** | Identify shingles, metal, etc. | Makes sense? Confidence high? |
| **Obstructions** | Find chimneys, vents, solar | Reasonable count? |
| **Cost Estimate** | Total replacement cost | Compare with contractor quotes |
| **Project Specs** | Labor, timeline, crew | Realistic? |

---

## Test With These Addresses

Paste into the app and check results:

```
✅ GOOD TEST CASES (expect good data):
1234 Oak Street, Los Gatos, CA
150 Main Street, Saratoga, CA
123 Mountain Home Road, Los Altos Hills, CA

⚠️ EDGE CASES (test error handling):
123 Random Road, Nowhere, CA
Apartment 4B, Downtown San Jose
PO Box 123, Saratoga
```

---

## Save Your Testing Notes

Use the "Testing Checklist" section at the bottom to note:
- What you tested
- What worked/didn't work
- Any issues found
- Suggestions

Notes are saved in browser automatically.

---

## Next Steps

1. **Test 10+ addresses** — Especially Bay Area properties
2. **Compare with contractor quotes** — Are estimates reasonable?
3. **Note any bugs** — Check console for errors
4. **Report findings** — Include address + observations

---

## Want to Deploy?

When ready to go public (after testing):

```bash
# GitHub Pages
git init && git add . && git commit -m "launch" && git push

# Or Netlify (easier)
npm i -g netlify-cli && netlify deploy --prod
```

Cost: **$0/month**

---

## Questions?

Check:
- **Browser console** (F12) for error logs
- **README.md** for full documentation
- Testing notes section in app

Good luck! 🎉
