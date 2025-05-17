/**
 * Cargador de plugins para Atlas
 */
import { validatePlugin, validatePluginComplete } from './plugin-validator';
import pluginCompatibility from './plugin-compatibility';
import pluginDependencyResolver from './plugin-dependency-resolver';
import { PLUGIN_CONSTANTS } from '../config/constants';
import eventBus from '../bus/event-bus';

export async function loadPlugins() {
  try {
    const plugins = await discoverPlugins();
    const validPlugins = plugins.filter(plugin => validatePlugin(plugin));
    const sortedPlugins = sortPluginsByPriority(validPlugins);
    
    console.log(`Plugins cargados: ${sortedPlugins.length}`);
    return sortedPlugins;
  } catch (error) {
    console.error('Error al cargar plugins:', error);
    return [];
  }
}

async function discoverPlugins() {
  try {
    const plugins = [];
    
    try {
      const examplePlugin = await import('../../plugins/example-plugin/index.js');
      
      if (examplePlugin && examplePlugin.default) {
        plugins.push(examplePlugin.default);
      }
    } catch (importError) {
      console.warn('No se pudo cargar el plugin de ejemplo:', importError.message);
    }

    return plugins;
  } catch (error) {
    console.error('Error al descubrir plugins:', error);
    return [];
  }
}

export async function loadPluginById(pluginId) {
  try {
    if (pluginId === 'example-plugin') {
      try {
        const examplePlugin = await import('../../plugins/example-plugin/index.js');
        return examplePlugin?.default || null;
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

function sortPluginsByPriority(plugins) {
  try {
    if (!plugins || !Array.isArray(plugins) || plugins.length <= 1) {
      return plugins || [];
    }
    
    const dependencyOrder = pluginDependencyResolver.calculateLoadOrder();
    
    const pluginsMap = {};
    plugins.forEach(plugin => {
      if (plugin && plugin.id) {
        pluginsMap[plugin.id] = plugin;
      }
    });
    
    let sortedPlugins = [];
    
    for (const pluginId of dependencyOrder) {
      if (pluginsMap[pluginId]) {
        sortedPlugins.push(pluginsMap[pluginId]);
        delete pluginsMap[pluginId];
      }
    }
    
    const remainingPlugins = Object.values(pluginsMap);
    
    remainingPlugins.sort((a, b) => {
      const priorityA = pluginDependencyResolver.getPluginPriority(a);
      const priorityB = pluginDependencyResolver.getPluginPriority(b);
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      return a.id.localeCompare(b.id);
    });
    
    sortedPlugins = [...sortedPlugins, ...remainingPlugins];
    
    eventBus.publish('pluginSystem.pluginsSorted', {
      original: plugins.length,
      sorted: sortedPlugins.length,
      order: sortedPlugins.map(p => p.id)
    });
    
    return sortedPlugins;
  } catch (error) {
    console.error('Error al ordenar plugins:', error);
    return plugins;
  }
}

export function validatePluginCompatibility(plugin) {
  try {
    if (!plugin || !plugin.id) {
      return {
        valid: false,
        reason: 'Plugin inválido'
      };
    }
    
    const basicValidation = validatePluginComplete(plugin);
    
    if (!basicValidation.valid) {
      return basicValidation;
    }
    
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
      details: { error: error.message }
    };
  }
}