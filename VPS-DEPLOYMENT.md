# 🚀 Deploy to Your Hostinger VPS (187.77.194.2)

## Quick Deploy (5 minutes)

### Step 1: Download Files to Your VPS

SSH into your VPS:
```bash
ssh root@187.77.194.2
```

Download the roof calculator package (from this workspace):
```bash
cd /var/www
wget https://[your-file-server]/roof-calculator.tar.gz
# OR copy manually if you have the file
tar -xzf roof-calculator.tar.gz
cd roof-calculator
```

Or create directory and copy files manually:
```bash
mkdir -p /var/www/roof-calculator
# Copy index.html, app.js, style.css, modules/ to /var/www/roof-calculator/
```

### Step 2: Create Nginx Config

```bash
cat > /etc/nginx/sites-available/roof-calculator << 'EOF'
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name roof.archgeneralconstruction.com;

    # Use your existing SSL cert (from ARCH evaluator)
    ssl_certificate /etc/letsencrypt/live/archgeneralconstruction.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/archgeneralconstruction.com/privkey.pem;

    root /var/www/roof-calculator;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    # Cache assets
    location ~* \.(js|css|png|jpg|gif|svg|woff|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Allow CORS for APIs
    add_header Access-Control-Allow-Origin "*" always;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name roof.archgeneralconstruction.com;
    return 301 https://$server_name$request_uri;
}
EOF
```

### Step 3: Enable & Reload

```bash
# Test config
nginx -t

# Enable site
ln -sf /etc/nginx/sites-available/roof-calculator /etc/nginx/sites-enabled/

# Reload nginx
systemctl reload nginx
```

### Step 4: Done!

Visit: **https://roof.archgeneralconstruction.com**

---

## Domain Options

Choose one:

**Option A: Subdomain (Easiest)**
```
https://roof.archgeneralconstruction.com
```
(Uses existing domain + SSL cert)

**Option B: Custom subdomain (If you want)**
```
https://roofcalc.archgeneralconstruction.com
```
(Add to existing cert or create new one)

---

## Verify Deployment

After nginx reload:

```bash
# Check service running
systemctl status nginx

# Check file permissions
ls -la /var/www/roof-calculator/

# Check access logs
tail -f /var/access.log | grep roof-calculator
```

---

## If You Get SSL Errors

If SSL cert doesn't match domain, run:

```bash
# Renew / add domain to cert
certbot --nginx -d roof.archgeneralconstruction.com

# Or use existing cert:
# Just update the ssl_certificate paths above
```

---

## Files Included

The deployment includes:
- ✅ index.html (UI)
- ✅ app.js (Controller)
- ✅ style.css (Styling)
- ✅ modules/ (7 feature modules)
- ✅ All documentation

Everything runs in browser — no backend needed.

---

## Quick Commands (Copy-Paste Ready)

```bash
# SSH to VPS
ssh root@187.77.194.2

# Create directory
mkdir -p /var/www/roof-calculator

# Copy files (if you have them locally):
# scp -r roof-calculator/* root@187.77.194.2:/var/www/roof-calculator/

# Check it exists
ls -lah /var/www/roof-calculator/

# Create nginx config
cat > /etc/nginx/sites-available/roof-calculator << 'EOF'
server {
    listen 443 ssl http2;
    server_name roof.archgeneralconstruction.com;
    ssl_certificate /etc/letsencrypt/live/archgeneralconstruction.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/archgeneralconstruction.com/privkey.pem;
    root /var/www/roof-calculator;
    index index.html;
    location / { try_files $uri $uri/ =404; }
}
server {
    listen 80;
    server_name roof.archgeneralconstruction.com;
    return 301 https://$server_name$request_uri;
}
EOF

# Enable it
ln -sf /etc/nginx/sites-available/roof-calculator /etc/nginx/sites-enabled/

# Test & reload
nginx -t && systemctl reload nginx

# Check it's running
systemctl status nginx
```

---

## Done!

Your roof calculator is now live at:
**https://roof.archgeneralconstruction.com** (or your chosen domain)

With HTTPS ✅, using your existing infrastructure, and $0 additional cost.

---

## Next Steps

1. ✅ Copy files to VPS
2. ✅ Create Nginx config
3. ✅ Test & reload
4. ✅ Visit HTTPS URL
5. 📱 Share with testers
6. 📊 Gather feedback
7. 🔧 Iterate on costs/detection

Ready?
