# Atlas

![Versión](https://img.shields.io/badge/versión-0.2.0-blue)

## Descripción

Atlas es una aplicación modular de gestión del tiempo con arquitectura basada en eventos. Diseñada para ofrecer una experiencia personalizable y extensible a través de plugins, Atlas te ayuda a organizar tu tiempo de manera eficiente y adaptada a tus necesidades.

## Estado del Proyecto

Actualmente, Atlas se encuentra en la **Versión 0.2.0 (Stage 2: Mejoras de Interacción y Persistencia)**, que incluye:

- Arrastrar y soltar eventos entre horas y días
- Redimensionamiento de eventos para modificar duración
- Sistema de imán (snap) para alineación automática
- Sistema de almacenamiento mejorado con manejo de errores
- Vista diaria con navegación fluida
- Registro de módulos funcional para interoperabilidad

## Instalación

### Requisitos Previos

- Node.js (versión recomendada: 16.x o superior)
- npm (incluido con Node.js)

### Pasos de Instalación

1. Clona el repositorio:
   ```bash
   git clone [url-del-repositorio]
   cd AtlasCore
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

## Uso

### Modo Desarrollo

Para ejecutar Atlas en modo desarrollo:

```bash
npm run dev
```

Para ejecutar con Electron (aplicación de escritorio):

```bash
npm run electron:dev
```

### Compilación

Para compilar la aplicación web:

```bash
npm run build
npm run preview  # Para previsualizar la versión compilada
```

Para compilar la aplicación de escritorio con Electron:

```bash
npm run electron:build
```

## Pruebas

Ejecutar todas las pruebas:

```bash
npm test
```

Ejecutar pruebas unitarias:

```bash
npm run test:unit
```

## Plan de Desarrollo

Atlas sigue un plan de desarrollo por etapas:

| Stage | Versión | Descripción |
|-------|---------|-------------|
| 1     | 0.1.0   | ✅ Fundamentos - Arquitectura base y calendario funcional mínimo |
| 2     | 0.2.0   | ✅ Mejoras de Interacción y Persistencia |
| 3     | 0.3.0   | Personalización y Primeros Plugins |
| 4     | 0.4.0   | Robustez y Plugins Esenciales |
| 5     | 0.5.0   | Análisis y Ecosistema Completo |
| 6     | 1.0.0   | Pulido y Lanzamiento - Primera versión estable |

## Documentación

Para más información sobre el desarrollo y versionado del proyecto, consulta:

- [Guía de Versionado](docs/dev/guide-versions.md)
- [Política de Versionado de Plugins](docs/dev/plugin-versioning.md)

## Contribuir

Si deseas contribuir al proyecto, por favor:

1. Revisa la documentación de desarrollo
2. Sigue las convenciones de código establecidas
3. Envía tus cambios mediante pull requests

## Licencia

Commons Clause	

---

© Atlas Team. Todos los derechos reservados.