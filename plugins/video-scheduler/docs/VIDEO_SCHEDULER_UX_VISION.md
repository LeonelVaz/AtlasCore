# Visión de Diseño y Experiencia de Usuario (UX): Plugin "Video Scheduler" para Atlas

Este documento describe la visión de diseño y la experiencia de usuario deseada para el plugin "Video Scheduler" dentro de la aplicación Atlas. Se inspira en conceptos de una implementación previa y busca crear una herramienta intuitiva y potente para creadores de contenido.

## I. Principios Generales de Diseño UX

1.  **Claridad Visual:** La información debe ser fácil de escanear y comprender de un vistazo, utilizando un sistema de colores y emojis coherente para los estados.
2.  **Eficiencia:** Las tareas comunes (crear/nombrar video, cambiar estado) deben ser rápidas y requerir mínimos clics, con edición inline preferida para el nombre.
3.  **Consistencia:** La interfaz del plugin debe sentirse integrada con Atlas.
4.  **Feedback al Usuario:** Confirmación de acciones e indicación clara de estados.
5.  **Control Total:** El usuario puede cambiar cualquier estado en cualquier momento, con el sistema proporcionando orientación visual sin bloquear acciones.
6.  **Enfoque en el Flujo de Trabajo del Creador:** El diseño debe soportar el ciclo de vida típico de la producción de video, incluyendo la lógica de negocio específica (ej. transición de Pendiente a Vacío).
7.  **Minimalismo Informativo:** La vista principal debe ser concisa, mostrando solo la información esencial, con detalles adicionales accesibles mediante interacción.

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
        *   **Input de Descripción:** Campo secundario más pequeño para notas breves sobre el video.
        *   **Indicadores de Estado:** A la derecha del nombre, se muestran los emojis de estado (emoji principal + sub-emojis si aplican).
            *   Ej: `Nombre del Video 🟦☕❓` (Desarrollo + Grabando + Duda del usuario)
    *   **Interacción con Indicadores de Estado:** Un clic sobre los indicadores de estado abre un pequeño pop-up/selector contextual (`StatusSelector.jsx`) para cambiar el estado y sub-estado del video.
        *   **Control Total:** **TODOS** los estados son clickeables, incluyendo 📅 PENDING y ⬜ EMPTY.
*   **Celda "Resumen":**
    *   Muestra una cadena de los indicadores de estado de los tres videos del día, reflejando visualmente el progreso.
        *   Ej: `🟦☕ 🟨💻❗ 🟩🌐❓` (Desarrollo+Grabando, Producción+Editando+Alerta del sistema, Publicado+Programado+Duda del usuario)
*   **Celda "Ingresos":**
    *   Muestra el ingreso del día si existe (ej. "€45 EUR OB GAMES"). El color de fondo de la celda puede cambiar según el estado del pago (ej. naranja para pendiente, verde para pagado).
    *   Un clic en esta celda (esté vacía o con datos) abre un pop-up/modal (`DailyIncomeForm.jsx`) para añadir/editar el ingreso de *ese día específico*.

### C. Sistema de Estados de Video Completo (Visual y Lógico)

El sistema de estados utiliza **tres niveles** de indicadores visuales:

#### Estados Principales (Solo uno por video - Obligatorio)

Cada video debe tener exactamente un estado principal representado por un emoji de color:

1.  **📅 PENDING (Pendiente):**
    *   Slot disponible para agendar un video. Es el estado inicial.
    *   **Control Total:** Ahora también es **clickeable** para cambio manual.
    *   **Lógica Automática:** Si un slot "Pendiente" pertenece a una fecha pasada, se convierte automáticamente a "⬜ EMPTY".
    
2.  **⬜ EMPTY (Vacío):**
    *   Slot intencionalmente no utilizado (decidido por el usuario que no habrá video).
    *   **Control Total:** Completamente clickeable para cambio manual.
    
3.  **🟦 DEVELOPMENT (Desarrollo):**
    *   El video está en preparación/grabación.
    *   **Transición Automática:** Se asigna automáticamente cuando se escribe un nombre en un slot "Pendiente".
    
4.  **🟨 PRODUCTION (Producción):**
    *   El video ya está grabado y se está procesando (edición, thumbnail, programación).
    
5.  **🟩 PUBLISHED (Publicado):**
    *   El video ya está online y disponible. Estado final del proceso.

#### Sub-estados Normales (Solo uno por video - Opcional)

Algunos estados principales pueden tener sub-estados que proporcionan detalle específico:

**Para 🟦 DEVELOPMENT:**
*   **☕ REC**: Estás grabando el video

**Para 🟨 PRODUCTION:**
*   **💻 EDITING**: Estás editando el video
*   **✏️ THUMBNAIL**: Estás creando la miniatura
*   **🕰️ SCHEDULING_POST**: Estás programando la publicación

**Para 🟩 PUBLISHED:**
*   **🌐 SCHEDULED**: El video está programado y se publicará automáticamente
    *   **⚠️ Importante:** Solo aparece en fechas **futuras**
    *   **Transición Automática:** Cuando pasa la fecha, 🟩🌐 se convierte automáticamente en 🟩

**Ejemplos:** 
- `🟦☕` = "Video en desarrollo, específicamente grabando"
- `🟨💻` = "Video en producción, específicamente editando"
- `🟩🌐` = "Video publicado y programado para el futuro"

#### Sub-estados Apilables (Múltiples por video - Opcionales)

Estos se pueden combinar con cualquier estado principal y sub-estado normal:

1.  **❓ QUESTION (Duda del Usuario):**
    *   **Control:** Solo el USUARIO puede añadir/quitar este estado
    *   **Propósito:** Marcar videos que necesitan revisión o sobre los que tienes dudas
    *   **Uso típico:** "No estoy seguro en qué etapa está este video"
    
2.  **❗ WARNING (Alerta del Sistema):**
    *   **Control:** Solo el SISTEMA lo añade/quita automáticamente
    *   **Propósito:** Detectar inconsistencias o situaciones ilógicas
    *   **Cuándo aparece:**
        *   Videos en desarrollo/producción que pasan a fecha pasada sin actualizar
        *   Estados ilógicos en fechas pasadas
        *   **📅❗**: PENDING con nombre escrito (debería ser DEVELOPMENT)
        *   **⬜❗**: EMPTY con nombre escrito (inconsistencia)
        *   Cualquier estado que el sistema considera que necesita atención

**Ejemplos de Combinaciones:**
- `🟦☕❓` = "Grabando pero tengo dudas"
- `🟨💻❗` = "Editando pero el sistema detectó algo problemático"
- `📅❗` = "Pendiente con nombre (debería ser Development)"
- `🟩🌐❓❗` = "Publicado+Programado con dudas del usuario Y alerta del sistema"

#### Lógica de Tiempo Pasado y Transiciones Automáticas

**Estados Válidos en Tiempo Pasado:**
- **⬜ EMPTY**: "No hice video ese día"
- **🟩 PUBLISHED**: "Publiqué el video ese día"

**Estados que NO Tienen Sentido en Tiempo Pasado (pero permitidos):**
- **🟦 DEVELOPMENT** o **🟨 PRODUCTION**: El sistema añade ❗ WARNING automáticamente

**Transiciones Automáticas por Tiempo:**
1. **📅** → **⬜** (Pending se vacía al pasar la fecha)
2. **🟩🌐** → **🟩** (Ya no está "programado", simplemente "publicado")
3. **🟦, 🟨** → **🟦❗, 🟨❗** (Advierte que no tiene sentido en el pasado)

**Transiciones por Acciones del Usuario:**
1. Escribir nombre en **📅** → **🟦**
2. Borrar nombre completamente → **📅** (en futuro) o **⬜** (en pasado)
3. Escribir nombre en **⬜** (pasado) → **🟦❗** (Development + alerta)

**Alertas por Inconsistencias:**
1. **📅 con nombre** → **📅❗** (debería ser 🟦)
2. **⬜ con nombre** → **⬜❗** (no tiene sentido)

## III. Formularios y Pop-ups Contextuales

La mayoría de las ediciones se realizarán inline o mediante pop-ups pequeños y contextuales para mantener al usuario en la vista de calendario. Los modales grandes se reservarán para acciones más complejas como "Añadir en Lote" o configuraciones.

### A. Edición Inline del Nombre y Descripción del Video
*   Directamente en la celda del slot en la cuadrícula del calendario.
*   Guardado al presionar Enter o al perder el foco (onblur).
*   Transiciones automáticas de estado según la acción y el contexto temporal.

### B. Pop-up/Selector de Estado (`StatusSelector.jsx`)
*   Aparece al hacer clic en los indicadores de estado de un video en la cuadrícula.
*   **Contenido:** 
    *   Opciones visuales (emoji + texto) para seleccionar el estado principal
    *   Si el estado principal elegido tiene sub-estados normales disponibles, se presentan opciones
    *   Sección para sub-estados apilables:
        *   **❓ QUESTION**: Toggle que el usuario puede activar/desactivar
        *   **❗ WARNING**: Solo informativo (no editable por el usuario)
*   **Acción:** Actualiza el estado/sub-estado del video y guarda los cambios. El pop-up se cierra.
*   **Control Total:** Permite cambiar a cualquier estado, incluyendo estados que podrían no tener sentido (el sistema añadirá alertas si es necesario).

### C. Pop-up/Formulario de Ingresos del Día (`DailyIncomeForm.jsx`)
*   Aparece al hacer clic en la celda "Ingresos" de un día.
*   **Campos:** Monto, Moneda (selector), Pagador (texto), Estado del Pago (selector: Pendiente, Pagado).
*   **Acción:** Guarda/actualiza el ingreso para ese día específico. El pop-up se cierra.

### D. Formulario de Detalles del Video (`VideoForm.jsx` - Modal Opcional para Detalles Extendidos)
*   **Acceso:** Podría haber un botón "Editar Detalles Completos" en el `StatusSelector.jsx` o en un menú contextual del video para acceder a campos menos frecuentes que no se editan inline o con el selector rápido de estado.
*   **Campos (si se implementa este modal):** Descripción detallada (Rich Text si es posible), Plataforma, URL Publicado, Fecha de Publicación, Duración, Tags, Metadatos de Producción (Guionista, etc.).
*   **Nota:** La edición del título, descripción breve y el estado se prioriza inline o con el pop-up de estado rápido. Este formulario es para una edición más exhaustiva.

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
    *   **Nueva funcionalidad:** Conteos separados para videos con alertas:
        *   Ej: 🟦❗ DESARROLLO CON ALERTAS [3], ❓ VIDEOS CON DUDAS [7]
*   **Sección de Ganancias del Mes (integrada o separada en este panel):**
    *   Ganancias por divisa (USD, EUR, ARS) basadas en los ingresos diarios registrados.
    *   Total en ARS (calculado con tasas de cambio configuradas).
    *   Equivalentes totales en USD y EUR.

## V. Configuración del Plugin (`SettingsPanelWidget.jsx`)

Integrado en la configuración de Atlas o accesible desde la página del plugin.

*   Moneda por defecto para nuevos ingresos diarios.
*   Tasas de cambio (interfaz para ver/editar las tasas).
*   Lista de plataformas de video (para selectores en el `VideoForm.jsx` de detalles extendidos).
*   Configuración de alertas automáticas (activar/desactivar diferentes tipos de warnings).
*   (Opcional) Botón para "Restablecer/Borrar todos los datos del Video Scheduler".

## VI. Flujos de Usuario Clave Actualizados

*   **Planificar un Nuevo Video:**
    1.  Usuario identifica un slot "Pendiente" (📅) en el calendario.
    2.  Escribe directamente el nombre del video en el input del slot.
    3.  Al presionar Enter/blur, el estado del slot cambia automáticamente a "Desarrollo" (🟦) y el nombre se guarda.
    
*   **Actualizar Estado de un Video (Control Total):**
    1.  Usuario hace clic en **cualquier** indicador de estado (incluyendo 📅 y ⬜).
    2.  Aparece el `StatusSelector.jsx` contextual.
    3.  Usuario selecciona un nuevo estado principal (ej. 🟨 Producción) y luego un sub-estado normal (ej. 💻 Edición).
    4.  Opcionalmente puede marcar ❓ si tiene dudas.
    5.  El selector se cierra, los indicadores en la cuadrícula se actualizan (ej. `🟨💻` o `🟨💻❓`).
    
*   **Manejo de Alertas del Sistema:**
    1.  Usuario observa ❗ en un video (ej. `🟦☕❗`).
    2.  Hace clic en los indicadores para ver el `StatusSelector.jsx`.
    3.  El sistema muestra información sobre por qué hay alerta.
    4.  Usuario puede cambiar el estado para resolver la inconsistencia, o dejarlo si considera que está bien.
    5.  El ❗ desaparece automáticamente si se resuelve la inconsistencia.
    
*   **Trabajar con Tiempo Pasado:**
    1.  Usuario revisa días pasados y ve videos con ❗ (ej. `🟦❗` - desarrollo en fecha pasada).
    2.  Evalúa qué realmente pasó con esos videos.
    3.  Cambia a estado apropiado: 🟩 si se publicó, ⬜ si no se hizo nada.
    4.  El ❗ desaparece automáticamente al asignar un estado lógico para tiempo pasado.
    
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
    2.  Observa la columna "Resumen" de cada día para un vistazo rápido del progreso, incluyendo alertas y dudas.
    3.  Identifica rápidamente días con problemas (presencia de ❗) o dudas (presencia de ❓).
    4.  Consulta el panel de "Estadísticas" para ver los conteos detallados, ganancias, y métricas de alertas.

## VII. Ejemplos de Progresión de Estados

### Progresión Normal de un Video:
1. **📅** → Escribes nombre → **🟦** → Grabas → **🟦☕**
2. **🟦☕** → Terminas grabación → **🟨💻** (editando)
3. **🟨💻** → Terminas edición → **🟨✏️** (thumbnail)
4. **🟨✏️** → Terminas thumbnail → **🟨🕰️** (programando)
5. **🟨🕰️** → Publicas y programas → **🟩🌐** (publicado para el futuro)
6. **🟩🌐** → Pasa la fecha → **🟩** (ya está publicado)

### Situaciones con Sub-estados Apilables:
- **🟨💻❓**: "Estoy editando pero no recuerdo en qué parte iba"
- **🟦☕❗**: "El sistema me avisa que este video 'en grabación' ya pasó de fecha"
- **📅❗**: "Tengo nombre escrito pero el estado sigue en pendiente"
- **⬜❗**: "Tengo nombre escrito pero el estado dice 'no programar'"
- **🟩🌐❓**: "Está programado pero tengo dudas sobre algo"
- **🟨✏️❓❗**: "Tengo dudas sobre el thumbnail Y el sistema detectó algo raro"

### Flujo de Resolución de Alertas:
1. **📅** con nombre escrito → Sistema añade **📅❗**
2. Usuario ve la alerta y hace clic en el estado
3. `StatusSelector.jsx` explica: "Tienes nombre pero estado pendiente"
4. Usuario cambia a **🟦** → Alerta desaparece automáticamente

## VIII. Principios de Interacción

1. **Control Total sin Restricciones:** El usuario puede cambiar cualquier estado en cualquier momento, incluso si no tiene sentido lógico.

2. **Orientación Visual No Invasiva:** El sistema proporciona alertas visuales (❗) pero nunca bloquea acciones del usuario.

3. **Feedback Inmediato:** Todos los cambios se reflejan instantáneamente en la interfaz.

4. **Flexibilidad Temporal:** El sistema maneja automáticamente las transiciones por tiempo pero permite override manual.

5. **Claridad de Intención:** Cada emoji tiene un significado claro y consistente, y las combinaciones siguen reglas lógicas predecibles.

6. **Escalabilidad Visual:** El sistema de iconos funciona tanto para vista rápida (columna resumen) como para edición detallada (selector de estados).

Este sistema de estados actualizado proporciona un equilibrio perfecto entre automatización inteligente y control total del usuario, permitiendo un flujo de trabajo natural mientras mantiene la flexibilidad para casos de uso diversos y cambios de planes.