# Guía de Versionado para Atlas

Este documento describe el enfoque que seguiremos para manejar las versiones del proyecto Atlas. Está diseñado para ser práctico y asegurar la estabilidad de nuestras releases.

## Esquema de Versionado

Usaremos el formato estándar de tres números: `MAYOR.MENOR.PARCHE` (por ejemplo: 0.3.0).

- **MAYOR (X.0.0):** Para cambios significativos que introducen funcionalidades mayores o cambios que rompen la compatibilidad hacia atrás.
- **MENOR (0.X.0):** Para nuevas funcionalidades que son compatibles con versiones anteriores o mejoras sustanciales.
- **PARCHE (0.0.X):** Para correcciones de errores retrocompatibles y pequeñas mejoras.

Durante la fase inicial de desarrollo (versiones `0.x.y`), cada incremento de `MENOR` representa la finalización de una "Stage" de desarrollo.

## Stages y Versiones Correspondientes

Atlas sigue un plan de desarrollo por etapas, cada una culminando en una nueva versión MENOR:

| Stage | Versión | Descripción                                                   | Estado |
| ----- | ------- | ------------------------------------------------------------- | ------ |
| 1     | 0.1.0   | Fundamentos - Arquitectura base y calendario funcional mínimo | ✅     |
| 2     | 0.2.0   | Mejoras de Interacción y Persistencia                         | ✅     |
| 3     | 0.3.0   | Personalización y Primeros Plugins                            | ✅     |
| 4     | 0.4.0   | Robustez y Plugins Esenciales                                 |        |
| 5     | 0.5.0   | Análisis y Ecosistema Completo                                |        |
| 6     | 1.0.0   | Pulido y Lanzamiento - Primera versión estable                |        |

## Flujo de Trabajo de Git y Versionado

Utilizamos un flujo de trabajo basado en ramas para asegurar la estabilidad de la rama principal (`main`) y organizar el desarrollo.

**Ramas Principales:**

- `main`: Esta rama siempre debe reflejar el código de la última versión estable lanzada. No se debe hacer push directo a `main`.
- `feature/development`: Esta es la rama principal de desarrollo. Todas las nuevas características y correcciones se integran aquí antes de ser consideradas para una release.

### Desarrollo Diario

1.  **Crear una Rama de Característica/Corrección:**
    - Para una nueva funcionalidad: `git checkout feature/development` (asegúrate de tener la última versión) y luego `git checkout -b feature/nombre-descriptivo-funcionalidad`.
    - Para una corrección de bug: `git checkout feature/development` y luego `git checkout -b fix/descripcion-corta-bug`.
2.  **Desarrollar y Hacer Commits:**
    - Trabaja en tu rama local.
    - Realiza commits pequeños y frecuentes con mensajes descriptivos:
      ```bash
      git add .
      git commit -m "feat: Añadida funcionalidad X"
      # o "fix: Corregido problema Y en componente Z"
      ```
3.  **Subir tu Rama:**
    ```bash
    git push origin feature/nombre-descriptivo-funcionalidad
    ```
4.  **Crear un Pull Request (PR):**
    - Desde GitHub, crea un Pull Request desde tu rama de característica/corrección hacia `feature/development`.
    - Describe los cambios realizados y solicita una revisión si el equipo es de más de una persona.
5.  **Fusionar a `feature/development`:**
    - Una vez que el PR es aprobado y las pruebas (si las hay automatizadas) pasan, fusiona la rama a `feature/development`.

### Marcar una Versión (Release)

Cuando la rama `feature/development` contiene todas las funcionalidades y correcciones para una nueva versión (ej. v0.3.0) y se considera estable:

1.  **Preparar la Release Branch (Opcional pero recomendado para estabilización):**

    - Desde `feature/development`, crea una rama de release: `git checkout -b release/v0.3.0`.
    - En esta rama se pueden hacer últimas correcciones específicas para la release, actualizar el número de versión en `package.json` y finalizar el `CHANGELOG.md`.
    - Una vez lista, esta rama `release/v0.3.0` se fusiona a `main` y también de vuelta a `feature/development` (para incorporar las correcciones de última hora).

2.  **Fusionar a `main`:**

    - El código final y probado para la release (desde `feature/development` o la rama `release/vX.Y.Z`) se fusiona a la rama `main`. Esto usualmente se hace mediante un Pull Request de `feature/development` (o `release/vX.Y.Z`) a `main`.
    - **Importante:** La rama `main` ahora contiene el código exacto de la nueva versión.

3.  **Crear la Release en GitHub:**

    - Ve al repositorio de AtlasCore en GitHub.
    - Haz clic en la sección "Releases" (usualmente en la barra lateral derecha o en la página principal del repo).
    - Haz clic en "Draft a new release".
    - **"Choose a tag" / "Tag version":** Escribe el nuevo nombre del tag, siguiendo el formato `vX.Y.Z` (ej. `v0.3.0`). GitHub te ofrecerá crear este tag.
    - **"Target":** Asegúrate de seleccionar la rama `main` como el objetivo desde donde se creará el tag. Este es el paso crucial para que el tag apunte al código correcto de la release.
    - **"Release title":** Escribe un título para la release (ej. "Atlas v0.3.0 - Personalización y Plugins").
    - **"Describe this release":** Copia y pega las notas relevantes del `CHANGELOG.md` para esta versión. Detalla las nuevas funcionalidades, mejoras y correcciones.
    - **Archivos adjuntos (Opcional):** Si tienes binarios compilados (ej. el `.exe` o `.dmg` de Electron), puedes adjuntarlos aquí.
    - Marca la casilla "Set as the latest release" si corresponde.
    - Haz clic en "Publish release".
      - GitHub creará automáticamente el tag Git (ej. `v0.3.0`) apuntando al último commit de `main` (o el commit que hayas seleccionado) y creará la página de la Release.

4.  **Sincronizar tags localmente (Opcional pero bueno):**
    ```bash
    git fetch --tags origin
    ```
    Esto asegura que tu repositorio local tenga los tags creados por GitHub.

## Archivo de Cambios (CHANGELOG.md)

Es **fundamental** mantener un archivo `CHANGELOG.md` en la raíz del proyecto para documentar los cambios significativos en cada versión. Utiliza un formato como el siguiente (basado en [Keep a Changelog](https://keepachangelog.com/)):

```markdown
# Registro de Cambios (Changelog)

Todas las notas de cambios para este proyecto serán documentadas en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto se adhiere a [Versionamiento Semántico](https://semver.org/lang/es/).

## [0.3.0] - YYYY-MM-DD

### Añadido

- Sistema de Temas Avanzado (Claro, Oscuro, Atlas Dark Blue, Púrpura Nocturno, Deep Ocean).
- Escalas de Tiempo y Franjas Horarias Personalizables en el calendario.
- Sistema de Plugins completo y robusto con API Core mejorada.
  - Carga dinámica, gestión de dependencias y conflictos.
  - Acceso a almacenamiento, eventos, UI (con `ExtensionPoint`), diálogos, comunicación inter-plugins.
- Panel de Desarrolladores con Event Debugger avanzado.
- Sistema de Seguridad para Plugins: Sandbox, permisos, monitoreo, auditoría.
- Marketplace de Plugins, Gestión de Repositorios y Sistema de Actualizaciones.
- **Plugin: Gestor de Notas Avanzado (`notes-manager`):** Vinculación con eventos, editor de texto enriquecido.
- **Plugin: Contador de Eventos Pro (`event-counter`):** Badges de eventos personalizables.
- **Plugin: Planificador de Videos (`video-scheduler`):** Gestión de producción de video con estados y ingresos.

### Mejorado

- Cobertura de pruebas unitarias superando el 80%.
- Arquitectura modular y separación de intereses.
- Gestión de estado global con Contextos de React para Tema, Escala de Tiempo y Diálogos.

### Corregido

- (Listar aquí correcciones de bugs importantes para la v0.3.0)

## [0.2.0] - 2025-05-11

### Añadido

- Interacciones avanzadas con eventos del calendario (arrastrar, soltar, redimensionar, snap).
- Vista diaria del calendario.
- Sistema de almacenamiento mejorado (storageService) con integración Electron Store.
- Registro de módulos funcional y utilidades de interoperabilidad.
- Componentes UI básicos (Button, Dialog).

### Mejorado

- Experiencia de usuario en interacciones del calendario.
- Rendimiento en operaciones de arrastrar y redimensionar.
- Gestión de errores y validación de datos.
- Soporte para aplicación de escritorio Electron.

## [0.1.0] - 2025-05-08

### Añadido

- Estructura modular base.
- Sistema de Bus de Eventos.
- Calendario básico funcional (vista semanal, CRUD de eventos).
- Almacenamiento simple con localStorage.
```

## Consideraciones Adicionales

- **Actualización de `package.json`:** Antes de fusionar la rama de release a `main`, o inmediatamente después en `main` (y antes de taguear), asegúrate de actualizar el campo `version` en tu archivo `package.json` para que coincida con la nueva versión de la release.
- **Política de Versionado de Plugins:** Este documento cubre el versionado de la aplicación Atlas Core. Los plugins individuales también deben seguir una política de versionado, la cual se detalla en [`plugin-versioning.md`](./plugin-versioning.md) (si existe este archivo, sino, debe crearse).

Siguiendo este flujo, mantendremos un historial de versiones claro, una rama `main` siempre estable, y un proceso organizado para lanzar nuevas versiones de Atlas.
