# Integración con Electron

## Introducción

Este documento detalla la arquitectura e implementación de la integración de Atlas con Electron, permitiendo que la aplicación web funcione como una aplicación de escritorio nativa en múltiples plataformas. La integración se ha diseñado para proporcionar una experiencia de usuario consistente, aprovechando al mismo tiempo las capacidades nativas del sistema operativo.

## Arquitectura General

### Principios de Diseño

La integración con Electron se basa en los siguientes principios:

1. **Código compartido**: Maximizar la reutilización de código entre versiones web y de escritorio.
2. **Abstracción de diferencias**: Encapsular las diferencias entre plataformas en adaptadores.
3. **Degradación elegante**: Manejar las diferencias de capacidades entre entornos.
4. **Seguridad**: Seguir las mejores prácticas de seguridad para aplicaciones Electron.
5. **Experiencia nativa**: Aprovechar las capacidades del sistema operativo cuando sea posible.

### Componentes Principales

```
electron/
├── main.js                   # Proceso principal de Electron
├── preload.js                # Script de precarga seguro
└── window-manager.js         # Gestión de ventanas

src/
├── services/
│   └── storage-service.js    # Abstracción de almacenamiento
├── utils/
│   └── electron-detector.js  # Detección de entorno Electron
└── components/ui/
    └── window-controls.jsx   # Controles de ventana personalizados
```

### Diagrama de Arquitectura

```
┌────────────────────────────────────────────┐
│              Aplicación Electron           │
│                                            │
│  ┌────────────────┐    ┌────────────────┐  │
│  │ Proceso        │    │ Proceso        │  │
│  │ Principal      │◄───┤ Renderer       │  │
│  │ (main.js)      │    │ (React App)    │  │
│  └───────┬────────┘    └───────┬────────┘  │
│          │                     │           │
│          │     IPC Bridge      │           │
│          └─────────┬───────────┘           │
│                    │                       │
│          ┌─────────▼────────┐              │
│          │ Preload Script   │              │
│          │ (preload.js)     │              │
│          └──────────────────┘              │
└────────────────────────────────────────────┘
```

## Proceso Principal de Electron

### Configuración Básica

El archivo `main.js` configura el proceso principal de Electron:

```javascript
// Importar dependencias
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Determinar si estamos en desarrollo
const isDev = !app.isPackaged;

// Crear la ventana principal
function createWindow() {
  // Configurar la ventana
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false, // Sin marco para personalizar la ventana
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false, // Desactivado por seguridad
      contextIsolation: true, // Activado por seguridad
      enableRemoteModule: false // Desactivado por seguridad
    }
  });

  // Cargar la aplicación
  const startUrl = isDev
    ? 'http://localhost:3000' // Servidor de desarrollo
    : `file://${path.join(__dirname, '../dist/index.html')}`; // Versión compilada
    
  mainWindow.loadURL(startUrl);
  
  // Configurar eventos de ventana
  setupWindowEvents(mainWindow);
  
  // Abrir DevTools en desarrollo
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

// Iniciar la aplicación
app.whenReady().then(createWindow);

// Gestionar cierre de la aplicación
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
```

### Gestión de Ventanas

La clase `WindowManager` encapsula la lógica de gestión de ventanas:

```javascript
// En window-manager.js
class WindowManager {
  constructor() {
    this.mainWindow = null;
  }

  createMainWindow(startUrl) {
    // Configuración de la ventana principal
    // ...
    
    this.setupWindowEvents();
  }
  
  setupWindowEvents() {
    // Configurar eventos de la ventana
    // ...
  }
  
  // Otros métodos de gestión
}

module.exports = new WindowManager();
```

### Comunicación IPC

El proceso principal escucha eventos del proceso de renderizado:

```javascript
// Escuchar eventos IPC para control de ventana
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

// Handlers para consultas desde el renderer
ipcMain.handle('window-is-maximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

ipcMain.handle('window-is-focused', () => {
  return mainWindow ? mainWindow.isFocused() : false;
});
```

## Script de Precarga (Bridge)

El script de precarga (`preload.js`) actúa como puente seguro entre los procesos:

```javascript
// preload.js
const { contextBridge, ipcRenderer } = require('electron');

// Exponer API segura al proceso de renderizado
contextBridge.exposeInMainWorld('electronAPI', {
  // Controles de ventana
  minimize: () => ipcRenderer.send('window-control', 'minimize'),
  maximize: () => ipcRenderer.send('window-control', 'maximize'),
  close: () => ipcRenderer.send('window-control', 'close'),
  
  // Consultas de estado
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  isFocused: () => ipcRenderer.invoke('window-is-focused'),
  
  // Suscripciones a eventos
  onMaximizeChange: (callback) => {
    const subscription = (_, isMaximized) => callback(isMaximized);
    ipcRenderer.on('maximize-change', subscription);
    
    // Retornar función para cancelar suscripción
    return () => ipcRenderer.removeListener('maximize-change', subscription);
  },
  
  onFocusChange: (callback) => {
    const subscription = (_, isFocused) => callback(isFocused);
    ipcRenderer.on('focus-change', subscription);
    
    return () => ipcRenderer.removeListener('focus-change', subscription);
  },
  
  // API de almacenamiento (ejemplo para ElectronStore)
  store: {
    get: (key) => ipcRenderer.invoke('store-get', key),
    set: (key, value) => ipcRenderer.invoke('store-set', key, value),
    delete: (key) => ipcRenderer.invoke('store-delete', key),
    clear: () => ipcRenderer.invoke('store-clear')
  }
});
```

## Integración en la Aplicación React

### Detección de Entorno Electron

La utilidad `electron-detector.js` proporciona una forma consistente de detectar el entorno Electron:

```javascript
// utils/electron-detector.js
export function isElectronEnv() {
  return typeof window !== 'undefined' && 
         window !== null &&
         typeof window.electronAPI !== 'undefined';
}
```

### Componente de Controles de Ventana

El componente `WindowControls` implementa los controles personalizados de ventana:

```javascript
// components/ui/window-controls.jsx
import React, { useState, useEffect } from 'react';

const WindowControls = () => {
  // Verificar si electronAPI está disponible
  if (typeof window === 'undefined' || !window.electronAPI) {
    return null; // No renderizar nada si no estamos en Electron
  }
  
  // Estados para maximización y enfoque
  const [isMaximized, setIsMaximized] = useState(false);
  const [isWindowFocused, setIsWindowFocused] = useState(true);
  
  // Consultar estados iniciales
  useEffect(() => {
    window.electronAPI.isMaximized().then(setIsMaximized);
    window.electronAPI.isFocused().then(setIsWindowFocused);
    
    // Suscribirse a cambios
    const unsubscribeMaximize = window.electronAPI.onMaximizeChange(setIsMaximized);
    const unsubscribeFocus = window.electronAPI.onFocusChange(setIsWindowFocused);
    
    return () => {
      unsubscribeMaximize && unsubscribeMaximize();
      unsubscribeFocus && unsubscribeFocus();
    };
  }, []);
  
  // Handlers para controles de ventana
  const handleMinimize = () => window.electronAPI.minimize();
  const handleMaximize = () => window.electronAPI.maximize();
  const handleClose = () => window.electronAPI.close();

  return (
    <div className={`window-controls ${isWindowFocused ? 'window-focused' : 'window-blurred'}`}>
      <button onClick={handleMinimize} className="window-button min-button">
        <div className="window-icon min-icon"></div>
      </button>
      <button onClick={handleMaximize} className="window-button max-button">
        {isMaximized ? (
          <div className="window-icon restore-icon"></div>
        ) : (
          <div className="window-icon max-icon"></div>
        )}
      </button>
      <button onClick={handleClose} className="window-button close-button">
        <div className="window-icon close-icon"></div>
      </button>
    </div>
  );
};

export default WindowControls;
```

### Integración en el Componente Principal de la Aplicación

```javascript
// app.jsx
import React from 'react';
import CalendarMain from './components/calendar/calendar-main';
import WindowControls from './components/ui/window-controls';
import { isElectronEnv } from './utils/electron-detector';

function App() {
  // Verificar si estamos en Electron
  const isElectron = isElectronEnv();

  return (
    <div className="app-container">
      <header className={isElectron ? "app-header draggable" : "app-header"}>
        <div className="app-logo">
          <h1>Atlas</h1>
        </div>
        
        {isElectron && <WindowControls />}
      </header>
      
      <main className="app-content">
        <CalendarMain />
      </main>
    </div>
  );
}

export default App;
```

## Servicio de Almacenamiento Adaptativo

El servicio `storage-service.js` proporciona una abstracción sobre diferentes métodos de almacenamiento:

```javascript
// services/storage-service.js
import { isElectronEnv } from '../utils/electron-detector';
import eventBus from '../core/bus/event-bus';
import { STORAGE_KEYS, EventCategories } from '../core/config/constants';

class StorageService {
  constructor() {
    this.storageAdapter = null;
    this.initStorage();
  }

  initStorage() {
    try {
      if (isElectronEnv()) {
        this.initElectronStore();
      } else {
        this.initLocalStorage();
      }

      console.log('Servicio de almacenamiento inicializado correctamente');
    } catch (error) {
      console.error('Error al inicializar el servicio de almacenamiento:', error);
      // Fallback a localStorage
      this.initLocalStorage();
    }
  }

  initLocalStorage() {
    this.storageAdapter = {
      get: (key, defaultValue) => {
        try {
          const value = localStorage.getItem(key);
          return value !== null ? JSON.parse(value) : defaultValue;
        } catch (error) {
          console.error(`Error al obtener ${key} de localStorage:`, error);
          return defaultValue;
        }
      },
      
      set: (key, value) => {
        try {
          localStorage.setItem(key, JSON.stringify(value));
          return true;
        } catch (error) {
          console.error(`Error al guardar ${key} en localStorage:`, error);
          return false;
        }
      },
      
      remove: (key) => {
        try {
          localStorage.removeItem(key);
          return true;
        } catch (error) {
          console.error(`Error al eliminar ${key} de localStorage:`, error);
          return false;
        }
      },
      
      clear: () => {
        try {
          localStorage.clear();
          return true;
        } catch (error) {
          console.error('Error al limpiar localStorage:', error);
          return false;
        }
      }
    };
  }

  initElectronStore() {
    if (isElectronEnv() && window.electronAPI && window.electronAPI.store) {
      this.storageAdapter = {
        get: async (key, defaultValue) => {
          try {
            const value = await window.electronAPI.store.get(key);
            return value !== undefined ? value : defaultValue;
          } catch (error) {
            console.error(`Error al obtener ${key} de ElectronStore:`, error);
            return defaultValue;
          }
        },
        
        set: async (key, value) => {
          try {
            await window.electronAPI.store.set(key, value);
            return true;
          } catch (error) {
            console.error(`Error al guardar ${key} en ElectronStore:`, error);
            return false;
          }
        },
        
        remove: async (key) => {
          try {
            await window.electronAPI.store.delete(key);
            return true;
          } catch (error) {
            console.error(`Error al eliminar ${key} de ElectronStore:`, error);
            return false;
          }
        },
        
        clear: async () => {
          try {
            await window.electronAPI.store.clear();
            return true;
          } catch (error) {
            console.error('Error al limpiar ElectronStore:', error);
            return false;
          }
        }
      };
    } else {
      console.warn('ElectronStore no disponible, usando localStorage como fallback');
      this.initLocalStorage();
    }
  }

  // API pública
  async get(key, defaultValue = null) {
    if (!this.storageAdapter) {
      console.error('Storage no inicializado correctamente');
      return defaultValue;
    }

    try {
      return await this.storageAdapter.get(key, defaultValue);
    } catch (error) {
      console.error(`Error en get(${key}):`, error);
      return defaultValue;
    }
  }

  async set(key, value) {
    if (!this.storageAdapter) {
      console.error('Storage no inicializado correctamente');
      return false;
    }

    try {
      const result = await this.storageAdapter.set(key, value);
      
      // Publicar evento si la operación fue exitosa
      if (result) {
        eventBus.publish(`${EventCategories.STORAGE}.dataChanged`, { key, value });
        
        // Eventos específicos para ciertos tipos de datos
        if (key === STORAGE_KEYS.EVENTS) {
          eventBus.publish(`${EventCategories.STORAGE}.eventsUpdated`, value);
        }
      }
      
      return result;
    } catch (error) {
      console.error(`Error en set(${key}):`, error);
      return false;
    }
  }

  // Implementación de remove y clear siguiendo el mismo patrón...
}

// Exportar una única instancia
const storageService = new StorageService();
export default storageService;
```

## CSS Específico para Electron

Los estilos para los controles de ventana personalizados:

```css
/* Controles de ventana para Electron */
.window-controls {
  display: flex;
  -webkit-app-region: no-drag;
  height: 100%;
}

.window-button {
  width: 46px;
  height: 100%;
  border: none;
  background: none;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-app-region: no-drag;
  cursor: pointer;
  padding: 0;
  margin: 0;
  transition: background-color 0.1s ease;
}

/* Efectos hover específicos para cada botón */
.window-button.min-button:hover,
.window-button.max-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.window-button.close-button:hover {
  background-color: #e81123;
}

/* Iconos de los botones */
.window-icon {
  opacity: 0.5;
}

.window-focused .window-icon {
  opacity: 0.9;
}

.window-button:hover .window-icon {
  opacity: 1;
}

/* Definición de iconos específicos */
.min-icon {
  width: 10px;
  height: 1px;
  background-color: white;
}

.max-icon {
  width: 10px;
  height: 10px;
  border: 1px solid white;
  box-sizing: border-box;
  border-radius: 1px;
}

.restore-icon {
  position: relative;
  width: 10px;
  height: 10px;
}

.restore-icon::before {
  content: '';
  position: absolute;
  width: 8px;
  height: 8px;
  border: 1px solid white;
  box-sizing: border-box;
  border-radius: 1px;
  bottom: 0;
  left: 0;
}

.restore-icon::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 5px;
  height: 5px;
  border-top: 1px solid white;
  border-right: 1px solid white;
}

.close-icon {
  width: 10px;
  height: 10px;
  position: relative;
}

.close-icon::before,
.close-icon::after {
  content: '';
  position: absolute;
  width: 14px;
  height: 1px;
  background-color: white;
  top: 50%;
  left: 50%;
}

.close-icon::before {
  transform: translate(-50%, -50%) rotate(45deg);
}

.close-icon::after {
  transform: translate(-50%, -50%) rotate(-45deg);
}
```

## Configuración del Build

El archivo `package.json` incluye la configuración para compilar la aplicación Electron:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "electron:dev": "concurrently \"npm run dev\" \"cross-env NODE_ENV=development electron .\"",
    "electron:build": "npm run build && electron-builder"
  },
  "build": {
    "appId": "com.atlas.app",
    "productName": "Atlas",
    "directories": {
      "output": "dist_electron"
    },
    "files": [
      "dist/**/*",
      "electron/**/*"
    ],
    "win": {
      "target": "nsis",
      "icon": "public/favicon.ico"
    },
    "mac": {
      "target": "dmg",
      "category": "public.app-category.productivity"
    },
    "linux": {
      "target": [
        "AppImage",
        "deb"
      ],
      "category": "Office"
    }
  }
}
```

## Capacidades Específicas de Electron

### Uso de APIs Nativas

La integración con Electron permite aprovechar APIs nativas como:

1. **Sistema de archivos nativo**: Para importación/exportación de datos.
2. **Notificaciones nativas**: Para el sistema de recordatorios.
3. **Menús contextuales nativos**: Para opciones avanzadas.
4. **Auto-arranque**: Para iniciar automáticamente con el sistema.

```javascript
// Ejemplo: Implementación futura para manejo de archivos nativos
ipcMain.handle('save-file', async (event, { content, defaultPath }) => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    defaultPath,
    filters: [
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  
  if (canceled) {
    return { success: false, reason: 'canceled' };
  }
  
  try {
    await fs.promises.writeFile(filePath, content, 'utf8');
    return { success: true, filePath };
  } catch (error) {
    return { success: false, reason: 'error', message: error.message };
  }
});
```

### Menu Personalizado (Implementación Futura)

En versiones posteriores, la integración incluirá un menú personalizado:

```javascript
// Implementación futura en main.js
function createMenu() {
  const template = [
    {
      label: 'Archivo',
      submenu: [
        {
          label: 'Nueva Entrada',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-action', 'new-event');
          }
        },
        {
          label: 'Guardar Todo',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('menu-action', 'save-all');
          }
        },
        { type: 'separator' },
        {
          label: 'Exportar...',
          click: () => {
            mainWindow.webContents.send('menu-action', 'export');
          }
        },
        {
          label: 'Importar...',
          click: () => {
            mainWindow.webContents.send('menu-action', 'import');
          }
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Editar',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'Ver',
      submenu: [
        {
          label: 'Vista Diaria',
          click: () => {
            mainWindow.webContents.send('menu-action', 'view-day');
          }
        },
        {
          label: 'Vista Semanal',
          click: () => {
            mainWindow.webContents.send('menu-action', 'view-week');
          }
        },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ];
  
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
```

## Optimización para Diferentes Plataformas

### Windows

```javascript
if (process.platform === 'win32') {
  // Configuraciones específicas para Windows
  app.setAppUserModelId('com.atlas.app'); // Para notificaciones
}
```

### macOS

```javascript
if (process.platform === 'darwin') {
  // Configuraciones específicas para macOS
  app.dock.setIcon(path.join(__dirname, '../public/favicon.ico'));
  
  // Menú específico para macOS
  template.unshift({
    label: app.name,
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
```

### Linux

```javascript
if (process.platform === 'linux') {
  // Configuraciones específicas para Linux
  // Configurar para Unity/Gnome
  app.setDesktopName('atlas.desktop');
}
```

## Consideraciones de Seguridad

La integración con Electron sigue las mejores prácticas de seguridad:

1. **Context Isolation**: Activada para aislar el contexto de la aplicación.
2. **Node Integration**: Desactivada para evitar accesos no autorizados.
3. **AllowRunningInsecureContent**: Desactivado para evitar contenido mixto.
4. **CSP estricto**: Políticas de seguridad de contenido restrictivas.
5. **WebSecurity**: Siempre activada para evitar solicitudes de origen cruzado.

```javascript
// Configuración segura en BrowserWindow
const mainWindow = new BrowserWindow({
  // Propiedades de ventana...
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    nodeIntegration: false,
    contextIsolation: true,
    enableRemoteModule: false,
    webSecurity: true,
    allowRunningInsecureContent: false,
    sandbox: true // Activar sandbox cuando sea posible
  }
});

// Configurar CSP
mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
  callback({
    responseHeaders: {
      ...details.responseHeaders,
      'Content-Security-Policy': ["default-src 'self'; script-src 'self'"]
    }
  });
});
```

## Consideraciones de Rendimiento

### Optimizaciones Implementadas

1. **Evitar uso excesivo de IPC**: Minimizar la comunicación entre procesos.
2. **Caché para operaciones frecuentes**: Evitar lecturas repetidas del almacenamiento.
3. **Actualización eficiente de UI**: Minimizar el repintado completo de la ventana.

```javascript
// Ejemplo: Caché de resultados de IPC
const cachedResults = new Map();
let cacheExpiryTimer;

function getCachedOrFetchValue(key) {
  if (cachedResults.has(key) && !isCacheExpired(key)) {
    return Promise.resolve(cachedResults.get(key).value);
  }
  
  return window.electronAPI.store.get(key).then(value => {
    cachedResults.set(key, {
      value,
      timestamp: Date.now()
    });
    
    // Configurar limpieza de caché
    if (!cacheExpiryTimer) {
      cacheExpiryTimer = setTimeout(clearExpiredCache, 30000);
    }
    
    return value;
  });
}
```

### Optimización para Diferentes Configuraciones de Hardware

```javascript
// Detección de capacidades del sistema
function detectSystemCapabilities() {
  const memory = process.getSystemMemoryInfo();
  const lowMemory = memory.free < 1024 * 1024 * 512; // < 512MB
  
  if (lowMemory) {
    // Aplicar configuración para bajo rendimiento
    disableAnimations();
    reduceCacheSize();
  }
}
```

## Extensiones Futuras

La integración con Electron está diseñada para ser extendida con:

1. **Integración con sistema de notificaciones nativo**: Para recordatorios.
2. **Auto-actualización**: Para mantener la aplicación actualizada.
3. **Modo offline mejorado**: Sincronización cuando se recupera la conexión.
4. **Teclas de acceso rápido globales**: Para acceso rápido a funciones.
5. **Menú contextual del sistema**: Para acceso rápido desde el área de notificaciones.

## Conclusión

La integración de Atlas con Electron proporciona una experiencia de usuario nativa mientras mantiene la base de código compartida con la versión web. Esta arquitectura permite:

1. **Consistencia entre plataformas**: Comportamiento similar independientemente del entorno.
2. **Aprovechamiento de capacidades nativas**: Mejora de la experiencia en escritorio.
3. **Mantenibilidad**: Base de código unificada con abstracción de diferencias.
4. **Seguridad**: Implementación que sigue las mejores prácticas.
5. **Extensibilidad**: Base sólida para funcionalidades futuras.

Esta integración representa un componente fundamental de Atlas, expandiendo su disponibilidad más allá del navegador y proporcionando una experiencia de alta calidad en entornos de escritorio.

**Nota sobre las fechas**: Los ejemplos y referencias a fechas en esta documentación son ilustrativos.