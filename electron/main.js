const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');

// Mantener una referencia global del objeto window para evitar
// que la ventana se cierre automáticamente cuando el objeto JavaScript es eliminado por el recolector de basura.
let mainWindow;

function createWindow() {
  // Crear la ventana del navegador
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: path.join(__dirname, '../public/favicon.ico')
  });

  // Cargar la aplicación
  const startUrl = process.env.ELECTRON_START_URL || url.format({
    pathname: path.join(__dirname, '../dist/index.html'),
    protocol: 'file:',
    slashes: true
  });
  
  mainWindow.loadURL(startUrl);

  // Emitido cuando la ventana es cerrada
  mainWindow.on('closed', function () {
    // Eliminar la referencia del objeto window
    // normalmente almacenarías las ventanas en un array
    // si tu aplicación soporta múltiples ventanas, este es el momento
    // en el que deberías borrar el elemento correspondiente.
    mainWindow = null;
  });
}

// Este método será llamado cuando Electron haya terminado
// la inicialización y esté listo para crear ventanas del navegador.
app.on('ready', createWindow);

// Salir cuando todas las ventanas estén cerradas
app.on('window-all-closed', function () {
  // En macOS es común para las aplicaciones permanecer
  // activas en el menú dock hasta que el usuario salga explícitamente
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  // En macOS es común volver a crear una ventana en la aplicación cuando el
  // icono del dock es clicado y no hay otras ventanas abiertas.
  if (mainWindow === null) {
    createWindow();
  }
});