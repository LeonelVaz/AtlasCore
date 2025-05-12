# Sistema de Almacenamiento Abstracto

## Introducción

El Sistema de Almacenamiento Abstracto de Atlas proporciona una capa de abstracción unificada para operaciones de persistencia de datos, permitiendo que la aplicación funcione de manera coherente tanto en entorno web (usando localStorage) como en aplicación de escritorio (usando Electron Store). Este documento detalla la arquitectura, implementación y uso de este sistema.

## Arquitectura

### Principios de Diseño

El sistema se basa en los siguientes principios:

1. **Abstracción completa**: Las capas superiores de la aplicación no necesitan conocer el método de almacenamiento subyacente.
2. **Adaptabilidad por entorno**: El sistema detecta el entorno (web o Electron) y utiliza el almacenamiento apropiado.
3. **Interfaz asíncrona**: Todas las operaciones son asíncronas para permitir compatibilidad futura con almacenamiento remoto.
4. **Manejo robusto de errores**: Captura y gestión centralizada de errores de almacenamiento.
5. **Notificación de cambios**: Publicación de eventos cuando cambian los datos.

### Componentes Principales

```
services/
└── storage-service.js       # Servicio principal de almacenamiento

utils/
└── storage-utils.js         # Utilidades complementarias

core/bus/
└── events.js                # Definición de eventos de almacenamiento
```

### Diagrama de Interacción

```
┌───────────────┐     ┌───────────────┐     ┌───────────────────┐
│  Componente   │────▶│ StorageService │────▶│  LocalStorage o   │
│  de Atlas     │◀────│                │◀────│  Electron Store   │
└───────────────┘     └───┬───────────┘     └───────────────────┘
                          │
                          ▼
                    ┌─────────────┐
                    │  EventBus   │
                    │  (eventos)  │
                    └─────────────┘
```

## Implementación

### Interfaz StorageService

El servicio de almacenamiento proporciona las siguientes operaciones CRUD:

```javascript
// Obtener un valor
async getItem(key, defaultValue = null) -> Promise<any>

// Guardar un valor
async setItem(key, value) -> Promise<boolean>

// Eliminar un valor
async remove(key) -> Promise<boolean>

// Borrar todo el almacenamiento
async clear() -> Promise<boolean>
```

### Adaptadores de Almacenamiento

El sistema implementa adaptadores para diferentes entornos:

#### Adaptador de LocalStorage (Web)

```javascript
// Implementación para entorno web usando localStorage
const localStorageAdapter = {
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
  
  // ...otros métodos (remove, clear)
};
```

#### Adaptador de Electron Store (Escritorio)

```javascript
// Implementación para entorno Electron
const electronStoreAdapter = {
  get: async (key, defaultValue) => {
    try {
      const value = await window.electron.store.get(key);
      return value !== undefined ? value : defaultValue;
    } catch (error) {
      console.error(`Error al obtener ${key} de ElectronStore:`, error);
      return defaultValue;
    }
  },
  
  set: async (key, value) => {
    try {
      await window.electron.store.set(key, value);
      return true;
    } catch (error) {
      console.error(`Error al guardar ${key} en ElectronStore:`, error);
      return false;
    }
  },
  
  // ...otros métodos (remove, clear)
};
```

### Detección de Entorno

El sistema detecta automáticamente si está ejecutándose en Electron:

```javascript
// Detección de entorno Electron
const isElectron = window && window.process && window.process.type;

// Inicialización con el adaptador adecuado
initStorage() {
  try {
    if (isElectron) {
      this.initElectronStore();
    } else {
      this.initLocalStorage();
    }
  } catch (error) {
    console.error('Error al inicializar el almacenamiento:', error);
    // Fallback a localStorage como último recurso
    this.initLocalStorage();
  }
}
```

### Notificación de Eventos

El servicio notifica los cambios en el almacenamiento mediante el bus de eventos:

```javascript
// Publicación de eventos al cambiar datos
async setItem(key, value) {
  const result = await this.storageAdapter.set(key, value);
  
  if (result) {
    // Notificar cambio a través del bus de eventos
    eventBus.publish(`${EventCategories.STORAGE}.dataChanged`, { key, value });
    
    // Eventos específicos para ciertos tipos de datos
    if (key === STORAGE_KEYS.EVENTS) {
      eventBus.publish(`${EventCategories.STORAGE}.eventsUpdated`, value);
    }
  }
  
  return result;
}
```

## Uso del Sistema

### Uso Básico

```javascript
import storageService from '../services/storage-service';

// Guardar datos
async function saveUserSettings(settings) {
  const result = await storageService.setItem('user_settings', settings);
  return result;
}

// Leer datos
async function loadUserSettings() {
  const settings = await storageService.getItem('user_settings', {});
  return settings;
}
```

### Uso con Hooks de React

```javascript
import { useState, useEffect } from 'react';
import storageService from '../services/storage-service';

// Hook personalizado para usar el almacenamiento
function useStoredState(key, initialValue) {
  const [value, setValue] = useState(initialValue);
  const [loaded, setLoaded] = useState(false);
  
  // Cargar valor al iniciar
  useEffect(() => {
    async function loadValue() {
      const storedValue = await storageService.getItem(key, initialValue);
      setValue(storedValue);
      setLoaded(true);
    }
    loadValue();
  }, [key]);
  
  // Función para actualizar valor
  const updateValue = async (newValue) => {
    setValue(newValue);
    await storageService.setItem(key, newValue);
  };
  
  return [value, updateValue, loaded];
}
```

### Escuchar Cambios de Almacenamiento

```javascript
import { useEffect } from 'react';
import eventBus from '../core/bus/event-bus';
import { StorageEvents } from '../core/bus/events';

function MyComponent() {
  useEffect(() => {
    // Suscribirse a cambios en eventos de calendario
    const unsubscribe = eventBus.subscribe(
      StorageEvents.EVENTS_UPDATED, 
      handleEventsUpdated
    );
    
    return () => unsubscribe();
  }, []);
  
  const handleEventsUpdated = (events) => {
    // Manejar la actualización de eventos
    console.log('Eventos actualizados:', events);
  }
  
  // Resto del componente...
}
```

## Claves Predefinidas

Para mantener la consistencia, el sistema define constantes para las claves de almacenamiento comunes:

```javascript
// En constants.js
export const STORAGE_KEYS = {
  EVENTS: 'atlas_events',
  SETTINGS: 'atlas_settings',
  THEME: 'atlas_theme',
  SNAP_VALUE: 'atlas_snap_value'
};
```

## Gestión de Errores

El sistema implementa varias estrategias para manejar errores:

1. **Valores por defecto**: Todos los métodos de lectura aceptan un valor por defecto para casos de error.
2. **Captura centralizada**: Los errores se capturan y registran centralmente en cada adaptador.
3. **Reintentos automáticos**: En implementaciones futuras, podrían añadirse reintentos para operaciones fallidas.
4. **Validación de datos**: Se valida que los datos sean JSON válido antes de guardar.

## Consideraciones de Rendimiento

### Caché en Memoria

Para mejorar el rendimiento, se puede implementar una caché en memoria:

```javascript
class StorageService {
  constructor() {
    this.cache = {};
    this.storageAdapter = null;
    this.initStorage();
  }
  
  async getItem(key, defaultValue = null) {
    // Comprobar primero la caché
    if (this.cache.hasOwnProperty(key)) {
      return this.cache[key];
    }
    
    // Buscar en el almacenamiento si no está en caché
    const value = await this.storageAdapter.get(key, defaultValue);
    
    // Guardar en caché para acceso rápido
    this.cache[key] = value;
    
    return value;
  }
  
  async setItem(key, value) {
    // Actualizar caché
    this.cache[key] = value;
    
    // Persistir a almacenamiento
    return await this.storageAdapter.set(key, value);
  }
  
  // Invalidar caché cuando sea necesario
  invalidateCache(key = null) {
    if (key) {
      delete this.cache[key];
    } else {
      this.cache = {};
    }
  }
}
```

### Operaciones Por Lotes

Para datos que cambian frecuentemente, se pueden implementar operaciones por lotes:

```javascript
async function batchUpdate(items) {
  const operations = [];
  
  // Preparar todas las operaciones
  for (const [key, value] of Object.entries(items)) {
    operations.push(storageService.setItem(key, value));
  }
  
  // Ejecutar en paralelo
  return Promise.all(operations);
}
```

## Extensiones Futuras

El sistema de almacenamiento está diseñado para ser extendido con:

1. **Sincronización con la nube**: Añadir adaptadores para servicios como Firebase o indexedDB.
2. **Encriptación de datos**: Para información sensible.
3. **Compresión de datos**: Para datos grandes.
4. **Migración de esquemas**: Para manejar cambios en la estructura de datos.
5. **Políticas de caché**: Configuración avanzada de estrategias de caché.

## Ejemplos Completos

### Gestión de Eventos del Calendario

```javascript
// En use-calendar-events.jsx
import { useState, useEffect } from 'react';
import eventBus from '../core/bus/event-bus';
import storageService from '../services/storage-service';
import { STORAGE_KEYS, EventCategories } from '../core/config/constants';

function useCalendarEvents() {
  const [events, setEvents] = useState([]);

  // Cargar eventos al iniciar
  useEffect(() => {
    loadEvents();
    
    // Suscribirse a eventos de almacenamiento
    const unsubscribe = eventBus.subscribe(
      `${EventCategories.STORAGE}.eventsUpdated`, 
      loadEvents
    );
    
    return () => unsubscribe();
  }, []);

  // Cargar eventos desde almacenamiento
  const loadEvents = async () => {
    try {
      const storedEvents = await storageService.getItem(STORAGE_KEYS.EVENTS, []);
      setEvents(Array.isArray(storedEvents) ? storedEvents : []);
    } catch (error) {
      console.error('Error al cargar eventos:', error);
      setEvents([]);
    }
  };

  // Guardar eventos en almacenamiento
  const saveEvents = async (updatedEvents) => {
    try {
      const result = await storageService.setItem(STORAGE_KEYS.EVENTS, updatedEvents);
      return result;
    } catch (error) {
      console.error('Error al guardar eventos:', error);
      return false;
    }
  };

  // Otras funciones (createEvent, updateEvent, deleteEvent)...

  return {
    events,
    loadEvents,
    saveEvents,
    // Otras funciones expuestas...
  };
}

export default useCalendarEvents;
```

### Configuración del Usuario

```javascript
// En settings-context.jsx
import React, { createContext, useState, useEffect } from 'react';
import storageService from '../services/storage-service';
import { STORAGE_KEYS } from '../core/config/constants';

const defaultSettings = {
  theme: 'light',
  snapValue: 0,
  showWeekends: true,
  hourRange: { start: 8, end: 18 }
};

export const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(defaultSettings);
  const [loaded, setLoaded] = useState(false);
  
  // Cargar configuración al iniciar
  useEffect(() => {
    async function loadSettings() {
      const storedSettings = await storageService.getItem(
        STORAGE_KEYS.SETTINGS, 
        defaultSettings
      );
      setSettings(storedSettings);
      setLoaded(true);
    }
    loadSettings();
  }, []);
  
  // Actualizar una configuración específica
  const updateSetting = async (key, value) => {
    const updatedSettings = {
      ...settings,
      [key]: value
    };
    
    setSettings(updatedSettings);
    await storageService.setItem(STORAGE_KEYS.SETTINGS, updatedSettings);
  };
  
  // Resetear a valores predeterminados
  const resetSettings = async () => {
    setSettings(defaultSettings);
    await storageService.setItem(STORAGE_KEYS.SETTINGS, defaultSettings);
  };
  
  return (
    <SettingsContext.Provider 
      value={{ 
        settings, 
        updateSetting, 
        resetSettings,
        loaded
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}
```

## Conclusión

El Sistema de Almacenamiento Abstracto de Atlas proporciona una capa de abstracción robusta y extensible para operaciones de persistencia de datos. Este diseño permite:

1. **Consistencia**: Operaciones uniformes independientemente del entorno.
2. **Facilidad de uso**: API sencilla para operaciones CRUD.
3. **Extensibilidad**: Base sólida para futuras expansiones.
4. **Robustez**: Manejo adecuado de errores y casos de fallo.
5. **Integración**: Notificación de cambios a través del bus de eventos.

Esta arquitectura ayuda a mantener la base de código modular y facilita la evolución de la aplicación, permitiendo cambios en la capa de almacenamiento sin afectar a los componentes que dependen de ella.

**Nota sobre las fechas**: Los ejemplos y referencias a fechas en esta documentación son ilustrativos.