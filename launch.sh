#!/bin/bash

# CARBONOZ SolarAutopilot - Smart Launcher
# This script ensures everything is ready before launching

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$SCRIPT_DIR"

echo "🌞 CARBONOZ SolarAutopilot Launcher"
echo "===================================="
echo ""

# Check if frontend is built
if [ ! -f "$PROJECT_ROOT/frontend/dist/index.html" ]; then
    echo -e "${YELLOW}⚠️  Frontend not built yet${NC}"
    echo ""
    echo "You have two options:"
    echo ""
    echo "1. Download pre-built installer (RECOMMENDED):"
    echo "   https://github.com/eelitedesire/SolarAutopilotApp/actions"
    echo ""
    echo "2. Build it now (takes 10-30 minutes):"
    echo "   bash pre-build.sh"
    echo ""
    read -p "Build now? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        bash "$PROJECT_ROOT/pre-build.sh"
    else
        echo "Please download the pre-built installer instead."
        exit 0
    fi
fi

# Check if backend dependencies are installed
if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    cd "$PROJECT_ROOT"
    npm install
fi

# Check if port 3000 is available
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port 3000 is already in use${NC}"
    read -p "Kill the process and continue? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        lsof -ti:3000 | xargs kill -9 2>/dev/null
        echo -e "${GREEN}✅ Port cleared${NC}"
    else
        exit 0
    fi
fi

echo ""
echo -e "${GREEN}✅ All checks passed!${NC}"
echo ""
echo "Starting CARBONOZ SolarAutopilot..."
echo "The app will open in a few seconds..."
echo ""

# Start the desktop app
cd "$PROJECT_ROOT/desktop"
npm start
