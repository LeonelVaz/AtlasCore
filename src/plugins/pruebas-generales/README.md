# Estructura de archivos del Plugin

```
pruebas-generales/
├── index.js                          // Punto de entrada principal
├── constants.js                      // Constantes y configuración
├── api/                              // API pública y funcionalidades
│   ├── publicAPI.js                  // API expuesta a otros plugins
│   ├── storageManager.js             // Manejo de almacenamiento
│   └── eventManager.js               // Gestión de eventos
├── components/                       // Componentes de UI
│   ├── navigation/                   // Componentes de navegación
│   │   ├── NavigationItem.jsx        // Ítem para navegación principal
│   │   └── TabNavigation.jsx         // Navegación por pestañas
│   ├── sidebar/                      // Componentes para barra lateral
│   │   ├── SidebarWidget.jsx         // Widget para la barra lateral
│   │   └── QuickAccess.jsx           // Acceso rápido
│   ├── calendar/                     // Extensiones de calendario
│   │   ├── DayCellExtension.jsx      // Extensión para celdas de día
│   │   ├── EventDetailExtension.jsx  // Extensión para vista de eventos
│   │   └── EventFormExtension.jsx    // Extensión para formulario de eventos
│   ├── settings/                     // Componentes de configuración
│   │   └── SettingsPanel.jsx         // Panel de configuración
│   ├── demo/                         // Componentes de demostración
│   │   ├── StorageDemo.jsx           // Demo de almacenamiento
│   │   ├── EventsDemo.jsx            // Demo de eventos
│   │   ├── UIExtensionsDemo.jsx      // Demo de extensiones UI
│   │   ├── PermissionsDemo.jsx       // Demo de permisos
│   │   ├── CommunicationDemo.jsx     // Demo de comunicación
│   │   ├── AnimationsDemo.jsx        // Demo de animaciones
│   │   ├── ThemesDemo.jsx            // Demo de temas
│   │   ├── DragDropDemo.jsx          // Demo de drag-and-drop
│   │   ├── ChartsDemo.jsx            // Demo de gráficas
│   │   └── FormsDemo.jsx             // Demo de formularios
│   └── shared/                       // Componentes compartidos
│       ├── Card.jsx                  // Componente Card
│       ├── Button.jsx                // Componente Button
│       ├── Modal.jsx                 // Componente Modal
│       └── Tabs.jsx                  // Componente Tabs
├── pages/                            // Páginas completas
│   ├── MainPage.jsx                  // Página principal
│   ├── APITestsPage.jsx              // Página de pruebas de API
│   ├── UITestsPage.jsx               // Página de pruebas de UI
│   └── AdvancedDemosPage.jsx         // Página de demos avanzadas
├── utils/                            // Utilidades
│   ├── logger.js                     // Utilidad de logging
│   ├── helpers.js                    // Funciones auxiliares
│   └── validators.js                 // Validadores
└── styles/                           // Estilos CSS
    ├── main.css                      // Estilos principales
    ├── components.css                // Estilos de componentes
    ├── animations.css                // Animaciones CSS
    ├── themes.css                    // Manejo de temas
    └── responsive.css                // Estilos responsive
```

