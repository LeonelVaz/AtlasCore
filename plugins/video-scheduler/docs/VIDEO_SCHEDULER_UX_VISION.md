# Visión de Diseño y Experiencia de Usuario (UX): Plugin "Video Scheduler" para Atlas

Este documento describe la visión de diseño y la experiencia de usuario deseada para el plugin "Video Scheduler" dentro de la aplicación Atlas. Se inspira en conceptos de una implementación previa y busca crear una herramienta intuitiva y potente para creadores de contenido.

## I. Principios Generales de Diseño UX

1.  **Claridad Visual:** La información debe ser fácil de escanear y comprender de un vistazo, utilizando un sistema de colores y emojis coherente para los estados.
2.  **Eficiencia:** Las tareas comunes (crear/nombrar video, cambiar estado) deben ser rápidas y requerir mínimos clics, con edición inline preferida para el nombre.
3.  **Consistencia:** La interfaz del plugin debe sentirse integrada con Atlas.
4.  **Feedback al Usuario:** Confirmación de acciones e indicación clara de estados.
5.  **Enfoque en el Flujo de Trabajo del Creador:** El diseño debe soportar el ciclo de vida típico de la producción de video, incluyendo la lógica de negocio específica (ej. transición de Pendiente a Vacío).
6.  **Minimalismo Informativo:** La vista principal debe ser concisa, mostrando solo la información esencial, con detalles adicionales accesibles mediante interacción.

## II. Vista Principal del Plugin: Calendario Mensual Exclusivo (`VideoSchedulerPage.jsx`)

La **única vista principal** del plugin será un calendario mensual interactivo y minimalista, optimizado para la planificación de videos. No habrá otras sub-vistas principales; toda la gestión se centrará en esta interfaz de calendario y los pop-ups/modales contextuales.

**(Referencia Visual: Basado en las capturas de pantalla proporcionadas que muestran una tabla de calendario con columnas para "Día", "7am", "15pm", "22pm", "Resumen", e "Ingresos", y un panel de estadísticas separado.)**

### A. Encabezado de la Página (Dentro del área del plugin)
*   **Título del Mes/Año:** Claramente visible (ej. "Mayo 2025").
*   **Botones de Navegación:** Flechas "<" y ">" para cambiar de mes.
*   **Botones de Acción Globales (Accesibles desde la página del plugin):**
    *   **"Añadir Videos en Lote":** Abre el modal `BulkAddForm`.
    *   **"Configurar Tasas de Cambio":** Abre un modal para las tasas de moneda (se accede desde el Panel de Estadísticas o Configuración).
    *   **"Importar/Exportar Datos":** Para backup y restauración.
    *   **"Restablecer Datos":** Opciones para restablecer el mes actual o todos los datos.
    *   **"Ver Estadísticas":** Botón o enlace para mostrar el panel de estadísticas (ver Sección V).
    *   **(Nota: La creación de un video individual se hará preferentemente editando el nombre en un slot "Pendiente".)**

### B. Cuadrícula del Calendario (Tabla Principal)
*   **Estructura de Tabla:**
    *   **Columnas Fijas:** "Día", "7am", "15pm", "22pm" (o las franjas horarias definidas), "Resumen", "Ingresos".
    *   **Filas:** Una por cada día del mes.
*   **Celda "Día":**
    *   Muestra el número del día y el nombre abreviado del día de la semana (ej. "1 Jue").
*   **Celdas de Slot de Video (ej. "7am", "15pm", "22pm"):**
    *   **Contenido Principal:**
        *   **Input de Nombre del Video:** Un campo de texto directamente visible y editable en la celda.
            *   Si el estado es "Pendiente" (📅) o "Vacío" (⬜), el input puede estar vacío o mostrar "Pend..." o "Vacío".
            *   El usuario puede hacer clic directamente en el input para escribir/editar el nombre.
            *   Al escribir un nombre y presionar Enter o perder el foco (blur), el video se guarda/actualiza.
            *   Si se añade un nombre a un slot "Pendiente" (📅), el estado cambia automáticamente a "Desarrollo" (🟦).
        *   **Indicadores de Estado:** A la derecha del nombre, se muestran los emojis de estado (emoji principal y, si aplica, el sub-emoji acoplado).
            *   Ej: `Nombre del Video 🟦☕`
    *   **Interacción con Indicadores de Estado:** Un clic sobre los indicadores de estado abre un pequeño pop-up/selector contextual (`StatusSelector.jsx`) para cambiar el estado y sub-estado del video.
*   **Celda "Resumen":**
    *   Muestra una cadena de los indicadores de estado (emoji principal + sub-emoji si aplica) de los tres videos del día, reflejando visualmente el progreso.
        *   Ej: `🟦☕ 🟨💻 🟩`
*   **Celda "Ingresos":**
    *   Muestra el ingreso del día si existe (ej. "€45 EUR OB GAMES"). El color de fondo de la celda puede cambiar según el estado del pago (ej. naranja para pendiente, verde para pagado).
    *   Un clic en esta celda (esté vacía o con datos) abre un pop-up/modal (`DailyIncomeForm.jsx`) para añadir/editar el ingreso de *ese día específico*.

### C. Sistema de Estados de Video (Visual y Lógico)

Los estados se representan visualmente con un emoji principal (que indica un color/etapa general) y, opcionalmente, un sub-emoji acoplado que es específico de esa etapa.

1.  **📅 Pendiente (Calendario):**
    *   Slot disponible para agendar un video. El input de nombre muestra "Pend...".
    *   **Lógica Automática:** Si un slot "Pendiente" pertenece a una fecha pasada, se convierte automáticamente a "⬜ Vacío".
2.  **⬜ Vacío (Blanco):**
    *   Slot intencionalmente no utilizado (decidido por el usuario que no habrá video). No se puede programar un video aquí editando el nombre directamente. El input de nombre podría mostrar "Vacío" o estar deshabilitado.
3.  **🟦 Desarrollo (Celeste - Color Dominante):**
    *   Estado base: `🟦 Desarrollo` (Solo el emoji celeste)
    *   Estado acoplado: `🟦☕ Desarrollo + Rec` (Emoji celeste seguido del emoji café)
4.  **🟨 Producción (Amarillo - Color Dominante):**
    *   Estado base: `🟨 Producción` (Solo el emoji amarillo)
    *   Estados acoplados:
        *   `🟨💻 Producción + Edición`
        *   `🟨✏️ Producción + Miniatura`
        *   `🟨🕰️ Producción + Programar` (Agendar la publicación del video)
5.  **🟩 Publicado (Verde - Color Dominante):**
    *   Estado base: `🟩 Publicado` (Solo el emoji verde)
    *   Estado acoplado: `🟩🌐 Publicado + Programado` (El video ya está agendado para salir en la plataforma)

**Lógica de Transición de Estados:**
*   Al escribir un nombre en un slot "Pendiente" (📅), el estado cambia automáticamente a "Desarrollo" (🟦).
*   El `StatusSelector.jsx` permitirá elegir el estado principal. Si el estado principal elegido tiene sub-estados, se mostrarán opciones para el sub-estado acoplado. Un video no puede tener un sub-estado sin su estado principal correspondiente.

## III. Formularios y Pop-ups Contextuales

La mayoría de las ediciones se realizarán inline o mediante pop-ups pequeños y contextuales para mantener al usuario en la vista de calendario. Los modales grandes se reservarán para acciones más complejas como "Añadir en Lote" o configuraciones.

### A. Edición Inline del Nombre del Video
*   Directamente en la celda del slot en la cuadrícula del calendario.
*   Guardado al presionar Enter o al perder el foco (onblur).

### B. Pop-up/Selector de Estado (`StatusSelector.jsx`)
*   Aparece al hacer clic en los indicadores de estado de un video en la cuadrícula.
*   **Contenido:** Opciones visuales (emoji + texto) para seleccionar el estado principal. Si el estado principal elegido tiene sub-estados, se presentan opciones para el sub-estado.
*   **Acción:** Actualiza el estado/sub-estado del video y guarda los cambios. El pop-up se cierra.

### C. Pop-up/Formulario de Ingresos del Día (`DailyIncomeForm.jsx`)
*   Aparece al hacer clic en la celda "Ingresos" de un día.
*   **Campos:** Monto, Moneda (selector), Pagador (texto), Estado del Pago (selector: Pendiente, Pagado).
*   **Acción:** Guarda/actualiza el ingreso para ese día específico. El pop-up se cierra.

### D. Formulario de Detalles del Video (`VideoForm.jsx` - Modal Opcional para Detalles Extendidos)
*   **Acceso:** Podría haber un botón "Editar Detalles Completos" en el `StatusSelector.jsx` o en un menú contextual del video para acceder a campos menos frecuentes que no se editan inline o con el selector rápido de estado.
*   **Campos (si se implementa este modal):** Descripción detallada (Rich Text si es posible), Plataforma, URL Publicado, Fecha de Publicación, Duración, Tags, Metadatos de Producción (Guionista, etc.).
*   **Nota:** La edición del título y el estado se prioriza inline o con el pop-up de estado rápido. Este formulario es para una edición más exhaustiva.

### E. Modal: Añadir Videos en Lote (`BulkAddForm.jsx`)
*   Interfaz para añadir múltiples videos.
*   **Campos:**
    *   Nombre base de la serie (ej. "Tutorial React").
    *   Comenzar numeración desde (ej. 1).
    *   Cantidad de videos a crear.
    *   Comenzar desde día (selector de día del mes actual).
    *   Horario inicial (selector: 7am, 15pm, 22pm).
*   **Opciones de Frecuencia:**
    *   **Diaria:**
        *   Input: "Publicar cada X días" (ej. 1 para diario, 2 para cada dos días).
    *   **Semanal:**
        *   Selector múltiple para días de la semana (Dom, Lun, Mar, Mié, Jue, Vie, Sáb).
        *   Selector múltiple para horarios por día seleccionado (7am, 15pm, 22pm).
*   Los videos creados por defecto tendrán estado "Desarrollo" (🟦).

### F. Modal: Configuración de Tasas de Cambio
*   Permite al usuario definir las tasas de conversión para los cálculos de estadísticas (ej. 1 USD = X ARS, 1 EUR = Y ARS).

### G. Modal: Restablecer Datos
*   Opciones para:
    *   Restablecer solo los datos del mes actualmente visible.
    *   Restablecer TODOS los datos del plugin.
    *   Requiere confirmación (`core.dialogs.confirm`).

### H. Modal: Importar/Exportar Datos
*   Permite exportar todos los datos del plugin (videos, ingresos diarios, configuración de tasas) a un archivo JSON.
*   Permite importar datos desde un archivo JSON previamente exportado, reemplazando los datos actuales (con confirmación).

## IV. Panel de Estadísticas

**(Referencia Visual: Captura de pantalla "Estado de Videos", "Producción", "Publicados")**

Se mostrará como un panel separado o una sección dentro de la página del plugin, invocable desde un botón.

*   **Presentación:** Tres columnas principales o tarjetas: "Estado de Videos", "Producción", "Publicados".
*   **Contenido de cada Columna/Tarjeta:**
    *   Lista de estados y sub-estados relevantes para esa categoría.
    *   Cada ítem muestra el emoji correspondiente, el nombre del estado/sub-estado y el conteo de videos en ese estado.
        *   Ej. Bajo "Estado de Videos": 📅 PENDIENTE [65], ⬜ VACÍO [0], 🟦 DESARROLLO [17], ☕ REC [0] (este último debe entenderse como parte de Desarrollo o como un desglose).
*   **Sección de Ganancias del Mes (integrada o separada en este panel):**
    *   Ganancias por divisa (USD, EUR, ARS) basadas en los ingresos diarios registrados.
    *   Total en ARS (calculado con tasas de cambio configuradas).
    *   Equivalentes totales en USD y EUR.

## V. Configuración del Plugin (`SettingsPanelWidget.jsx`)

Integrado en la configuración de Atlas o accesible desde la página del plugin.

*   Moneda por defecto para nuevos ingresos diarios.
*   Tasas de cambio (interfaz para ver/editar las tasas).
*   Lista de plataformas de video (para selectores en el `VideoForm.jsx` de detalles extendidos).
*   (Opcional) Botón para "Restablecer/Borrar todos los datos del Video Scheduler".

## VI. Flujos de Usuario Clave

*   **Planificar un Nuevo Video:**
    1.  Usuario identifica un slot "Pendiente" (📅) en el calendario.
    2.  Escribe directamente el nombre del video en el input del slot.
    3.  Al presionar Enter/blur, el estado del slot cambia a "Desarrollo" (🟦) y el nombre se guarda.
*   **Actualizar Estado de un Video:**
    1.  Usuario hace clic en los indicadores de estado (ej. 🟦) de un video.
    2.  Aparece el `StatusSelector.jsx` contextual.
    3.  Usuario selecciona un nuevo estado principal (ej. 🟨 Producción) y luego un sub-estado acoplado (ej. 💻 Edición).
    4.  El selector se cierra, los indicadores en la cuadrícula se actualizan a `🟨💻`.
*   **Registrar Ingreso del Día:**
    1.  Usuario hace clic en la celda "Ingresos" de un día (ej. muestra "+ Añadir" o un monto existente).
    2.  Aparece `DailyIncomeForm.jsx`.
    3.  Usuario introduce monto, moneda, pagador, y marca como "Pagado".
    4.  Guarda. La celda "Ingresos" en la cuadrícula se actualiza (ej. "€100 EUR PagadorX" con fondo verde). Las estadísticas de ganancias también se actualizan.
*   **Añadir Videos en Lote:**
    1.  Usuario hace clic en el botón "Añadir Videos en Lote".
    2.  Se abre el modal `BulkAddForm.jsx`.
    3.  Usuario completa los detalles de la serie, selecciona frecuencia, días, horarios.
    4.  Hace clic en "Agregar Videos".
    5.  El modal se cierra y el calendario se actualiza con los nuevos videos creados, todos en estado "Desarrollo" (🟦).
*   **Ver Progreso del Mes:**
    1.  Usuario navega por los meses.
    2.  Observa la columna "Resumen" de cada día para un vistazo rápido del progreso.
    3.  Consulta el panel de "Estadísticas" para ver los conteos detallados y las ganancias.
