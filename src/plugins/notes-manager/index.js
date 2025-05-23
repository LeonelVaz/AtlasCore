import React from 'react';
import NotesNavigationItem from './components/NotesNavigationItem.jsx';
import NotesPage from './components/NotesPage.jsx';
import EventNotesExtension from './components/EventNotesExtension.jsx';

export default {
  // Metadatos del plugin
  id: 'simple-notes',
  name: 'Notas Simples',
  version: '1.2.0', // Incrementado por la vinculación con eventos
  description: 'Plugin simple para gestionar notas personales con editor de texto enriquecido y vinculación con eventos',
  author: 'Atlas Plugin Developer',
  
  // Restricciones de compatibilidad
  minAppVersion: '0.3.0',
  maxAppVersion: '1.0.0',
  
  // Permisos requeridos
  permissions: ['storage', 'ui', 'events'],
  
  // Variables internas
  _core: null,
  _notes: [],
  _navigationExtensionId: null,
  _pageExtensionId: null,
  _eventDetailExtensionId: null,
  _eventMenuExtensionId: null,
  _subscriptions: [],
  
  // Método de inicialización
  init: function(core) {
    const self = this;
    
    return new Promise(function(resolve) {
      try {
        // Guardar referencia al core
        self._core = core;
        
        // Verificar que los componentes de RichText estén disponibles
        const hasRichText = !!(core?.ui?.components?.RichTextEditor && core?.ui?.components?.RichTextViewer);
        console.log('[Notas Simples] RichText disponible:', hasRichText);
        
        // Cargar notas existentes
        self._loadNotes()
          .then(function() {
            // Migrar notas antiguas para incluir tags
            self._migrateNotes();
            
            // Registrar navegación
            self._registerNavigation();
            
            // Registrar página
            self._registerPage();
            
            // Registrar extensión para detalles de eventos
            self._registerEventDetailExtension();
            
            // Registrar menú contextual para eventos
            self._registerEventContextMenu();
            
            // Suscribirse a eventos del calendario
            self._setupEventListeners();
            
            console.log('[Notas Simples] Plugin inicializado correctamente con soporte para vinculación de eventos');
            resolve(true);
          })
          .catch(function(error) {
            console.error('[Notas Simples] Error al cargar notas:', error);
            resolve(false);
          });
      } catch (error) {
        console.error('[Notas Simples] Error durante la inicialización:', error);
        resolve(false);
      }
    });
  },
  
  // Método de limpieza
  cleanup: function() {
    try {
      // Guardar notas antes de limpiar
      this._saveNotes();
      
      // Cancelar suscripciones a eventos
      this._subscriptions.forEach(function(unsub) {
        if (typeof unsub === 'function') unsub();
      });
      
      // Remover extensiones UI
      if (this._navigationExtensionId && this._core) {
        this._core.ui.removeExtension(this.id, this._navigationExtensionId);
      }
      
      if (this._pageExtensionId && this._core) {
        this._core.ui.removeExtension(this.id, this._pageExtensionId);
      }
      
      if (this._eventDetailExtensionId && this._core) {
        this._core.ui.removeExtension(this.id, this._eventDetailExtensionId);
      }
      
      if (this._eventMenuExtensionId && this._core) {
        this._core.ui.removeExtension(this.id, this._eventMenuExtensionId);
      }
      
      console.log('[Notas Simples] Limpieza completada');
      return true;
    } catch (error) {
      console.error('[Notas Simples] Error durante la limpieza:', error);
      return false;
    }
  },
  
  // Cargar notas desde el almacenamiento
  _loadNotes: function() {
    const self = this;
    
    return this._core.storage.getItem(this.id, 'notes', [])
      .then(function(notes) {
        self._notes = notes || [];
        console.log('[Notas Simples] Cargadas ' + self._notes.length + ' notas');
        return self._notes;
      });
  },
  
  // Migrar notas antiguas para añadir tags si no existen
  _migrateNotes: function() {
    let migrated = false;
    
    this._notes.forEach(function(note) {
      // Añadir array tags si no existe
      if (!note.tags) {
        note.tags = [];
        migrated = true;
      }
      
      // Si tiene evento vinculado pero no tiene la etiqueta calendario, añadirla
      if (note.linkedEventId && !note.tags.includes('calendario')) {
        note.tags.push('calendario');
        migrated = true;
      }
    });
    
    if (migrated) {
      this._saveNotes();
      console.log('[Notas Simples] Notas migradas para incluir etiquetas');
    }
  },
  
  // Guardar notas en el almacenamiento
  _saveNotes: function() {
    if (this._core) {
      return this._core.storage.setItem(this.id, 'notes', this._notes)
        .then(function() {
          console.log('[Notas Simples] Notas guardadas correctamente');
        })
        .catch(function(error) {
          console.error('[Notas Simples] Error al guardar notas:', error);
        });
    }
    return Promise.resolve();
  },
  
  // Configurar listeners de eventos
  _setupEventListeners: function() {
    const self = this;
    
    // Suscribirse a eventos del calendario para actualizar referencias
    const eventUpdatedSub = this._core.events.subscribe(
      this.id,
      'calendar.eventUpdated',
      function(data) {
        self._handleEventUpdate(data);
      }
    );
    
    const eventDeletedSub = this._core.events.subscribe(
      this.id,
      'calendar.eventDeleted',
      function(data) {
        self._handleEventDelete(data);
      }
    );
    
    this._subscriptions.push(eventUpdatedSub, eventDeletedSub);
  },
  
  // Manejar actualización de eventos
  _handleEventUpdate: function(data) {
    if (!data || !data.oldEvent || !data.newEvent) return;
    
    // Actualizar referencias en notas si cambió el título del evento
    if (data.oldEvent.title !== data.newEvent.title) {
      let updated = false;
      this._notes.forEach(function(note) {
        if (note.linkedEventId === data.oldEvent.id) {
          note.linkedEventTitle = data.newEvent.title;
          updated = true;
        }
      });
      
      if (updated) {
        this._saveNotes();
      }
    }
  },
  
  // Manejar eliminación de eventos
  _handleEventDelete: function(data) {
    if (!data || !data.event) return;
    
    // Remover vinculación de notas asociadas al evento eliminado
    let updated = false;
    this._notes.forEach(function(note) {
      if (note.linkedEventId === data.event.id) {
        delete note.linkedEventId;
        delete note.linkedEventTitle;
        // Remover etiqueta calendario si existe
        if (note.tags && note.tags.includes('calendario')) {
          note.tags = note.tags.filter(tag => tag !== 'calendario');
        }
        updated = true;
      }
    });
    
    if (updated) {
      this._saveNotes();
      console.log('[Notas Simples] Removidas vinculaciones de evento eliminado:', data.event.id);
    }
  },
  
  // Registrar el elemento de navegación
  _registerNavigation: function() {
    const self = this;
    
    // Crear componente de navegación con referencia al plugin Y al core
    function NavigationWrapper(props) {
      return React.createElement(NotesNavigationItem, {
        ...props,
        plugin: self,
        core: self._core
      });
    }
    
    this._navigationExtensionId = this._core.ui.registerExtension(
      this.id,
      this._core.ui.getExtensionZones().MAIN_NAVIGATION,
      NavigationWrapper,
      { order: 100 }
    );
    
    console.log('[Notas Simples] Navegación registrada con ID:', this._navigationExtensionId);
  },
  
  // Registrar la página de notas
  _registerPage: function() {
    const self = this;
    
    // Crear componente de página con referencia al plugin Y al core
    function PageWrapper(props) {
      return React.createElement(NotesPage, {
        ...props,
        plugin: self,
        core: self._core
      });
    }
    
    this._pageExtensionId = this._core.ui.registerExtension(
      this.id,
      this._core.ui.getExtensionZones().PLUGIN_PAGES,
      PageWrapper,
      {
        order: 100,
        props: { pageId: 'notes' }
      }
    );
    
    console.log('[Notas Simples] Página registrada con ID:', this._pageExtensionId);
  },
  
  // Registrar extensión para detalles de eventos
  _registerEventDetailExtension: function() {
    const self = this;
    
    function EventNotesWrapper(props) {
      return React.createElement(EventNotesExtension, {
        ...props,
        plugin: self,
        core: self._core
      });
    }
    
    this._eventDetailExtensionId = this._core.ui.registerExtension(
      this.id,
      this._core.ui.getExtensionZones().EVENT_DETAIL_VIEW,
      EventNotesWrapper,
      { order: 200 }
    );
    
    console.log('[Notas Simples] Extensión de detalles de evento registrada');
  },
  
  // Registrar menú contextual para eventos
  _registerEventContextMenu: function() {
    const self = this;
    
    // Si el sistema tiene soporte para menús contextuales
    if (self._core.ui.registerContextMenuItem) {
      self._eventMenuExtensionId = self._core.ui.registerContextMenuItem(
        self.id,
        'calendar-event',
        {
          label: '📝 Crear nota para este evento',
          onClick: function(event) {
            self._createNoteFromEvent(event);
          },
          order: 100
        }
      );
      
      console.log('[Notas Simples] Menú contextual de eventos registrado');
    }
  },
  
  // Crear nota desde un evento
  _createNoteFromEvent: function(event) {
    if (!event) return;
    
    // Navegar a la página de notas con parámetros para crear nota
    if (this._core.navigation && this._core.navigation.navigateToPlugin) {
      this._core.navigation.navigateToPlugin(this.id, 'notes', {
        action: 'create',
        fromEvent: {
          id: event.id,
          title: event.title,
          start: event.start,
          end: event.end
        }
      });
    }
  },
  
  // API pública para gestionar notas
  createNote: function(title, content, linkedEventId, linkedEventTitle) {
    const newNote = {
      id: Date.now().toString(),
      title: title || 'Nueva nota',
      content: content || '',
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      tags: []
    };
    
    // Vincular con evento si se proporciona
    if (linkedEventId) {
      newNote.linkedEventId = linkedEventId;
      newNote.linkedEventTitle = linkedEventTitle;
      newNote.tags.push('calendario');
    }
    
    this._notes.push(newNote);
    this._saveNotes();
    
    console.log('[Notas Simples] Nota creada:', newNote.id, linkedEventId ? '(vinculada a evento)' : '');
    return newNote;
  },
  
  updateNote: function(noteId, updates) {
    const noteIndex = this._notes.findIndex(note => note.id === noteId);
    
    if (noteIndex !== -1) {
      // Asegurar que la nota tenga tags array
      if (!this._notes[noteIndex].tags) {
        this._notes[noteIndex].tags = [];
      }
      
      this._notes[noteIndex] = {
        ...this._notes[noteIndex],
        ...updates,
        modifiedAt: new Date().toISOString()
      };
      
      // Gestionar etiqueta de calendario
      if (updates.hasOwnProperty('linkedEventId')) {
        const note = this._notes[noteIndex];
        
        // Asegurar que tags existe
        if (!note.tags) {
          note.tags = [];
        }
        
        if (updates.linkedEventId && !note.tags.includes('calendario')) {
          note.tags.push('calendario');
        } else if (!updates.linkedEventId && note.tags.includes('calendario')) {
          note.tags = note.tags.filter(tag => tag !== 'calendario');
        }
      }
      
      this._saveNotes();
      console.log('[Notas Simples] Nota actualizada:', noteId);
      return this._notes[noteIndex];
    }
    
    return null;
  },
  
  deleteNote: function(noteId) {
    const initialLength = this._notes.length;
    this._notes = this._notes.filter(note => note.id !== noteId);
    
    if (this._notes.length < initialLength) {
      this._saveNotes();
      console.log('[Notas Simples] Nota eliminada:', noteId);
      return true;
    }
    
    return false;
  },
  
  getNotes: function() {
    return [...this._notes];
  },
  
  getNote: function(noteId) {
    return this._notes.find(note => note.id === noteId) || null;
  },
  
  // Obtener notas vinculadas a un evento
  getNotesForEvent: function(eventId) {
    return this._notes.filter(note => note.linkedEventId === eventId);
  },
  
  // Vincular/desvincular nota con evento
  linkNoteToEvent: function(noteId, eventId, eventTitle) {
    const note = this.getNote(noteId);
    if (!note) return null;
    
    return this.updateNote(noteId, {
      linkedEventId: eventId,
      linkedEventTitle: eventTitle
    });
  },
  
  unlinkNoteFromEvent: function(noteId) {
    const note = this.getNote(noteId);
    if (!note) return null;
    
    // Actualizar nota removiendo las propiedades de vinculación
    const noteIndex = this._notes.findIndex(n => n.id === noteId);
    if (noteIndex !== -1) {
      delete this._notes[noteIndex].linkedEventId;
      delete this._notes[noteIndex].linkedEventTitle;
      
      // Remover etiqueta calendario
      if (this._notes[noteIndex].tags) {
        this._notes[noteIndex].tags = this._notes[noteIndex].tags.filter(tag => tag !== 'calendario');
      }
      
      this._notes[noteIndex].modifiedAt = new Date().toISOString();
      this._saveNotes();
      
      return this._notes[noteIndex];
    }
    
    return null;
  },
  
  // Nuevos métodos para estadísticas y utilidades
  getNotesStats: function() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
    
    return {
      total: this._notes.length,
      createdToday: this._notes.filter(note => new Date(note.createdAt) >= today).length,
      createdThisWeek: this._notes.filter(note => new Date(note.createdAt) >= thisWeek).length,
      withRichContent: this._notes.filter(note => note.content && note.content.includes('<')).length,
      linkedToEvents: this._notes.filter(note => note.linkedEventId).length,
      averageLength: this._notes.length > 0 ? 
        Math.round(this._notes.reduce((sum, note) => sum + (note.content?.length || 0), 0) / this._notes.length) : 0
    };
  },
  
  searchNotes: function(query) {
    if (!query || !query.trim()) return this._notes;
    
    const searchTerm = query.toLowerCase().trim();
    return this._notes.filter(note => {
      try {
        const titleMatch = note.title && note.title.toLowerCase().includes(searchTerm);
        
        // Para contenido HTML, extraer texto plano para búsqueda
        let contentText = note.content || '';
        if (contentText && contentText.includes('<')) {
          try {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = contentText;
            contentText = tempDiv.textContent || tempDiv.innerText || '';
          } catch (error) {
            console.warn('Error al extraer texto para búsqueda:', error);
            // Usar el contenido original como fallback
          }
        }
        const contentMatch = contentText && contentText.toLowerCase().includes(searchTerm);
        
        // Buscar también en título del evento vinculado
        const eventMatch = note.linkedEventTitle && note.linkedEventTitle.toLowerCase().includes(searchTerm);
        
        return titleMatch || contentMatch || eventMatch;
      } catch (error) {
        console.error('Error en búsqueda de nota:', error);
        // En caso de error, incluir la nota si el título coincide básicamente
        return note.title && note.title.toLowerCase().includes(searchTerm);
      }
    });
  }
};