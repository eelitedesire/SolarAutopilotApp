# Docker Integration Guide

## Overview
CARBONOZ SolarAutopilot now automatically manages Docker containers for InfluxDB and Grafana. If you have Docker installed, the app will handle everything automatically.

## Requirements

### Option 1: Automatic (Recommended)
- **Docker Desktop** installed on your computer
- That's it! The app handles the rest.

### Option 2: Manual
If you don't want to use Docker:
- Install InfluxDB manually
- Install Grafana manually
- Configure connection settings

## How It Works

### First Launch
1. App checks if Docker is installed
2. If found, automatically creates and starts:
   - **InfluxDB** container (port 8086, 8087)
   - **Grafana** container (port 3001)
3. Containers persist between app restarts
4. Data is stored in Docker volumes (survives container restarts)

### Subsequent Launches
- App checks if containers are running
- Starts them if stopped
- Continues if already running

## Docker Installation

### macOS
```bash
# Download Docker Desktop from:
https://www.docker.com/products/docker-desktop

# Or install via Homebrew:
brew install --cask docker
```

### Windows
```bash
# Download Docker Desktop from:
https://www.docker.com/products/docker-desktop

# Requires WSL2 on Windows 10/11
```

### Linux
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install docker.io docker-compose

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group (no sudo needed)
sudo usermod -aG docker $USER
```

## Container Details

### InfluxDB
- **Image**: influxdb:1.8
- **Ports**: 8086 (HTTP), 8087 (RPC)
- **Database**: solarautopilot (auto-created)
- **Volume**: solarautopilot-influxdb-data
- **Auth**: Disabled (local only)

### Grafana
- **Image**: grafana/grafana:latest
- **Port**: 3001
- **Default Login**: admin/admin
- **Volume**: solarautopilot-grafana-data
- **Embedding**: Enabled

## Manual Container Management

### View Running Containers
```bash
docker ps
```

### Stop Containers
```bash
docker stop solarautopilot-influxdb
docker stop solarautopilot-grafana
```

### Start Containers
```bash
docker start solarautopilot-influxdb
docker start solarautopilot-grafana
```

### Remove Containers (keeps data)
```bash
docker rm solarautopilot-influxdb
docker rm solarautopilot-grafana
```

### Remove Everything (including data)
```bash
docker rm -f solarautopilot-influxdb solarautopilot-grafana
docker volume rm solarautopilot-influxdb-data solarautopilot-grafana-data
```

## Troubleshooting

### Docker Not Found
**Error**: "Docker is not installed"
**Solution**: Install Docker Desktop and restart the app

### Port Already in Use
**Error**: "Port 8086 already in use"
**Solution**: 
```bash
# Find what's using the port
lsof -i :8086  # macOS/Linux
netstat -ano | findstr :8086  # Windows

# Stop the conflicting service or change ports
```

### Container Won't Start
**Solution**:
```bash
# Check Docker logs
docker logs solarautopilot-influxdb
docker logs solarautopilot-grafana

# Restart Docker Desktop
# Then restart the app
```

### Data Loss Prevention
All data is stored in Docker volumes:
- `solarautopilot-influxdb-data` - Time-series data
- `solarautopilot-grafana-data` - Dashboards and settings

These volumes persist even if containers are removed.

## Benefits

✅ **Zero Configuration** - Works out of the box with Docker
✅ **Automatic Updates** - Pull latest images anytime
✅ **Data Persistence** - Survives app restarts
✅ **Easy Cleanup** - Remove containers without affecting data
✅ **Cross-Platform** - Same experience on all OS
✅ **Isolated** - Doesn't interfere with system

## Without Docker

If you prefer not to use Docker:
1. Install InfluxDB from https://www.influxdata.com/downloads/
2. Install Grafana from https://grafana.com/grafana/download
3. Configure connection settings in the app
4. The app will work the same way

## FAQ

**Q: Do containers run when app is closed?**
A: Yes, containers keep running. This is intentional for data collection.

**Q: How much disk space do containers use?**
A: ~500MB for images, data grows with usage (typically 100-500MB/month)

**Q: Can I use existing InfluxDB/Grafana?**
A: Yes, the app will use existing containers if they match the names.

**Q: How do I backup my data?**
A: 
```bash
docker run --rm -v solarautopilot-influxdb-data:/data -v $(pwd):/backup alpine tar czf /backup/influxdb-backup.tar.gz /data
```

**Q: Does this work on Raspberry Pi?**
A: Yes! Use ARM-compatible images (automatically handled).
