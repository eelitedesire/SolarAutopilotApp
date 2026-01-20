# CARBONOZ SolarAutopilot - AI Charging Engine


## Home Assistant Add-on: CARBONOZ SolarAutopilot

CARBONOZ Solar Autopilot is an intelligent AI-powered battery charging system for your Hybrid Solar setup. Our advanced AI engine automatically optimizes battery charging based on real-time solar production, energy prices, and consumption patterns. The system integrates seamlessly with Tibber dynamic pricing to maximize your energy savings and minimize grid dependency. Solar Autopilot is available via Home Assistant Add-On Store so you can still benefit from the many other Home Assistant IoT integrations, features and automations available.

### 🌱 Environmental Impact & CO2 Offsetting

CO2 offsetting is a strategy used to mitigate the impact of greenhouse gas emissions by compensating for them through activities that reduce or remove an equivalent amount of CO2 from the atmosphere. This can include investing in renewable energy projects, reforestation, or other sustainability initiatives. By contributing to CO2 offsets, individuals and businesses can play a significant role in addressing climate change and achieving global carbon neutrality goals.

For solar system owners, CO2 offsetting is particularly relevant. Solar energy systems generate clean, renewable energy, reducing the need for electricity from fossil fuel-powered plants. Each kilowatt-hour (kWh) of solar energy produced prevents the release of a measurable amount of CO2 into the atmosphere. By tracking their system's energy output, solar owners can calculate the amount of CO2 their system offsets and leverage this data for economic and environmental benefits.

Create your own account under  [[https://login.carbonoz.com](https://login.carbonoz.com)/] to become part of our movement to log your electricity production. This also offers you valuable system optimisation advice and make your CO2 offsets marketable. Soon we will offer paybacks for your CO2 offset evidence (under development).


  
![Solar Autopilot](https://carbonoz.com/assets/images/image07.jpg?v=ec2a6fe4)







# SolarAutopilotApp

## 📦 Download & Installation

### ⚡ Quick Start (Recommended)

**Download pre-built installers** with all dependencies included - no building required!

**NEW: Automatic Docker Integration** 🐳
- If you have Docker installed, the app automatically manages InfluxDB and Grafana containers
- No manual database setup needed!
- See [DOCKER_INTEGRATION.md](DOCKER_INTEGRATION.md) for details

#### 🍎 macOS
1. Visit [GitHub Actions](https://github.com/eelitedesire/SolarAutopilotApp/actions)
2. Click the latest **"Universal Builds"** workflow
3. Download **`macos-universal`** artifact
4. Extract and open the `.dmg` file
5. Drag to Applications folder
6. **First launch:** Right-click → "Open" (security requirement)

#### 🪟 Windows
1. Visit [GitHub Actions](https://github.com/eelitedesire/SolarAutopilotApp/actions)
2. Click the latest **"Universal Builds"** workflow
3. Download **`windows-installers`** artifact
4. Extract and run the `.exe` installer

#### 🐧 Linux
1. Visit [GitHub Actions](https://github.com/eelitedesire/SolarAutopilotApp/actions)
2. Click the latest **"Universal Builds"** workflow
3. Download **`linux-x64`** or **`linux-arm64-rpi`** (Raspberry Pi)
4. Extract and run `.AppImage` or install `.deb`

📖 **Detailed instructions:** See [DOWNLOAD_GUIDE.md](DOWNLOAD_GUIDE.md)

---

## 🚀 Features

- 🤖 **AI-Powered Optimization** - Intelligent battery charging based on solar production and consumption patterns
- 📊 **Real-Time Monitoring** - Live energy flow visualization and system status
- 💰 **Dynamic Pricing** - Tibber integration for cost optimization
- 🌱 **CO2 Tracking** - Monitor your environmental impact and carbon offsets
- 📱 **Cross-Platform** - Available for macOS, Windows, Linux, and Home Assistant
- 🔔 **Smart Notifications** - Telegram alerts for important events

---

## 🛠️ For Developers

### Building from Source

**Prerequisites:**
- Node.js 18 or higher
- npm

**Quick Build:**
```bash
# Run the pre-build script
./pre-build.sh

# Then build the installer
cd desktop
npm run dist-mac    # macOS
npm run dist-win    # Windows
npm run dist-linux  # Linux
```

**Manual Build:**
```bash
# 1. Install root dependencies
npm install

# 2. Build frontend
cd frontend
npm install
npm run build
cd ..

# 3. Build desktop app
cd desktop
npm install
npm run dist-mac  # or dist-win, dist-linux
```

### Development Mode
```bash
# Terminal 1: Start backend
npm start

# Terminal 2: Start frontend dev server
cd frontend
npm run dev

# Terminal 3: Start Electron
cd desktop
npm start
```

---

## ❓ Troubleshooting

### App stuck at "Installing frontend dependencies..."
**Solution:** You're running the development version. Download the pre-built installer from GitHub Actions instead.

### macOS: "Cannot be verified" error
**Solution:** Right-click the app → "Open" → "Open" (first time only)

### Windows: SmartScreen warning
**Solution:** Click "More info" → "Run anyway"

### Port already in use
**Solution:** 
```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

---

## 📞 Support & Links

- 🌐 **Website:** [carbonoz.com](https://carbonoz.com)
- 🔐 **Login:** [login.carbonoz.com](https://login.carbonoz.com)
- 🐛 **Issues:** [GitHub Issues](https://github.com/eelitedesire/SolarAutopilotApp/issues)
- 📚 **Documentation:** [DOCS.md](DOCS.md)
- 🏠 **Home Assistant Add-on:** Available in HA Add-on Store

---

## 📄 License

Copyright © 2024 CARBONOZ. All rights reserved.
