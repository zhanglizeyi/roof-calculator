# 🚀 Deploy to HTTPS (Choose One)

Your roof calculator is ready to deploy with **free HTTPS** on multiple platforms.

---

## Option 1: GitHub Pages (Easiest, Free HTTPS)

**Requirements:** GitHub account (you have: zhanglizeyi)

### Steps

1. **Create new repo on GitHub:**
   - Go to https://github.com/new
   - Name: `roof-calculator`
   - Public (required for free Pages)
   - Click "Create repository"

2. **Push code:**
   ```bash
   cd /data/.openclaw/workspace/roof-calculator
   git remote set-url origin https://github.com/zhanglizeyi/roof-calculator.git
   git push -u origin main
   ```

3. **Enable Pages:**
   - Repo Settings → Pages
   - Source: Deploy from a branch
   - Branch: main, folder: / (root)
   - Save

4. **Done!**
   - URL: https://zhanglizeyi.github.io/roof-calculator/
   - HTTPS: ✅ Automatic
   - Cost: $0
   - Custom domain: Optional later

---

## Option 2: Netlify (Very Easy, Free HTTPS)

**No code required!** Just drag & drop.

### Steps

1. **Drag files to Netlify:**
   - Go to https://app.netlify.com/drop
   - Drag `/data/.openclaw/workspace/roof-calculator` folder here
   - Wait 10 seconds

2. **Done!**
   - URL: https://[random-name].netlify.app/
   - HTTPS: ✅ Automatic
   - Cost: $0
   - Can connect custom domain

---

## Option 3: Vercel (Easiest, Free HTTPS)

**Works great with static sites.**

### Steps

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   cd /data/.openclaw/workspace/roof-calculator
   vercel --prod
   ```

3. **Done!**
   - URL: https://roof-calculator.vercel.app/
   - HTTPS: ✅ Automatic
   - Cost: $0

---

## Option 4: Cloudflare Pages (Free, Fast)

**Best performance + free HTTPS + free analytics**

### Steps

1. **Push to GitHub** (see Option 1 first)

2. **Connect to Cloudflare:**
   - Go to https://pages.cloudflare.com
   - Connect GitHub account
   - Select `roof-calculator` repo
   - Click Deploy
   
3. **Done!**
   - URL: https://roof-calculator.pages.dev/
   - HTTPS: ✅ Automatic
   - Cost: $0
   - Free DDoS protection included

---

## Option 5: Your Own VPS (187.77.194.2)

**You already have a VPS running!**

### Steps

1. **SSH to your server:**
   ```bash
   ssh root@187.77.194.2
   ```

2. **Copy files:**
   ```bash
   cd /var/www
   git clone https://github.com/zhanglizeyi/roof-calculator.git
   # Or copy directly
   ```

3. **Use existing Nginx/Apache:**
   - Point domain to `/var/www/roof-calculator`
   - Use existing SSL cert (from ARCH evaluator)

4. **Done!**
   - URL: https://roof.yourdomain.com (custom domain)
   - HTTPS: ✅ Your existing cert
   - Cost: $0 (you already pay for VPS)

---

## ⚡ My Recommendation

**Best for speed:** Use **Option 2 (Netlify drag-drop)**
- Simplest (no CLI)
- Instant deployment
- Free HTTPS
- 10 seconds

**Best for integration:** Use **Option 5 (Your VPS)**
- Same server as ARCH evaluator
- Use existing infrastructure
- Custom domain
- Full control

**Best for GitHub flow:** Use **Option 1 (GitHub Pages)**
- Integrated with Git
- Automatic updates on push
- Works with your GitHub account

---

## Quick Deploy (Netlify - Fastest)

```bash
# 1. Zip the folder
cd /data/.openclaw/workspace
zip -r roof-calculator.zip roof-calculator/

# 2. Go to https://app.netlify.com/drop
# 3. Drag roof-calculator.zip here
# 4. Wait 10 seconds
# 5. You have a public HTTPS URL!
```

---

## After Deployment

**Test your site:**
- Open the HTTPS URL
- Try an address
- Verify it works

**Share publicly:**
- Copy the URL
- Share with contractors/friends
- Gather feedback

**Monitor:**
- Check for errors in console
- Track what people test
- Note accuracy feedback

---

## Custom Domain (Optional, Later)

Once deployed, you can add a custom domain:

```
roof-calculator.archgeneralconstruction.com
roof.yourdomain.com
roofcalc.app
```

All platforms support this with free HTTPS via Let's Encrypt.

---

## Which Do You Want?

Let me know and I can help you through the deployment!

**Quickest:** Netlify drag-drop (10 min)
**Most integrated:** GitHub Pages (15 min)
**Best control:** Your VPS (5 min)

---

Choose one and let's get it live! 🚀
