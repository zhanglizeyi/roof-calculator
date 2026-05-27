# 🐙 Push to GitHub & Deploy to Pages

## Step 1: Create Repo on GitHub (2 minutes)

1. Go to **https://github.com/new**
2. Fill in:
   - **Repository name:** `roof-calculator`
   - **Description:** Free roof analysis tool with cost estimation
   - **Public** (required for free GitHub Pages)
   - **Add a README** ❌ (skip, we have one)
   - **Add .gitignore** ❌ (skip, not needed)
   - Click **Create repository**

---

## Step 2: Push Code to GitHub (1 minute)

In your terminal:

```bash
cd /data/.openclaw/workspace/roof-calculator

# Set remote to use HTTPS (easier from Docker)
git remote set-url origin https://github.com/zhanglizeyi/roof-calculator.git

# Push to GitHub
git push -u origin main
```

When prompted for password, use a **Personal Access Token** (not your password):

1. Go to **https://github.com/settings/tokens**
2. Click **Generate new token (classic)**
3. Check: `repo` (all boxes under it)
4. Generate & copy token
5. Paste as password when git asks
6. Press Enter

Done! Your code is now on GitHub.

---

## Step 3: Enable GitHub Pages (1 minute)

1. Go to **https://github.com/zhanglizeyi/roof-calculator**
2. Click **Settings** (top right)
3. Click **Pages** (left sidebar)
4. **Source:** Select `Deploy from a branch`
5. **Branch:** Select `main` (folder: `/` root)
6. Click **Save**

Wait 30 seconds...

Your site is live at:
```
https://zhanglizeyi.github.io/roof-calculator/
```

---

## Step 4: Verify It Works

Open **https://zhanglizeyi.github.io/roof-calculator/** in browser.

Should see:
- 🏠 Roof Calculator header
- Address input box
- "Analyze Roof" button

**Done!** Your roof calculator is now live with HTTPS ✅

---

## Optional: Custom Domain

If you want `roof.archgeneralconstruction.com` instead:

1. Go to repo **Settings** → **Pages**
2. Under "Custom domain", enter: `roof.archgeneralconstruction.com`
3. Go to your domain registrar (GoDaddy, etc)
4. Add CNAME record: `roof` → `zhanglizeyi.github.io`
5. GitHub will auto-activate HTTPS

Then your URL becomes: **https://roof.archgeneralconstruction.com**

---

## Push Updates Later

After making changes locally:

```bash
cd /data/.openclaw/workspace/roof-calculator
git add .
git commit -m "Update: [description of change]"
git push origin main
```

GitHub Pages auto-updates your site in 30 seconds.

---

## Your URLs

**GitHub repo:**
```
https://github.com/zhanglizeyi/roof-calculator
```

**Live site:**
```
https://zhanglizeyi.github.io/roof-calculator/
```

**With custom domain (optional):**
```
https://roof.archgeneralconstruction.com
```

---

Ready? Start with Step 1! 🚀
