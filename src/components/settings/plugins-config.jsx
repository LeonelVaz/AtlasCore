// src/components/settings/plugins-config.jsx
import React, { useState, useEffect } from 'react';
import { pluginRegistry, pluginLoader } from '../../plugins';
import { PERMISSIONS } from '../../plugins/plugin-permissions';
import Button from '../ui/button';
import Dialog from '../ui/dialog';

/**
 * Componente de detalles y permisos de plugin
 */
const PluginDetails = ({ plugin, onClose, onSavePermissions }) => {
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Cargar permisos del plugin
  useEffect(() => {
    const loadPermissions = async () => {
      const pluginPerms = pluginRegistry.getPluginPermissions(plugin.id);
      setPermissions(pluginPerms);
      setLoading(false);
    };
    
    loadPermissions();
  }, [plugin.id]);
  
  // Cambiar un permiso específico
  const handleTogglePermission = (permissionId) => {
    setPermissions(prev => ({
      ...prev,
      [permissionId]: !prev[permissionId]
    }));
  };
  
  // Guardar cambios en permisos
  const handleSavePermissions = async () => {
    await pluginRegistry.setPluginPermissions(plugin.id, permissions);
    onSavePermissions();
  };
  
  if (loading) {
    return <div className="plugin-details-loading">Cargando detalles...</div>;
  }
  
  // Agrupar permisos por categoría
  const permissionsByCategory = {};
  Object.entries(PERMISSIONS).forEach(([permId, permDetails]) => {
    const category = permId.split('.')[0];
    if (!permissionsByCategory[category]) {
      permissionsByCategory[category] = [];
    }
    permissionsByCategory[category].push({
      id: permId,
      ...permDetails,
      granted: permissions[permId] === true
    });
  });
  
  return (
    <Dialog
      isOpen={true}
      onClose={onClose}
      title={`Detalles del Plugin: ${plugin.name}`}
    >
      <div className="plugin-details">
        <div className="plugin-info-section">
          <h3>Información</h3>
          <div className="plugin-detail-row">
            <span className="plugin-detail-label">Nombre:</span>
            <span className="plugin-detail-value">{plugin.name}</span>
          </div>
          <div className="plugin-detail-row">
            <span className="plugin-detail-label">Versión:</span>
            <span className="plugin-detail-value">{plugin.version}</span>
          </div>
          <div className="plugin-detail-row">
            <span className="plugin-detail-label">Autor:</span>
            <span className="plugin-detail-value">{plugin.author || 'No especificado'}</span>
          </div>
          <div className="plugin-detail-row">
            <span className="plugin-detail-label">Descripción:</span>
            <span className="plugin-detail-value">{plugin.description || 'Sin descripción'}</span>
          </div>
          <div className="plugin-detail-row">
            <span className="plugin-detail-label">Estado:</span>
            <span className={`plugin-detail-status plugin-status-${plugin.status}`}>
              {plugin.status === 'initialized' ? 'Activo' : 
               plugin.status === 'error' ? 'Error' : 
               plugin.status === 'disabled' ? 'Desactivado' : plugin.status}
            </span>
          </div>
          {plugin.error && (
            <div className="plugin-detail-row">
              <span className="plugin-detail-label">Error:</span>
              <span className="plugin-detail-error">{plugin.error}</span>
            </div>
          )}
        </div>
        
        <div className="plugin-permissions-section">
          <h3>Permisos</h3>
          {Object.entries(permissionsByCategory).map(([category, perms]) => (
            <div key={category} className="permissions-category">
              <h4 className="permissions-category-title">
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </h4>
              <div className="permissions-list">
                {perms.map(perm => (
                  <div key={perm.id} className="permission-item">
                    <div className="permission-toggle">
                      <input
                        type="checkbox"
                        id={`perm-${perm.id}`}
                        checked={perm.granted}
                        onChange={() => handleTogglePermission(perm.id)}
                      />
                      <label htmlFor={`perm-${perm.id}`}>
                        <span className="permission-name">{perm.name}</span>
                      </label>
                    </div>
                    <div className="permission-description">{perm.description}</div>
                    <div className={`permission-risk permission-risk-${perm.dangerLevel}`}>
                      {perm.dangerLevel === 'low' ? 'Riesgo bajo' :
                       perm.dangerLevel === 'medium' ? 'Riesgo medio' : 'Riesgo alto'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          <div className="plugin-details-actions">
            <Button 
              variant="primary" 
              onClick={handleSavePermissions}
            >
              Guardar Permisos
            </Button>
            <Button 
              variant="secondary" 
              onClick={onClose}
            >
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

/**
 * Componente para configuración de plugins
 */
const PluginsConfig = () => {
  const [plugins, setPlugins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isElectron, setIsElectron] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Para forzar actualizaciones
  const [selectedPlugin, setSelectedPlugin] = useState(null);
  
  // Detectar entorno Electron
  useEffect(() => {
    setIsElectron(!!window.electronAPI);
  }, []);
  
  // Cargar lista de plugins
  useEffect(() => {
    const loadPlugins = async () => {
      try {
        setLoading(true);
        // Forzar la detección de plugins
        await pluginRegistry.refreshPlugins();
        
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
      setError("Esta funcionalidad aún no está disponible");
      return;
    }
    
    try {
      const result = await window.electronAPI.plugins.selectPlugin();
      
      if (result) {
        // Recargar plugins para detectar el nuevo
        await handleRefreshPlugins();
      }
    } catch (error) {
      console.error('Error al cargar plugin:', error);
      setError('Error al cargar el plugin seleccionado');
    }
  };
  
  // Recargar plugins (útil para detectar nuevos plugins en el sistema)
  const handleRefreshPlugins = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Esta función recargará plugins disponibles en el sistema
      await pluginRegistry.refreshPlugins();
      
      // Forzar actualización de la lista
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error al recargar plugins:', error);
      setError('Error al recargar la lista de plugins');
      setLoading(false);
    }
  };
  
  // Mostrar detalles y gestionar permisos
  const handleViewDetails = (plugin) => {
    setSelectedPlugin(plugin);
  };
  
  // Cerrar diálogo de detalles
  const handleCloseDetails = () => {
    setSelectedPlugin(null);
  };
  
  // Guardar permisos y actualizar lista
  const handleSavePermissions = () => {
    setSelectedPlugin(null);
    // Recargar lista por si hay cambios que afecten al UI
    setRefreshKey(prev => prev + 1);
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
        <Button onClick={handleLoadPlugin} variant="primary">
          Instalar Plugin...
        </Button>
        
        <Button onClick={handleRefreshPlugins} variant="secondary">
          Recargar Plugins
        </Button>
        
        <p className="plugins-install-hint">
          Para instalar un plugin, colócalo en la carpeta de plugins y haz clic en "Recargar Plugins".
        </p>
      </div>
      
      {plugins.length === 0 ? (
        <div className="plugins-empty">
          <p>No hay plugins instalados.</p>
          <p className="plugins-empty-hint">
            Coloca plugins en la carpeta "plugins" y usa el botón "Recargar Plugins".
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
                  <span className="plugin-author">Autor: {plugin.author || 'No especificado'}</span>
                  {plugin.status === 'error' && (
                    <span className="plugin-status-error">Error: {plugin.error}</span>
                  )}
                </div>
              </div>
              <div className="plugin-actions">
                <Button 
                  onClick={() => handleViewDetails(plugin)}
                  variant="secondary"
                  size="small"
                >
                  Detalles
                </Button>
                <Button 
                  onClick={() => handleTogglePlugin(plugin.id, plugin.enabled)}
                  variant={plugin.enabled ? "secondary" : "primary"}
                  size="small"
                >
                  {plugin.enabled ? "Desactivar" : "Activar"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {selectedPlugin && (
        <PluginDetails 
          plugin={selectedPlugin}
          onClose={handleCloseDetails}
          onSavePermissions={handleSavePermissions}
        />
      )}
    </div>
  );
};

export default PluginsConfig;