const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');
const fs = require('fs');

let mainWindow;
let backendProcess;

// Get project root (parent directory of desktop folder)
const PROJECT_ROOT = path.join(__dirname, '..');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    icon: path.join(__dirname, 'assets/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'default',
    show: false
  });

  showLoadingScreen();

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

function showLoadingScreen() {
  const loadingHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' data: https:; img-src 'self' data: https:; script-src 'self' 'unsafe-inline'">
      <title>CARBONOZ SolarAutopilot - Starting...</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; 
          background: rgba(24, 27, 31, 1);
          color: white;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          overflow: hidden;
        }
        .particles { position: absolute; inset: 0; overflow: hidden; }
        .particle {
          position: absolute;
          width: 4px;
          height: 4px;
          background: #facc15;
          border-radius: 50%;
          opacity: 0.3;
          animation: pulse 2s infinite;
        }
        .loading-container { 
          position: relative; 
          z-index: 10; 
          text-align: center; 
          max-width: 28rem; 
          padding: 1.5rem;
        }
        .spinner-container { 
          position: relative; 
          width: 6rem; 
          height: 6rem; 
          margin: 0 auto 2rem;
        }
        .ring {
          position: absolute;
          inset: 0;
          border: 4px solid rgba(250, 204, 21, 0.2);
          border-radius: 50%;
          animation: spin 3s linear infinite;
        }
        .ring-middle {
          inset: 0.5rem;
          border-color: rgba(74, 222, 128, 0.3);
          animation: spin 2s linear infinite reverse;
        }
        .logo-circle {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .logo-img {
          width: 3rem;
          height: 3rem;
          border-radius: 50%;
          object-fit: cover;
          animation: pulse 2s infinite;
        }
        .icon-badge {
          position: absolute;
          width: 2rem;
          height: 2rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: bounce 1s infinite;
        }
        .icon-badge-1 { top: -0.5rem; right: -0.5rem; background: #3b82f6; animation-delay: 0.5s; }
        .icon-badge-2 { bottom: -0.5rem; left: -0.5rem; background: #22c55e; animation-delay: 1s; }
        .brand-title { font-size: 1.875rem; font-weight: bold; color: #DEAF0B; margin-bottom: 0.5rem; }
        .brand-subtitle { font-size: 1.25rem; font-weight: 600; color: rgba(255,255,255,0.9); margin-bottom: 0.25rem; }
        .brand-desc { font-size: 0.875rem; color: rgba(255,255,255,0.6); margin-bottom: 1.5rem; }
        .progress-container { margin-bottom: 1.5rem; }
        .progress-bar-bg {
          width: 100%;
          height: 0.5rem;
          background: rgba(255,255,255,0.1);
          border-radius: 9999px;
          overflow: hidden;
          margin-bottom: 0.75rem;
        }
        .progress-bar {
          height: 100%;
          background: #22c55e;
          border-radius: 9999px;
          transition: width 0.3s ease;
          position: relative;
        }
        .progress-bar::after {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(255,255,255,0.3);
          animation: pulse 1s infinite;
        }
        .progress-text { font-size: 0.875rem; color: rgba(255,255,255,0.7); }
        .status { font-size: 0.875rem; font-weight: 500; color: rgba(255,255,255,0.8); margin-bottom: 1rem; animation: pulse 1s infinite; }
        .dots { display: flex; justify-content: center; gap: 0.5rem; margin-bottom: 1.5rem; }
        .dot {
          width: 0.5rem;
          height: 0.5rem;
          background: #facc15;
          border-radius: 50%;
          animation: pulse 1s infinite;
        }
        .dot:nth-child(2) { animation-delay: 0.2s; }
        .dot:nth-child(3) { animation-delay: 0.4s; }
        .footer-text { font-size: 0.75rem; color: rgba(255,255,255,0.5); }
        .log { 
          margin-top: 1rem; 
          padding: 0.75rem; 
          background: rgba(0,0,0,0.3); 
          border-radius: 0.375rem; 
          font-size: 0.75rem;
          max-height: 120px;
          overflow-y: auto;
          text-align: left;
          color: rgba(255,255,255,0.7);
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
      </style>
    </head>
    <body>
      <div class="particles" id="particles"></div>
      <div class="loading-container">
        <div class="spinner-container">
          <div class="ring"></div>
          <div class="ring ring-middle"></div>
          <div class="logo-circle">
            <img src="https://carbonoz.com/assets/images/image04.jpg?v=8b5d1d9b" alt="CARBONOZ" class="logo-img" />
          </div>
          <div class="icon-badge icon-badge-1">⚡</div>
          <div class="icon-badge icon-badge-2">🍃</div>
        </div>
        <div>
          <h1 class="brand-title">CARBONOZ</h1>
          <h2 class="brand-subtitle">SolarAutopilot</h2>
          <p class="brand-desc">AI-Powered Solar Energy Management</p>
        </div>
        <div class="progress-container">
          <div class="progress-bar-bg">
            <div class="progress-bar" id="progress"></div>
          </div>
          <div class="progress-text"><span id="progressPercent">0</span>% Complete</div>
        </div>
        <div class="status" id="status">Starting services...</div>
        <div class="dots">
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        </div>
        <div class="footer-text">Optimizing your renewable energy experience</div>
        <div class="log" id="log"></div>
      </div>
      <script>
        const particles = document.getElementById('particles');
        for(let i=0; i<20; i++) {
          const p = document.createElement('div');
          p.className = 'particle';
          p.style.left = Math.random()*100 + '%';
          p.style.top = Math.random()*100 + '%';
          p.style.animationDelay = Math.random()*2 + 's';
          p.style.animationDuration = (2+Math.random()*3) + 's';
          particles.appendChild(p);
        }
      </script>
    </body>
    </html>
  `;
  
  mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(loadingHtml));
}

function updateLoadingProgress(message, progress) {
  if (mainWindow && mainWindow.webContents) {
    const safeMessage = message.replace(/'/g, "\\'").replace(/\n/g, '\\n');
    
    mainWindow.webContents.executeJavaScript(`
      try {
        const statusEl = document.getElementById('status');
        const progressEl = document.getElementById('progress');
        const progressPercent = document.getElementById('progressPercent');
        const logEl = document.getElementById('log');
        
        if (statusEl) statusEl.textContent = '${safeMessage}';
        if (progressEl) progressEl.style.width = '${progress}%';
        if (progressPercent) progressPercent.textContent = '${Math.round(progress)}';
        if (logEl) {
          const entry = document.createElement('div');
          entry.textContent = '${safeMessage}';
          logEl.appendChild(entry);
          logEl.scrollTop = logEl.scrollHeight;
        }
      } catch (e) {
        console.log('Progress update error:', e);
      }
    `).catch(() => {});
  }
}

function checkPort(port) {
  return new Promise((resolve) => {
    const http = require('http');
    const req = http.get(`http://localhost:${port}`, { timeout: 2000 }, (res) => {
      resolve(true);
    }).on('error', () => {
      resolve(false);
    }).on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

function checkFrontendBuild() {
  const distPath = path.join(PROJECT_ROOT, 'frontend', 'dist', 'index.html');
  return fs.existsSync(distPath);
}

async function startBackend() {
  console.log('Starting backend server...');
  updateLoadingProgress('Starting backend server...', 50);
  
  return new Promise((resolve) => {
    const serverPath = path.join(PROJECT_ROOT, 'server.js');
    
    // Set NODE_ENV to production so it serves static files
    const env = { ...process.env, NODE_ENV: 'production' };
    
    backendProcess = spawn('node', [serverPath], {
      cwd: PROJECT_ROOT,
      stdio: 'pipe',
      env: env
    });
    
    backendProcess.stdout.on('data', (data) => {
      console.log(`Backend: ${data}`);
    });
    
    backendProcess.stderr.on('data', (data) => {
      console.error(`Backend Error: ${data}`);
    });
    
    // Wait for backend to be ready
    let attempts = 0;
    const checkInterval = setInterval(async () => {
      attempts++;
      const isRunning = await checkPort(3000);
      
      if (isRunning) {
        clearInterval(checkInterval);
        console.log('✅ Backend started successfully');
        updateLoadingProgress('✅ Backend started and serving React app', 70);
        resolve(true);
      } else if (attempts > 30) {
        clearInterval(checkInterval);
        console.error('❌ Backend failed to start');
        updateLoadingProgress('❌ Backend failed to start', 70);
        resolve(false);
      }
    }, 1000);
  });
}

async function checkExistingServices() {
  updateLoadingProgress('Checking existing services...', 10);
  
  const results = {
    backend: await checkPort(3000),
    frontendBuilt: checkFrontendBuild()
  };
  
  console.log('Service status:', results);
  return results;
}

async function initializeServices() {
  try {
    console.log('🚀 Initializing CARBONOZ SolarAutopilot services...');
    updateLoadingProgress('Checking services...', 5);
    
    const servicesRunning = await checkExistingServices();
    
    // Check if frontend is built
    if (!servicesRunning.frontendBuilt) {
      showServiceError('Frontend not built. Please download the pre-built installer from:\n\nhttps://github.com/eelitedesire/SolarAutopilotApp/actions\n\nOr build manually:\ncd frontend && npm install && npm run build');
      return;
    }
    console.log('✅ Frontend already built');
    updateLoadingProgress('✅ Frontend ready', 40);
    
    // Start backend if not running
    if (!servicesRunning.backend) {
      const started = await startBackend();
      if (!started) {
        showServiceError('Backend failed to start. Check if server.js exists and all dependencies are installed.');
        return;
      }
    } else {
      console.log('✅ Backend already running');
      updateLoadingProgress('✅ Backend already running', 70);
    }
    
    // Load the application
    updateLoadingProgress('Loading application...', 90);
    
    setTimeout(async () => {
      try {
        await mainWindow.loadURL('http://localhost:3000');
        console.log('✅ Application loaded successfully');
        updateLoadingProgress('✅ Application ready', 100);
      } catch (error) {
        console.error('Failed to load application:', error);
        showServiceError('Failed to connect to application. Backend may still be starting...');
      }
    }, 2000);
    
  } catch (error) {
    console.error('❌ Failed to initialize services:', error);
    showServiceError(error.message);
  }
}

function showServiceError(message) {
  if (mainWindow) {
    const errorHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>CARBONOZ SolarAutopilot - Error</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, sans-serif; 
            margin: 0; 
            padding: 40px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white;
            text-align: center;
          }
          .error-container { max-width: 600px; margin: 0 auto; }
          .error-icon { font-size: 64px; margin-bottom: 20px; }
          .btn { 
            background: #4CAF50; 
            color: white; 
            padding: 12px 24px; 
            border: none; 
            border-radius: 6px; 
            cursor: pointer; 
            font-size: 16px;
            margin: 10px;
          }
          .btn:hover { background: #45a049; }
          pre {
            background: rgba(0,0,0,0.3);
            padding: 15px;
            border-radius: 5px;
            text-align: left;
            overflow-x: auto;
          }
        </style>
      </head>
      <body>
        <div class="error-container">
          <div class="error-icon">⚠️</div>
          <h1>Service Error</h1>
          <pre>${message}</pre>
          <p>Please check:</p>
          <ul style="text-align: left; display: inline-block;">
            <li>Frontend is built (run 'npm run build' in frontend directory)</li>
            <li>Backend dependencies are installed</li>
            <li>server.js exists in parent directory</li>
          </ul>
          <button class="btn" onclick="location.reload()">Retry</button>
        </div>
      </body>
      </html>
    `;
    mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(errorHtml));
  }
}

// App event handlers
app.whenReady().then(() => {
  createWindow();
  setTimeout(initializeServices, 1000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Clean up processes
  if (backendProcess) {
    console.log('Stopping backend process...');
    backendProcess.kill();
  }
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  // Ensure cleanup
  if (backendProcess) backendProcess.kill();
});

// Menu
const template = [
  {
    label: 'File',
    submenu: [
      {
        label: 'Reload',
        accelerator: 'CmdOrCtrl+R',
        click: () => {
          if (mainWindow) {
            mainWindow.reload();
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Quit',
        accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
        click: () => app.quit()
      }
    ]
  },
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  },
  {
    label: 'Services',
    submenu: [

      {
        label: 'Restart Backend',
        click: async () => {
          if (backendProcess) {
            backendProcess.kill();
          }
          await startBackend();
          if (mainWindow) {
            setTimeout(() => mainWindow.reload(), 2000);
          }
        }
      },
      {
        label: 'Open Backend in Browser',
        click: () => shell.openExternal('http://localhost:3000')
      }
    ]
  },
  {
    label: 'Help',
    submenu: [
      {
        label: 'About CARBONOZ SolarAutopilot',
        click: () => shell.openExternal('https://carbonoz.com')
      },
      {
        label: 'View Logs',
        click: () => {
          if (mainWindow) {
            mainWindow.webContents.openDevTools();
          }
        }
      }
    ]
  }
];

Menu.setApplicationMenu(Menu.buildFromTemplate(template));