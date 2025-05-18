import React, { useState, useEffect } from 'react';
import Button from '../ui/button';
import Dialog from '../ui/dialog';
import pluginRepositoryManager from '../../core/plugins/plugin-repository-manager';
import pluginPackageManager from '../../core/plugins/plugin-package-manager';
import eventBus from '../../core/bus/event-bus';

/**
 * Componente para la gestión de repositorios de plugins
 */
const RepositoryManager = ({ onBack }) => {
  // Estado para los repositorios
  const [repositories, setRepositories] = useState({});
  // Estado para el diálogo de añadir repositorio
  const [showAddDialog, setShowAddDialog] = useState(false);
  // Estado para el diálogo de editar repositorio
  const [showEditDialog, setShowEditDialog] = useState(false);
  // Estado para el repositorio seleccionado
  const [selectedRepository, setSelectedRepository] = useState(null);
  // Estado para el diálogo de confirmar eliminación
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  // Estado de carga
  const [loading, setLoading] = useState(true);
  // Estado de sincronización
  const [syncing, setSyncing] = useState(null);
  // Estado de nuevo repositorio
  const [newRepository, setNewRepository] = useState({
    id: '',
    name: '',
    url: '',
    apiEndpoint: '',
    description: ''
  });
  // Estado para el formulario de edición
  const [editForm, setEditForm] = useState({
    name: '',
    url: '',
    apiEndpoint: '',
    description: ''
  });
  // Estado para errores
  const [error, setError] = useState(null);

  // Cargar repositorios al iniciar
  useEffect(() => {
    async function loadRepositories() {
      try {
        setLoading(true);
        
        // Inicializar el gestor si aún no lo está
        if (!pluginRepositoryManager.initialized) {
          await pluginRepositoryManager.initialize();
        }
        
        // Obtener repositorios
        const repos = pluginRepositoryManager.getRepositories();
        setRepositories(repos);
        
      } catch (error) {
        console.error('Error al cargar repositorios:', error);
        setError('No se pudieron cargar los repositorios');
      } finally {
        setLoading(false);
      }
    }
    
    loadRepositories();
    
    // Suscribirse a eventos
    const unsubscribeAdded = eventBus.subscribe('pluginSystem.repositoryAdded', ({ repositoryId }) => {
      setRepositories(prev => ({ ...prev }));
    });
    
    const unsubscribeUpdated = eventBus.subscribe('pluginSystem.repositoryUpdated', ({ repositoryId }) => {
      setRepositories(prev => ({ ...prev }));
    });
    
    const unsubscribeRemoved = eventBus.subscribe('pluginSystem.repositoryRemoved', ({ repositoryId }) => {
      setRepositories(prev => {
        const newRepos = { ...prev };
        delete newRepos[repositoryId];
        return newRepos;
      });
    });
    
    const unsubscribeToggled = eventBus.subscribe('pluginSystem.repositoryToggled', ({ repositoryId, enabled }) => {
      setRepositories(prev => ({ ...prev }));
    });
    
    const unsubscribeSyncStarted = eventBus.subscribe('pluginSystem.repositorySyncStarted', ({ repositoryId }) => {
      setSyncing(repositoryId);
    });
    
    const unsubscribeSyncCompleted = eventBus.subscribe('pluginSystem.repositorySyncCompleted', ({ repositoryId }) => {
      setSyncing(null);
      setRepositories(prev => ({ ...prev }));
    });
    
    const unsubscribeError = eventBus.subscribe('pluginSystem.repositoryError', ({ repository, error }) => {
      setSyncing(null);
      setError(`Error en repositorio ${repository}: ${error}`);
    });
    
    return () => {
      unsubscribeAdded();
      unsubscribeUpdated();
      unsubscribeRemoved();
      unsubscribeToggled();
      unsubscribeSyncStarted();
      unsubscribeSyncCompleted();
      unsubscribeError();
    };
  }, []);

  // Añadir repositorio
  const handleAddRepository = async () => {
    try {
      setError(null);
      
      // Validar formulario
      if (!newRepository.id || !newRepository.name || !newRepository.url) {
        setError('ID, nombre y URL son campos obligatorios');
        return;
      }
      
      // Añadir repositorio
      await pluginRepositoryManager.addRepository(newRepository);
      
      // Limpiar formulario y cerrar diálogo
      setNewRepository({
        id: '',
        name: '',
        url: '',
        apiEndpoint: '',
        description: ''
      });
      setShowAddDialog(false);
      
    } catch (error) {
      console.error('Error al añadir repositorio:', error);
      setError(error.message);
    }
  };

  // Editar repositorio
  const handleEditRepository = async () => {
    try {
      setError(null);
      
      if (!selectedRepository) return;
      
      // Validar formulario
      if (!editForm.name || !editForm.url) {
        setError('Nombre y URL son campos obligatorios');
        return;
      }
      
      // Actualizar repositorio
      await pluginRepositoryManager.updateRepository(selectedRepository, editForm);
      
      // Cerrar diálogo
      setShowEditDialog(false);
      setSelectedRepository(null);
      
    } catch (error) {
      console.error('Error al editar repositorio:', error);
      setError(error.message);
    }
  };

  // Eliminar repositorio
  const handleDeleteRepository = async () => {
    try {
      setError(null);
      
      if (!selectedRepository) return;
      
      // Eliminar repositorio
      await pluginRepositoryManager.removeRepository(selectedRepository);
      
      // Cerrar diálogo
      setShowDeleteDialog(false);
      setSelectedRepository(null);
      
    } catch (error) {
      console.error('Error al eliminar repositorio:', error);
      setError(error.message);
    }
  };

  // Habilitar/deshabilitar repositorio
  const handleToggleRepository = async (repositoryId, enabled) => {
    try {
      setError(null);
      
      // Cambiar estado
      await pluginRepositoryManager.toggleRepository(repositoryId, enabled);
      
    } catch (error) {
      console.error('Error al cambiar estado del repositorio:', error);
      setError(error.message);
    }
  };

  // Sincronizar repositorio
  const handleSyncRepository = async (repositoryId) => {
    try {
      setError(null);
      
      // Sincronizar
      await pluginRepositoryManager.syncRepository(repositoryId);
      
    } catch (error) {
      console.error('Error al sincronizar repositorio:', error);
      setError(error.message);
    }
  };

  // Sincronizar todos los repositorios
  const handleSyncAll = async () => {
    try {
      setError(null);
      setSyncing('all');
      
      // Sincronizar todos
      const result = await pluginRepositoryManager.syncAllRepositories();
      
      setSyncing(null);
      
      if (result.failed.length > 0) {
        setError(`No se pudieron sincronizar ${result.failed.length} repositorios`);
      }
      
    } catch (error) {
      console.error('Error al sincronizar repositorios:', error);
      setError(error.message);
      setSyncing(null);
    }
  };

  // Abrir diálogo de edición
  const openEditDialog = (repository) => {
    setSelectedRepository(repository.id);
    setEditForm({
      name: repository.name,
      url: repository.url,
      apiEndpoint: repository.apiEndpoint || '',
      description: repository.description || ''
    });
    setShowEditDialog(true);
  };

  // Abrir diálogo de eliminación
  const openDeleteDialog = (repository) => {
    setSelectedRepository(repository.id);
    setShowDeleteDialog(true);
  };

  // Ordenar repositorios
  const sortedRepositories = Object.values(repositories).sort((a, b) => {
    // Repositorio oficial primero
    if (a.official && !b.official) return -1;
    if (!a.official && b.official) return 1;
    
    // Luego por prioridad
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    
    // Finalmente por nombre
    return a.name.localeCompare(b.name);
  });

  // Renderizar interfaz
  return (
    <div className="repository-manager">
      <div className="repository-manager-header">
        <h2>Gestión de Repositorios</h2>
        <div className="repository-actions">
          <Button 
            onClick={() => setShowAddDialog(true)}
            variant="primary"
          >
            Añadir Repositorio
          </Button>
          <Button 
            onClick={handleSyncAll}
            disabled={syncing === 'all' || loading}
          >
            {syncing === 'all' ? 'Sincronizando...' : 'Sincronizar Todos'}
          </Button>
          <Button 
            onClick={onBack}
            variant="text"
          >
            Volver
          </Button>
        </div>
      </div>
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <Button 
            onClick={() => setError(null)}
            variant="text"
            size="small"
          >
            Cerrar
          </Button>
        </div>
      )}
      
      {loading ? (
        <div className="repositories-loading">
          <p>Cargando repositorios...</p>
        </div>
      ) : (
        <div className="repositories-list">
          {sortedRepositories.length === 0 ? (
            <div className="repositories-empty">
              <p>No hay repositorios configurados.</p>
            </div>
          ) : (
            sortedRepositories.map(repository => (
              <div 
                key={repository.id} 
                className={`repository-item ${repository.enabled ? 'enabled' : 'disabled'} ${repository.official ? 'official' : ''}`}
              >
                <div className="repository-info">
                  <div className="repository-header">
                    <h3 className="repository-name">{repository.name}</h3>
                    {repository.official && (
                      <span className="repository-badge official-badge">Oficial</span>
                    )}
                  </div>
                  <p className="repository-description">{repository.description}</p>
                  <div className="repository-meta">
                    <span className="repository-url">{repository.url}</span>
                    {repository.lastSync && (
                      <span className="repository-last-sync">
                        Última sincronización: {new Date(repository.lastSync).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="repository-actions">
                  <Button 
                    onClick={() => handleSyncRepository(repository.id)}
                    disabled={syncing === repository.id || !repository.enabled}
                    size="small"
                  >
                    {syncing === repository.id ? 'Sincronizando...' : 'Sincronizar'}
                  </Button>
                  
                  <Button 
                    onClick={() => handleToggleRepository(repository.id, !repository.enabled)}
                    variant={repository.enabled ? 'danger' : 'primary'}
                    size="small"
                    disabled={repository.official && repository.enabled}
                  >
                    {repository.enabled ? 'Deshabilitar' : 'Habilitar'}
                  </Button>
                  
                  <Button 
                    onClick={() => openEditDialog(repository)}
                    variant="text"
                    size="small"
                    disabled={repository.official}
                  >
                    Editar
                  </Button>
                  
                  <Button 
                    onClick={() => openDeleteDialog(repository)}
                    variant="text"
                    size="small"
                    disabled={repository.official}
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      
      {/* Diálogo para añadir repositorio */}
      <Dialog
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        title="Añadir Repositorio"
      >
        <div className="add-repository-form">
          <div className="form-field">
            <label htmlFor="repo-id">ID</label>
            <input 
              type="text" 
              id="repo-id" 
              value={newRepository.id}
              onChange={(e) => setNewRepository({...newRepository, id: e.target.value})}
              placeholder="Identificador único"
              required
            />
          </div>
          
          <div className="form-field">
            <label htmlFor="repo-name">Nombre</label>
            <input 
              type="text" 
              id="repo-name" 
              value={newRepository.name}
              onChange={(e) => setNewRepository({...newRepository, name: e.target.value})}
              placeholder="Nombre del repositorio"
              required
            />
          </div>
          
          <div className="form-field">
            <label htmlFor="repo-url">URL</label>
            <input 
              type="url" 
              id="repo-url" 
              value={newRepository.url}
              onChange={(e) => setNewRepository({...newRepository, url: e.target.value})}
              placeholder="https://ejemplo.com/repositorio"
              required
            />
          </div>
          
          <div className="form-field">
            <label htmlFor="repo-api">API Endpoint (opcional)</label>
            <input 
              type="url" 
              id="repo-api" 
              value={newRepository.apiEndpoint}
              onChange={(e) => setNewRepository({...newRepository, apiEndpoint: e.target.value})}
              placeholder="https://ejemplo.com/api"
            />
          </div>
          
          <div className="form-field">
            <label htmlFor="repo-description">Descripción</label>
            <textarea 
              id="repo-description" 
              value={newRepository.description}
              onChange={(e) => setNewRepository({...newRepository, description: e.target.value})}
              placeholder="Descripción del repositorio"
              rows="3"
            />
          </div>
          
          <div className="dialog-actions">
            <Button 
              variant="secondary" 
              onClick={() => setShowAddDialog(false)}
            >
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              onClick={handleAddRepository}
            >
              Añadir
            </Button>
          </div>
        </div>
      </Dialog>
      
      {/* Diálogo para editar repositorio */}
      <Dialog
        isOpen={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        title="Editar Repositorio"
      >
        <div className="edit-repository-form">
          <div className="form-field">
            <label htmlFor="edit-name">Nombre</label>
            <input 
              type="text" 
              id="edit-name" 
              value={editForm.name}
              onChange={(e) => setEditForm({...editForm, name: e.target.value})}
              placeholder="Nombre del repositorio"
              required
            />
          </div>
          
          <div className="form-field">
            <label htmlFor="edit-url">URL</label>
            <input 
              type="url" 
              id="edit-url" 
              value={editForm.url}
              onChange={(e) => setEditForm({...editForm, url: e.target.value})}
              placeholder="https://ejemplo.com/repositorio"
              required
            />
          </div>
          
          <div className="form-field">
            <label htmlFor="edit-api">API Endpoint (opcional)</label>
            <input 
              type="url" 
              id="edit-api" 
              value={editForm.apiEndpoint}
              onChange={(e) => setEditForm({...editForm, apiEndpoint: e.target.value})}
              placeholder="https://ejemplo.com/api"
            />
          </div>
          
          <div className="form-field">
            <label htmlFor="edit-description">Descripción</label>
            <textarea 
              id="edit-description" 
              value={editForm.description}
              onChange={(e) => setEditForm({...editForm, description: e.target.value})}
              placeholder="Descripción del repositorio"
              rows="3"
            />
          </div>
          
          <div className="dialog-actions">
            <Button 
              variant="secondary" 
              onClick={() => setShowEditDialog(false)}
            >
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              onClick={handleEditRepository}
            >
              Guardar
            </Button>
          </div>
        </div>
      </Dialog>
      
      {/* Diálogo para confirmar eliminación */}
      <Dialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        title="Eliminar Repositorio"
      >
        <div className="delete-repository-confirm">
          <p>
            ¿Estás seguro de que deseas eliminar este repositorio?
          </p>
          <p className="warning-text">
            Esta acción no se puede deshacer. Los plugins instalados desde este repositorio no se verán afectados.
          </p>
          
          <div className="dialog-actions">
            <Button 
              variant="secondary" 
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancelar
            </Button>
            <Button 
              variant="danger" 
              onClick={handleDeleteRepository}
            >
              Eliminar
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default RepositoryManager;