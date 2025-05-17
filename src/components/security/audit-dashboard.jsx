import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Button from '../ui/button';
import pluginSecurityAudit from '../../core/plugins/plugin-security-audit';

/**
 * Componente para la visualización y gestión de registros de auditoría de seguridad
 * Puede ser usado de forma independiente o integrado en otros paneles
 */
const AuditDashboard = ({ onPluginClick, compact = false }) => {
  // Estados principales
  const [auditStats, setAuditStats] = useState({});
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditMode, setAuditMode] = useState('immediate');
  const [auditTypes, setAuditTypes] = useState([]);
  const [auditByType, setAuditByType] = useState({});
  const [auditByPlugin, setAuditByPlugin] = useState([]);
  const [auditByTime, setAuditByTime] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Estados para exportación
  const [isExporting, setIsExporting] = useState(false);

  // Cargar datos de auditoría
  useEffect(() => {
    const loadAuditData = async () => {
      try {
        setLoading(true);

        // Obtener estadísticas de auditoría
        const stats = pluginSecurityAudit.getAuditStats();
        setAuditStats(stats);
        
        // Configurar modo actual
        setAuditMode(stats.auditMode || 'immediate');
        
        // Obtener eventos recientes (últimos 50)
        const recentLogs = pluginSecurityAudit.getAuditLog({ limit: 50 });
        setAuditLogs(recentLogs);
        
        // Procesar tipos de auditoría
        const types = {};
        recentLogs.forEach(log => {
          if (!types[log.auditType]) {
            types[log.auditType] = 0;
          }
          types[log.auditType]++;
        });
        
        const typesList = Object.keys(types);
        setAuditTypes(typesList);
        
        // Procesar datos por tipo
        setAuditByType(types);
        
        // Procesar datos por plugin
        const pluginCounts = {};
        recentLogs.forEach(log => {
          if (log.pluginId) {
            if (!pluginCounts[log.pluginId]) {
              pluginCounts[log.pluginId] = 0;
            }
            pluginCounts[log.pluginId]++;
          }
        });
        
        const pluginList = Object.entries(pluginCounts)
          .map(([pluginId, count]) => ({ pluginId, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5); // Top 5
        
        setAuditByPlugin(pluginList);
        
        // Procesar datos por tiempo (simulado en esta implementación)
        // En una implementación real, estos datos vendrían de pluginSecurityAudit
        const now = Date.now();
        const oneDayMs = 24 * 60 * 60 * 1000;
        
        // Agrupar por día
        const timeData = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now - (oneDayMs * i));
          const day = date.toLocaleDateString();
          
          // Contar eventos para este día
          const count = recentLogs.filter(log => {
            const logDate = new Date(log.timestamp);
            return logDate.toLocaleDateString() === day;
          }).length;
          
          timeData.push({ time: day, count });
        }
        
        setAuditByTime(timeData);
      } catch (error) {
        console.error('Error al cargar datos de auditoría:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAuditData();
  }, [refreshKey]);

  // Cambiar modo de auditoría
  const handleToggleAuditMode = async () => {
    try {
      setLoading(true);
      const newMode = auditMode === 'immediate' ? 'batch' : 'immediate';
      const success = await pluginSecurityAudit.setAuditMode(newMode);
      
      if (success) {
        setAuditMode(newMode);
      }
    } catch (error) {
      console.error(`Error al cambiar modo de auditoría:`, error);
    } finally {
      setLoading(false);
    }
  };

  // Exportar datos de auditoría
  const handleExportAudit = async () => {
    try {
      setIsExporting(true);
      
      // Obtener datos completos de auditoría
      const auditData = pluginSecurityAudit.exportAuditData();
      
      if (!auditData) {
        throw new Error('No se pudieron obtener datos para exportar');
      }
      
      // Convertir a JSON para descargar
      const jsonData = JSON.stringify(auditData, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Crear enlace de descarga
      const a = document.createElement('a');
      a.href = url;
      a.download = `atlas-security-audit-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Limpiar
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('Error al exportar datos de auditoría:', error);
      alert(`Error al exportar: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Limpiar logs de auditoría
  const handleClearAuditLogs = async () => {
    try {
      const confirmed = window.confirm('¿Estás seguro de que deseas limpiar todos los logs de auditoría? Esta acción no se puede deshacer.');
      
      if (!confirmed) {
        return;
      }
      
      setLoading(true);
      const success = await pluginSecurityAudit.clearAllAuditLogs();
      
      if (success) {
        // Refrescar datos
        setRefreshKey(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error al limpiar logs de auditoría:', error);
      alert(`Error al limpiar logs: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Refrescar datos
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Versión compacta del panel de auditoría
  if (compact) {
    return (
      <div className="audit-dashboard compact">
        <div className="dashboard-header">
          <h3>Resumen de Auditoría</h3>
          <Button 
            variant="text" 
            size="small"
            onClick={handleRefresh}
          >
            Refrescar
          </Button>
        </div>
        
        {loading ? (
          <div className="loading-indicator">Cargando datos de auditoría...</div>
        ) : (
          <>
            <div className="audit-summary compact">
              <div className="summary-card">
                <div className="summary-title">Total de Eventos</div>
                <div className="summary-value">{auditStats.totalEntries || 0}</div>
              </div>
              
              <div className="summary-card">
                <div className="summary-title">Modo de Auditoría</div>
                <div className="summary-value">
                  {auditMode === 'immediate' ? 'Inmediato' : 'Por lotes'}
                </div>
              </div>
            </div>
            
            {auditLogs.length > 0 && (
              <div className="latest-entries compact">
                <h4>Últimos Eventos</h4>
                {auditLogs.slice(0, 3).map((log, index) => (
                  <div key={index} className="latest-entry">
                    <div className="entry-header">
                      <span className="entry-type">{log.auditType}</span>
                      <span className="entry-time">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="entry-details">
                      {log.pluginId ? (
                        <span>
                          Plugin: {log.pluginId} - Evento: {log.eventType}
                          {onPluginClick && (
                            <Button 
                              variant="text" 
                              size="small"
                              onClick={() => onPluginClick(log.pluginId)}
                            >
                              Ver
                            </Button>
                          )}
                        </span>
                      ) : (
                        <span>Evento del sistema: {log.eventType}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // Versión completa del panel de auditoría
  return (
    <div className="audit-dashboard">
      <div className="dashboard-header">
        <h3>Dashboard de Auditoría</h3>
        <Button 
          variant="text" 
          onClick={handleRefresh}
        >
          Refrescar
        </Button>
      </div>
      
      <div className="audit-controls">
        <div className="audit-mode-selector">
          <span className="audit-mode-label">Modo de Auditoría:</span>
          <label className="audit-mode-toggle">
            <input 
              type="checkbox" 
              checked={auditMode === 'immediate'}
              onChange={handleToggleAuditMode}
              disabled={loading}
            />
            <span className="toggle-slider"></span>
          </label>
          <span>{auditMode === 'immediate' ? 'Inmediato' : 'Por lotes'}</span>
        </div>
        
        <div className="audit-actions">
          <Button 
            variant="secondary" 
            onClick={handleClearAuditLogs}
            disabled={loading || isExporting}
          >
            Limpiar Logs
          </Button>
          <button 
            className="audit-export-button"
            onClick={handleExportAudit}
            disabled={loading || isExporting}
          >
            {isExporting ? 'Exportando...' : 'Exportar Datos'}
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="loading-indicator">Cargando datos de auditoría...</div>
      ) : (
        <>
          <div className="audit-summary">
            <div className="summary-card">
              <div className="summary-title">Total de Eventos</div>
              <div className="summary-value">{auditStats.totalEntries || 0}</div>
            </div>
            
            <div className="summary-card">
              <div className="summary-title">Plugins Monitoreados</div>
              <div className="summary-value">
                {auditByPlugin.length}
              </div>
            </div>
            
            <div className="summary-card">
              <div className="summary-title">Eventos de Seguridad</div>
              <div className="summary-value">
                {auditByType['securityEvent'] || 0}
              </div>
            </div>
            
            <div className="summary-card">
              <div className="summary-title">Cambios de Permisos</div>
              <div className="summary-value">
                {(auditByType['permissionChange'] || 0) + 
                 (auditByType['permissionRequest'] || 0)}
              </div>
            </div>
            
            <div className="summary-card">
              <div className="summary-title">Actividad Sospechosa</div>
              <div className="summary-value">
                {auditByType['suspiciousActivity'] || 0}
              </div>
            </div>
          </div>
          
          <div className="audit-chart-container">
            <div className="audit-chart">
              <div className="audit-chart-title">Eventos por Tipo</div>
              <div className="chart-content">
                {/* Representación simplificada de gráfico */}
                {Object.entries(auditByType).map(([type, count], index) => (
                  <div key={index} className="type-bar">
                    <div className="type-name">{type}</div>
                    <div className="bar-container">
                      <div 
                        className="bar-value"
                        style={{ 
                          width: `${(count / (auditStats.totalEntries || 1)) * 100}%`,
                          backgroundColor: type.includes('security') ? '#E53935' : 
                                        type.includes('permission') ? '#2196F3' : 
                                        type.includes('suspicious') ? '#FFB300' : '#4CAF50'
                        }}
                      />
                    </div>
                    <div className="type-count">{count}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="audit-chart">
              <div className="audit-chart-title">Eventos por Tiempo</div>
              <div className="chart-content">
                {/* Representación simplificada de gráfico */}
                <div className="chart-placeholder">
                  {auditByTime.map((item, index) => (
                    <div key={index} className="time-point">
                      <div 
                        className="time-bar" 
                        style={{ 
                          height: `${item.count * 10}px`,
                          backgroundColor: '#2196F3'
                        }}
                      />
                      <div className="time-label">{item.time}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="audit-latest">
            <div className="latest-header">
              <div className="latest-title">Últimos Eventos de Auditoría</div>
              {auditLogs.length > 10 && (
                <span className="view-all-link" onClick={() => alert('Ver todos los logs')}>
                  Ver todos
                </span>
              )}
            </div>
            
            <div className="latest-entries">
              {auditLogs.length > 0 ? (
                auditLogs.slice(0, 10).map((log, index) => (
                  <div key={index} className="latest-entry">
                    <div className="entry-header">
                      <span className="entry-type">{log.auditType}</span>
                      <span className="entry-time">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="entry-details">
                      {log.pluginId ? (
                        <span>
                          Plugin: <span className="audit-plugin-link" onClick={() => onPluginClick && onPluginClick(log.pluginId)}>
                            {log.pluginId}
                          </span> - Evento: {log.eventType}
                        </span>
                      ) : (
                        <span>Evento del sistema: {log.eventType}</span>
                      )}
                      
                      {log.details && typeof log.details === 'object' && (
                        <div className="entry-extra-details">
                          {Object.entries(log.details).slice(0, 3).map(([key, value], i) => {
                            // Mostrar solo campos simples
                            if (typeof value !== 'object') {
                              return (
                                <div key={i} className="detail-item">
                                  <strong>{key}:</strong> {String(value)}
                                </div>
                              );
                            }
                            return null;
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-entries">No hay eventos de auditoría registrados</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

AuditDashboard.propTypes = {
  onPluginClick: PropTypes.func,
  compact: PropTypes.bool
};

export default AuditDashboard;