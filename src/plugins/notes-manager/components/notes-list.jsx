import React, { useState } from 'react';
import NoteItem from './note-item';

const NotesList = ({ notes = [], onSelectNote, onDeleteNote }) => {
  const [filter, setFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest', 'oldest', 'title'
  
  // Filtrar notas según el texto de búsqueda
  const filteredNotes = notes.filter(note => {
    if (!filter) return true;
    
    const searchTerm = filter.toLowerCase();
    return (
      note.title.toLowerCase().includes(searchTerm) || 
      note.content.toLowerCase().includes(searchTerm)
    );
  });
  
  // Ordenar notas según criterio seleccionado
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    switch (sortOrder) {
      case 'newest':
        return new Date(b.modified) - new Date(a.modified);
      case 'oldest':
        return new Date(a.modified) - new Date(b.modified);
      case 'title':
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });
  
  // Agrupar notas por fecha para mostrarlas en secciones
  const getGroupedNotes = () => {
    if (sortOrder === 'title') {
      // Si ordenamos por título, no agrupamos
      return { 'Todas las notas': sortedNotes };
    }
    
    const groups = {};
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    sortedNotes.forEach(note => {
      const noteDate = new Date(note.modified);
      let groupName;
      
      if (noteDate.toDateString() === today.toDateString()) {
        groupName = 'Hoy';
      } else if (noteDate.toDateString() === yesterday.toDateString()) {
        groupName = 'Ayer';
      } else {
        // Formato fecha: 15 mayo 2023
        groupName = noteDate.toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      }
      
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      
      groups[groupName].push(note);
    });
    
    return groups;
  };
  
  const groupedNotes = getGroupedNotes();
  
  return (
    <div className="notes-list-container">
      <div className="notes-list-controls">
        <div className="notes-search">
          <input
            type="text"
            placeholder="Buscar notas..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="notes-search-input"
          />
          {filter && (
            <button 
              className="notes-search-clear"
              onClick={() => setFilter('')}
              title="Limpiar búsqueda"
            >
              <span className="material-icons">close</span>
            </button>
          )}
        </div>
        
        <div className="notes-sort">
          <select 
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="notes-sort-select"
          >
            <option value="newest">Más recientes</option>
            <option value="oldest">Más antiguas</option>
            <option value="title">Por título</option>
          </select>
        </div>
      </div>
      
      {Object.keys(groupedNotes).length === 0 ? (
        <div className="notes-empty">
          <p>No hay notas para mostrar</p>
          {filter && <p>Prueba con otra búsqueda</p>}
        </div>
      ) : (
        <div className="notes-list">
          {Object.entries(groupedNotes).map(([groupName, groupNotes]) => (
            <div key={groupName} className="notes-group">
              <h3 className="notes-group-title">{groupName}</h3>
              <div className="notes-group-items">
                {groupNotes.map(note => (
                  <NoteItem
                    key={note.id}
                    note={note}
                    onSelect={() => onSelectNote(note)}
                    onDelete={() => onDeleteNote(note.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotesList;