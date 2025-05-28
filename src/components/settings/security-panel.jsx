import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Button from "../ui/button";
import Dialog from "../ui/dialog";
import pluginManager from "../../core/plugins/plugin-manager";
import pluginSecurityManager from "../../core/plugins/plugin-security-manager";
import pluginSecurityAudit from "../../core/plugins/plugin-security-audit";
import { PLUGIN_CONSTANTS } from "../../core/config/constants";

// Importar los nuevos componentes
import ThreatsDashboard from "../security/threats-dashboard";
import PermissionsManager from "../security/permissions-manager";
import AuditDashboard from "../security/audit-dashboard";

/**
 * Componente para la administración de seguridad de plugins
 */
const SecurityPanel = () => {
  // Estados principales
  const [securityStats, setSecurityStats] = useState({});
  const [securityLevel, setSecurityLevel] = useState(
    PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL
  );
  const [activeChecks, setActiveChecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Estados para diálogos
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [showThreatsDialog, setShowThreatsDialog] = useState(false);
  const [showPluginSecurityInfo, setShowPluginSecurityInfo] = useState(false);
  const [selectedPlugin, setSelectedPlugin] = useState(null);
  const [pendingPermissions, setPendingPermissions] = useState([]);
  const [threatsList, setThreatsList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [auditFilters, setAuditFilters] = useState({
    pluginId: "",
    auditType: "",
    limit: 50,
  });

  // Cargar datos al iniciar o cuando se necesite refrescar
  useEffect(() => {
    const loadSecurityData = async () => {
      try {
        setLoading(true);

        // Obtener estadísticas de seguridad
        const stats = pluginManager.getSecurityStats();
        setSecurityStats(stats);

        // Configurar nivel de seguridad actual
        setSecurityLevel(
          stats.securityLevel || PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL
        );

        // Configurar verificaciones activas
        setActiveChecks(stats.activeChecks || []);

        // Cargar solicitudes de permisos pendientes
        const pendingRequests = pluginManager.getPendingPermissionRequests();
        setPendingPermissions(pendingRequests);

        // Cargar lista de amenazas
        const threats = stats.threats?.recent || [];
        setThreatsList(threats);

        // Cargar logs de auditoría
        loadAuditLogs();
      } catch (error) {
        console.error("Error al cargar datos de seguridad:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSecurityData();
  }, [refreshKey]);

  // Cargar logs de auditoría con filtros
  const loadAuditLogs = async () => {
    try {
      const filters = { ...auditFilters };

      // Convertir límite a número
      if (filters.limit) {
        filters.limit = parseInt(filters.limit, 10);
      }

      // Eliminar filtros vacíos
      Object.keys(filters).forEach((key) => {
        if (!filters[key]) {
          delete filters[key];
        }
      });

      const logs = pluginSecurityAudit.getAuditLog(filters);
      setAuditLogs(logs);
    } catch (error) {
      console.error("Error al cargar logs de auditoría:", error);
    }
  };

  // Cambiar nivel de seguridad
  const handleSecurityLevelChange = async (level) => {
    try {
      setLoading(true);
      const success = await pluginManager.setSecurityLevel(level);

      if (success) {
        setSecurityLevel(level);
        // Refrescar datos
        setRefreshKey((prev) => prev + 1);
      }
    } catch (error) {
      console.error(`Error al cambiar nivel de seguridad a ${level}:`, error);
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambio en verificaciones de seguridad
  const handleToggleSecurityCheck = async (checkName) => {
    try {
      setLoading(true);

      // Determinar si está activado o desactivado
      const isActive = activeChecks.includes(checkName);

      // Actualizar localmente (optimistic update)
      if (isActive) {
        setActiveChecks((prev) => prev.filter((check) => check !== checkName));
      } else {
        setActiveChecks((prev) => [...prev, checkName]);
      }

      // Actualizar en sistema de seguridad
      const success = pluginSecurityManager.toggleSecurityCheck(
        checkName,
        !isActive
      );

      if (!success) {
        // Revertir cambio local si falló
        setActiveChecks(activeChecks);
      }
    } catch (error) {
      console.error(
        `Error al cambiar verificación de seguridad ${checkName}:`,
        error
      );
      // Revertir cambio local
      setActiveChecks(activeChecks);
    } finally {
      setLoading(false);
    }
  };

  // Mostrar información de seguridad de un plugin
  const showPluginSecurity = (pluginId) => {
    // Obtener información detallada del plugin
    const securityInfo = pluginManager.getPluginSecurityInfo(pluginId);

    setSelectedPlugin({
      id: pluginId,
      securityInfo,
    });

    setShowPluginSecurityInfo(true);
  };

  // Crear formato legible para tamaños en bytes
  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Manejar aprobación de permisos
  const handleApprovePermissions = async (pluginId, permissions) => {
    try {
      setLoading(true);
      const success = await pluginManager.approvePluginPermissions(
        pluginId,
        permissions
      );

      if (success) {
        // Refrescar datos
        setRefreshKey((prev) => prev + 1);
      }
    } catch (error) {
      console.error(
        `Error al aprobar permisos para plugin ${pluginId}:`,
        error
      );
    } finally {
      setLoading(false);
    }
  };

  // Manejar rechazo de permisos
  const handleRejectPermissions = async (pluginId, permissions) => {
    try {
      setLoading(true);
      const success = await pluginManager.rejectPluginPermissions(
        pluginId,
        permissions
      );

      if (success) {
        // Refrescar datos
        setRefreshKey((prev) => prev + 1);
      }
    } catch (error) {
      console.error(
        `Error al rechazar permisos para plugin ${pluginId}:`,
        error
      );
    } finally {
      setLoading(false);
    }
  };

  // Manejar añadir a lista negra
  const handleBlacklistPlugin = async (
    pluginId,
    reason = "Razones de seguridad"
  ) => {
    try {
      setLoading(true);
      const success = await pluginManager.blacklistPlugin(pluginId, reason);

      if (success) {
        // Refrescar datos
        setRefreshKey((prev) => prev + 1);
      }
    } catch (error) {
      console.error(
        `Error al poner en lista negra el plugin ${pluginId}:`,
        error
      );
    } finally {
      setLoading(false);
    }
  };

  // Manejar quitar de lista negra
  const handleWhitelistPlugin = async (pluginId) => {
    try {
      setLoading(true);
      const success = await pluginManager.whitelistPlugin(pluginId);

      if (success) {
        // Refrescar datos
        setRefreshKey((prev) => prev + 1);
      }
    } catch (error) {
      console.error(
        `Error al quitar de lista negra el plugin ${pluginId}:`,
        error
      );
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambio en filtros de auditoría
  const handleAuditFilterChange = (key, value) => {
    setAuditFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Manejar limpieza de logs de auditoría
  const handleClearAuditLogs = async () => {
    try {
      const confirmed = window.confirm(
        "¿Estás seguro de que deseas limpiar todos los logs de auditoría? Esta acción no se puede deshacer."
      );

      if (!confirmed) {
        return;
      }

      setLoading(true);
      const success = await pluginSecurityAudit.clearAllAuditLogs();

      if (success) {
        setAuditLogs([]);
      }
    } catch (error) {
      console.error("Error al limpiar logs de auditoría:", error);
    } finally {
      setLoading(false);
    }
  };

  // Renderizar indicador de severidad
  const renderSeverityIndicator = (severity) => {
    const severityColors = {
      critical: "#E53935", // Rojo
      high: "#FF5722", // Naranja
      medium: "#FFB300", // Amarillo
      low: "#4CAF50", // Verde
    };

    return (
      <span
        className="severity-indicator"
        style={{
          backgroundColor: severityColors[severity] || "#9E9E9E",
          display: "inline-block",
          width: "12px",
          height: "12px",
          borderRadius: "50%",
          marginRight: "5px",
        }}
      />
    );
  };

  // Renderizar la sección de configuración de seguridad
  const renderSecurityConfig = () => {
    return (
      <div className="security-config-section">
        <h3>Configuración de Seguridad</h3>

        <div className="security-level-selector">
          <h4>Nivel de Seguridad</h4>
          <div className="security-level-options">
            <label
              className={`security-level-option ${
                securityLevel === PLUGIN_CONSTANTS.SECURITY.LEVEL.LOW
                  ? "active"
                  : ""
              }`}
            >
              <input
                type="radio"
                name="securityLevel"
                value={PLUGIN_CONSTANTS.SECURITY.LEVEL.LOW}
                checked={securityLevel === PLUGIN_CONSTANTS.SECURITY.LEVEL.LOW}
                onChange={() =>
                  handleSecurityLevelChange(PLUGIN_CONSTANTS.SECURITY.LEVEL.LOW)
                }
                disabled={loading}
              />
              <span className="level-name">Bajo</span>
              <span className="level-description">
                Para desarrollo. Menos restricciones.
              </span>
            </label>

            <label
              className={`security-level-option ${
                securityLevel === PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL
                  ? "active"
                  : ""
              }`}
            >
              <input
                type="radio"
                name="securityLevel"
                value={PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL}
                checked={
                  securityLevel === PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL
                }
                onChange={() =>
                  handleSecurityLevelChange(
                    PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL
                  )
                }
                disabled={loading}
              />
              <span className="level-name">Normal</span>
              <span className="level-description">
                Equilibrio entre seguridad y funcionalidad.
              </span>
            </label>

            <label
              className={`security-level-option ${
                securityLevel === PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH
                  ? "active"
                  : ""
              }`}
            >
              <input
                type="radio"
                name="securityLevel"
                value={PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH}
                checked={securityLevel === PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH}
                onChange={() =>
                  handleSecurityLevelChange(
                    PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH
                  )
                }
                disabled={loading}
              />
              <span className="level-name">Alto</span>
              <span className="level-description">
                Máxima seguridad. Para entornos críticos.
              </span>
            </label>
          </div>
        </div>

        <div className="security-checks-section">
          <h4>Verificaciones de Seguridad Activas</h4>
          <div className="security-checks-list">
            <label className="security-check-item">
              <input
                type="checkbox"
                checked={activeChecks.includes("resourceUsage")}
                onChange={() => handleToggleSecurityCheck("resourceUsage")}
                disabled={loading}
              />
              <span>Monitoreo de Recursos</span>
              <span className="check-description">
                Controla uso de memoria, CPU y otras operaciones
              </span>
            </label>

            <label className="security-check-item">
              <input
                type="checkbox"
                checked={activeChecks.includes("apiAccess")}
                onChange={() => handleToggleSecurityCheck("apiAccess")}
                disabled={loading}
              />
              <span>Control de Acceso a APIs</span>
              <span className="check-description">
                Verifica permisos para acceder a APIs del sistema
              </span>
            </label>

            <label className="security-check-item">
              <input
                type="checkbox"
                checked={activeChecks.includes("storageUsage")}
                onChange={() => handleToggleSecurityCheck("storageUsage")}
                disabled={loading}
              />
              <span>Monitoreo de Almacenamiento</span>
              <span className="check-description">
                Controla uso y límites de almacenamiento persistente
              </span>
            </label>

            <label className="security-check-item">
              <input
                type="checkbox"
                checked={activeChecks.includes("domManipulation")}
                onChange={() => handleToggleSecurityCheck("domManipulation")}
                disabled={loading}
              />
              <span>Monitoreo de DOM</span>
              <span className="check-description">
                Detecta manipulaciones sospechosas del DOM
              </span>
            </label>

            <label className="security-check-item">
              <input
                type="checkbox"
                checked={activeChecks.includes("externalCommunication")}
                onChange={() =>
                  handleToggleSecurityCheck("externalCommunication")
                }
                disabled={loading}
              />
              <span>Control de Comunicación Externa</span>
              <span className="check-description">
                Monitorea y restringe peticiones a servicios externos
              </span>
            </label>

            <label className="security-check-item">
              <input
                type="checkbox"
                checked={activeChecks.includes("codeExecution")}
                onChange={() => handleToggleSecurityCheck("codeExecution")}
                disabled={loading}
              />
              <span>Control de Ejecución de Código</span>
              <span className="check-description">
                Previene ejecución de código potencialmente peligroso
              </span>
            </label>
          </div>
        </div>
      </div>
    );
  };

  // Renderizar diálogo de permisos pendientes
  const renderPermissionsDialog = () => {
    return (
      <Dialog
        isOpen={showPermissionsDialog}
        onClose={() => setShowPermissionsDialog(false)}
        title="Solicitudes de Permisos Pendientes"
      >
        {pendingPermissions.length === 0 ? (
          <p>No hay solicitudes de permisos pendientes.</p>
        ) : (
          <div className="permissions-list">
            {pendingPermissions.map((request, index) => (
              <div key={index} className="permission-request-item">
                <div className="request-header">
                  <span className="request-plugin">{request.pluginId}</span>
                  <span className="request-timestamp">
                    {new Date(request.timestamp).toLocaleString()}
                  </span>
                </div>

                <div className="requested-permissions">
                  <h4>Permisos Solicitados:</h4>
                  <ul className="permissions-items">
                    {request.permissions.map((permission, permIndex) => (
                      <li key={permIndex} className="permission-item">
                        <span className="permission-name">{permission}</span>
                        <span className="permission-description">
                          {PLUGIN_CONSTANTS.SECURITY.PERMISSION_TYPES[
                            permission.toUpperCase()
                          ] || "Permite acceso a funcionalidades específicas"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="request-actions">
                  <Button
                    variant="primary"
                    onClick={() =>
                      handleApprovePermissions(
                        request.pluginId,
                        request.permissions
                      )
                    }
                  >
                    Aprobar
                  </Button>

                  <Button
                    variant="danger"
                    onClick={() =>
                      handleRejectPermissions(
                        request.pluginId,
                        request.permissions
                      )
                    }
                  >
                    Rechazar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Dialog>
    );
  };

  // Renderizar diálogo de amenazas
  const renderThreatsDialog = () => {
    return (
      <Dialog
        isOpen={showThreatsDialog}
        onClose={() => setShowThreatsDialog(false)}
        title="Amenazas Detectadas"
      >
        {threatsList.length === 0 ? (
          <p>No hay amenazas detectadas.</p>
        ) : (
          <div className="threats-list">
            {threatsList.map((threat, index) => (
              <div key={index} className="threat-item">
                <div className="threat-header">
                  <span className="threat-plugin">{threat.pluginId}</span>
                  <span className="threat-time">
                    {new Date(threat.timestamp).toLocaleString()}
                  </span>
                  <span className={`threat-severity ${threat.severity}`}>
                    {renderSeverityIndicator(threat.severity)}
                    {threat.severity.charAt(0).toUpperCase() +
                      threat.severity.slice(1)}
                  </span>
                </div>

                <div className="threat-details">
                  <div className="threat-type">
                    <strong>Tipo:</strong> {threat.type}
                  </div>
                  <div className="threat-action">
                    <strong>Acción tomada:</strong> {threat.actionTaken}
                  </div>
                </div>

                <div className="threat-actions">
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => showPluginSecurity(threat.pluginId)}
                  >
                    Ver Detalles del Plugin
                  </Button>

                  {threat.actionTaken !== "blacklisted" && (
                    <Button
                      variant="danger"
                      size="small"
                      onClick={() =>
                        handleBlacklistPlugin(
                          threat.pluginId,
                          `Amenaza detectada: ${threat.type}`
                        )
                      }
                    >
                      Lista Negra
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Dialog>
    );
  };

  // Renderizar diálogo de detalles de seguridad de plugin
  const renderPluginSecurityInfoDialog = () => {
    if (!selectedPlugin || !selectedPlugin.securityInfo) {
      return null;
    }

    const { securityInfo } = selectedPlugin;

    return (
      <Dialog
        isOpen={showPluginSecurityInfo}
        onClose={() => setShowPluginSecurityInfo(false)}
        title={`Seguridad de Plugin: ${selectedPlugin.id}`}
      >
        <div className="plugin-security-info">
          <div className="security-score-section">
            <h4>Puntuación de Seguridad</h4>
            <div className="score-display">
              <div
                className="score-circle"
                style={{
                  background: `conic-gradient(
                  ${
                    securityInfo.securityScore > 70
                      ? "#4CAF50"
                      : securityInfo.securityScore > 40
                      ? "#FFB300"
                      : "#E53935"
                  } 
                  ${securityInfo.securityScore * 3.6}deg, 
                  #e0e0e0 ${securityInfo.securityScore * 3.6}deg 360deg
                )`,
                }}
              >
                <span className="score-number">
                  {securityInfo.securityScore}
                </span>
              </div>
              <div className="score-label">
                {securityInfo.securityScore > 70
                  ? "Bueno"
                  : securityInfo.securityScore > 40
                  ? "Medio"
                  : "Malo"}
              </div>
            </div>
          </div>

          <div className="security-status-section">
            <div className="status-item">
              <strong>Estado:</strong>
              {securityInfo.blacklisted ? (
                <span className="blacklisted-status">En Lista Negra</span>
              ) : (
                <span className="normal-status">Normal</span>
              )}
            </div>

            <div className="status-item">
              <strong>Advertencias:</strong>{" "}
              {securityInfo.warnings?.length || 0}
            </div>

            <div className="status-item">
              <strong>Errores de Sandbox:</strong>{" "}
              {securityInfo.sandboxErrors?.length || 0}
            </div>
          </div>

          {/* Sección de permisos */}
          <div className="permissions-section">
            <h4>Permisos</h4>

            {securityInfo.permissions?.approved?.length > 0 ? (
              <div className="approved-permissions">
                <h5>Permisos Aprobados</h5>
                <ul className="permissions-list">
                  {securityInfo.permissions.approved.map(
                    (permission, index) => (
                      <li key={index} className="permission-item">
                        {permission}
                      </li>
                    )
                  )}
                </ul>
              </div>
            ) : (
              <p>No hay permisos aprobados.</p>
            )}

            {securityInfo.permissions?.pending?.length > 0 && (
              <div className="pending-permissions">
                <h5>Permisos Pendientes</h5>
                <ul className="permissions-list">
                  {securityInfo.permissions.pending.map((permission, index) => (
                    <li key={index} className="permission-item">
                      {permission}
                      <div className="permission-actions">
                        <Button
                          variant="primary"
                          size="small"
                          onClick={() =>
                            handleApprovePermissions(selectedPlugin.id, [
                              permission,
                            ])
                          }
                        >
                          Aprobar
                        </Button>
                        <Button
                          variant="danger"
                          size="small"
                          onClick={() =>
                            handleRejectPermissions(selectedPlugin.id, [
                              permission,
                            ])
                          }
                        >
                          Rechazar
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sección de uso de recursos */}
          {securityInfo.resourceUsage && (
            <div className="resource-usage-section">
              <h4>Uso de Recursos</h4>

              <div className="resource-metrics">
                <div className="resource-metric">
                  <span className="metric-name">CPU:</span>
                  <span className="metric-value">
                    {securityInfo.resourceUsage.operationCounts?.cpuTime.toFixed(
                      2
                    ) || 0}{" "}
                    ms
                  </span>
                </div>

                <div className="resource-metric">
                  <span className="metric-name">Operaciones:</span>
                  <span className="metric-value">
                    {securityInfo.resourceUsage.operationCounts
                      ?.totalOperations || 0}
                  </span>
                </div>

                <div className="resource-metric">
                  <span className="metric-name">Almacenamiento:</span>
                  <span className="metric-value">
                    {formatBytes(
                      securityInfo.resourceUsage.resources?.storage || 0
                    )}
                  </span>
                </div>

                <div className="resource-metric">
                  <span className="metric-name">Llamadas API:</span>
                  <span className="metric-value">
                    {securityInfo.resourceUsage.operationCounts?.apiCalls || 0}
                  </span>
                </div>
              </div>

              {securityInfo.resourceUsage.violations?.length > 0 && (
                <div className="resource-violations">
                  <h5>Violaciones de Recursos</h5>
                  <ul className="violations-list">
                    {securityInfo.resourceUsage.violations
                      .slice(0, 5)
                      .map((violation, index) => (
                        <li key={index} className="violation-item">
                          <span className="violation-time">
                            {new Date(violation.timestamp).toLocaleString()}
                          </span>
                          <span className="violation-details">
                            {violation.violations.map((v) => v.type).join(", ")}
                          </span>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Sección de historial de auditoría */}
          {securityInfo.auditHistory &&
            securityInfo.auditHistory.length > 0 && (
              <div className="audit-history-section">
                <h4>Historial de Auditoría</h4>
                <div className="audit-entries">
                  {securityInfo.auditHistory
                    .slice(0, 10)
                    .map((entry, index) => (
                      <div key={index} className="audit-entry">
                        <span className="audit-time">
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                        <span className="audit-type">{entry.auditType}</span>
                        <span className="audit-event">{entry.eventType}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

          {/* Sección de acciones */}
          <div className="plugin-security-actions">
            {!securityInfo.blacklisted ? (
              <Button
                variant="danger"
                onClick={() => {
                  handleBlacklistPlugin(selectedPlugin.id);
                  setShowPluginSecurityInfo(false);
                }}
              >
                Añadir a Lista Negra
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={() => {
                  handleWhitelistPlugin(selectedPlugin.id);
                  setShowPluginSecurityInfo(false);
                }}
              >
                Quitar de Lista Negra
              </Button>
            )}

            <Button
              variant="secondary"
              onClick={() => {
                pluginManager.deactivatePlugin(selectedPlugin.id, true);
                setRefreshKey((prev) => prev + 1);
                setShowPluginSecurityInfo(false);
              }}
            >
              Desactivar Plugin
            </Button>
          </div>
        </div>
      </Dialog>
    );
  };

  // Renderizar diálogo de logs de auditoría
  const renderAuditLogsDialog = () => {
    return (
      <Dialog
        isOpen={showAuditLogs}
        onClose={() => setShowAuditLogs(false)}
        title="Registro de Auditoría de Seguridad"
      >
        <div className="audit-logs-container">
          <div className="audit-filter-section">
            <h4>Filtros</h4>
            <div className="audit-filters">
              <div className="filter-item">
                <label>Plugin:</label>
                <input
                  type="text"
                  value={auditFilters.pluginId}
                  onChange={(e) =>
                    handleAuditFilterChange("pluginId", e.target.value)
                  }
                  placeholder="ID del Plugin"
                />
              </div>

              <div className="filter-item">
                <label>Tipo:</label>
                <select
                  value={auditFilters.auditType}
                  onChange={(e) =>
                    handleAuditFilterChange("auditType", e.target.value)
                  }
                >
                  <option value="">Todos</option>
                  <option value="securityEvent">Eventos de Seguridad</option>
                  <option value="permissionChange">Cambios de Permisos</option>
                  <option value="validation">Validaciones</option>
                  <option value="suspiciousActivity">
                    Actividad Sospechosa
                  </option>
                  <option value="resourceOveruse">Uso Excesivo</option>
                  <option value="blacklistAction">Lista Negra</option>
                  <option value="pluginActivation">Activación</option>
                  <option value="pluginDeactivation">Desactivación</option>
                </select>
              </div>

              <div className="filter-item">
                <label>Límite:</label>
                <select
                  value={auditFilters.limit}
                  onChange={(e) =>
                    handleAuditFilterChange("limit", e.target.value)
                  }
                >
                  <option value="50">50</option>
                  <option value="100">100</option>
                  <option value="200">200</option>
                  <option value="500">500</option>
                </select>
              </div>

              <div className="filter-actions">
                <Button variant="primary" size="small" onClick={loadAuditLogs}>
                  Aplicar Filtros
                </Button>

                <Button
                  variant="danger"
                  size="small"
                  onClick={handleClearAuditLogs}
                >
                  Limpiar Logs
                </Button>
              </div>
            </div>
          </div>

          <div className="audit-logs-section">
            {auditLogs.length === 0 ? (
              <p>
                No hay registros de auditoría que coincidan con los filtros.
              </p>
            ) : (
              <div className="audit-logs-list">
                {auditLogs.map((log, index) => (
                  <div key={index} className="audit-log-item">
                    <div className="log-header">
                      <span className="log-time">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                      <span className="log-plugin">
                        {log.pluginId || "Sistema"}
                      </span>
                      <span className="log-type">{log.auditType}</span>
                    </div>

                    <div className="log-event">
                      <span className="event-type">{log.eventType}</span>
                      <div className="event-details">
                        {log.details &&
                          typeof log.details === "object" &&
                          Object.entries(log.details).map(([key, value], i) => {
                            // Mostrar solo campos simples
                            if (typeof value !== "object") {
                              return (
                                <div key={i} className="detail-item">
                                  <strong>{key}:</strong> {String(value)}
                                </div>
                              );
                            }
                            return null;
                          })}
                      </div>
                    </div>

                    {log.pluginId && (
                      <div className="log-actions">
                        <Button
                          variant="text"
                          size="small"
                          onClick={() => showPluginSecurity(log.pluginId)}
                        >
                          Ver Plugin
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Dialog>
    );
  };

  // Render principal
  return (
    <div className="security-panel">
      <h2 className="security-panel-title">Seguridad de Plugins</h2>

      {loading ? (
        <div className="security-loading">
          <p>Cargando información de seguridad...</p>
        </div>
      ) : securityStats.securityEnabled === false ? (
        <div className="security-disabled">
          <h3>Sistema de Seguridad Desactivado</h3>
          <p>El sistema de seguridad para plugins no está activado.</p>
        </div>
      ) : (
        <div className="security-content">
          {renderSecurityConfig()}

          {/* Dashboard de amenazas */}
          <ThreatsDashboard onPluginClick={showPluginSecurity} />

          {/* Gestor de permisos */}
          <PermissionsManager onPluginClick={showPluginSecurity} />

          {/* Dashboard de auditoría */}
          <AuditDashboard onPluginClick={showPluginSecurity} />
        </div>
      )}

      {/* Diálogos */}
      {renderPermissionsDialog()}
      {renderThreatsDialog()}
      {renderPluginSecurityInfoDialog()}
      {renderAuditLogsDialog()}
    </div>
  );
};

SecurityPanel.propTypes = {
  // No props required
};

export default SecurityPanel;
