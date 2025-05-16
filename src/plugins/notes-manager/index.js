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
import { 
  convertCalendarEventToNote, 
  convertNoteToCalendarEvent, 
  sanitizeHtml 
} from './utils/notes-utils';
import { loadTranslations, getTranslation } from './utils/i18n';
import './styles/notes.css';

const STORAGE_KEY_PREFIX = 'plugin.notes-manager';

export default {
  // Metadatos del plugin
  id: 'notes-manager',
  name: 'Gestor de Notas',
  version: '0.5.0',
  description: 'Gestiona notas vinculadas a eventos del calendario o fechas específicas',
  author: 'Atlas Team',
  
  // Restricciones de compatibilidad
  minAppVersion: '0.3.0',
  maxAppVersion: '1.0.0',
  
  // Referencia a la API del core
  core: null,
  
  // Estado interno del plugin
  _initializedComponents: false,
  _translations: null,
  
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
      // Cargar traducciones
      this._translations = loadTranslations(
        navigator.language || navigator.userLanguage || 'es'
      );
      
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
      label: getTranslation(this._translations, 'sidebar.notes'),
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
    
    // Crear una API pública que tenga acceso al core
    const publicAPI = {
      // Añadir una referencia directa al core
      core: this.core,
      
      // Identificador del plugin
      id: this.id,
      
      // Obtener todas las notas
      getAllNotes: async function() {
        if (!this.core?.storage) return [];
        
        try {
          return await this.core.storage.getItem(this.id, 'notes', []);
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
        
        // Filtrar notas por referencia a fecha o por fecha en general
        return notes.filter(note => {
          // Si tiene referencia explícita a fecha
          if (note.references && note.references.type === 'date') {
            const refDate = new Date(note.references.id);
            return refDate.toDateString() === targetDate.toDateString();
          }
          
          // Comprobar fecha de la nota
          const noteDate = new Date(note.date || note.createdAt);
          return noteDate.toDateString() === targetDate.toDateString();
        });
      },
      
      // Obtener notas por evento
      getNotesByEvent: async function(eventId) {
        if (!eventId) return [];
        
        const notes = await this.getAllNotes();
        return notes.filter(note => {
          // Comprobar referencia directa al evento
          if (note.references && note.references.type === 'event') {
            return note.references.id === eventId;
          }
          
          // Compatibilidad con campo eventId para versiones antiguas
          return note.eventId === eventId;
        });
      },
      
      // Obtener notas por referencia
      getNotesByReference: async function(refType, refId) {
        if (!refType || !refId) return [];
        
        const notes = await this.getAllNotes();
        return notes.filter(note => 
          note.references && 
          note.references.type === refType && 
          note.references.id === refId
        );
      },
      
      // Crear una nueva nota
      createNote: async function(noteData) {
        if (!noteData || !noteData.title) {
          throw new Error('Se requiere al menos un título para la nota');
        }
        
        if (!this.core?.storage) {
          throw new Error('Servicio de almacenamiento no disponible');
        }
        
        try {
          // Obtener notas existentes
          const notes = await this.core.storage.getItem(this.id, 'notes', []);
          
          // Sanitizar contenido HTML
          const sanitizedContent = sanitizeHtml(noteData.content || '');
          
          // Crear nueva nota con ID único
          const newNote = {
            id: 'note_' + Date.now().toString(),
            title: noteData.title.trim(),
            content: sanitizedContent,
            date: noteData.date || new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            color: noteData.color || '#2D4B94',
            categoryId: noteData.categoryId || null,
            // Mantener compatibilidad con eventId y migrar al nuevo formato
            references: noteData.references || (noteData.eventId ? {
              type: 'event',
              id: noteData.eventId
            } : null),
            tags: noteData.tags || []
          };
          
          // Añadir a la colección
          const updatedNotes = [...notes, newNote];
          
          // Guardar en almacenamiento
          await this.core.storage.setItem(this.id, 'notes', updatedNotes);
          
          // Notificar creación
          if (this.core.events) {
            this.core.events.publish('plugin.notes-manager.note_created', { note: newNote });
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
        
        if (!this.core?.storage) {
          throw new Error('Servicio de almacenamiento no disponible');
        }
        
        try {
          // Obtener notas existentes
          const notes = await this.core.storage.getItem(this.id, 'notes', []);
          
          // Encontrar la nota a actualizar
          const noteIndex = notes.findIndex(note => note.id === noteId);
          if (noteIndex === -1) {
            throw new Error(`Nota con ID ${noteId} no encontrada`);
          }
          
          // Guardar datos anteriores para el evento
          const previousData = { ...notes[noteIndex] };
          
          // Sanitizar contenido HTML si se proporciona
          let sanitizedContent = noteData.content;
          if (sanitizedContent !== undefined) {
            sanitizedContent = sanitizeHtml(sanitizedContent);
          }
          
          // Actualizar la nota
          const updatedNote = {
            ...notes[noteIndex],
            ...noteData,
            content: sanitizedContent !== undefined ? sanitizedContent : notes[noteIndex].content,
            updatedAt: new Date().toISOString()
          };
          
          // Actualizar la colección
          const updatedNotes = [...notes];
          updatedNotes[noteIndex] = updatedNote;
          
          // Guardar en almacenamiento
          await this.core.storage.setItem(this.id, 'notes', updatedNotes);
          
          // Notificar actualización
          if (this.core.events) {
            this.core.events.publish('plugin.notes-manager.note_updated', {
              note: updatedNote,
              previousData
            });
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
        
        if (!this.core?.storage) {
          throw new Error('Servicio de almacenamiento no disponible');
        }
        
        try {
          // Obtener notas existentes
          const notes = await this.core.storage.getItem(this.id, 'notes', []);
          
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
          await this.core.storage.setItem(this.id, 'notes', updatedNotes);
          
          // Notificar eliminación
          if (this.core.events) {
            this.core.events.publish('plugin.notes-manager.note_deleted', { id: noteId });
          }
          
          return true;
        } catch (error) {
          console.error('Error al eliminar nota:', error);
          throw error;
        }
      },
      
      // Obtener todas las categorías
      getCategories: async function() {
        if (!this.core?.storage) return [];
        
        try {
          return await this.core.storage.getItem(this.id, 'categories', []);
        } catch (error) {
          console.error('Error al obtener categorías:', error);
          return [];
        }
      },
      
      // Crear nueva categoría
      createCategory: async function(categoryData) {
        if (!categoryData || !categoryData.name) {
          throw new Error('Se requiere al menos un nombre para la categoría');
        }
        
        if (!this.core?.storage) {
          throw new Error('Servicio de almacenamiento no disponible');
        }
        
        try {
          // Obtener categorías existentes
          const categories = await this.core.storage.getItem(this.id, 'categories', []);
          
          // Crear nueva categoría con ID único
          const newCategory = {
            id: 'category_' + Date.now().toString(),
            name: categoryData.name.trim(),
            color: categoryData.color || '#2D4B94',
            icon: categoryData.icon || 'folder'
          };
          
          // Añadir a la colección
          const updatedCategories = [...categories, newCategory];
          
          // Guardar en almacenamiento
          await this.core.storage.setItem(this.id, 'categories', updatedCategories);
          
          // Notificar creación
          if (this.core.events) {
            this.core.events.publish('plugin.notes-manager.category_created', {
              category: newCategory
            });
          }
          
          return newCategory;
        } catch (error) {
          console.error('Error al crear categoría:', error);
          throw error;
        }
      },
      
      // Actualizar categoría existente
      updateCategory: async function(categoryId, categoryData) {
        if (!categoryId || !categoryData) {
          throw new Error('Se requiere ID y datos para actualizar la categoría');
        }
        
        if (!this.core?.storage) {
          throw new Error('Servicio de almacenamiento no disponible');
        }
        
        try {
          // Obtener categorías existentes
          const categories = await this.core.storage.getItem(this.id, 'categories', []);
          
          // Encontrar la categoría a actualizar
          const categoryIndex = categories.findIndex(category => category.id === categoryId);
          if (categoryIndex === -1) {
            throw new Error(`Categoría con ID ${categoryId} no encontrada`);
          }
          
          // Actualizar la categoría
          const updatedCategory = {
            ...categories[categoryIndex],
            ...categoryData
          };
          
          // Actualizar la colección
          const updatedCategories = [...categories];
          updatedCategories[categoryIndex] = updatedCategory;
          
          // Guardar en almacenamiento
          await this.core.storage.setItem(this.id, 'categories', updatedCategories);
          
          // Notificar actualización
          if (this.core.events) {
            this.core.events.publish('plugin.notes-manager.category_updated', {
              category: updatedCategory
            });
          }
          
          return updatedCategory;
        } catch (error) {
          console.error('Error al actualizar categoría:', error);
          throw error;
        }
      },
      
      // Eliminar categoría
      deleteCategory: async function(categoryId) {
        if (!categoryId) {
          throw new Error('Se requiere ID para eliminar la categoría');
        }
        
        if (!this.core?.storage) {
          throw new Error('Servicio de almacenamiento no disponible');
        }
        
        try {
          // Obtener categorías existentes
          const categories = await this.core.storage.getItem(this.id, 'categories', []);
          
          // Encontrar la categoría a eliminar
          const categoryIndex = categories.findIndex(category => category.id === categoryId);
          if (categoryIndex === -1) {
            throw new Error(`Categoría con ID ${categoryId} no encontrada`);
          }
          
          // Filtrar la colección
          const updatedCategories = categories.filter(category => category.id !== categoryId);
          
          // Guardar en almacenamiento
          await this.core.storage.setItem(this.id, 'categories', updatedCategories);
          
          // Actualizar notas que usaban esta categoría
          const notes = await this.core.storage.getItem(this.id, 'notes', []);
          const updatedNotes = notes.map(note => {
            if (note.categoryId === categoryId) {
              return {
                ...note,
                categoryId: null,
                updatedAt: new Date().toISOString()
              };
            }
            return note;
          });
          
          // Guardar notas actualizadas
          await this.core.storage.setItem(this.id, 'notes', updatedNotes);
          
          // Notificar eliminación
          if (this.core.events) {
            this.core.events.publish('plugin.notes-manager.category_deleted', { id: categoryId });
          }
          
          return true;
        } catch (error) {
          console.error('Error al eliminar categoría:', error);
          throw error;
        }
      },
      
      // Obtener notas por categoría
      getNotesByCategory: async function(categoryId) {
        if (!categoryId) return [];
        
        const notes = await this.getAllNotes();
        return notes.filter(note => note.categoryId === categoryId);
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
          
          // Actualizar con la referencia al evento
          return await this.updateNote(noteId, {
            references: {
              type: 'event',
              id: eventId
            }
          });
        } catch (error) {
          console.error('Error al vincular nota con evento:', error);
          throw error;
        }
      },
      
      // Vincular nota con fecha
      linkNoteToDate: async function(noteId, date) {
        if (!noteId || !date) {
          throw new Error('Se requieren ID de nota y fecha para vincular');
        }
        
        try {
          // Obtener nota existente
          const note = await this.getNoteById(noteId);
          if (!note) {
            throw new Error(`Nota con ID ${noteId} no encontrada`);
          }
          
          // Formato ISO para la fecha
          const dateStr = date instanceof Date ? date.toISOString() : date;
          
          // Actualizar con la referencia a la fecha
          return await this.updateNote(noteId, {
            references: {
              type: 'date',
              id: dateStr
            }
          });
        } catch (error) {
          console.error('Error al vincular nota con fecha:', error);
          throw error;
        }
      },
      
      // Desvincular nota de cualquier referencia
      unlinkNote: async function(noteId) {
        if (!noteId) {
          throw new Error('Se requiere ID de nota para desvincular');
        }
        
        try {
          // Obtener nota existente
          const note = await this.getNoteById(noteId);
          if (!note) {
            throw new Error(`Nota con ID ${noteId} no encontrada`);
          }
          
          // Actualizar quitando referencias
          return await this.updateNote(noteId, {
            references: null,
            eventId: null // Para compatibilidad con versiones antiguas
          });
        } catch (error) {
          console.error('Error al desvincular nota:', error);
          throw error;
        }
      },
      
      // Obtener notas por etiqueta
      getNotesByTag: async function(tag) {
        if (!tag) return [];
        
        const notes = await this.getAllNotes();
        return notes.filter(note => 
          note.tags && Array.isArray(note.tags) && note.tags.includes(tag)
        );
      },
      
      // Limpiar referencias huérfanas
      cleanOrphanedReferences: async function() {
        try {
          const notes = await this.getAllNotes();
          const calendarModule = this.core.getModule('calendar');
          let updatedCount = 0;
          
          if (!calendarModule) {
            console.warn('Módulo de calendario no disponible para limpiar referencias');
            return 0;
          }
          
          const allEvents = calendarModule.getEvents();
          const eventIds = new Set(allEvents.map(event => event.id));
          
          // Encontrar notas con referencias a eventos que ya no existen
          const updatedNotes = notes.map(note => {
            if (note.references && note.references.type === 'event') {
              if (!eventIds.has(note.references.id)) {
                updatedCount++;
                return {
                  ...note,
                  references: null,
                  updatedAt: new Date().toISOString()
                };
              }
            }
            
            // Compatibilidad con versiones antiguas
            if (note.eventId && !eventIds.has(note.eventId)) {
              updatedCount++;
              return {
                ...note,
                eventId: null,
                updatedAt: new Date().toISOString()
              };
            }
            
            return note;
          });
          
          // Guardar si hubo cambios
          if (updatedCount > 0) {
            await this.core.storage.setItem(this.id, 'notes', updatedNotes);
            console.log(`Limpiadas ${updatedCount} referencias huérfanas`);
          }
          
          return updatedCount;
        } catch (error) {
          console.error('Error al limpiar referencias huérfanas:', error);
          return 0;
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
          
          // Crear la nota con la referencia al evento
          const note = await this.createNote({
            ...noteData,
            references: {
              type: 'event',
              id: eventId
            }
          });
          
          return note;
        } catch (error) {
          console.error('Error al convertir evento a nota:', error);
          throw error;
        }
      },
      
      // Métodos para React
      getNotesProvider: function() {
        return NotesProvider;
      },
      
      getNotesContext: function() {
        return NotesContext;
      },
      
      getNotesPanel: function() {
        return NotesPanel;
      }
    };
    
    // Registrar el módulo con la nueva API pública
    return this.core.registerModule('notes-manager', publicAPI);
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
      this._translations = null;
      
      return true;
    } catch (error) {
      console.error('Error al limpiar recursos del plugin de Notas:', error);
      return false;
    }
  }
};