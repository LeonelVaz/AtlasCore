/**
 * Cargador de plugins para Atlas
 * 
 * Este módulo se encarga de detectar y cargar plugins desde
 * la carpeta designada del sistema
 */

import { validatePlugin, validatePluginComplete } from './plugin-validator';
import pluginCompatibility from './plugin-compatibility';
import pluginDependencyResolver from './plugin-dependency-resolver';
import { PLUGIN_CONSTANTS } from '../config/constants';
import eventBus from '../bus/event-bus';

/**
 * Carga todos los plugins disponibles en la carpeta designada
 * @returns {Promise<Array>} - Lista de plugins válidos
 */
export async function loadPlugins() {
  try {
    // Descubrir plugins en la carpeta correspondiente
    const plugins = await discoverPlugins();
    
    // Filtrar y validar los plugins
    const validPlugins = plugins.filter(plugin => {
      return validatePlugin(plugin);
    });
    
    // Ordenar plugins según prioridades y dependencias
    const sortedPlugins = sortPluginsByPriority(validPlugins);
    
    console.log(`Plugins cargados: ${sortedPlugins.length}`);
    return sortedPlugins;
  } catch (error) {
    console.error('Error al cargar plugins:', error);
    return [];
  }
}

/**
 * Descubre plugins disponibles en la carpeta designada
 * @private
 * @returns {Promise<Array>} - Lista de plugins descubiertos
 */
async function discoverPlugins() {
  try {
    const plugins = [];
    
    // En esta implementación, buscamos directamente el plugin de ejemplo
    // En una implementación real, esto buscaría todos los plugins en la carpeta
    
    try {
      // Importar el plugin de ejemplo
      const examplePlugin = await import('../../plugins/example-plugin/index.js');
      
      if (examplePlugin && examplePlugin.default) {
        plugins.push(examplePlugin.default);
      }
    } catch (importError) {
      console.warn('No se pudo cargar el plugin de ejemplo:', importError.message);
    }
    
    // Aquí podrían agregarse más plugins conocidos o buscar dinámicamente
    // usando context.require o similar en una implementación real

    return plugins;
  } catch (error) {
    console.error('Error al descubrir plugins:', error);
    return [];
  }
}

/**
 * Carga un plugin específico por ID
 * @param {string} pluginId - ID del plugin a cargar
 * @returns {Promise<Object|null>} - Plugin cargado o null si no se encuentra
 */
export async function loadPluginById(pluginId) {
  try {
    // Simulación de carga de un plugin específico
    if (pluginId === 'example-plugin') {
      try {
        const examplePlugin = await import('../../plugins/example-plugin/index.js');
        
        if (examplePlugin && examplePlugin.default) {
          return examplePlugin.default;
        }
      } catch (importError) {
        console.warn('No se pudo cargar el plugin de ejemplo:', importError.message);
      }
    }
    
    console.warn(`Plugin no encontrado: ${pluginId}`);
    return null;
  } catch (error) {
    console.error(`Error al cargar plugin ${pluginId}:`, error);
    return null;
  }
}

/**
 * Ordena los plugins según prioridad y dependencias
 * @param {Array} plugins - Lista de plugins a ordenar
 * @returns {Array} - Lista de plugins ordenada
 */
function sortPluginsByPriority(plugins) {
  try {
    // Si no hay plugins o solo hay uno, no es necesario ordenar
    if (!plugins || !Array.isArray(plugins) || plugins.length <= 1) {
      return plugins || [];
    }
    
    // Obtener orden de dependencias
    const dependencyOrder = pluginDependencyResolver.calculateLoadOrder();
    
    // Crear mapa de plugins por ID para búsqueda rápida
    const pluginsMap = {};
    plugins.forEach(plugin => {
      if (plugin && plugin.id) {
        pluginsMap[plugin.id] = plugin;
      }
    });
    
    // Ordenar primero por dependencias
    let sortedPlugins = [];
    
    // Añadir plugins en orden de dependencias
    for (const pluginId of dependencyOrder) {
      if (pluginsMap[pluginId]) {
        sortedPlugins.push(pluginsMap[pluginId]);
        
        // Eliminar del mapa para no añadirlo dos veces
        delete pluginsMap[pluginId];
      }
    }
    
    // Añadir plugins restantes que no estaban en el orden de dependencias
    const remainingPlugins = Object.values(pluginsMap);
    
    // Ordenar plugins restantes por prioridad
    remainingPlugins.sort((a, b) => {
      // Obtener prioridad (menor número = mayor prioridad)
      const priorityA = pluginDependencyResolver.getPluginPriority(a);
      const priorityB = pluginDependencyResolver.getPluginPriority(b);
      
      // Ordenar primero por prioridad
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // Si las prioridades son iguales, ordenar por ID para consistencia
      return a.id.localeCompare(b.id);
    });
    
    // Combinar los dos conjuntos
    sortedPlugins = [...sortedPlugins, ...remainingPlugins];
    
    // Publicar evento con información de orden
    eventBus.publish('pluginSystem.pluginsSorted', {
      original: plugins.length,
      sorted: sortedPlugins.length,
      order: sortedPlugins.map(p => p.id)
    });
    
    return sortedPlugins;
  } catch (error) {
    console.error('Error al ordenar plugins:', error);
    
    // En caso de error, devolver lista original
    return plugins;
  }
}

/**
 * Valida que un plugin sea compatible con la aplicación
 * @param {Object} plugin - Plugin a validar
 * @returns {Object} - Resultado de la validación
 */
export function validatePluginCompatibility(plugin) {
  try {
    if (!plugin || !plugin.id) {
      return {
        valid: false,
        reason: 'Plugin inválido'
      };
    }
    
    // Validación básica de estructura
    const basicValidation = validatePluginComplete(plugin);
    
    // Si no pasa la validación básica, no continuar
    if (!basicValidation.valid) {
      return basicValidation;
    }
    
    // Validación completa de compatibilidad
    const compatResult = pluginCompatibility.runFullCompatibilityCheck(plugin);
    
    return {
      valid: compatResult.compatible,
      reason: compatResult.reason,
      details: {
        ...basicValidation.details,
        compatibility: compatResult.details
      }
    };
  } catch (error) {
    console.error(`Error al validar compatibilidad del plugin ${plugin?.id}:`, error);
    return {
      valid: false,
      reason: `Error en validación: ${error.message}`,
      details: {
        error: error.message
      }
    };
  }
}