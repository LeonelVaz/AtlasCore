// electron/plugins-integration.js con mejor detección y logging
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

/**
 * Sistema de integración de plugins para Electron
 */
class PluginsIntegration {
  constructor() {
    this.plugins = [];
    // Buscar en múltiples ubicaciones posibles
    this.possiblePluginDirs = [
      path.join(__dirname, '../src/plugins'),
      path.join(__dirname, 'plugins'),
      path.join(app.getAppPath(), 'plugins'),
      path.join(process.cwd(), 'plugins'),
      path.join(process.cwd(), 'src/plugins')
    ];
  }

  /**
   * Inicializa el sistema de plugins
   */
  initialize() {
    console.log('Inicializando sistema de plugins de Electron...');
    this.loadPlugins();
  }

  /**
   * Encuentra el directorio de plugins válido
   * @returns {string|null} - Ruta al directorio de plugins o null si no se encuentra
   */
  findPluginsDir() {
    for (const dir of this.possiblePluginDirs) {
      console.log(`Buscando plugins en: ${dir}`);
      if (fs.existsSync(dir)) {
        console.log(`¡Directorio de plugins encontrado!: ${dir}`);
        return dir;
      }
    }
    console.warn('No se encontró un directorio de plugins válido');
    return null;
  }

  /**
   * Carga todos los plugins del directorio de plugins
   */
  loadPlugins() {
    try {
      console.log('Buscando plugins disponibles...');
      
      // Encontrar directorio de plugins
      const pluginsDir = this.findPluginsDir();
      if (!pluginsDir) {
        console.warn('Directorio de plugins no encontrado en ninguna ubicación conocida');
        return;
      }

      // Leer directorio para encontrar carpetas de plugins
      const items = fs.readdirSync(pluginsDir, { withFileTypes: true });
      
      // Filtrar directorios y excluir archivos del sistema de plugins
      const pluginDirs = items
        .filter(item => item.isDirectory())
        .filter(dir => dir.name !== 'node_modules')
        .filter(dir => !dir.name.startsWith('.'))
        .map(dir => path.join(pluginsDir, dir.name));
      
      console.log(`Encontrados ${pluginDirs.length} posibles plugins: ${pluginDirs.join(', ')}`);
      
      // Buscar archivos index.js directamente como plugins
      const potentialPluginFiles = items
        .filter(item => !item.isDirectory() && item.name.endsWith('.js') && item.name !== 'index.js')
        .map(file => path.join(pluginsDir, file.name));
      
      if (potentialPluginFiles.length > 0) {
        console.log(`Encontrados ${potentialPluginFiles.length} posibles archivos plugin: ${potentialPluginFiles.join(', ')}`);
      }
      
      // Cargar cada plugin desde directorios
      pluginDirs.forEach(pluginDir => {
        const pluginInfo = this.loadPlugin(pluginDir);
        if (pluginInfo) {
          this.plugins.push(pluginInfo);
        }
      });
      
      // Cargar cada plugin desde archivos
      potentialPluginFiles.forEach(pluginFile => {
        const pluginInfo = this.loadPluginFromPath(pluginFile);
        if (pluginInfo) {
          this.plugins.push(pluginInfo);
        }
      });
      
      console.log(`${this.plugins.length} plugins cargados correctamente`);
      
      // Listar los plugins cargados
      if (this.plugins.length > 0) {
        console.log("Plugins cargados:");
        this.plugins.forEach(plugin => {
          console.log(`- ${plugin.name} (${plugin.id}) v${plugin.version}`);
        });
      } else {
        console.log("No se cargaron plugins");
      }
    } catch (error) {
      console.error('Error al cargar plugins:', error);
    }
  }

  /**
   * Carga un plugin individual
   * @param {string} pluginDir - Directorio del plugin
   * @returns {Object|null} - Información del plugin o null si hay error
   */
  loadPlugin(pluginDir) {
    try {
      const pluginName = path.basename(pluginDir);
      console.log(`Intentando cargar plugin: ${pluginName} desde ${pluginDir}`);
      
      // Verificar archivo index.js
      const indexPath = path.join(pluginDir, 'index.js');
      if (!fs.existsSync(indexPath)) {
        console.warn(`Plugin ${pluginName}: No se encontró index.js en ${indexPath}`);
        return null;
      }
      
      console.log(`Archivo index.js encontrado para plugin ${pluginName}`);
      return this.loadPluginFromPath(indexPath, pluginDir);
    } catch (error) {
      console.error(`Error en loadPlugin:`, error);
      return null;
    }
  }

  /**
   * Carga un plugin desde una ruta específica (para instalación manual)
   * @param {string} pluginPath - Ruta al plugin
   * @param {string} [pluginDir] - Directorio opcional del plugin
   * @returns {Object|null} - Información del plugin o null si hay error
   */
  loadPluginFromPath(pluginPath, pluginDir = null) {
    try {
      if (!fs.existsSync(pluginPath)) {
        console.warn(`Plugin no encontrado en: ${pluginPath}`);
        return null;
      }
      
      console.log(`Cargando plugin desde archivo: ${pluginPath}`);

      // Determinar directorio si no se proporcionó
      if (!pluginDir) {
        pluginDir = path.dirname(pluginPath);
      }

      try {
        // Cargar el módulo
        delete require.cache[require.resolve(pluginPath)]; // Limpiar cache para recargar
        const pluginModule = require(pluginPath);
        
        console.log(`Módulo cargado desde ${pluginPath}:`, typeof pluginModule);
        
        // Manejar tanto CommonJS como ESM
        const plugin = pluginModule.default || pluginModule;
        
        console.log(`Plugin extraído (${typeof plugin}):`, Object.keys(plugin));
        
        // Validar que tenga la estructura correcta
        if (!this.validatePlugin(plugin)) {
          console.error(`Plugin inválido en: ${pluginPath}`);
          console.error(`Propiedades encontradas:`, Object.keys(plugin));
          
          if (typeof plugin.init !== 'function') {
            console.error(`- Falta método init() o no es una función`);
          }
          if (typeof plugin.cleanup !== 'function') {
            console.error(`- Falta método cleanup() o no es una función`);
          }
          if (!plugin.id) {
            console.error(`- Falta propiedad id`);
          }
          if (!plugin.name) {
            console.error(`- Falta propiedad name`);
          }
          if (!plugin.version) {
            console.error(`- Falta propiedad version`);
          }
          
          return null;
        }
        
        console.log(`Plugin ${plugin.name} (${plugin.id}) v${plugin.version} cargado correctamente`);
        
        return {
          id: plugin.id,
          name: plugin.name,
          version: plugin.version,
          description: plugin.description || '',
          author: plugin.author || '',
          dir: pluginDir,
          module: plugin
        };
      } catch (error) {
        console.error(`Error al cargar plugin desde: ${pluginPath}`, error);
        return null;
      }
    } catch (error) {
      console.error(`Error en loadPluginFromPath para ${pluginPath}:`, error);
      return null;
    }
  }

  /**
   * Valida que un plugin tenga la estructura correcta
   * @param {Object} plugin - Objeto del plugin
   * @returns {boolean} - true si es válido
   */
  validatePlugin(plugin) {
    if (!plugin || typeof plugin !== 'object') return false;
    if (!plugin.id || !plugin.name || !plugin.version) return false;
    if (typeof plugin.init !== 'function') return false;
    if (typeof plugin.cleanup !== 'function') return false;
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