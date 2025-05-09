/**
 * Punto de entrada principal para la aplicación Electron
 */

const { app } = require('electron');
const path = require('path');
const url = require('url');
const windowManager = require('./window-manager');

// Este método será llamado cuando Electron haya terminado
// la inicialización y esté listo para crear ventanas del navegador.
app.on('ready', () => {
  // Determinar la URL inicial
  const startUrl = process.env.ELECTRON_START_URL || url.format({
    pathname: path.join(__dirname, '../dist/index.html'),
    protocol: 'file:',
    slashes: true
  });
  
  // Crear la ventana principal
  windowManager.createMainWindow(startUrl);
});

// Salir cuando todas las ventanas estén cerradas
app.on('window-all-closed', () => {
  // En macOS es común para las aplicaciones permanecer
  // activas en el menú dock hasta que el usuario salga explícitamente
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // En macOS es común volver a crear una ventana en la aplicación cuando el
  // icono del dock es clicado y no hay otras ventanas abiertas.
  if (!windowManager.getMainWindow()) {
    const startUrl = process.env.ELECTRON_START_URL || url.format({
      pathname: path.join(__dirname, '../dist/index.html'),
      protocol: 'file:',
      slashes: true
    });
    
    windowManager.createMainWindow(startUrl);
  }
});