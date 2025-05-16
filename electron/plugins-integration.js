// electron/plugins-integration.js
const { app, dialog, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

/**
 * Configura el sistema de plugins para Electron
 * @param {BrowserWindow} mainWindow - Ventana principal de la aplicación
 */
function setupPluginsSystem(mainWindow) {
  // Carpeta donde se buscarán los plugins
  const pluginsDir = path.join(__dirname, '../src/plugins');
  const userPluginsDir = path.join(app.getPath('userData'), 'plugins');
  
  // Crear carpeta de plugins de usuario si no existe
  if (!fs.existsSync(userPluginsDir)) {
    fs.mkdirSync(userPluginsDir, { recursive: true });
  }
  
  // Manejar solicitud para cargar plugins
  ipcMain.handle('plugins:load', async () => {
    try {
      const plugins = [];
      
      // Intentar cargar plugins desde la carpeta integrada en la aplicación
      if (fs.existsSync(pluginsDir)) {
        const entries = fs.readdirSync(pluginsDir);
        for (const entry of entries) {
          // Solo considerar directorios (no archivos como plugin-loader.js)
          const fullPath = path.join(pluginsDir, entry);
          
          if (fs.statSync(fullPath).isDirectory()) {
            const indexPath = path.join(fullPath, 'index.js');
            
            // Verificar si existe un index.js
            if (fs.existsSync(indexPath)) {
              try {
                // En lugar de simplemente leer el contenido del archivo, intentamos cargar el plugin completo
                // Esta es la parte crítica que debemos cambiar
                
                // Eliminar la caché del módulo si ya se cargó previamente
                delete require.cache[require.resolve(indexPath)];
                
                // Cargar el módulo completo (esto incluye las funciones init y cleanup)
                const pluginModule = require(indexPath);
                
                // Asegurarnos de obtener un objeto válido
                if (pluginModule && typeof pluginModule === 'object') {
                  // Validar las propiedades mínimas necesarias aquí para evitar enviar plugins inválidos
                  if (pluginModule.id && 
                      pluginModule.name && 
                      pluginModule.version && 
                      typeof pluginModule.init === 'function' && 
                      typeof pluginModule.cleanup === 'function') {
                    
                    // Crear un objeto que contiene tanto metadatos como el plugin completo
                    plugins.push({
                      path: fullPath,
                      id: pluginModule.id,
                      name: pluginModule.name,
                      version: pluginModule.version,
                      description: pluginModule.description || '',
                      author: pluginModule.author || '',
                      // Guardar el plugin completo incluyendo sus funciones
                      // Esto no funcionará directamente por razones de serialización
                      // pero lo abordamos más abajo
                      _pluginModule: pluginModule
                    });
                  } else {
                    console.warn(`Plugin ${entry} no contiene las propiedades requeridas`);
                  }
                }
              } catch (err) {
                console.warn(`Error al cargar plugin ${entry}:`, err);
              }
            }
          }
        }
      }
      
      // También cargar desde carpeta de usuario
      if (fs.existsSync(userPluginsDir)) {
        // Implementación similar a la anterior...
        // Omitido por brevedad
      }
      
      // NOTA: Como no podemos enviar funciones a través del IPC,
      // debemos modificar el enfoque para solo enviar los metadatos
      // y dejar que el frontend cargue los plugins
      return plugins.map(plugin => {
        // Eliminar el módulo completo ya que no se puede serializar
        const { _pluginModule, ...metadata } = plugin;
        return metadata;
      });
    } catch (error) {
      console.error('Error al cargar plugins:', error);
      return [];
    }
  });
  
  // Manejar solicitud para seleccionar un archivo de plugin para instalar
  ipcMain.handle('plugins:select', async () => {
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Seleccionar Plugin',
        filters: [{ name: 'Plugins de Atlas', extensions: ['js', 'zip'] }],
        properties: ['openFile']
      });
      
      if (result.canceled || result.filePaths.length === 0) {
        return null;
      }
      
      const pluginPath = result.filePaths[0];
      const ext = path.extname(pluginPath).toLowerCase();
      
      if (ext === '.js') {
        // Si es un archivo JS, copiarlo directamente
        const destPath = path.join(userPluginsDir, path.basename(pluginPath));
        fs.copyFileSync(pluginPath, destPath);
        
        // Leer contenido y extraer metadatos
        const content = fs.readFileSync(destPath, 'utf-8');
        
        // Usar regex para extraer información básica
        const idMatch = content.match(/id:\s*['"]([^'"]+)['"]/);
        const nameMatch = content.match(/name:\s*['"]([^'"]+)['"]/);
        const versionMatch = content.match(/version:\s*['"]([^'"]+)['"]/);
        
        if (idMatch && nameMatch && versionMatch) {
          return {
            id: idMatch[1],
            name: nameMatch[1],
            version: versionMatch[1],
            path: destPath
          };
        }
      } else if (ext === '.zip') {
        // Implementación para descomprimir y cargar plugins en formato ZIP
        // Omitido por brevedad
      }
      
      return null;
    } catch (error) {
      console.error('Error al seleccionar plugin:', error);
      return null;
    }
  });
}

module.exports = { setupPluginsSystem };