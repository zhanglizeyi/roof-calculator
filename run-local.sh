#!/bin/bash

# Roof Calculator - Local Development Server
# Usage: ./run-local.sh

echo "🏠 Roof Calculator - Local Test Server"
echo "======================================="
echo ""
echo "Starting server..."
echo ""

# Check if Python 3 is available
if command -v python3 &> /dev/null; then
    echo "✅ Using Python 3"
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    echo "✅ Using Python"
    python -m http.server 8000
else
    echo "❌ Error: Python not found"
    echo "Please install Python 3 or run manually:"
    echo "  python -m http.server 8000"
    exit 1
fi
