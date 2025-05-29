# 📝 Propuestas de Mejoras para Plugin de Notas
## Definición de Experiencia de Usuario por Funcionalidad

---

## 🔗 CATEGORÍA: Integración Avanzada con el Calendario

### 1. Notas Vinculadas a Eventos

**Experiencia del Usuario:**

**Crear nota desde un evento:**
1. El usuario hace clic derecho sobre cualquier evento en el calendario
2. Aparece un menú contextual con la opción "📝 Crear nota para este evento"
3. Al hacer clic, se abre automáticamente el formulario de nueva nota con:
   - Título prellenado: "Notas: [Nombre del Evento]"
   - Fecha y hora del evento ya incluidas
   - Una etiqueta automática "calendario" agregada
4. El usuario escribe su contenido y guarda la nota
5. La nota queda automáticamente vinculada al evento

**Ver notas de un evento:**
1. El usuario hace clic en cualquier evento del calendario
2. En el panel de detalles del evento, aparece una nueva sección "📝 Notas (2)" 
3. Muestra una lista compacta de todas las notas vinculadas a ese evento
4. Cada nota muestra: título, primeras 2 líneas de contenido, fecha de creación
5. Al hacer clic en cualquier nota, navega directamente a la página de notas con esa nota seleccionada

**Gestionar vinculación:**
1. En la página de notas, cada tarjeta muestra un ícono 📅 si está vinculada a un evento
2. Al hacer hover sobre el ícono, aparece tooltip: "Vinculada a: [Nombre del Evento]"
3. Botón "🔗 Vincular evento" en el formulario de edición de notas
4. Al hacer clic, aparece un selector de eventos con calendario mini
5. El usuario selecciona el evento y la vinculación se guarda automáticamente

---

### 2. Widget en Vista de Eventos

**Experiencia del Usuario:**

**En la vista detallada de eventos:**
1. El usuario hace clic en cualquier evento para ver sus detalles
2. Aparece una nueva tarjeta/widget al final del panel de detalles
3. El widget muestra:
   - Encabezado: "📝 Notas del Evento (3)"
   - Lista de notas con título y preview de 1 línea cada una
   - Botón "+ Nueva Nota" prominente
4. Al hacer clic en cualquier nota del widget, abre la nota en modo vista rápida (modal)
5. Al hacer clic en "+ Nueva Nota", crea inmediatamente una nota vinculada con plantilla de reunión

**Vista rápida de nota desde evento:**
1. Se abre un modal overlay sobre el calendario
2. Muestra la nota completa con su contenido rico
3. Botones: "✏️ Editar", "🗑️ Eliminar", "↗️ Abrir en Notas"
4. El usuario puede editar directamente desde ahí sin salir del calendario
5. Los cambios se guardan automáticamente

---

### 3. Creación Rápida desde Calendario

**Experiencia del Usuario:**

**Botón en celdas del calendario:**
1. Al hacer hover sobre cualquier celda de día en el calendario, aparece un pequeño botón "+" semi-transparente en la esquina
2. Al hacer clic, se abre un mini-formulario flotante sobre esa celda
3. El mini-formulario tiene solo: campo de título y botón "Crear nota rápida"
4. Al enviar, crea una nota con la fecha de esa celda como contexto
5. Opción "Crear nota completa" que abre el formulario normal

**Menú contextual mejorado:**
1. Clic derecho en cualquier parte del calendario abre menú contextual
2. Opciones según el lugar del clic:
   - En espacio vacío: "📝 Nueva nota", "📝 Nueva nota para hoy"
   - En evento: "📝 Nueva nota para este evento", "📝 Ver notas del evento"
   - En día específico: "📝 Nueva nota para [fecha]"
3. Cada opción lleva a la acción correspondiente con contexto prellenado

---

## 📊 CATEGORÍA: Organización y Categorización

### 4. Sistema de Etiquetas

**Experiencia del Usuario:**

**Agregar etiquetas al crear nota:**
1. En el formulario de nueva nota, debajo del contenido aparece un campo "🏷️ Etiquetas"
2. Al escribir, aparece autocompletado con etiquetas existentes
3. Al presionar Enter o coma, se agrega la etiqueta como "chip" de color
4. Las etiquetas aparecen como pequeñas píldoras azules debajo del campo
5. Cada etiqueta tiene una "×" para eliminarla fácilmente

**Gestión de etiquetas existentes:**
1. En la página de notas, nuevo filtro lateral "🏷️ Etiquetas" con lista expandible
2. Cada etiqueta muestra: nombre y cantidad de notas (ej: "trabajo (12)")
3. Al hacer clic en una etiqueta, filtra instantáneamente las notas
4. Múltiples etiquetas seleccionadas = filtro AND (notas que tengan todas)
5. Botón "Limpiar filtros" para volver a ver todas las notas

**Editar etiquetas rápidamente:**
1. En vista de tarjeta de nota, las etiquetas aparecen en la parte inferior como chips pequeños
2. Al hacer clic en cualquier chip, se puede editar el nombre directamente (inline editing)
3. Al hacer doble clic en el área de etiquetas, se activa modo "edición rápida"
4. Aparece el campo de etiquetas igual que en creación, se pueden agregar/quitar
5. Los cambios se guardan automáticamente al hacer clic fuera

**Gestión global de etiquetas:**
1. Nueva pestaña/sección "🏷️ Gestionar Etiquetas" en la página de notas
2. Vista de tabla con todas las etiquetas: nombre, cantidad de usos, color
3. Opciones por etiqueta: renombrar, cambiar color, fusionar con otra, eliminar
4. Al eliminar una etiqueta, pregunta qué hacer con las notas que la tenían
5. Bulk actions: seleccionar múltiples etiquetas para acciones masivas

---

### 5. Filtros Avanzados

**Experiencia del Usuario:**

**Panel de filtros lateral:**
1. En la página de notas, aparece un panel lateral izquierdo colapsable "🔍 Filtros"
2. Secciones del panel:
   - 📅 Fecha: selector de rango con calendar widget
   - 🏷️ Etiquetas: lista con checkboxes de todas las etiquetas
   - 📂 Categoría: dropdown con las categorías disponibles
   - ⭐ Prioridad: botones de radio (Alta/Media/Baja/Todas)
   - 🔗 Vinculación: toggle "Solo notas de eventos" / "Solo notas independientes"
3. Los filtros se aplican en tiempo real conforme el usuario selecciona opciones
4. Contador en la parte superior: "Mostrando 23 de 150 notas"

**Filtros rápidos (botones de acceso rápido):**
1. Fila de botones encima del grid de notas:
   - "📅 Hoy" - notas creadas hoy
   - "📅 Esta semana" - notas de los últimos 7 días
   - "⭐ Importantes" - notas de prioridad alta
   - "🔗 Con eventos" - notas vinculadas a eventos
   - "❤️ Favoritas" - notas marcadas como favoritas
2. Al hacer clic en cualquier botón, se aplica el filtro instantáneamente
3. Los botones se pueden combinar (múltiple selección)
4. Botón "🔄 Limpiar" para quitar todos los filtros

**Búsqueda con filtros combinados:**
1. La barra de búsqueda existente se expande con un botón "⚙️" al lado
2. Al hacer clic, se despliega panel de búsqueda avanzada debajo
3. Campos disponibles:
   - Buscar en: títulos, contenido, etiquetas (checkboxes)
   - Tipo de contenido: texto plano, con formato, con imágenes
   - Autor: si hay múltiples usuarios (futuro)
   - Modificado: antes/después de fecha específica
4. Botón "🔍 Buscar" aplica todos los criterios combinados
5. Se puede guardar la búsqueda como "búsqueda guardada" para uso futuro

---

## 🔍 CATEGORÍA: Búsqueda y Navegación Mejorada

### 6. Búsqueda Semántica

**Experiencia del Usuario:**

**Búsqueda inteligente mejorada:**
1. El usuario empieza a escribir en la barra de búsqueda
2. Aparece dropdown con sugerencias mientras escribe:
   - Coincidencias exactas en títulos
   - Coincidencias en contenido
   - Etiquetas relacionadas
   - Fechas cercanas ("notas de ayer", "notas de esta semana")
3. Resultados destacan las palabras encontradas con background amarillo
4. Búsqueda por sinónimos: buscar "reunión" también encuentra "junta", "meeting"

**Búsqueda por voz (opcional):**
1. Botón de micrófono 🎤 al lado de la barra de búsqueda
2. Al hacer clic, inicia grabación de voz
3. El usuario dice: "buscar notas sobre el proyecto Atlas de la semana pasada"
4. Se convierte a texto y ejecuta búsqueda automáticamente
5. Funciona con comandos naturales como "mostrar mis notas importantes" o "notas del lunes"

---

### 7. Vista de Línea de Tiempo

**Experiencia del Usuario:**

**Activar vista de línea de tiempo:**
1. En la página de notas, botones de vista: "📱 Tarjetas" | "📅 Línea de Tiempo" | "📋 Lista"
2. Al seleccionar "Línea de Tiempo", el layout cambia a vista cronológica vertical
3. Eje central con fechas marcadas cada cierto intervalo
4. Notas aparecen como burbujas conectadas al eje por fecha de creación
5. Eventos del calendario aparecen como elementos diferentes (ej: rectángulos vs círculos para notas)

**Navegación temporal:**
1. Controles superiores: "← Anterior" | "Hoy" | "Siguiente →"
2. Selector de período: "📅 Día" | "📅 Semana" | "📅 Mes" | "📅 Año"
3. Mini-calendario lateral para saltar a fecha específica
4. Al hacer clic en cualquier fecha del mini-calendario, centra la línea de tiempo en esa fecha
5. Scroll infinito: al llegar al final, carga automáticamente más contenido histórico

**Interacción en línea de tiempo:**
1. Al hacer hover sobre cualquier elemento, se expande mostrando preview
2. Clic en nota abre vista rápida en modal
3. Clic en evento del calendario abre detalles del evento con notas relacionadas
4. Arrastrar notas verticalmente para cambiar su fecha (reposicionamiento temporal)
5. Zoom in/out con rueda del mouse para ver más/menos detalle temporal

---

## 💼 CATEGORÍA: Funcionalidades Profesionales

### 8. Plantillas de Notas

**Experiencia del Usuario:**

**Acceso a plantillas:**
1. En el botón "Nueva Nota", aparece una flecha dropdown al lado
2. Al hacer clic en la flecha, se despliega menú con opciones:
   - "📝 Nota en blanco" (comportamiento actual)
   - "📋 Desde plantilla..."
   - "🎯 Nota rápida"
3. Al seleccionar "Desde plantilla", abre modal de selección de plantillas

**Selector de plantillas:**
1. Modal con grid de plantillas disponibles, cada una muestra:
   - Icono representativo
   - Nombre de la plantilla
   - Vista previa miniatura del contenido
   - Breve descripción del uso
2. Plantillas incluidas:
   - 🤝 "Notas de Reunión" - agenda, participantes, decisiones
   - 📊 "Plan de Proyecto" - objetivos, timeline, recursos
   - 💡 "Lluvia de Ideas" - lista numerada con categorías
   - 📝 "Diario Personal" - fecha, mood, eventos del día
   - 🎯 "Objetivos y Metas" - objetivos SMART, pasos, métricas
   - 📞 "Llamada Telefónica" - contacto, propósito, acuerdos
3. Al seleccionar una plantilla, abre el formulario de creación con contenido prellenado

**Creación de plantillas personalizadas:**
1. Botón "➕ Crear Plantilla" en el modal de selección
2. Formulario para crear plantilla:
   - Nombre de la plantilla
   - Icono (selector de iconos predefinidos)
   - Contenido base (usando el editor rico)
   - Variables dinámicas: {fecha}, {hora}, {nombreEvento}
3. La plantilla se guarda y aparece en la lista personal del usuario
4. Opción de exportar/importar plantillas para compartir con otros usuarios

**Gestión de plantillas:**
1. Sección "⚙️ Gestionar Plantillas" en configuración del plugin
2. Lista de todas las plantillas: predeterminadas y personalizadas
3. Acciones por plantilla: editar, duplicar, eliminar, exportar
4. Estadísticas de uso: cuántas veces se ha usado cada plantilla
5. Posibilidad de marcar plantillas como "favoritas" para acceso rápido

---

### 9. Colaboración y Compartir

**Experiencia del Usuario:**

**Compartir una nota:**
1. En cualquier tarjeta de nota, nuevo botón "🔗 Compartir" en las acciones
2. Al hacer clic, abre modal con opciones de compartir:
   - 📧 "Enviar por email" - abre cliente de email con contenido
   - 🔗 "Crear enlace público" - genera URL temporal
   - 📋 "Copiar como texto" - copia contenido al portapapeles
   - 📄 "Exportar PDF" - descarga la nota como PDF formateado
3. Para enlace público: selector de duración (1 día, 1 semana, 1 mes, sin límite)
4. Opción de proteger con contraseña el enlace público

**Vista pública de nota compartida:**
1. Al acceder al enlace público, se abre página limpia con solo el contenido de la nota
2. Header mínimo: "📝 Nota compartida desde Atlas"
3. Contenido de la nota con formato preservado
4. Footer: "Creado con [Atlas Notes Plugin]" + fecha de expiración si aplica
5. Sin opciones de edición, solo lectura
6. Opción de "💾 Guardar copia" que permite al visitante exportar

**Exportación avanzada:**
1. Menú "📤 Exportar" en la página principal de notas
2. Opciones de exportación:
   - 📄 "PDF de todas las notas" - documento único con índice
   - 📄 "PDFs individuales" - archivo ZIP con cada nota por separado
   - 📝 "Markdown" - archivo .md o .zip con todas las notas
   - 📊 "CSV/Excel" - datos tabulares para análisis
   - 📁 "JSON" - formato técnico para respaldo/migración
3. Configuración de exportación: incluir metadatos, etiquetas, fechas
4. Barra de progreso para exportaciones grandes

---

## 📱 CATEGORÍA: Experiencia de Usuario Avanzada

### 10. Atajos de Teclado Globales

**Experiencia del Usuario:**

**Configuración de atajos:**
1. Nueva sección "⌨️ Atajos de Teclado" en configuración del plugin
2. Lista de acciones disponibles con combinación de teclas asignada:
   - `Ctrl + Shift + N` - Nueva nota rápida
   - `Ctrl + Shift + F` - Búsqueda global en notas
   - `Ctrl + Shift + T` - Nueva nota para evento seleccionado
   - `Ctrl + Shift + L` - Alternar vista línea de tiempo
   - `Alt + N` - Enfocar en barra de búsqueda de notas
3. Cada atajo se puede personalizar haciendo clic y presionando nueva combinación
4. Validación de conflictos: alerta si el atajo ya está en uso por otra función

**Uso de atajos:**
1. Los atajos funcionan desde cualquier parte de Atlas, no solo en la página de notas
2. `Ctrl + Shift + N` abre modal de creación rápida sobre la vista actual
3. El modal incluye campos básicos: título, contenido, etiquetas rápidas
4. Al guardar, se cierra automáticamente y muestra notificación de éxito
5. `Ctrl + Shift + F` abre overlay de búsqueda con foco automático en el campo

**Creación rápida desde calendario:**
1. Si el usuario está viendo un evento específico y usa `Ctrl + Shift + T`
2. Se abre directamente formulario de nota con plantilla de reunión
3. Datos del evento (título, fecha, hora) ya están prellenados
4. El usuario solo debe agregar contenido y guardar
5. La nota queda automáticamente vinculada al evento

---

### 11. Modo de Enfoque y Escritura

**Experiencia del Usuario:**

**Activar modo enfoque:**
1. En cualquier nota abierta para edición, botón "🎯 Modo Enfoque" en la barra superior
2. Al hacer clic, la interfaz se transforma:
   - Se ocultan sidebars, header y navegación de Atlas
   - Solo queda visible el editor de la nota
   - Background oscuro o con imagen relajante (configurable)
   - Editor centrado con ancho máximo cómodo para lectura
3. Animación suave de transición (1 segundo) hacia el modo enfoque

**Funcionalidades del modo enfoque:**
1. Barra de herramientas mínima flotante que aparece al hacer hover arriba
2. Contador de palabras y caracteres en esquina inferior derecha
3. Indicador de tiempo escribiendo en la sesión actual
4. Guardado automático cada 30 segundos (con indicador visual discreto)
5. Tecla `Esc` para salir del modo enfoque, `F11` para pantalla completa

**Configuración del ambiente:**
1. Menú "⚙️" en modo enfoque para personalizar:
   - Background: color sólido, gradiente, imagen, modo oscuro
   - Tipografía: tamaño de fuente, familia, espaciado de líneas
   - Sonidos ambientales: lluvia, café, biblioteca (opcional)
   - Metas de sesión: palabras objetivo, tiempo objetivo
2. Configuración se guarda como "perfil de escritura personal"
3. Diferentes perfiles para diferentes tipos de escritura

**Estadísticas de escritura:**
1. Al salir del modo enfoque, pequeño resumen de la sesión:
   - Tiempo total en modo enfoque
   - Palabras escritas en la sesión
   - Velocidad promedio de escritura
   - Objetivo cumplido o no
2. Historial de sesiones disponible en configuración para seguimiento personal

---

### 12. Notas Inteligentes

**Experiencia del Usuario:**

**Detección automática mientras escribe:**
1. Mientras el usuario escribe en el editor, el sistema detecta automáticamente:
   - Fechas mencionadas: "el próximo viernes", "15 de junio"
   - Tareas implícitas: "necesito llamar a Juan", "recordar enviar reporte"
   - Referencias a personas: @Juan, @María (si usa @ seguido de nombre)
   - Enlaces web: cualquier URL se convierte automáticamente en enlace
2. Elementos detectados aparecen subrayados discretamente con colores diferentes
3. Al hacer hover, tooltip muestra qué se detectó y opciones de acción

**Sugerencias inteligentes:**
1. Panel lateral derecho "🧠 Sugerencias" que aparece mientras escribe
2. Sugerencias contextuales basadas en el contenido:
   - "📅 Crear evento para 'reunión del viernes'" - si detecta fecha + evento
   - "🏷️ Agregar etiqueta 'proyecto-atlas'" - si detecta palabras clave recurrentes
   - "🔗 Vincular con evento similar del calendario" - si hay eventos relacionados
   - "📝 Ver notas relacionadas (3)" - si hay notas con contenido similar
3. Cada sugerencia tiene botón de acción directa para aplicarla inmediatamente

**Auto-completado inteligente:**
1. Al escribir, aparecen sugerencias basadas en:
   - Notas anteriores del usuario
   - Etiquetas existentes cuando escribe #
   - Nombres de eventos cuando escribe @evento
   - Plantillas de texto frecuentes
2. `Tab` para aceptar sugerencia, `Esc` para ignorar
3. El sistema aprende de las elecciones del usuario para mejorar sugerencias

**Acciones rápidas en texto seleccionado:**
1. Al seleccionar cualquier texto en una nota, aparece toolbar flotante
2. Además de formato (negrita, cursiva), incluye acciones inteligentes:
   - "📅 Crear evento" - si el texto parece fecha/hora
   - "☑️ Convertir a tarea" - agrega checkbox y lo marca como pendiente
   - "🔍 Buscar similar" - busca otras notas con contenido relacionado
   - "🏷️ Crear etiqueta" - convierte la selección en etiqueta de la nota
3. Las acciones aparecen solo si son relevantes para el texto seleccionado

---

## 🔄 CATEGORÍA: Automatización e Integración

### 13. Sincronización Externa

**Experiencia del Usuario:**

**Configuración de sincronización:**
1. Nueva sección "☁️ Sincronización" en configuración del plugin
2. Lista de servicios disponibles para conectar:
   - 📄 Google Drive - sincronizar como documentos
   - 📝 Notion - exportar páginas a workspace
   - 📧 Gmail - enviar notas por email automáticamente
   - 💾 Dropbox - respaldo automático en formato Markdown
3. Para cada servicio, botón "🔗 Conectar" que abre proceso de autenticación OAuth
4. Una vez conectado, configurar frecuencia: manual, diaria, semanal

**Proceso de sincronización:**
1. El usuario hace clic en "🔄 Sincronizar ahora" para cualquier servicio conectado
2. Barra de progreso muestra: "Sincronizando 23 notas con Google Drive..."
3. Opciones de sincronización:
   - Solo notas nuevas desde última sync
   - Solo notas modificadas
   - Todas las notas (resincronización completa)
4. Al completar, notificación: "✅ 5 notas nuevas sincronizadas, 2 actualizadas"

**Manejo de conflictos:**
1. Si una nota fue modificada tanto en Atlas como en el servicio externo
2. Modal de resolución de conflictos aparece:
   - Vista lado a lado: versión Atlas vs versión externa
   - Opciones: "Mantener Atlas", "Usar externa", "Fusionar manualmente"
   - Preview de cómo quedará después de la resolución
3. El usuario selecciona resolución y continúa con el resto de la sincronización

---

### 14. Recordatorios y Notificaciones

**Experiencia del Usuario:**

**Configurar recordatorio en nota:**
1. En el formulario de creación/edición de nota, nueva sección "⏰ Recordatorios"
2. Toggle "Activar recordatorio para esta nota"
3. Al activar, aparecen campos:
   - 📅 Fecha del recordatorio (date picker)
   - ⏰ Hora del recordatorio (time picker)
   - 🔔 Tipo: notificación, email, ambos
   - 📝 Mensaje personalizado del recordatorio
4. Opciones predefinidas: "En 1 hora", "Mañana a las 9:00", "En 1 semana"

**Gestión de recordatorios:**
1. Nueva página/tab "⏰ Mis Recordatorios" en el plugin de notas
2. Lista cronológica de todos los recordatorios pendientes:
   - Nota asociada (título y preview)
   - Fecha y hora del recordatorio
   - Tiempo restante ("en 2 horas", "en 3 días")
   - Estados: activo, pausado, vencido
3. Acciones por recordatorio: editar fecha, pausar, eliminar, marcar como completado

**Experiencia de notificación:**
1. A la hora configurada, aparece notificación del navegador:
   - Título: "📝 Recordatorio de Nota"
   - Mensaje: "Revisar notas de reunión con equipo"
   - Acciones: "Ver Nota", "Posponer 1h", "Marcar Completo"
2. Al hacer clic en "Ver Nota", abre Atlas y navega directamente a esa nota
3. Si está configurado email, también envía email con enlace directo

**Recordatorios recurrentes:**
1. Opción adicional "🔄 Repetir" en configuración de recordatorio
2. Frecuencias: diaria, semanal, mensual, personalizada
3. Ejemplo de uso: recordatorio semanal para revisar objetivos del mes
4. Los recordatorios recurrentes aparecen en lista con ícono especial 🔄

---

### 15. Análisis y Estadísticas Avanzadas

**Experiencia del Usuario:**

**Dashboard de estadísticas:**
1. Nueva pestaña "📊 Estadísticas" en la página de notas
2. Vista de dashboard con widgets informativos:
   - 📈 Gráfico de notas creadas por semana/mes
   - 🏷️ Nube de etiquetas con tamaños proporcionales al uso
   - ⏰ Heatmap de horarios más productivos para escribir
   - 📝 Promedio de palabras por nota, nota más larga/corta
   - 🔗 Porcentaje de notas vinculadas a eventos del calendario

**Análisis de hábitos de escritura:**
1. Widget "✍️ Tus Hábitos de Escritura":
   - Día de la semana que más escribes
   - Hora del día más productiva
   - Racha actual de días con al menos una nota
   - Racha más larga histórica
2. Gráfico de productividad semanal con barras por día
3. Comparación con período anterior: "Esta semana: +23% vs semana pasada"

**Insights inteligentes:**
1. Sección "💡 Insights" con observaciones automáticas:
   - "Escribes 40% más los martes que otros días"
   - "Tus notas de 'trabajo' son en promedio 3x más largas"
   - "Has usado la etiqueta 'importante' en 15% de tus notas este mes"
   - "Tienes 8 notas sin etiquetas que podrías organizar"
2. Cada insight incluye sugerencia de acción para mejorar organización

**Exportar estadísticas:**
1. Botón "📊 Exportar Reporte" genera documento PDF
2. Reporte incluye:
   - Resumen ejecutivo del período seleccionado
   - Gráficos principales de actividad
   - Lista de notas más importantes/utilizadas
   - Recomendaciones personalizadas de organización
3. Opción de reporte mensual automático por email

---

## 📋 CATEGORÍA: Funcionalidades Específicas

### 16. Lista de Tareas Integrada

**Experiencia del Usuario:**

**Creación de tareas en notas:**
1. En el editor de texto enriquecido, nuevo botón "☑️ Lista de Tareas" en la barra
2. Al hacer clic, inserta checkbox interactivo en el contenido
3. El usuario puede escribir la tarea después del checkbox
4. Presionar Enter crea automáticamente otro checkbox en la siguiente línea
5. Los checkboxes son funcionales: se pueden marcar/desmarcar directamente en la nota

**Conversión automática:**
1. Al escribir "- [ ]" o "* [ ]" en el editor, se convierte automáticamente a checkbox
2. Al escribir "TODO:" o "PENDIENTE:" al inicio de línea, sugiere convertir a tarea
3. Detección inteligente: frases como "necesito hacer", "recordar que" sugieren crear tarea

**Vista de tareas globales:**
1. Nueva pestaña "☑️ Mis Tareas" en la página de notas
2. Lista consolidada de todas las tareas de todas las notas:
   - ✅ Tareas completadas (plegables)
   - ⏳ Tareas pendientes (destacadas)
   - 📅 Tareas con fecha límite (ordenadas por urgencia)
3. Cada tarea muestra: descripción, nota de origen, fecha de creación
4. Al hacer clic en cualquier tarea, navega a la nota original con esa tarea resaltada

**Gestión de tareas:**
1. En la vista de tareas, opciones por tarea:
   - ✓ Marcar completada
   - 📅 Agregar fecha límite
   - ⭐ Marcar como importante
   - 🔗 Vincular a evento del calendario
2. Filtros: "Todas", "Pendientes", "Completadas", "Vencidas", "Esta semana"
3. Ordenamiento: por fecha límite, por importancia, por nota de origen, alfabético

---

### 17. Archivos Adjuntos

**Experiencia del Usuario:**

**Agregar archivos a nota:**
1. En el editor de nota, nuevo botón "📎 Adjuntar" en la barra de herramientas
2. Al hacer clic, abre selector de archivos del sistema
3. Tipos permitidos configurables: imágenes, PDFs, documentos, todos los tipos
4. Mientras se sube el archivo, barra de progreso aparece en el editor
5. Una vez subido, aparece como elemento en línea con icono del tipo de archivo + nombre

**Gestión de archivos adjuntos:**
1. Los archivos aparecen al final del contenido de la nota como lista
2. Cada archivo muestra: icono, nombre, tamaño, fecha de subida
3. Acciones por archivo: 👁️ "Vista previa", 💾 "Descargar", 🗑️ "Eliminar"
4. Para imágenes: vista previa en modal lightbox al hacer clic
5. Para PDFs: vista previa integrada en modal con navegación de páginas

**Límites y organización:**
1. Límite configurable por nota (ej: 10MB total de archivos)
2. Límite global por usuario/plugin (ej: 100MB)
3. Advertencia cuando se acerca al límite: "85% del espacio usado"
4. Vista "📎 Archivos" en página de notas muestra todos los archivos del plugin
5. Opción de limpiar archivos huérfanos (archivos de notas eliminadas)

**Arrastrar y soltar:**
1. El usuario puede arrastrar archivos directamente al editor desde el explorador
2. Área de drop se resalta cuando detecta archivo siendo arrastrado
3. Soltar archivo lo sube automáticamente e inserta en la posición del cursor
4. Para múltiples archivos, confirma antes de subir todos

---

### 18. Notas de Voz

**Experiencia del Usuario:**

**Grabación de voz:**
1. En el editor de nota, nuevo botón "🎤 Grabar Voz" en la barra de herramientas
2. Al hacer clic, solicita permisos de micrófono si es primera vez
3. Interfaz de grabación aparece:
   - Botón grande "🔴 REC" pulsando para indicar grabación activa
   - Contador de tiempo en tiempo real: "00:45"
   - Visualizador de onda de sonido en tiempo real
   - Botones: "⏸️ Pausar", "⏹️ Parar", "🗑️ Cancelar"

**Durante la grabación:**
1. Indicador visual discreto en toda la interfaz mostrando que se está grabando
2. Límite de tiempo configurable (ej: 5 minutos por grabación)
3. Advertencia a los 30 segundos finales: "⚠️ 30 segundos restantes"
4. Opción de pausar y reanudar grabación manteniendo un solo archivo
5. Cancelar elimina la grabación y no guarda nada

**Después de grabar:**
1. Modal de confirmación con opciones:
   - ▶️ "Reproducir" para escuchar antes de guardar
   - 💾 "Guardar como está"
   - 🎯 "Transcribir a texto" (si disponible)
   - 📝 "Guardar con descripción"
   - 🗑️ "Descartar"
2. Si elige transcribir, procesamiento automático convierte voz a texto
3. El texto transcrito se inserta en la nota, el audio se guarda como adjunto

**Reproducción y gestión:**
1. Notas de voz aparecen como elemento especial en la nota:
   - Icono 🎤 + duración + descripción (si tiene)
   - Player integrado: ▶️ play/pause, barra de progreso, control de volumen
   - Velocidad de reproducción: 0.5x, 1x, 1.25x, 1.5x, 2x
2. En vista de tarjeta de nota, indicador "🎤" si tiene grabaciones de voz
3. Lista de todas las grabaciones en sección "🎤 Notas de Voz" del plugin

**Funcionalidades avanzadas:**
1. Marcadores durante reproducción: hacer clic en momento específico para agregar marca
2. Notas timestamped: escribir texto que se vincula a momento específico del audio
3. Exportar solo el audio como archivo MP3/WAV
4. Compartir nota de voz como enlace que otros pueden escuchar

---

## 🚀 CATEGORÍA: Funcionalidades Futuras/Experimentales

### 19. Colaboración en Tiempo Real

**Experiencia del Usuario:**

**Compartir nota para colaboración:**
1. En cualquier nota, nuevo botón "👥 Colaborar" en las acciones
2. Al hacer clic, modal con opciones:
   - 📧 "Invitar por email" - campo para emails de colaboradores
   - 🔗 "Crear enlace colaborativo" - genera URL especial
   - ⚙️ "Configurar permisos" - lectura, comentarios, edición completa
3. Invitaciones se envían automáticamente con instrucciones

**Colaboración activa:**
1. Cuando múltiples usuarios editan simultáneamente:
   - Cursores de otros usuarios aparecen en colores diferentes
   - Nombre del usuario flotando sobre su cursor
   - Cambios aparecen en tiempo real conforme otros escriben
   - Sistema de bloqueo por párrafos para evitar conflictos
2. Chat lateral para comunicación entre colaboradores durante edición

**Comentarios y sugerencias:**
1. Seleccionar texto y hacer clic derecho muestra "💬 Comentar"
2. Comentarios aparecen como burbujas laterales vinculadas al texto
3. Hilos de conversación: responder a comentarios, resolver conversaciones
4. Sugerencias de cambios: proponer modificaciones sin editar directamente
5. Notificaciones cuando alguien comenta en nota compartida

**Historial de versiones colaborativo:**
1. Vista "📜 Historial" muestra todas las versiones de la nota
2. Cada versión indica: quién hizo el cambio, cuándo, qué cambió
3. Comparación visual entre versiones con highlighting de diferencias
4. Restaurar versión anterior con un clic
5. Bifurcación: crear nueva nota a partir de versión específica

---

### 20. Inteligencia Artificial Integrada

**Experiencia del Usuario:**

**Asistente de escritura:**
1. Botón "🤖 Asistente IA" en la barra de herramientas del editor
2. Panel lateral que se abre con opciones:
   - ✍️ "Mejorar texto seleccionado" - sugiere mejoras de redacción
   - 📝 "Completar idea" - continúa escribiendo basado en contexto
   - 🎯 "Resumir contenido" - crea resumen de nota larga
   - 🏷️ "Sugerir etiquetas" - propone etiquetas relevantes automáticamente
3. El usuario selecciona texto y elige la acción de IA deseada

**Búsqueda semántica con IA:**
1. La búsqueda normal se potencia con comprensión de contexto
2. Buscar "ideas para el proyecto" encuentra notas relevantes aunque no contengan esas palabras exactas
3. Sugerencias automáticas mientras se escribe la búsqueda
4. Resultados ordenados por relevancia semántica, no solo coincidencias textuales

**Generación automática de contenido:**
1. Comando "/ai" en el editor activa asistente contextual
2. Prompts disponibles:
   - "/ai outline" - genera estructura/outline para la nota
   - "/ai summary" - resume otros documentos o notas relacionadas
   - "/ai action" - extrae tareas pendientes del contenido
   - "/ai questions" - sugiere preguntas de seguimiento
3. El usuario puede aceptar, modificar o rechazar las sugerencias de IA

**Análisis automático de notas:**
1. IA analiza periódicamente las notas y sugiere:
   - Conexiones entre notas relacionadas
   - Etiquetas que faltan en notas similares
   - Notas que podrían beneficiarse de ser divididas
   - Información duplicada que podría consolidarse
2. Dashboard de "🧠 Insights de IA" con recomendaciones personalizadas

---

### 21. Integración con Calendario Avanzada

**Experiencia del Usuario:**

**Sincronización bidireccional:**
1. Las notas pueden crear automáticamente eventos en el calendario
2. Al escribir "reunión mañana a las 3pm" en una nota, aparece sugerencia:
   "📅 ¿Crear evento en calendario para mañana 15:00?"
3. Al aceptar, crea evento y vincula automáticamente la nota
4. Cambios en el evento del calendario actualizan automáticamente fecha en la nota

**Vista unificada calendario-notas:**
1. Nueva vista "📅📝 Calendario + Notas" en la página principal
2. Calendario principal con panel lateral de notas del día seleccionado
3. Al hacer clic en cualquier día, carga automáticamente:
   - Eventos de ese día
   - Notas creadas ese día
   - Notas vinculadas a eventos de ese día
4. Crear nota desde esta vista la fecha automáticamente al día seleccionado

**Plantillas contextuales de eventos:**
1. Diferentes plantillas según tipo de evento detectado:
   - "Meeting" → plantilla de notas de reunión
   - "Interview" → plantilla de entrevista
   - "Review" → plantilla de evaluación
   - "Planning" → plantilla de planificación
2. Detección automática basada en título del evento y participantes
3. Usuario puede confirmar o cambiar plantilla sugerida antes de crear

**Recordatorios inteligentes:**
1. Notas vinculadas a eventos envían recordatorio automático:
   - 1 día antes: "📝 Preparar notas para reunión de mañana"
   - 1 hora antes: "📝 Revisar agenda y notas previas"
   - Durante evento: "📝 Tomar notas en tiempo real"
   - Después: "📝 Completar notas y próximos pasos"
2. Cada recordatorio incluye enlace directo a la nota y al evento

---

## 📊 RESUMEN DE PRIORIDADES SUGERIDAS

### 🥇 **ALTA PRIORIDAD** (Implementar primero)
**Impacto inmediato en experiencia del usuario:**

1. **Notas Vinculadas a Eventos** - La integración más natural con un calendario
2. **Sistema de Etiquetas** - Organización básica pero poderosa
3. **Widget en Vista de Eventos** - Visibilidad inmediata de notas relacionadas
4. **Plantillas de Notas** - Productividad instantánea para usuarios

### 🥈 **MEDIA PRIORIDAD** (Segunda fase)
**Mejoras significativas de productividad:**

5. **Filtros Avanzados** - Mejor navegación de contenido
6. **Lista de Tareas Integrada** - Funcionalidad muy solicitada
7. **Creación Rápida desde Calendario** - Flujo de trabajo más eficiente
8. **Atajos de Teclado Globales** - Para usuarios power

### 🥉 **BAJA PRIORIDAD** (Futuro)
**Funcionalidades avanzadas para casos específicos:**

9. **Archivos Adjuntos** - Útil pero complejo de implementar
10. **Notas de Voz** - Nicho específico de usuarios
11. **Colaboración en Tiempo Real** - Muy complejo, pocos usuarios
12. **IA Integrada** - Experimental, requiere servicios externos

---

## 💡 CONSIDERACIONES DE IMPLEMENTACIÓN

### **Facilidad Técnica vs Impacto Usuario:**

- **Muy Fácil + Alto Impacto**: Etiquetas, Filtros básicos, Plantillas
- **Medio + Alto Impacto**: Vinculación eventos, Widget calendario, Tareas
- **Difícil + Alto Impacto**: Vista línea tiempo, Colaboración, IA
- **Fácil + Bajo Impacto**: Estadísticas, Exportación, Notas voz

### **Estrategia Recomendada:**
1. **Fase 1 (1-2 meses)**: Etiquetas + Vinculación eventos + Plantillas básicas
2. **Fase 2 (2-3 meses)**: Widget calendario + Filtros + Tareas básicas  
3. **Fase 3 (3-6 meses)**: Funcionalidades avanzadas según feedback usuarios
4. **Fase 4 (6+ meses)**: Experimentación con IA y colaboración

### **Métricas de Éxito:**
- **Adopción**: % usuarios que usan nuevas funcionalidades
- **Retención**: Tiempo promedio en plugin, frecuencia de uso
- **Productividad**: Notas creadas por sesión, uso de plantillas
- **Integración**: % notas vinculadas a eventos, uso de etiquetas

---

*Documento generado para Plugin de Notas de Atlas - Versión 1.1.0*  
*Fecha: Mayo 2025*  
*Total de propuestas: 21 funcionalidades organizadas en 6 categorías*