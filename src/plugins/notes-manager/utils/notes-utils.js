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
    references: {
      type: 'event',
      id: event.id
    },
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
  
  const startDate = new Date(note.date || note.createdAt);
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
  
  // Comprobar si es hoy
  const today = new Date();
  const isToday = date.getDate() === today.getDate() &&
                  date.getMonth() === today.getMonth() &&
                  date.getFullYear() === today.getFullYear();
  
  // Comprobar si es ayer
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.getDate() === yesterday.getDate() &&
                       date.getMonth() === yesterday.getMonth() &&
                       date.getFullYear() === yesterday.getFullYear();
  
  if (isToday) {
    return `Hoy, ${date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })}`;
  } else if (isYesterday) {
    return `Ayer, ${date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })}`;
  }
  
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
 * @param {string} content - Contenido completo (puede contener HTML)
 * @param {number} maxLength - Longitud máxima
 * @returns {string} - Resumen del contenido
 */
export function getNoteExcerpt(content, maxLength = 100) {
  if (!content) return '';
  
  // Eliminar tags HTML
  const plainText = content.replace(/<[^>]*>/g, ' ');
  
  // Normalizar espacios
  const normalizedText = plainText.replace(/\s+/g, ' ').trim();
  
  if (normalizedText.length <= maxLength) return normalizedText;
  
  // Cortar el contenido y añadir puntos suspensivos
  return normalizedText.substring(0, maxLength).trim() + '...';
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

/**
 * Lista blanca de tags HTML permitidos
 */
const ALLOWED_TAGS = [
  'p', 'br', 'b', 'i', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre',
  'hr', 'span', 'div', 'table', 'thead', 'tbody', 'tr', 'th', 'td'
];

/**
 * Lista blanca de atributos HTML permitidos
 */
const ALLOWED_ATTRS = {
  'a': ['href', 'title', 'target'],
  'span': ['style'],
  'div': ['style'],
  'table': ['border', 'cellpadding', 'cellspacing'],
  'th': ['colspan', 'rowspan'],
  'td': ['colspan', 'rowspan']
};

/**
 * Sanitiza el HTML para prevenir ataques XSS
 * @param {string} html - HTML a sanitizar
 * @returns {string} - HTML sanitizado
 */
export function sanitizeHtml(html) {
  if (!html) return '';
  
  try {
    // Crear elemento temporal para manipular el HTML
    const tempElement = document.createElement('div');
    tempElement.innerHTML = html;
    
    // Sanitizar recursivamente
    function sanitizeNode(node) {
      // Si es un nodo de texto, no hacer nada
      if (node.nodeType === Node.TEXT_NODE) return;
      
      // Si es un elemento, verificar si está permitido
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName.toLowerCase();
        
        // Si el tag no está permitido, reemplazarlo por su contenido
        if (!ALLOWED_TAGS.includes(tagName)) {
          const fragment = document.createDocumentFragment();
          while (node.firstChild) {
            const child = node.firstChild;
            node.removeChild(child);
            fragment.appendChild(child);
          }
          node.parentNode.replaceChild(fragment, node);
          return; // No seguir procesando este nodo
        }
        
        // Limpiar atributos no permitidos
        const allowedAttrs = ALLOWED_ATTRS[tagName] || [];
        const attrs = [...node.attributes];
        attrs.forEach(attr => {
          if (!allowedAttrs.includes(attr.name)) {
            node.removeAttribute(attr.name);
          } else if (attr.name === 'href' && attr.value.toLowerCase().startsWith('javascript:')) {
            // Prevenir ataques de JavaScript en enlaces
            node.removeAttribute(attr.name);
          }
        });
      }
      
      // Procesar hijos recursivamente
      const childNodes = [...node.childNodes];
      childNodes.forEach(sanitizeNode);
    }
    
    // Sanitizar el elemento completo
    sanitizeNode(tempElement);
    
    return tempElement.innerHTML;
  } catch (error) {
    console.error('Error al sanitizar HTML:', error);
    
    // Si ocurre un error, devolver texto plano
    return html.replace(/<[^>]*>/g, '');
  }
}

/**
 * Obtiene un título predeterminado para una nota basado en la fecha
 * @returns {string} - Título con la fecha actual
 */
export function getDefaultNoteTitle() {
  const now = new Date();
  return `Nota del ${now.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long'
  })}`;
}

/**
 * Agrupa notas por fecha
 * @param {Array} notes - Lista de notas
 * @returns {Object} - Notas agrupadas por fecha
 */
export function groupNotesByDate(notes) {
  const groups = {};
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);
  
  const lastMonth = new Date(today);
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  
  notes.forEach(note => {
    const noteDate = new Date(note.updatedAt || note.createdAt);
    let groupName;
    
    if (isSameDay(noteDate, today)) {
      groupName = 'Hoy';
    } else if (isSameDay(noteDate, yesterday)) {
      groupName = 'Ayer';
    } else if (noteDate > lastWeek) {
      groupName = 'Esta semana';
    } else if (noteDate > lastMonth) {
      groupName = 'Este mes';
    } else {
      // Formato fecha: mayo 2023
      groupName = noteDate.toLocaleDateString('es-ES', {
        month: 'long',
        year: 'numeric'
      });
      
      // Capitalizar primera letra
      groupName = groupName.charAt(0).toUpperCase() + groupName.slice(1);
    }
    
    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    
    groups[groupName].push(note);
  });
  
  return groups;
}

/**
 * Comprueba si dos fechas son el mismo día
 * @param {Date} date1 - Primera fecha
 * @param {Date} date2 - Segunda fecha
 * @returns {boolean} - true si son el mismo día
 */
export function isSameDay(date1, date2) {
  return date1.getDate() === date2.getDate() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getFullYear() === date2.getFullYear();
}

/**
 * Comprueba si una fecha está en el rango dado
 * @param {Date} date - Fecha a comprobar
 * @param {Date} start - Inicio del rango
 * @param {Date} end - Fin del rango
 * @returns {boolean} - true si la fecha está en el rango
 */
export function isDateInRange(date, start, end) {
  return date >= start && date <= end;
}