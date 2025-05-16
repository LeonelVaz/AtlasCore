/**
 * Plugin de Notas para Atlas
 * 
 * Proporciona funcionalidad para crear, editar y gestionar notas
 * vinculadas a eventos del calendario o fechas específicas.
 */
import NotesPanel from './components/notes-panel';
import NotesContext, { NotesProvider } from './contexts/notes-context';
import NoteBadge from './components/note-badge';
import NotesButton from './components/notes-button';
import NoteCreateField from './components/note-create-field';
import NoteEditField from './components/note-edit-field';
import { convertCalendarEventToNote, convertNoteToCalendarEvent } from './utils/notes-utils';
import './styles/notes.css';

const STORAGE_KEY_PREFIX = 'plugin.notes-manager';

export default {
  // Metadatos del plugin
  id: 'notes-manager',
  name: 'Gestor de Notas',
  version: '0.3.0',
  description: 'Gestiona notas vinculadas a eventos del calendario o fechas específicas',
  author: 'Atlas Team',
  
  // Restricciones de compatibilidad
  minAppVersion: '0.3.0',
  maxAppVersion: '1.0.0',
  
  // Referencia a la API del core
  core: null,
  
  // Estado interno del plugin
  _initializedComponents: false,
  
  /**
   * Inicializa el plugin
   * @param {Object} core - API central proporcionada por Atlas
   * @returns {boolean} - true si la inicialización fue exitosa
   */
  init: function(core) {
    console.log('Inicializando Plugin de Notas...');
    
    if (!core) {
      console.error('Core API no disponible para el plugin Notas');
      return false;
    }
    
    // Guardar referencia al core para uso posterior
    this.core = core;
    
    try {
      // Registrar componentes UI en puntos de extensión
      this._registerUIComponents();
      
      // Registrar el módulo como proveedor de notas
      this._registerModule();
      
      console.log('Plugin de Notas inicializado correctamente');
      return true;
    } catch (error) {
      console.error('Error al inicializar el plugin de Notas:', error);
      return false;
    }
  },
  
  /**
   * Registra los componentes UI en los puntos de extensión
   * @private
   */
  _registerUIComponents: function() {
    if (this._initializedComponents) return;
    
    const { ui } = this.core;
    const pluginId = this.id;
    
    if (!ui || !ui.registerComponent) {
      console.error('API UI no disponible para registrar componentes');
      return;
    }
    
    // Registrar un elemento en la barra lateral principal
    ui.registerComponent(pluginId, 'app.sidebar', NotesButton, {
      position: 'middle',
      label: 'Notas',
      icon: 'note'
    });
    
    // Registrar un decorador para los eventos con notas asociadas
    ui.registerComponent(pluginId, 'calendar.eventDecorator', NoteBadge, {
      position: 'end'
    });
    
    // Registrar campos en el formulario de eventos
    ui.registerComponent(pluginId, 'form.eventCreate', NoteCreateField);
    
    // Registrar el componente similar para edición de eventos
    ui.registerComponent(pluginId, 'form.eventEdit', NoteEditField);
    
    this._initializedComponents = true;
  },
  
  /**
   * Registra el módulo en el sistema
   * @private
   */
  _registerModule: function() {
    if (!this.core.registerModule) {
      console.error('API de registro de módulos no disponible');
      return false;
    }
    
    // Registrar como proveedor de notas
    return this.core.registerModule('notes-manager', this.publicAPI);
  },
  
  /**
   * Limpia recursos cuando el plugin se desactiva
   * @returns {boolean} - true si la limpieza fue exitosa
   */
  cleanup: function() {
    console.log('Limpiando recursos del Plugin de Notas...');
    
    try {
      // Desregistrar el módulo
      if (this.core && this.core.unregisterModule) {
        this.core.unregisterModule('notes-manager');
      }
      
      // Eliminar componentes UI
      if (this.core && this.core.ui && this.core.ui.unregisterComponents) {
        this.core.ui.unregisterComponents(this.id);
      }
      
      // Limpiar referencia al core
      this.core = null;
      this._initializedComponents = false;
      
      return true;
    } catch (error) {
      console.error('Error al limpiar recursos del plugin de Notas:', error);
      return false;
    }
  },
  
  /**
   * API pública que expone el plugin
   */
  publicAPI: {
    // Obtener todas las notas
    getAllNotes: async function() {
      const storageService = this.core?.storage;
      if (!storageService) return [];
      
      try {
        return await storageService.getItem(this.id, 'notes', []);
      } catch (error) {
        console.error('Error al obtener notas:', error);
        return [];
      }
    },
    
    // Obtener una nota por ID
    getNoteById: async function(noteId) {
      if (!noteId) return null;
      
      const notes = await this.getAllNotes();
      return notes.find(note => note.id === noteId) || null;
    },
    
    // Obtener notas por fecha
    getNotesByDate: async function(date) {
      if (!date) return [];
      
      const targetDate = new Date(date);
      const notes = await this.getAllNotes();
      
      // Comparar solo la fecha (sin hora)
      return notes.filter(note => {
        const noteDate = new Date(note.date);
        return noteDate.toDateString() === targetDate.toDateString();
      });
    },
    
    // Obtener notas por evento
    getNotesByEvent: async function(eventId) {
      if (!eventId) return [];
      
      const notes = await this.getAllNotes();
      return notes.filter(note => note.eventId === eventId);
    },
    
    // Crear una nueva nota
    createNote: async function(noteData) {
      if (!noteData || !noteData.title) {
        throw new Error('Se requiere al menos un título para la nota');
      }
      
      const storageService = this.core?.storage;
      if (!storageService) throw new Error('Servicio de almacenamiento no disponible');
      
      try {
        // Obtener notas existentes
        const notes = await storageService.getItem(this.id, 'notes', []);
        
        // Crear nueva nota con ID único
        const newNote = {
          id: Date.now().toString(),
          title: noteData.title,
          content: noteData.content || '',
          date: noteData.date || new Date().toISOString(),
          eventId: noteData.eventId || null,
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
          color: noteData.color || '#2D4B94'
        };
        
        // Añadir a la colección
        const updatedNotes = [...notes, newNote];
        
        // Guardar en almacenamiento
        await storageService.setItem(this.id, 'notes', updatedNotes);
        
        // Notificar creación
        if (this.core.events) {
          this.core.events.publish('plugin.notes-manager.noteCreated', newNote);
        }
        
        return newNote;
      } catch (error) {
        console.error('Error al crear nota:', error);
        throw error;
      }
    },
    
    // Actualizar una nota existente
    updateNote: async function(noteId, noteData) {
      if (!noteId || !noteData) {
        throw new Error('Se requiere ID y datos para actualizar la nota');
      }
      
      const storageService = this.core?.storage;
      if (!storageService) throw new Error('Servicio de almacenamiento no disponible');
      
      try {
        // Obtener notas existentes
        const notes = await storageService.getItem(this.id, 'notes', []);
        
        // Encontrar la nota a actualizar
        const noteIndex = notes.findIndex(note => note.id === noteId);
        if (noteIndex === -1) {
          throw new Error(`Nota con ID ${noteId} no encontrada`);
        }
        
        // Actualizar la nota
        const updatedNote = {
          ...notes[noteIndex],
          ...noteData,
          modified: new Date().toISOString()
        };
        
        // Actualizar la colección
        const updatedNotes = [...notes];
        updatedNotes[noteIndex] = updatedNote;
        
        // Guardar en almacenamiento
        await storageService.setItem(this.id, 'notes', updatedNotes);
        
        // Notificar actualización
        if (this.core.events) {
          this.core.events.publish('plugin.notes-manager.noteUpdated', updatedNote);
        }
        
        return updatedNote;
      } catch (error) {
        console.error('Error al actualizar nota:', error);
        throw error;
      }
    },
    
    // Eliminar una nota
    deleteNote: async function(noteId) {
      if (!noteId) {
        throw new Error('Se requiere ID para eliminar la nota');
      }
      
      const storageService = this.core?.storage;
      if (!storageService) throw new Error('Servicio de almacenamiento no disponible');
      
      try {
        // Obtener notas existentes
        const notes = await storageService.getItem(this.id, 'notes', []);
        
        // Encontrar la nota a eliminar
        const noteIndex = notes.findIndex(note => note.id === noteId);
        if (noteIndex === -1) {
          throw new Error(`Nota con ID ${noteId} no encontrada`);
        }
        
        // Guardar referencia a la nota que se eliminará
        const deletedNote = notes[noteIndex];
        
        // Filtrar la colección
        const updatedNotes = notes.filter(note => note.id !== noteId);
        
        // Guardar en almacenamiento
        await storageService.setItem(this.id, 'notes', updatedNotes);
        
        // Notificar eliminación
        if (this.core.events) {
          this.core.events.publish('plugin.notes-manager.noteDeleted', { id: noteId });
        }
        
        return true;
      } catch (error) {
        console.error('Error al eliminar nota:', error);
        throw error;
      }
    },
    
    // Vincular nota con evento
    linkNoteToEvent: async function(noteId, eventId) {
      if (!noteId || !eventId) {
        throw new Error('Se requieren IDs de nota y evento para vincular');
      }
      
      try {
        // Obtener nota existente
        const note = await this.getNoteById(noteId);
        if (!note) {
          throw new Error(`Nota con ID ${noteId} no encontrada`);
        }
        
        // Actualizar con el ID del evento
        return await this.updateNote(noteId, { eventId });
      } catch (error) {
        console.error('Error al vincular nota con evento:', error);
        throw error;
      }
    },
    
    // Desvincular nota de evento
    unlinkNoteFromEvent: async function(noteId) {
      if (!noteId) {
        throw new Error('Se requiere ID de nota para desvincular');
      }
      
      try {
        // Obtener nota existente
        const note = await this.getNoteById(noteId);
        if (!note) {
          throw new Error(`Nota con ID ${noteId} no encontrada`);
        }
        
        // Actualizar quitando el ID del evento
        return await this.updateNote(noteId, { eventId: null });
      } catch (error) {
        console.error('Error al desvincular nota de evento:', error);
        throw error;
      }
    },
    
    // Convertir evento a nota
    convertEventToNote: async function(eventId) {
      if (!eventId) {
        throw new Error('Se requiere ID de evento para convertir');
      }
      
      try {
        // Obtener evento del calendario
        const calendarModule = this.core.getModule('calendar');
        if (!calendarModule) {
          throw new Error('Módulo de calendario no disponible');
        }
        
        const events = calendarModule.getEvents();
        const event = events.find(e => e.id === eventId);
        
        if (!event) {
          throw new Error(`Evento con ID ${eventId} no encontrado`);
        }
        
        // Convertir a formato de nota
        const noteData = convertCalendarEventToNote(event);
        
        // Crear la nota
        const note = await this.createNote(noteData);
        
        // Vincular la nota con el evento
        await this.linkNoteToEvent(note.id, eventId);
        
        return note;
      } catch (error) {
        console.error('Error al convertir evento a nota:', error);
        throw error;
      }
    },
    
    // Obtener Provider para React
    getNotesProvider: function() {
      return NotesProvider;
    },
    
    // Obtener Context para React
    getNotesContext: function() {
      return NotesContext;
    },
    
    // Obtener componente de panel de notas
    getNotesPanel: function() {
      return NotesPanel;
    }
  }
};