# Sistema de Registro de Módulos en Atlas

## Visión General

El sistema de registro de módulos de Atlas proporciona un mecanismo centralizado para que los componentes registren sus APIs y las pongan a disposición de otros componentes de la aplicación. Este sistema es fundamental para la arquitectura modular y extensible de Atlas.

## Estructura Principal

El sistema se basa en el objeto global `window.__appModules`, que actúa como contenedor centralizado para todos los módulos registrados. Cada módulo expone una API pública que puede ser accedida por otros módulos.

## API Principal

### Registro de Módulos

```javascript
registerModule(moduleName, moduleAPI)
```

- **moduleName**: String - Identificador único del módulo
- **moduleAPI**: Object - Objeto con métodos y propiedades que conforman la API pública del módulo
- **Retorno**: Boolean - true si el registro fue exitoso

### Obtención de Módulos

```javascript
getModule(moduleName)
```

- **moduleName**: String - Identificador del módulo a obtener
- **Retorno**: Object | null - La API del módulo o null si no existe

### Verificación de Módulos

```javascript
isModuleRegistered(moduleName)
```

- **moduleName**: String - Identificador del módulo a verificar
- **Retorno**: Boolean - true si el módulo está registrado

### Eliminación de Módulos

```javascript
unregisterModule(moduleName)
```

- **moduleName**: String - Identificador del módulo a eliminar
- **Retorno**: Boolean - true si el módulo fue eliminado

## Ejemplo de Uso

### Registro de un Módulo

```javascript
// En calendar-main.jsx
useEffect(() => {
  // Registrar API del calendario
  const moduleAPI = {
    getEvents,
    createEvent,
    updateEvent,
    deleteEvent
  };
  registerModule('calendar', moduleAPI);
  
  return () => { 
    unregisterModule('calendar'); 
  };
}, []);
```

### Acceso a un Módulo

```javascript
// En cualquier otro componente
const calendarModule = getModule('calendar');
if (calendarModule) {
  const events = calendarModule.getEvents();
  // Usar la API del módulo...
}
```

## Utilidades Adicionales

Atlas incluye utilidades adicionales para facilitar la interoperabilidad entre módulos:

- **checkTimeConflict**: Verificación de conflictos de tiempo entre eventos
- **convertEventFormat**: Conversión entre formatos de eventos de diferentes módulos
- **executeAcrossModules**: Ejecución de un método en todos los módulos que lo implementen
- **checkModuleDependencies**: Verificación de dependencias entre módulos

## Mejores Prácticas

1. **Separación clara de APIs**: Exponer solo lo necesario, manteniendo la encapsulación
2. **Documentar la API expuesta**: Importante para otros desarrolladores
3. **Validación de entradas**: Verificar parámetros antes de procesarlos
4. **Desregistro al desmontar**: Evitar fugas de memoria y referencias obsoletas
5. **Manejo de errores robusto**: Capturar excepciones para evitar fallos cascada

## Consideraciones de Rendimiento

- El registro de módulos debe realizarse durante la inicialización de componentes
- Evitar operaciones costosas en métodos de API que puedan ser llamados frecuentemente
- Implementar caché cuando sea apropiado para operaciones repetitivas

Este sistema de registro de módulos es un pilar fundamental en la arquitectura de Atlas, permitiendo una comunicación desacoplada entre componentes y facilitando la extensibilidad a través de plugins.