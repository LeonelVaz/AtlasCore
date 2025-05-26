**Etapa 0: Esqueleto Básico del Plugin y Página Principal Vacía**

*   **Objetivo:** Tener el plugin cargando en Atlas, con una página principal accesible desde la navegación, pero sin funcionalidad real aún. Confirmar que la estructura básica funciona.
*   **Funcionalidad a Implementar:**
    *   `index.js` básico con `id`, `name`, `version`, `init` y `cleanup` simples.
    *   Registro de un item en `MAIN_NAVIGATION`.
    *   Registro de una página vacía en `PLUGIN_PAGES` (`VideoSchedulerPage.jsx` esqueleto).
*   **Feedback Esperado de tu Parte:**
    *   ¿El plugin carga correctamente en Atlas?
    *   ¿Aparece el ítem en la navegación principal?
    *   ¿Se puede navegar a la página del plugin y se muestra el contenido esqueleto?

---

Una vez que me des el visto bueno para la Etapa 0, continuaríamos con las siguientes.

**Etapas Siguientes (Borrador):**

*   **Etapa 1: Estructura de Datos Básica y Creación/Visualización de Videos (en Memoria)**
    *   Definir la estructura de `DEFAULT_VIDEO_STRUCTURE` (simplificada inicialmente).
    *   Implementar `_internalCreateVideo` y `_internalGetAllVideos` (solo en memoria, sin persistencia aún).
    *   `VideoSchedulerPage.jsx` muestra una lista simple de los títulos de los videos.
    *   Un botón "Añadir Video" que crea un video con datos por defecto.

*   **Etapa 2: Persistencia de Videos con `core.storage`**
    *   Modificar `init` para cargar videos desde `core.storage`.
    *   Modificar métodos CRUD (`_internalCreateVideo`, `_internalUpdateVideo`, `_internalDeleteVideo`) para guardar en `core.storage`.
    *   Asegurar que los datos persisten entre sesiones.

*   **Etapa 3: Formulario de Creación/Edición de Video (`VideoForm.jsx`)**
    *   Crear un componente `VideoForm.jsx` (modal o en la página).
    *   Campos básicos: Título, Descripción, Fecha (input de texto por ahora), Slot (selector simple).
    *   Integrar el formulario para crear nuevos videos y editar existentes.

*   **Etapa 4: Vista de Calendario Mensual (`VideoSchedulerPage.jsx`)**
    *   `VideoSchedulerPage.jsx` muestra una cuadrícula mensual.
    *   Lógica para mostrar los videos en sus respectivos días/slots.
    *   Navegación de mes (anterior/siguiente).

*   **Etapa 5: Gestión de Estado de Producción**
    *   Añadir selector de estado en `VideoForm.jsx`.
    *   Indicador visual del estado en la tarjeta del video.
    *   Método `_internalUpdateProductionStatus`.

*   **Etapa 6: Panel de Configuración Básico (`SettingsPanelWidget.jsx`)**
    *   Widget en `SETTINGS_PANEL` de Atlas.
    *   Configuración simple (ej. plataforma por defecto) guardada con `core.storage`.

*   **Etapa 7: Gestión de Ingresos (Simplificada)**
    *   Añadir campo de ingresos (monto y moneda) en `VideoForm.jsx` o un sub-formulario.
    *   Método `_internalTrackEarningsForVideo`.

*   **Etapa 8: Estadísticas Básicas (`VideoStatsDisplay.jsx`)**
    *   Componente que muestra conteo de videos por estado y total de ingresos.

*   **Etapas Siguientes (Más Avanzadas):**
    *   Formulario de Añadir en Lote.
    *   Mejoras en la UI/UX, selectores de fecha adecuados.
    *   Integración con indicadores del calendario de Atlas.
    *   Refinamiento de la configuración de divisas.
    *   Manejo de errores más robusto y feedback al usuario.

**¿Te parece bien esta propuesta de Etapa 0 y el borrador de las siguientes etapas?**

Si estás de acuerdo, te proporcionaré el código para la **Etapa 0**.

---

**Precauciones y Notas Importantes para el Desarrollo Real:**

*   **Componentes React:** La guía de Atlas usa `React.createElement`. Si el desarrollador final va a usar JSX, necesitará un paso de compilación (ej. Babel) para convertir JSX a `React.createElement` antes de que Atlas cargue el plugin. Si no hay paso de build, todo el código React debe escribirse con `React.createElement`. En mis ejemplos, usaré `React.createElement` para seguir la guía.
*   **Importaciones de Componentes:** En la guía, los componentes se definen a menudo en el mismo archivo o se asume que están disponibles globalmente. Para una estructura modular, un plugin real necesitaría importar sus propios componentes. Si no hay un sistema de empaquetado/módulos (como Webpack/Rollup) gestionado por Atlas para los plugins, la forma más simple sería definir los componentes en el mismo archivo `index.js` o tenerlos en archivos separados y concatenarlos/empaquetarlos manualmente antes de la "distribución" a Atlas. Por ahora, en las etapas iniciales, podemos definir los componentes necesarios directamente en `index.js` o simular su importación.
*   **Estilos CSS:** Nos aseguraremos de usar las variables CSS de Atlas.

¡Listo para empezar con la Etapa 0 cuando me digas!