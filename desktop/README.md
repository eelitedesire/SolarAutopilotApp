# CARBONOZ SolarAutopilot Desktop App

## ⚠️ Important: Don't Build Locally!

If you're seeing this, you probably want to **download the pre-built installer** instead of building from source.

### 📦 Download Pre-Built Installer (Recommended)

1. Go to [GitHub Actions](https://github.com/eelitedesire/SolarAutopilotApp/actions)
2. Click on the latest **"Universal Builds"** workflow run
3. Download the artifact for your platform:
   - **macOS:** `macos-universal`
   - **Windows:** `windows-installers`
   - **Linux:** `linux-x64` or `linux-arm64-rpi`
4. Extract and install

**Benefits:**
- ✅ All dependencies included
- ✅ No build process needed
- ✅ Faster startup
- ✅ No "Installing frontend dependencies..." hang

---

## 🛠️ Building from Source (Developers Only)

### Prerequisites
- Node.js 18+
- npm

### Quick Build
```bash
# From project root
./pre-build.sh

# Then build installer
cd desktop
npm run dist-mac    # macOS
npm run dist-win    # Windows
npm run dist-linux  # Linux
```

### Manual Build Steps
```bash
# 1. From project root, install dependencies
npm install

# 2. Build frontend
cd frontend
npm install
npm run build
cd ..

# 3. Build desktop app
cd desktop
npm install

# 4. Create installer
npm run dist-mac    # macOS
npm run dist-win    # Windows
npm run dist-linux  # Linux

# Installer will be in desktop/dist/
```

### Development Mode
```bash
# Terminal 1: Start backend (from project root)
npm start

# Terminal 2: Start frontend dev server
cd frontend
npm run dev

# Terminal 3: Start Electron
cd desktop
npm start
```

---

## 🔧 Troubleshooting

### App stuck at "Installing frontend dependencies..."
**Problem:** The app is trying to build the frontend on first launch.

**Solution 1 (Recommended):** Download pre-built installer from GitHub Actions

**Solution 2:** Run the quick fix:
```bash
# From project root
./quick-fix.sh
```

**Solution 3:** Build frontend manually:
```bash
cd frontend
npm install
npm run build
```

### "Cannot find module" errors
```bash
# Install all dependencies
npm install
cd frontend && npm install && cd ..
cd desktop && npm install && cd ..
```

### Port 3000 already in use
```bash
# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

## 📁 Build Output

After building, installers are in `desktop/dist/`:

- **macOS:** `.dmg` file
- **Windows:** `.exe` installer and portable `.exe`
- **Linux:** `.AppImage` and `.deb` packages

---

## 🚀 Distribution

The GitHub Actions workflow automatically builds installers for all platforms when you push a tag:

```bash
git tag v1.0.0
git push origin v1.0.0
```

Installers will be available in GitHub Actions artifacts.

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/eelitedesire/SolarAutopilotApp/issues)
- **Documentation:** [Main README](../README.md)
- **Download Guide:** [DOWNLOAD_GUIDE.md](../DOWNLOAD_GUIDE.md)
