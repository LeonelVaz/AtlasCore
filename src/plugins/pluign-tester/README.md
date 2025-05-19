## Plugin Tester para Atlas

Este plugin sirve como ejemplo completo y herramienta de prueba para desarrolladores que quieran verificar todas las funcionalidades del sistema de plugins de Atlas.

### Características

- Utiliza todas las APIs disponibles en el sistema de plugins
- Implementa ejemplos de cada punto de extensión de UI
- Muestra cómo utilizar almacenamiento persistente
- Demuestra cómo suscribirse y publicar eventos
- Proporciona una API pública para otros plugins

### Estructura del proyecto

```
plugin-tester/
├── index.js                     // Archivo principal del plugin
├── components/                  // Componentes de UI
│   ├── SidebarWidget.jsx        // Widget para la barra lateral
│   ├── CalendarCellExtension.jsx // Extensión para celdas de calendario
│   ├── EventDetailExtension.jsx // Vista de detalles de eventos
│   ├── EventFormExtension.jsx   // Formulario de eventos
│   ├── NavigationItem.jsx       // Elemento de navegación
│   ├── DashboardPage.jsx        // Página principal del plugin
│   └── SettingsPanel.jsx        // Panel de configuración
├── services/                    // Servicios y lógica de negocio
│   ├── storage.js               // Manejo de almacenamiento
│   ├── events.js                // Manejo de eventos
│   └── api.js                   // API pública
├── utils/                       // Utilidades
│   ├── constants.js             // Constantes
│   └── helpers.js               // Funciones auxiliares
├── styles/                      // Estilos
│   └── plugin-tester.css        // Estilos CSS
├── package.json                 // Dependencias y metadatos
└── webpack.config.js            // Configuración de webpack
```

### Instalación para desarrollo

1. Clona este repositorio en la carpeta de plugins de Atlas
2. Instala las dependencias de desarrollo:
   ```
   npm install
   ```
3. Compila el plugin:
   ```
   npm run build
   ```

Para desarrollo continuo con recarga automática:
```
npm run dev
```

### Uso

Una vez instalado, el plugin añade:

1. Un widget en la barra lateral del calendario
2. Una página completa accesible desde la navegación principal
3. Un panel de configuración en la sección de ajustes
4. Indicadores visuales en las celdas del calendario
5. Campos adicionales en los formularios de eventos

### Verificación de funcionalidades

Puedes utilizar este plugin para verificar:

- **Sistema de plugins**: Comprueba que el sistema de plugins está funcionando correctamente
- **APIs del Core**: Verifica que las APIs de Core son accesibles y funcionan como se espera
- **Puntos de extensión UI**: Asegúrate de que todos los puntos de extensión son accesibles
- **Sistema de eventos**: Comprueba que el sistema de eventos funciona correctamente
- **Almacenamiento persistente**: Verifica que el almacenamiento funciona como se espera

### Licencia

MIT