# Atlas

![Versión](https://img.shields.io/badge/versión-0.3.0-blue)
![Estado](https://img.shields.io/badge/estado-En%20Desarrollo%20Activo-green)
![Electron](https://img.shields.io/badge/Electron-^33.2.1-9cf)
![React](https://img.shields.io/badge/React-^18.3.1-61DAFB)

<img src="https://github.com/user-attachments/assets/0535c384-c878-41ca-b062-4d0a73a7b48f" alt="Logo Atlas" width="300">

## Descripción

Atlas es una aplicación de escritorio modular y altamente personalizable diseñada para la gestión avanzada del tiempo y la organización de tareas. Su arquitectura, basada en un sistema de eventos y un robusto núcleo extensible mediante plugins, permite a los usuarios adaptar la aplicación a sus flujos de trabajo específicos y a los desarrolladores crear nuevas funcionalidades de manera integrada.

## Estado del Proyecto

Actualmente, Atlas se encuentra en la **Versión 0.3.0 (Stage 3: Personalización y Primeros Plugins)**. Esta versión introduce mejoras significativas en la personalización, un sistema de plugins completo con capacidades de seguridad avanzadas, y los primeros plugins funcionales que demuestran la potencia de la plataforma.

**Características Destacadas de la v0.3.0:**

- **Sistema de Temas Avanzado:** Múltiples temas predefinidos y personalización de la apariencia.
- **Escalas de Tiempo y Franjas Horarias Configurables:** Mayor control sobre la densidad visual del calendario.
- **Sistema de Plugins Completo:** Incluye carga dinámica, gestión de dependencias, API Core robusta, y un sistema de UI extensible.
- **Seguridad de Plugins Avanzada:** Sandbox para ejecución aislada, sistema de permisos granular, monitoreo de recursos y auditoría.
- **Marketplace de Plugins (Alfa):** Funcionalidad básica para descubrir, instalar y gestionar plugins (se expandirá en futuras versiones).
- **Panel de Desarrolladores:** Herramientas integradas para facilitar la depuración y el desarrollo de plugins, incluyendo un Event Debugger mejorado.
- **Plugins Integrados/Ejemplos:**
  - **Contador de Eventos Pro:** Badges personalizables para contar eventos en el calendario.
  - **Gestor de Notas Avanzado:** Creación de notas con formato enriquecido y vinculación a eventos del calendario.
  - **Planificador de Videos:** Herramienta especializada para la planificación de contenido de video.

## Instalación

### Requisitos Previos

- Node.js (versión recomendada: 16.x o superior)
- npm (incluido con Node.js)

### Pasos de Instalación

1.  Clona el repositorio:

    ```bash
    git clone https://github.com/LeonelVaz/AtlasCore.git
    # (Asumiendo esta es la URL correcta, por favor, verifica)
    cd AtlasCore
    ```

2.  Instala las dependencias:
    ```bash
    npm install
    ```

## Uso

### Modo Desarrollo

Para ejecutar Atlas en modo desarrollo (aplicación web en el navegador):

```bash
npm run dev
```

Para ejecutar con Electron (aplicación de escritorio en modo desarrollo):

```bash
npm run electron:dev
```

Esto iniciará el servidor de Vite y la aplicación Electron simultáneamente.

### Compilación

Para compilar la aplicación web para producción:

```bash
npm run build
npm run preview  # Para previsualizar la versión compilada
```

Los archivos compilados se encontrarán en la carpeta `dist/`.

Para compilar la aplicación de escritorio con Electron para tu plataforma actual:

```bash
npm run electron:build
```

Los instaladores/ejecutables se encontrarán en la carpeta `dist_electron/`.

## Pruebas

Ejecutar todas las pruebas unitarias:

```bash
npm test
```

Ejecutar pruebas en modo watch (se re-ejecutan al guardar cambios):

```bash
npm run test:watch
```

Verificar la cobertura de pruebas:

```bash
npm run test:coverage
```

Se generará un reporte de cobertura en la carpeta `coverage/`.

## Plan de Desarrollo (Stages)

Atlas sigue un plan de desarrollo por etapas:

| Stage | Versión | Descripción                                                                 | Estado |
| ----- | ------- | --------------------------------------------------------------------------- | ------ |
| 1     | 0.1.0   | Fundamentos - Arquitectura base y calendario funcional mínimo               | ✅     |
| 2     | 0.2.0   | Mejoras de Interacción y Persistencia                                       | ✅     |
| 3     | 0.3.0   | Personalización, Sistema de Plugins Completo y Primeros Plugins Funcionales | ✅     |
| 4     | 0.4.0   | Robustez, Plugins Esenciales y Mejoras de Seguridad                         | 🚧     |
| 5     | 0.5.0   | Análisis Avanzado, Ecosistema de Plugins y Optimización                     |        |
| 6     | 1.0.0   | Pulido y Lanzamiento - Primera versión estable completa                     |        |

_(Leyenda: ✅ Completado, 🚧 En Progreso)_

## Documentación

Para más información sobre el desarrollo, arquitectura y contribución al proyecto, consulta la carpeta `docs/`:

- **Visión General:** `docs/atlas-overview.md`
- **Arquitectura del Sistema:** `docs/architecture.md`
- **Estándares de Código:** `docs/coding-standards.md`
- **Guía de Versionado:** `docs/guide-versions.md`
- **Información del Ecosistema de Plugins:** `docs/plugins-info.md`
- **Guía para Desarrollar Plugins:** `docs/dev/plugins/guia-plugin-atlas.md`
- **Política de Versionado de Plugins:** `docs/dev/plugin-versioning.md`

## Contribuir

¡Las contribuciones son bienvenidas! Si deseas contribuir al proyecto Atlas, por favor:

1.  Revisa la documentación de desarrollo, especialmente los estándares de código y la guía de arquitectura.
2.  Sigue el flujo de trabajo de Git establecido (ver `docs/guide-versions.md`).
3.  Para nuevas funcionalidades o correcciones importantes, crea un _issue_ para discutirlo antes de comenzar a trabajar.
4.  Envía tus cambios mediante Pull Requests a la rama `feature/development`.

## Licencia

AtlasCore se distribuye bajo los términos de la **Apache License, Version 2.0**, con la **Commons Clause Version 1.0** adjunta.

En resumen, esto significa que eres libre de:

- Usar, copiar, modificar y distribuir el software.
- Crear trabajos derivados.

Sin embargo, la **Commons Clause impone una restricción importante: no puedes "Vender" el software**. "Vender" se define en la cláusula e incluye distribuir el software a cambio de una tarifa, alquilarlo, sublicenciarlo con fines comerciales, o desplegarlo como un servicio comercial principal donde la funcionalidad del software AtlasCore es el componente primario por el que se cobra.

Puedes encontrar el texto completo de la licencia y la Commons Clause en el archivo `LICENSE` ubicado en la raíz de este repositorio.

**Uso Comercial y Colaboraciones:**
Si estás interesado en utilizar AtlasCore para fines comerciales que puedan entrar en conflicto con las restricciones de la Commons Clause, o si deseas explorar una colaboración o un acuerdo de licenciamiento comercial que permita un modelo de ingresos, por favor, contacta a Dino Leonel Vazquez Ledesma en `leonelvazquezoficial@gmail.com`.

---

© 2025 Dino Leonel Vazquez Ledesma. Todos los derechos reservados bajo los términos de la licencia especificada.
