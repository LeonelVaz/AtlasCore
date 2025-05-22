# 📝 Plugin de Notas Simples con Editor de Texto Enriquecido

Plugin mejorado para Atlas que permite crear y gestionar notas personales con soporte completo para formato de texto enriquecido.

## ✨ Características Principales

### 🎨 Editor de Texto Enriquecido
- **Formato completo**: Negrita, cursiva, subrayado, encabezados
- **Listas**: Con viñetas y numeradas
- **Enlaces e imágenes**: Inserción y edición visual
- **Citas**: Bloques de cita con formato especial
- **Alineación**: Izquierda, centro, derecha
- **Limpieza de formato**: Remover formato con un clic

### 📊 Funcionalidades Avanzadas
- **Navegación integrada**: Botón "Notes" en la barra de navegación principal
- **Gestión completa**: Crear, editar, eliminar y visualizar notas
- **Búsqueda inteligente**: Busca en títulos y contenido (incluyendo texto dentro de HTML)
- **Estadísticas**: Contador de notas totales, con formato, creadas hoy
- **Vista previa rica**: Visualización del contenido HTML formateado
- **Interfaz adaptativa**: Diseño responsive que se adapta a diferentes tamaños de pantalla

### 💾 Persistencia y Almacenamiento
- **Almacenamiento automático**: Las notas se guardan automáticamente
- **Formato HTML**: Contenido rico guardado en formato HTML
- **Metadatos completos**: Fechas de creación y modificación
- **Compatibilidad hacia atrás**: Funciona con notas de texto plano existentes

### ⌨️ Atajos de Teclado
- `Ctrl+Enter`: Guardar nota (en formularios de creación/edición)
- `Esc`: Cancelar edición o creación
- Atajos del editor: `Ctrl+B` (negrita), `Ctrl+I` (cursiva), etc.

## 🚀 Instalación

1. Asegúrate de que Atlas esté actualizado a la versión 0.3.0 o superior
2. Crea una carpeta llamada `notes-manager` en el directorio de plugins de Atlas
3. Copia todos los archivos del plugin en la estructura mostrada abajo
4. Reinicia Atlas o recarga la página
5. El plugin se activará automáticamente y verás el botón "Notes" en la navegación

## 📁 Estructura del Plugin

```
notes-manager/
├── index.js                      # Plugin principal (v1.1.0)
├── components/                   # Componentes React
│   ├── NotesNavigationItem.jsx   # Botón de navegación
│   ├── NotesPage.jsx             # Página principal mejorada
│   ├── NoteCard.jsx              # Tarjeta con RichTextViewer
│   └── CreateNoteForm.jsx        # Formulario con RichTextEditor
├── styles/                       # Estilos CSS
│   └── notes.css                 # Estilos actualizados para RichText
└── README.md                     # Este archivo
```

## 🎯 Uso Detallado

### Navegación
- Haz clic en el botón **"Notes"** (📝) en la barra de navegación izquierda
- Verás un contador de notas y estadísticas en tiempo real
- Si tienes más de 3 notas, aparecerá un buscador automáticamente

### Crear una nota con formato
1. Haz clic en **"Nueva Nota"**
2. Completa el título (obligatorio)
3. Usa el **editor de texto enriquecido** para dar formato:
   - **Negrita**: Selecciona texto y haz clic en **B** o usa `Ctrl+B`
   - **Cursiva**: Selecciona texto y haz clic en **I** o usa `Ctrl+I`
   - **Encabezados**: Usa el botón de título para crear secciones
   - **Listas**: Botones para listas con viñetas o numeradas
   - **Enlaces**: Botón de enlace para agregar URLs
   - **Citas**: Botón de comillas para crear bloques de cita
4. Haz clic en **"Crear Nota"** o presiona `Ctrl+Enter`

### Editar una nota existente
1. Haz hover sobre una nota para ver los botones de acción
2. Haz clic en el botón de **editar** (✏️)
3. El editor completo se abrirá con el contenido actual
4. Modifica usando todas las herramientas de formato
5. Haz clic en **"Guardar"** o presiona `Ctrl+Enter`

### Buscar en notas
1. El buscador aparece automáticamente cuando tienes más de 3 notas
2. Escribe cualquier término en el campo de búsqueda
3. La búsqueda funciona en:
   - Títulos de notas
   - Contenido de texto (extrae texto de HTML automáticamente)
4. Los resultados se filtran en tiempo real

### Visualización de contenido rico
- Las notas con formato se muestran con **RichTextViewer**
- Encabezados, listas, enlaces y formato se preservan
- Las notas de texto plano siguen funcionando normalmente
- Vista previa limitada en las tarjetas, contenido completo al editar

## 🛠️ Requisitos Técnicos

- **Atlas versión**: 0.3.0 - 1.0.0
- **Permisos**: `storage`, `ui`
- **Dependencias**: 
  - React (disponible en Atlas)
  - RichTextEditor y RichTextViewer (componentes de Atlas Core)

## 📋 Propiedades de las Notas Actualizadas

```javascript
{
  id: "1234567890",                    // ID único basado en timestamp
  title: "Mi Nota",                    // Título de la nota (obligatorio)
  content: "<p>Contenido <strong>con formato</strong></p>", // Contenido HTML o texto plano
  createdAt: "2025-05-22T...",         // Fecha de creación (ISO string)
  modifiedAt: "2025-05-22T..."         // Fecha de última modificación
}
```

## 🎨 Mejoras Visuales

### Interfaz Renovada
- **Header mejorado**: Título con icono, estadísticas en vivo
- **Tarjetas mejoradas**: Hover effects, mejor organización visual
- **Botones de acción**: Iconos más grandes, mejor visibilidad
- **Animaciones suaves**: Transiciones fluidas y naturales

### Adaptabilidad
- **Responsive completo**: Se adapta a móviles, tablets y escritorio
- **Temas compatibles**: Funciona con todos los temas de Atlas
- **Alto contraste**: Soporte mejorado para accesibilidad

### Indicadores Visuales
- 📝 Contador total de notas
- 🎨 Contador de notas con formato rico
- ✨ Contador de notas creadas hoy
- 🔍 Indicador de resultados de búsqueda

## 🔧 API del Plugin Expandida

### Métodos Principales
```javascript
// Crear nota (acepta HTML o texto plano)
createNote(title, content)

// Actualizar nota (preserva formato)
updateNote(noteId, updates)

// Eliminar nota
deleteNote(noteId)

// Obtener todas las notas
getNotes()

// Obtener nota específica
getNote(noteId)
```

### Nuevos Métodos
```javascript
// Obtener estadísticas detalladas
getNotesStats()
// Retorna: { total, createdToday, createdThisWeek, withRichContent, averageLength }

// Buscar en notas
searchNotes(query)
// Busca en títulos y contenido (extrae texto de HTML)
```

## 🚨 Compatibilidad y Migración

### Notas Existentes
- **Compatibilidad 100%**: Las notas de texto plano existentes siguen funcionando
- **Migración automática**: No se requiere migración manual
- **Detección inteligente**: El sistema detecta automáticamente si el contenido es HTML o texto plano

### Fallbacks
- Si RichTextEditor no está disponible, usa textarea normal
- Si RichTextViewer no está disponible, muestra texto plano
- Funciona incluso si los componentes de Atlas no están cargados

## 🐛 Solución de Problemas

### El editor rico no aparece
1. Verifica que Atlas esté en versión 0.3.0 o superior
2. Revisa la consola para mensajes de "[Notas Simples] RichText disponible: true/false"
3. Si es false, los componentes de texto enriquecido no están disponibles

### El formato no se guarda
1. Asegúrate de usar las herramientas del editor (no atajos de navegador)
2. Verifica que el contenido tenga etiquetas HTML en la consola
3. Comprueba que el almacenamiento funcione correctamente

### Problemas de visualización
1. Actualiza el archivo `styles/notes.css` con la versión más reciente
2. Verifica que las variables CSS de Atlas estén disponibles
3. Comprueba compatibilidad con el tema actual

## 📚 Logs de Depuración Mejorados

```
[Notas Simples] RichText disponible: true
[Notas Simples] Plugin inicializado correctamente con soporte para RichText
[Notas Simples] Cargadas 5 notas
[Notas Simples] Navegación registrada con ID: nav-123
[Notas Simples] Página registrada con ID: page-456
[Notas Simples] Nota creada: 1234567890
[Notas Simples] Nota actualizada: 1234567890
[Notas Simples] Nota eliminada: 1234567890
[Notas Simples] Notas guardadas correctamente
```

## 🚀 Nuevas Funcionalidades en v1.1.0

### Editor de Texto Enriquecido
- ✅ Integración completa con RichTextEditor de Atlas
- ✅ Barra de herramientas completa (negrita, cursiva, listas, enlaces, etc.)
- ✅ Vista previa con RichTextViewer
- ✅ Compatibilidad con notas existentes

### Mejoras de UI/UX
- ✅ Interfaz renovada y moderna
- ✅ Búsqueda inteligente en contenido
- ✅ Estadísticas en tiempo real
- ✅ Mejor responsive design
- ✅ Animaciones y transiciones mejoradas

### Funcionalidades Avanzadas
- ✅ Confirmaciones con sistema de diálogos de Atlas
- ✅ Notificaciones de éxito para acciones
- ✅ Detección automática de tipo de contenido
- ✅ Extracción de texto plano para búsquedas

## 🔮 Roadmap Futuro

### Próximas Funcionalidades
- **Categorías y etiquetas**: Organizar notas por temas
- **Atajos de teclado globales**: Crear nota rápida desde cualquier parte
- **Exportación avanzada**: PDF, Word, Markdown
- **Plantillas**: Notas predefinidas para diferentes propósitos
- **Colaboración**: Compartir notas entre usuarios
- **Sincronización**: Backup automático en la nube

### Integraciones Planificadas
- **Calendario**: Vincular notas a eventos específicos
- **Recordatorios**: Notificaciones basadas en fechas
- **Enlaces inteligentes**: Referencias automáticas entre notas
- **Búsqueda semántica**: Búsqueda por conceptos, no solo palabras

## 📄 Licencia

Este plugin es de código abierto y puede ser modificado según tus necesidades.

## 🤝 Contribuir

Para contribuir al desarrollo:

1. **Nuevas funcionalidades**: Modifica los componentes en `components/`
2. **Mejoras visuales**: Actualiza los estilos en `styles/notes.css`
3. **API**: Extiende la funcionalidad en `index.js`
4. **Documentación**: Actualiza este README
5. **Testing**: Prueba exhaustivamente todas las funciones

### Guía de Desarrollo

```bash
# Estructura recomendada para nuevas funciones:
components/
├── NewFeature.jsx        # Nuevo componente
├── NewFeatureDialog.jsx  # Diálogo asociado
└── utils/
    └── newFeatureUtils.js # Utilidades específicas
```

---

**Versión**: 1.1.0  
**Compatibilidad**: Atlas 0.3.0 - 1.0.0  
**Última actualización**: Mayo 2025  
**Características principales**: Editor de texto enriquecido, búsqueda inteligente, interfaz renovada

---

### 🎯 ¡Prueba las Nuevas Funcionalidades!

1. **Crea una nota nueva** y experimenta con el editor de texto enriquecido
2. **Usa negritas, cursivas y listas** para organizar tu contenido
3. **Busca en tus notas** usando el campo de búsqueda
4. **Observa las estadísticas** en tiempo real en el header

¡El plugin ahora es mucho más potente y fácil de usar! 🚀