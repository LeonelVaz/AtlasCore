/**
 * API Mejorada del Módulo de Calendario para Plugins
 * Proporciona acceso a información detallada sobre eventos, vistas y configuraciones del calendario
 */
import { CALENDAR_VIEWS } from "../config/constants";
import eventBus, { CalendarEvents } from "../bus/event-bus";

class CalendarModule {
  constructor() {
    this._calendarService = null;
    this._calendarState = {
      currentView: CALENDAR_VIEWS.WEEK,
      selectedDate: new Date(),
      events: [],
      lastUpdate: null,
    };
    this._eventListeners = [];
    this._initialized = false;
    this._subscriptionsActive = false;
  }

  /**
   * Inicializa el módulo con el servicio de calendario subyacente
   * @param {Object} calendarService - El servicio de calendario de la aplicación
   */
  init(calendarService) {
    if (!calendarService) {
      console.error("CalendarModule: No se proporcionó servicio de calendario");
      return false;
    }

    // Si ya está inicializado, limpiar primero
    if (this._initialized) {
      this.cleanup();
    }

    this._calendarService = calendarService;

    // Realizar inicialización específica si es necesario
    this._syncState();

    // Configurar escucha de eventos del calendario solo una vez
    if (!this._subscriptionsActive) {
      this._setupEventListeners();
      this._subscriptionsActive = true;
    }

    this._initialized = true;
    // Solo log en la primera inicialización real
    if (!this._subscriptionsActive) {
      console.log("CalendarModule: Inicializado correctamente");
    }
    return true;
  }

  /**
   * Configura los listeners para mantener el estado sincronizado
   * @private
   */
  _setupEventListeners() {
    // Limpiar suscripciones anteriores si existen
    this._cleanupEventListeners();

    // Escuchar cuando se cargan eventos
    const loadedSub = eventBus.subscribe(
      CalendarEvents.EVENTS_LOADED,
      (data) => {
        this._calendarState.events = data.events || [];
        this._calendarState.lastUpdate = Date.now();
      }
    );

    // Escuchar creación de eventos
    const createdSub = eventBus.subscribe(
      CalendarEvents.EVENT_CREATED,
      (data) => {
        if (data.event) {
          // Verificar que el evento no exista ya
          const exists = this._calendarState.events.some(
            (e) => e.id === data.event.id
          );
          if (!exists) {
            this._calendarState.events.push(data.event);
            this._calendarState.lastUpdate = Date.now();
          }
        }
      }
    );

    // Escuchar actualización de eventos
    const updatedSub = eventBus.subscribe(
      CalendarEvents.EVENT_UPDATED,
      (data) => {
        if (data.newEvent) {
          const index = this._calendarState.events.findIndex(
            (e) => e.id === data.newEvent.id
          );
          if (index !== -1) {
            this._calendarState.events[index] = data.newEvent;
            this._calendarState.lastUpdate = Date.now();
          }
        }
      }
    );

    // Escuchar eliminación de eventos
    const deletedSub = eventBus.subscribe(
      CalendarEvents.EVENT_DELETED,
      (data) => {
        if (data.event) {
          this._calendarState.events = this._calendarState.events.filter(
            (e) => e.id !== data.event.id
          );
          this._calendarState.lastUpdate = Date.now();
        }
      }
    );

    // Guardar referencias para limpieza
    this._eventListeners = [loadedSub, createdSub, updatedSub, deletedSub];
  }

  /**
   * Limpia los event listeners
   * @private
   */
  _cleanupEventListeners() {
    if (this._eventListeners.length > 0) {
      this._eventListeners.forEach((unsub) => {
        if (typeof unsub === "function") {
          unsub();
        }
      });
      this._eventListeners = [];
    }
  }

  /**
   * Sincroniza el estado interno con el servicio de calendario
   * @private
   */
  _syncState() {
    if (!this._calendarService) return;

    try {
      // Obtener datos actuales del servicio de calendario
      if (this._calendarService.getCurrentDate) {
        this._calendarState.selectedDate =
          this._calendarService.getCurrentDate();
      }

      if (this._calendarService.getEvents) {
        this._calendarState.events = this._calendarService.getEvents();
      }

      // Determinar vista actual
      if (this._calendarService.getCurrentView) {
        this._calendarState.currentView =
          this._calendarService.getCurrentView();
      }

      this._calendarState.lastUpdate = Date.now();
    } catch (error) {
      console.error("Error al sincronizar estado del calendario:", error);
    }
  }

  /**
   * Obtiene todos los eventos del calendario
   * @returns {Array} Lista de eventos
   */
  getEvents() {
    return [...this._calendarState.events];
  }

  /**
   * Obtiene los eventos para una fecha específica
   * @param {string|Date} date - La fecha para la que se buscan eventos
   * @returns {Array} Lista de eventos para esa fecha
   */
  getEventsForDate(date) {
    if (!date) return [];

    const targetDate = typeof date === "string" ? new Date(date) : date;

    // Normalizar a inicio de día
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    // Normalizar a fin de día
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Filtrar eventos que ocurren en el día
    return this._calendarState.events.filter((event) => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);

      // El evento comienza, termina o abarca completamente el día
      return (
        (eventStart >= startOfDay && eventStart <= endOfDay) || // Comienza hoy
        (eventEnd >= startOfDay && eventEnd <= endOfDay) || // Termina hoy
        (eventStart <= startOfDay && eventEnd >= endOfDay)
      ); // Abarca todo el día
    });
  }

  /**
   * Obtiene los eventos para un rango de fechas
   * @param {string|Date} startDate - Fecha de inicio
   * @param {string|Date} endDate - Fecha de fin
   * @returns {Array} Lista de eventos en el rango
   */
  getEventsForDateRange(startDate, endDate) {
    if (!startDate || !endDate) return [];

    const start =
      typeof startDate === "string" ? new Date(startDate) : startDate;
    const end = typeof endDate === "string" ? new Date(endDate) : endDate;

    // Normalizar fechas
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    // Filtrar eventos en el rango
    return this._calendarState.events.filter((event) => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);

      // El evento se solapa con el rango
      return eventStart <= end && eventEnd >= start;
    });
  }

  /**
   * Obtiene los próximos eventos a partir de la fecha actual
   * @param {number} limit - Número máximo de eventos a devolver
   * @returns {Array} Lista de próximos eventos
   */
  getUpcomingEvents(limit = 10) {
    const now = new Date();

    // Filtrar eventos futuros o en curso
    const upcomingEvents = this._calendarState.events
      .filter((event) => {
        const eventEnd = new Date(event.end);
        return eventEnd >= now;
      })
      .sort((a, b) => {
        const startA = new Date(a.start);
        const startB = new Date(b.start);
        return startA - startB;
      });

    return upcomingEvents.slice(0, limit);
  }

  /**
   * Obtiene un evento por su ID
   * @param {string} eventId - ID del evento a buscar
   * @returns {Object|null} El evento encontrado o null
   */
  getEvent(eventId) {
    if (!eventId) return null;

    return (
      this._calendarState.events.find((event) => event.id === eventId) || null
    );
  }

  /**
   * Obtiene la vista actual del calendario
   * @returns {string} Tipo de vista actual ('day', 'week', 'month')
   */
  getCurrentView() {
    return this._calendarState.currentView;
  }

  /**
   * Obtiene la fecha seleccionada actualmente en el calendario
   * @returns {Date} Fecha seleccionada
   */
  getSelectedDate() {
    return new Date(this._calendarState.selectedDate);
  }

  /**
   * Crea un nuevo evento en el calendario
   * @param {Object} eventData - Datos del evento a crear
   * @returns {Object|null} El evento creado o null si falló
   */
  createEvent(eventData) {
    if (!this._calendarService || !this._calendarService.createEvent) {
      console.error(
        "CalendarModule: No se puede crear evento, método no disponible"
      );
      return null;
    }

    try {
      const createdEvent = this._calendarService.createEvent(eventData);
      // No es necesario publicar aquí, el servicio lo hará
      return createdEvent;
    } catch (error) {
      console.error("Error al crear evento:", error);
      return null;
    }
  }

  /**
   * Actualiza un evento existente
   * @param {string} eventId - ID del evento a actualizar
   * @param {Object} eventData - Nuevos datos del evento
   * @returns {Object|null} El evento actualizado o null si falló
   */
  updateEvent(eventId, eventData) {
    if (!this._calendarService || !this._calendarService.updateEvent) {
      console.error(
        "CalendarModule: No se puede actualizar evento, método no disponible"
      );
      return null;
    }

    try {
      const updatedEvent = this._calendarService.updateEvent(
        eventId,
        eventData
      );
      // No es necesario publicar aquí, el servicio lo hará
      return updatedEvent;
    } catch (error) {
      console.error(`Error al actualizar evento ${eventId}:`, error);
      return null;
    }
  }

  /**
   * Elimina un evento
   * @param {string} eventId - ID del evento a eliminar
   * @returns {boolean} true si se eliminó correctamente
   */
  deleteEvent(eventId) {
    if (!this._calendarService || !this._calendarService.deleteEvent) {
      console.error(
        "CalendarModule: No se puede eliminar evento, método no disponible"
      );
      return false;
    }

    try {
      this._calendarService.deleteEvent(eventId);
      // No es necesario publicar aquí, el servicio lo hará
      return true;
    } catch (error) {
      console.error(`Error al eliminar evento ${eventId}:`, error);
      return false;
    }
  }

  /**
   * Obtiene eventos agrupados por categoría
   * @param {string} categoryField - Campo a usar para agrupar (por defecto: 'color')
   * @returns {Object} Eventos agrupados por categoría
   */
  getEventsByCategory(categoryField = "color") {
    const grouped = {};

    this._calendarState.events.forEach((event) => {
      const category = event[categoryField] || "default";

      if (!grouped[category]) {
        grouped[category] = [];
      }

      grouped[category].push(event);
    });

    return grouped;
  }

  /**
   * Obtiene metadatos sobre los días del mes actual
   * Útil para saber qué días tienen eventos sin tener que solicitarlos individualmente
   * @param {string|Date} month - Mes a consultar (por defecto: mes actual)
   * @returns {Array} Metadatos de días con información sobre eventos
   */
  getMonthMetadata(month) {
    const targetDate = month
      ? typeof month === "string"
        ? new Date(month)
        : month
      : new Date();
    const year = targetDate.getFullYear();
    const monthIndex = targetDate.getMonth();

    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    const daysInMonth = lastDay.getDate();

    // DEBUGGING:
    console.log(`getMonthMetadata - Input month: ${month}`);
    console.log(
      `TargetDate: ${targetDate.toISOString()}, Year: ${year}, MonthIndex: ${monthIndex}`
    );
    console.log(`LastDay object: ${lastDay.toISOString()}`);
    console.log(`Calculated daysInMonth: ${daysInMonth}`);
    // FIN DEBUGGING

    const metadata = [];

    // Para cada día del mes
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, monthIndex, day);
      const events = this.getEventsForDate(date);

      metadata.push({
        date,
        day,
        hasEvents: events.length > 0,
        eventCount: events.length,
        // Agrupar por color para indicadores visuales
        eventColors: [
          ...new Set(events.map((event) => event.color || "default")),
        ],
      });
    }

    return metadata;
  }

  /**
   * Obtiene información sobre la configuración actual del calendario
   * @returns {Object} Configuración del calendario
   */
  getCalendarConfig() {
    // Obtener configuración del servicio si está disponible
    if (this._calendarService && this._calendarService.getConfig) {
      return this._calendarService.getConfig();
    }

    // Devolver configuración básica
    return {
      timeScale: {
        id: "standard",
        pixelsPerHour: 60,
      },
      maxSimultaneousEvents: 3,
      snapValue: 0,
      dayHeaderStyle: "default",
      timeDisplayStyle: "start-end",
    };
  }

  /**
   * Limpia los listeners del módulo
   */
  cleanup() {
    // Cancelar todas las suscripciones
    this._cleanupEventListeners();
    this._subscriptionsActive = false;
    this._initialized = false;
  }
}

// Exportar instancia única
const calendarModule = new CalendarModule();
export default calendarModule;
