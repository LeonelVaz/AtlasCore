// src/components/settings/plugins-config.jsx
import React, { useState, useEffect } from 'react';
import { pluginRegistry } from '../../plugins';
import Button from '../ui/button';

/**
 * Componente para configuración de plugins
 */
const PluginsConfig = () => {
  const [plugins, setPlugins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
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
  }, []);
  
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
        const updatedPlugins = pluginRegistry.getAllPlugins();
        setPlugins(updatedPlugins);
      } else {
        setError(`Error al ${currentEnabled ? 'desactivar' : 'activar'} el plugin`);
      }
    } catch (err) {
      console.error('Error al cambiar estado del plugin:', err);
      setError(`Error al ${currentEnabled ? 'desactivar' : 'activar'} el plugin`);
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
        </div>
      )}
      
      {plugins.length === 0 ? (
        <div className="plugins-empty">
          <p>No hay plugins disponibles en esta versión.</p>
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