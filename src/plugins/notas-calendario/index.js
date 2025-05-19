/**
 * Plugin "Administrador de Notas" para Atlas
 * Permite añadir, organizar y visualizar notas asociadas con fechas y eventos del calendario
 */

import React, { useState, useEffect } from 'react';

// Intentamos importar los estilos (pero manejamos el caso donde la importación pueda fallar)
try {
  // Importar los estilos - esto funcionará en entornos donde los estilos pueden ser importados
  require('./notas-plugin.css');
} catch (e) {
  // Silenciar el error ya que puede que estemos en un entorno donde no se pueden importar estilos
  console.log('Los estilos del plugin se cargarán de forma alternativa');
}

// Componente para mostrar indicador de notas en una celda del día
const DayCellNotesIndicator = (props) => {
  const [notes, setNotes] = useState([]);
  const [showPopover, setShowPopover] = useState(false);
  const { day, hour, minutes, date, pluginId, extensionId, core } = props;
  
  // Cargar notas para este día
  useEffect(() => {
    const loadNotes = async () => {
      try {
        // Formato de fecha YYYY-MM-DD
        const dateKey = date.toISOString().split('T')[0];
        
        // Cargar notas del almacenamiento
        const dayNotes = await core.storage.getItem(pluginId, `notes_day_${dateKey}`, []);
        setNotes(dayNotes);
      } catch (error) {
        console.error(`[NotesPlugin] Error al cargar notas para el día:`, error);
      }
    };
    
    loadNotes();
  }, [date, pluginId, core]);
  
  // No mostrar nada si no hay notas
  if (notes.length === 0) return null;
  
  // Manejar clic en el indicador
  const handleIndicatorClick = (e) => {
    e.stopPropagation();
    setShowPopover(prev => !prev);
  };
  
  // Manejar clic fuera del popover para cerrarlo
  useEffect(() => {
    if (!showPopover) return;
    
    const handleClickOutside = (e) => {
      if (e.target.closest('.day-cell-notes-popover')) return;
      if (e.target.closest('.day-cell-notes-indicator')) return;
      setShowPopover(false);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showPopover]);
  
  return (
    <>
      <div 
        className={`day-cell-notes-indicator ${notes.some(note => note.isNew) ? 'has-new-notes' : ''}`}
        onClick={handleIndicatorClick}
        title={`${notes.length} nota${notes.length !== 1 ? 's' : ''}`}
      >
        {notes.length}
      </div>
      
      {showPopover && (
        <div className="day-cell-notes-popover">
          <h3>
            Notas para {date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
            <button className="close-button" onClick={() => setShowPopover(false)}>
              <span className="material-icons">close</span>
            </button>
          </h3>
          
          <div className="notes-list">
            {notes.map((note, index) => (
              <div key={index} className="note-item">
                <div className="note-title">{note.title}</div>
                <div className="note-content">
                  <core.ui.components.RichTextViewer content={note.content} maxHeight="120px" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

// Componente para mostrar y editar notas asociadas a un evento
const EventNotes = (props) => {
  const [notes, setNotes] = useState([]);
  const [showEditor, setShowEditor] = useState(false);
  const [currentNote, setCurrentNote] = useState({ title: '', content: '' });
  const [editingIndex, setEditingIndex] = useState(-1);
  const { event, isEditing, pluginId, extensionId, core } = props;
  
  // Cargar notas para este evento
  useEffect(() => {
    const loadEventNotes = async () => {
      try {
        if (!event || !event.id) return;
        
        // Cargar notas del almacenamiento
        const eventNotes = await core.storage.getItem(pluginId, `notes_event_${event.id}`, []);
        setNotes(eventNotes);
      } catch (error) {
        console.error(`[NotesPlugin] Error al cargar notas del evento:`, error);
      }
    };
    
    loadEventNotes();
  }, [event, pluginId, core]);
  
  // Guardar notas
  const saveNotes = async (updatedNotes) => {
    try {
      if (!event || !event.id) return;
      
      await core.storage.setItem(pluginId, `notes_event_${event.id}`, updatedNotes);
      
      // Publicar evento de notas actualizadas
      core.events.publish(pluginId, 'notesPlugin.eventNotesUpdated', {
        eventId: event.id,
        notes: updatedNotes
      });
    } catch (error) {
      console.error(`[NotesPlugin] Error al guardar notas:`, error);
    }
  };
  
  // Manejar cambios en el editor
  const handleNoteChange = (field, value) => {
    setCurrentNote(prev => ({ ...prev, [field]: value }));
  };
  
  // Guardar nota actual
  const saveCurrentNote = async () => {
    // Validar que haya contenido
    if (!currentNote.title.trim() && !currentNote.content.trim()) {
      return;
    }
    
    // Crear objeto de nota
    const noteToSave = {
      ...currentNote,
      id: editingIndex >= 0 ? notes[editingIndex].id : `note_${Date.now()}`,
      created: editingIndex >= 0 ? notes[editingIndex].created : new Date().toISOString(),
      updated: new Date().toISOString()
    };
    
    // Actualizar o añadir la nota
    let updatedNotes;
    if (editingIndex >= 0) {
      updatedNotes = [...notes];
      updatedNotes[editingIndex] = noteToSave;
    } else {
      updatedNotes = [...notes, noteToSave];
    }
    
    // Guardar en almacenamiento
    await saveNotes(updatedNotes);
    
    // Actualizar estado
    setNotes(updatedNotes);
    setShowEditor(false);
    setCurrentNote({ title: '', content: '' });
    setEditingIndex(-1);
  };
  
  // Eliminar nota
  const deleteNote = async (index) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta nota?')) {
      return;
    }
    
    const updatedNotes = [...notes];
    updatedNotes.splice(index, 1);
    
    await saveNotes(updatedNotes);
    setNotes(updatedNotes);
  };
  
  // Editar nota existente
  const editNote = (index) => {
    const note = notes[index];
    setCurrentNote({ title: note.title, content: note.content });
    setEditingIndex(index);
    setShowEditor(true);
  };
  
  return (
    <div className="event-notes">
      <h4>
        <span className="material-icons">note</span>
        Notas
        <button 
          className="add-note-button"
          onClick={() => {
            setCurrentNote({ title: '', content: '' });
            setEditingIndex(-1);
            setShowEditor(true);
          }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto' }}
        >
          <span className="material-icons">add</span>
        </button>
      </h4>
      
      {notes.length > 0 ? (
        <div className="event-notes-list">
          {notes.map((note, index) => (
            <div key={note.id} className="event-note-item">
              <div className="note-header">
                <h5>{note.title || 'Nota sin título'}</h5>
                <div className="note-actions">
                  <button onClick={() => editNote(index)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <span className="material-icons">edit</span>
                  </button>
                  <button onClick={() => deleteNote(index)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <span className="material-icons">delete</span>
                  </button>
                </div>
              </div>
              
              <div className="note-content">
                <core.ui.components.RichTextViewer content={note.content} maxHeight="100px" />
              </div>
            </div>
          ))}
        </div>
      ) : !showEditor ? (
        <div className="no-notes-message">No hay notas para este evento</div>
      ) : null}
      
      {showEditor && (
        <div className="note-editor">
          <input
            type="text"
            placeholder="Título de la nota"
            value={currentNote.title}
            onChange={(e) => handleNoteChange('title', e.target.value)}
            style={{ width: '100%', marginBottom: '8px', padding: '8px' }}
          />
          
          <core.ui.components.RichTextEditor
            value={currentNote.content}
            onChange={(content) => handleNoteChange('content', content)}
            height="150px"
            toolbar="full"
          />
          
          <div className="editor-actions" style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
            <button 
              onClick={saveCurrentNote}
              style={{ padding: '8px 16px', backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Guardar
            </button>
            <button 
              onClick={() => setShowEditor(false)}
              style={{ padding: '8px 16px', backgroundColor: 'var(--bg-color-secondary)', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente para la navegación en la barra lateral
const NotesNavigationItem = (props) => {
  const { onNavigate, pluginId } = props;
  
  const handleClick = () => {
    onNavigate(pluginId, 'notes-dashboard');
  };
  
  return (
    <div 
      className="sidebar-item"
      onClick={handleClick}
      style={{ display: 'flex', alignItems: 'center', padding: '8px', cursor: 'pointer' }}
    >
      <span className="material-icons" style={{ marginRight: '8px' }}>description</span>
      <span>Notas</span>
    </div>
  );
};

// Componente para la página principal del plugin
const NotesDashboard = (props) => {
  const { pluginId, core } = props;
  const [eventNotes, setEventNotes] = useState([]);
  const [dayNotes, setDayNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  
  // Cargar datos al iniciar
  useEffect(() => {
    const loadAllNotes = async () => {
      try {
        setIsLoading(true);
        
        // Cargar lista de claves de almacenamiento
        const eventKeys = await core.storage.getKeys(pluginId);
        
        // Filtrar claves de eventos y días
        const eventNoteKeys = eventKeys.filter(key => key.startsWith('notes_event_'));
        const dayNoteKeys = eventKeys.filter(key => key.startsWith('notes_day_'));
        
        // Cargar notas de eventos
        const eventNotesPromises = eventNoteKeys.map(async key => {
          const eventId = key.replace('notes_event_', '');
          const notes = await core.storage.getItem(pluginId, key, []);
          
          // Obtener información del evento
          const calendarModule = core.getModule('calendar');
          const event = calendarModule.getEvent(eventId);
          
          return {
            eventId,
            event,
            notes,
            totalNotes: notes.length
          };
        });
        
        // Cargar notas de días
        const dayNotesPromises = dayNoteKeys.map(async key => {
          const dateKey = key.replace('notes_day_', '');
          const notes = await core.storage.getItem(pluginId, key, []);
          
          return {
            dateKey,
            date: new Date(dateKey),
            notes,
            totalNotes: notes.length
          };
        });
        
        // Resolver todas las promesas
        const resolvedEventNotes = await Promise.all(eventNotesPromises);
        const resolvedDayNotes = await Promise.all(dayNotesPromises);
        
        // Filtrar entradas sin notas
        const filteredEventNotes = resolvedEventNotes.filter(item => item.totalNotes > 0);
        const filteredDayNotes = resolvedDayNotes.filter(item => item.totalNotes > 0);
        
        // Ordenar por fecha más reciente
        filteredEventNotes.sort((a, b) => {
          if (!a.event || !b.event) return 0;
          return new Date(b.event.start) - new Date(a.event.start);
        });
        
        filteredDayNotes.sort((a, b) => b.date - a.date);
        
        setEventNotes(filteredEventNotes);
        setDayNotes(filteredDayNotes);
      } catch (error) {
        console.error('[NotesPlugin] Error al cargar todas las notas:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAllNotes();
  }, [pluginId, core]);
  
  // Renderizar pestaña de notas de eventos
  const renderEventNotesTab = () => {
    if (eventNotes.length === 0) {
      return <div className="no-notes-message">No hay notas asociadas a eventos</div>;
    }
    
    return (
      <div className="event-notes-list">
        {eventNotes.map(item => (
          <div key={item.eventId} className="dashboard-note-item">
            <div className="note-event-info">
              {item.event ? (
                <>
                  <h4>{item.event.title}</h4>
                  <div className="event-date">
                    {new Date(item.event.start).toLocaleDateString('es-ES')}
                  </div>
                </>
              ) : (
                <h4>Evento ya no disponible</h4>
              )}
            </div>
            
            <div className="event-notes-summary">
              <h5>{item.totalNotes} nota{item.totalNotes !== 1 ? 's' : ''}</h5>
              
              <div className="notes-list">
                {item.notes.map((note, index) => (
                  <div key={index} className="note-preview">
                    <div className="note-title">{note.title || 'Nota sin título'}</div>
                    <div className="note-content">
                      <core.ui.components.RichTextViewer content={note.content} maxHeight="80px" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // Renderizar pestaña de notas de días
  const renderDayNotesTab = () => {
    if (dayNotes.length === 0) {
      return <div className="no-notes-message">No hay notas asociadas a días</div>;
    }
    
    return (
      <div className="day-notes-list">
        {dayNotes.map(item => (
          <div key={item.dateKey} className="dashboard-note-item">
            <div className="note-day-info">
              <h4>{item.date.toLocaleDateString('es-ES', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}</h4>
            </div>
            
            <div className="day-notes-summary">
              <h5>{item.totalNotes} nota{item.totalNotes !== 1 ? 's' : ''}</h5>
              
              <div className="notes-list">
                {item.notes.map((note, index) => (
                  <div key={index} className="note-preview">
                    <div className="note-title">{note.title || 'Nota sin título'}</div>
                    <div className="note-content">
                      <core.ui.components.RichTextViewer content={note.content} maxHeight="80px" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // Renderizar pestaña de próximas notas
  const renderUpcomingNotesTab = () => {
    // Filtrar eventos futuros
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const upcomingEvents = eventNotes.filter(item => {
      if (!item.event) return false;
      return new Date(item.event.start) >= today;
    });
    
    // Filtrar días futuros
    const upcomingDays = dayNotes.filter(item => {
      return item.date >= today;
    });
    
    if (upcomingEvents.length === 0 && upcomingDays.length === 0) {
      return <div className="no-notes-message">No hay notas para próximos eventos o días</div>;
    }
    
    return (
      <div className="upcoming-notes">
        {upcomingEvents.length > 0 && (
          <div className="upcoming-notes-section">
            <h4>Próximos eventos con notas</h4>
            <div className="event-notes-list">
              {upcomingEvents.map(item => (
                <div key={item.eventId} className="dashboard-note-item upcoming">
                  <div className="note-event-info">
                    <h4>{item.event.title}</h4>
                    <div className="event-date">
                      {new Date(item.event.start).toLocaleDateString('es-ES')}
                    </div>
                  </div>
                  
                  <div className="event-notes-summary">
                    <div className="note-count">{item.totalNotes} nota{item.totalNotes !== 1 ? 's' : ''}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {upcomingDays.length > 0 && (
          <div className="upcoming-notes-section">
            <h4>Próximos días con notas</h4>
            <div className="day-notes-list">
              {upcomingDays.map(item => (
                <div key={item.dateKey} className="dashboard-note-item upcoming">
                  <div className="note-day-info">
                    <h4>{item.date.toLocaleDateString('es-ES', { 
                      weekday: 'long', 
                      day: 'numeric', 
                      month: 'long'
                    })}</h4>
                  </div>
                  
                  <div className="day-notes-summary">
                    <div className="note-count">{item.totalNotes} nota{item.totalNotes !== 1 ? 's' : ''}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="notes-dashboard">
      <h2>Administrador de Notas</h2>
      
      <div className="notes-dashboard-tabs">
        <button 
          className={`tab-button ${activeTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setActiveTab('upcoming')}
        >
          Próximas
        </button>
        <button 
          className={`tab-button ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          Eventos
        </button>
        <button 
          className={`tab-button ${activeTab === 'days' ? 'active' : ''}`}
          onClick={() => setActiveTab('days')}
        >
          Días
        </button>
      </div>
      
      <div className="notes-dashboard-content">
        {isLoading ? (
          <div className="loading-indicator">Cargando notas...</div>
        ) : (
          <>
            {activeTab === 'upcoming' && renderUpcomingNotesTab()}
            {activeTab === 'events' && renderEventNotesTab()}
            {activeTab === 'days' && renderDayNotesTab()}
          </>
        )}
      </div>
    </div>
  );
};

// Definición principal del plugin
export default {
  id: 'notas-calendario',
  name: 'Administrador de Notas',
  version: '1.0.0',
  description: 'Añade, organiza y visualiza notas detalladas asociadas con fechas y eventos del calendario',
  author: 'Atlas Team',
  minAppVersion: '0.3.0',
  permissions: ['storage', 'events', 'ui'],
  
  // Referencia al objeto core
  _core: null,
  
  // Método de inicialización
  init: function(core) {
    try {
      // Guardar referencia al core
      this._core = core;
      
      console.log('[NotasPlugin] Inicializando plugin...');
      
      // Registrar extensiones UI
      
      // 1. Indicadores de notas en celdas del día
      core.ui.registerExtension(
        this.id,
        core.ui.getExtensionZones().CALENDAR_DAY_CELL,
        (props) => React.createElement(DayCellNotesIndicator, { ...props, core })
      );
      
      // 2. Notas en la vista de detalle de eventos
      core.ui.registerExtension(
        this.id,
        core.ui.getExtensionZones().EVENT_DETAIL_VIEW,
        (props) => React.createElement(EventNotes, { ...props, core })
      );
      
      // 3. Elemento de navegación en la barra lateral
      core.ui.registerExtension(
        this.id,
        core.ui.getExtensionZones().MAIN_NAVIGATION,
        NotesNavigationItem
      );
      
      // 4. Página del dashboard de notas
      core.ui.registerExtension(
        this.id,
        core.ui.getExtensionZones().PLUGIN_PAGES,
        (props) => React.createElement(NotesDashboard, { ...props, core }),
        { props: { pageId: 'notes-dashboard' } }
      );
      
      // Suscribirse a eventos relevantes
      this._setupEventListeners();
      
      console.log('[NotasPlugin] Plugin inicializado correctamente');
      return true;
    } catch (error) {
      console.error('[NotasPlugin] Error al inicializar plugin:', error);
      return false;
    }
  },
  
  // Configurar listeners de eventos
  _setupEventListeners: function() {
    // Suscribirse a creación/edición de eventos
    this._core.events.subscribe(
      this.id,
      'calendar.eventCreated',
      this._handleEventCreated.bind(this)
    );
    
    this._core.events.subscribe(
      this.id,
      'calendar.eventUpdated',
      this._handleEventUpdated.bind(this)
    );
    
    this._core.events.subscribe(
      this.id,
      'calendar.eventDeleted',
      this._handleEventDeleted.bind(this)
    );
  },
  
  // Manejadores de eventos
  _handleEventCreated: function(eventData) {
    console.log('[NotasPlugin] Nuevo evento creado:', eventData);
    // Aquí podría mostrarse una notificación o realizar alguna acción
  },
  
  _handleEventUpdated: function(eventData) {
    console.log('[NotasPlugin] Evento actualizado:', eventData);
    // Aquí podría actualizarse alguna referencia si cambia el ID del evento
  },
  
  _handleEventDeleted: function(eventData) {
    // Limpiar notas asociadas al evento eliminado
    this._cleanupDeletedEventNotes(eventData.id);
  },
  
  // Limpiar notas de eventos eliminados
  _cleanupDeletedEventNotes: async function(eventId) {
    try {
      if (!eventId) return;
      
      // Eliminar notas del evento
      await this._core.storage.removeItem(this.id, `notes_event_${eventId}`);
      
      console.log(`[NotasPlugin] Notas eliminadas para el evento ${eventId}`);
    } catch (error) {
      console.error('[NotasPlugin] Error al limpiar notas de evento eliminado:', error);
    }
  },
  
  // Método de limpieza
  cleanup: function() {
    try {
      // El sistema limpiará automáticamente las extensiones UI
      // El sistema limpiará automáticamente las suscripciones a eventos
      
      console.log('[NotasPlugin] Plugin limpiado correctamente');
      return true;
    } catch (error) {
      console.error('[NotasPlugin] Error durante la limpieza:', error);
      return false;
    }
  },
  
  // API pública para otros plugins
  publicAPI: {
    getNotesForEvent: async function(eventId) {
      return await this._core.storage.getItem(this.id, `notes_event_${eventId}`, []);
    },
    
    getNotesForDay: async function(date) {
      const dateKey = date instanceof Date 
        ? date.toISOString().split('T')[0]
        : new Date(date).toISOString().split('T')[0];
      
      return await this._core.storage.getItem(this.id, `notes_day_${dateKey}`, []);
    },
    
    addNoteToEvent: async function(eventId, note) {
      const notes = await this._core.storage.getItem(this.id, `notes_event_${eventId}`, []);
      const updatedNotes = [...notes, { ...note, id: `note_${Date.now()}` }];
      await this._core.storage.setItem(this.id, `notes_event_${eventId}`, updatedNotes);
      return updatedNotes;
    },
    
    addNoteToDay: async function(date, note) {
      const dateKey = date instanceof Date 
        ? date.toISOString().split('T')[0]
        : new Date(date).toISOString().split('T')[0];
      
      const notes = await this._core.storage.getItem(this.id, `notes_day_${dateKey}`, []);
      const updatedNotes = [...notes, { ...note, id: `note_${Date.now()}` }];
      await this._core.storage.setItem(this.id, `notes_day_${dateKey}`, updatedNotes);
      return updatedNotes;
    }
  }
};