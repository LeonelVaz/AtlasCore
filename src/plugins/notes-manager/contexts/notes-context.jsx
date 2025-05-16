import React, { createContext, useState, useEffect, useCallback } from 'react';

// Crear contexto
export const NotesContext = createContext();

// Proveedor del contexto
export const NotesProvider = ({ children, pluginId = 'notes-manager' }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
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
  
  // Cargar notas al iniciar
  useEffect(() => {
    loadNotes();
    
    // Suscribirse a eventos de cambios en notas
    const eventBus = window.__appModules?.['notes-manager']?.core?.events;
    
    if (eventBus) {
      const unsub1 = eventBus.subscribe('plugin.notes-manager.noteCreated', loadNotes);
      const unsub2 = eventBus.subscribe('plugin.notes-manager.noteUpdated', loadNotes);
      const unsub3 = eventBus.subscribe('plugin.notes-manager.noteDeleted', loadNotes);
      
      return () => {
        unsub1 && unsub1();
        unsub2 && unsub2();
        unsub3 && unsub3();
      };
    }
  }, [loadNotes]);
  
  // Método para crear una nota
  const createNote = useCallback(async (noteData) => {
    try {
      const storageService = getStorageService();
      if (!storageService) {
        throw new Error('Servicio de almacenamiento no disponible');
      }
      
      // Validar datos mínimos
      if (!noteData || !noteData.title) {
        throw new Error('Se requiere al menos un título para la nota');
      }
      
      // Crear nueva nota
      const newNote = {
        id: `note_${Date.now()}`, // ID único
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
      await storageService.setItem(pluginId, 'notes', updatedNotes);
      
      // Actualizar estado local
      setNotes(updatedNotes);
      
      // Publicar evento de creación
      const eventBus = window.__appModules?.['notes-manager']?.core?.events;
      if (eventBus) {
        eventBus.publish('plugin.notes-manager.noteCreated', newNote);
      }
      
      return newNote;
    } catch (error) {
      console.error('Error al crear nota:', error);
      setError(error.message);
      throw error;
    }
  }, [notes, pluginId, getStorageService]);
  
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
        throw new Error(`Nota con ID ${noteId} no encontrada`);
      }
      
      // Crear versión actualizada
      const updatedNote = {
        ...notes[noteIndex],
        ...noteData,
        modified: new Date().toISOString()
      };
      
      // Actualizar en la colección
      const updatedNotes = [...notes];
      updatedNotes[noteIndex] = updatedNote;
      
      // Guardar en almacenamiento
      await storageService.setItem(pluginId, 'notes', updatedNotes);
      
      // Actualizar estado local
      setNotes(updatedNotes);
      
      // Publicar evento de actualización
      const eventBus = window.__appModules?.['notes-manager']?.core?.events;
      if (eventBus) {
        eventBus.publish('plugin.notes-manager.noteUpdated', updatedNote);
      }
      
      return updatedNote;
    } catch (error) {
      console.error('Error al actualizar nota:', error);
      setError(error.message);
      throw error;
    }
  }, [notes, pluginId, getStorageService]);
  
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
        throw new Error(`Nota con ID ${noteId} no encontrada`);
      }
      
      // Guardar en almacenamiento
      await storageService.setItem(pluginId, 'notes', updatedNotes);
      
      // Actualizar estado local
      setNotes(updatedNotes);
      
      // Publicar evento de eliminación
      const eventBus = window.__appModules?.['notes-manager']?.core?.events;
      if (eventBus) {
        eventBus.publish('plugin.notes-manager.noteDeleted', { id: noteId });
      }
      
      return true;
    } catch (error) {
      console.error('Error al eliminar nota:', error);
      setError(error.message);
      throw error;
    }
  }, [notes, pluginId, getStorageService]);
  
  // Método para obtener notas por ID de evento
  const getNotesByEvent = useCallback((eventId) => {
    if (!eventId) return [];
    return notes.filter(note => note.eventId === eventId);
  }, [notes]);
  
  // Método para obtener notas por fecha
  const getNotesByDate = useCallback((date) => {
    if (!date) return [];
    
    const targetDate = new Date(date);
    
    // Comparar solo fecha (sin hora)
    return notes.filter(note => {
      const noteDate = new Date(note.date);
      return noteDate.toDateString() === targetDate.toDateString();
    });
  }, [notes]);
  
  // Valor del contexto
  const contextValue = {
    notes,
    loading,
    error,
    createNote,
    updateNote,
    deleteNote,
    getNotesByEvent,
    getNotesByDate,
    refreshNotes: loadNotes
  };
  
  return (
    <NotesContext.Provider value={contextValue}>
      {children}
    </NotesContext.Provider>
  );
};

export default NotesContext;