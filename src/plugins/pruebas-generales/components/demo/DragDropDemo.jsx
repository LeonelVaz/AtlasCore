/**
 * DragDropDemo.jsx
 * Componente para demostrar capacidades de drag and drop
 */

import logger from '../../utils/logger';
import { publishDemoEvent } from '../../api/eventManager';

/**
 * Componente de demostración de drag and drop
 */
function DragDropDemo(props) {
  const React = window.React;
  const { useState, useEffect, useRef } = React;
  
  // Extraer propiedades
  const { core, plugin } = props;
  
  // Estados locales
  const [tasks, setTasks] = useState({
    pending: [
      { id: 'task-1', title: 'Revisar documentación', color: '#f44336' },
      { id: 'task-2', title: 'Crear nuevo evento', color: '#2196f3' },
      { id: 'task-3', title: 'Actualizar plugin', color: '#4caf50' },
      { id: 'task-4', title: 'Probar funcionalidades', color: '#ff9800' }
    ],
    inProgress: [
      { id: 'task-5', title: 'Diseñar interfaz', color: '#9c27b0' },
      { id: 'task-6', title: 'Optimizar rendimiento', color: '#3f51b5' }
    ],
    completed: [
      { id: 'task-7', title: 'Configurar proyecto', color: '#795548' },
      { id: 'task-8', title: 'Instalar dependencias', color: '#607d8b' }
    ]
  });
  
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedColumn, setDraggedColumn] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  
  // Referencias para columnas
  const columnRefs = {
    pending: useRef(null),
    inProgress: useRef(null),
    completed: useRef(null)
  };
  
  // Efecto para publicar un evento al montar
  useEffect(() => {
    publishDemoEvent(core, plugin, 'drag-drop', 'viewed');
  }, [core, plugin]);
  
  /**
   * Iniciar el arrastre de una tarea
   */
  const handleDragStart = (e, taskId, columnId) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    
    // Guardar referencia al elemento arrastrado
    setDraggedItem(taskId);
    setDraggedColumn(columnId);
    
    // Añadir clase al elemento arrastrado
    e.target.classList.add('pg-dragging');
    
    // Registrar evento
    logger.debug(`Iniciando arrastre de tarea: ${taskId} desde ${columnId}`);
  };
  
  /**
   * Cuando el arrastre termina
   */
  const handleDragEnd = (e) => {
    // Eliminar clase del elemento arrastrado
    e.target.classList.remove('pg-dragging');
    
    // Limpiar referencias
    setDraggedItem(null);
    setDraggedColumn(null);
  };
  
  /**
   * Cuando el cursor entra en un área de soltar
   */
  const handleDragEnter = (e, columnId) => {
    // Añadir clase para indicar que es un área válida
    if (columnRefs[columnId] && columnRefs[columnId].current) {
      columnRefs[columnId].current.classList.add('pg-drop-active');
    }
    
    e.preventDefault();
    return false;
  };
  
  /**
   * Cuando el cursor sale de un área de soltar
   */
  const handleDragLeave = (e, columnId) => {
    // Eliminar clase cuando el cursor sale
    if (columnRefs[columnId] && columnRefs[columnId].current) {
      columnRefs[columnId].current.classList.remove('pg-drop-active');
    }
  };
  
  /**
   * Cuando el cursor se mueve sobre un área de soltar
   */
  const handleDragOver = (e) => {
    // Necesario para permitir soltar
    e.preventDefault();
    return false;
  };
  
  /**
   * Cuando se suelta un elemento en un área
   */
  const handleDrop = (e, targetColumnId) => {
    // Obtener ID de la tarea arrastrada
    const taskId = e.dataTransfer.getData('text/plain');
    
    // Ignorar si no hay tarea o ya está en la misma columna
    if (!taskId || !draggedColumn || draggedColumn === targetColumnId) {
      // Eliminar clase de área activa
      if (columnRefs[targetColumnId] && columnRefs[targetColumnId].current) {
        columnRefs[targetColumnId].current.classList.remove('pg-drop-active');
      }
      return false;
    }
    
    // Mover tarea entre columnas
    moveTask(taskId, draggedColumn, targetColumnId);
    
    // Eliminar clase de área activa
    if (columnRefs[targetColumnId] && columnRefs[targetColumnId].current) {
      columnRefs[targetColumnId].current.classList.remove('pg-drop-active');
    }
    
    e.preventDefault();
    return false;
  };
  
  /**
   * Mover una tarea de una columna a otra
   */
  const moveTask = (taskId, sourceColumnId, targetColumnId) => {
    // Crear copia de las tareas
    const newTasks = { ...tasks };
    
    // Encontrar la tarea en la columna de origen
    const taskIndex = newTasks[sourceColumnId].findIndex(task => task.id === taskId);
    
    // Si no se encuentra la tarea, salir
    if (taskIndex === -1) return;
    
    // Obtener la tarea
    const task = newTasks[sourceColumnId][taskIndex];
    
    // Eliminar de la columna de origen
    newTasks[sourceColumnId].splice(taskIndex, 1);
    
    // Añadir a la columna de destino
    newTasks[targetColumnId].push(task);
    
    // Actualizar estado
    setTasks(newTasks);
    setLastUpdate(new Date().toLocaleTimeString());
    
    // Registrar evento
    logger.info(`Tarea "${task.title}" movida de ${sourceColumnId} a ${targetColumnId}`);
    
    // Publicar evento de demo
    publishDemoEvent(core, plugin, 'drag-drop', 'taskMoved', {
      taskId,
      title: task.title,
      from: sourceColumnId,
      to: targetColumnId
    });
  };
  
  /**
   * Añadir una nueva tarea
   */
  const handleAddTask = () => {
    // Generar ID único
    const taskId = `task-${Date.now()}`;
    
    // Colores disponibles
    const colors = ['#f44336', '#2196f3', '#4caf50', '#ff9800', '#9c27b0', '#3f51b5', '#795548', '#607d8b'];
    
    // Crear nueva tarea
    const newTask = {
      id: taskId,
      title: `Tarea ${tasks.pending.length + tasks.inProgress.length + tasks.completed.length + 1}`,
      color: colors[Math.floor(Math.random() * colors.length)]
    };
    
    // Añadir a pendientes
    setTasks(prev => ({
      ...prev,
      pending: [...prev.pending, newTask]
    }));
    
    // Registrar evento
    logger.info(`Nueva tarea "${newTask.title}" añadida a pendientes`);
  };
  
  /**
   * Limpiar todas las tareas completadas
   */
  const handleClearCompleted = () => {
    setTasks(prev => ({
      ...prev,
      completed: []
    }));
    
    // Registrar evento
    logger.info('Tareas completadas limpiadas');
  };
  
  // Renderizar demostración de drag and drop
  return React.createElement(
    'div',
    { className: 'pg-drag-drop-demo' },
    [
      // Encabezado
      React.createElement(
        'div',
        { key: 'header', className: 'pg-drag-drop-header' },
        [
          React.createElement('h2', { key: 'title' }, 'Tablero de tareas'),
          React.createElement(
            'div',
            { key: 'actions', className: 'pg-drag-drop-actions' },
            [
              React.createElement(
                'button',
                {
                  key: 'add',
                  className: 'pg-button pg-button-primary',
                  onClick: handleAddTask
                },
                'Añadir tarea'
              ),
              React.createElement(
                'button',
                {
                  key: 'clear',
                  className: 'pg-button',
                  onClick: handleClearCompleted,
                  disabled: tasks.completed.length === 0
                },
                'Limpiar completadas'
              )
            ]
          )
        ]
      ),
      
      // Tablero de tareas
      React.createElement(
        'div',
        { key: 'board', className: 'pg-task-board' },
        [
          // Columna: Pendientes
          React.createElement(
            'div',
            {
              key: 'pending',
              className: 'pg-task-column',
              ref: columnRefs.pending,
              onDragEnter: (e) => handleDragEnter(e, 'pending'),
              onDragLeave: (e) => handleDragLeave(e, 'pending'),
              onDragOver: handleDragOver,
              onDrop: (e) => handleDrop(e, 'pending')
            },
            [
              React.createElement(
                'div',
                { key: 'header', className: 'pg-column-header' },
                [
                  React.createElement('h3', { key: 'title' }, 'Pendientes'),
                  React.createElement('span', { key: 'count', className: 'pg-task-count' }, tasks.pending.length)
                ]
              ),
              React.createElement(
                'div',
                { key: 'tasks', className: 'pg-task-list' },
                tasks.pending.map(task => React.createElement(
                  'div',
                  {
                    key: task.id,
                    className: 'pg-task-card',
                    draggable: true,
                    onDragStart: (e) => handleDragStart(e, task.id, 'pending'),
                    onDragEnd: handleDragEnd,
                    style: { borderLeftColor: task.color }
                  },
                  task.title
                ))
              )
            ]
          ),
          
          // Columna: En progreso
          React.createElement(
            'div',
            {
              key: 'inProgress',
              className: 'pg-task-column',
              ref: columnRefs.inProgress,
              onDragEnter: (e) => handleDragEnter(e, 'inProgress'),
              onDragLeave: (e) => handleDragLeave(e, 'inProgress'),
              onDragOver: handleDragOver,
              onDrop: (e) => handleDrop(e, 'inProgress')
            },
            [
              React.createElement(
                'div',
                { key: 'header', className: 'pg-column-header' },
                [
                  React.createElement('h3', { key: 'title' }, 'En progreso'),
                  React.createElement('span', { key: 'count', className: 'pg-task-count' }, tasks.inProgress.length)
                ]
              ),
              React.createElement(
                'div',
                { key: 'tasks', className: 'pg-task-list' },
                tasks.inProgress.map(task => React.createElement(
                  'div',
                  {
                    key: task.id,
                    className: 'pg-task-card',
                    draggable: true,
                    onDragStart: (e) => handleDragStart(e, task.id, 'inProgress'),
                    onDragEnd: handleDragEnd,
                    style: { borderLeftColor: task.color }
                  },
                  task.title
                ))
              )
            ]
          ),
          
          // Columna: Completadas
          React.createElement(
            'div',
            {
              key: 'completed',
              className: 'pg-task-column',
              ref: columnRefs.completed,
              onDragEnter: (e) => handleDragEnter(e, 'completed'),
              onDragLeave: (e) => handleDragLeave(e, 'completed'),
              onDragOver: handleDragOver,
              onDrop: (e) => handleDrop(e, 'completed')
            },
            [
              React.createElement(
                'div',
                { key: 'header', className: 'pg-column-header' },
                [
                  React.createElement('h3', { key: 'title' }, 'Completadas'),
                  React.createElement('span', { key: 'count', className: 'pg-task-count' }, tasks.completed.length)
                ]
              ),
              React.createElement(
                'div',
                { key: 'tasks', className: 'pg-task-list' },
                tasks.completed.map(task => React.createElement(
                  'div',
                  {
                    key: task.id,
                    className: 'pg-task-card',
                    draggable: true,
                    onDragStart: (e) => handleDragStart(e, task.id, 'completed'),
                    onDragEnd: handleDragEnd,
                    style: { borderLeftColor: task.color }
                  },
                  task.title
                ))
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
          React.createElement('h3', { key: 'title' }, 'Instrucciones'),
          React.createElement(
            'p',
            { key: 'desc' },
            'Arrastra las tarjetas entre las columnas para cambiar su estado. Añade nuevas tareas con el botón "Añadir tarea".'
          ),
          lastUpdate && React.createElement(
            'p',
            { key: 'update', className: 'pg-last-update' },
            `Última actualización: ${lastUpdate}`
          )
        ]
      )
    ]
  );
}

export default DragDropDemo;