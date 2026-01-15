#!/bin/bash

# CARBONOZ SolarAutopilot - Pre-Build Script
# This script prepares the app for distribution by building all dependencies

set -e  # Exit on error

echo "🌞 CARBONOZ SolarAutopilot - Pre-Build Script"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$SCRIPT_DIR"

echo -e "${YELLOW}📍 Project root: $PROJECT_ROOT${NC}"
echo ""

# Check Node.js version
echo "🔍 Checking Node.js version..."
NODE_VERSION=$(node --version)
echo -e "${GREEN}✅ Node.js $NODE_VERSION${NC}"
echo ""

# Step 1: Install root dependencies
echo "📦 Step 1/4: Installing root dependencies..."
cd "$PROJECT_ROOT"
npm install --force
echo -e "${GREEN}✅ Root dependencies installed${NC}"
echo ""

# Step 2: Build frontend
echo "🎨 Step 2/4: Building frontend..."
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
    echo -e "${RED}❌ Frontend build failed - dist/index.html not found${NC}"
    exit 1
fi
echo ""

# Step 3: Install desktop dependencies
echo "🖥️  Step 3/4: Installing desktop dependencies..."
cd "$PROJECT_ROOT/desktop"
npm install --force
echo -e "${GREEN}✅ Desktop dependencies installed${NC}"
echo ""

# Step 4: Verify build
echo "🔍 Step 4/4: Verifying build..."
CHECKS_PASSED=true

# Check frontend dist
if [ ! -f "$PROJECT_ROOT/frontend/dist/index.html" ]; then
    echo -e "${RED}❌ Frontend dist not found${NC}"
    CHECKS_PASSED=false
else
    echo -e "${GREEN}✅ Frontend dist exists${NC}"
fi

# Check server.js
if [ ! -f "$PROJECT_ROOT/server.js" ]; then
    echo -e "${RED}❌ server.js not found${NC}"
    CHECKS_PASSED=false
else
    echo -e "${GREEN}✅ server.js exists${NC}"
fi

# Check desktop main.js
if [ ! -f "$PROJECT_ROOT/desktop/main.js" ]; then
    echo -e "${RED}❌ desktop/main.js not found${NC}"
    CHECKS_PASSED=false
else
    echo -e "${GREEN}✅ desktop/main.js exists${NC}"
fi

echo ""

if [ "$CHECKS_PASSED" = true ]; then
    echo -e "${GREEN}🎉 Pre-build completed successfully!${NC}"
    echo ""
    echo "Next steps:"
    echo "  cd desktop"
    echo "  npm run dist-mac    # For macOS"
    echo "  npm run dist-win    # For Windows"
    echo "  npm run dist-linux  # For Linux"
    echo ""
    echo "Or run the app in development mode:"
    echo "  npm start"
else
    echo -e "${RED}❌ Pre-build failed - please check errors above${NC}"
    exit 1
fi
