// permissions-manager.jsx

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Button from '../ui/button';
import pluginPermissionChecker from '../../core/plugins/plugin-permission-checker';
import pluginManager from '../../core/plugins/plugin-manager';
import { PLUGIN_CONSTANTS } from '../../core/config/constants';

/**
 * Componente para la gestión y visualización de permisos de plugins
 * Puede ser usado de forma independiente o integrado en otros paneles
 */
const PermissionsManager = ({ onPluginClick, compact = false }) => {
  // Estados principales
  const [permissions, setPermissions] = useState([]);
  const [pendingPermissions, setPendingPermissions] = useState([]);
  const [permissionsByType, setPermissionsByType] = useState({});
  const [permissionTypes, setPermissionTypes] = useState({});
  const [activeTab, setActiveTab] = useState('pending');
  const [filterText, setFilterText] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Cargar datos de permisos
  useEffect(() => {
    const loadPermissionsData = async () => {
      try {
        setLoading(true);

        // Obtener todos los plugins
        const plugins = pluginManager.getAllPlugins();
        
        // Recopilar información de permisos
        const allPermissions = [];
        const pendingPerms = [];
        const byType = {};
        
        // Obtener definiciones de tipos de permisos
        const permTypes = PLUGIN_CONSTANTS.SECURITY.PERMISSION_TYPES || {};
        setPermissionTypes(permTypes);
        
        // Inicializar estructuras por tipo
        Object.keys(permTypes).forEach(type => {
          byType[type.toLowerCase()] = [];
        });
        
        // Procesar cada plugin
        plugins.forEach(plugin => {
          const permissionInfo = pluginPermissionChecker.getPluginPermissions(plugin.id);
          
          if (permissionInfo) {
            // Procesar permisos aprobados
            permissionInfo.approved.forEach(permission => {
              const permItem = {
                pluginId: plugin.id,
                permission,
                status: 'approved',
                type: permission
              };
              
              allPermissions.push(permItem);
              
              // Añadir a agrupación por tipo
              if (byType[permission]) {
                byType[permission].push(permItem);
              }
            });
            
            // Procesar permisos pendientes
            permissionInfo.pending.forEach(permission => {
              const permItem = {
                pluginId: plugin.id,
                permission,
                status: 'pending',
                type: permission
              };
              
              allPermissions.push(permItem);
              pendingPerms.push(permItem);
              
              // Añadir a agrupación por tipo
              if (byType[permission]) {
                byType[permission].push(permItem);
              }
            });
            
            // Procesar permisos rechazados
            permissionInfo.revoked?.forEach(permission => {
              const permItem = {
                pluginId: plugin.id,
                permission,
                status: 'rejected',
                type: permission
              };
              
              allPermissions.push(permItem);
              
              // Añadir a agrupación por tipo
              if (byType[permission]) {
                byType[permission].push(permItem);
              }
            });
          }
        });
        
        // Actualizar estados
        setPermissions(allPermissions);
        setPendingPermissions(pendingPerms);
        setPermissionsByType(byType);
      } catch (error) {
        console.error('Error al cargar datos de permisos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPermissionsData();
  }, [refreshKey]);

  // Filtrar permisos según criterio
  const filterPermissions = (perms) => {
    if (!filterText) return perms;
    
    return perms.filter(p => 
      p.pluginId.toLowerCase().includes(filterText.toLowerCase()) || 
      p.permission.toLowerCase().includes(filterText.toLowerCase())
    );
  };

  // Aprobar un permiso
  const handleApprovePermission = async (pluginId, permission) => {
    try {
      setLoading(true);
      const success = await pluginManager.approvePluginPermissions(pluginId, [permission]);
      
      if (success) {
        // Refrescar datos
        setRefreshKey(prev => prev + 1);
      }
    } catch (error) {
      console.error(`Error al aprobar permiso ${permission} para plugin ${pluginId}:`, error);
    } finally {
      setLoading(false);
    }
  };

  // Rechazar un permiso
  const handleRejectPermission = async (pluginId, permission) => {
    try {
      setLoading(true);
      const success = await pluginManager.rejectPluginPermissions(pluginId, [permission]);
      
      if (success) {
        // Refrescar datos
        setRefreshKey(prev => prev + 1);
      }
    } catch (error) {
      console.error(`Error al rechazar permiso ${permission} para plugin ${pluginId}:`, error);
    } finally {
      setLoading(false);
    }
  };

  // Revocar un permiso
  const handleRevokePermission = async (pluginId, permission) => {
    try {
      setLoading(true);
      const success = await pluginManager.revokePluginPermissions(pluginId, [permission]);
      
      if (success) {
        // Refrescar datos
        setRefreshKey(prev => prev + 1);
      }
    } catch (error) {
      console.error(`Error al revocar permiso ${permission} para plugin ${pluginId}:`, error);
    } finally {
      setLoading(false);
    }
  };

  // Determinar clase CSS para estado de permiso
  const getStatusClass = (status) => {
    switch (status) {
      case 'approved': return 'status-approved';
      case 'pending': return 'status-pending';
      case 'rejected': return 'status-rejected';
      default: return '';
    }
  };

  // Determinar clase CSS para nivel de riesgo
  const getRiskClass = (risk) => {
    switch (risk) {
      case 'critical': return 'risk-critical';
      case 'high': return 'risk-high';
      case 'medium': return 'risk-medium';
      case 'low': return 'risk-low';
      default: return '';
    }
  };

  // Refrescar datos
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Versión compacta del gestor de permisos
  if (compact) {
    return (
      <div className="permissions-manager compact">
        <div className="permissions-header">
          <h3>Permisos Pendientes</h3>
          <Button 
            variant="text" 
            size="small"
            onClick={handleRefresh}
          >
            Refrescar
          </Button>
        </div>
        
        {loading ? (
          <div className="loading-indicator">Cargando datos de permisos...</div>
        ) : pendingPermissions.length > 0 ? (
          <div className="permissions-pending-list">
            {pendingPermissions.slice(0, 3).map((perm, index) => (
              <div key={index} className="permission-row compact">
                <div className="permission-plugin">{perm.pluginId}</div>
                <div className="permission-scope">{perm.permission}</div>
                <div className="permission-actions">
                  <Button 
                    variant="primary" 
                    size="small"
                    onClick={() => handleApprovePermission(perm.pluginId, perm.permission)}
                  >
                    Aprobar
                  </Button>
                  <Button 
                    variant="danger" 
                    size="small"
                    onClick={() => handleRejectPermission(perm.pluginId, perm.permission)}
                  >
                    Rechazar
                  </Button>
                </div>
              </div>
            ))}
            
            {pendingPermissions.length > 3 && (
              <div className="more-permissions">
                <span>+{pendingPermissions.length - 3} permisos pendientes</span>
              </div>
            )}
          </div>
        ) : (
          <div className="permissions-empty">
            No hay permisos pendientes
          </div>
        )}
      </div>
    );
  }

  // Versión completa del gestor de permisos
  return (
    <div className="permissions-manager">
      <div className="permissions-header">
        <h3>Gestor de Permisos</h3>
        <Button 
          variant="text" 
          onClick={handleRefresh}
        >
          Refrescar
        </Button>
      </div>
      
      <div className="permissions-tabs">
        <div 
          className={`permissions-tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pendientes {pendingPermissions.length > 0 && `(${pendingPermissions.length})`}
        </div>
        <div 
          className={`permissions-tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          Todos los Permisos
        </div>
        <div 
          className={`permissions-tab ${activeTab === 'types' ? 'active' : ''}`}
          onClick={() => setActiveTab('types')}
        >
          Por Tipo
        </div>
      </div>
      
      {loading ? (
        <div className="loading-indicator">Cargando datos de permisos...</div>
      ) : (
        <div className="permissions-content">
          {activeTab === 'pending' && (
            <>
              {filterPermissions(pendingPermissions).length > 0 ? ( 
                <>
                  <div className="permissions-filter">
                    <input 
                      type="text" 
                      className="permissions-filter-input"
                      placeholder="Filtrar por plugin o permiso..."
                      value={filterText}
                      onChange={(e) => setFilterText(e.target.value)}
                    />
                  </div>
                  
                  <div className="permissions-grid">
                    <div>Plugin</div>
                    <div>Permiso</div>
                    <div>Acciones</div>
                  </div>
                  
                  <div className="permissions-list">
                    {filterPermissions(pendingPermissions).map((perm, index) => (
                      <div key={index} className="permission-row">
                        <div className="permission-plugin">
                          {perm.pluginId}
                          {onPluginClick && (
                            <Button 
                              variant="text" 
                              size="small"
                              onClick={() => onPluginClick(perm.pluginId)}
                            >
                              Ver
                            </Button>
                          )}
                        </div>
                        <div className="permission-scope">{perm.permission}</div>
                        <div className="permission-actions">
                          <Button 
                            variant="primary" 
                            size="small"
                            onClick={() => handleApprovePermission(perm.pluginId, perm.permission)}
                          >
                            Aprobar
                          </Button>
                          <Button 
                            variant="danger" 
                            size="small"
                            onClick={() => handleRejectPermission(perm.pluginId, perm.permission)}
                          >
                            Rechazar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="permissions-empty">
                  No hay permisos pendientes de aprobación
                </div>
              )}
            </>
          )}
          
          {activeTab === 'all' && (
            <>
              <div className="permissions-filter">
                <input 
                  type="text" 
                  className="permissions-filter-input"
                  placeholder="Filtrar por plugin o permiso..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                />
              </div>
              
              <div className="permissions-grid">
                <div>Plugin</div>
                <div>Permiso</div>
                <div>Estado</div>
              </div>
              
              <div className="permissions-list">
                {permissions.length > 0 ? (
                  filterPermissions(permissions).map((perm, index) => (
                    <div key={index} className="permission-row">
                      <div className="permission-plugin">
                        {perm.pluginId}
                        {onPluginClick && (
                          <Button 
                            variant="text" 
                            size="small"
                            onClick={() => onPluginClick(perm.pluginId)}
                          >
                            Ver
                          </Button>
                        )}
                      </div>
                      <div className="permission-scope">{perm.permission}</div>
                      <div className={`permission-status ${getStatusClass(perm.status)}`}>
                        {perm.status === 'approved' ? 'Aprobado' : 
                         perm.status === 'pending' ? 'Pendiente' : 'Rechazado'}
                         
                        {perm.status === 'approved' && (
                          <Button 
                            variant="text" 
                            size="small"
                            onClick={() => handleRevokePermission(perm.pluginId, perm.permission)}
                          >
                            Revocar
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="permissions-empty">
                    No hay permisos registrados
                  </div>
                )}
              </div>
            </>
          )}
          
          {activeTab === 'types' && (
            <div className="permissions-by-type">
              {Object.entries(permissionsByType).map(([type, perms]) => {
                // Skip empty types
                if (perms.length === 0) return null;
                
                // Get type info from permissionTypes
                const typeKey = Object.keys(permissionTypes).find(
                  key => key.toLowerCase() === type.toUpperCase()
                );
                
                const typeInfo = typeKey ? { 
                  name: permissionTypes[typeKey],
                  risk: typeKey.includes('CODE') ? 'critical' : 
                        typeKey.includes('DOM') ? 'high' : 
                        typeKey.includes('NETWORK') ? 'medium' : 'low'
                } : { 
                  name: type.charAt(0).toUpperCase() + type.slice(1), 
                  risk: 'medium' 
                };
                
                return (
                  <div key={type} className="type-card">
                    <div className="type-header">
                      <div className="type-title">{typeInfo.name}</div>
                      <div className={`risk-level ${getRiskClass(typeInfo.risk)}`}>
                        Riesgo: {typeInfo.risk.charAt(0).toUpperCase() + typeInfo.risk.slice(1)}
                      </div>
                    </div>
                    <div className="type-info">
                      {perms.length} {perms.length === 1 ? 'plugin solicita' : 'plugins solicitan'} este permiso
                    </div>
                    
                    <div className="permissions-list">
                      {filterPermissions(perms).map((perm, index) => (
                        <div key={index} className="permission-row">
                          <div className="permission-plugin">
                            {perm.pluginId}
                            {onPluginClick && (
                              <Button 
                                variant="text" 
                                size="small"
                                onClick={() => onPluginClick(perm.pluginId)}
                              >
                                Ver
                              </Button>
                            )}
                          </div>
                          <div className={`permission-status ${getStatusClass(perm.status)}`}>
                            {perm.status === 'approved' ? 'Aprobado' : 
                             perm.status === 'pending' ? 'Pendiente' : 'Rechazado'}
                          </div>
                          <div className="permission-actions">
                            {perm.status === 'pending' ? (
                              <>
                                <Button 
                                  variant="primary" 
                                  size="small"
                                  onClick={() => handleApprovePermission(perm.pluginId, perm.permission)}
                                >
                                  Aprobar
                                </Button>
                                <Button 
                                  variant="danger" 
                                  size="small"
                                  onClick={() => handleRejectPermission(perm.pluginId, perm.permission)}
                                >
                                  Rechazar
                                </Button>
                              </>
                            ) : perm.status === 'approved' ? (
                              <Button 
                                variant="danger" 
                                size="small"
                                onClick={() => handleRevokePermission(perm.pluginId, perm.permission)}
                              >
                                Revocar
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

PermissionsManager.propTypes = {
  onPluginClick: PropTypes.func,
  compact: PropTypes.bool
};

export default PermissionsManager;