import React, { useState, useEffect } from 'react';
import Button from '../ui/button';
import Dialog from '../ui/dialog';
import pluginManager from '../../core/plugins/plugin-manager';

/**
 * Componente para la administración de plugins
 */
const PluginsPanel = () => {
  // Estado para almacenar la lista de plugins
  const [plugins, setPlugins] = useState([]);
  // Estado para mostrar el diálogo de información de plugin
  const [showPluginInfo, setShowPluginInfo] = useState(false);
  // Plugin seleccionado para mostrar información
  const [selectedPlugin, setSelectedPlugin] = useState(null);
  // Estado de carga
  const [loading, setLoading] = useState(true);
  // Estado para refrescar la lista
  const [refreshKey, setRefreshKey] = useState(0);

  // Cargar plugins al iniciar
  useEffect(() => {
    async function loadPluginSystem() {
      try {
        setLoading(true);
        
        // Inicializar el sistema de plugins si aún no lo está
        if (!pluginManager.initialized) {
          await pluginManager.initialize();
        }
        
        // Obtener lista de plugins
        const allPlugins = pluginManager.getAllPlugins();
        setPlugins(allPlugins);
      } catch (error) {
        console.error('Error al cargar plugins:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadPluginSystem();
  }, [refreshKey]);

  // Función para activar/desactivar un plugin
  const togglePluginState = async (pluginId, currentlyActive) => {
    try {
      setLoading(true);
      
      if (currentlyActive) {
        await pluginManager.deactivatePlugin(pluginId);
      } else {
        await pluginManager.activatePlugin(pluginId);
      }
      
      // Refrescar lista
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error(`Error al cambiar estado del plugin ${pluginId}:`, error);
    } finally {
      setLoading(false);
    }
  };

  // Función para recargar todos los plugins
  const handleReloadPlugins = async () => {
    try {
      setLoading(true);
      await pluginManager.reloadPlugins();
      // Refrescar lista
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error al recargar plugins:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función para mostrar información de un plugin
  const showPluginDetails = (plugin) => {
    setSelectedPlugin(plugin);
    setShowPluginInfo(true);
  };

  // Función para cerrar el diálogo de información
  const closePluginDetails = () => {
    setShowPluginInfo(false);
    setSelectedPlugin(null);
  };

  return (
    <div className="plugins-panel">
      <h2 className="plugins-panel-title">Plugins</h2>
      
      <div className="plugins-control">
        <Button 
          onClick={handleReloadPlugins}
          disabled={loading}
        >
          Recargar Plugins
        </Button>
      </div>
      
      {loading ? (
        <div className="plugins-loading">
          <p>Cargando plugins...</p>
        </div>
      ) : (
        <div className="plugins-list">
          {plugins.length === 0 ? (
            <div className="plugins-empty">
              <p>No se encontraron plugins instalados.</p>
              <p className="plugin-help-text">
                Los plugins deben instalarse en la carpeta <code>src/plugins/</code> de la aplicación.
                Cada plugin debe estar en su propia carpeta con un archivo <code>index.js</code>.
              </p>
            </div>
          ) : (
            plugins.map(plugin => {
              const isActive = pluginManager.isPluginActive(plugin.id);
              
              return (
                <div 
                  key={plugin.id} 
                  className={`plugin-item ${isActive ? 'active' : 'inactive'}`}
                >
                  <div className="plugin-info">
                    <h3 className="plugin-name">{plugin.name}</h3>
                    <p className="plugin-description">{plugin.description}</p>
                    <div className="plugin-meta">
                      <span className="plugin-version">v{plugin.version}</span>
                      <span className="plugin-author">por {plugin.author}</span>
                    </div>
                  </div>
                  
                  <div className="plugin-actions">
                    <Button 
                      onClick={() => showPluginDetails(plugin)}
                      variant="text"
                      size="small"
                    >
                      Detalles
                    </Button>
                    
                    <Button 
                      onClick={() => togglePluginState(plugin.id, isActive)}
                      variant={isActive ? 'danger' : 'primary'}
                      size="small"
                    >
                      {isActive ? 'Desactivar' : 'Activar'}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
      
      {showPluginInfo && selectedPlugin && (
        <Dialog
          isOpen={showPluginInfo}
          onClose={closePluginDetails}
          title={`Plugin: ${selectedPlugin.name}`}
        >
          <div className="plugin-details">
            <div className="plugin-detail-item">
              <strong>ID:</strong> {selectedPlugin.id}
            </div>
            <div className="plugin-detail-item">
              <strong>Versión:</strong> {selectedPlugin.version}
            </div>
            <div className="plugin-detail-item">
              <strong>Autor:</strong> {selectedPlugin.author}
            </div>
            <div className="plugin-detail-item">
              <strong>Descripción:</strong> {selectedPlugin.description}
            </div>
            <div className="plugin-detail-item">
              <strong>Versión mínima de Atlas:</strong> {selectedPlugin.minAppVersion}
            </div>
            <div className="plugin-detail-item">
              <strong>Versión máxima de Atlas:</strong> {selectedPlugin.maxAppVersion}
            </div>
            <div className="plugin-detail-item">
              <strong>Estado:</strong> {pluginManager.isPluginActive(selectedPlugin.id) ? 'Activo' : 'Inactivo'}
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};

export default PluginsPanel;