# 📦 Download Pre-Built CARBONOZ SolarAutopilot

## ⚡ Quick Download (Recommended)

**Don't build locally!** Download pre-built installers with all dependencies included:

### 🍎 macOS
1. Go to [GitHub Actions](https://github.com/eelitedesire/SolarAutopilotApp/actions)
2. Click on the latest **"Universal Builds"** workflow run
3. Download **`macos-universal`** artifact
4. Extract the ZIP file
5. Open the `.dmg` file and drag the app to Applications
6. **Important:** Right-click the app → "Open" (first time only, due to macOS security)

### 🪟 Windows
1. Go to [GitHub Actions](https://github.com/eelitedesire/SolarAutopilotApp/actions)
2. Click on the latest **"Universal Builds"** workflow run
3. Download **`windows-installers`** artifact
4. Extract the ZIP file
5. Run the `.exe` installer

### 🐧 Linux
1. Go to [GitHub Actions](https://github.com/eelitedesire/SolarAutopilotApp/actions)
2. Click on the latest **"Universal Builds"** workflow run
3. Download **`linux-x64`** or **`linux-arm64-rpi`** (for Raspberry Pi)
4. Extract the ZIP file
5. Run the `.AppImage` file or install the `.deb` package

---

## 🔧 Why Pre-Built Installers?

The pre-built installers include:
- ✅ All Node.js dependencies pre-installed
- ✅ Frontend already built and optimized
- ✅ Backend ready to run
- ✅ No build process needed on your computer
- ✅ Faster startup time
- ✅ No "Installing frontend dependencies..." hang

---

## 🛠️ Building Locally (For Developers Only)

If you want to build from source:

### Prerequisites
```bash
# Install Node.js 18 or higher
node --version  # Should be v18.x or higher
npm --version
```

### Build Steps
```bash
# 1. Clone the repository
git clone https://github.com/eelitedesire/SolarAutopilotApp.git
cd SolarAutopilotApp

# 2. Install root dependencies
npm install

# 3. Build frontend
cd frontend
npm install
npm run build
cd ..

# 4. Install desktop dependencies
cd desktop
npm install

# 5. Build the installer
npm run dist-mac    # For macOS
npm run dist-win    # For Windows
npm run dist-linux  # For Linux

# The installer will be in desktop/dist/
```

---

## ❓ Troubleshooting

### App Stuck at "Installing frontend dependencies..."
**Solution:** You're running the development version. Download the pre-built installer instead (see above).

### macOS: "Cannot be verified" error
**Solution:** Right-click the app → Select "Open" → Click "Open" in the dialog

### Windows: SmartScreen warning
**Solution:** Click "More info" → "Run anyway"

### Linux: Permission denied
**Solution:** 
```bash
chmod +x CARBONOZ-SolarAutopilot-*.AppImage
./CARBONOZ-SolarAutopilot-*.AppImage
```

---

## 🚀 First Time Setup

After installing:
1. Launch the app
2. Wait for services to start (30-60 seconds)
3. Create your CARBONOZ account at [login.carbonoz.com](https://login.carbonoz.com)
4. Configure your solar system settings
5. Connect to Tibber (optional, for dynamic pricing)

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/eelitedesire/SolarAutopilotApp/issues)
- **Website:** [carbonoz.com](https://carbonoz.com)
- **Login:** [login.carbonoz.com](https://login.carbonoz.com)
