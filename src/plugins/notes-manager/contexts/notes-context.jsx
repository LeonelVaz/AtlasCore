import React, { createContext, useState, useEffect, useCallback } from 'react';
import { sanitizeHtml, isSameDay, groupNotesByDate } from '../utils/notes-utils';
import { getTranslation, loadTranslations } from '../utils/i18n';

// Crear contexto
export const NotesContext = createContext();

/**
 * Proveedor del contexto para gestionar notas
 * Maneja el estado global y las operaciones CRUD para notas
 */
export const NotesProvider = ({ children, pluginId = 'notes-manager' }) => {
  // Estados
  const [notes, setNotes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [translations, setTranslations] = useState(null);
  
  // Cargar traducciones al inicio
  useEffect(() => {
    const userLang = navigator.language || navigator.userLanguage || 'es';
    const trans = loadTranslations(userLang);
    setTranslations(trans);
  }, []);
  
  // Función para obtener el servicio de almacenamiento
  const getStorageService = useCallback(() => {
    try {
      // Intentar obtener el storage desde el módulo Notes Manager
      if (window.__appModules && window.__appModules['notes-manager']) {
        const notesModule = window.__appModules['notes-manager'];
        if (notesModule.core?.storage) {
          return notesModule.core.storage;
        }
      }
      
      // Intentar obtener el storage desde el core global
      if (window.__appCore?.storage) {
        return window.__appCore.storage;
      }
      
      // Fallback a localStorage
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
    } catch (err) {
      console.error('Error al obtener servicio de almacenamiento:', err);
      return null;
    }
  }, []);
  
  // Función para obtener el bus de eventos
  const getEventBus = useCallback(() => {
    // Intentar obtener el bus de eventos desde el módulo o el core
    if (window.__appModules?.['notes-manager']?.core?.events) {
      return window.__appModules['notes-manager'].core.events;
    }
    
    if (window.__appCore?.events) {
      return window.__appCore.events;
    }
    
    return null;
  }, []);
  
  // Cargar todas las notas desde el almacenamiento
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
      
      // Limpiar referencias huérfanas automáticamente
      await cleanOrphanedReferences(storedNotes);
    } catch (error) {
      console.error('Error al cargar notas:', error);
      setError(error.message);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [pluginId, getStorageService]);
  
  // Cargar categorías desde el almacenamiento
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
  
  // Limpiar referencias huérfanas (eventos que ya no existen)
  const cleanOrphanedReferences = useCallback(async (notesToClean = null) => {
    try {
      const storageService = getStorageService();
      if (!storageService) return 0;
      
      // Usar las notas proporcionadas o cargarlas
      const notesArray = notesToClean || await storageService.getItem(pluginId, 'notes', []);
      
      // Obtener todos los eventos del calendario
      let eventIds = new Set();
      
      // Intentar obtener el módulo de calendario
      if (window.__appModules && window.__appModules['calendar']) {
        const calendarModule = window.__appModules['calendar'];
        if (typeof calendarModule.getEvents === 'function') {
          const events = calendarModule.getEvents();
          eventIds = new Set(events.map(event => event.id));
        }
      }
      
      // Si no hay eventos, no hay nada que limpiar
      if (eventIds.size === 0) return 0;
      
      let updatedCount = 0;
      
      // Buscar y actualizar notas con referencias a eventos inexistentes
      const updatedNotes = notesArray.map(note => {
        // Comprobar referencias de tipo 'event'
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
        
        // Comprobar campo eventId para compatibilidad con versiones antiguas
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
        await storageService.setItem(pluginId, 'notes', updatedNotes);
        setNotes(updatedNotes);
        console.log(`Limpiadas ${updatedCount} referencias huérfanas`);
      }
      
      return updatedCount;
    } catch (error) {
      console.error('Error al limpiar referencias huérfanas:', error);
      return 0;
    }
  }, [pluginId, getStorageService]);
  
  // Método para crear una nota
  const createNote = useCallback(async (noteData) => {
    try {
      const storageService = getStorageService();
      if (!storageService) {
        throw new Error('Servicio de almacenamiento no disponible');
      }
      
      // Validar título
      if (!noteData || !noteData.title.trim()) {
        throw new Error(getTranslation(translations, 'errors.titleRequired'));
      }
      
      // Sanitizar contenido HTML
      const sanitizedContent = sanitizeHtml(noteData.content || '');
      
      // Crear nueva nota
      const newNote = {
        id: `note_${Date.now()}`,
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
      
      // Guardar la nota
      const updatedNotes = [...notes, newNote];
      await storageService.setItem(pluginId, 'notes', updatedNotes);
      setNotes(updatedNotes);
      
      // Publicar evento
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
      
      // Encontrar la nota
      const noteIndex = notes.findIndex(note => note.id === noteId);
      if (noteIndex === -1) {
        throw new Error(getTranslation(translations, 'errors.noteNotFound'));
      }
      
      // Guardar datos originales para evento
      const previousData = { ...notes[noteIndex] };
      
      // Sanitizar contenido si se actualizó
      let sanitizedContent = noteData.content;
      if (sanitizedContent !== undefined) {
        sanitizedContent = sanitizeHtml(sanitizedContent);
      }
      
      // Crear nota actualizada
      const updatedNote = {
        ...notes[noteIndex],
        ...noteData,
        content: sanitizedContent !== undefined ? sanitizedContent : notes[noteIndex].content,
        updatedAt: new Date().toISOString()
      };
      
      // Guardar cambios
      const updatedNotes = [...notes];
      updatedNotes[noteIndex] = updatedNote;
      await storageService.setItem(pluginId, 'notes', updatedNotes);
      setNotes(updatedNotes);
      
      // Publicar evento
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
      
      // Verificar que la nota existía
      if (updatedNotes.length === notes.length) {
        throw new Error(getTranslation(translations, 'errors.noteNotFound'));
      }
      
      // Guardar cambios
      await storageService.setItem(pluginId, 'notes', updatedNotes);
      setNotes(updatedNotes);
      
      // Publicar evento
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
      
      // Validar nombre
      if (!categoryData || !categoryData.name.trim()) {
        throw new Error(getTranslation(translations, 'errors.categoryNameRequired'));
      }
      
      // Crear nueva categoría
      const newCategory = {
        id: `category_${Date.now()}`,
        name: categoryData.name.trim(),
        color: categoryData.color || '#2D4B94',
        icon: categoryData.icon || 'folder'
      };
      
      // Guardar categoría
      const updatedCategories = [...categories, newCategory];
      await storageService.setItem(pluginId, 'categories', updatedCategories);
      setCategories(updatedCategories);
      
      // Publicar evento
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
      
      // Encontrar la categoría
      const categoryIndex = categories.findIndex(category => category.id === categoryId);
      if (categoryIndex === -1) {
        throw new Error(getTranslation(translations, 'errors.categoryNotFound'));
      }
      
      // Crear categoría actualizada
      const updatedCategory = {
        ...categories[categoryIndex],
        ...categoryData
      };
      
      // Guardar cambios
      const updatedCategories = [...categories];
      updatedCategories[categoryIndex] = updatedCategory;
      await storageService.setItem(pluginId, 'categories', updatedCategories);
      setCategories(updatedCategories);
      
      // Publicar evento
      const eventBus = getEventBus();
      if (eventBus) {
        eventBus.publish('plugin.notes-manager.category_updated', { category: updatedCategory });
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
      
      // Verificar que la categoría existe
      const categoryIndex = categories.findIndex(category => category.id === categoryId);
      if (categoryIndex === -1) {
        throw new Error(getTranslation(translations, 'errors.categoryNotFound'));
      }
      
      // Eliminar la categoría
      const updatedCategories = categories.filter(category => category.id !== categoryId);
      await storageService.setItem(pluginId, 'categories', updatedCategories);
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
      
      // Guardar notas actualizadas
      await storageService.setItem(pluginId, 'notes', updatedNotes);
      setNotes(updatedNotes);
      
      // Publicar evento
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
    
    return notes.filter(note => {
      // Si tiene referencia específica a fecha
      if (note.references && note.references.type === 'date') {
        const refDate = new Date(note.references.id);
        return isSameDay(refDate, targetDate);
      }
      
      // Comprobar fecha de la nota
      const noteDate = new Date(note.date || note.createdAt);
      return isSameDay(noteDate, targetDate);
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
  
  // Obtener etiquetas únicas
  const getAllTags = useCallback(() => {
    const tagsSet = new Set();
    
    notes.forEach(note => {
      if (note.tags && Array.isArray(note.tags)) {
        note.tags.forEach(tag => tagsSet.add(tag));
      }
    });
    
    return Array.from(tagsSet).sort();
  }, [notes]);
  
  // Traducción simplificada
  const t = useCallback((key) => {
    return getTranslation(translations, key);
  }, [translations]);
  
  // Valor del contexto
  const contextValue = {
    notes,
    categories,
    loading,
    error,
    t,
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
    getAllTags,
    cleanOrphanedReferences
  };
  
  return (
    <NotesContext.Provider value={contextValue}>
      {children}
    </NotesContext.Provider>
  );
};

export default NotesContext;