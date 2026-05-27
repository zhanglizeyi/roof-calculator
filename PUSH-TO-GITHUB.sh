#!/bin/bash

# Push Roof Calculator to GitHub
# Run this from your local machine (not the Docker container)

echo "🚀 Pushing Roof Calculator to GitHub..."
echo ""

# Navigate to project
cd /data/.openclaw/workspace/roof-calculator

# Configure git if needed
git config user.email "z@archgeneralconstruction.com"
git config user.name "Z"

# Set remote
git remote set-url origin https://github.com/zhanglizeyi/roof-calculator.git

# Ensure main branch
git branch -M main

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Success! Your code is now on GitHub"
    echo ""
    echo "📍 Repo: https://github.com/zhanglizeyi/roof-calculator"
    echo "🌐 Live site: https://zhanglizeyi.github.io/roof-calculator/"
    echo ""
    echo "⏭️  Next: Enable GitHub Pages in repo Settings"
else
    echo ""
    echo "❌ Push failed. Make sure:"
    echo "  1. You have internet access"
    echo "  2. Personal Access Token is valid (use as password)"
    echo "  3. Repo exists: https://github.com/zhanglizeyi/roof-calculator"
fi
