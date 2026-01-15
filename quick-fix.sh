#!/bin/bash

# CARBONOZ SolarAutopilot - Quick Fix for Stuck Loading
# Run this if your app is stuck at "Installing frontend dependencies..."

set -e

echo "🔧 CARBONOZ SolarAutopilot - Quick Fix"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$SCRIPT_DIR"

echo -e "${YELLOW}This script will prepare your app to run properly.${NC}"
echo ""

# Kill any running processes
echo "🛑 Stopping any running processes..."
pkill -f "CARBONOZ SolarAutopilot" || true
pkill -f "node.*server.js" || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
echo -e "${GREEN}✅ Processes stopped${NC}"
echo ""

# Build frontend if not exists
if [ ! -f "$PROJECT_ROOT/frontend/dist/index.html" ]; then
    echo "🎨 Building frontend (this may take a few minutes)..."
    cd "$PROJECT_ROOT/frontend"
    
    if [ ! -d "node_modules" ]; then
        echo "Installing frontend dependencies..."
        npm install --force
    fi
    
    echo "Building React app..."
    npm run build
    
    if [ -f "dist/index.html" ]; then
        echo -e "${GREEN}✅ Frontend built successfully${NC}"
    else
        echo -e "${RED}❌ Frontend build failed${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Frontend already built${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Fix completed!${NC}"
echo ""
echo "You can now:"
echo "  1. Launch the app normally"
echo "  2. Or download pre-built installer from:"
echo "     https://github.com/eelitedesire/SolarAutopilotApp/actions"
echo ""
