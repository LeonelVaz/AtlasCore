// Una versión simplificada de plugins-integration.js que carga un plugin conocido
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

/**
 * Sistema de integración de plugins para Electron - versión simplificada
 */
class PluginsIntegration {
  constructor() {
    this.plugins = [];
    this.initialized = false;
  }

  /**
   * Inicializa el sistema de plugins
   */
  initialize() {
    if (this.initialized) return;
    this.initialized = true;
    
    console.log('Inicializando sistema de plugins simplificado de Electron...');
    
    // Cargar plugin de prueba directamente
    this.loadKnownPlugin();
  }

  /**
   * Carga el plugin de prueba conocido
   */
  loadKnownPlugin() {
    try {
      // Rutas posibles para el plugin de prueba
      const possiblePaths = [
        path.join(__dirname, '../src/plugins/test-plugin/index.js'),
        path.join(__dirname, '../plugins/test-plugin/index.js'),
        path.join(__dirname, 'plugins/test-plugin/index.js'),
        path.join(process.cwd(), 'src/plugins/test-plugin/index.js')
      ];

      let pluginPath = null;
      
      // Encontrar el primero que existe
      for (const testPath of possiblePaths) {
        console.log(`Buscando plugin de prueba en: ${testPath}`);
        if (fs.existsSync(testPath)) {
          pluginPath = testPath;
          console.log(`Plugin de prueba encontrado en: ${pluginPath}`);
          break;
        }
      }

      if (!pluginPath) {
        console.warn('El plugin de prueba no se encontró en ninguna ubicación conocida');
        return;
      }

      // Cargar el plugin
      try {
        // Limpiar caché para asegurar recarga completa
        delete require.cache[require.resolve(pluginPath)];
        
        // Cargar el módulo
        const pluginModule = require(pluginPath);
        const plugin = pluginModule.default || pluginModule;
        
        console.log(`Plugin cargado. Propiedades:`, Object.keys(plugin));
        
        // Validar plugin
        if (!this.validatePlugin(plugin)) {
          console.error(`El plugin de prueba no tiene la estructura correcta`);
          return;
        }
        
        // Crear objeto de información del plugin
        const pluginInfo = {
          id: plugin.id,
          name: plugin.name,
          version: plugin.version,
          description: plugin.description || '',
          author: plugin.author || '',
          dir: path.dirname(pluginPath),
          module: plugin,
          enabled: true // Marcarlo como habilitado automáticamente
        };
        
        // Guardar en la lista de plugins
        this.plugins = [pluginInfo];
        
        console.log(`Plugin de prueba cargado correctamente: ${plugin.name} (${plugin.id}) v${plugin.version}`);
      } catch (error) {
        console.error(`Error al cargar plugin de prueba:`, error);
      }
    } catch (error) {
      console.error('Error al cargar plugin de prueba:', error);
    }
  }

  /**
   * Valida que un plugin tenga la estructura correcta
   * @param {Object} plugin - Objeto del plugin
   * @returns {boolean} - true si es válido
   */
  validatePlugin(plugin) {
    if (!plugin || typeof plugin !== 'object') {
      console.error('Plugin no es un objeto');
      return false;
    }
    if (!plugin.id || !plugin.name || !plugin.version) {
      console.error('Plugin no tiene propiedades requeridas (id, name, version)');
      console.error('Propiedades encontradas:', Object.keys(plugin));
      return false;
    }
    if (typeof plugin.init !== 'function') {
      console.error('Plugin no tiene método init() o no es una función');
      return false;
    }
    if (typeof plugin.cleanup !== 'function') {
      console.error('Plugin no tiene método cleanup() o no es una función');
      return false;
    }
    return true;
  }

  /**
   * Obtiene la lista de plugins cargados
   * @returns {Array} - Lista de plugins
   */
  getPlugins() {
    return this.plugins;
  }
}

// Exportar una instancia única
const pluginsIntegration = new PluginsIntegration();
module.exports = pluginsIntegration;