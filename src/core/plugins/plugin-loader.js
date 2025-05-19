/**
 * Cargador de plugins para Atlas
 */
import { validatePlugin, validatePluginComplete } from './plugin-validator';
import pluginCompatibility from './plugin-compatibility';
import pluginDependencyResolver from './plugin-dependency-resolver';
import { PLUGIN_CONSTANTS } from '../config/constants';
import eventBus from '../bus/event-bus';

// Esta función es específica para Vite/Rollup
function importAllPlugins() {
  try {
    // Usar import.meta.glob para cargar dinámicamente todos los archivos index.js en subdirectorios de plugins
    const pluginModules = import.meta.glob('/src/plugins/*/index.js', { eager: true });
    
    const plugins = [];
    for (const path in pluginModules) {
      const module = pluginModules[path];
      if (module && module.default) {
        console.log(`Plugin cargado desde: ${path}`);
        plugins.push(module.default);
      }
    }
    
    return plugins;
  } catch (error) {
    console.error('Error al importar plugins usando import.meta.glob:', error);
    return [];
  }
}

// Alternativa para entornos webpack
function requireAllPlugins() {
  try {
    if (typeof require !== 'undefined' && typeof require.context === 'function') {
      // Este código sólo se ejecuta en entornos webpack
      const context = require.context('/src/plugins', true, /\/index\.js$/);
      const plugins = [];
      
      context.keys().forEach(key => {
        try {
          const module = context(key);
          if (module && module.default) {
            console.log(`Plugin cargado desde webpack: ${key}`);
            plugins.push(module.default);
          }
        } catch (error) {
          console.warn(`Error al cargar plugin desde ${key}:`, error);
        }
      });
      
      return plugins;
    }
  } catch (error) {
    console.error('Error al importar plugins usando require.context:', error);
  }
  
  return [];
}

export async function loadPlugins() {
  try {
    // Array para almacenar plugins de todas las fuentes
    let plugins = [];
    
    // Intentar cargar con import.meta.glob primero (Vite/Rollup)
    try {
      const vitePlugins = importAllPlugins();
      if (vitePlugins.length > 0) {
        console.log(`Cargados ${vitePlugins.length} plugins con import.meta.glob`);
        plugins = [...plugins, ...vitePlugins];
      }
    } catch (e) {
      console.log('import.meta.glob no disponible, probando otras estrategias');
    }
    
    // Si no hay plugins y estamos en un entorno webpack, usar require.context
    if (plugins.length === 0) {
      const webpackPlugins = requireAllPlugins();
      if (webpackPlugins.length > 0) {
        console.log(`Cargados ${webpackPlugins.length} plugins con require.context`);
        plugins = [...plugins, ...webpackPlugins];
      }
    }
    
    // Si aún no hay plugins, intentar con la estrategia de importación dinámica
    if (plugins.length === 0) {
      try {
        // Lista de plugins que sabemos que deberían existir
        // En una aplicación real, podrías obtener esta lista de la configuración o del servidor
        const pluginDirs = ['plugin1', 'plugin2', 'custom-plugin', 'calendar-extension', 'task-manager'];
        
        for (const dir of pluginDirs) {
          try {
            // Usar dynamic import para cargar cada plugin
            const module = await import(`/src/plugins/${dir}/index.js`);
            if (module && module.default) {
              console.log(`Plugin cargado dinámicamente: ${dir}`);
              plugins.push(module.default);
            }
          } catch (error) {
            // Ignorar errores de importación individual, continuar con el siguiente plugin
            console.log(`Plugin ${dir} no encontrado o no pudo ser cargado`);
          }
        }
      } catch (error) {
        console.error('Error en importación dinámica:', error);
      }
    }
    
    // Si seguimos sin plugins, mostrar mensaje de error
    if (plugins.length === 0) {
      console.error('No se pudieron cargar plugins con ningún método. Comprueba la estructura del proyecto.');
    }
    
    // Validar y ordenar los plugins encontrados
    const validPlugins = plugins.filter(plugin => validatePlugin(plugin));
    const sortedPlugins = sortPluginsByPriority(validPlugins);
    
    console.log(`Plugins cargados y validados: ${sortedPlugins.length}`);
    return sortedPlugins;
  } catch (error) {
    console.error('Error al cargar plugins:', error);
    return [];
  }
}

export async function loadPluginById(pluginId) {
  try {
    // Intentar buscar el plugin en plugins ya cargados
    const allPlugins = await loadPlugins();
    const existingPlugin = allPlugins.find(p => p.id === pluginId);
    
    if (existingPlugin) {
      return existingPlugin;
    }
    
    // Si no se encontró, intentar cargar directamente
    try {
      const module = await import(`/src/plugins/${pluginId}/index.js`);
      if (module && module.default) {
        console.log(`Plugin ${pluginId} cargado directamente`);
        return module.default;
      }
    } catch (error) {
      console.warn(`No se pudo cargar directamente el plugin ${pluginId}:`, error);
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