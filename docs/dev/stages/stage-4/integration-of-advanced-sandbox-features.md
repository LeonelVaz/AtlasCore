# Propuesta de Integración de Funcionalidades Avanzadas del Sandbox en Atlas Core

**Versión del Documento:** 1.0
**Autor:** Asistente AI (basado en requerimientos)  
**Dirigido a:** Equipo de Desarrollo de Atlas Core v0.4.0

## 1. Introducción

El sistema `plugin-sandbox.js` de Atlas Core actualmente proporciona una base sólida para la ejecución segura de plugins, incluyendo validación de código estático y ejecución controlada de los ciclos de vida (`init`/`cleanup`). Sin embargo, existen funcionalidades avanzadas dentro del sandbox que aún no están completamente integradas en el flujo principal de la aplicación, particularmente en lo referente a la interacción de los plugins con la interfaz de usuario (DOM) y la protección de objetos globales.

Esta propuesta describe las directrices para integrar estas capacidades no utilizadas o subutilizadas, con el fin de fortalecer la seguridad y el control sobre el comportamiento de los plugins.

## 2. Objetivos Principales

1.  **Mejorar la Seguridad del DOM:** Implementar una capa de protección activa cuando los plugins interactúan con o manipulan elementos de la interfaz de usuario.
2.  **Fortalecer el Aislamiento:** Activar la protección de objetos globales de JavaScript en escenarios de alta seguridad para prevenir modificaciones no deseadas del entorno de ejecución.
3.  **Reducir Código No Utilizado:** Asegurar que todas las capacidades defensivas del `plugin-sandbox.js` sean aprovechables y estén integradas en el flujo de la aplicación, eliminando "código muerto" o funcionalidades inactivas.
4.  **Consistencia en la Aplicación de la Seguridad:** Garantizar que las políticas de seguridad definidas (por ejemplo, a través de niveles de seguridad) se apliquen de manera integral en todas las interacciones de los plugins.

## 3. Funcionalidades del Sandbox a Integrar

Las siguientes funcionalidades de `plugin-sandbox.js` requieren una integración más profunda:

### 3.1. Intercepción de Manipulación del DOM (`createDOMProxy`)

-   **Funcionalidad Existente en Sandbox:** El método `pluginSandbox.createDOMProxy(element, pluginId)` está diseñado para envolver elementos DOM en un Proxy. Este Proxy puede interceptar el acceso a propiedades sensibles (ej. `innerHTML`, `outerHTML`) y la llamada a métodos que podrían ser riesgosos (ej. `setAttribute` con `srcdoc`), permitiendo al sandbox registrar, advertir o bloquear estas operaciones según el nivel de seguridad.
-   **Estado Actual de Integración:** Actualmente, no hay evidencia de que el `core-api.js` o el sistema de gestión de UI (`ui-extension-manager.js`) utilicen activamente `createDOMProxy` cuando los plugins renderizan componentes o interactúan con el DOM.
-   **Acción Requerida:**
    1.  **Auditoría del `coreAPI.ui`:** Revisar cómo los plugins obtienen acceso para renderizar en zonas de extensión y cómo interactúan con el DOM a través de la API Core.
    2.  **Integración de `createDOMProxy`:**
        *   Al registrar extensiones de UI (`coreAPI.ui.registerExtension`), si el componente del plugin va a manipular directamente el DOM o se le va a pasar un elemento contenedor, este elemento (o los elementos clave que el plugin cree) debería ser envuelto por `pluginSandbox.createDOMProxy`.
        *   Cualquier API que devuelva referencias a elementos DOM existentes a un plugin debería, idealmente, devolver la versión "proxieda" del elemento.
    3.  **Considerar el impacto en el rendimiento:** La creación de Proxies puede tener un coste. Evaluar si esta protección se activa globalmente o se condiciona al nivel de seguridad.
    4.  **Comunicación con `plugin-resource-monitor`:** Asegurar que las operaciones DOM interceptadas por el proxy también se registren adecuadamente en el `plugin-resource-monitor` si es pertinente.

### 3.2. Protección de Objetos Globales (`_installGlobalProtections`)

-   **Funcionalidad Existente en Sandbox:** Los métodos `_installGlobalProtections` y `_protectGlobalObjects` están diseñados para "congelar" (`Object.freeze()`) objetos globales de JavaScript y sus prototipos, previniendo su modificación por parte de los plugins.
-   **Estado Actual de Integración:** Esta funcionalidad actualmente solo se activa si `pluginSandbox.securityLevel` está configurado en `PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH` durante la inicialización del sandbox.
-   **Acción Requerida:**
    1.  **Verificación de la Activación:** Confirmar que el sistema de gestión de seguridad (`plugin-security-manager.js` o `plugin-manager.js`) establece correctamente el nivel `HIGH` en el sandbox cuando corresponde, para que esta protección se active.
    2.  **Evaluación de Impacto:** Realizar pruebas exhaustivas con plugins existentes y bibliotecas comunes cuando esta protección esté activa. Congelar objetos globales puede, en raras ocasiones, causar incompatibilidades con código de terceros que espera poder modificar estos objetos.
    3.  **Documentación para Desarrolladores de Plugins:** Si esta protección se mantiene (incluso solo para el nivel `HIGH`), es crucial documentar claramente esta restricción para los desarrolladores de plugins.

### 3.3. Uso de Reglas de Análisis Estático para APIs Específicas

-   **Funcionalidad Existente en Sandbox:** `validatePluginCode` utiliza `staticAnalysisRules` para buscar patrones como `localStorage`, `fetch`, etc.
-   **Estado Actual de Integración:** Estas reglas se aplican, pero su efectividad para forzar el uso de APIs controladas (como `coreAPI.storage` o una futura `coreAPI.network`) depende de si estas APIs mediadoras existen y son la única vía esperada para estas operaciones.
-   **Acción Requerida:**
    1.  **Revisión de APIs Core:** Asegurar que `core-api.js` proporcione alternativas seguras y monitorizadas para todas las funcionalidades que las reglas de análisis estático intentan restringir (ej. almacenamiento, peticiones de red).
    2.  **Ajuste de Reglas:** Si el `coreAPI` evoluciona, las reglas de análisis estático en `plugin-sandbox.js` podrían necesitar ajustes para reflejar las nuevas APIs permitidas o para ser más específicas en lo que se considera un "acceso directo no deseado".
    3.  **Claridad en Mensajes de Violación:** Asegurar que los mensajes de error o advertencia generados por estas reglas indiquen claramente al desarrollador del plugin cuál es la API Core recomendada en su lugar.

## 4. Consideraciones Adicionales

-   **Niveles de Seguridad:** La integración de estas funcionalidades debe ser sensible a los niveles de seguridad definidos (`LOW`, `NORMAL`, `HIGH`). No todas las protecciones necesitan estar activas en todos los niveles. Por ejemplo, `createDOMProxy` podría ser menos restrictivo o estar desactivado en `LOW`.
-   **Rendimiento:** La introducción de Proxies y la congelación de objetos pueden tener implicaciones en el rendimiento. Se deben realizar pruebas de rendimiento para cuantificar este impacto.
-   **Experiencia del Desarrollador de Plugins:** Los cambios deben ir acompañados de una documentación clara para los desarrolladores de plugins, explicando las nuevas restricciones y las formas recomendadas de interactuar con el sistema.
-   **Testing:** Se requerirán nuevos tests unitarios y de integración para verificar que estas funcionalidades del sandbox están correctamente integradas y se comportan como se espera en el flujo de la aplicación.

## 5. Beneficios Esperados

-   Un entorno de ejecución de plugins significativamente más seguro, especialmente contra ataques de Cross-Site Scripting (XSS) a través de la manipulación del DOM.
-   Mayor protección contra la modificación accidental o maliciosa del entorno JavaScript global.
-   Un uso más completo y eficiente de las capacidades de seguridad ya implementadas en `plugin-sandbox.js`.
-   Mayor confianza en la estabilidad y seguridad de la aplicación al utilizar plugins de terceros.

## 6. Pasos Siguientes Recomendados

1.  Priorizar la integración de `createDOMProxy` en el `coreAPI.ui` y `ui-extension-manager.js`.
2.  Realizar pruebas de compatibilidad y rendimiento para la funcionalidad `_installGlobalProtections` en el nivel `HIGH`.
3.  Auditar el `core-api.js` para identificar si se necesitan nuevas APIs mediadoras para funcionalidades que actualmente son detectadas por las reglas de análisis estático del sandbox.
4.  Actualizar la documentación para desarrolladores de plugins.