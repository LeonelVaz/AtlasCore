import React, { createContext, useState, useEffect, useCallback } from 'react';
import { sanitizeHtml } from '../utils/notes-utils';
import { getTranslation } from '../utils/i18n';

// Crear contexto
export const NotesContext = createContext();

// Proveedor del contexto
export const NotesProvider = ({ children, pluginId = 'notes-manager' }) => {
  const [notes, setNotes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [translations, setTranslations] = useState(null);
  
  // Función para obtener el servicio de almacenamiento
  const getStorageService = useCallback(() => {
    try {
      if (!window.__appModules || !window.__appModules['notes-manager']) {
        console.error('Módulo de notas no registrado');
        return null;
      }
      
      const notesModule = window.__appModules['notes-manager'];
      
      // Intentar obtener storage directamente desde el módulo
      if (notesModule.core?.storage) {
        return notesModule.core.storage;
      }
      
      // Si no está ahí, intentar obtenerlo a través del core global
      if (window.__appCore?.storage) {
        return window.__appCore.storage;
      }
      
      // Si todo falla, usar localStorage como fallback
      if (window.localStorage) {
        // Crear un adaptador simple para localStorage
        return {
          getItem: async (pluginId, key, defaultValue) => {
            const storageKey = `plugin.${pluginId}.${key}`;
            const value = localStorage.getItem(storageKey);
            if (value === null) return defaultValue;
            try {
              return JSON.parse(value);
            } catch (e) {
              return defaultValue;
            }
          },
          setItem: async (pluginId, key, value) => {
            const storageKey = `plugin.${pluginId}.${key}`;
            localStorage.setItem(storageKey, JSON.stringify(value));
            return true;
          }
        };
      }
      
      console.error('API de almacenamiento no disponible');
      return null;
    } catch (err) {
      console.error('Error al obtener servicio de almacenamiento:', err);
      return null;
    }
  }, []);
  
  // Obtener el bus de eventos
  const getEventBus = useCallback(() => {
    return window.__appModules?.['notes-manager']?.core?.events || null;
  }, []);
  
  // Cargar traducciones
  useEffect(() => {
    // Si el módulo de notas está cargado, usar sus traducciones
    const notesModule = window.__appModules?.['notes-manager'];
    if (notesModule && notesModule._translations) {
      setTranslations(notesModule._translations);
    } else {
      // De lo contrario, intentar cargar directamente
      import('../utils/i18n').then(i18n => {
        const userLang = navigator.language || navigator.userLanguage || 'es';
        const trans = i18n.loadTranslations(userLang);
        setTranslations(trans);
      }).catch(err => {
        console.error('Error al cargar traducciones:', err);
      });
    }
  }, []);
  
  // Cargar todas las notas
  const loadNotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const storageService = getStorageService();
      if (!storageService) {
        throw new Error('Servicio de almacenamiento no disponible');
      }
      
      const storedNotes = await storageService.getItem(pluginId, 'notes', []);
      setNotes(Array.isArray(storedNotes) ? storedNotes : []);
    } catch (error) {
      console.error('Error al cargar notas:', error);
      setError(error.message);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [pluginId, getStorageService]);
  
  // Cargar categorías
  const loadCategories = useCallback(async () => {
    try {
      const storageService = getStorageService();
      if (!storageService) {
        throw new Error('Servicio de almacenamiento no disponible');
      }
      
      const storedCategories = await storageService.getItem(pluginId, 'categories', []);
      setCategories(Array.isArray(storedCategories) ? storedCategories : []);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
      setCategories([]);
    }
  }, [pluginId, getStorageService]);
  
  // Cargar datos al iniciar
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([loadNotes(), loadCategories()]);
    };
    
    loadData();
    
    // Suscribirse a eventos de cambios
    const eventBus = getEventBus();
    
    if (eventBus) {
      const handlers = [
        { event: 'plugin.notes-manager.note_created', handler: loadNotes },
        { event: 'plugin.notes-manager.note_updated', handler: loadNotes },
        { event: 'plugin.notes-manager.note_deleted', handler: loadNotes },
        { event: 'plugin.notes-manager.category_created', handler: loadCategories },
        { event: 'plugin.notes-manager.category_updated', handler: loadCategories },
        { event: 'plugin.notes-manager.category_deleted', handler: loadCategories },
      ];
      
      // Registrar todos los handlers
      const unsubscribers = handlers.map(({ event, handler }) => 
        eventBus.subscribe(event, handler)
      );
      
      return () => {
        // Limpiar todas las suscripciones
        unsubscribers.forEach(unsub => unsub && unsub());
      };
    }
  }, [loadNotes, loadCategories, getEventBus]);
  
  // Método para crear una nota
  const createNote = useCallback(async (noteData) => {
    try {
      const storageService = getStorageService();
      if (!storageService) {
        throw new Error('Servicio de almacenamiento no disponible');
      }
      
      // Validar datos mínimos
      if (!noteData || !noteData.title) {
        throw new Error(getTranslation(translations, 'errors.titleRequired'));
      }
      
      // Sanitizar contenido HTML
      const sanitizedContent = sanitizeHtml(noteData.content || '');
      
      // Crear nueva nota
      const newNote = {
        id: `note_${Date.now()}`, // ID único
        title: noteData.title.trim(),
        content: sanitizedContent,
        date: noteData.date || new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        color: noteData.color || '#2D4B94',
        categoryId: noteData.categoryId || null,
        references: noteData.references || null,
        tags: noteData.tags || []
      };
      
      // Añadir a la colección
      const updatedNotes = [...notes, newNote];
      
      // Guardar en almacenamiento
      await storageService.setItem(pluginId, 'notes', updatedNotes);
      
      // Actualizar estado local
      setNotes(updatedNotes);
      
      // Publicar evento de creación
      const eventBus = getEventBus();
      if (eventBus) {
        eventBus.publish('plugin.notes-manager.note_created', { note: newNote });
      }
      
      return newNote;
    } catch (error) {
      console.error('Error al crear nota:', error);
      setError(error.message);
      throw error;
    }
  }, [notes, pluginId, getStorageService, getEventBus, translations]);
  
  // Método para actualizar una nota
  const updateNote = useCallback(async (noteId, noteData) => {
    try {
      const storageService = getStorageService();
      if (!storageService) {
        throw new Error('Servicio de almacenamiento no disponible');
      }
      
      // Encontrar nota existente
      const noteIndex = notes.findIndex(note => note.id === noteId);
      if (noteIndex === -1) {
        throw new Error(getTranslation(translations, 'errors.noteNotFound'));
      }
      
      // Sanitizar contenido HTML si se proporciona
      let sanitizedContent = noteData.content;
      if (sanitizedContent !== undefined) {
        sanitizedContent = sanitizeHtml(sanitizedContent);
      }
      
      // Guardar datos anteriores para el evento
      const previousData = { ...notes[noteIndex] };
      
      // Crear versión actualizada
      const updatedNote = {
        ...notes[noteIndex],
        ...noteData,
        content: sanitizedContent !== undefined ? sanitizedContent : notes[noteIndex].content,
        updatedAt: new Date().toISOString()
      };
      
      // Actualizar en la colección
      const updatedNotes = [...notes];
      updatedNotes[noteIndex] = updatedNote;
      
      // Guardar en almacenamiento
      await storageService.setItem(pluginId, 'notes', updatedNotes);
      
      // Actualizar estado local
      setNotes(updatedNotes);
      
      // Publicar evento de actualización
      const eventBus = getEventBus();
      if (eventBus) {
        eventBus.publish('plugin.notes-manager.note_updated', {
          note: updatedNote,
          previousData
        });
      }
      
      return updatedNote;
    } catch (error) {
      console.error('Error al actualizar nota:', error);
      setError(error.message);
      throw error;
    }
  }, [notes, pluginId, getStorageService, getEventBus, translations]);
  
  // Método para eliminar una nota
  const deleteNote = useCallback(async (noteId) => {
    try {
      const storageService = getStorageService();
      if (!storageService) {
        throw new Error('Servicio de almacenamiento no disponible');
      }
      
      // Filtrar la nota a eliminar
      const updatedNotes = notes.filter(note => note.id !== noteId);
      
      // Verificar si la nota existe
      if (updatedNotes.length === notes.length) {
        throw new Error(getTranslation(translations, 'errors.noteNotFound'));
      }
      
      // Guardar en almacenamiento
      await storageService.setItem(pluginId, 'notes', updatedNotes);
      
      // Actualizar estado local
      setNotes(updatedNotes);
      
      // Publicar evento de eliminación
      const eventBus = getEventBus();
      if (eventBus) {
        eventBus.publish('plugin.notes-manager.note_deleted', { id: noteId });
      }
      
      return true;
    } catch (error) {
      console.error('Error al eliminar nota:', error);
      setError(error.message);
      throw error;
    }
  }, [notes, pluginId, getStorageService, getEventBus, translations]);
  
  // Método para crear categoría
  const createCategory = useCallback(async (categoryData) => {
    try {
      const storageService = getStorageService();
      if (!storageService) {
        throw new Error('Servicio de almacenamiento no disponible');
      }
      
      // Validar datos mínimos
      if (!categoryData || !categoryData.name) {
        throw new Error(getTranslation(translations, 'errors.categoryNameRequired'));
      }
      
      // Crear nueva categoría
      const newCategory = {
        id: `category_${Date.now()}`,
        name: categoryData.name.trim(),
        color: categoryData.color || '#2D4B94',
        icon: categoryData.icon || 'folder'
      };
      
      // Añadir a la colección
      const updatedCategories = [...categories, newCategory];
      
      // Guardar en almacenamiento
      await storageService.setItem(pluginId, 'categories', updatedCategories);
      
      // Actualizar estado local
      setCategories(updatedCategories);
      
      // Publicar evento de creación
      const eventBus = getEventBus();
      if (eventBus) {
        eventBus.publish('plugin.notes-manager.category_created', { category: newCategory });
      }
      
      return newCategory;
    } catch (error) {
      console.error('Error al crear categoría:', error);
      setError(error.message);
      throw error;
    }
  }, [categories, pluginId, getStorageService, getEventBus, translations]);
  
  // Método para actualizar categoría
  const updateCategory = useCallback(async (categoryId, categoryData) => {
    try {
      const storageService = getStorageService();
      if (!storageService) {
        throw new Error('Servicio de almacenamiento no disponible');
      }
      
      // Encontrar categoría existente
      const categoryIndex = categories.findIndex(category => category.id === categoryId);
      if (categoryIndex === -1) {
        throw new Error(getTranslation(translations, 'errors.categoryNotFound'));
      }
      
      // Crear versión actualizada
      const updatedCategory = {
        ...categories[categoryIndex],
        ...categoryData
      };
      
      // Actualizar en la colección
      const updatedCategories = [...categories];
      updatedCategories[categoryIndex] = updatedCategory;
      
      // Guardar en almacenamiento
      await storageService.setItem(pluginId, 'categories', updatedCategories);
      
      // Actualizar estado local
      setCategories(updatedCategories);
      
      // Publicar evento de actualización
      const eventBus = getEventBus();
      if (eventBus) {
        eventBus.publish('plugin.notes-manager.category_updated', {
          category: updatedCategory
        });
      }
      
      return updatedCategory;
    } catch (error) {
      console.error('Error al actualizar categoría:', error);
      setError(error.message);
      throw error;
    }
  }, [categories, pluginId, getStorageService, getEventBus, translations]);
  
  // Método para eliminar categoría
  const deleteCategory = useCallback(async (categoryId) => {
    try {
      const storageService = getStorageService();
      if (!storageService) {
        throw new Error('Servicio de almacenamiento no disponible');
      }
      
      // Filtrar la categoría a eliminar
      const updatedCategories = categories.filter(category => category.id !== categoryId);
      
      // Verificar si la categoría existe
      if (updatedCategories.length === categories.length) {
        throw new Error(getTranslation(translations, 'errors.categoryNotFound'));
      }
      
      // Guardar en almacenamiento
      await storageService.setItem(pluginId, 'categories', updatedCategories);
      
      // Actualizar estado local
      setCategories(updatedCategories);
      
      // Actualizar notas que usaban esta categoría
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
      
      // Si hay notas afectadas, guardarlas también
      if (JSON.stringify(notes) !== JSON.stringify(updatedNotes)) {
        await storageService.setItem(pluginId, 'notes', updatedNotes);
        setNotes(updatedNotes);
      }
      
      // Publicar evento de eliminación
      const eventBus = getEventBus();
      if (eventBus) {
        eventBus.publish('plugin.notes-manager.category_deleted', { id: categoryId });
      }
      
      return true;
    } catch (error) {
      console.error('Error al eliminar categoría:', error);
      setError(error.message);
      throw error;
    }
  }, [notes, categories, pluginId, getStorageService, getEventBus, translations]);
  
  // Método para obtener notas por categoría
  const getNotesByCategory = useCallback((categoryId) => {
    if (!categoryId) return [];
    return notes.filter(note => note.categoryId === categoryId);
  }, [notes]);
  
  // Método para obtener notas por etiqueta
  const getNotesByTag = useCallback((tag) => {
    if (!tag) return [];
    return notes.filter(note => 
      note.tags && Array.isArray(note.tags) && note.tags.includes(tag)
    );
  }, [notes]);
  
  // Método para obtener notas por fecha
  const getNotesByDate = useCallback((date) => {
    if (!date) return [];
    
    const targetDate = new Date(date);
    
    // Comparar solo fecha (sin hora)
    return notes.filter(note => {
      // Si tiene referencia específica a fecha
      if (note.references && note.references.type === 'date') {
        const refDate = new Date(note.references.id);
        return refDate.toDateString() === targetDate.toDateString();
      }
      
      // Comprobar fecha general de la nota
      const noteDate = new Date(note.date || note.createdAt);
      return noteDate.toDateString() === targetDate.toDateString();
    });
  }, [notes]);
  
  // Método para obtener notas por evento
  const getNotesByEvent = useCallback((eventId) => {
    if (!eventId) return [];
    
    return notes.filter(note => {
      // Comprobar referencia directa al evento
      if (note.references && note.references.type === 'event') {
        return note.references.id === eventId;
      }
      
      // Compatibilidad con campo eventId para versiones antiguas
      return note.eventId === eventId;
    });
  }, [notes]);
  
  // Método para vincular nota con evento
  const linkNoteToEvent = useCallback(async (noteId, eventId) => {
    if (!noteId || !eventId) {
      throw new Error(getTranslation(translations, 'errors.missingIds'));
    }
    
    // Actualizar con la referencia al evento
    return await updateNote(noteId, {
      references: {
        type: 'event',
        id: eventId
      },
      eventId: null // Eliminar campo antiguo
    });
  }, [updateNote, translations]);
  
  // Método para vincular nota con fecha
  const linkNoteToDate = useCallback(async (noteId, date) => {
    if (!noteId || !date) {
      throw new Error(getTranslation(translations, 'errors.missingIdDate'));
    }
    
    // Formato ISO para la fecha
    const dateStr = date instanceof Date ? date.toISOString() : date;
    
    // Actualizar con la referencia a la fecha
    return await updateNote(noteId, {
      references: {
        type: 'date',
        id: dateStr
      },
      eventId: null // Eliminar campo antiguo
    });
  }, [updateNote, translations]);
  
  // Método para desvincular nota
  const unlinkNote = useCallback(async (noteId) => {
    if (!noteId) {
      throw new Error(getTranslation(translations, 'errors.missingId'));
    }
    
    // Eliminar cualquier referencia
    return await updateNote(noteId, {
      references: null,
      eventId: null // Compatibilidad
    });
  }, [updateNote, translations]);
  
  // Obtener etiquetas únicas de todas las notas
  const getAllTags = useCallback(() => {
    const tagsSet = new Set();
    
    notes.forEach(note => {
      if (note.tags && Array.isArray(note.tags)) {
        note.tags.forEach(tag => tagsSet.add(tag));
      }
    });
    
    return Array.from(tagsSet).sort();
  }, [notes]);
  
  // Valor del contexto
  const contextValue = {
    notes,
    categories,
    loading,
    error,
    t: (key) => getTranslation(translations, key),
    createNote,
    updateNote,
    deleteNote,
    getNotesByEvent,
    getNotesByDate,
    getNotesByCategory,
    getNotesByTag,
    refreshNotes: loadNotes,
    refreshCategories: loadCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    linkNoteToEvent,
    linkNoteToDate,
    unlinkNote,
    getAllTags
  };
  
  return (
    <NotesContext.Provider value={contextValue}>
      {children}
    </NotesContext.Provider>
  );
};

export default NotesContext;