import React from 'react';
import NotesNavigationItem from './components/NotesNavigationItem.jsx';
import NotesPage from './components/NotesPage.jsx';

export default {
  // Metadatos del plugin
  id: 'simple-notes',
  name: 'Notas Simples',
  version: '1.0.0',
  description: 'Plugin simple para gestionar notas personales',
  author: 'Atlas Plugin Developer',
  
  // Restricciones de compatibilidad
  minAppVersion: '0.3.0',
  maxAppVersion: '1.0.0',
  
  // Permisos requeridos
  permissions: ['storage', 'ui'],
  
  // Variables internas
  _core: null,
  _notes: [],
  _navigationExtensionId: null,
  _pageExtensionId: null,
  
  // Método de inicialización
  init: function(core) {
    const self = this;
    
    return new Promise(function(resolve) {
      try {
        // Guardar referencia al core
        self._core = core;
        
        // Cargar notas existentes
        self._loadNotes()
          .then(function() {
            // Registrar navegación
            self._registerNavigation();
            
            // Registrar página
            self._registerPage();
            
            console.log('[Notas Simples] Plugin inicializado correctamente');
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
      
      // Remover extensiones UI
      if (this._navigationExtensionId && this._core) {
        this._core.ui.removeExtension(this.id, this._navigationExtensionId);
      }
      
      if (this._pageExtensionId && this._core) {
        this._core.ui.removeExtension(this.id, this._pageExtensionId);
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
  
  // Registrar el elemento de navegación
  _registerNavigation: function() {
    const self = this;
    
    // Crear componente de navegación con referencia al plugin
    function NavigationWrapper(props) {
      return React.createElement(NotesNavigationItem, {
        ...props,
        plugin: self
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
    
    // Crear componente de página con referencia al plugin
    function PageWrapper(props) {
      return React.createElement(NotesPage, {
        ...props,
        plugin: self
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
  
  // API pública para gestionar notas
  createNote: function(title, content) {
    const newNote = {
      id: Date.now().toString(),
      title: title || 'Nueva nota',
      content: content || '',
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString()
    };
    
    this._notes.push(newNote);
    this._saveNotes();
    
    console.log('[Notas Simples] Nota creada:', newNote.id);
    return newNote;
  },
  
  updateNote: function(noteId, updates) {
    const noteIndex = this._notes.findIndex(note => note.id === noteId);
    
    if (noteIndex !== -1) {
      this._notes[noteIndex] = {
        ...this._notes[noteIndex],
        ...updates,
        modifiedAt: new Date().toISOString()
      };
      
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
  }
};