# 📝 Plugin de Notas Simples

Plugin básico para Atlas que permite crear y gestionar notas personales de forma sencilla.

## ✨ Características

- **Navegación integrada**: Botón "Notes" en la barra de navegación principal
- **Gestión completa**: Crear, editar, eliminar y visualizar notas
- **Interfaz intuitiva**: Diseño limpio y responsive adaptado al tema de Atlas
- **Almacenamiento persistente**: Las notas se guardan automáticamente
- **Edición en línea**: Edita las notas directamente desde la vista principal
- **Metadatos**: Muestra fechas de creación y modificación
- **Teclado shortcuts**: Ctrl+Enter para guardar, Esc para cancelar

## 🚀 Instalación

1. Crea una carpeta llamada `notes-magager` en el directorio de plugins de Atlas
2. Copia los archivos del plugin en la estructura mostrada abajo
3. Reinicia Atlas o recarga la página
4. El plugin se activará automáticamente y verás el botón "Notes" en la navegación

## 📁 Estructura del Plugin

```
notes-magager/
├── index.js                      # Plugin principal
├── components/                   # Componentes React
│   ├── NotesNavigationItem.jsx   # Botón de navegación
│   ├── NotesPage.jsx             # Página principal de notas
│   ├── NoteCard.jsx              # Tarjeta individual de nota
│   └── CreateNoteForm.jsx        # Formulario de creación
├── styles/                       # Estilos CSS
│   └── notes.css                 # Estilos del plugin
└── README.md                     # Este archivo
```

## 🎯 Uso

### Navegación
- Haz clic en el botón **"Notes"** en la barra de navegación izquierda
- Accederás a la página principal de gestión de notas

### Crear una nota
1. Haz clic en el botón **"Nueva Nota"**
2. Completa el título (obligatorio) y el contenido (opcional)
3. Haz clic en **"Crear Nota"** o presiona `Ctrl+Enter`
4. La nota se guardará automáticamente

### Editar una nota
1. Haz hover sobre una nota para ver los botones de acción
2. Haz clic en el botón de **editar** (ícono de lápiz)
3. Modifica el título y/o contenido
4. Haz clic en **"Guardar"** o presiona `Ctrl+Enter`

### Eliminar una nota
1. Haz hover sobre una nota para ver los botones de acción
2. Haz clic en el botón de **eliminar** (ícono de basura)
3. Confirma la eliminación en el diálogo

### Atajos de teclado
- `Ctrl+Enter`: Guardar nota (en formularios de creación/edición)
- `Esc`: Cancelar edición o creación

## 🛠️ Requisitos Técnicos

- **Atlas versión**: 0.3.0 - 1.0.0
- **Permisos**: `storage`, `ui`
- **Dependencias**: React (debe estar disponible en el entorno)

## 📋 Propiedades de las Notas

Cada nota contiene las siguientes propiedades:

```javascript
{
  id: "1234567890",           // ID único basado en timestamp
  title: "Mi Nota",           // Título de la nota (obligatorio)
  content: "Contenido...",    // Contenido de la nota (opcional)
  createdAt: "2025-05-22T...", // Fecha de creación (ISO string)
  modifiedAt: "2025-05-22T..." // Fecha de última modificación (ISO string)
}
```

## 🎨 Personalización

### Estilos
Los estilos están definidos en `styles/notes.css` y utilizan las variables CSS de Atlas para mantener consistencia visual. Puedes modificar:

- Colores del tema
- Espaciado y dimensiones
- Animaciones y transiciones
- Responsive breakpoints

### Variables CSS personalizables
```css
:root {
  --notes-card-hover-transform: translateY(-2px);
  --notes-animation-duration: 0.3s;
  --notes-grid-min-width: 300px;
  --notes-card-max-height: 400px;
}
```

## 🔧 API del Plugin

El plugin expone los siguientes métodos públicos:

### `createNote(title, content)`
Crea una nueva nota con el título y contenido especificados.

### `updateNote(noteId, updates)`
Actualiza una nota existente con los cambios proporcionados.

### `deleteNote(noteId)`
Elimina una nota por su ID.

### `getNotes()`
Obtiene todas las notas almacenadas.

### `getNote(noteId)`
Obtiene una nota específica por su ID.

## 🐛 Solución de Problemas

### El plugin no se carga
1. Verifica que React esté disponible en el entorno
2. Revisa la consola para errores de sintaxis
3. Asegúrate de que la estructura de archivos sea correcta

### Las notas no se guardan
1. Verifica que el plugin tenga permisos de `storage`
2. Revisa la consola para errores de almacenamiento
3. Comprueba que Atlas tenga acceso a localStorage

### Problemas de visualización
1. Verifica que el archivo `styles/notes.css` esté presente
2. Asegúrate de que las variables CSS de Atlas estén disponibles
3. Comprueba la compatibilidad con el tema actual

## 📚 Logs de Depuración

El plugin genera logs informativos en la consola:

```
[Notas Simples] Plugin inicializado correctamente
[Notas Simples] Cargadas 3 notas
[Notas Simples] Navegación registrada con ID: nav-123
[Notas Simples] Página registrada con ID: page-456
[Notas Simples] Nota creada: 1234567890
[Notas Simples] Nota actualizada: 1234567890
[Notas Simples] Nota eliminada: 1234567890
[Notas Simples] Notas guardadas correctamente
```

## 🚀 Futuras Mejoras

Este plugin está diseñado para ser extensible. Algunas ideas para futuras versiones:

- **Categorías y etiquetas**: Organizar notas por temas
- **Búsqueda y filtros**: Encontrar notas rápidamente
- **Formato de texto**: Soporte para markdown o rich text
- **Integración con calendario**: Vincular notas a eventos
- **Exportación**: Descargar notas en diferentes formatos
- **Colaboración**: Compartir notas entre usuarios
- **Recordatorios**: Notificaciones basadas en fechas

## 📄 Licencia

Este plugin es de código abierto y puede ser modificado según tus necesidades.

## 🤝 Contribuciones

Para agregar nuevas funcionalidades:

1. Modifica los componentes en la carpeta `components/`
2. Actualiza los estilos en `styles/notes.css`
3. Extiende la API en `index.js`
4. Actualiza la documentación
5. Prueba exhaustivamente los cambios

---

**Versión**: 1.0.0  
**Compatibilidad**: Atlas 0.3.0 - 1.0.0  
**Última actualización**: Mayo 2025