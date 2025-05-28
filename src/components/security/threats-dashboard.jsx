import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Button from "../ui/button";
import pluginSecurityManager from "../../core/plugins/plugin-security-manager";

/**
 * Componente para visualizar un dashboard simplificado de amenazas de seguridad
 * Puede ser usado de forma independiente o integrado en otros paneles
 */
const ThreatsDashboard = ({ onPluginClick, compact = false }) => {
  // Estados principales
  const [threatStats, setThreatStats] = useState({});
  const [recentThreats, setRecentThreats] = useState([]);
  const [threatsByType, setThreatsByType] = useState([]);
  const [threatsByTime, setThreatsByTime] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Cargar datos de amenazas
  useEffect(() => {
    const loadThreatsData = async () => {
      try {
        setLoading(true);

        // Obtener estadísticas de seguridad
        const securityStats = pluginSecurityManager.getSecurityStats();

        // Extraer estadísticas de amenazas
        const threatData = securityStats.detectedThreats || {};

        setThreatStats({
          total: threatData.total || 0,
          critical: threatData.bySeverity?.critical || 0,
          high: threatData.bySeverity?.high || 0,
          medium: threatData.bySeverity?.medium || 0,
          low: threatData.bySeverity?.low || 0,
        });

        // Obtener amenazas recientes
        setRecentThreats(threatData.recent || []);

        // Procesar amenazas por tipo
        if (threatData.byType) {
          const threatTypes = Object.entries(threatData.byType)
            .map(([type, count]) => ({
              type,
              count,
              percentage: threatData.total
                ? (count / threatData.total) * 100
                : 0,
            }))
            .sort((a, b) => b.count - a.count);

          setThreatsByType(threatTypes);
        }

        // Obtener datos históricos de amenazas (simulación para esta implementación)
        // En una implementación real, estos datos vendrían de plugin-security-audit
        const now = Date.now();
        const oneDayMs = 24 * 60 * 60 * 1000;

        const timeData = [
          {
            time: new Date(now - oneDayMs * 6).toLocaleDateString(),
            count: Math.floor(Math.random() * 5),
          },
          {
            time: new Date(now - oneDayMs * 5).toLocaleDateString(),
            count: Math.floor(Math.random() * 5),
          },
          {
            time: new Date(now - oneDayMs * 4).toLocaleDateString(),
            count: Math.floor(Math.random() * 5),
          },
          {
            time: new Date(now - oneDayMs * 3).toLocaleDateString(),
            count: Math.floor(Math.random() * 5),
          },
          {
            time: new Date(now - oneDayMs * 2).toLocaleDateString(),
            count: Math.floor(Math.random() * 5),
          },
          {
            time: new Date(now - oneDayMs).toLocaleDateString(),
            count: Math.floor(Math.random() * 5),
          },
          {
            time: new Date(now).toLocaleDateString(),
            count: threatData.recent?.length || Math.floor(Math.random() * 5),
          },
        ];

        setThreatsByTime(timeData);
      } catch (error) {
        console.error("Error al cargar datos de amenazas:", error);
      } finally {
        setLoading(false);
      }
    };

    loadThreatsData();
  }, [refreshKey]);

  // Calcular tendencia (simulada para esta implementación)
  const calculateTrend = () => {
    if (threatsByTime.length < 2) return 0;

    const latest = threatsByTime[threatsByTime.length - 1].count;
    const previous = threatsByTime[threatsByTime.length - 2].count;

    if (latest === previous) return 0;
    return latest > previous ? 1 : -1;
  };

  // Renderizar tendencia
  const renderTrend = (trend) => {
    if (trend === 0) {
      return <span className="summary-trend trend-neutral">Sin cambios</span>;
    } else if (trend > 0) {
      return <span className="summary-trend trend-up">↑ Aumento</span>;
    } else {
      return <span className="summary-trend trend-down">↓ Reducción</span>;
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

  // Refrescar datos
  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  // Versión compacta del dashboard
  if (compact) {
    return (
      <div className="threats-dashboard compact">
        <div className="dashboard-header">
          <h3>Resumen de Amenazas</h3>
          <Button variant="text" size="small" onClick={handleRefresh}>
            Refrescar
          </Button>
        </div>

        {loading ? (
          <div className="loading-indicator">Cargando datos de amenazas...</div>
        ) : (
          <>
            <div className="threats-summary compact">
              <div className="summary-card">
                <div className="summary-title">Total de Amenazas</div>
                <div className="summary-value">{threatStats.total}</div>
                {renderTrend(calculateTrend())}
              </div>

              <div className="summary-card">
                <div className="summary-title">Amenazas Críticas</div>
                <div className="summary-value">
                  {renderSeverityIndicator("critical")}
                  {threatStats.critical}
                </div>
              </div>

              <div className="summary-card">
                <div className="summary-title">Amenazas Altas</div>
                <div className="summary-value">
                  {renderSeverityIndicator("high")}
                  {threatStats.high}
                </div>
              </div>
            </div>

            {recentThreats.length > 0 && (
              <div className="recent-threats compact">
                <h4>Amenazas Recientes</h4>
                <div className="threats-list">
                  {recentThreats.slice(0, 3).map((threat, index) => (
                    <div key={index} className="threat-item compact">
                      <div className="threat-header">
                        <span className="threat-plugin">{threat.pluginId}</span>
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
                      </div>

                      {onPluginClick && (
                        <div className="threat-actions">
                          <Button
                            variant="text"
                            size="small"
                            onClick={() => onPluginClick(threat.pluginId)}
                          >
                            Ver Detalles
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // Versión completa del dashboard
  return (
    <div className="threats-dashboard">
      <div className="dashboard-header">
        <h3>Dashboard de Amenazas</h3>
        <Button variant="text" onClick={handleRefresh}>
          Refrescar
        </Button>
      </div>

      {loading ? (
        <div className="loading-indicator">Cargando datos de amenazas...</div>
      ) : (
        <>
          <div className="threats-summary">
            <div className="summary-card">
              <div className="summary-title">Total de Amenazas</div>
              <div className="summary-value">{threatStats.total}</div>
              {renderTrend(calculateTrend())}
            </div>

            <div className="summary-card">
              <div className="summary-title">Amenazas Críticas</div>
              <div className="summary-value">
                {renderSeverityIndicator("critical")}
                {threatStats.critical}
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-title">Amenazas Altas</div>
              <div className="summary-value">
                {renderSeverityIndicator("high")}
                {threatStats.high}
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-title">Amenazas Medias</div>
              <div className="summary-value">
                {renderSeverityIndicator("medium")}
                {threatStats.medium}
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-title">Amenazas Bajas</div>
              <div className="summary-value">
                {renderSeverityIndicator("low")}
                {threatStats.low}
              </div>
            </div>
          </div>

          <div className="threats-visualization">
            <div className="threats-by-type">
              <h4>Amenazas por Tipo</h4>
              {threatsByType.length > 0 ? (
                <div className="type-bars">
                  {threatsByType.map((item, index) => (
                    <div key={index} className="type-bar">
                      <div className="type-name">{item.type}</div>
                      <div className="bar-container">
                        <div
                          className="bar-value"
                          style={{
                            width: `${item.percentage}%`,
                            backgroundColor: item.type.includes("critical")
                              ? "#E53935"
                              : item.type.includes("unauthorized")
                              ? "#FF5722"
                              : item.type.includes("suspicious")
                              ? "#FFB300"
                              : "#2196F3",
                          }}
                        />
                      </div>
                      <div className="type-count">{item.count}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-data">No hay datos disponibles</div>
              )}
            </div>

            <div className="threats-by-time">
              <h4>Amenazas a lo Largo del Tiempo</h4>
              <div className="threat-time-chart">
                {/* Aquí se renderizaría un gráfico real */}
                <div className="chart-placeholder">
                  {threatsByTime.map((item, index) => (
                    <div key={index} className="time-point">
                      <div
                        className="time-bar"
                        style={{
                          height: `${item.count * 20}px`,
                          backgroundColor: "#2196F3",
                        }}
                      />
                      <div className="time-label">{item.time}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {recentThreats.length > 0 && (
            <div className="recent-threats">
              <h4>Amenazas Recientes</h4>
              <div className="threats-list">
                {recentThreats.map((threat, index) => (
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

                    {onPluginClick && (
                      <div className="threat-actions">
                        <Button
                          variant="text"
                          size="small"
                          onClick={() => onPluginClick(threat.pluginId)}
                        >
                          Ver Detalles del Plugin
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

ThreatsDashboard.propTypes = {
  onPluginClick: PropTypes.func,
  compact: PropTypes.bool,
};

export default ThreatsDashboard;
