import React, { useState, useEffect } from "react";
import Button from "../ui/button";
import Dialog from "../ui/dialog";
import pluginUpdateManager from "../../core/plugins/plugin-update-manager";
import pluginPackageManager from "../../core/plugins/plugin-package-manager";
import pluginManager from "../../core/plugins/plugin-manager";
import eventBus from "../../core/bus/event-bus";

/**
 * Componente para la gestión de actualizaciones de plugins
 */
const UpdateManager = ({ onBack }) => {
  // Estado para actualizaciones disponibles
  const [availableUpdates, setAvailableUpdates] = useState({});
  // Estado para historial de actualizaciones
  const [updateHistory, setUpdateHistory] = useState({});
  // Estado para configuración de actualizaciones
  const [updateSettings, setUpdateSettings] = useState({
    checkAutomatically: true,
    checkInterval: 86400000, // 24 horas
    autoUpdate: false,
    updateNotificationsEnabled: true,
  });
  // Estado para diálogo de configuración
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  // Estado para diálogo de confirmación
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  // Plugin seleccionado para actualizar
  const [selectedPlugin, setSelectedPlugin] = useState(null);
  // Estado para diálogo de detalles de historial
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  // Plugin seleccionado para historial
  const [selectedHistoryPlugin, setSelectedHistoryPlugin] = useState(null);
  // Estado de carga
  const [loading, setLoading] = useState(true);
  // Estado para error
  const [error, setError] = useState(null);
  // Estado para operación en progreso
  const [updating, setUpdating] = useState(false);
  // Estado para verificación en progreso
  const [checking, setChecking] = useState(false);
  // Estado para última verificación
  const [lastCheck, setLastCheck] = useState(null);

  // Cargar datos iniciales
  useEffect(() => {
    async function loadUpdateData() {
      try {
        setLoading(true);

        // Inicializar manager si no lo está
        if (!pluginUpdateManager.initialized) {
          await pluginUpdateManager.initialize();
        }

        // Obtener actualizaciones disponibles
        const updates = pluginUpdateManager.getAvailableUpdates();
        setAvailableUpdates(updates);

        // Obtener historial de actualizaciones
        const history = pluginUpdateManager.getUpdateHistory();
        setUpdateHistory(history);

        // Obtener configuración
        const settings = pluginUpdateManager.getUpdateSettings();
        setUpdateSettings(settings);

        // Obtener timestamp de última verificación
        setLastCheck(pluginUpdateManager.lastCheckTimestamp || null);
      } catch (error) {
        console.error("Error al cargar datos de actualizaciones:", error);
        setError("No se pudieron cargar los datos de actualizaciones");
      } finally {
        setLoading(false);
      }
    }

    loadUpdateData();

    // Suscribirse a eventos
    const unsubscribeUpdateAvailable = eventBus.subscribe(
      "pluginSystem.updateAvailable",
      ({ pluginId }) => {
        refreshUpdates();
      }
    );

    const unsubscribeUpdateCompleted = eventBus.subscribe(
      "pluginSystem.updateCompleted",
      () => {
        refreshUpdates();
      }
    );

    const unsubscribeCheckCompleted = eventBus.subscribe(
      "pluginSystem.updateCheckCompleted",
      ({ timestamp }) => {
        setChecking(false);
        setLastCheck(timestamp);
        refreshUpdates();
      }
    );

    const unsubscribeCheckStarted = eventBus.subscribe(
      "pluginSystem.updateCheckStarted",
      () => {
        setChecking(true);
      }
    );

    const unsubscribeError = eventBus.subscribe(
      "pluginSystem.updateError",
      ({ error }) => {
        setError(`Error: ${error}`);
        setUpdating(false);
        setChecking(false);
      }
    );

    const unsubscribeSettingsChanged = eventBus.subscribe(
      "pluginSystem.updateSettingsChanged",
      ({ settings }) => {
        setUpdateSettings(settings);
      }
    );

    return () => {
      unsubscribeUpdateAvailable();
      unsubscribeUpdateCompleted();
      unsubscribeCheckCompleted();
      unsubscribeCheckStarted();
      unsubscribeError();
      unsubscribeSettingsChanged();
    };
  }, []);

  // Refrescar actualizaciones
  const refreshUpdates = async () => {
    try {
      // Obtener actualizaciones disponibles
      const updates = pluginUpdateManager.getAvailableUpdates();
      setAvailableUpdates(updates);

      // Obtener historial de actualizaciones
      const history = pluginUpdateManager.getUpdateHistory();
      setUpdateHistory(history);
    } catch (error) {
      console.error("Error al refrescar actualizaciones:", error);
    }
  };

  // Verificar actualizaciones
  const handleCheckForUpdates = async () => {
    try {
      setError(null);
      setChecking(true);

      // Verificar actualizaciones
      await pluginUpdateManager.checkForUpdates({ fullCheck: true });
    } catch (error) {
      console.error("Error al verificar actualizaciones:", error);
      setError(`Error al verificar actualizaciones: ${error.message}`);
      setChecking(false);
    }
  };

  // Aplicar todas las actualizaciones
  const handleApplyAllUpdates = async () => {
    try {
      setError(null);
      setUpdating(true);

      // Aplicar todas las actualizaciones
      const results = await pluginUpdateManager.applyAllUpdates();

      // Verificar resultados
      if (results.failed.length > 0) {
        setError(
          `${results.failed.length} actualizaciones fallaron. Detalles en la consola.`
        );
      }

      setUpdating(false);
    } catch (error) {
      console.error("Error al aplicar actualizaciones:", error);
      setError(`Error al aplicar actualizaciones: ${error.message}`);
      setUpdating(false);
    }
  };

  // Aplicar actualización específica
  const handleApplyUpdate = async (pluginId) => {
    try {
      setError(null);
      setUpdating(true);

      // Aplicar actualización
      await pluginUpdateManager.applyUpdate(pluginId);

      // Cerrar diálogo si está abierto
      setShowConfirmDialog(false);
      setSelectedPlugin(null);

      setUpdating(false);
    } catch (error) {
      console.error(`Error al actualizar plugin ${pluginId}:`, error);
      setError(`Error al actualizar plugin: ${error.message}`);
      setUpdating(false);
    }
  };

  // Guardar configuración
  const handleSaveSettings = async () => {
    try {
      setError(null);

      // Guardar configuración
      await pluginUpdateManager.configureUpdateSettings(updateSettings);

      // Cerrar diálogo
      setShowSettingsDialog(false);
    } catch (error) {
      console.error("Error al guardar configuración:", error);
      setError(`Error al guardar configuración: ${error.message}`);
    }
  };

  // Confirmar actualización
  const confirmUpdate = (pluginId) => {
    setSelectedPlugin(pluginId);
    setShowConfirmDialog(true);
  };

  // Mostrar historial de un plugin
  const showPluginHistory = (pluginId) => {
    setSelectedHistoryPlugin(pluginId);
    setShowHistoryDialog(true);
  };

  // Formatear fecha
  const formatDate = (timestamp) => {
    if (!timestamp) return "Nunca";

    return new Date(timestamp).toLocaleString();
  };

  // Formatear intervalo
  const formatInterval = (ms) => {
    const hours = ms / (1000 * 60 * 60);

    if (hours === 24) return "Cada día";
    if (hours === 12) return "Cada 12 horas";
    if (hours === 6) return "Cada 6 horas";
    if (hours === 1) return "Cada hora";

    return `Cada ${hours} horas`;
  };

  // Renderizar
  return (
    <div className="update-manager">
      <div className="update-manager-header">
        <h2>Gestión de Actualizaciones</h2>
        <div className="update-actions">
          <Button
            onClick={handleCheckForUpdates}
            disabled={checking}
            variant="primary"
          >
            {checking ? "Verificando..." : "Verificar Actualizaciones"}
          </Button>

          <Button
            onClick={() => setShowSettingsDialog(true)}
            variant="secondary"
          >
            Configuración
          </Button>

          <Button onClick={onBack} variant="text">
            Volver
          </Button>
        </div>
      </div>

      <div className="update-status-bar">
        <div className="update-status-info">
          <span className="status-label">Última verificación:</span>
          <span className="status-value">{formatDate(lastCheck)}</span>
        </div>

        <div className="update-status-info">
          <span className="status-label">Verificación automática:</span>
          <span className="status-value">
            {updateSettings.checkAutomatically
              ? formatInterval(updateSettings.checkInterval)
              : "Desactivada"}
          </span>
        </div>

        <div className="update-status-info">
          <span className="status-label">Actualización automática:</span>
          <span className="status-value">
            {updateSettings.autoUpdate ? "Activada" : "Desactivada"}
          </span>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <Button onClick={() => setError(null)} variant="text" size="small">
            Cerrar
          </Button>
        </div>
      )}

      {loading ? (
        <div className="updates-loading">
          <p>Cargando datos de actualizaciones...</p>
        </div>
      ) : (
        <>
          <div className="updates-section">
            <div className="section-header">
              <h3>Actualizaciones Disponibles</h3>
              {Object.keys(availableUpdates).length > 0 && (
                <Button
                  onClick={handleApplyAllUpdates}
                  disabled={updating}
                  variant="primary"
                  size="small"
                >
                  {updating ? "Actualizando..." : "Actualizar Todo"}
                </Button>
              )}
            </div>

            <div className="updates-list">
              {Object.keys(availableUpdates).length === 0 ? (
                <p className="no-updates">
                  No hay actualizaciones disponibles.
                </p>
              ) : (
                Object.values(availableUpdates).map((update) => (
                  <div key={update.id} className="update-item">
                    <div className="update-info">
                      <div className="update-name">{update.id}</div>
                      <div className="update-versions">
                        <span className="current-version">
                          v{update.currentVersion}
                        </span>
                        <span className="version-arrow">→</span>
                        <span className="new-version">
                          v{update.newVersion}
                        </span>
                      </div>
                      <div className="update-detected">
                        Detectada: {formatDate(update.detectedAt)}
                      </div>
                    </div>

                    <div className="update-actions">
                      <Button
                        onClick={() => confirmUpdate(update.id)}
                        disabled={updating}
                        size="small"
                      >
                        {updating && selectedPlugin === update.id
                          ? "Actualizando..."
                          : "Actualizar"}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="updates-section">
            <div className="section-header">
              <h3>Historial de Actualizaciones</h3>
            </div>

            <div className="history-list">
              {Object.keys(updateHistory).length === 0 ? (
                <p className="no-history">
                  No hay historial de actualizaciones.
                </p>
              ) : (
                Object.entries(updateHistory).map(([pluginId, updates]) => (
                  <div key={pluginId} className="history-item">
                    <div className="history-info">
                      <div className="history-name">{pluginId}</div>
                      <div className="history-count">
                        {updates.length}{" "}
                        {updates.length === 1
                          ? "actualización"
                          : "actualizaciones"}
                      </div>
                      <div className="history-last-update">
                        Última: {formatDate(updates[0]?.appliedAt)}
                      </div>
                    </div>

                    <div className="history-actions">
                      <Button
                        onClick={() => showPluginHistory(pluginId)}
                        variant="text"
                        size="small"
                      >
                        Ver Detalles
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Diálogo de confirmación */}
      <Dialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        title="Confirmar Actualización"
      >
        <div className="confirm-update">
          <p>¿Estás seguro de que deseas actualizar este plugin?</p>
          <p className="warning-text">
            Se recomienda hacer una copia de seguridad antes de actualizar.
          </p>

          <div className="dialog-actions">
            <Button
              variant="secondary"
              onClick={() => setShowConfirmDialog(false)}
              disabled={updating}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={() => handleApplyUpdate(selectedPlugin)}
              disabled={updating}
            >
              {updating ? "Actualizando..." : "Actualizar"}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Diálogo de configuración */}
      <Dialog
        isOpen={showSettingsDialog}
        onClose={() => setShowSettingsDialog(false)}
        title="Configuración de Actualizaciones"
      >
        <div className="update-settings-form">
          <div className="form-field">
            <label htmlFor="check-auto">
              <input
                type="checkbox"
                id="check-auto"
                checked={updateSettings.checkAutomatically}
                onChange={(e) =>
                  setUpdateSettings({
                    ...updateSettings,
                    checkAutomatically: e.target.checked,
                  })
                }
              />
              Verificar actualizaciones automáticamente
            </label>
          </div>

          {updateSettings.checkAutomatically && (
            <div className="form-field">
              <label htmlFor="check-interval">Intervalo de verificación</label>
              <select
                id="check-interval"
                value={updateSettings.checkInterval}
                onChange={(e) =>
                  setUpdateSettings({
                    ...updateSettings,
                    checkInterval: Number(e.target.value),
                  })
                }
              >
                <option value={3600000}>Cada hora</option>
                <option value={21600000}>Cada 6 horas</option>
                <option value={43200000}>Cada 12 horas</option>
                <option value={86400000}>Cada día</option>
                <option value={604800000}>Cada semana</option>
              </select>
            </div>
          )}

          <div className="form-field">
            <label htmlFor="auto-update">
              <input
                type="checkbox"
                id="auto-update"
                checked={updateSettings.autoUpdate}
                onChange={(e) =>
                  setUpdateSettings({
                    ...updateSettings,
                    autoUpdate: e.target.checked,
                  })
                }
              />
              Aplicar actualizaciones automáticamente
            </label>
          </div>

          <div className="form-field">
            <label htmlFor="notifications">
              <input
                type="checkbox"
                id="notifications"
                checked={updateSettings.updateNotificationsEnabled}
                onChange={(e) =>
                  setUpdateSettings({
                    ...updateSettings,
                    updateNotificationsEnabled: e.target.checked,
                  })
                }
              />
              Mostrar notificaciones de actualizaciones
            </label>
          </div>

          <div className="dialog-actions">
            <Button
              variant="secondary"
              onClick={() => setShowSettingsDialog(false)}
            >
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSaveSettings}>
              Guardar
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Diálogo de historial */}
      <Dialog
        isOpen={showHistoryDialog}
        onClose={() => setShowHistoryDialog(false)}
        title={`Historial de Actualizaciones: ${selectedHistoryPlugin}`}
      >
        <div className="history-details">
          {selectedHistoryPlugin && updateHistory[selectedHistoryPlugin] && (
            <div className="history-entries">
              {updateHistory[selectedHistoryPlugin].map((entry, index) => (
                <div key={index} className="history-entry">
                  <div className="history-entry-header">
                    <span className="entry-date">
                      {formatDate(entry.appliedAt)}
                    </span>
                  </div>
                  <div className="history-entry-versions">
                    <span className="from-version">v{entry.fromVersion}</span>
                    <span className="version-arrow">→</span>
                    <span className="to-version">v{entry.toVersion}</span>
                  </div>
                  {entry.repositoryId && (
                    <div className="history-entry-repository">
                      Desde repositorio: {entry.repositoryId}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="dialog-actions">
            <Button
              variant="primary"
              onClick={() => setShowHistoryDialog(false)}
            >
              Cerrar
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default UpdateManager;
