## 5. Seguridad de Plugins

Atlas implementa un sistema de seguridad multinivel para proteger al usuario y a la aplicación.

- **Permisos:** Los plugins deben declarar los `permissions` que necesitan en sus metadatos.
- **Sandbox:** El código de los plugins se ejecuta en un entorno más controlado (gestionado por `plugin-sandbox.js`).
- **Monitoreo de Recursos:** (`plugin-resource-monitor.js`) Se monitorea el uso de CPU, memoria, etc.
- **Auditoría:** (`plugin-security-audit.js`) Las acciones relevantes para la seguridad son registradas.
- **Niveles de Seguridad:** (LOW, NORMAL, HIGH) Configuran el rigor de las verificaciones y los límites de recursos.
- **Panel de Seguridad:** (`src/components/settings/security-panel.jsx`) Permite al usuario (o administrador) revisar el estado de seguridad, gestionar permisos (próximamente) y ver logs de auditoría.

## 6. Empaquetado y Distribución

Atlas cuenta con un sistema para gestionar paquetes de plugins y sus actualizaciones.

- **`plugin-package-manager.js`:** Se encarga de la instalación y desinstalación de plugins empaquetados.
- **`plugin-repository-manager.js`:** Permite gestionar múltiples fuentes (repositorios) de plugins, incluyendo un repositorio oficial y la posibilidad de añadir repositorios de la comunidad o privados. Los repositorios pueden ser sincronizados.
- **`plugin-update-manager.js`:** Verifica si hay actualizaciones disponibles para los plugins instalados desde los repositorios configurados y permite aplicar dichas actualizaciones.
- **`plugin-integrity-checker.js`:** Verifica la integridad de los paquetes de plugins (checksums, firmas - aunque la firma es simulada actualmente).
- **Marketplace de Plugins (`src/components/settings/plugin-marketplace.jsx`):** Interfaz de usuario para buscar, ver detalles, instalar y desinstalar plugins desde los repositorios configurados.

---

Esta documentación proporciona una visión general del ecosistema de plugins de Atlas v0.3.0. Para obtener la guía más detallada y actualizada sobre el desarrollo de plugins, incluyendo ejemplos de código paso a paso y mejores prácticas, consulta el archivo [`docs/dev/plugins/guia-plugin-atlas.md`](guia-plugin-atlas.md).
