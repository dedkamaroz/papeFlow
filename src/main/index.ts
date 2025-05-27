import { app, BrowserWindow, ipcMain, protocol } from 'electron';
import path from 'path';
import { initDatabase } from './database/init';
import { registerIpcHandlers } from './ipc/handlers';

let mainWindow: BrowserWindow | null = null;

const isDevelopment = process.env.NODE_ENV !== 'production';

// Handle protocol for production
if (!isDevelopment) {
  protocol.registerSchemesAsPrivileged([
    { scheme: 'app', privileges: { secure: true, standard: true } }
  ]);
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: !isDevelopment, // Disable web security in development only
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#ffffff',
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  if (isDevelopment) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // Load the index.html from the dist folder
    const indexPath = path.join(__dirname, '../renderer/index.html');
    console.log('Loading production build from:', indexPath);
    
    mainWindow.loadFile(indexPath).catch(err => {
      console.error('Failed to load index.html:', err);
      // Fallback: try alternative path
      mainWindow.loadFile(path.join(app.getAppPath(), 'dist/renderer/index.html')).catch(err2 => {
        console.error('Failed to load from alternative path:', err2);
      });
    });
  }
  
  // DevTools will only open automatically in development mode

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  // Initialize database
  await initDatabase();
  
  // Register IPC handlers
  registerIpcHandlers();
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle app updates and other lifecycle events
app.on('before-quit', () => {
  // Cleanup tasks
});