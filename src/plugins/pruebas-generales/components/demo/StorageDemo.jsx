/**
 * StorageDemo.jsx
 * Componente para demostrar capacidades de almacenamiento persistente
 */

import logger from '../../utils/logger';
import constants from '../../constants';
import { publishDemoEvent } from '../../api/eventManager';

/**
 * Componente de demostración de almacenamiento
 */
function StorageDemo(props) {
  const React = window.React;
  const { useState, useEffect, useRef } = React;
  
  // Extraer propiedades
  const { core, plugin } = props;
  
  // Referencias
  const autoSaveTimerRef = useRef(null);
  
  // Estados locales
  const [items, setItems] = useState([]);
  const [currentKey, setCurrentKey] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [itemDetails, setItemDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
  const [storageUsage, setStorageUsage] = useState({
    items: 0,
    bytesUsed: 0,
    bytesLimit: 1024 * 1024 // 1MB por defecto
  });
  
  // Efecto para cargar datos iniciales
  useEffect(() => {
    loadStorageItems();
    
    // Publicar evento de vista
    publishDemoEvent(core, plugin, 'storage-demo', 'viewed');
    
    // Configurar temporizador para calcular uso
    const usageTimer = setInterval(calculateStorageUsage, 5000);
    
    // Limpiar temporizadores al desmontar
    return () => {
      clearInterval(usageTimer);
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [core, plugin]);
  
  /**
   * Cargar elementos desde el almacenamiento
   */
  const loadStorageItems = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Obtener índice de claves (simulado para la demostración)
      // En un caso real, necesitaríamos mantener un índice de claves almacenadas
      const storageIndex = await core.storage.getItem(
        plugin.id,
        '_storage_index',
        []
      );
      
      // Cargar elementos
      const loadedItems = [];
      
      for (const key of storageIndex) {
        try {
          const value = await core.storage.getItem(plugin.id, key, null);
          
          loadedItems.push({
            key,
            value,
            size: calculateSize(value),
            lastModified: Date.now() // En un caso real, almacenaríamos esto con el valor
          });
        } catch (err) {
          logger.warn(`Error al cargar elemento '${key}':`, err);
        }
      }
      
      setItems(loadedItems);
      calculateStorageUsage(loadedItems);
    } catch (error) {
      logger.error('Error al cargar elementos de almacenamiento:', error);
      setError('Error al cargar elementos. Verifica la consola para más detalles.');
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Calcular tamaño de un valor en bytes (aproximado)
   */
  const calculateSize = (value) => {
    if (value === null || value === undefined) {
      return 0;
    }
    
    const valueStr = JSON.stringify(value);
    return new Blob([valueStr]).size;
  };
  
  /**
   * Calcular uso de almacenamiento
   */
  const calculateStorageUsage = (itemsList = null) => {
    const itemsToCalculate = itemsList || items;
    
    let totalBytes = 0;
    itemsToCalculate.forEach(item => {
      totalBytes += item.size;
      
      // Añadir tamaño estimado de la clave
      totalBytes += new Blob([item.key]).size;
    });
    
    // Añadir espacio para metadatos del índice
    totalBytes += calculateSize(itemsToCalculate.map(item => item.key));
    
    setStorageUsage({
      items: itemsToCalculate.length,
      bytesUsed: totalBytes,
      bytesLimit: 1024 * 1024 // 1MB por defecto
    });
  };
  
  /**
   * Guardar un elemento en el almacenamiento
   */
  const handleSaveItem = async () => {
    if (!currentKey.trim()) {
      setError('La clave no puede estar vacía');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      // Intentar parsear el valor como JSON si es posible
      let valueToStore;
      
      try {
        valueToStore = JSON.parse(currentValue);
      } catch (e) {
        // Si no es JSON válido, almacenar como string
        valueToStore = currentValue;
      }
      
      // Almacenar valor
      await core.storage.setItem(plugin.id, currentKey, valueToStore);
      
      // Actualizar índice de claves
      const storageIndex = await core.storage.getItem(
        plugin.id,
        '_storage_index',
        []
      );
      
      if (!storageIndex.includes(currentKey)) {
        storageIndex.push(currentKey);
        await core.storage.setItem(plugin.id, '_storage_index', storageIndex);
      }
      
      // Actualizar lista de elementos
      const newItem = {
        key: currentKey,
        value: valueToStore,
        size: calculateSize(valueToStore),
        lastModified: Date.now()
      };
      
      setItems(prevItems => {
        const updatedItems = [...prevItems];
        const existingIndex = updatedItems.findIndex(item => item.key === currentKey);
        
        if (existingIndex >= 0) {
          updatedItems[existingIndex] = newItem;
        } else {
          updatedItems.push(newItem);
        }
        
        return updatedItems;
      });
      
      setSuccessMessage(`Elemento '${currentKey}' guardado correctamente`);
      
      // Calcular uso de almacenamiento
      calculateStorageUsage();
      
      // Publicar evento de demo
      publishDemoEvent(core, plugin, 'storage-demo', 'item-saved', {
        key: currentKey,
        size: calculateSize(valueToStore)
      });
    } catch (error) {
      logger.error(`Error al guardar elemento '${currentKey}':`, error);
      setError(`Error al guardar elemento '${currentKey}'. Verifica la consola para más detalles.`);
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Cargar un elemento del almacenamiento para edición
   */
  const handleLoadItem = (key) => {
    const item = items.find(item => item.key === key);
    
    if (item) {
      setCurrentKey(item.key);
      setCurrentValue(typeof item.value === 'object' 
        ? JSON.stringify(item.value, null, 2) 
        : String(item.value)
      );
      
      setItemDetails(item);
      
      // Publicar evento de demo
      publishDemoEvent(core, plugin, 'storage-demo', 'item-loaded', {
        key: item.key
      });
    }
  };
  
  /**
   * Eliminar un elemento del almacenamiento
   */
  const handleDeleteItem = async (key) => {
    if (!window.confirm(`¿Estás seguro de eliminar el elemento '${key}'?`)) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      // Eliminar elemento
      await core.storage.removeItem(plugin.id, key);
      
      // Actualizar índice de claves
      const storageIndex = await core.storage.getItem(
        plugin.id,
        '_storage_index',
        []
      );
      
      const updatedIndex = storageIndex.filter(k => k !== key);
      await core.storage.setItem(plugin.id, '_storage_index', updatedIndex);
      
      // Actualizar lista de elementos
      setItems(prevItems => prevItems.filter(item => item.key !== key));
      
      // Si es el elemento actual, limpiar campos
      if (currentKey === key) {
        setCurrentKey('');
        setCurrentValue('');
        setItemDetails(null);
      }
      
      setSuccessMessage(`Elemento '${key}' eliminado correctamente`);
      
      // Calcular uso de almacenamiento
      calculateStorageUsage();
      
      // Publicar evento de demo
      publishDemoEvent(core, plugin, 'storage-demo', 'item-deleted', {
        key
      });
    } catch (error) {
      logger.error(`Error al eliminar elemento '${key}':`, error);
      setError(`Error al eliminar elemento '${key}'. Verifica la consola para más detalles.`);
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Limpiar todos los elementos del almacenamiento
   */
  const handleClearStorage = async () => {
    if (!window.confirm('¿Estás seguro de eliminar TODOS los elementos del almacenamiento?')) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      // En un caso real, usaríamos core.storage.clearPluginData()
      // Para la demostración, eliminamos cada elemento individualmente
      
      // Obtener índice de claves
      const storageIndex = await core.storage.getItem(
        plugin.id,
        '_storage_index',
        []
      );
      
      // Eliminar cada elemento
      for (const key of storageIndex) {
        await core.storage.removeItem(plugin.id, key);
      }
      
      // Limpiar índice
      await core.storage.setItem(plugin.id, '_storage_index', []);
      
      // Actualizar lista de elementos
      setItems([]);
      
      // Limpiar campos de edición
      setCurrentKey('');
      setCurrentValue('');
      setItemDetails(null);
      
      setSuccessMessage('Almacenamiento limpiado correctamente');
      
      // Calcular uso de almacenamiento
      calculateStorageUsage([]);
      
      // Publicar evento de demo
      publishDemoEvent(core, plugin, 'storage-demo', 'storage-cleared');
    } catch (error) {
      logger.error('Error al limpiar almacenamiento:', error);
      setError('Error al limpiar almacenamiento. Verifica la consola para más detalles.');
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Manejar cambio en el editor
   */
  const handleValueChange = (e) => {
    setCurrentValue(e.target.value);
    
    // Si autoguardado está habilitado, programar guardado
    if (autoSaveEnabled) {
      // Cancelar temporizador anterior si existe
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      
      // Programar nuevo guardado
      autoSaveTimerRef.current = setTimeout(() => {
        if (currentKey) {
          handleSaveItem();
        }
      }, 2000); // Autoguardar después de 2 segundos de inactividad
    }
  };
  
  /**
   * Manejar cambio de autoguardado
   */
  const handleAutoSaveChange = (e) => {
    setAutoSaveEnabled(e.target.checked);
    
    // Si se desactiva, cancelar temporizador pendiente
    if (!e.target.checked && autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
  };
  
  /**
   * Crear nuevos ejemplos predefinidos
   */
  const handleCreateExamples = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      // Ejemplos a crear
      const examples = [
        {
          key: 'example-string',
          value: 'Este es un ejemplo de cadena de texto'
        },
        {
          key: 'example-number',
          value: 42
        },
        {
          key: 'example-boolean',
          value: true
        },
        {
          key: 'example-array',
          value: [1, 2, 3, 'cuatro', { cinco: 5 }]
        },
        {
          key: 'example-object',
          value: {
            nombre: 'Ejemplo',
            descripcion: 'Un objeto JSON de ejemplo',
            propiedades: {
              anidado: true,
              valores: [10, 20, 30]
            }
          }
        }
      ];
      
      // Obtener índice actual
      const storageIndex = await core.storage.getItem(
        plugin.id,
        '_storage_index',
        []
      );
      
      // Nuevos elementos
      const newItems = [];
      
      // Guardar cada ejemplo
      for (const example of examples) {
        // Almacenar valor
        await core.storage.setItem(plugin.id, example.key, example.value);
        
        // Actualizar índice
        if (!storageIndex.includes(example.key)) {
          storageIndex.push(example.key);
        }
        
        // Añadir a nuevos elementos
        newItems.push({
          key: example.key,
          value: example.value,
          size: calculateSize(example.value),
          lastModified: Date.now()
        });
      }
      
      // Guardar índice actualizado
      await core.storage.setItem(plugin.id, '_storage_index', storageIndex);
      
      // Actualizar lista de elementos
      setItems(prevItems => {
        const updatedItems = [...prevItems];
        
        // Reemplazar o añadir cada ejemplo
        for (const newItem of newItems) {
          const existingIndex = updatedItems.findIndex(item => item.key === newItem.key);
          
          if (existingIndex >= 0) {
            updatedItems[existingIndex] = newItem;
          } else {
            updatedItems.push(newItem);
          }
        }
        
        return updatedItems;
      });
      
      setSuccessMessage('Ejemplos creados correctamente');
      
      // Calcular uso de almacenamiento
      calculateStorageUsage();
      
      // Publicar evento de demo
      publishDemoEvent(core, plugin, 'storage-demo', 'examples-created', {
        count: examples.length
      });
    } catch (error) {
      logger.error('Error al crear ejemplos:', error);
      setError('Error al crear ejemplos. Verifica la consola para más detalles.');
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Formatear tamaño para mostrar
   */
  const formatSize = (bytes) => {
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  };
  
  /**
   * Formatear tipo de valor para mostrar
   */
  const formatType = (value) => {
    if (value === null || value === undefined) {
      return 'null';
    }
    
    const type = typeof value;
    
    if (type === 'object') {
      if (Array.isArray(value)) {
        return 'array';
      }
      return 'object';
    }
    
    return type;
  };
  
  // Renderizar demo de almacenamiento
  return React.createElement(
    'div',
    { className: 'pg-storage-demo' },
    [
      // Información
      React.createElement(
        'div',
        { key: 'info', className: 'pg-demo-info' },
        [
          React.createElement('h2', { key: 'title' }, 'Demostración de Almacenamiento Persistente'),
          React.createElement(
            'p',
            { key: 'desc' },
            'Esta demostración muestra cómo usar el sistema de almacenamiento persistente para guardar y recuperar datos en tu plugin.'
          )
        ]
      ),
      
      // Mensajes de estado
      (error || successMessage) && React.createElement(
        'div',
        { 
          key: 'messages',
          className: `pg-messages ${error ? 'pg-messages-error' : 'pg-messages-success'}`
        },
        error || successMessage
      ),
      
      // Contenido principal
      React.createElement(
        'div',
        { key: 'main', className: 'pg-storage-container' },
        [
          // Lista de elementos
          React.createElement(
            'div',
            { key: 'items', className: 'pg-storage-items' },
            [
              React.createElement(
                'div',
                { key: 'header', className: 'pg-items-header' },
                [
                  React.createElement('h3', { key: 'title' }, 'Elementos almacenados'),
                  React.createElement(
                    'div',
                    { key: 'actions', className: 'pg-items-actions' },
                    [
                      React.createElement(
                        'button',
                        {
                          key: 'refresh',
                          className: 'pg-button pg-button-small',
                          onClick: loadStorageItems,
                          disabled: isLoading
                        },
                        [
                          React.createElement(
                            'span',
                            { key: 'icon', className: 'material-icons pg-icon-small' },
                            'refresh'
                          ),
                          'Actualizar'
                        ]
                      ),
                      React.createElement(
                        'button',
                        {
                          key: 'examples',
                          className: 'pg-button pg-button-small pg-button-primary',
                          onClick: handleCreateExamples,
                          disabled: isLoading
                        },
                        [
                          React.createElement(
                            'span',
                            { key: 'icon', className: 'material-icons pg-icon-small' },
                            'add'
                          ),
                          'Crear ejemplos'
                        ]
                      ),
                      React.createElement(
                        'button',
                        {
                          key: 'clear',
                          className: 'pg-button pg-button-small pg-button-danger',
                          onClick: handleClearStorage,
                          disabled: isLoading || items.length === 0
                        },
                        [
                          React.createElement(
                            'span',
                            { key: 'icon', className: 'material-icons pg-icon-small' },
                            'delete'
                          ),
                          'Limpiar todo'
                        ]
                      )
                    ]
                  )
                ]
              ),
              
              // Lista de elementos
              React.createElement(
                'div',
                { key: 'list', className: 'pg-items-list' },
                isLoading
                  ? React.createElement(
                      'div',
                      { className: 'pg-loading-small' },
                      'Cargando elementos...'
                    )
                  : items.length > 0
                    ? items.map(item => React.createElement(
                        'div',
                        {
                          key: item.key,
                          className: `pg-item ${itemDetails && itemDetails.key === item.key ? 'pg-item-active' : ''}`,
                          onClick: () => handleLoadItem(item.key)
                        },
                        [
                          React.createElement(
                            'div',
                            { key: 'details', className: 'pg-item-details' },
                            [
                              React.createElement('span', { key: 'key', className: 'pg-item-key' }, item.key),
                              React.createElement(
                                'span',
                                { key: 'meta', className: 'pg-item-meta' },
                                `${formatSize(item.size)} | ${formatType(item.value)}`
                              )
                            ]
                          ),
                          React.createElement(
                            'div',
                            { key: 'actions', className: 'pg-item-actions' },
                            [
                              React.createElement(
                                'button',
                                {
                                  key: 'delete',
                                  className: 'pg-button-icon',
                                  onClick: (e) => {
                                    e.stopPropagation();
                                    handleDeleteItem(item.key);
                                  },
                                  title: 'Eliminar elemento'
                                },
                                React.createElement(
                                  'span',
                                  { className: 'material-icons' },
                                  'delete'
                                )
                              )
                            ]
                          )
                        ]
                      ))
                    : React.createElement(
                        'div',
                        { className: 'pg-items-empty' },
                        'No hay elementos almacenados. Crea uno nuevo o usa "Crear ejemplos".'
                      )
              ),
              
              // Información de uso
              React.createElement(
                'div',
                { key: 'usage', className: 'pg-storage-usage' },
                [
                  React.createElement(
                    'div',
                    { key: 'stats', className: 'pg-usage-stats' },
                    [
                      React.createElement(
                        'span',
                        { key: 'items' },
                        `${storageUsage.items} elementos`
                      ),
                      React.createElement(
                        'span',
                        { key: 'separator' },
                        '|'
                      ),
                      React.createElement(
                        'span',
                        { key: 'usage' },
                        `${formatSize(storageUsage.bytesUsed)} / ${formatSize(storageUsage.bytesLimit)}`
                      )
                    ]
                  ),
                  
                  // Barra de progreso
                  React.createElement(
                    'div',
                    { key: 'progress', className: 'pg-usage-progress' },
                    React.createElement(
                      'div',
                      {
                        className: 'pg-usage-bar',
                        style: { width: `${Math.min(100, (storageUsage.bytesUsed / storageUsage.bytesLimit) * 100)}%` }
                      }
                    )
                  )
                ]
              )
            ]
          ),
          
          // Editor
          React.createElement(
            'div',
            { key: 'editor', className: 'pg-storage-editor' },
            [
              React.createElement(
                'div',
                { key: 'header', className: 'pg-editor-header' },
                [
                  React.createElement('h3', { key: 'title' }, 'Editor de elementos'),
                  React.createElement(
                    'div',
                    { key: 'actions', className: 'pg-editor-actions' },
                    [
                      React.createElement(
                        'label',
                        { key: 'autosave', className: 'pg-checkbox-label' },
                        [
                          React.createElement(
                            'input',
                            {
                              key: 'input',
                              type: 'checkbox',
                              checked: autoSaveEnabled,
                              onChange: handleAutoSaveChange
                            }
                          ),
                          'Autoguardado'
                        ]
                      ),
                      React.createElement(
                        'button',
                        {
                          key: 'save',
                          className: 'pg-button pg-button-primary',
                          onClick: handleSaveItem,
                          disabled: isLoading || !currentKey
                        },
                        [
                          React.createElement(
                            'span',
                            { key: 'icon', className: 'material-icons pg-icon-small' },
                            'save'
                          ),
                          'Guardar'
                        ]
                      )
                    ]
                  )
                ]
              ),
              
              // Formulario
              React.createElement(
                'div',
                { key: 'form', className: 'pg-editor-form' },
                [
                  // Campo: Clave
                  React.createElement(
                    'div',
                    { key: 'key', className: 'pg-form-group' },
                    [
                      React.createElement('label', { key: 'label', htmlFor: 'element-key' }, 'Clave:'),
                      React.createElement(
                        'input',
                        {
                          key: 'input',
                          type: 'text',
                          id: 'element-key',
                          className: 'pg-input',
                          value: currentKey,
                          onChange: (e) => setCurrentKey(e.target.value),
                          placeholder: 'Nombre de la clave'
                        }
                      )
                    ]
                  ),
                  
                  // Campo: Valor
                  React.createElement(
                    'div',
                    { key: 'value', className: 'pg-form-group' },
                    [
                      React.createElement('label', { key: 'label', htmlFor: 'element-value' }, 'Valor:'),
                      React.createElement(
                        'textarea',
                        {
                          key: 'input',
                          id: 'element-value',
                          className: 'pg-textarea pg-code-editor',
                          value: currentValue,
                          onChange: handleValueChange,
                          placeholder: 'Valor (texto plano o JSON)',
                          rows: 10
                        }
                      ),
                      React.createElement(
                        'small',
                        { key: 'help', className: 'pg-help-text' },
                        'Puedes escribir texto plano o JSON válido.'
                      )
                    ]
                  )
                ]
              ),
              
              // Detalles del elemento actual
              itemDetails && React.createElement(
                'div',
                { key: 'details', className: 'pg-element-details' },
                [
                  React.createElement('h4', { key: 'title' }, 'Detalles del elemento'),
                  React.createElement(
                    'dl',
                    { key: 'list', className: 'pg-details-list' },
                    [
                      React.createElement('dt', { key: 'key-label' }, 'Clave:'),
                      React.createElement('dd', { key: 'key-value' }, itemDetails.key),
                      
                      React.createElement('dt', { key: 'type-label' }, 'Tipo:'),
                      React.createElement('dd', { key: 'type-value' }, formatType(itemDetails.value)),
                      
                      React.createElement('dt', { key: 'size-label' }, 'Tamaño:'),
                      React.createElement('dd', { key: 'size-value' }, formatSize(itemDetails.size))
                    ]
                  )
                ]
              )
            ]
          )
        ]
      ),
      
      // Instrucciones
      React.createElement(
        'div',
        { key: 'instructions', className: 'pg-instructions' },
        [
          React.createElement('h3', { key: 'title' }, 'Cómo funciona'),
          React.createElement(
            'p',
            { key: 'desc' },
            'Esta demostración utiliza la API de almacenamiento persistente de Atlas para guardar y recuperar datos. Puedes almacenar cualquier tipo de dato que sea serializable (strings, números, booleanos, arrays y objetos).'
          ),
          React.createElement(
            'ul',
            { key: 'list' },
            [
              React.createElement('li', { key: 'tip1' }, 'Haz clic en "Crear ejemplos" para generar elementos de ejemplo.'),
              React.createElement('li', { key: 'tip2' }, 'Haz clic en un elemento de la lista para cargarlo en el editor.'),
              React.createElement('li', { key: 'tip3' }, 'El autoguardado guardará automáticamente cambios después de 2 segundos de inactividad.'),
              React.createElement('li', { key: 'tip4' }, 'Los elementos se guardan entre sesiones y pueden ser accedidos desde cualquier parte de tu plugin.')
            ]
          )
        ]
      )
    ]
  );
}

export default StorageDemo;