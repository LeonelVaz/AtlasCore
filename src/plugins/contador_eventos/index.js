import React from 'react';

export default {
  // Metadatos del plugin
  id: 'contador-eventos-dia',
  name: 'Contador de Eventos por Día',
  version: '1.0.0',
  description: 'Muestra la cantidad de eventos en el header de cada día del calendario',
  author: 'Atlas Plugin Developer',
  
  // Restricciones de compatibilidad
  minAppVersion: '0.3.0',
  maxAppVersion: '1.0.0',
  
  // Permisos requeridos
  permissions: ['events', 'ui'],
  
  // Variables internas
  _core: null,
  _subscriptions: [],
  _extensionId: null,
  
  // Método de inicialización
  init: function(core) {
    const self = this;
    
    return new Promise(function(resolve) {
      try {
        // Guardar referencia al core
        self._core = core;
        
        // Registrar la extensión UI para el header de días
        self._registerDayHeaderExtension();
        
        // Configurar listeners de eventos del calendario
        self._setupEventListeners();
        
        console.log('[Contador Eventos] Plugin inicializado correctamente');
        resolve(true);
      } catch (error) {
        console.error('[Contador Eventos] Error durante la inicialización:', error);
        resolve(false);
      }
    });
  },
  
  // Método de limpieza
  cleanup: function() {
    try {
      // Cancelar todas las suscripciones a eventos
      this._subscriptions.forEach(unsub => {
        if (typeof unsub === 'function') {
          unsub();
        }
      });
      this._subscriptions = [];
      
      // Remover la extensión UI
      if (this._extensionId && this._core) {
        this._core.ui.removeExtension(this.id, this._extensionId);
      }
      
      console.log('[Contador Eventos] Limpieza completada');
      return true;
    } catch (error) {
      console.error('[Contador Eventos] Error durante la limpieza:', error);
      return false;
    }
  },
  
  // Configurar listeners para eventos del calendario
  _setupEventListeners: function() {
    const self = this;
    
    // Suscribirse a cuando se crea un evento
    const eventCreatedSub = this._core.events.subscribe(
      this.id,
      'calendar.eventCreated',
      function(data) {
        console.log('[Contador Eventos] Evento creado:', data);
        self._triggerUIUpdate();
      }
    );
    
    // Suscribirse a cuando se actualiza un evento (incluye mover entre días)
    const eventUpdatedSub = this._core.events.subscribe(
      this.id,
      'calendar.eventUpdated',
      function(data) {
        console.log('[Contador Eventos] Evento actualizado:', data);
        self._triggerUIUpdate();
      }
    );
    
    // Suscribirse a cuando se elimina un evento
    const eventDeletedSub = this._core.events.subscribe(
      this.id,
      'calendar.eventDeleted',
      function(data) {
        console.log('[Contador Eventos] Evento eliminado:', data);
        self._triggerUIUpdate();
      }
    );
    
    // Suscribirse a cuando se cargan los eventos (inicialización)
    const eventsLoadedSub = this._core.events.subscribe(
      this.id,
      'calendar.eventsLoaded',
      function(data) {
        console.log('[Contador Eventos] Eventos cargados:', data);
        self._triggerUIUpdate();
      }
    );
    
    // Guardar las referencias para poder cancelarlas después
    this._subscriptions.push(
      eventCreatedSub, 
      eventUpdatedSub, 
      eventDeletedSub, 
      eventsLoadedSub
    );
  },
  
  // Fuerza una actualización de la UI publicando un evento personalizado
  _triggerUIUpdate: function() {
    // Pequeño delay para asegurar que el calendario se ha actualizado
    setTimeout(() => {
      this._core.events.publish(
        this.id,
        'contadorEventos.actualizar',
        { timestamp: Date.now() }
      );
    }, 50);
  },
  
  // Registrar la extensión para el header de días
  _registerDayHeaderExtension: function() {
    const self = this;
    
    // Componente que muestra el contador de eventos
    function EventCounterComponent(props) {
      const [eventCount, setEventCount] = React.useState(0);
      const [isLoading, setIsLoading] = React.useState(true);
      
      // Función para calcular eventos del día
      const updateEventCount = React.useCallback(() => {
        try {
          // Obtener el módulo de calendario
          const calendar = self._core.getModule('calendar');
          if (!calendar) {
            setEventCount(0);
            setIsLoading(false);
            return;
          }
          
          // Obtener eventos para esta fecha específica
          const eventsForDay = calendar.getEventsForDate(props.date);
          const count = eventsForDay ? eventsForDay.length : 0;
          
          setEventCount(count);
          setIsLoading(false);
          
          console.log(`[Contador Eventos] ${props.date.toDateString()}: ${count} eventos`);
        } catch (error) {
          console.error('[Contador Eventos] Error al calcular eventos:', error);
          setEventCount(0);
          setIsLoading(false);
        }
      }, [props.date]);
      
      // Efecto para calcular eventos inicialmente y suscribirse a actualizaciones
      React.useEffect(() => {
        // Calcular eventos inicialmente
        updateEventCount();
        
        // Suscribirse a actualizaciones del contador
        const unsub = self._core.events.subscribe(
          'event-counter-ui',
          'contadorEventos.actualizar',
          updateEventCount
        );
        
        // Cleanup: cancelar suscripción
        return () => {
          if (typeof unsub === 'function') {
            unsub();
          }
        };
      }, [updateEventCount]);
      
      // Si está cargando, no mostrar nada
      if (isLoading) {
        return null;
      }
      
      // Si no hay eventos, no mostrar contador
      if (eventCount === 0) {
        return null;
      }
      
      // Mostrar el contador de eventos
      return React.createElement(
        'span',
        {
          className: 'event-counter-badge',
          style: {
            backgroundColor: '#2196F3',
            color: 'white',
            borderRadius: '12px',
            padding: '2px 8px',
            fontSize: '11px',
            fontWeight: 'bold',
            marginLeft: '6px',
            display: 'inline-block',
            minWidth: '16px',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
            border: '1px solid rgba(255,255,255,0.2)'
          },
          title: `${eventCount} evento${eventCount !== 1 ? 's' : ''} este día`
        },
        eventCount.toString()
      );
    }
    
    // Registrar la extensión en el header de días
    this._extensionId = this._core.ui.registerExtension(
      this.id,
      this._core.ui.getExtensionZones().CALENDAR_DAY_HEADER,
      EventCounterComponent,
      { 
        order: 200 // Colocar después de otros elementos del header
      }
    );
    
    console.log('[Contador Eventos] Extensión UI registrada con ID:', this._extensionId);
  }
};