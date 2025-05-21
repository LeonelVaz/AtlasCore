export const helpers = {
  // Formatear fecha para usar como clave
  formatDateKey: function(fecha) {
    if (typeof fecha === 'string') {
      return fecha.split('T')[0];
    }
    return new Date(fecha).toISOString().split('T')[0];
  },
  
  // Formatear fecha para mostrar
  formatDateDisplay: function(fecha, formato = 'DD/MM/YYYY') {
    const date = new Date(fecha);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    switch (formato) {
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`;
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      default:
        return `${day}/${month}/${year}`;
    }
  },
  
  // Formatear fecha relativa (hace X días, etc.)
  formatRelativeDate: function(fecha) {
    const now = new Date();
    const date = new Date(fecha);
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Hoy';
    } else if (diffDays === 1) {
      return 'Ayer';
    } else if (diffDays === -1) {
      return 'Mañana';
    } else if (diffDays > 0 && diffDays < 7) {
      return `Hace ${diffDays} días`;
    } else if (diffDays < 0 && diffDays > -7) {
      return `En ${Math.abs(diffDays)} días`;
    } else {
      return this.formatDateDisplay(fecha);
    }
  },
  
  // Truncar texto con elipsis
  truncateText: function(text, maxLength = 100) {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + '...';
  },
  
  // Limpiar HTML del texto (para previstas)
  stripHtml: function(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  },
  
  // Generar color claro basado en un color base
  generateLightColor: function(baseColor) {
    // Convertir hex a RGB
    const hex = baseColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Aclarar el color
    const lightR = Math.min(255, r + (255 - r) * 0.8);
    const lightG = Math.min(255, g + (255 - g) * 0.8);
    const lightB = Math.min(255, b + (255 - b) * 0.8);
    
    // Convertir de vuelta a hex
    return '#' + 
      Math.round(lightR).toString(16).padStart(2, '0') +
      Math.round(lightG).toString(16).padStart(2, '0') +
      Math.round(lightB).toString(16).padStart(2, '0');
  },
  
  // Validar formato de color hex
  isValidHexColor: function(color) {
    return /^#[0-9A-F]{6}$/i.test(color);
  },
  
  // Ordenar notas según configuración
  sortNotas: function(notas, ordenamiento = 'fecha-desc') {
    const sorted = [...notas];
    
    switch (ordenamiento) {
      case 'fecha-desc':
        return sorted.sort((a, b) => b.fechaCreacion - a.fechaCreacion);
      case 'fecha-asc':
        return sorted.sort((a, b) => a.fechaCreacion - b.fechaCreacion);
      case 'modificacion-desc':
        return sorted.sort((a, b) => b.fechaModificacion - a.fechaModificacion);
      case 'categoria':
        return sorted.sort((a, b) => a.categoria.localeCompare(b.categoria));
      default:
        return sorted;
    }
  },
  
  // Agrupar notas por criterio
  groupNotasBy: function(notas, criterio = 'fecha') {
    const grupos = {};
    
    notas.forEach((item) => {
      let clave;
      
      switch (criterio) {
        case 'fecha':
          clave = item.fecha;
          break;
        case 'categoria':
          clave = item.nota.categoria;
          break;
        case 'mes':
          clave = item.fecha.substring(0, 7);
          break;
        case 'semana':
          const date = new Date(item.fecha);
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          clave = weekStart.toISOString().split('T')[0];
          break;
        default:
          clave = 'general';
      }
      
      if (!grupos[clave]) {
        grupos[clave] = [];
      }
      grupos[clave].push(item);
    });
    
    return grupos;
  },
  
  // Validar permisos del plugin
  checkPermission: function(core, pluginId, permission) {
    try {
      const plugin = core.plugins.getPlugin(pluginId);
      return plugin && plugin.permissions && plugin.permissions.includes(permission);
    } catch (error) {
      return false;
    }
  },
  
  // Debounce para optimizar búsquedas
  debounce: function(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
  
  // Throttle para limitar llamadas frecuentes
  throttle: function(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },
  
  // Generar ID único
  generateId: function(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },
  
  // Validar estructura de nota
  validateNota: function(nota) {
    const errors = [];
    
    if (!nota.contenido || nota.contenido.trim() === '') {
      errors.push('El contenido de la nota no puede estar vacío');
    }
    
    if (!nota.categoria) {
      errors.push('La nota debe tener una categoría');
    }
    
    if (nota.etiquetas && !Array.isArray(nota.etiquetas)) {
      errors.push('Las etiquetas deben ser un array');
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  },
  
  // Parsear etiquetas de un string
  parseEtiquetas: function(etiquetasString) {
    if (!etiquetasString || etiquetasString.trim() === '') {
      return [];
    }
    
    return etiquetasString
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
  },
  
  // Convertir etiquetas a string
  etiquetasToString: function(etiquetas) {
    if (!Array.isArray(etiquetas)) {
      return '';
    }
    return etiquetas.join(', ');
  },
  
  // Obtener icono de Material Icons para categoría
  getCategoryIcon: function(icono) {
    const iconMap = {
      'work': 'work',
      'person': 'person',
      'note': 'note',
      'star': 'star',
      'home': 'home',
      'school': 'school',
      'event': 'event',
      'shopping': 'shopping_cart',
      'health': 'favorite',
      'travel': 'flight',
      'food': 'restaurant',
      'sports': 'sports',
      'music': 'music_note',
      'money': 'attach_money'
    };
    
    return iconMap[icono] || 'note';
  }
};