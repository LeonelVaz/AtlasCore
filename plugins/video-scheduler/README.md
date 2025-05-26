# Video Scheduler - Plugin para Atlas

Un plugin completo de gestión y programación de videos para Atlas, diseñado para creadores de contenido, YouTubers y equipos de marketing que necesitan organizar su producción de videos de manera eficiente.

## ✨ Características Principales

### 📅 Programación de Videos
- **Calendario Visual**: Vista mensual intuitiva para programar videos
- **Franjas Horarias**: Organiza videos por mañana, tarde o noche
- **Creación en Lote**: Añade múltiples videos con patrones de frecuencia
- **Vistas Múltiples**: Alterna entre vista de rejilla, calendario y lista

### 🎬 Gestión de Producción
- **Estados de Producción**: Desde planeado hasta publicado
  - 📋 Planeado
  - ✍️ Guionización  
  - 🎬 Grabación
  - ✂️ Edición
  - 👀 Revisión
  - 📤 Listo para Publicar
  - ✅ Publicado
  - 📦 Archivado

- **Metadatos Detallados**:
  - Estado del guión y enlaces
  - Información de grabación
  - Progreso de edición
  - Artista de miniatura
  - Notas de producción

### 💰 Seguimiento de Ingresos
- **Múltiples Fuentes**: AdSense, patrocinios, membresías, etc.
- **Múltiples Monedas**: Soporte para conversión automática
- **Desglose Detallado**: Ve el rendimiento por fuente de ingreso
- **Reportes**: Estadísticas completas de ingresos

### 📊 Estadísticas y Reportes
- **Métricas de Producción**: Videos por estado, tasa de finalización
- **Análisis de Ingresos**: Totales, promedios, tendencias
- **Evolución Temporal**: Seguimiento mensual
- **Exportación de Datos**: JSON, CSV y Excel

### 🎨 Integración con Atlas
- **Indicadores en Calendario**: Muestra videos programados en el calendario principal
- **Tema Adaptativo**: Se adapta automáticamente al tema de Atlas
- **Navegación Integrada**: Acceso directo desde la barra lateral
- **Panel de Configuración**: Configuración integrada en las opciones de Atlas

## 🚀 Instalación

1. **Descarga el Plugin**: Obtén los archivos del plugin
2. **Instala en Atlas**: Sigue las instrucciones de instalación de plugins de Atlas
3. **Configura Permisos**: El plugin requiere permisos de:
   - `storage`: Para guardar datos de videos
   - `events`: Para sincronización de eventos
   - `ui`: Para extensiones de interfaz

## 📖 Guía de Uso

### Creando tu Primer Video

1. **Accede al Plugin**: Haz clic en "Video Scheduler" en la navegación de Atlas
2. **Añadir Video**: Haz clic en "➕ Añadir Video"
3. **Completa la Información**:
   - Título del video
   - Fecha y franja horaria
   - Plataforma de destino
   - Estado inicial
4. **Guarda**: El video aparecerá en tu calendario

### Programación en Lote

Para añadir múltiples videos de una serie:

1. **Haz clic en "📦 Añadir en Lote"**
2. **Configura los Parámetros**:
   - Nombre base (ej: "Mi Serie de Tutoriales")
   - Número inicial
   - Cantidad de videos
   - Frecuencia (diaria, semanal, personalizada)
3. **Revisa la Vista Previa**
4. **Confirma la Creación**

### Gestión de Ingresos

1. **Edita un Video Publicado**
2. **Ve a la Pestaña "💰 Ingresos"**
3. **Añade Ingresos**:
   - Cantidad y moneda
   - Fuente (AdSense, patrocinio, etc.)
   - Fecha del ingreso
4. **Revisa el Desglose** por fuentes

### Configuración del Plugin

Accede a la configuración desde el panel de configuración de Atlas:

- **Plataforma por Defecto**: YouTube, Vimeo, TikTok, etc.
- **Moneda Principal**: Para reportes unificados
- **Tasas de Cambio**: Actualiza las conversiones de moneda
- **Visualización**: Indicadores en calendario, vista por defecto
- **Idioma**: Español o Inglés

## 🎯 Casos de Uso

### Para YouTubers
- Planifica tu calendario de subidas
- Gestiona el progreso de edición
- Rastrea ingresos por AdSense y patrocinios
- Organiza series de videos

### Para Equipos de Marketing
- Coordina contenido en múltiples plataformas
- Asigna responsabilidades de producción
- Rastrea ROI de campañas de video
- Genera reportes para stakeholders

### Para Agencias de Contenido
- Gestiona múltiples clientes
- Rastrea deadlines de proyectos
- Calcula rentabilidad por video
- Exporta datos para facturación

## 🔧 Características Técnicas

### Arquitectura
- **Frontend**: React con hooks
- **Almacenamiento**: Sistema de storage persistente de Atlas
- **Eventos**: Sistema de eventos reactivo
- **Internacionalización**: Soporte para múltiples idiomas

### Compatibilidad
- **Atlas**: Versión 0.3.0 o superior
- **Navegadores**: Chrome, Firefox, Safari, Edge
- **Dispositivos**: Desktop y tablet (móvil con limitaciones)

### Rendimiento
- **Almacenamiento**: Límite de 1MB por defecto
- **Videos**: Hasta 1000 videos sin impacto en rendimiento
- **Sincronización**: Actualizaciones en tiempo real

## 🛠️ Configuración Avanzada

### Tasas de Cambio Personalizadas

```json
{
  "USD": 1.0,
  "EUR": 0.92,
  "ARS": 850.0,
  "MXN": 18.5
}
```

### Exportación de Datos

El plugin permite exportar datos en múltiples formatos:

- **JSON**: Estructura completa con metadatos
- **CSV**: Compatible con Excel y Google Sheets
- **Reportes**: Estadísticas pre-calculadas

### Importación de Datos

Puedes importar videos desde:
- Archivos JSON exportados del plugin
- CSVs con estructura compatible
- Otros sistemas de gestión de contenido

## 🤝 Soporte y Contribución

### Reportar Problemas
- Describe el problema detalladamente
- Incluye pasos para reproducir
- Especifica versión de Atlas y navegador

### Solicitar Características
- Explica el caso de uso
- Describe la funcionalidad deseada
- Proporciona mockups si es posible

### Desarrollo
El plugin está desarrollado siguiendo las mejores prácticas de Atlas:
- Código modular y reutilizable
- Comentarios en español
- Tests unitarios (en desarrollo)
- Documentación completa

## 📝 Changelog

### v1.0.0 (Lanzamiento Inicial)
- ✅ Programación básica de videos
- ✅ Estados de producción
- ✅ Seguimiento de ingresos
- ✅ Múltiples vistas de calendario
- ✅ Añadido en lote
- ✅ Estadísticas básicas
- ✅ Integración con Atlas
- ✅ Soporte multi-idioma (ES/EN)

### Próximas Versiones
- 🔜 Integración con APIs de plataformas
- 🔜 Notificaciones automáticas
- 🔜 Colaboración en equipo
- 🔜 Templates de video
- 🔜 Análisis predictivo

## 📄 Licencia

Este plugin es parte del ecosistema Atlas y sigue las mismas políticas de licencia.

## 👥 Créditos

Desarrollado para la comunidad de Atlas por el equipo de Video Scheduler.

**¿Te gusta el plugin?** ⭐ ¡Déjanos saber tu feedback y sugerencias!

---

> **Nota**: Este plugin está en desarrollo activo. Las características y la API pueden cambiar entre versiones. Consulta siempre la documentación más reciente.