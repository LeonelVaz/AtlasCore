# Política de Versionado de Plugins para Atlas

Este documento describe cómo se deben versionar los plugins desarrollados para la aplicación Atlas. Mantener una política de versionado consistente es crucial para la estabilidad del ecosistema de plugins, la gestión de dependencias y la comunicación clara de cambios a los usuarios.

## 1. Esquema de Versionado para Plugins

Todos los plugins de Atlas **deben** seguir el estándar de **Versionado Semántico (SemVer)** en el formato `MAYOR.MENOR.PARCHE` (ej. `1.0.0`, `0.2.1`).

- **MAYOR (X.y.z):** Se incrementa cuando realizas cambios incompatibles con la API del plugin o cambios que rompen la compatibilidad con versiones anteriores del plugin.
- **MENOR (x.Y.z):** Se incrementa cuando añades nueva funcionalidad de manera retrocompatible.
- **PARCHE (x.y.Z):** Se incrementa cuando realizas correcciones de errores retrocompatibles.

**Ejemplo:**

- Un plugin pasa de `1.0.0` a `1.0.1` por una corrección de bug.
- Un plugin pasa de `1.0.1` a `1.1.0` por añadir una nueva característica sin romper nada.
- Un plugin pasa de `1.1.0` a `2.0.0` si se introduce un cambio que hace que la nueva versión no sea compatible con cómo otros plugins o el Core interactuaban con la versión `1.x.x`.

## 2. Compatibilidad con la Aplicación Atlas

Cada plugin debe declarar en sus metadatos (en su archivo `index.js`) las versiones de la aplicación Atlas Core con las que es compatible:

- `minAppVersion` (string): La versión mínima de Atlas Core requerida para que el plugin funcione correctamente (ej. `"0.3.0"`).
- `maxAppVersion` (string): La versión máxima de Atlas Core con la que se ha probado y se garantiza la compatibilidad del plugin (ej. `"1.0.0"`).

**Ejemplo en `index.js` del plugin:**

```javascript
export default {
  // ... otros metadatos ...
  version: "1.2.0", // Versión del propio plugin
  minAppVersion: "0.3.0",
  maxAppVersion: "0.5.0", // Compatible hasta Atlas v0.5.0
  // ... resto del plugin ...
};
```

**Importancia de `minAppVersion` y `maxAppVersion`:**

- El sistema de plugins de Atlas utilizará estos campos para:
  - Prevenir la activación de plugins incompatibles.
  - Informar al usuario sobre problemas de compatibilidad.
  - Filtrar plugins en el Marketplace.
- Es responsabilidad del desarrollador del plugin mantener actualizados estos valores a medida que el plugin evoluciona y que Atlas Core lanza nuevas versiones.
- **Pruebas:** Siempre prueba tu plugin con las versiones de Atlas especificadas en `minAppVersion` y `maxAppVersion` (y versiones intermedias si es posible).

## 3. Gestión de Dependencias entre Plugins

Si tu plugin depende de otro plugin de Atlas, debes declararlo en la sección `dependencies` de sus metadatos.

- **Formato de Dependencia:**
  ```javascript
  dependencies: [
    { id: "otro-plugin-id", version: "1.1.0" }, // Requiere al menos la v1.1.0 de 'otro-plugin-id'
    { id: "plugin-critico", version: "2.0.0" }
  ],
  ```
  - `id` (string): El ID del plugin del cual se depende.
  - `version` (string): La versión mínima requerida de la dependencia (SemVer).
- **Resolución:** El sistema de plugins de Atlas intentará resolver estas dependencias al activar un plugin. Un plugin no se activará si sus dependencias no se cumplen (plugin no instalado o versión inferior a la requerida).
- **Versionado de Dependencias:** Cuando actualices tu plugin, revisa si necesitas incrementar la versión requerida de tus dependencias si has comenzado a usar nuevas funcionalidades de ellas.

## 4. Manejo de Cambios que Rompen la Compatibilidad (Breaking Changes)

Un "breaking change" en un plugin es una modificación que podría hacer que:

- Otros plugins que dependen de tu plugin dejen de funcionar.
- La configuración guardada por versiones anteriores de tu plugin ya no sea válida.
- La forma en que el usuario interactúa con tu plugin cambie drásticamente.

**Al introducir un breaking change, DEBES incrementar el número de versión MAYOR de tu plugin (ej. de `1.2.5` a `2.0.0`).**

**Consideraciones:**

- **API Pública:** Si tu plugin expone una `publicAPI`, cualquier cambio no retrocompatible en esta API es un breaking change.
- **Formato de Datos:** Si cambias la estructura de los datos que tu plugin guarda (usando `coreAPI.storage`) de una manera que las versiones anteriores no pueden leer o que causa problemas, esto es un breaking change. Considera implementar mecanismos de migración de datos si es posible.
- **Eventos Publicados:** Si cambias la estructura de los datos de los eventos que tu plugin publica, o eliminas eventos que otros plugins podrían estar escuchando.
- **Eliminación de Funcionalidad:** Si eliminas una característica importante que otros plugins o usuarios podrían estar usando.

**Comunicación de Breaking Changes:**

- Documenta claramente los breaking changes en el `CHANGELOG.md` de tu plugin.
- Si es un cambio mayor, considera comunicarlo a la comunidad de usuarios/desarrolladores de Atlas.

## 5. Ciclo de Lanzamiento y Actualizaciones de Plugins

- **Nuevas Características:** Incrementa la versión MENOR (ej. `1.1.0` -> `1.2.0`).
- **Correcciones de Errores:** Incrementa la versión PARCHE (ej. `1.2.0` -> `1.2.1`).
- **Breaking Changes:** Incrementa la versión MAYOR (ej. `1.2.1` -> `2.0.0`).
- **Actualización en el Marketplace:** Cuando lances una nueva versión de tu plugin, asegúrate de actualizarlo en el repositorio de plugins desde donde se distribuye para que los usuarios puedan acceder a él a través del Marketplace de Atlas y el sistema de actualizaciones.

## 6. Recomendaciones para Desarrolladores de Plugins

- **Sé Conservador con los Breaking Changes:** Intenta introducir nuevas funcionalidades de manera retrocompatible siempre que sea posible para evitar romper la experiencia de otros usuarios o plugins.
- **Prueba Rigurosamente:** Antes de lanzar una nueva versión, prueba tu plugin exhaustivamente, especialmente en relación con las `minAppVersion` y `maxAppVersion` declaradas.
- **Documenta tu API Pública:** Si tu plugin expone una API, documenta claramente sus métodos, parámetros y comportamiento esperado.
- **Mantén un `CHANGELOG.md` Detallado:** Esto es crucial para que los usuarios y otros desarrolladores entiendan qué ha cambiado en cada versión de tu plugin.
- **Considera la Migración de Datos:** Si un cambio requiere modificar el formato de los datos almacenados, intenta proveer un mecanismo de migración para que los usuarios no pierdan su información al actualizar.
- **Dependencias Claras:** Si dependes de una característica específica de una versión de Atlas o de otro plugin, asegúrate de que `minAppVersion` o la versión de la dependencia sean las correctas.

Siguiendo estas directrices, contribuiremos a un ecosistema de plugins de Atlas estable, confiable y fácil de gestionar tanto para usuarios como para desarrolladores.
