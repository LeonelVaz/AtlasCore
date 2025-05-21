// Plugin modificado para detectar eventos marcados con "ok=si"
export default {
  id: 'test-plugin',
  name: 'Plugin de Prueba',
  version: '1.0.0',
  description: 'Plugin para detectar eventos marcados como ok=si',
  author: 'Test',
  minAppVersion: '0.3.0',
  maxAppVersion: '1.0.0',
  permissions: ['storage', 'events', 'ui'],
  
  _core: null,
  _subscriptions: [],
  _okEvents: {}, // Almacena los recuentos de eventos OK por fecha
  _extensionId: null, // Para almacenar el ID de la extensión UI
  
  init: function(core) {
    console.log('🔌 [Test Plugin] Inicializando...');
    
    this._core = core;
    
    // Guardar evento de prueba con ok=si para testing
    this._createTestEvent();
    
    // Inicializar el plugin
    this._initializeEventCounting();
    
    // Usar un enfoque directo para mostrar contadores
    this._setupDirectCounting();
    
    // Suscribirse a eventos del calendario para actualizar conteos
    this._setupEventListeners();
    
    console.log('🔌 [Test Plugin] Inicialización completada');
    return true;
  },
  
  _createTestEvent: function() {
    try {
      const calendar = this._core.getModule('calendar');
      if (!calendar) return;
      
      // Solo para pruebas: crear un evento de ejemplo con ok=si
      console.log('🔍 [Test Plugin] Creando evento de prueba con ok=si...');
      
      // Comprobar primero si ya existen eventos con ok=si
      const events = calendar.getEvents();
      const hasOkEvents = events.some(e => e.ok === "si");
      
      if (!hasOkEvents) {
        // Crear evento para el día actual con ok=si
        const now = new Date();
        const start = new Date(now);
        start.setHours(10, 0, 0, 0);
        
        const end = new Date(now);
        end.setHours(11, 0, 0, 0);
        
        const testEvent = {
          title: "Evento OK",
          start: start.toISOString(),
          end: end.toISOString(),
          ok: "si",
          color: '#4CAF50'
        };
        
        calendar.createEvent(testEvent);
        console.log('✅ [Test Plugin] Evento de prueba creado con ok=si');
      } else {
        console.log('ℹ️ [Test Plugin] Ya existen eventos con ok=si, no es necesario crear uno nuevo');
      }
    } catch (error) {
      console.error('❌ [Test Plugin] Error al crear evento de prueba:', error);
    }
  },
  
  _initializeEventCounting: function() {
    const calendar = this._core.getModule('calendar');
    if (calendar) {
      console.log('✅ [Test Plugin] Módulo calendar accesible');
      
      // Obtener todos los eventos del calendario
      const events = calendar.getEvents();
      console.log(`✅ [Test Plugin] Eventos en calendario: ${events.length}`);
      
      // Imprimir todos los eventos para depuración
      this._logAllEvents(events);
      
      // Contar eventos con ok="si" por fecha
      this._countOkEventsByDate(events);
    } else {
      console.error('❌ [Test Plugin] No se pudo acceder al módulo calendar');
    }
  },
  
  _logAllEvents: function(events) {
    console.log('🔍 [Test Plugin] Listado completo de eventos:');
    events.forEach((event, index) => {
      console.log(`Evento #${index + 1}:`, {
        id: event.id,
        title: event.title,
        start: event.start,
        end: event.end,
        ok: event.ok || 'no definido',
        // Convertir a fecha legible
        startDate: new Date(event.start).toLocaleString(),
        endDate: new Date(event.end).toLocaleString(),
        dateKey: this._getDateKey(new Date(event.start))
      });
    });
  },
  
  _countOkEventsByDate: function(events) {
    // Reiniciar conteo
    this._okEvents = {};
    
    let totalOkEvents = 0;
    
    // Contar eventos con ok="si" para cada fecha
    events.forEach(event => {
      // Comprobar si tiene la propiedad ok="si"
      if (event.ok === "si") {
        totalOkEvents++;
        
        // Asegurarse de que el evento tiene fecha de inicio
        if (event.start) {
          const startDate = new Date(event.start);
          const dateKey = this._getDateKey(startDate);
          
          if (!this._okEvents[dateKey]) {
            this._okEvents[dateKey] = 0;
          }
          
          this._okEvents[dateKey]++;
        }
      }
    });
    
    console.log(`🔢 [Test Plugin] Total de eventos con ok=si: ${totalOkEvents}`);
    console.log('🔢 [Test Plugin] Conteo por fecha:', this._okEvents);
    
    // Actualizar los contadores en la UI después de contar
    this._updateCountersInUI();
  },
  
  _getDateKey: function(date) {
    // Asegurarse de que es un objeto Date válido
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      console.error('❌ [Test Plugin] Fecha inválida:', date);
      return 'invalid-date';
    }
    
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  },
  
  _setupDirectCounting: function() {
    console.log('🔍 [Test Plugin] Configurando conteo directo...');
    
    // Nos suscribimos a cambios en la vista para actualizar los contadores
    const viewChangedSub = this._core.events.subscribe(
      this.id,
      'calendar.viewChanged',
      () => {
        setTimeout(() => this._updateCountersInUI(), 100);
      }
    );
    
    const dateChangedSub = this._core.events.subscribe(
      this.id,
      'calendar.dateChanged',
      () => {
        setTimeout(() => this._updateCountersInUI(), 100);
      }
    );
    
    // Añadir a la lista de suscripciones
    this._subscriptions.push(viewChangedSub, dateChangedSub);
    
    // Actualizar contadores después de un breve retraso para asegurarnos de que la UI está lista
    setTimeout(() => this._updateCountersInUI(), 500);
  },
  
  _updateCountersInUI: function() {
    try {
      // Remover contadores antiguos para evitar duplicados
      document.querySelectorAll('.ok-event-counter').forEach(el => el.remove());
      
      // Encontrar todos los encabezados de día para añadir contadores
      const dayHeaders = document.querySelectorAll('.calendar-day-header');
      if (dayHeaders.length === 0) {
        console.warn('⚠️ [Test Plugin] No se encontraron encabezados de día para añadir contadores');
        return;
      }
      
      console.log(`🔍 [Test Plugin] Encontrados ${dayHeaders.length} encabezados de día`);
      
      // Para cada encabezado de día, crear un contador
      dayHeaders.forEach(header => {
        // Buscar la fecha en el texto del encabezado o atributos
        const headerText = header.textContent || '';
        const dateMatch = headerText.match(/\d+/);
        
        // Obtener el día del mes del texto del encabezado
        if (dateMatch) {
          const dayNumber = parseInt(dateMatch[0], 10);
          const now = new Date();
          const headerDate = new Date(now.getFullYear(), now.getMonth(), dayNumber);
          
          // Obtener la clave de fecha
          const dateKey = this._getDateKey(headerDate);
          console.log(`🔍 [Test Plugin] Encabezado para fecha ${dateKey}:`, headerText);
          
          // Obtener el conteo de eventos OK para esta fecha
          const okCount = this._okEvents[dateKey] || 0;
          
          // Crear el contador
          const counter = document.createElement('div');
          counter.className = 'ok-event-counter';
          counter.style.backgroundColor = okCount > 0 ? '#4CAF50' : '#FF5722';
          counter.style.color = 'white';
          counter.style.borderRadius = '50%';
          counter.style.width = '22px';
          counter.style.height = '22px';
          counter.style.display = 'flex';
          counter.style.alignItems = 'center';
          counter.style.justifyContent = 'center';
          counter.style.fontSize = '12px';
          counter.style.fontWeight = 'bold';
          counter.style.margin = '0 5px';
          counter.style.position = 'absolute';
          counter.style.right = '5px';
          counter.style.top = '5px';
          counter.textContent = okCount.toString();
          
          // Añadir al encabezado
          header.style.position = 'relative';
          header.appendChild(counter);
          
          console.log(`✅ [Test Plugin] Contador añadido para ${dateKey}: ${okCount}`);
        } else {
          console.warn('⚠️ [Test Plugin] No se pudo extraer la fecha del encabezado:', headerText);
        }
      });
    } catch (error) {
      console.error('❌ [Test Plugin] Error al actualizar contadores en UI:', error);
    }
  },
  
  _setupEventListeners: function() {
    const self = this;
    
    // Escuchar creación de eventos
    const createdSub = this._core.events.subscribe(
      this.id,
      'calendar.eventCreated',
      (data) => {
        console.log('✅ [Test Plugin] Evento creado detectado:', data);
        self._updateEventCounting();
      }
    );
    
    // Escuchar actualización de eventos
    const updatedSub = this._core.events.subscribe(
      this.id,
      'calendar.eventUpdated',
      (data) => {
        console.log('✅ [Test Plugin] Evento actualizado detectado:', data);
        
        // Comprobar si el valor de "ok" ha cambiado
        const oldOk = data.oldEvent?.ok;
        const newOk = data.newEvent?.ok;
        
        if (oldOk !== newOk) {
          console.log(`✅ [Test Plugin] Valor de OK cambiado: ${oldOk} -> ${newOk}`);
        }
        
        // Comprobar si la fecha ha cambiado
        const oldDate = data.oldEvent?.start ? new Date(data.oldEvent.start) : null;
        const newDate = data.newEvent?.start ? new Date(data.newEvent.start) : null;
        
        if (oldDate && newDate && this._getDateKey(oldDate) !== this._getDateKey(newDate)) {
          console.log(`✅ [Test Plugin] Fecha cambiada: ${this._getDateKey(oldDate)} -> ${this._getDateKey(newDate)}`);
        }
        
        // Actualizar conteo en cualquier caso
        self._updateEventCounting();
      }
    );
    
    // Escuchar eliminación de eventos
    const deletedSub = this._core.events.subscribe(
      this.id,
      'calendar.eventDeleted',
      (data) => {
        console.log('✅ [Test Plugin] Evento eliminado detectado:', data);
        self._updateEventCounting();
      }
    );
    
    // Escuchar carga de eventos
    const loadedSub = this._core.events.subscribe(
      this.id,
      'calendar.eventsLoaded',
      (data) => {
        console.log(`✅ [Test Plugin] Eventos cargados: ${data.count} eventos`);
        self._updateEventCounting();
      }
    );
    
    // Guardar referencias para limpiar al desactivar
    this._subscriptions.push(createdSub, updatedSub, deletedSub, loadedSub);
    
    console.log('✅ [Test Plugin] Listeners de eventos configurados');
  },
  
  _updateEventCounting: function() {
    const calendar = this._core.getModule('calendar');
    if (calendar) {
      const events = calendar.getEvents();
      this._countOkEventsByDate(events);
    }
  },
  
  cleanup: function() {
    console.log('🔌 [Test Plugin] Limpiando...');
    
    // Cancelar todas las suscripciones
    this._subscriptions.forEach(unsub => {
      if (typeof unsub === 'function') {
        unsub();
      }
    });
    
    // Eliminar todos los contadores de eventos ok
    document.querySelectorAll('.ok-event-counter').forEach(el => el.remove());
    
    console.log('🔌 [Test Plugin] Limpieza completada');
    return true;
  }
};