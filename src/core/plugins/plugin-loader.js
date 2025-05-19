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
    
    // En un entorno web, podemos intentar cargar plugins desde una configuración global
    if (typeof window !== 'undefined') {
      // Verificar si hay una configuración global de plugins
      if (window.AtlasConfig && Array.isArray(window.AtlasConfig.plugins)) {
        plugins.push(...window.AtlasConfig.plugins);
      }
      
      // En entornos de desarrollo moderno, podemos usar importación dinámica
      // para cargar plugins desde una carpeta
      if (window.AtlasConfig && Array.isArray(window.AtlasConfig.pluginPaths)) {
        for (const pluginPath of window.AtlasConfig.pluginPaths) {
          try {
            const module = await import(/* @vite-ignore */ pluginPath);
            if (module && module.default) {
              plugins.push(module.default);
            }
          } catch (importError) {
            console.warn(`No se pudo cargar el plugin desde ${pluginPath}:`, importError.message);
          }
        }
      }
    }
    
    // Método para entornos Node.js
    // Este código solo se ejecutará en entornos Node
    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
      try {
        const fs = await import('fs');
        const path = await import('path');
        
        const pluginsDir = path.resolve(__dirname, '../../plugins');
        
        if (fs.existsSync(pluginsDir)) {
          const pluginFolders = fs.readdirSync(pluginsDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);
          
          for (const folder of pluginFolders) {
            const pluginIndexPath = path.join(pluginsDir, folder, 'index.js');
            
            if (fs.existsSync(pluginIndexPath)) {
              try {
                const plugin = require(pluginIndexPath).default;
                if (plugin) {
                  plugins.push(plugin);
                }
              } catch (requireError) {
                console.warn(`Error al cargar plugin desde ${pluginIndexPath}:`, requireError.message);
              }
            }
          }
        }
      } catch (error) {
        console.warn('Error al escanear carpeta de plugins:', error.message);
      }
    }
    
    // Agrega plugins específicos de entorno si se definen
    try {
      if (typeof __PLUGINS__ !== 'undefined' && Array.isArray(__PLUGINS__)) {
        plugins.push(...__PLUGINS__);
      }
    } catch (e) {
      // Variable __PLUGINS__ no definida, ignorar
    }
    
    // Uso de require.context para entornos Webpack
    if (typeof require !== 'undefined' && typeof require.context === 'function') {
      try {
        const pluginsContext = require.context('../../plugins', true, /index\.js$/);
        
        pluginsContext.keys().forEach(key => {
          try {
            const plugin = pluginsContext(key).default;
            if (plugin) {
              plugins.push(plugin);
            }
          } catch (contextError) {
            console.warn(`Error al cargar plugin con require.context desde ${key}:`, contextError.message);
          }
        });
      } catch (contextError) {
        console.warn('Error al usar require.context:', contextError.message);
      }
    }

    return plugins;
  } catch (error) {
    console.error('Error al descubrir plugins:', error);
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
    
    // Si no está cargado, intentar buscar por configuración
    if (typeof window !== 'undefined' && window.AtlasConfig) {
      // Buscar en plugins configurados
      if (Array.isArray(window.AtlasConfig.plugins)) {
        const configPlugin = window.AtlasConfig.plugins.find(p => p.id === pluginId);
        if (configPlugin) {
          return configPlugin;
        }
      }
      
      // Buscar en rutas configuradas
      if (Array.isArray(window.AtlasConfig.pluginPaths)) {
        for (const path of window.AtlasConfig.pluginPaths) {
          if (path.includes(pluginId)) {
            try {
              const module = await import(/* @vite-ignore */ path);
              if (module && module.default && module.default.id === pluginId) {
                return module.default;
              }
            } catch (importError) {
              console.warn(`No se pudo cargar el plugin ${pluginId} desde ${path}:`, importError.message);
            }
          }
        }
      }
    }
    
    // Intento genérico con importación dinámica
    try {
      // Esta importación solo funcionará en entornos que la soporten
      const dynamicPath = `../../plugins/${pluginId}/index.js`;
      const module = await import(/* @vite-ignore */ dynamicPath);
      if (module && module.default) {
        return module.default;
      }
    } catch (dynamicError) {
      // Silenciar error ya que es un intento genérico
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