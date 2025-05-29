const { app, BrowserWindow, ipcMain, globalShortcut } = require("electron");
const path = require("path");

// Determinar si estamos en desarrollo
const isDev = !app.isPackaged;

// Desactivar advertencias de seguridad en modo desarrollo
if (isDev) {
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = "true";
}

// Mantener una referencia global del objeto window
let mainWindow;

function createWindow() {
  // Crear la ventana del navegador
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
    icon: path.join(__dirname, "../public/logo.ico"),
    frame: false,
    titleBarStyle: "hidden",
    backgroundColor: "#141B2D",
  });

  // Cargar la URL adecuada
  const startUrl = isDev
    ? "http://localhost:3000"
    : `file://${path.join(__dirname, "../dist/index.html")}`;

  console.log("Cargando URL:", startUrl);
  mainWindow.loadURL(startUrl);

  // Configurar eventos de teclado locales para la ventana
  mainWindow.webContents.on("before-input-event", (event, input) => {
    // F12 para DevTools
    if (input.key === "F12") {
      console.log("F12 detectado via before-input-event");
      mainWindow.webContents.toggleDevTools();
      event.preventDefault();
    }

    // Ctrl+Shift+I para DevTools
    if (input.control && input.shift && input.key === "I") {
      console.log("Ctrl+Shift+I detectado via before-input-event");
      mainWindow.webContents.toggleDevTools();
      event.preventDefault();
    }
  });

  // Detectar cambios en el estado maximizado/restaurado
  mainWindow.on("maximize", () => {
    mainWindow.webContents.send("maximize-change", true);
  });

  mainWindow.on("unmaximize", () => {
    mainWindow.webContents.send("maximize-change", false);
  });

  // Detectar cuando la ventana recibe o pierde el enfoque
  mainWindow.on("focus", () => {
    mainWindow.webContents.send("focus-change", true);
  });

  mainWindow.on("blur", () => {
    mainWindow.webContents.send("focus-change", false);
  });

  // REMOVER O COMENTAR ESTAS LÍNEAS:
  // if (isDev) {
  //   mainWindow.webContents.openDevTools();
  // }

  // Gestionar cuando se cierra la ventana
  mainWindow.on("closed", function () {
    mainWindow = null;
  });
}

// Función para registrar atajos de teclado globales
function registerGlobalShortcuts() {
  // F12 para alternar DevTools
  const f12Registered = globalShortcut.register("F12", () => {
    console.log("F12 presionado - intentando abrir DevTools");
    if (mainWindow && mainWindow.webContents) {
      console.log("Ventana principal encontrada, alternando DevTools");
      mainWindow.webContents.toggleDevTools();
    } else {
      console.log("No se encontró ventana principal");
    }
  });

  // También registrar Ctrl+Shift+I como alternativa (estándar de Chrome)
  const ctrlShiftIRegistered = globalShortcut.register(
    "CommandOrControl+Shift+I",
    () => {
      console.log("Ctrl+Shift+I presionado - intentando abrir DevTools");
      if (mainWindow && mainWindow.webContents) {
        console.log("Ventana principal encontrada, alternando DevTools");
        mainWindow.webContents.toggleDevTools();
      } else {
        console.log("No se encontró ventana principal");
      }
    }
  );

  console.log("Registro de atajos:");
  console.log("- F12:", f12Registered ? "ÉXITO" : "FALLÓ");
  console.log("- Ctrl+Shift+I:", ctrlShiftIRegistered ? "ÉXITO" : "FALLÓ");

  // Verificar si los atajos están registrados
  console.log("F12 está registrado:", globalShortcut.isRegistered("F12"));
  console.log(
    "Ctrl+Shift+I está registrado:",
    globalShortcut.isRegistered("CommandOrControl+Shift+I")
  );
}

// Este método se llamará cuando Electron haya terminado
// la inicialización y esté listo para crear ventanas del navegador.
app.whenReady().then(() => {
  createWindow();
  registerGlobalShortcuts();
});

// Salir cuando todas las ventanas estén cerradas, excepto en macOS
app.on("window-all-closed", function () {
  // Desregistrar todos los atajos globales antes de salir
  globalShortcut.unregisterAll();

  if (process.platform !== "darwin") app.quit();
});

// En macOS, recrear una ventana cuando se hace clic en el icono
app.on("activate", function () {
  if (mainWindow === null) {
    createWindow();
  }
});

// Desregistrar atajos cuando la app se está cerrando
app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

// Escuchar los eventos de control de ventana
ipcMain.on("window-control", (event, command) => {
  console.log("Comando recibido:", command);

  switch (command) {
    case "minimize":
      mainWindow.minimize();
      break;
    case "maximize":
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
      break;
    case "close":
      mainWindow.close();
      break;
  }
});

// Responder a la consulta sobre si la ventana está maximizada
ipcMain.handle("window-is-maximized", () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

// Responder a la consulta sobre si la ventana está enfocada
ipcMain.handle("window-is-focused", () => {
  return mainWindow ? mainWindow.isFocused() : false;
});
