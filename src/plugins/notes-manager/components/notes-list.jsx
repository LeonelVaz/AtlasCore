import React, { useState, useContext } from 'react';
import NoteItem from './note-item';
import { NotesContext } from '../contexts/notes-context';

const NotesList = ({ notes = [], onSelectNote, onDeleteNote }) => {
  const { categories, t } = useContext(NotesContext);
  const [filter, setFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('');
  
  // Obtener todas las etiquetas únicas de las notas
  const getAllTags = () => {
    const tagsSet = new Set();
    
    notes.forEach(note => {
      if (note.tags && Array.isArray(note.tags)) {
        note.tags.forEach(tag => tagsSet.add(tag));
      }
    });
    
    return Array.from(tagsSet).sort();
  };
  
  // Filtrar notas según criterios
  const getFilteredNotes = () => {
    let filtered = [...notes];
    
    // Filtro de texto
    if (filter) {
      const searchTerm = filter.toLowerCase();
      filtered = filtered.filter(note => {
        // Buscar en título y contenido
        const titleMatch = note.title.toLowerCase().includes(searchTerm);
        // Para el contenido, eliminamos primero las etiquetas HTML
        const contentText = note.content.replace(/<[^>]*>/g, '');
        const contentMatch = contentText.toLowerCase().includes(searchTerm);
        // Buscar en etiquetas
        const tagsMatch = note.tags && Array.isArray(note.tags) && 
          note.tags.some(tag => tag.toLowerCase().includes(searchTerm));
        
        return titleMatch || contentMatch || tagsMatch;
      });
    }
    
    // Filtro de categoría
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(note => {
        if (categoryFilter === 'uncategorized') {
          return !note.categoryId;
        }
        return note.categoryId === categoryFilter;
      });
    }
    
    // Filtro de etiqueta
    if (tagFilter) {
      filtered = filtered.filter(note => 
        note.tags && Array.isArray(note.tags) && 
        note.tags.includes(tagFilter)
      );
    }
    
    // Ordenar según criterio
    return sortNotes(filtered, sortOrder);
  };
  
  // Ordenar notas según criterio
  const sortNotes = (notesToSort, order) => {
    switch (order) {
      case 'newest':
        return [...notesToSort].sort((a, b) => 
          new Date(b.updatedAt || b.modified) - new Date(a.updatedAt || a.modified)
        );
      case 'oldest':
        return [...notesToSort].sort((a, b) => 
          new Date(a.updatedAt || a.modified) - new Date(b.updatedAt || b.modified)
        );
      case 'title':
        return [...notesToSort].sort((a, b) => 
          a.title.localeCompare(b.title)
        );
      case 'category':
        return [...notesToSort].sort((a, b) => {
          // Primero por categoría
          const catA = categories.find(cat => cat.id === a.categoryId);
          const catB = categories.find(cat => cat.id === b.categoryId);
          
          if (!catA && !catB) return 0;
          if (!catA) return 1;
          if (!catB) return -1;
          
          const catCompare = catA.name.localeCompare(catB.name);
          
          // Si son de la misma categoría, ordenar por título
          if (catCompare === 0) {
            return a.title.localeCompare(b.title);
          }
          
          return catCompare;
        });
      default:
        return notesToSort;
    }
  };
  
  // Agrupar notas por fecha
  const getGroupedNotes = (notesToGroup) => {
    // Si ordenamos por título o categoría, no agrupamos por fecha
    if (sortOrder === 'title' || sortOrder === 'category') {
      return { [t('notes.allNotes')]: notesToGroup };
    }
    
    const groups = {};
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    notesToGroup.forEach(note => {
      const noteDate = new Date(note.updatedAt || note.modified);
      let groupName;
      
      if (noteDate.toDateString() === today.toDateString()) {
        groupName = t('dates.today');
      } else if (noteDate.toDateString() === yesterday.toDateString()) {
        groupName = t('dates.yesterday');
      } else if (noteDate > lastWeek) {
        groupName = t('dates.thisWeek');
      } else if (noteDate > lastMonth) {
        groupName = t('dates.thisMonth');
      } else {
        // Formato fecha: mayo 2023
        groupName = noteDate.toLocaleDateString('es-ES', {
          month: 'long',
          year: 'numeric'
        });
        
        // Capitalizar primera letra
        groupName = groupName.charAt(0).toUpperCase() + groupName.slice(1);
      }
      
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      
      groups[groupName].push(note);
    });
    
    return groups;
  };
  
  // Obtener notas filtradas
  const filteredNotes = getFilteredNotes();
  
  // Agrupar notas según criterio
  const groupedNotes = getGroupedNotes(filteredNotes);
  
  // Limpiar todos los filtros
  const clearFilters = () => {
    setFilter('');
    setCategoryFilter('all');
    setTagFilter('');
  };
  
  return (
    <div className="notes-list-container">
      <div className="notes-list-controls">
        <div className="notes-search">
          <input
            type="text"
            placeholder={t('search.placeholder')}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="notes-search-input"
          />
          {filter && (
            <button 
              className="notes-search-clear"
              onClick={() => setFilter('')}
              title={t('search.clear')}
            >
              <span className="material-icons">close</span>
            </button>
          )}
        </div>
        
        <div className="notes-filters">
          <select 
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="notes-sort-select"
          >
            <option value="newest">{t('sort.newest')}</option>
            <option value="oldest">{t('sort.oldest')}</option>
            <option value="title">{t('sort.byTitle')}</option>
            {categories.length > 0 && (
              <option value="category">{t('sort.byCategory')}</option>
            )}
          </select>
          
          {categories.length > 0 && (
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="notes-category-filter"
            >
              <option value="all">{t('categories.allCategories')}</option>
              <option value="uncategorized">{t('categories.uncategorized')}</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          )}
          
          {getAllTags().length > 0 && (
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="notes-tag-filter"
            >
              <option value="">{t('tags.allTags')}</option>
              {getAllTags().map(tag => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          )}
          
          {(filter || categoryFilter !== 'all' || tagFilter) && (
            <button 
              className="notes-filter-clear"
              onClick={clearFilters}
              title={t('filters.clearAll')}
            >
              <span className="material-icons">filter_alt_off</span>
            </button>
          )}
        </div>
      </div>
      
      <div className="notes-filter-summary">
        {filteredNotes.length === 0 ? (
          <span>{t('search.noResults')}</span>
        ) : (
          <span>
            {filteredNotes.length} {filteredNotes.length === 1 
              ? t('notes.noteFound') 
              : t('notes.notesFound')}
          </span>
        )}
      </div>
      
      {filteredNotes.length === 0 ? (
        <div className="notes-empty">
          <p>{t('notes.noNotes')}</p>
          {(filter || categoryFilter !== 'all' || tagFilter) && (
            <p>{t('search.tryOtherFilters')}</p>
          )}
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