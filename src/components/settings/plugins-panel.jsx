import React, { useState, useEffect } from 'react';
import Button from '../ui/button';
import Dialog from '../ui/dialog';
import pluginManager from '../../core/plugins/plugin-manager';
import pluginErrorHandler from '../../core/plugins/plugin-error-handler';
import pluginStorage from '../../core/plugins/plugin-storage';
import pluginCompatibility from '../../core/plugins/plugin-compatibility';
import pluginDependencyResolver from '../../core/plugins/plugin-dependency-resolver';
import pluginPackageManager from '../../core/plugins/plugin-package-manager';
import pluginUpdateManager from '../../core/plugins/plugin-update-manager';
import RepositoryManager from './repository-manager';
import UpdateManager from './update-manager';
import PluginMarketplace from './plugin-marketplace';

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
  // Estado de la aplicación (activo, error, etc)
  const [systemStatus, setSystemStatus] = useState({});
  // Errores de plugins
  const [pluginErrors, setPluginErrors] = useState({});
  // Vista de errores
  const [showErrors, setShowErrors] = useState(false);
  // Vista de conflictos y ciclos
  const [showIssues, setShowIssues] = useState(false);
  // Lista de ciclos
  const [cycles, setCycles] = useState([]);
  // Estado para el diálogo de dependencias
  const [showDependenciesDialog, setShowDependenciesDialog] = useState(false);
  // Plugin seleccionado para dependencias
  const [dependenciesPlugin, setDependenciesPlugin] = useState(null);
  // Mostrar información de APIs
  const [showAPIs, setShowAPIs] = useState(false);
  // Mostrar información de canales
  const [showChannels, setShowChannels] = useState(false);
  // Vista actual
  const [currentView, setCurrentView] = useState('main'); // 'main', 'repository', 'update', 'marketplace'
  // Mostrar actualizaciones disponibles
  const [availableUpdates, setAvailableUpdates] = useState({});

  // Cargar plugins al iniciar
  useEffect(() => {
    async function loadPluginSystem() {
      try {
        setLoading(true);
        
        // Inicializar el sistema de plugins si aún no lo está
        if (!pluginManager.initialized) {
          await pluginManager.initialize();
        }
        
        // Inicializar gestores de distribución y actualizaciones
        if (!pluginPackageManager.initialized) {
          await pluginPackageManager.initialize();
        }
        
        if (!pluginUpdateManager.initialized) {
          await pluginUpdateManager.initialize();
        }
        
        // Obtener lista de plugins
        const allPlugins = pluginManager.getAllPlugins();
        setPlugins(allPlugins);
        
        // Obtener estado del sistema
        const status = pluginManager.getStatus();
        setSystemStatus(status);
        
        // Obtener errores
        const errors = pluginErrorHandler.getErrorLog();
        
        // Agrupar errores por plugin
        const errorsByPlugin = errors.reduce((acc, error) => {
          if (!acc[error.pluginId]) {
            acc[error.pluginId] = [];
          }
          acc[error.pluginId].push(error);
          return acc;
        }, {});
        
        setPluginErrors(errorsByPlugin);
        
        // Obtener ciclos de dependencias
        const dependencyCycles = pluginDependencyResolver.getDetectedCycles();
        setCycles(dependencyCycles);
        
        // Obtener actualizaciones disponibles
        const updates = pluginUpdateManager.getAvailableUpdates();
        setAvailableUpdates(updates);
        
      } catch (error) {
        console.error('Error al cargar plugins:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadPluginSystem();
    
    // Suscribirse a eventos del sistema de plugins
    const unsubscribeError = pluginManager.subscribe('error', (error) => {
      console.error('Error en sistema de plugins:', error);
      setRefreshKey(prev => prev + 1);
    });
    
    // Suscribirse a eventos de compatibilidad
    const unsubscribeCompat = pluginManager.subscribe('compatibilityError', (data) => {
      console.error('Error de compatibilidad:', data);
      setRefreshKey(prev => prev + 1);
    });
    
    // Suscribirse a eventos de ciclos
    const unsubscribeCycles = pluginManager.subscribe('cyclesDetected', (data) => {
      setCycles(data.cycles || []);
    });
    
    // Suscribirse a eventos de actualización
    const unsubscribeUpdateAvailable = pluginUpdateManager.subscribe('updateAvailable', (data) => {
      setAvailableUpdates(prev => ({...prev, [data.pluginId]: data}));
    });
    
    // Suscribirse a eventos de instalación
    const unsubscribeInstalled = pluginManager.subscribe('pluginInstalled', () => {
      setRefreshKey(prev => prev + 1);
    });
    
    // Suscribirse a eventos de desinstalación
    const unsubscribeUninstalled = pluginManager.subscribe('pluginUninstalled', () => {
      setRefreshKey(prev => prev + 1);
    });
    
    return () => {
      unsubscribeError && unsubscribeError();
      unsubscribeCompat && unsubscribeCompat();
      unsubscribeCycles && unsubscribeCycles();
      unsubscribeUpdateAvailable && unsubscribeUpdateAvailable();
      unsubscribeInstalled && unsubscribeInstalled();
      unsubscribeUninstalled && unsubscribeUninstalled();
    };
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

  // Función para mostrar dependencias de un plugin
  const showDependencies = (plugin) => {
    setDependenciesPlugin(plugin);
    setShowDependenciesDialog(true);
  };

  // Función para cerrar el diálogo de dependencias
  const closeDependenciesDialog = () => {
    setShowDependenciesDialog(false);
    setDependenciesPlugin(null);
  };

  // Función para limpiar todos los errores
  const clearAllErrors = () => {
    pluginErrorHandler.clearErrorLog();
    setPluginErrors({});
  };

  // Función para limpiar datos de almacenamiento de un plugin
  const clearPluginStorage = async (pluginId) => {
    if (!pluginId) return;
    
    try {
      setLoading(true);
      await pluginStorage.clearPluginData(pluginId);
      alert(`Datos de almacenamiento del plugin ${pluginId} eliminados correctamente.`);
    } catch (error) {
      console.error(`Error al limpiar almacenamiento del plugin ${pluginId}:`, error);
    } finally {
      setLoading(false);
    }
  };

  // Función para forzar la desactivación de un plugin
  const forceDeactivatePlugin = async (pluginId) => {
    if (!pluginId) return;
    
    try {
      setLoading(true);
      await pluginManager.deactivatePlugin(pluginId, true);
      alert(`Plugin ${pluginId} desactivado forzosamente`);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error(`Error al desactivar forzosamente el plugin ${pluginId}:`, error);
    } finally {
      setLoading(false);
    }
  };

  // Función para verificar actualizaciones
  const checkForUpdates = async () => {
    try {
      setLoading(true);
      await pluginUpdateManager.checkForUpdates();
      const updates = pluginUpdateManager.getAvailableUpdates();
      setAvailableUpdates(updates);
    } catch (error) {
      console.error('Error al verificar actualizaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función para desinstalar un plugin
  const uninstallPlugin = async (pluginId) => {
    try {
      if (!confirm(`¿Estás seguro de que deseas desinstalar el plugin ${pluginId}?`)) {
        return;
      }
      
      setLoading(true);
      await pluginPackageManager.uninstallPlugin(pluginId);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error(`Error al desinstalar plugin ${pluginId}:`, error);
    } finally {
      setLoading(false);
    }
  };

  // Renderizar etiqueta de compatibilidad
  const renderCompatibilityBadge = (plugin) => {
    const isCompatible = plugin.compatible !== false;
    
    if (isCompatible) {
      return <span className="plugin-badge plugin-badge-compatible">Compatible</span>;
    } else {
      return (
        <span 
          className="plugin-badge plugin-badge-incompatible" 
          title={plugin.incompatibilityReason || "Plugin incompatible"}
        >
          Incompatible
        </span>
      );
    }
  };

  // Renderizar sección de ciclos de dependencias
  const renderCycles = () => {
    if (cycles.length === 0) {
      return <p>No se detectaron ciclos en las dependencias.</p>;
    }
    
    return (
      <div className="dependency-cycles">
        <h4>Ciclos de dependencias detectados</h4>
        <div className="cycles-list">
          {cycles.map((cycle, index) => (
            <div key={index} className="cycle-item">
              <div className="cycle-path">
                {cycle.nodes.join(' → ')} → {cycle.source}
              </div>
            </div>
          ))}
        </div>
        <p className="cycles-explanation">
          Los ciclos de dependencias pueden causar problemas durante la activación de plugins. 
          Se recomienda revisar las dependencias para eliminar ciclos.
        </p>
      </div>
    );
  };

  // Renderizar información de APIs públicas
  const renderAPIsInfo = () => {
    const apiInfo = pluginManager.getPluginAPIsInfo();
    
    return (
      <div className="plugins-apis-info">
        <div className="apis-header">
          <h4>APIs Públicas Disponibles</h4>
          <Button 
            variant="text" 
            size="small"
            onClick={() => setShowAPIs(!showAPIs)}
          >
            {showAPIs ? 'Ocultar APIs' : 'Ver APIs'}
          </Button>
        </div>
        
        {showAPIs && (
          <div className="apis-content">
            {Object.keys(apiInfo).length > 0 ? (
              <div className="apis-list">
                {Object.entries(apiInfo).map(([pluginId, api]) => (
                  <div key={pluginId} className="api-item">
                    <div className="api-header">
                      <strong>{pluginId}</strong>
                      <span className="api-methods-count">{api.methods.length} métodos</span>
                    </div>
                    <div className="api-methods">
                      {api.methods.map(method => (
                        <span key={method} className="api-method">{method}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No hay APIs públicas registradas</p>
            )}
          </div>
        )}
      </div>
    );
  };

  // Renderizar información de canales de comunicación
  const renderChannelsInfo = () => {
    const channelsInfo = pluginManager.getChannelsInfo();
    
    return (
      <div className="plugins-channels-info">
        <div className="channels-header">
          <h4>Canales de Comunicación</h4>
          <Button 
            variant="text" 
            size="small"
            onClick={() => setShowChannels(!showChannels)}
          >
            {showChannels ? 'Ocultar Canales' : 'Ver Canales'}
          </Button>
        </div>
        
        {showChannels && (
          <div className="channels-content">
            {Object.keys(channelsInfo).length > 0 ? (
              <div className="channels-list">
                {Object.entries(channelsInfo).map(([channelName, channel]) => (
                  <div key={channelName} className="channel-item">
                    <div className="channel-header">
                      <strong>{channelName}</strong>
                      <span className="channel-subscribers">{channel.subscribers.length} suscriptores</span>
                    </div>
                    <div className="channel-info">
                      <span className="channel-creator">Creado por: {channel.creator}</span>
                      <span className="channel-messages">{channel.messagesCount} mensajes</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No hay canales de comunicación activos</p>
            )}
          </div>
        )}
      </div>
    );
  };

  // Renderizar sección de actualizaciones
  const renderUpdatesSection = () => {
    const updateCount = Object.keys(availableUpdates).length;
    
    if (updateCount === 0) {
      return null;
    }
    
    return (
      <div className="updates-available-section">
        <div className="updates-header">
          <h4>Actualizaciones Disponibles</h4>
          <div className="updates-actions">
            <Button 
              variant="primary" 
              size="small"
              onClick={() => setCurrentView('update')}
            >
              Ver Actualizaciones
            </Button>
          </div>
        </div>
        
        <div className="updates-summary">
          <p>
            Hay {updateCount} {updateCount === 1 ? 'actualización disponible' : 'actualizaciones disponibles'}.
            Ve al gestor de actualizaciones para aplicarlas.
          </p>
        </div>
      </div>
    );
  };

  // Renderizar vista principal de plugins
  const renderMainView = () => {
    return (
      <>
        <div className="plugins-panel-header">
          <h2 className="plugins-panel-title">Plugins</h2>
          <div className="plugins-header-actions">
            <Button 
              onClick={() => setCurrentView('marketplace')}
              variant="primary"
            >
              Marketplace
            </Button>
            <Button 
              onClick={() => setCurrentView('repository')}
              variant="secondary"
            >
              Repositorios
            </Button>
            <Button 
              onClick={() => setCurrentView('update')}
              variant="secondary"
            >
              Actualizaciones{Object.keys(availableUpdates).length > 0 && (
                <span className="updates-badge">{Object.keys(availableUpdates).length}</span>
              )}
            </Button>
            <Button 
              onClick={handleReloadPlugins}
              disabled={loading}
            >
              Recargar Plugins
            </Button>
            <Button 
              onClick={checkForUpdates}
              disabled={loading}
            >
              Verificar Actualizaciones
            </Button>
          </div>
        </div>
        
        <div className="plugins-system-status">
          <div className="status-indicator">
            <span className={`status-dot ${systemStatus.initialized ? 'active' : 'inactive'}`}></span>
            <span className="status-text">
              Sistema de plugins {systemStatus.initialized ? 'inicializado' : 'no inicializado'}
            </span>
          </div>
          
          <div className="status-summary">
            <div className="status-item">
              <span className="status-label">Total:</span>
              <span className="status-value">{systemStatus.totalPlugins || 0}</span>
            </div>
            <div className="status-item">
              <span className="status-label">Activos:</span>
              <span className="status-value">{systemStatus.activePlugins || 0}</span>
            </div>
            <div className="status-item">
              <span className="status-label">Compatibles:</span>
              <span className="status-value">{systemStatus.compatiblePlugins || 0}</span>
            </div>
            {systemStatus.apiCount > 0 && (
              <div className="status-item">
                <span className="status-label">APIs:</span>
                <span className="status-value">{systemStatus.apiCount}</span>
              </div>
            )}
            {systemStatus.activeChannels > 0 && (
              <div className="status-item">
                <span className="status-label">Canales:</span>
                <span className="status-value">{systemStatus.activeChannels}</span>
              </div>
            )}
          </div>
          
          {Object.keys(pluginErrors).length > 0 && (
            <div className="plugins-error-indicator">
              <span className="error-count">{Object.keys(pluginErrors).length} plugins con errores</span>
              <Button 
                variant="text" 
                size="small"
                onClick={() => setShowErrors(!showErrors)}
              >
                {showErrors ? 'Ocultar errores' : 'Ver errores'}
              </Button>
            </div>
          )}
          
          {cycles.length > 0 && (
            <div className="plugins-issue-indicator">
              <span className="issue-count">{cycles.length} ciclos de dependencias</span>
              <Button 
                variant="text" 
                size="small"
                onClick={() => setShowIssues(!showIssues)}
              >
                {showIssues ? 'Ocultar problemas' : 'Ver problemas'}
              </Button>
            </div>
          )}
        </div>
        
        {/* Sección de actualizaciones disponibles */}
        {renderUpdatesSection()}
        
        {showErrors && Object.keys(pluginErrors).length > 0 && (
          <div className="plugins-error-summary">
            <div className="error-summary-header">
              <h3>Errores detectados</h3>
              <Button 
                variant="text" 
                size="small"
                onClick={clearAllErrors}
              >
                Limpiar todos
              </Button>
            </div>
            
            <div className="error-list">
              {Object.entries(pluginErrors).map(([pluginId, errors]) => (
                <div key={pluginId} className="plugin-error-item">
                  <div className="plugin-error-header">
                    <strong>{pluginId}</strong>
                    <span className="error-count">{errors.length} errores</span>
                  </div>
                  <div className="plugin-error-message">
                    {errors[0].message}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {showIssues && (
          <div className="plugins-issues-summary">
            <div className="issues-summary-header">
              <h3>Problemas detectados</h3>
            </div>
            {renderCycles()}
          </div>
        )}
        
        {/* Información de APIs y Canales */}
        {systemStatus.apiCount > 0 && renderAPIsInfo()}
        {systemStatus.activeChannels > 0 && renderChannelsInfo()}
        
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
                  Los plugins deben instalarse en la carpeta <code>plugins/</code> de la aplicación.
                  Cada plugin debe estar en su propia carpeta con un archivo <code>index.js</code>.
                </p>
                <div className="marketplace-cta">
                  <p>Puedes instalar plugins desde el marketplace:</p>
                  <Button 
                    onClick={() => setCurrentView('marketplace')}
                    variant="primary"
                  >
                    Ir al Marketplace
                  </Button>
                </div>
              </div>
            ) : (
              plugins.map(plugin => {
                const isActive = pluginManager.isPluginActive(plugin.id);
                const hasErrors = !!pluginErrors[plugin.id];
                const isCompatible = plugin.compatible !== false;
                const hasUpdate = !!availableUpdates[plugin.id];
                
                return (
                  <div 
                    key={plugin.id} 
                    className={`plugin-item ${isActive ? 'active' : 'inactive'} ${hasErrors ? 'has-errors' : ''} ${!isCompatible ? 'incompatible' : ''} ${hasUpdate ? 'has-update' : ''}`}
                  >
                    <div className="plugin-info">
                      <h3 className="plugin-name">{plugin.name}</h3>
                      <p className="plugin-description">{plugin.description}</p>
                      <div className="plugin-meta">
                        <span className="plugin-version">v{plugin.version}</span>
                        <span className="plugin-author">por {plugin.author}</span>
                        {renderCompatibilityBadge(plugin)}
                        {hasErrors && (
                          <span className="plugin-error-badge">Error</span>
                        )}
                        {plugin.dependencies && plugin.dependencies.length > 0 && (
                          <span className="plugin-badge plugin-badge-dependencies">
                            {plugin.dependencies.length} dependencias
                          </span>
                        )}
                        {hasUpdate && (
                          <span className="plugin-badge plugin-badge-update">
                            Actualización disponible
                          </span>
                        )}
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
                      
                      {plugin.dependencies && plugin.dependencies.length > 0 && (
                        <Button
                          onClick={() => showDependencies(plugin)}
                          variant="text"
                          size="small"
                        >
                          Dependencias
                        </Button>
                      )}
                      
                      {hasUpdate && (
                        <Button
                          onClick={() => setCurrentView('update')}
                          variant="primary"
                          size="small"
                        >
                          Actualizar
                        </Button>
                      )}
                      
                      <Button 
                        onClick={() => togglePluginState(plugin.id, isActive)}
                        variant={isActive ? 'danger' : 'primary'}
                        size="small"
                        disabled={loading || (!isActive && !isCompatible)}
                        title={!isActive && !isCompatible ? plugin.incompatibilityReason : ''}
                      >
                        {isActive ? 'Desactivar' : 'Activar'}
                      </Button>
                      
                      <Button 
                        onClick={() => uninstallPlugin(plugin.id)}
                        variant="text"
                        size="small"
                        disabled={loading || isActive}
                        title={isActive ? 'Desactiva el plugin antes de desinstalarlo' : ''}
                      >
                        Desinstalar
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
              
              <div className="plugin-detail-item">
                <strong>Compatibilidad:</strong>{" "}
                {selectedPlugin.compatible !== false ? (
                  <span className="compatibility-status compatible">Compatible</span>
                ) : (
                  <span className="compatibility-status incompatible" title={selectedPlugin.incompatibilityReason}>
                    Incompatible: {selectedPlugin.incompatibilityReason}
                  </span>
                )}
              </div>
              
              {/* Estado de instalación */}
              <div className="plugin-detail-item">
                <strong>Instalación:</strong>{" "}
                {pluginPackageManager.isPluginInstalled(selectedPlugin.id) ? (
                  <div className="installation-info">
                    <span className="installation-status installed">Instalado</span>
                    {availableUpdates[selectedPlugin.id] && (
                      <span className="update-status">
                        Actualización disponible: v{availableUpdates[selectedPlugin.id].newVersion}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="installation-status not-installed">No instalado por el sistema de paquetes</span>
                )}
              </div>
              
              {/* Información de la API pública si existe */}
              {pluginManager.isPluginActive(selectedPlugin.id) && (
                <div className="plugin-detail-item">
                  <strong>API Pública:</strong>
                  {(() => {
                    const apiInfo = pluginManager.getPluginAPIsInfo()[selectedPlugin.id];
                    if (!apiInfo) {
                      return <span>No expone API pública</span>;
                    }
                    
                    return (
                      <div className="plugin-api-info">
                        <div className="plugin-api-methods">
                          {apiInfo.methods.map(method => (
                            <div key={method} className="plugin-api-method">
                              {method}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
              
              {selectedPlugin.dependencies && selectedPlugin.dependencies.length > 0 && (
                <div className="plugin-detail-item">
                  <strong>Dependencias:</strong>
                  <ul className="dependencies-list">
                    {selectedPlugin.dependencies.map((dependency, index) => {
                      const depId = typeof dependency === 'string' ? dependency : dependency.id;
                      const depVersion = typeof dependency === 'string' ? 'cualquier versión' : dependency.version;
                      
                      const depPlugin = plugins.find(p => p.id === depId);
                      const isDepActive = depPlugin && pluginManager.isPluginActive(depId);
                      
                      return (
                        <li key={index} className={`dependency-item ${isDepActive ? 'active' : 'inactive'}`}>
                          {depId} (v{depVersion}) - {depPlugin ? `${isDepActive ? 'Activo' : 'Inactivo'}` : 'No encontrado'}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              
              {selectedPlugin.conflicts && selectedPlugin.conflicts.length > 0 && (
                <div className="plugin-detail-item">
                  <strong>Conflictos:</strong>
                  <ul className="conflicts-list">
                    {selectedPlugin.conflicts.map((conflict, index) => {
                      const conflictId = typeof conflict === 'string' ? conflict : conflict.id;
                      const conflictReason = typeof conflict === 'string' ? 'Conflicto declarado' : conflict.reason;
                      
                      const conflictPlugin = plugins.find(p => p.id === conflictId);
                      const isConflictActive = conflictPlugin && pluginManager.isPluginActive(conflictId);
                      
                      return (
                        <li key={index} className={`conflict-item ${isConflictActive ? 'active' : 'inactive'}`}>
                          {conflictId} - {conflictReason} ({conflictPlugin ? `${isConflictActive ? 'Activo' : 'Inactivo'}` : 'No encontrado'})
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              
              {pluginErrors[selectedPlugin.id] && (
                <div className="plugin-detail-errors">
                  <h4>Errores del plugin</h4>
                  <ul className="error-list">
                    {pluginErrors[selectedPlugin.id].map((error, index) => (
                      <li key={index} className="error-item">
                        <div className="error-operation">{error.operation}</div>
                        <div className="error-message">{error.message}</div>
                        <div className="error-timestamp">
                          {new Date(error.timestamp).toLocaleString()}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="plugin-detail-actions">
                <Button 
                  variant="secondary" 
                  onClick={() => clearPluginStorage(selectedPlugin.id)}
                >
                  Limpiar almacenamiento
                </Button>
                {pluginManager.isPluginActive(selectedPlugin.id) && (
                  <Button 
                    variant="danger" 
                    onClick={() => forceDeactivatePlugin(selectedPlugin.id)}
                  >
                    Desactivar forzosamente
                  </Button>
                )}
                
                {availableUpdates[selectedPlugin.id] && (
                  <Button 
                    variant="primary" 
                    onClick={() => {
                      setCurrentView('update');
                      closePluginDetails();
                    }}
                  >
                    Ver Actualización
                  </Button>
                )}
              </div>
            </div>
          </Dialog>
        )}
        
        {showDependenciesDialog && dependenciesPlugin && (
          <Dialog
            isOpen={showDependenciesDialog}
            onClose={closeDependenciesDialog}
            title={`Dependencias: ${dependenciesPlugin.name}`}
          >
            <div className="dependencies-graph">
              <h4>Árbol de dependencias</h4>
              
              <div className="dependencies-tree">
                {dependenciesPlugin.dependencies && dependenciesPlugin.dependencies.length > 0 ? (
                  <ul className="dependencies-tree-list">
                    {dependenciesPlugin.dependencies.map((dependency, index) => {
                      const depId = typeof dependency === 'string' ? dependency : dependency.id;
                      const depPlugin = plugins.find(p => p.id === depId);
                      const isDepActive = depPlugin && pluginManager.isPluginActive(depId);
                      
                      return (
                        <li key={index} className={`dependency-tree-item ${isDepActive ? 'active' : 'inactive'}`}>
                          <div className="dependency-node">
                            <span className="dependency-name">{depId}</span>
                            <span className={`dependency-status ${isDepActive ? 'active' : 'inactive'}`}>
                              {depPlugin ? (isDepActive ? 'Activo' : 'Inactivo') : 'No encontrado'}
                            </span>
                          </div>
                          
                          {/* Dependencias anidadas */}
                          {depPlugin && depPlugin.dependencies && depPlugin.dependencies.length > 0 && (
                            <ul className="nested-dependencies">
                              {depPlugin.dependencies.map((nestedDep, nestedIndex) => {
                                const nestedDepId = typeof nestedDep === 'string' ? nestedDep : nestedDep.id;
                                const nestedDepPlugin = plugins.find(p => p.id === nestedDepId);
                                const isNestedDepActive = nestedDepPlugin && pluginManager.isPluginActive(nestedDepId);
                                
                                return (
                                  <li key={nestedIndex} className={`nested-dependency-item ${isNestedDepActive ? 'active' : 'inactive'}`}>
                                    <div className="dependency-node">
                                      <span className="dependency-name">{nestedDepId}</span>
                                      <span className={`dependency-status ${isNestedDepActive ? 'active' : 'inactive'}`}>
                                        {nestedDepPlugin ? (isNestedDepActive ? 'Activo' : 'Inactivo') : 'No encontrado'}
                                      </span>
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p>Este plugin no tiene dependencias declaradas.</p>
                )}
              </div>
              
              <h4>Plugins que dependen de {dependenciesPlugin.name}</h4>
              <div className="reverse-dependencies">
                {(() => {
                  const reverseDeps = plugins.filter(p => 
                    p.dependencies && 
                    p.dependencies.some(dep => {
                      const depId = typeof dep === 'string' ? dep : dep.id;
                      return depId === dependenciesPlugin.id;
                    })
                  );
                  
                  if (reverseDeps.length === 0) {
                    return <p>Ningún plugin depende de este.</p>;
                  }
                  
                  return (
                    <ul className="reverse-dependencies-list">
                      {reverseDeps.map((plugin, index) => {
                        const isActive = pluginManager.isPluginActive(plugin.id);
                        
                        return (
                          <li key={index} className={`reverse-dependency-item ${isActive ? 'active' : 'inactive'}`}>
                            <span className="reverse-dependency-name">{plugin.name}</span>
                            <span className={`reverse-dependency-status ${isActive ? 'active' : 'inactive'}`}>
                              {isActive ? 'Activo' : 'Inactivo'}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  );
                })()}
              </div>
            </div>
          </Dialog>
        )}
      </>
    );
  };

  // Renderizar contenido según la vista actual
  const renderContent = () => {
    switch (currentView) {
      case 'repository':
        return <RepositoryManager onBack={() => setCurrentView('main')} />;
      case 'update':
        return <UpdateManager onBack={() => setCurrentView('main')} />;
      case 'marketplace':
        return <PluginMarketplace onBack={() => setCurrentView('main')} />;
      case 'main':
      default:
        return renderMainView();
    }
  };

  return (
    <div className="plugins-panel">
      {renderContent()}
    </div>
  );
};

export default PluginsPanel;