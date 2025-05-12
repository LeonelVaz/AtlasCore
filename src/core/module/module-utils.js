/**
 * Utilidades para el sistema de módulos de Atlas
 * 
 * Proporciona herramientas para la interoperabilidad entre módulos
 */

/**
 * Verifica si existe conflicto de tiempo entre dos eventos
 * @param {Object} event1 - Primer evento con start y end
 * @param {Object} event2 - Segundo evento con start y end
 * @returns {boolean} - true si hay conflicto de tiempo
 */
export function checkTimeConflict(event1, event2) {
  try {
    if (!event1?.start || !event1?.end || !event2?.start || !event2?.end) {
      return false;
    }
    
    const start1 = new Date(event1.start);
    const end1 = new Date(event1.end);
    const start2 = new Date(event2.start);
    const end2 = new Date(event2.end);
    
    // Verificar que las fechas sean válidas
    if (isNaN(start1) || isNaN(end1) || isNaN(start2) || isNaN(end2)) {
      console.error('Fechas inválidas al verificar conflicto');
      return false;
    }
    
    // Hay conflicto si un evento comienza antes que el fin del otro
    // y termina después que el inicio del otro
    return start1 < end2 && start2 < end1;
  } catch (error) {
    console.error('Error al verificar conflicto de tiempo:', error);
    return false;
  }
}

/**
 * Convierte un evento de un formato a otro
 * @param {Object} event - Evento a convertir
 * @param {string} sourceFormat - Formato de origen ('calendar', 'task', 'video', etc.)
 * @param {string} targetFormat - Formato de destino
 * @returns {Object|null} - Evento convertido o null si la conversión falla
 */
export function convertEventFormat(event, sourceFormat, targetFormat) {
  try {
    if (!event || !sourceFormat || !targetFormat) {
      return null;
    }
    
    // Si los formatos son iguales, devolver copia del evento
    if (sourceFormat === targetFormat) {
      return { ...event };
    }
    
    // Implementar conversiones específicas
    if (sourceFormat === 'calendar' && targetFormat === 'task') {
      return {
        id: event.id,
        title: event.title,
        description: event.description || '',
        dueDate: event.end,
        completed: false,
        priority: 'medium',
        calendarEventId: event.id
      };
    }
    
    if (sourceFormat === 'task' && targetFormat === 'calendar') {
      // Calcular duración predeterminada de 1 hora
      const start = new Date(event.dueDate);
      start.setHours(start.getHours() - 1);
      
      return {
        id: event.id,
        title: `Tarea: ${event.title}`,
        description: event.description || '',
        start: start.toISOString(),
        end: event.dueDate,
        color: event.completed ? '#4CAF50' : '#FF9800',
        taskId: event.id
      };
    }
    
    if (sourceFormat === 'calendar' && targetFormat === 'video') {
      return {
        id: event.id,
        title: event.title,
        description: event.description || '',
        scheduledDate: event.start,
        duration: (new Date(event.end) - new Date(event.start)) / (1000 * 60), // Duración en minutos
        status: 'planificado',
        calendarEventId: event.id
      };
    }
    
    // Si no hay una conversión específica definida, devolver null
    console.warn(`Conversión de ${sourceFormat} a ${targetFormat} no implementada`);
    return null;
  } catch (error) {
    console.error('Error al convertir formato de evento:', error);
    return null;
  }
}

/**
 * Obtiene todos los módulos registrados
 * @returns {Array} - Array con nombres de módulos registrados
 */
export function getRegisteredModules() {
  try {
    if (typeof window === 'undefined' || !window.__appModules) {
      return [];
    }
    
    return Object.keys(window.__appModules);
  } catch (error) {
    console.error('Error al obtener módulos registrados:', error);
    return [];
  }
}

/**
 * Ejecuta una función en todos los módulos que la implementen
 * @param {string} methodName - Nombre del método a ejecutar
 * @param {Array} args - Argumentos para pasar al método
 * @returns {Array} - Resultados de la ejecución en cada módulo
 */
export function executeAcrossModules(methodName, args = []) {
  try {
    if (typeof window === 'undefined' || !window.__appModules) {
      return [];
    }
    
    const results = [];
    
    Object.entries(window.__appModules).forEach(([moduleName, moduleAPI]) => {
      if (typeof moduleAPI[methodName] === 'function') {
        try {
          const result = moduleAPI[methodName](...args);
          results.push({
            module: moduleName,
            success: true,
            result
          });
        } catch (error) {
          console.error(`Error al ejecutar ${methodName} en el módulo ${moduleName}:`, error);
          results.push({
            module: moduleName,
            success: false,
            error: error.message
          });
        }
      }
    });
    
    return results;
  } catch (error) {
    console.error('Error al ejecutar a través de módulos:', error);
    return [];
  }
}

/**
 * Verifica dependencias entre módulos
 * @param {string} moduleName - Nombre del módulo a verificar
 * @param {Array} dependencies - Array con nombres de módulos dependientes
 * @returns {Object} - Estado de las dependencias con detalles
 */
export function checkModuleDependencies(moduleName, dependencies = []) {
  try {
    if (typeof window === 'undefined' || !window.__appModules) {
      return {
        moduleName,
        success: false,
        message: 'Sistema de módulos no disponible',
        missingDependencies: dependencies
      };
    }
    
    if (!Array.isArray(dependencies) || dependencies.length === 0) {
      return {
        moduleName,
        success: true,
        message: 'No hay dependencias que verificar',
        missingDependencies: []
      };
    }
    
    const missingDependencies = dependencies.filter(
      dep => !window.__appModules[dep]
    );
    
    return {
      moduleName,
      success: missingDependencies.length === 0,
      message: missingDependencies.length === 0 
        ? 'Todas las dependencias satisfechas' 
        : `Faltan ${missingDependencies.length} dependencias`,
      missingDependencies
    };
  } catch (error) {
    console.error('Error al verificar dependencias de módulos:', error);
    return {
      moduleName,
      success: false,
      message: `Error: ${error.message}`,
      missingDependencies: dependencies
    };
  }
}