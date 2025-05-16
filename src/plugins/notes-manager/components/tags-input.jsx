import React, { useState, useEffect, useRef, useContext } from 'react';
import { NotesContext } from '../contexts/notes-context';

/**
 * Componente para gestionar etiquetas (tags) de notas
 */
const TagsInput = ({ value = [], onChange, suggestions = [], maxTags = 10 }) => {
  const [tags, setTags] = useState([]);
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const { getAllTags, t } = useContext(NotesContext);
  
  // Sincronizar con el valor externo
  useEffect(() => {
    if (Array.isArray(value)) {
      setTags(value);
    } else {
      setTags([]);
    }
  }, [value]);
  
  // Obtener sugerencias de etiquetas existentes
  useEffect(() => {
    // Si no hay sugerencias explícitas, usar las etiquetas globales
    if (!suggestions || suggestions.length === 0) {
      const globalTags = getAllTags();
      setFilteredSuggestions(globalTags);
    } else {
      setFilteredSuggestions(suggestions);
    }
  }, [suggestions, getAllTags]);
  
  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target) &&
          inputRef.current && !inputRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Filtrar sugerencias según el input
  useEffect(() => {
    if (input.trim() === '') {
      // Mostrar todas las sugerencias o las más recientes
      setFilteredSuggestions(suggestions || getAllTags());
    } else {
      // Filtrar sugerencias que contienen el texto de entrada
      const allSuggestions = suggestions || getAllTags();
      const filtered = allSuggestions.filter(
        tag => tag.toLowerCase().includes(input.toLowerCase())
      );
      setFilteredSuggestions(filtered);
    }
  }, [input, suggestions, getAllTags]);
  
  // Añadir una etiqueta
  const addTag = (tag) => {
    tag = tag.trim();
    if (!tag) return;
    
    // Normalizar: eliminar espacios extras, convertir a minúsculas, etc.
    const normalizedTag = tag.toLowerCase();
    
    // Verificar si ya existe
    if (tags.some(t => t.toLowerCase() === normalizedTag)) {
      return;
    }
    
    // Verificar límite
    if (tags.length >= maxTags) {
      return;
    }
    
    // Añadir nueva etiqueta
    const updatedTags = [...tags, tag];
    setTags(updatedTags);
    
    // Notificar cambio
    if (onChange) {
      onChange(updatedTags);
    }
    
    // Limpiar input
    setInput('');
  };
  
  // Eliminar una etiqueta
  const removeTag = (index) => {
    const updatedTags = [...tags];
    updatedTags.splice(index, 1);
    setTags(updatedTags);
    
    // Notificar cambio
    if (onChange) {
      onChange(updatedTags);
    }
    
    // Enfocar el input después de eliminar
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  // Manejar input del usuario
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);
    
    // Mostrar sugerencias si hay texto
    setShowSuggestions(true);
  };
  
  // Manejar teclas especiales
  const handleKeyDown = (e) => {
    // Enter para añadir etiqueta
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(input);
    }
    
    // Coma para añadir etiqueta (común en inputs de tags)
    if (e.key === ',') {
      e.preventDefault();
      addTag(input);
    }
    
    // Backspace para eliminar última etiqueta si el input está vacío
    if (e.key === 'Backspace' && input === '' && tags.length > 0) {
      removeTag(tags.length - 1);
    }
    
    // Escape para cerrar sugerencias
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };
  
  // Manejar clic en una sugerencia
  const handleSuggestionClick = (suggestion) => {
    addTag(suggestion);
    setShowSuggestions(false);
  };
  
  // Enfocar el input al hacer clic en el contenedor
  const handleContainerClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div 
      className="tags-input-container" 
      onClick={handleContainerClick}
    >
      <div className="tags-input">
        {/* Etiquetas actuales */}
        {tags.map((tag, index) => (
          <div key={index} className="tag">
            <span className="tag-text">{tag}</span>
            <button 
              type="button" 
              className="tag-remove"
              onClick={() => removeTag(index)}
              title={t('tags.remove')}
            >
              &times;
            </button>
          </div>
        ))}
        
        {/* Input para nuevas etiquetas */}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          placeholder={tags.length === 0 ? t('tags.placeholder') : ''}
          className="tags-input-field"
          disabled={tags.length >= maxTags}
        />
      </div>
      
      {/* Limitador de etiquetas */}
      {maxTags > 0 && (
        <div className="tags-limit">
          {tags.length} / {maxTags}
        </div>
      )}
      
      {/* Sugerencias de etiquetas */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="tags-suggestions" ref={suggestionsRef}>
          {filteredSuggestions
            .filter(suggestion => !tags.includes(suggestion))
            .slice(0, 10)
            .map((suggestion, index) => (
              <div 
                key={index}
                className="tag-suggestion"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
};

export default TagsInput;