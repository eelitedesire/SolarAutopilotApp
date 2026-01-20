const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;
let backendProcess;
let dockerStarted = false;
let dockerManager;

// Determine if app is packaged
const isPackaged = app.isPackaged;

// Get correct paths based on whether app is packaged or not
const getProjectRoot = () => {
  if (isPackaged) {
    // In packaged app, resources are in app.asar or extraResources
    return process.resourcesPath;
  } else {
    // In development, parent directory of desktop folder
    return path.join(__dirname, '..');
  }
};

const PROJECT_ROOT = getProjectRoot();

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
  let distPath;
  
  if (isPackaged) {
    // In packaged app, check in resources
    distPath = path.join(PROJECT_ROOT, 'frontend', 'dist', 'index.html');
  } else {
    // In development
    distPath = path.join(PROJECT_ROOT, 'frontend', 'dist', 'index.html');
  }
  
  console.log('Checking frontend build at:', distPath);
  const exists = fs.existsSync(distPath);
  console.log('Frontend build exists:', exists);
  
  return exists;
}

async function startBackend() {
  console.log('Starting backend server...');
  updateLoadingProgress('Starting backend server...', 50);
  
  return new Promise((resolve) => {
    let serverPath;
    let workingDir;
    
    if (isPackaged) {
      serverPath = path.join(PROJECT_ROOT, 'server.js');
      workingDir = PROJECT_ROOT;
    } else {
      serverPath = path.join(PROJECT_ROOT, 'server.js');
      workingDir = PROJECT_ROOT;
    }
    
    console.log('Server path:', serverPath);
    console.log('Working dir:', workingDir);
    console.log('Is packaged:', isPackaged);
    console.log('Platform:', process.platform);
    console.log('Resources path:', PROJECT_ROOT);
    
    // Verify server.js exists
    if (!fs.existsSync(serverPath)) {
      console.error('server.js not found at:', serverPath);
      updateLoadingProgress('❌ server.js not found', 70);
      resolve(false);
      return;
    }
    
    // Set environment variables for the backend
    const env = { 
      ...process.env, 
      NODE_ENV: 'production',
      RESOURCES_PATH: PROJECT_ROOT,
      USER_DATA_PATH: app.getPath('userData'),
      PORT: '3000',
      NODE_PATH: path.join(PROJECT_ROOT, 'node_modules')
    };
    
    console.log('Starting with env:', {
      NODE_ENV: env.NODE_ENV,
      RESOURCES_PATH: env.RESOURCES_PATH,
      PORT: env.PORT,
      NODE_PATH: env.NODE_PATH
    });
    
    try {
      const { fork } = require('child_process');
      
      // Use fork with proper Node.js path
      backendProcess = fork(serverPath, [], {
        cwd: workingDir,
        env: env,
        silent: true,
        execPath: process.execPath // Use Electron's Node.js
      });
      
      let startupOutput = '';
      
      backendProcess.stdout.on('data', (data) => {
        const output = data.toString();
        startupOutput += output;
        console.log(`Backend: ${output}`);
        
        if (output.includes('running on port') || output.includes('Server running')) {
          updateLoadingProgress('✅ Backend server started', 65);
        }
      });
      
      backendProcess.stderr.on('data', (data) => {
        const error = data.toString();
        console.error(`Backend Error: ${error}`);
        
        if (error.includes('EADDRINUSE')) {
          updateLoadingProgress('⚠️ Port 3000 in use, trying to connect...', 60);
        } else if (error.includes('Cannot find module')) {
          updateLoadingProgress('❌ Missing dependencies', 60);
          console.error('Missing module error - check node_modules in:', PROJECT_ROOT);
        }
      });
      
      backendProcess.on('error', (error) => {
        console.error('Failed to start backend:', error);
        updateLoadingProgress('❌ Failed to start backend: ' + error.message, 70);
        showServiceError('Backend error: ' + error.message + '\n\nStack: ' + error.stack);
        resolve(false);
      });
      
      backendProcess.on('exit', (code, signal) => {
        console.log(`Backend process exited with code ${code} and signal ${signal}`);
        if (code !== 0 && code !== null) {
          console.error('Backend startup output:', startupOutput);
          showServiceError('Backend crashed with exit code ' + code + '\n\nOutput:\n' + startupOutput);
        }
      });
      
      // Wait for backend to be ready
      let attempts = 0;
      const maxAttempts = 60;
      
      const checkInterval = setInterval(async () => {
        attempts++;
        const isRunning = await checkPort(3000);
        
        if (isRunning) {
          clearInterval(checkInterval);
          console.log('✅ Backend started successfully');
          updateLoadingProgress('✅ Backend started and serving React app', 70);
          resolve(true);
        } else if (attempts > maxAttempts) {
          clearInterval(checkInterval);
          console.error('❌ Backend failed to start after', maxAttempts, 'attempts');
          console.error('Last backend output:', startupOutput);
          updateLoadingProgress('❌ Backend startup timeout', 70);
          
          if (backendProcess && !backendProcess.killed) {
            backendProcess.kill();
          }
          
          resolve(false);
        } else {
          if (attempts % 5 === 0) {
            updateLoadingProgress(`Starting backend... (${attempts}/${maxAttempts})`, 50 + (attempts / maxAttempts * 20));
          }
        }
      }, 1000);
    } catch (error) {
      console.error('Error spawning backend process:', error);
      updateLoadingProgress('❌ Error starting backend: ' + error.message, 70);
      resolve(false);
    }
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
    console.log('Running mode:', isPackaged ? 'PACKAGED' : 'DEVELOPMENT');
    console.log('Project root:', PROJECT_ROOT);
    
    updateLoadingProgress('Checking Docker...', 5);
    
    // Load docker manager when needed
    if (!dockerManager) {
      dockerManager = require('./docker-manager');
    }
    
    // Start Docker containers first
    if (!dockerStarted) {
      const dockerStatus = await dockerManager.getStatus();
      
      if (dockerStatus.dockerInstalled) {
        console.log('🐳 Docker detected, starting containers...');
        updateLoadingProgress('Starting InfluxDB and Grafana...', 15);
        
        const result = await dockerManager.startAll();
        
        if (result.success) {
          console.log('✅ Docker containers started');
          updateLoadingProgress('✅ Docker containers ready', 30);
          dockerStarted = true;
          
          // Wait for containers to be fully ready and initialize database
          await new Promise(resolve => setTimeout(resolve, 8000));
          
          // Initialize InfluxDB database
          try {
            console.log('🔧 Initializing InfluxDB database...');
            await dockerManager.initializeInfluxDB();
            console.log('✅ InfluxDB database initialized');
          } catch (initError) {
            console.warn('⚠️  InfluxDB initialization failed:', initError.message);
          }
        } else {
          console.warn('⚠️  Docker containers failed to start:', result.error);
          updateLoadingProgress('⚠️  Docker containers failed, continuing...', 30);
        }
      } else {
        console.warn('⚠️  Docker not installed - InfluxDB and Grafana must be installed manually');
        updateLoadingProgress('⚠️  Docker not found, continuing...', 30);
      }
    }
    
    updateLoadingProgress('Checking services...', 35);
    
    const servicesRunning = await checkExistingServices();
    
    // Check if frontend is built
    if (!servicesRunning.frontendBuilt) {
      const errorMsg = isPackaged 
        ? 'Frontend build not found in packaged app. This is a packaging error.'
        : 'Frontend not built. Please run: cd frontend && npm install && npm run build';
      
      showServiceError(errorMsg);
      return;
    }
    console.log('✅ Frontend build found');
    updateLoadingProgress('✅ Frontend ready', 40);
    
    // Start backend if not running
    if (!servicesRunning.backend) {
      const started = await startBackend();
      if (!started) {
        showServiceError('Backend failed to start. Check console logs for details.');
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
            white-space: pre-wrap;
            word-wrap: break-word;
          }
          .debug-info {
            margin-top: 20px;
            font-size: 12px;
            opacity: 0.8;
          }
        </style>
      </head>
      <body>
        <div class="error-container">
          <div class="error-icon">⚠️</div>
          <h1>Service Error</h1>
          <pre>${message}</pre>
          <div class="debug-info">
            <p>Running mode: ${isPackaged ? 'PACKAGED' : 'DEVELOPMENT'}</p>
            <p>Project root: ${PROJECT_ROOT}</p>
            <p>Platform: ${process.platform}</p>
          </div>
          <button class="btn" onclick="location.reload()">Retry</button>
          <button class="btn" onclick="require('electron').shell.openExternal('https://github.com/yourusername/solarautopilot/issues')">Report Issue</button>
        </div>
      </body>
      </html>
    `;
    mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(errorHtml));
  }
}

// App event handlers
app.whenReady().then(() => {
  // Prevent multiple windows
  const gotTheLock = app.requestSingleInstanceLock();
  
  if (!gotTheLock) {
    console.log('Another instance is already running');
    app.quit();
    return;
  }
  
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, focus our window
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
  
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
  
  // Note: We don't stop Docker containers on app close
  // They will keep running for next app launch
  
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