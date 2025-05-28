import React, { useState, useEffect } from "react";
import Button from "../ui/button";
import Dialog from "../ui/dialog";
import pluginRepositoryManager from "../../core/plugins/plugin-repository-manager";
import pluginPackageManager from "../../core/plugins/plugin-package-manager";
import pluginManager from "../../core/plugins/plugin-manager";
import pluginUpdateManager from "../../core/plugins/plugin-update-manager";
import eventBus from "../../core/bus/event-bus";

/**
 * Componente para la tienda de plugins
 */
const PluginMarketplace = ({ onBack }) => {
  // Estado para plugins disponibles
  const [availablePlugins, setAvailablePlugins] = useState([]);
  // Estado para plugins instalados
  const [installedPlugins, setInstalledPlugins] = useState({});
  // Estado de carga
  const [loading, setLoading] = useState(true);
  // Estado de búsqueda
  const [searchQuery, setSearchQuery] = useState("");
  // Estado para filtro
  const [filterInstalled, setFilterInstalled] = useState(false);
  // Estado para ordenamiento
  const [sortOrder, setSortOrder] = useState("popular"); // 'popular', 'recent', 'name'
  // Estado para diálogo de detalles
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  // Plugin seleccionado para detalles
  const [selectedPlugin, setSelectedPlugin] = useState(null);
  // Estado para operación en progreso
  const [operationInProgress, setOperationInProgress] = useState({
    type: null, // 'install', 'update', 'uninstall'
    pluginId: null,
  });
  // Estado para error
  const [error, setError] = useState(null);
  // Estado para mostrar detalles de repositorios
  const [showRepositories, setShowRepositories] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    async function loadMarketplaceData() {
      try {
        setLoading(true);

        // Inicializar managers si no lo están
        if (!pluginRepositoryManager.initialized) {
          await pluginRepositoryManager.initialize();
        }

        if (!pluginPackageManager.initialized) {
          await pluginPackageManager.initialize();
        }

        if (!pluginUpdateManager.initialized) {
          await pluginUpdateManager.initialize();
        }

        // Obtener plugins instalados
        const installed = pluginPackageManager.getInstalledPlugins();
        setInstalledPlugins(installed);

        // Buscar plugins disponibles
        await searchPlugins("");
      } catch (error) {
        console.error("Error al cargar datos del marketplace:", error);
        setError("No se pudieron cargar los datos del marketplace");
      } finally {
        setLoading(false);
      }
    }

    loadMarketplaceData();

    // Suscribirse a eventos
    const unsubscribeInstalled = eventBus.subscribe(
      "pluginSystem.pluginInstalled",
      ({ pluginId }) => {
        setInstalledPlugins((prev) => ({ ...prev }));
        refreshPluginList();
      }
    );

    const unsubscribeUninstalled = eventBus.subscribe(
      "pluginSystem.pluginUninstalled",
      ({ pluginId }) => {
        setInstalledPlugins((prev) => {
          const newState = { ...prev };
          delete newState[pluginId];
          return newState;
        });
        refreshPluginList();
      }
    );

    const unsubscribeSync = eventBus.subscribe(
      "pluginSystem.repositorySyncCompleted",
      () => {
        refreshPluginList();
      }
    );

    return () => {
      unsubscribeInstalled();
      unsubscribeUninstalled();
      unsubscribeSync();
    };
  }, []);

  // Refrescar lista de plugins
  const refreshPluginList = async () => {
    try {
      await searchPlugins(searchQuery);
    } catch (error) {
      console.error("Error al refrescar lista de plugins:", error);
    }
  };

  // Buscar plugins
  const searchPlugins = async (query) => {
    try {
      setLoading(true);

      // Buscar en repositorios
      const results = await pluginRepositoryManager.searchPlugins(query);

      // Actualizar plugins disponibles
      setAvailablePlugins(results);
      setSearchQuery(query);
    } catch (error) {
      console.error("Error al buscar plugins:", error);
      setError("No se pudieron buscar plugins");
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambio en la búsqueda
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Buscar con debounce
    const handler = setTimeout(() => {
      searchPlugins(query);
    }, 300);

    return () => clearTimeout(handler);
  };

  // Instalar plugin
  const handleInstallPlugin = async (plugin) => {
    try {
      setError(null);
      setOperationInProgress({
        type: "install",
        pluginId: plugin.id,
      });

      // En una implementación real, se descargaría el paquete
      // Simulamos una descarga y un paquete

      // Obtener manifiesto desde el API del repositorio
      const repositoryId = plugin.repositoryId;
      const repository = pluginRepositoryManager.getRepository(repositoryId);

      if (!repository) {
        throw new Error(`Repositorio no encontrado: ${repositoryId}`);
      }

      // Simular descarga del paquete
      await simulateNetworkDelay();

      // Simular paquete
      const pluginPackage = {
        manifest: {
          id: plugin.id,
          name: plugin.name,
          version: plugin.version,
          author: plugin.author,
          description: plugin.description,
          minAppVersion: plugin.minAppVersion || "0.3.0",
          maxAppVersion: plugin.maxAppVersion || "1.0.0",
          dependencies: plugin.dependencies || [],
          conflicts: plugin.conflicts || [],
          permissions: plugin.permissions || ["storage", "events", "ui"],
          packagedAt: Date.now(),
          packagedBy: repository.name,
          checksums: {},
          signature: repository.official ? "simulation" : null,
        },
        files: {
          "index.js": {
            content: `export default {
              id: "${plugin.id}",
              name: "${plugin.name}",
              version: "${plugin.version}",
              author: "${plugin.author}",
              description: "${plugin.description}",
              minAppVersion: "${plugin.minAppVersion || "0.3.0"}",
              maxAppVersion: "${plugin.maxAppVersion || "1.0.0"}",
              dependencies: [],
              conflicts: [],
              permissions: ["storage", "events", "ui"],
              
              init: function(core) {
                console.log("Plugin ${plugin.name} inicializado");
                return true;
              },
              
              cleanup: function() {
                console.log("Plugin ${plugin.name} limpiado");
                return true;
              }
            }`,
            type: "application/javascript",
          },
          "README.md": {
            content: `# ${plugin.name}\n\n${plugin.description}\n\nAutor: ${plugin.author}\nVersión: ${plugin.version}`,
            type: "text/markdown",
          },
        },
      };

      // Instalar plugin
      await pluginPackageManager.installPlugin(pluginPackage);

      // Actualizar estado
      setOperationInProgress({
        type: null,
        pluginId: null,
      });

      // Cerrar diálogo si está abierto
      if (showDetailsDialog) {
        setShowDetailsDialog(false);
      }
    } catch (error) {
      console.error("Error al instalar plugin:", error);
      setError(`Error al instalar plugin: ${error.message}`);
      setOperationInProgress({
        type: null,
        pluginId: null,
      });
    }
  };

  // Actualizar plugin
  const handleUpdatePlugin = async (plugin) => {
    try {
      setError(null);
      setOperationInProgress({
        type: "update",
        pluginId: plugin.id,
      });

      // Actualizar mediante el gestor de actualizaciones
      await pluginUpdateManager.applyUpdate(plugin.id);

      // Actualizar estado
      setOperationInProgress({
        type: null,
        pluginId: null,
      });

      // Cerrar diálogo si está abierto
      if (showDetailsDialog) {
        setShowDetailsDialog(false);
      }
    } catch (error) {
      console.error("Error al actualizar plugin:", error);
      setError(`Error al actualizar plugin: ${error.message}`);
      setOperationInProgress({
        type: null,
        pluginId: null,
      });
    }
  };

  // Desinstalar plugin
  const handleUninstallPlugin = async (plugin) => {
    try {
      setError(null);
      setOperationInProgress({
        type: "uninstall",
        pluginId: plugin.id,
      });

      // Desinstalar plugin
      await pluginPackageManager.uninstallPlugin(plugin.id);

      // Actualizar estado
      setOperationInProgress({
        type: null,
        pluginId: null,
      });

      // Cerrar diálogo si está abierto
      if (showDetailsDialog) {
        setShowDetailsDialog(false);
      }
    } catch (error) {
      console.error("Error al desinstalar plugin:", error);
      setError(`Error al desinstalar plugin: ${error.message}`);
      setOperationInProgress({
        type: null,
        pluginId: null,
      });
    }
  };

  // Abrir diálogo de detalles
  const showPluginDetails = (plugin) => {
    setSelectedPlugin(plugin);
    setShowDetailsDialog(true);
  };

  // Verificar si un plugin está instalado
  const isPluginInstalled = (pluginId) => {
    return !!installedPlugins[pluginId];
  };

  // Verificar si hay actualización disponible
  const hasUpdate = (plugin) => {
    const installed = installedPlugins[plugin.id];
    if (!installed) return false;

    // Comparar versiones
    return compareVersions(plugin.version, installed.version) > 0;
  };

  // Comparar versiones semánticas
  const compareVersions = (v1, v2) => {
    const parts1 = v1.split(".").map(Number);
    const parts2 = v2.split(".").map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;

      if (p1 < p2) return -1;
      if (p1 > p2) return 1;
    }

    return 0;
  };

  // Simular retraso de red
  const simulateNetworkDelay = () => {
    return new Promise((resolve) => {
      setTimeout(resolve, Math.random() * 1000 + 500);
    });
  };

  // Filtrar y ordenar plugins
  const filterAndSortPlugins = () => {
    let filtered = [...availablePlugins];

    // Filtrar por instalados
    if (filterInstalled) {
      filtered = filtered.filter((plugin) => isPluginInstalled(plugin.id));
    }

    // Ordenar según criterio
    switch (sortOrder) {
      case "popular":
        filtered.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
        break;
      case "recent":
        filtered.sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0));
        break;
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }

    return filtered;
  };

  // Renderizar etiqueta de repositorio
  const renderRepositoryBadge = (plugin) => {
    const isOfficial = plugin.repositoryId === "atlas-official";

    return (
      <span
        className={`repository-badge ${isOfficial ? "official" : "community"}`}
        title={`Repositorio: ${plugin.repositoryName}`}
      >
        {isOfficial ? "Oficial" : "Comunidad"}
      </span>
    );
  };

  // Renderizar etiqueta de estado
  const renderStatusBadge = (plugin) => {
    const installed = isPluginInstalled(plugin.id);
    const update = installed && hasUpdate(plugin);

    if (update) {
      return (
        <span className="status-badge update">Actualización disponible</span>
      );
    }

    if (installed) {
      return <span className="status-badge installed">Instalado</span>;
    }

    return null;
  };

  // Renderizar botón de acción principal
  const renderActionButton = (plugin) => {
    const installed = isPluginInstalled(plugin.id);
    const update = installed && hasUpdate(plugin);
    const inProgress = operationInProgress.pluginId === plugin.id;
    const operation = operationInProgress.type;

    if (inProgress) {
      let text = "Procesando...";

      switch (operation) {
        case "install":
          text = "Instalando...";
          break;
        case "update":
          text = "Actualizando...";
          break;
        case "uninstall":
          text = "Desinstalando...";
          break;
      }

      return (
        <Button disabled={true} size="small">
          {text}
        </Button>
      );
    }

    if (update) {
      return (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            handleUpdatePlugin(plugin);
          }}
          variant="primary"
          size="small"
        >
          Actualizar
        </Button>
      );
    }

    if (installed) {
      return (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            handleUninstallPlugin(plugin);
          }}
          variant="danger"
          size="small"
        >
          Desinstalar
        </Button>
      );
    }

    return (
      <Button
        onClick={(e) => {
          e.stopPropagation();
          handleInstallPlugin(plugin);
        }}
        variant="primary"
        size="small"
      >
        Instalar
      </Button>
    );
  };

  const filteredPlugins = filterAndSortPlugins();

  return (
    <div className="plugin-marketplace">
      <div className="marketplace-header">
        <h2>Marketplace de Plugins</h2>
        <div className="marketplace-controls">
          <div className="search-container">
            <input
              type="text"
              className="search-input"
              placeholder="Buscar plugins..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>

          <div className="filter-controls">
            <label className="filter-label">
              <input
                type="checkbox"
                checked={filterInstalled}
                onChange={(e) => setFilterInstalled(e.target.checked)}
              />
              Solo instalados
            </label>

            <select
              className="sort-select"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="popular">Más populares</option>
              <option value="recent">Más recientes</option>
              <option value="name">Por nombre</option>
            </select>
          </div>

          <Button
            onClick={() => setShowRepositories(!showRepositories)}
            variant="text"
          >
            {showRepositories ? "Ocultar repositorios" : "Mostrar repositorios"}
          </Button>

          <Button onClick={onBack} variant="text">
            Volver
          </Button>
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

      {/* Información de repositorios */}
      {showRepositories && (
        <div className="repositories-info">
          <h3>Repositorios activos</h3>
          <div className="repositories-list-mini">
            {Object.values(
              pluginRepositoryManager.getEnabledRepositories()
            ).map((repo) => (
              <div key={repo.id} className="repository-item-mini">
                <div className="repository-item-header">
                  <span className="repository-name">{repo.name}</span>
                  {repo.official && (
                    <span className="repository-badge official">Oficial</span>
                  )}
                </div>
                <div className="repository-item-info">
                  <span className="repository-url">{repo.url}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="marketplace-loading">
          <p>Cargando plugins disponibles...</p>
        </div>
      ) : (
        <div className="plugins-grid">
          {filteredPlugins.length === 0 ? (
            <div className="plugins-empty">
              <p>No se encontraron plugins.</p>
            </div>
          ) : (
            filteredPlugins.map((plugin) => (
              <div
                key={plugin.id}
                className={`plugin-card ${
                  isPluginInstalled(plugin.id) ? "installed" : ""
                } ${hasUpdate(plugin) ? "has-update" : ""}`}
                onClick={() => showPluginDetails(plugin)}
              >
                <div className="plugin-card-header">
                  <h3 className="plugin-name">{plugin.name}</h3>
                  {renderRepositoryBadge(plugin)}
                </div>

                <p className="plugin-description">{plugin.description}</p>

                <div className="plugin-meta">
                  <span className="plugin-author">Por {plugin.author}</span>
                  <span className="plugin-version">v{plugin.version}</span>
                  {plugin.downloads && (
                    <span className="plugin-downloads">
                      {plugin.downloads} descargas
                    </span>
                  )}
                </div>

                <div className="plugin-footer">
                  {renderStatusBadge(plugin)}
                  {renderActionButton(plugin)}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Diálogo de detalles del plugin - CORREGIDO */}
      {showDetailsDialog && selectedPlugin && (
        <Dialog
          isOpen={true}
          onClose={() => setShowDetailsDialog(false)}
          title={selectedPlugin.name || "Detalles del Plugin"}
        >
          <div className="plugin-details">
            <div className="plugin-detail-header">
              <h3>{selectedPlugin.name}</h3>
              {renderRepositoryBadge(selectedPlugin)}
            </div>

            <div className="plugin-detail-version">
              <span className="plugin-author">Por {selectedPlugin.author}</span>
              <span className="plugin-version">
                Versión {selectedPlugin.version}
              </span>
            </div>

            <div className="plugin-detail-description">
              {selectedPlugin.description}
            </div>

            <div className="plugin-detail-meta">
              {selectedPlugin.downloads && (
                <div className="meta-item">
                  <span className="meta-label">Descargas:</span>
                  <span className="meta-value">{selectedPlugin.downloads}</span>
                </div>
              )}

              {selectedPlugin.rating && (
                <div className="meta-item">
                  <span className="meta-label">Valoración:</span>
                  <span className="meta-value">{selectedPlugin.rating}/5</span>
                </div>
              )}

              {selectedPlugin.lastUpdated && (
                <div className="meta-item">
                  <span className="meta-label">Última actualización:</span>
                  <span className="meta-value">
                    {new Date(selectedPlugin.lastUpdated).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {selectedPlugin.tags && selectedPlugin.tags.length > 0 && (
              <div className="plugin-tags">
                {selectedPlugin.tags.map((tag) => (
                  <span key={tag} className="plugin-tag">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="plugin-detail-compatibility">
              <h4>Compatibilidad</h4>
              <div className="compatibility-item">
                <span className="compatibility-label">
                  Versión mínima de Atlas:
                </span>
                <span className="compatibility-value">
                  {selectedPlugin.minAppVersion || "0.3.0"}
                </span>
              </div>
              <div className="compatibility-item">
                <span className="compatibility-label">
                  Versión máxima de Atlas:
                </span>
                <span className="compatibility-value">
                  {selectedPlugin.maxAppVersion || "1.0.0"}
                </span>
              </div>
            </div>

            <div className="plugin-detail-repository">
              <h4>Repositorio</h4>
              <div className="repository-info">
                <span className="repository-name">
                  {selectedPlugin.repositoryName}
                </span>
                <span className="repository-url">
                  {selectedPlugin.repositoryId}
                </span>
              </div>
            </div>

            <div className="plugin-detail-actions">
              {renderActionButton(selectedPlugin)}
              <Button
                onClick={() => setShowDetailsDialog(false)}
                variant="secondary"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};

export default PluginMarketplace;
