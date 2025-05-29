# 🎬 Plugin: Planificador de Videos (Video Scheduler) para Atlas

**Versión del Plugin:** 0.8.4 (o la versión actual de tu plugin)
**Compatible con Atlas Core:** 0.3.0 - 0.9.9 (o los valores de `minAppVersion` y `maxAppVersion` de tu plugin)

## Visión General

El **Planificador de Videos** es un plugin avanzado para Atlas diseñado específicamente para creadores de contenido, youtubers, streamers y cualquier persona que gestione un flujo de producción de videos. Permite planificar visualmente el contenido en un calendario mensual, seguir el progreso de cada video a través de diferentes etapas de producción, gestionar ingresos asociados y analizar estadísticas detalladas.

## ✨ Características Principales

- **Calendario Mensual Dedicado:**
  - Visualiza y planifica tus videos en una interfaz de calendario mensual con slots horarios predefinidos (ej. 7am, 15pm, 22pm).
  - Edición inline rápida del nombre del video y una descripción breve directamente en la celda del slot.
- **Sistema de Estados Detallado:**
  - **Estados Principales:** `Pendiente` (📅), `Vacío` (⬜), `Desarrollo` (🟦), `Producción` (🟨), `Publicado` (🟩).
  - **Sub-Estados Normales:** Para detallar la etapa actual (ej. `Grabando` ☕ para Desarrollo; `Editando` 💻, `Thumbnail` ✏️, `Programando Post` 🕰️ para Producción; `Programado` 🌐 para Publicado).
  - **Sub-Estados Apilables:** Marcas adicionales como `Duda` (❓) para revisión del usuario o `Alerta` (❗) generada por el sistema para inconsistencias.
  - Fácil cambio de estados mediante un selector contextual visual con emojis.
- **Gestión de Ingresos Diarios:**
  - Registra los ingresos obtenidos por día.
  - Especifica el monto, la moneda original y el pagador.
  - Marca el estado del pago (Pendiente/Pagado).
- **Configuración de Monedas y Tasas de Cambio:**
  - Define tu moneda principal para la visualización de totales y estadísticas.
  - Añade múltiples divisas en las que recibes ingresos.
  - Configura las tasas de cambio entre tus divisas de ingreso y tu moneda principal.
- **Formularios Dedicados:**
  - **Detalles Extendidos del Video:** Un modal para añadir información más completa como descripción larga, plataforma de publicación, URL, duración del video y etiquetas.
  - **Añadir Videos en Lote:** Crea múltiples videos en serie con patrones de frecuencia (diaria con intervalo, o semanal seleccionando días y horarios).
  - **Formulario de Ingresos Diarios:** Pop-up contextual para añadir o editar rápidamente los ingresos de un día específico.
- **Panel de Estadísticas Avanzado:**
  - **Vista General del Mes:** Resumen del estado de los videos (cuántos en desarrollo, producción, publicados, etc.) y de los ingresos (total por divisa, total en moneda principal, estado de pagos).
  - **(Futuro/Planeado) Gráficos:** Representaciones visuales del progreso y los ingresos.
  - **(Futuro/Planeado) Comparación entre Meses:** Analiza tu rendimiento a lo largo del tiempo.
- **Gestión de Datos del Plugin:**
  - **Importar/Exportar:** Realiza copias de seguridad o migra todos los datos del plugin (videos, ingresos, configuración de moneda) usando archivos JSON.
  - **Restablecer Datos:** Opción para limpiar los datos del mes actual visible o borrar completamente todos los datos del plugin.
- **Integración con Atlas Core:**
  - Añade un ítem "Video Scheduler" a la barra de navegación principal de Atlas.
  - Proporciona una página dedicada para la planificación.
  - Integra un widget en el panel de configuración de Atlas para la gestión básica de la moneda principal.

## 🛠️ Requisitos

- Atlas Core: v0.3.0 o superior (verifica la compatibilidad específica en el `index.js` del plugin).
- Permisos requeridos en Atlas: `ui`, `storage`.

## 🚀 Instalación

1.  Si has obtenido el plugin como una carpeta, colócala dentro del directorio `plugins/` de tu instalación de Atlas.
2.  Si lo obtienes desde el Marketplace de Atlas (cuando esté disponible), sigue las instrucciones de instalación del Marketplace.
3.  Una vez instalado, activa el plugin "Video Scheduler" desde el panel de configuración de plugins en Atlas si no se activa automáticamente.

## ⚙️ Uso y Configuración

### Navegación

- Accede al planificador haciendo clic en el ítem **"Video Scheduler"** (icono 🎬 o similar) en la barra de navegación principal de Atlas.

### Planificación de Videos

1.  **Añadir un Video:**
    - En la vista de calendario mensual, haz clic en un slot horario vacío (generalmente marcado como `Pendiente` 📅 con "...") y escribe el nombre de tu video.
    - Al presionar Enter o desenfocar el campo, el estado cambiará automáticamente a `Desarrollo` (🟦).
2.  **Editar Nombre/Descripción Breve:** Haz clic directamente en el campo de nombre o descripción en la celda del slot y edita el texto.
3.  **Cambiar Estado:**
    - Haz clic en el conjunto de emojis de estado a la derecha del nombre del video.
    - Se abrirá un pop-up (`StatusSelector`) donde podrás elegir el estado principal, el sub-estado normal (si aplica para el principal), y marcar/desmarcar el estado de `Duda` (❓).
4.  **Editar Detalles Extendidos:**
    - Haz clic en el icono de "editar detalles" (📝 o similar) que aparece junto al nombre del video.
    - Se abrirá un modal (`VideoForm`) donde podrás añadir descripción larga, plataforma, URL, duración y etiquetas.
5.  **Añadir Videos en Lote:**
    - Haz clic en el botón **"Añadir Lote"** en el encabezado de la página del planificador.
    - Completa el formulario (`BulkAddForm`) especificando el nombre base, numeración, cantidad, fecha de inicio y frecuencia.

### Gestión de Ingresos

1.  **Añadir/Editar Ingreso Diario:**
    - En la columna "Ingresos" del calendario, haz clic en la celda del día correspondiente.
    - Se abrirá un pop-up (`DailyIncomeForm`).
    - Introduce el monto, selecciona la moneda, el pagador (opcional) y el estado del pago (Pendiente/Pagado).
    - Guarda los cambios.
2.  **Eliminar Ingreso Diario:** Abre el formulario de ingresos para el día y utiliza la opción "Eliminar".

### Configuración de Moneda

1.  **Moneda Principal:**
    - Ve al panel de **Configuración** de Atlas.
    - Busca la sección del plugin "Video Scheduler".
    - Selecciona tu moneda principal preferida. Todos los totales y estadísticas se mostrarán convertidos a esta moneda.
2.  **Tasas de Cambio y Divisas de Ingreso:**
    - En la página principal del plugin "Video Scheduler", haz clic en el botón **"Monedas"** (o "Configurar Tasas").
    - Se abrirá un modal (`CurrencyRateForm`) donde podrás:
      - Añadir las diferentes divisas en las que recibes ingresos.
      - Establecer la tasa de cambio de cada una de esas divisas con respecto a tu moneda principal (ej. si tu moneda principal es USD, defines cuántos USD equivale 1 EUR, 1 ARS, etc.).

### Estadísticas

- Haz clic en el botón **"Estadísticas"** en el encabezado de la página del planificador para abrir el panel de estadísticas (`StatsPanel`).
- Aquí podrás ver un resumen del estado de tus videos e ingresos para el mes seleccionado, y potencialmente compararlo con otros meses.

### Gestión de Datos

- **Importar/Exportar:** Usa el botón **"Import/Export"** para guardar todos tus datos del Video Scheduler en un archivo JSON o para restaurar datos desde un archivo previamente exportado. **¡Cuidado! La importación reemplazará todos los datos actuales del plugin.**
- **Restablecer Datos:** Usa el botón **"Resetear"** si necesitas limpiar los datos. Podrás elegir entre restablecer solo el mes actual visible o todos los datos del plugin (videos, ingresos y configuración de moneda a sus valores por defecto). **Esta acción no se puede deshacer.**

## 📁 Estructura de Archivos del Plugin (Para Desarrolladores)

```
video-scheduler/
├── index.js                 # Lógica principal, API, registro de extensiones
├── components/              # Componentes React
│   ├── VideoSchedulerNavItem.jsx
│   ├── VideoSchedulerMainPage.jsx
│   ├── DayCell.jsx, VideoSlotCell.jsx, DaySummaryCell.jsx, DailyIncomeCell.jsx
│   ├── StatusSelector.jsx, DailyIncomeForm.jsx, VideoForm.jsx
│   ├── BulkAddForm.jsx, CurrencyRateForm.jsx
│   ├── StatsPanel.jsx, StatsOverviewPanel.jsx
│   ├── SettingsPanelWidget.jsx
│   ├── ImportExportModal.jsx, ResetDataModal.jsx
│   └── ...
├── utils/
│   └── constants.js         # Definiciones de estados, emojis, monedas, etc.
├── styles/                  # Hojas de estilo CSS
│   └── index.css            # Importa todos los demás CSS del plugin
│   └── ... (CSS por componente)
├── docs/                    # Documentación específica del plugin
│   ├── STATUS_SYSTEM.md
│   └── VIDEO_SCHEDULER_UX_VISION.md
└── README.md                # Este archivo
```

## 💡 Consejos de Uso

- Define tu **moneda principal** y las **tasas de cambio** primero para una correcta visualización de las estadísticas de ingresos.
- Utiliza el sistema de **estados y sub-estados** para tener un control granular del progreso de tus videos.
- La función de **Añadir en Lote** es ideal para planificar series de videos o contenido recurrente.
- Realiza **exportaciones periódicas** de tus datos como copia de seguridad.

Disfruta planificando tu contenido de video con Atlas y el plugin Video Scheduler.
