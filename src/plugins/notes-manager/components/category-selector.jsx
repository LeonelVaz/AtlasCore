// src/plugins/notes-manager/components/category-selector.jsx
import React, { useState, useContext, useRef, useEffect } from 'react';
import { NotesContext } from '../contexts/notes-context';

/**
 * Componente para seleccionar y gestionar categorías
 */
const CategorySelector = ({ value, onChange, canCreate = true, inline = false }) => {
  const { 
    categories, 
    createCategory, 
    t 
  } = useContext(NotesContext);
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#4285F4');
  const dropdownRef = useRef(null);
  
  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);
  
  // Obtener nombre de la categoría seleccionada
  const selectedCategory = categories.find(category => category.id === value);
  
  // Manejar selección de categoría
  const handleSelect = (categoryId) => {
    if (onChange) {
      onChange(categoryId);
    }
    setIsOpen(false);
  };
  
  // Manejar creación de nueva categoría
  const handleCreateCategory = async (e) => {
    // Evitamos que se envíe el formulario
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    if (!newCategoryName.trim()) return;
    
    try {
      const newCategory = await createCategory({
        name: newCategoryName.trim(),
        color: newCategoryColor
      });
      
      if (onChange) {
        onChange(newCategory.id);
      }
      
      // Resetear formulario
      setNewCategoryName('');
      setNewCategoryColor('#4285F4');
      setShowCreateForm(false);
      setIsOpen(false);
    } catch (error) {
      console.error('Error al crear categoría:', error);
    }
  };
  
  // Renderizar componente inline (para formularios compactos)
  if (inline) {
    return (
      <div className="category-selector-inline">
        <select 
          value={value || ''}
          onChange={(e) => handleSelect(e.target.value || null)}
          className="category-select"
        >
          <option value="">{t('categories.none')}</option>
          {categories.map(category => (
            <option 
              key={category.id} 
              value={category.id}
              style={{ color: category.color }}
            >
              {category.name}
            </option>
          ))}
        </select>
        
        {canCreate && (
          <button 
            type="button"
            className="category-add-button"
            onClick={() => setShowCreateForm(true)}
            title={t('categories.create')}
          >
            <span className="material-icons">add</span>
          </button>
        )}
        
        {showCreateForm && (
          <div className="category-create-form-modal">
            <div className="category-create-form-content">
              <h3>{t('categories.createNew')}</h3>
              {/* Aquí cambiamos form por div */}
              <div className="category-create-div">
                <div className="category-form-field">
                  <label htmlFor="category-name">{t('categories.nameLabel')}</label>
                  <input
                    id="category-name"
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder={t('categories.namePlaceholder')}
                    required
                  />
                </div>
                <div className="category-form-field">
                  <label htmlFor="category-color">{t('categories.colorLabel')}</label>
                  <input
                    id="category-color"
                    type="color"
                    value={newCategoryColor}
                    onChange={(e) => setNewCategoryColor(e.target.value)}
                  />
                </div>
                <div className="category-form-actions">
                  <button 
                    type="button" 
                    onClick={() => setShowCreateForm(false)}
                    className="category-form-cancel"
                  >
                    {t('common.cancel')}
                  </button>
                  <button 
                    type="button"
                    onClick={handleCreateCategory}
                    className="category-form-submit"
                  >
                    {t('common.create')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  
  // Renderizar componente dropdown (versión normal)
  return (
    <div className="category-selector" ref={dropdownRef}>
      <div 
        className="category-selected"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedCategory ? (
          <>
            <span 
              className="category-color" 
              style={{ backgroundColor: selectedCategory.color }}
            ></span>
            <span className="category-name">{selectedCategory.name}</span>
          </>
        ) : (
          <span className="category-none">{t('categories.none')}</span>
        )}
        <span className="material-icons dropdown-arrow">
          {isOpen ? 'arrow_drop_up' : 'arrow_drop_down'}
        </span>
      </div>
      
      {isOpen && (
        <div className="category-dropdown">
          <div 
            className="category-option category-none"
            onClick={() => handleSelect(null)}
          >
            <span className="category-name">{t('categories.none')}</span>
          </div>
          
          {categories.map(category => (
            <div 
              key={category.id}
              className={`category-option ${category.id === value ? 'selected' : ''}`}
              onClick={() => handleSelect(category.id)}
            >
              <span 
                className="category-color" 
                style={{ backgroundColor: category.color }}
              ></span>
              <span className="category-name">{category.name}</span>
            </div>
          ))}
          
          {canCreate && !showCreateForm && (
            <div 
              className="category-option category-create"
              onClick={() => setShowCreateForm(true)}
            >
              <span className="material-icons">add</span>
              <span className="category-create-text">{t('categories.createNew')}</span>
            </div>
          )}
          
          {showCreateForm && (
            // Aquí cambiamos form por div
            <div className="category-create-div">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder={t('categories.namePlaceholder')}
                className="category-name-input"
                required
                autoFocus
              />
              <div className="category-color-field">
                <input
                  type="color"
                  value={newCategoryColor}
                  onChange={(e) => setNewCategoryColor(e.target.value)}
                  className="category-color-input"
                />
              </div>
              <div className="category-form-buttons">
                <button 
                  type="button" 
                  className="category-cancel-button"
                  onClick={() => setShowCreateForm(false)}
                >
                  {t('common.cancel')}
                </button>
                <button 
                  type="button" 
                  className="category-save-button"
                  onClick={handleCreateCategory}
                >
                  {t('common.create')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CategorySelector;