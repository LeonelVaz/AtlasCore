# Internacionalización en Atlas

## Visión General

Atlas está diseñado para ser una aplicación completamente multilingüe, con soporte inicial para español e inglés a partir de la versión 1.0.0. La arquitectura de internacionalización permite añadir fácilmente más idiomas en el futuro.

## Estructura del Sistema de Idiomas

### Organización de Archivos

```
src/
├── i18n/
│   ├── index.js          # Punto de entrada para la inicialización del sistema i18n
│   ├── config.js         # Configuración global de i18n
│   └── locales/
│       ├── es/           # Archivos de traducción en español
│       │   ├── common.json
│       │   ├── calendar.json
│       │   ├── settings.json
│       │   └── plugins/
│       │       ├── notes.json
│       │       ├── tasks.json
│       │       └── ...
│       ├── en/           # Archivos de traducción en inglés
│       │   ├── common.json
│       │   ├── calendar.json
│       │   ├── settings.json
│       │   └── plugins/
│       │       ├── notes.json
│       │       ├── tasks.json
│       │       └── ...
│       └── [otros idiomas]/
```

### Selección de Idioma

- **Detección automática**: Al inicio, la aplicación detecta el idioma del sistema.
- **Selección manual**: El usuario puede cambiar el idioma a través del panel de configuración.
- **Persistencia**: La preferencia de idioma se almacena localmente.

### Implementación Técnica

Atlas utiliza la biblioteca `i18next` junto con `react-i18next` para la integración con React:

```javascript
// Ejemplo de configuración en src/i18n/config.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'es', // Idioma de respaldo
    defaultLng: 'es',  // Idioma predeterminado
    supportedLngs: ['es', 'en'],
    ns: ['common', 'calendar', 'settings'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    }
  });

export default i18n;
```

## Guía para Desarrolladores

### Internacionalización de Componentes

Todos los textos visibles para el usuario deben utilizar el hook `useTranslation`:

```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation('namespace');
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
    </div>
  );
}
```

### Estructura de Archivos de Traducción

Cada archivo JSON de traducción debe seguir una estructura de claves anidadas:

```json
{
  "section": {
    "subsection": {
      "key": "Texto traducido"
    }
  },
  "simpleKey": "Traducción simple"
}
```

### Internacionalización de Plugins

Los plugins deben seguir la misma estructura y proporcionar sus propios archivos de traducción:

```javascript
// Registro de traducciones al cargar el plugin
import { i18n } from '../../i18n';
import esTranslations from './locales/es/plugin.json';
import enTranslations from './locales/en/plugin.json';

function initPlugin() {
  // Registrar traducciones
  i18n.addResourceBundle('es', 'myPlugin', esTranslations);
  i18n.addResourceBundle('en', 'myPlugin', enTranslations);
  
  // Resto de la inicialización del plugin
}
```

## Pruebas de Internacionalización

- **Verificación automática**: Se ejecutan pruebas para verificar que todas las claves tienen traducciones en todos los idiomas soportados.
- **Vista previa de traducciones**: El panel de administración incluye una herramienta para previsualizar la aplicación en diferentes idiomas.

## Contribución de Nuevos Idiomas

Los colaboradores pueden añadir nuevos idiomas siguiendo estos pasos:

1. Crear una nueva carpeta con el código del idioma en `src/i18n/locales/`
2. Copiar la estructura de archivos del español (idioma de referencia)
3. Traducir todos los archivos JSON
4. Actualizar `src/i18n/config.js` para incluir el nuevo idioma en `supportedLngs`
5. Añadir pruebas de verificación para el nuevo idioma

## Plan de Implementación

La implementación del sistema de internacionalización sigue un enfoque gradual a lo largo del desarrollo de Atlas:

### Stage 4 (v0.4.0)
- Implementación de la estructura básica del sistema de i18n
- Preparación de componentes core para internacionalización
- Configuración inicial y pruebas básicas

### Stage 5 (v0.5.0)
- Implementación parcial de traducciones español/inglés
- Extensión del sistema a plugins esenciales (Notes Manager, Task Tracker)
- Implementación de detección de idioma y selección manual

### Stage 6 (v1.0.0)
- Finalización de todas las traducciones (español/inglés)
- Internacionalización completa de todos los plugins y componentes
- Implementación de herramientas de administración de traducciones
- Pruebas exhaustivas y optimización del sistema
- Documentación completa para añadir nuevos idiomas

## Consideraciones Especiales

### Formatos de Fecha y Hora
- Adaptación automática al formato regional (DD/MM/YYYY vs MM/DD/YYYY)
- Soporte para formatos de 12h y 24h según preferencias regionales
- Manejo de nombres de días y meses localizados

### Pluralización
- Soporte para reglas de pluralización específicas de cada idioma
- Uso del sistema de pluralización de i18next para manejar casos complejos

### Dirección del Texto
- Aunque la versión 1.0.0 no incluye idiomas RTL (derecha a izquierda), la estructura está preparada para soportarlos en futuras versiones

Esta estructura de implementación progresiva asegura que al llegar a la versión 1.0.0, Atlas tenga un sistema de internacionalización completo y robusto, preparado para expandirse a más idiomas en el futuro.

**Nota sobre las fechas**: Los ejemplos y referencias a fechas en esta documentación son ilustrativos.