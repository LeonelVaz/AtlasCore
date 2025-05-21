# Administrador de Notas para Atlas

Un plugin completo para gestionar notas asociadas a fechas y eventos en tu calendario Atlas.

## 🚀 Características

### 📝 Gestión de Notas
- **Crear notas con texto enriquecido**: Utiliza formato como negrita, listas, etc.
- **Asociar notas a eventos**: Conecta notas directamente con eventos del calendario
- **Categorías personalizables**: Organiza tus notas por categorías con colores e iconos
- **Sistema de etiquetas**: Etiqueta tus notas para encontrarlas fácilmente

### 👁️ Visualización
- **Indicadores en el calendario**: Ve qué días tienen notas de un vistazo
- **Widget en la barra lateral**: Acceso rápido a las notas recientes
- **Página principal dedicada**: Vista completa de todas tus notas
- **Diferentes vistas**: Lista, cuadrícula o calendario (próximamente)

### 🔍 Búsqueda y Filtros
- **Búsqueda de texto completo**: Encuentra notas por contenido
- **Filtro por categorías**: Muestra solo las notas de categorías específicas
- **Filtro por etiquetas**: Busca notas con etiquetas específicas
- **Ordenamiento flexible**: Por fecha, modificación o categoría

### 🛠️ Herramientas Avanzadas
- **Exportación/Importación**: Guarda y restaura tus notas en formato JSON
- **Gestión de notas huérfanas**: Maneja notas de eventos eliminados
- **Limpieza de datos antiguos**: Elimina notas antiguas para mantener limpio tu espacio
- **Estadísticas**: Visualiza cuántas notas tienes por categoría

## 📦 Instalación

1. Descarga el plugin desde el repositorio de plugins de Atlas
2. En Atlas, ve a Configuración > Plugins
3. Haz clic en "Instalar plugin" y selecciona el archivo del plugin
4. Activa el plugin desde la lista de plugins instalados

## 🎯 Uso

### Crear una nota rápida
1. Haz clic en el icono de notas en la barra de herramientas
2. Selecciona "Nueva nota"
3. Escribe tu contenido y guarda

### Añadir nota a un evento
1. Abre un evento en el calendario
2. En la sección de notas, haz clic en "Añadir"
3. Escribe tu nota y asígnale una categoría

### Buscar notas
1. Ve a la página principal del plugin
2. Usa la barra de búsqueda o los filtros
3. Haz clic en cualquier nota para ver los detalles

## ⚙️ Configuración

### Opciones Generales
- **Mostrar indicadores**: Activa/desactiva los indicadores en el calendario
- **Formato de fecha**: Elige cómo se muestran las fechas
- **Ordenamiento predeterminado**: Define cómo se ordenan las notas

### Categorías
- Crea categorías personalizadas con nombres, colores e iconos
- Edita o elimina categorías existentes
- Las notas de categorías eliminadas se mueven a "General"

### Mantenimiento
- **Importar datos**: Restaura notas desde un archivo JSON
- **Limpiar huérfanas**: Elimina notas de eventos que ya no existen
- **Limpiar antiguas**: Elimina notas más antiguas que X días

## 🔧 API para Desarrolladores

El plugin expone una API pública para interactuar con las notas:

```javascript
// Obtener la API del plugin
const notasAPI = atlas.plugins.getPluginAPI('administrador-notas');

// Crear una nota
const nuevaNota = notasAPI.crearNota(
  '2024-01-15',
  'Contenido de la nota',
  {
    categoria: 'trabajo',
    etiquetas: ['importante', 'proyecto-x']
  }
);

// Buscar notas
const resultados = notasAPI.buscarNotas('proyecto');

// Obtener notas por fecha
const notasHoy = notasAPI.getNotasPorFecha(new Date());
```

## 🐛 Solución de Problemas

### Las notas no aparecen en el calendario
- Verifica que "Mostrar indicadores" esté activado en la configuración
- Recarga la aplicación (Ctrl+R o Cmd+R)

### No puedo ver el texto formateado
- Asegúrate de tener la última versión de Atlas
- Intenta recargar la aplicación

### Tengo notas huérfanas
- Ve a Configuración > Mantenimiento
- Haz clic en "Limpiar huérfanas"

## 📄 Licencia

Este plugin está licenciado bajo la licencia MIT. Ver el archivo LICENSE para más detalles.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:
1. Fork el repositorio
2. Crea una rama para tu feature
3. Envía un pull request

## 📞 Soporte

Si tienes preguntas o problemas:
- Abre un issue en GitHub
- Contacta al equipo de Atlas
- Revisa la documentación de Atlas

---

Desarrollado con ❤️ para la comunidad de Atlas