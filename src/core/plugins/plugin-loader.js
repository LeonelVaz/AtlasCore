/**
 * Cargador de plugins para Atlas
 * 
 * Este módulo se encarga de detectar y cargar plugins desde
 * la carpeta designada del sistema
 */

import { validatePlugin } from './plugin-validator';
import { PLUGIN_CONSTANTS } from '../config/constants';

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
    
    console.log(`Plugins cargados: ${validPlugins.length}`);
    return validPlugins;
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