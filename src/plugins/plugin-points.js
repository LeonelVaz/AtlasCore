/**
 * Definición de puntos de extensión disponibles para plugins
 * 
 * Este archivo contiene todos los puntos donde los plugins pueden registrar
 * componentes o funcionalidad personalizada en la aplicación.
 */

// Definición de puntos de extensión disponibles
export const EXTENSION_POINTS = {
  // Puntos de extensión generales
  'app.sidebar': {
    description: 'Añade elementos en la barra lateral principal',
    allowedComponents: ['SidebarItem'],
    location: 'Sidebar'
  },
  
  // Puntos de extensión del calendario
  'calendar.toolbar': {
    description: 'Añade botones o controles en la barra de herramientas del calendario',
    allowedComponents: ['Button', 'Dropdown', 'CustomControl'],
    location: 'CalendarToolbar'
  },
  'calendar.eventContext': {
    description: 'Añade opciones en el menú contextual de eventos',
    allowedComponents: ['MenuItem'],
    location: 'EventContextMenu'
  },
  'calendar.eventDecorator': {
    description: 'Añade decoradores visuales a los eventos del calendario',
    allowedComponents: ['EventDecorator', 'EventBadge', 'EventIcon'],
    location: 'EventItem'
  },
  'calendar.dayHeader': {
    description: 'Añade contenido en la cabecera de cada día',
    allowedComponents: ['DayHeaderContent'],
    location: 'CalendarDayHeader'
  },
  'calendar.timeSlot': {
    description: 'Añade contenido en las franjas horarias',
    allowedComponents: ['TimeSlotContent'],
    location: 'TimeSlot'
  },
  
  // Puntos de extensión para paneles
  'panel.settings': {
    description: 'Añade una sección en el panel de configuración',
    allowedComponents: ['SettingsSection'],
    location: 'SettingsPanel'
  },
  'panel.dashboard': {
    description: 'Añade widgets en un futuro panel de dashboard',
    allowedComponents: ['DashboardWidget'],
    location: 'Dashboard'
  },
  
  // Puntos de extensión para formularios
  'form.eventCreate': {
    description: 'Añade campos al formulario de creación de eventos',
    allowedComponents: ['FormField'],
    location: 'EventForm'
  },
  'form.eventEdit': {
    description: 'Añade campos al formulario de edición de eventos',
    allowedComponents: ['FormField'],
    location: 'EventForm'
  }
};

/**
 * Verifica si un punto de extensión existe
 * @param {string} pointId - ID del punto de extensión
 * @returns {boolean} - true si existe
 */
export function isValidExtensionPoint(pointId) {
  return !!EXTENSION_POINTS[pointId];
}

/**
 * Obtiene la descripción de un punto de extensión
 * @param {string} pointId - ID del punto de extensión
 * @returns {string} - Descripción o cadena vacía si no existe
 */
export function getExtensionPointDescription(pointId) {
  return EXTENSION_POINTS[pointId]?.description || '';
}

/**
 * Obtiene los componentes permitidos para un punto de extensión
 * @param {string} pointId - ID del punto de extensión
 * @returns {Array} - Array de nombres de componentes permitidos
 */
export function getAllowedComponents(pointId) {
  return EXTENSION_POINTS[pointId]?.allowedComponents || [];
}

/**
 * Obtiene la ubicación de un punto de extensión
 * @param {string} pointId - ID del punto de extensión
 * @returns {string} - Nombre del componente donde se ubica el punto
 */
export function getExtensionPointLocation(pointId) {
  return EXTENSION_POINTS[pointId]?.location || '';
}

export default EXTENSION_POINTS;