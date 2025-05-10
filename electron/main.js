// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Determinar si estamos en desarrollo
const isDev = !app.isPackaged;

// Desactivar advertencias de seguridad en modo desarrollo
if (isDev) {
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
}

// Mantener una referencia global del objeto window
let mainWindow;

function createWindow() {
  // Configurar CSP según el entorno
  /* ... resto del código CSP (no cambia) ... */

  // Crear la ventana del navegador
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false, // Sin marco para personalizar la ventana
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false
    }
  });

  // Cargar la URL adecuada
  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../dist/index.html')}`;
    
  console.log('Cargando URL:', startUrl);
  mainWindow.loadURL(startUrl);

  // Detectar cambios en el estado maximizado/restaurado
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('maximize-change', true);
  });

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('maximize-change', false);
  });

  // Detectar cuando la ventana recibe o pierde el enfoque
  mainWindow.on('focus', () => {
    mainWindow.webContents.send('focus-change', true);
  });

  mainWindow.on('blur', () => {
    mainWindow.webContents.send('focus-change', false);
  });

  // Abrir las DevTools en desarrollo
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Gestionar cuando se cierra la ventana
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// Este método se llamará cuando Electron haya terminado
// la inicialización y esté listo para crear ventanas del navegador.
app.whenReady().then(createWindow);

// Salir cuando todas las ventanas estén cerradas, excepto en macOS
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// En macOS, recrear una ventana cuando se hace clic en el icono
app.on('activate', function () {
  if (mainWindow === null) createWindow();
});

// Escuchar los eventos de control de ventana
ipcMain.on('window-control', (event, command) => {
  console.log('Comando recibido:', command);
  
  switch(command) {
    case 'minimize':
      mainWindow.minimize();
      break;
    case 'maximize':
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
      break;
    case 'close':
      mainWindow.close();
      break;
  }
});

// Responder a la consulta sobre si la ventana está maximizada
ipcMain.handle('window-is-maximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

// Responder a la consulta sobre si la ventana está enfocada
ipcMain.handle('window-is-focused', () => {
  return mainWindow ? mainWindow.isFocused() : false;
});