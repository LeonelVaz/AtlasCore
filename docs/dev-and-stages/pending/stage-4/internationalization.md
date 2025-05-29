# Guía de Internacionalización (i18n) para Atlas

## 1. Visión General

Atlas está concebido para ser una aplicación globalmente accesible. La internacionalización (i18n) es un objetivo clave para futuras versiones, permitiendo que la interfaz de usuario y el contenido se presenten en múltiples idiomas. El sistema de i18n se diseñará para ser flexible, permitiendo la adición sencilla de nuevos idiomas y asegurando una experiencia de usuario localizada y coherente.

El objetivo inicial, cuando se implemente esta funcionalidad, será ofrecer soporte completo para español (es) e inglés (en), con la capacidad de expandirse fácilmente.

## 2. Arquitectura del Sistema de Internacionalización Propuesta

### 2.1. Organización de Archivos de Traducción

Se propone la siguiente estructura de directorios para los archivos de localización dentro de la carpeta `src/`:

```
src/
└── i18n/
    ├── index.js          # Punto de entrada y configuración de la librería i18n
    ├── locales/          # Directorio raíz para todos los archivos de idioma
    │   ├── es/           # Archivos de traducción en Español
    │   │   ├── common.json     # Textos comunes a toda la aplicación
    │   │   ├── calendar.json   # Textos específicos del módulo de calendario
    │   │   ├── settings.json   # Textos del panel de configuración
    │   │   └── plugins/        # Subdirectorio para traducciones de plugins específicos
    │   │       ├── notes-manager.json
    │   │       ├── event-counter.json
    │   │       └── video-scheduler.json
    │   ├── en/           # Archivos de traducción en Inglés (estructura similar a 'es/')
    │   │   ├── common.json
    │   │   ├── calendar.json
    │   │   ├── settings.json
    │   │   └── plugins/
    │   │       ├── notes-manager.json
    │   │       ├── event-counter.json
    │   │       └── video-scheduler.json
    │   └── [codigo_idioma]/ # Carpetas para futuros idiomas (ej. fr/, de/)
    └── utils.js          # (Opcional) Funciones de utilidad para i18n
```

- **Namespaces:** Cada archivo `.json` (ej. `common.json`, `calendar.json`) actuará como un "namespace" para agrupar traducciones relacionadas con un módulo o contexto específico. Esto ayuda a organizar las traducciones y a cargar solo lo necesario.
- **Plugins:** Cada plugin será responsable de proporcionar sus propios archivos de traducción, que se integrarán en esta estructura.

### 2.2. Selección y Persistencia del Idioma

- **Detección Automática:** Al primer inicio, Atlas podría intentar detectar el idioma del sistema operativo o del navegador del usuario.
- **Selección Manual del Usuario:** Se implementará una opción en el panel de configuración de Atlas para que el usuario pueda seleccionar manualmente su idioma preferido de entre los soportados.
- **Persistencia:** La preferencia de idioma del usuario se guardará localmente (utilizando el `storageService` de Atlas) para que se mantenga entre sesiones.

### 2.3. Implementación Técnica Sugerida

Se recomienda el uso de una librería de i18n robusta y popular para React, como **`i18next`** junto con su conector **`react-i18next`**.

- **Características Clave de `i18next`:**
  - Carga de traducciones (desde archivos JSON o un backend).
  - Detección de idioma.
  - Idioma de fallback.
  - Soporte para namespaces.
  - Interpolación de variables en las cadenas de texto.
  - Manejo de pluralización.
  - Formateo de fechas, números y monedas (puede integrarse con APIs nativas de Intl).
- **Configuración (`src/i18n/index.js` o `src/i18n/config.js`):**

  ```javascript
  // Ejemplo conceptual de configuración
  import i18n from "i18next";
  import { initReactI18next } from "react-i18next";
  import HttpApi from "i18next-http-backend"; // O 'i18next-fs-backend' para Electron si se cargan desde sistema de archivos
  import LanguageDetector from "i18next-browser-languagedetector"; // Para detección en navegador

  i18n
    .use(HttpApi) // Para cargar traducciones desde archivos/servidor
    .use(LanguageDetector) // Para detectar el idioma del usuario
    .use(initReactI18next) // Para integrar con React
    .init({
      fallbackLng: "es", // Idioma por defecto si el detectado no está disponible
      debug: process.env.NODE_ENV === "development", // Activar logs en desarrollo
      supportedLngs: ["es", "en"], // Idiomas soportados inicialmente
      // Lista de namespaces (corresponden a los archivos .json)
      ns: [
        "common",
        "calendar",
        "settings" /* ...otros namespaces del core... */,
      ],
      defaultNS: "common", // Namespace por defecto
      interpolation: {
        escapeValue: false, // React ya escapa por defecto
      },
      react: {
        useSuspense: false, // O true si se maneja Suspense adecuadamente
      },
      // Configuración del backend (ej. para cargar archivos locales)
      backend: {
        loadPath: "/locales/{{lng}}/{{ns}}.json", // Ruta a los archivos de traducción
      },
    });

  export default i18n;
  ```

## 3. Guía para Desarrolladores (Atlas Core y Plugins)

### 3.1. Internacionalización de Componentes React

Todos los textos visibles para el usuario en los componentes React (tanto del Core como de los plugins) deben ser extraídos y gestionados a través del sistema de i18n.

- **Uso del Hook `useTranslation`:**

  ```jsx
  import React from "react";
  import { useTranslation } from "react-i18next";

  function MiComponente() {
    // Especificar el namespace (ej. 'calendar' o 'miPluginNamespace')
    const { t } = useTranslation("calendar");
    // o ['common', 'calendar'] para múltiples namespaces

    return (
      <div>
        <h1>{t("calendar:header.title")}</h1>{" "}
        {/* Clave con namespace explícito */}
        <p>{t("weekView.description")}</p> {/* Clave dentro del namespace por defecto ('calendar') */}
        <button>{t("common:actions.save")}</button>{" "}
        {/* Clave de un namespace común */}
      </div>
    );
  }

  export default MiComponente;
  ```

### 3.2. Estructura de Archivos de Traducción (`.json`)

Los archivos de traducción deben ser objetos JSON con pares clave-valor. Se recomienda usar una estructura anidada para organizar las traducciones de manera lógica.

**Ejemplo (`es/calendar.json`):**

```json
{
  "header": {
    "title": "Calendario",
    "todayButton": "Hoy"
  },
  "weekView": {
    "description": "Vista semanal de tus eventos.",
    "nextWeek": "Semana Siguiente",
    "previousWeek": "Semana Anterior"
  },
  "eventForm": {
    "titleNewLabel": "Nuevo Evento",
    "titleEditLabel": "Editar Evento",
    "saveButton": "Guardar Evento"
  }
}
```

### 3.3. Internacionalización de Plugins

Los plugins son responsables de proporcionar sus propias traducciones.

1.  **Estructura de Archivos:** Cada plugin debe tener una carpeta `locales/` con subcarpetas para cada idioma soportado (ej. `plugins/mi-plugin/locales/es/mi-plugin-namespace.json`).
2.  **Registro de Recursos del Plugin:** En el método `init()` del plugin, se deben cargar y registrar sus archivos de traducción en la instancia principal de `i18next` (accesible a través del `coreAPI` si se expone, o importándola directamente si la arquitectura lo permite).

    ```javascript
    // En plugins/mi-plugin/index.js
    // (Asumiendo que coreAPI.i18n o una instancia global de i18n está disponible)

    // Ejemplo conceptual de cómo un plugin registraría sus traducciones
    // La implementación real dependerá de cómo se exponga i18n a los plugins.

    // async init(core) {
    //   this._core = core;
    //   const i18nInstance = core.getModule('i18nInstance') || window.i18n; // Ejemplo

    //   if (i18nInstance) {
    //     try {
    //       // Cargar archivos JSON del plugin (esto es pseudo-código)
    //       const esTranslations = await import('./locales/es/mi-plugin-namespace.json');
    //       const enTranslations = await import('./locales/en/mi-plugin-namespace.json');

    //       i18nInstance.addResourceBundle('es', 'miPluginNamespace', esTranslations.default || esTranslations);
    //       i18nInstance.addResourceBundle('en', 'miPluginNamespace', enTranslations.default || enTranslations);

    //       // Añadir el namespace del plugin a la lista de namespaces de i18next si es necesario
    //       if (!i18nInstance.options.ns.includes('miPluginNamespace')) {
    //         i18nInstance.loadNamespaces('miPluginNamespace');
    //       }

    //     } catch (error) {
    //       console.error(`[${this.id}] Error al cargar traducciones del plugin:`, error);
    //     }
    //   }
    //   // ... resto de la inicialización ...
    //   return true;
    // }
    ```

3.  **Uso en Componentes del Plugin:** Los componentes del plugin usarán `useTranslation('miPluginNamespace')` para acceder a sus textos.

## 4. Consideraciones Adicionales para la Internacionalización

### 4.1. Formatos de Fecha, Hora y Números

- Utilizar las capacidades de la API `Intl` de JavaScript o las funcionalidades de formateo de `i18next` (que a menudo se basan en `Intl`) para mostrar fechas, horas y números según la configuración regional del usuario.
- Ejemplo: `new Date().toLocaleString(i18n.language, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });`
- Permitir la configuración de formatos de 12h/24h.

### 4.2. Pluralización

- `i18next` tiene un sistema robusto para manejar la pluralización que varía entre idiomas. Se deben usar las claves de pluralización apropiadas.
  - Ejemplo: `t('common:itemCount', { count: numItems })` donde el JSON tendría:
    ```json
    "itemCount_one": "{{count}} elemento",
    "itemCount_other": "{{count}} elementos"
    ```

### 4.3. Dirección del Texto (RTL - Right-to-Left)

- Aunque el soporte inicial se centre en idiomas LTR (Left-to-Right), la arquitectura y los estilos CSS deben diseñarse teniendo en cuenta la posible adición futura de idiomas RTL (como árabe o hebreo). Esto implica usar propiedades CSS lógicas (ej. `margin-inline-start` en lugar de `margin-left`) cuando sea apropiado.

### 4.4. Proceso de Traducción y Contribución

- **Idioma Base:** Se recomienda mantener un idioma base (ej. español o inglés) como la fuente de verdad para todas las cadenas de texto.
- **Herramientas:** Considerar el uso de plataformas o herramientas de gestión de traducciones (ej. Weblate, Crowdin, Lokalise) si el proyecto crece y múltiples traductores colaboran.
- **Guía para Traductores:** Crear una guía simple para los contribuidores que deseen añadir o mejorar traducciones, explicando la estructura de archivos y el tono de voz.

## 5. Pruebas de Internacionalización

- **Pruebas Unitarias/Integración:** Verificar que los componentes rendericen los textos traducidos correctamente al cambiar de idioma.
- **Verificación de Claves:** Implementar scripts para asegurar que todas las claves de traducción existan en todos los idiomas soportados y que no haya claves huérfanas.
- **Pruebas Visuales/Manuales:** Revisar la interfaz en cada idioma soportado para detectar problemas de truncamiento de texto, alineación o errores de traducción.
- **Herramientas de Desarrollo `i18next`:** Utilizar las opciones de depuración de `i18next` para identificar claves faltantes o problemas durante el desarrollo.

La implementación de un sistema de internacionalización completo es un esfuerzo significativo, pero es esencial para la accesibilidad y el alcance global de Atlas. Esta guía proporciona el marco arquitectónico y las consideraciones para abordar esta tarea en futuras versiones.
