// src/components/settings/plugins-config.jsx
import React, { useState, useEffect } from 'react';
import { pluginRegistry, pluginLoader } from '../../plugins';
import Button from '../ui/button';

/**
 * Componente para configuración de plugins
 */
const PluginsConfig = () => {
  const [plugins, setPlugins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isElectron, setIsElectron] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Para forzar actualizaciones
  
  // Detectar entorno Electron
  useEffect(() => {
    setIsElectron(!!window.electronAPI);
  }, []);
  
  // Cargar lista de plugins
  useEffect(() => {
    const loadPlugins = () => {
      try {
        const allPlugins = pluginRegistry.getAllPlugins();
        setPlugins(allPlugins);
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar plugins:', err);
        setError('Error al cargar la lista de plugins');
        setLoading(false);
      }
    };
    
    loadPlugins();
  }, [refreshKey]); // Recargar cuando cambie refreshKey
  
  // Manejar cambio de estado de plugin
  const handleTogglePlugin = async (pluginId, currentEnabled) => {
    try {
      let success;
      
      if (currentEnabled) {
        success = await pluginRegistry.disablePlugin(pluginId);
      } else {
        success = await pluginRegistry.enablePlugin(pluginId);
      }
      
      if (success) {
        // Actualizar la lista de plugins
        setRefreshKey(prev => prev + 1);
      } else {
        setError(`Error al ${currentEnabled ? 'desactivar' : 'activar'} el plugin`);
      }
    } catch (err) {
      console.error('Error al cambiar estado del plugin:', err);
      setError(`Error al ${currentEnabled ? 'desactivar' : 'activar'} el plugin`);
    }
  };
  
  // Manejar carga de plugin desde archivo (en Electron)
  const handleLoadPlugin = async () => {
    if (!window.electronAPI?.plugins?.selectPlugin) {
      setError('Esta funcionalidad solo está disponible en la versión de escritorio');
      return;
    }
    
    try {
      setError(null);
      const plugin = await window.electronAPI.plugins.selectPlugin();
      
      if (plugin) {
        // Registrar el plugin
        const success = pluginLoader.registerPlugin(plugin);
        
        if (success) {
          // Forzar actualización de la lista
          setRefreshKey(prev => prev + 1);
        } else {
          setError('El plugin seleccionado no es válido o ya está instalado');
        }
      }
    } catch (err) {
      console.error('Error al cargar plugin:', err);
      setError('Error al cargar el plugin seleccionado');
    }
  };
  
  // Recargar plugins (útil para detectar nuevos plugins en el sistema)
  const handleRefreshPlugins = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Esta función recargará plugins disponibles en el sistema
      // En Electron, detectará nuevos plugins en la carpeta
      await pluginLoader.discoverPlugins();
      
      // Forzar actualización de la lista
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error al recargar plugins:', error);
      setError('Error al recargar la lista de plugins');
      setLoading(false);
    }
  };
  
  if (loading) {
    return <div className="plugins-config loading">Cargando plugins...</div>;
  }
  
  return (
    <div className="plugins-config">
      <h3 className="plugins-config-title">Plugins de Atlas</h3>
      <p className="plugins-config-description">
        Los plugins extienden la funcionalidad de Atlas con características adicionales.
      </p>
      
      {error && (
        <div className="plugins-error">
          {error}
          <button className="plugins-error-close" onClick={() => setError(null)}>×</button>
        </div>
      )}
      
      <div className="plugins-actions">
        {isElectron && (
          <Button onClick={handleLoadPlugin} variant="primary">
            Instalar Plugin...
          </Button>
        )}
        
        <Button onClick={handleRefreshPlugins} variant="secondary">
          Recargar Plugins
        </Button>
        
        <p className="plugins-install-hint">
          {isElectron 
            ? 'Para instalar un plugin, descárgalo y selecciona el archivo o colócalo en la carpeta de plugins.'
            : 'Los plugins se activan automáticamente al colocarlos en la carpeta de plugins.'}
        </p>
      </div>
      
      {plugins.length === 0 ? (
        <div className="plugins-empty">
          <p>No hay plugins instalados.</p>
          <p className="plugins-empty-hint">
            {isElectron 
              ? 'Descarga plugins y añádelos usando el botón "Instalar Plugin" de arriba.' 
              : 'Coloca plugins en la carpeta "plugins" y usa el botón "Recargar Plugins".'}
          </p>
        </div>
      ) : (
        <div className="plugins-list">
          {plugins.map(plugin => (
            <div key={plugin.id} className="plugin-item">
              <div className="plugin-info">
                <div className="plugin-header">
                  <h4 className="plugin-name">{plugin.name}</h4>
                  <span className="plugin-version">v{plugin.version}</span>
                </div>
                <p className="plugin-description">{plugin.description}</p>
                <div className="plugin-metadata">
                  <span className="plugin-author">Autor: {plugin.author}</span>
                </div>
              </div>
              <div className="plugin-actions">
                <Button 
                  onClick={() => handleTogglePlugin(plugin.id, plugin.enabled)}
                  variant={plugin.enabled ? "secondary" : "primary"}
                >
                  {plugin.enabled ? "Desactivar" : "Activar"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PluginsConfig;