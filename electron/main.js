// electron/main.js
const { app, BrowserWindow, ipcMain, dialog, session } = require('electron');
const path = require('path');
const fs = require('fs');
const url = require('url');
const pluginsIntegration = require('./plugins-integration');

// Mantener referencia a la ventana principal para evitar que se cierre por GC
let mainWindow;

// Crear la ventana principal
function createWindow() {
  // Configurar CSP seguro pero permitiendo los recursos necesarios
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; " +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " + 
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
          "font-src 'self' https://fonts.gstatic.com; " +
          "img-src 'self' data:;"
        ]
      }
    });
  });

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    frame: false, // Sin bordes para personalizar la UI
    icon: path.join(__dirname, '../public/icon.png')
  });

  // Cargar la aplicación - AJUSTADO PARA TU ENTORNO
  const startUrl = process.env.ELECTRON_START_URL || 'http://localhost:3000';
  
  // Verificar si estamos en desarrollo
  if (process.env.NODE_ENV === 'development' || process.env.ELECTRON_START_URL) {
    // Usar URL de desarrollo
    console.log('Cargando desde URL de desarrollo:', startUrl);
    mainWindow.loadURL(startUrl);
  } else {
    // En producción, cargar desde archivos locales
    console.log('Cargando en modo producción');
    
    // Buscar primero en las ubicaciones más comunes
    let indexPath = '';
    const possiblePaths = [
      path.join(__dirname, '../build/index.html'),
      path.join(__dirname, '../dist/index.html'),
      path.join(__dirname, '../public/index.html'),
      // Añade más rutas posibles aquí si es necesario
    ];
    
    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        indexPath = testPath;
        console.log('Archivo index.html encontrado en:', indexPath);
        break;
      }
    }
    
    if (indexPath) {
      mainWindow.loadFile(indexPath);
    } else {
      console.error('No se pudo encontrar archivo index.html en ninguna ubicación conocida');
      // Mostrar un error más visible
      mainWindow.loadURL('data:text/html,<html><body><h1>Error</h1><p>No se pudo encontrar el archivo principal de la aplicación.</p></body></html>');
    }
  }

  // Abrir DevTools en desarrollo
  if (process.env.NODE_ENV === 'development' || process.env.ELECTRON_START_URL) {
    mainWindow.webContents.openDevTools();
  }

  // Manejar cierre de ventana
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  
  // Registrar eventos de estado de ventana
  mainWindow.on('maximize', () => {
    if (mainWindow?.webContents) {
      mainWindow.webContents.send('window:maximized-change', true);
    }
  });
  
  mainWindow.on('unmaximize', () => {
    if (mainWindow?.webContents) {
      mainWindow.webContents.send('window:maximized-change', false);
    }
  });
  
  mainWindow.on('focus', () => {
    if (mainWindow?.webContents) {
      mainWindow.webContents.send('window:focus-change', true);
    }
  });
  
  mainWindow.on('blur', () => {
    if (mainWindow?.webContents) {
      mainWindow.webContents.send('window:focus-change', false);
    }
  });
}

// Inicializar cuando la app esté lista
app.whenReady().then(() => {
  // Inicializar sistema de plugins
  pluginsIntegration.initialize();
  
  // Crear ventana principal
  createWindow();

  // En macOS, recrear la ventana cuando se hace clic en el ícono del dock
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Salir cuando todas las ventanas estén cerradas, excepto en macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// APIs de IPC para plugins
ipcMain.handle('plugins:getAll', () => {
  return pluginsIntegration.getPlugins();
});

// Seleccionar un plugin para instalarlo
ipcMain.handle('plugins:selectFromFileSystem', async () => {
  if (!mainWindow) return false;
  
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Seleccionar plugin para instalar',
    buttonLabel: 'Instalar',
    message: 'Selecciona la carpeta del plugin'
  });
  
  if (result.canceled || result.filePaths.length === 0) {
    return false;
  }
  
  const pluginPath = result.filePaths[0];
  const pluginInfo = pluginsIntegration.loadPluginFromPath(pluginPath);
  
  if (!pluginInfo) {
    await dialog.showMessageBox(mainWindow, {
      type: 'error',
      title: 'Error al cargar plugin',
      message: 'No se pudo cargar el plugin desde la ruta seleccionada',
      buttons: ['Aceptar']
    });
    return false;
  }
  
  // Aquí podríamos copiar el plugin a la carpeta de plugins si queremos que sea permanente
  // Por ahora, solo lo cargamos en memoria
  
  return true;
});

// Control de ventana (minimizar, maximizar, cerrar)
ipcMain.handle('window:minimize', () => {
  if (mainWindow) mainWindow.minimize();
  return true;
});

ipcMain.handle('window:maximize', () => {
  if (!mainWindow) return false;
  
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
    return false;
  } else {
    mainWindow.maximize();
    return true;
  }
});

ipcMain.handle('window:close', () => {
  if (mainWindow) mainWindow.close();
  return true;
});

ipcMain.handle('window:isMaximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

ipcMain.handle('window:isFocused', () => {
  return mainWindow ? mainWindow.isFocused() : false;
});