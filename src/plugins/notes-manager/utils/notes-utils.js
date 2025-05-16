/**
 * Utilidades para el plugin de notas
 */

/**
 * Convierte un evento del calendario en formato de nota
 * @param {Object} event - Evento del calendario
 * @returns {Object} - Objeto con formato de nota
 */
export function convertCalendarEventToNote(event) {
  if (!event) return null;
  
  return {
    title: event.title || 'Nota sin título',
    content: event.description || '',
    date: event.start || new Date().toISOString(),
    eventId: event.id,
    color: event.color || '#2D4B94'
  };
}

/**
 * Convierte una nota en formato de evento del calendario
 * @param {Object} note - Nota
 * @returns {Object} - Objeto con formato de evento
 */
export function convertNoteToCalendarEvent(note) {
  if (!note) return null;
  
  const startDate = new Date(note.date);
  const endDate = new Date(startDate);
  endDate.setHours(startDate.getHours() + 1); // Por defecto, duración de 1 hora
  
  return {
    title: note.title,
    description: note.content,
    start: startDate.toISOString(),
    end: endDate.toISOString(),
    color: note.color,
    noteId: note.id
  };
}

/**
 * Formatea una fecha para mostrar
 * @param {string} dateString - Fecha en formato ISO
 * @returns {string} - Fecha formateada para mostrar
 */
export function formatNoteDate(dateString) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Obtiene un resumen del contenido de una nota
 * @param {string} content - Contenido completo
 * @param {number} maxLength - Longitud máxima
 * @returns {string} - Resumen del contenido
 */
export function getNoteExcerpt(content, maxLength = 100) {
  if (!content) return '';
  if (content.length <= maxLength) return content;
  
  // Cortar el contenido y añadir puntos suspensivos
  return content.substring(0, maxLength).trim() + '...';
}

/**
 * Genera un objeto de color hexadecimal aleatorio de una paleta predefinida
 * @returns {string} - Color hexadecimal
 */
export function getRandomNoteColor() {
  const colors = [
    '#2D4B94', // Atlas Blue
    '#26A69A', // Modular Green
    '#7E57C2', // Custom Purple
    '#FFB300', // Insight Yellow
    '#EF5350', // Alarm Red
    '#29B6F6', // Info Blue
    '#5DA8A5', // Teal
    '#DA627D', // Rose
    '#FF9800', // Orange
    '#9E9E9E'  // Grey
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
}