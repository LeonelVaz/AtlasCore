/**
 * Gestión de ventanas para la aplicación Electron
 */

const { app, BrowserWindow, ipcMain } = require('electron');

class WindowManager {
  constructor() {
    this.mainWindow = null;
  }

  /**
   * Crea la ventana principal de la aplicación
   * @param {string} startUrl - URL inicial para cargar
   */
  createMainWindow(startUrl) {
    // Crear la ventana del navegador
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: require('path').join(__dirname, 'preload.js')
      },
      icon: require('path').join(__dirname, '../public/favicon.ico'),
      frame: false, // Sin marco para personalizar los controles de ventana
      titleBarStyle: 'hidden',
      backgroundColor: '#FFFFFF'
    });

    // Cargar la aplicación
    this.mainWindow.loadURL(startUrl);

    // Configurar eventos de ventana
    this.setupWindowEvents();
  }

  /**
   * Configura los eventos para la manipulación de la ventana
   */
  setupWindowEvents() {
    if (!this.mainWindow) return;

    // Emitido cuando la ventana es cerrada
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // Configurar IPC para controlar la ventana desde el renderer
    ipcMain.on('window:minimize', () => {
      if (this.mainWindow) this.mainWindow.minimize();
    });

    ipcMain.on('window:maximize', () => {
      if (this.mainWindow) {
        if (this.mainWindow.isMaximized()) {
          this.mainWindow.unmaximize();
        } else {
          this.mainWindow.maximize();
        }
      }
    });

    ipcMain.on('window:close', () => {
      if (this.mainWindow) this.mainWindow.close();
    });
  }

  /**
   * Obtiene la ventana principal
   * @returns {BrowserWindow|null} - Instancia de la ventana principal o null
   */
  getMainWindow() {
    return this.mainWindow;
  }
}

// Exportar una única instancia para toda la aplicación
module.exports = new WindowManager();