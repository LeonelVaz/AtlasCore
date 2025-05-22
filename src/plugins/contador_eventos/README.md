# 🔢 Contador de Eventos por Día

Plugin para Atlas que muestra la cantidad de eventos en el header de cada día del calendario con actualización en tiempo real.

## ✨ Características

- **Contador visual**: Muestra un badge con el número de eventos por día
- **Actualización en tiempo real**: Se actualiza instantáneamente cuando se crean, mueven o eliminan eventos
- **Interfaz limpia**: Solo muestra el contador cuando hay eventos (no muestra "0")
- **Diseño integrado**: Se adapta al estilo de Atlas con colores y espaciado consistentes

## 📦 Instalación

1. Descarga o copia el archivo `index.js`
2. Colócalo en la carpeta de plugins de Atlas
3. Reinicia Atlas o recarga la página
4. El plugin se activará automáticamente

## 🚀 Uso

Una vez instalado, verás badges azules en los headers de días que tienen eventos:

- **Lunes** `2` ← Indica 2 eventos
- **Martes** ← Sin badge (0 eventos)
- **Miércoles** `3` ← Indica 3 eventos

### Actualización automática

El contador se actualiza automáticamente cuando:
- ✅ Creas un nuevo evento
- ✅ Mueves un evento a otro día
- ✅ Eliminas un evento
- ✅ Modificas la fecha de un evento

## 🛠️ Requisitos técnicos

- **Atlas versión**: 0.3.0 - 1.0.0
- **Permisos**: `events`, `ui`
- **Dependencias**: React (debe importarse)

## 📋 Estructura del plugin

```
contador-eventos-dia/
├── index.js          # Plugin principal
└── README.md         # Este archivo
```

## 🔧 Configuración

El plugin funciona sin configuración adicional. Los estilos están optimizados para integrarse con el tema de Atlas.

### Personalización de estilos

Si deseas personalizar la apariencia del badge, puedes modificar el objeto `style` en el componente:

```javascript
style: {
  backgroundColor: '#2196F3',  // Color de fondo
  color: 'white',              // Color del texto
  borderRadius: '12px',        // Bordes redondeados
  padding: '2px 8px',          // Espaciado interno
  fontSize: '11px',            // Tamaño de fuente
  fontWeight: 'bold',          // Peso de fuente
  marginLeft: '6px',           // Margen izquierdo
  // ... más propiedades
}
```

## 🐛 Solución de problemas

### El plugin no se carga

1. **Verifica que React esté importado**: Asegúrate de que la primera línea del archivo sea:
   ```javascript
   import React from 'react';
   ```

2. **Revisa la consola**: Abre las herramientas de desarrollador (F12) y busca errores en la consola

3. **Verifica la estructura**: El archivo debe estar en la carpeta de plugins con el nombre correcto

### Los contadores no se actualizan

1. **Revisa los logs**: En la consola deberías ver mensajes como:
   ```
   [Contador Eventos] Plugin inicializado correctamente
   [Contador Eventos] Evento creado: {...}
   ```

2. **Recarga la página**: A veces es necesario recargar para que los eventos se registren correctamente

### Badge no aparece

- El badge solo aparece cuando hay eventos en el día
- Verifica que realmente hay eventos creados para esa fecha
- Revisa que los eventos no estén filtrados u ocultos

## 📚 API Interna

El plugin expone los siguientes eventos internos:

### Eventos publicados
- `contadorEventos.actualizar`: Se dispara cuando los contadores deben actualizarse

### Eventos escuchados
- `calendar.eventCreated`: Cuando se crea un evento
- `calendar.eventUpdated`: Cuando se actualiza un evento
- `calendar.eventDeleted`: Cuando se elimina un evento
- `calendar.eventsLoaded`: Cuando se cargan los eventos

## 🔍 Logs de depuración

Para depurar el plugin, revisa la consola del navegador. Los logs incluyen:

```
[Contador Eventos] Plugin inicializado correctamente
[Contador Eventos] Evento creado: {event data}
[Contador Eventos] 2025-05-21: 3 eventos
[Contador Eventos] Extensión UI registrada con ID: extension-123
```

## 📄 Licencia

Este plugin es de código abierto y puede ser modificado según tus necesidades.

## 🤝 Contribuciones

Si encuentras bugs o tienes ideas para mejoras:

1. Revisa el código en `index.js`
2. Crea una copia de respaldo antes de modificar
3. Prueba tus cambios en un entorno de desarrollo
4. Documenta cualquier cambio significativo

## 📞 Soporte

Si tienes problemas:

1. **Revisa la documentación de Atlas** sobre desarrollo de plugins
2. **Verifica la consola** para mensajes de error específicos
3. **Prueba desactivar/activar** el plugin
4. **Reinicia Atlas** si es necesario

---

**Versión**: 1.0.0  
**Compatibilidad**: Atlas 0.3.0 - 1.0.0  
**Última actualización**: Mayo 2025