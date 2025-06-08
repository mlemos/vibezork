const { app, BrowserWindow, ipcMain, globalShortcut, Menu } = require('electron');
const path = require('path');

class VibeZorkApp {
  constructor() {
    this.mainWindow = null;
    this.isDev = process.env.NODE_ENV === 'development';
  }

  createWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      fullscreen: false, // Start windowed for development
      fullscreenable: true, // Allow fullscreen capability
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
        webSecurity: this.isDev ? false : true // Allow loading from localhost only in development
      },
      show: false
    });

    // Add error handling for the webContents
    this.mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      console.error('Failed to load URL:', validatedURL, 'Error:', errorDescription);
      
      // Try to reload after a delay
      setTimeout(() => {
        console.log('Retrying to load URL...');
        this.mainWindow.loadURL('http://localhost:8080');
      }, 2000);
    });

    this.mainWindow.webContents.on('did-finish-load', () => {
      console.log('Page loaded successfully');
    });

    // Load the app
    if (this.isDev) {
      console.log('Loading development URL: http://localhost:8080');
      this.mainWindow.loadURL('http://localhost:8080');
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../renderer/dist/index.html'));
    }

    this.mainWindow.once('ready-to-show', () => {
      console.log('Window ready to show');
      this.mainWindow.show();
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // Enable native fullscreen on macOS
    if (process.platform === 'darwin') {
      this.mainWindow.setSimpleFullScreen(false);
    }
  }

  setupIPC() {
    // IPC handlers for communication with renderer process
    ipcMain.handle('app:getVersion', () => {
      return app.getVersion();
    });

    ipcMain.handle('game:sendCommand', async (event, command) => {
      // Will be implemented in Phase 2
      console.log('Game command received:', command);
      return { success: true, response: 'Command received (Phase 1 stub)' };
    });

    ipcMain.handle('app:toggleFullscreen', () => {
      if (this.mainWindow) {
        this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
        return this.mainWindow.isFullScreen();
      }
      return false;
    });
  }

  setupMenu() {
    const template = [
      {
        label: 'View',
        submenu: [
          {
            label: 'Toggle Fullscreen',
            accelerator: process.platform === 'darwin' ? 'Ctrl+Cmd+F' : 'F11',
            click: () => {
              if (this.mainWindow) {
                this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
              }
            }
          },
          {
            label: 'Reload',
            accelerator: 'CmdOrCtrl+R',
            click: () => {
              if (this.mainWindow) {
                this.mainWindow.reload();
              }
            }
          },
          {
            label: 'Toggle Developer Tools',
            accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
            click: () => {
              if (this.mainWindow) {
                this.mainWindow.webContents.toggleDevTools();
              }
            }
          }
        ]
      }
    ];

    if (process.platform === 'darwin') {
      template.unshift({
        label: app.getName(),
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          { role: 'services' },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideothers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit' }
        ]
      });
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  init() {
    app.whenReady().then(() => {
      this.createWindow();
      this.setupIPC();
      this.setupMenu();

      // Register global shortcut for fullscreen
      globalShortcut.register(process.platform === 'darwin' ? 'Ctrl+Cmd+F' : 'F11', () => {
        if (this.mainWindow) {
          this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
        }
      });

      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          this.createWindow();
        }
      });
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('will-quit', () => {
      // Unregister all shortcuts
      globalShortcut.unregisterAll();
    });
  }
}

const vibeZorkApp = new VibeZorkApp();
vibeZorkApp.init();