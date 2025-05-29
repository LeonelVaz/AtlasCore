/**
 * Sistema de eventos para plugins
 */
import eventBus from "../bus/event-bus";

class PluginEvents {
  constructor() {
    this.pluginEventPrefix = "plugin.";
    this.pluginSubscriptions = {};
    this.lastSubscriptionId = 0;
    this.listeningEvents = new Set();
  }

  _getEventName(eventName) {
    return eventName.startsWith(this.pluginEventPrefix)
      ? eventName
      : `${this.pluginEventPrefix}${eventName}`;
  }

  _registerSubscription(pluginId, eventName, callback, unsubscribeFn) {
    if (!this.pluginSubscriptions[pluginId]) {
      this.pluginSubscriptions[pluginId] = {};
    }

    const subscriptionId = ++this.lastSubscriptionId;

    this.pluginSubscriptions[pluginId][subscriptionId] = {
      eventName,
      callback,
      unsubscribe: unsubscribeFn,
    };

    return subscriptionId;
  }

  _publishSystemEvent(eventName, data) {
    eventBus.publish(`pluginSystem.${eventName}`, data);
  }

  subscribe(pluginId, eventName, callback) {
    if (!pluginId || !eventName || typeof callback !== "function") {
      console.error("Argumentos inválidos para subscribe");
      return () => {};
    }

    try {
      const fullEventName = this._getEventName(eventName);

      const unsubscribe = eventBus.subscribe(fullEventName, (data) => {
        const eventData =
          typeof data === "object" && data !== null && data.sourcePlugin
            ? data
            : { sourcePlugin: null, data };

        try {
          callback(eventData.data, eventData.sourcePlugin);
        } catch (error) {
          console.error(
            `Error en callback de plugin ${pluginId} para evento ${eventName}:`,
            error
          );
          this._publishSystemEvent("eventHandlerError", {
            pluginId,
            eventName,
            error: error.message || "Error desconocido en manejador de eventos",
          });
        }
      });

      const subscriptionId = this._registerSubscription(
        pluginId,
        eventName,
        callback,
        unsubscribe
      );
      this.listeningEvents.add(eventName);

      return () => this.unsubscribe(pluginId, subscriptionId);
    } catch (error) {
      console.error(
        `Error al suscribir plugin ${pluginId} a evento ${eventName}:`,
        error
      );

      this._publishSystemEvent("error", {
        pluginId,
        operation: "subscribe",
        eventName,
        error: error.message || "Error desconocido",
      });

      return () => {};
    }
  }

  unsubscribe(pluginId, subscriptionId) {
    if (!pluginId || !subscriptionId) return false;

    try {
      if (!this.pluginSubscriptions[pluginId]) return false;

      const subscription = this.pluginSubscriptions[pluginId][subscriptionId];
      if (!subscription) return false;

      if (typeof subscription.unsubscribe === "function") {
        subscription.unsubscribe();
      }

      delete this.pluginSubscriptions[pluginId][subscriptionId];

      if (Object.keys(this.pluginSubscriptions[pluginId]).length === 0) {
        delete this.pluginSubscriptions[pluginId];
      }

      return true;
    } catch (error) {
      console.error(
        `Error al cancelar suscripción ${subscriptionId} del plugin ${pluginId}:`,
        error
      );
      return false;
    }
  }

  publish(pluginId, eventName, data) {
    if (!pluginId || !eventName) {
      console.error("Argumentos inválidos para publish");
      return false;
    }

    try {
      const fullEventName = this._getEventName(eventName);
      const eventData = { sourcePlugin: pluginId, data };

      eventBus.publish(fullEventName, eventData);

      if (!this.listeningEvents.has(eventName)) {
        eventBus.publish(this._getEventName("*"), {
          sourcePlugin: pluginId,
          eventName,
          data,
        });
      }

      return true;
    } catch (error) {
      console.error(
        `Error al publicar evento ${eventName} desde plugin ${pluginId}:`,
        error
      );

      this._publishSystemEvent("error", {
        pluginId,
        operation: "publish",
        eventName,
        error: error.message || "Error desconocido",
      });

      return false;
    }
  }

  unsubscribeAll(pluginId) {
    if (!pluginId || !this.pluginSubscriptions[pluginId]) return false;

    try {
      const subscriptions = this.pluginSubscriptions[pluginId];

      Object.values(subscriptions).forEach((subscription) => {
        if (typeof subscription.unsubscribe === "function") {
          try {
            subscription.unsubscribe();
          } catch (error) {
            console.error(
              `Error al cancelar suscripción a ${subscription.eventName}:`,
              error
            );
          }
        }
      });

      delete this.pluginSubscriptions[pluginId];

      return true;
    } catch (error) {
      console.error(
        `Error al cancelar todas las suscripciones del plugin ${pluginId}:`,
        error
      );
      return false;
    }
  }

  getPluginSubscriptions(pluginId) {
    if (!pluginId || !this.pluginSubscriptions[pluginId]) return [];

    try {
      const subscriptions = this.pluginSubscriptions[pluginId];

      return Object.entries(subscriptions).map(([id, subscription]) => ({
        id: parseInt(id),
        eventName: subscription.eventName,
      }));
    } catch (error) {
      console.error(
        `Error al obtener suscripciones del plugin ${pluginId}:`,
        error
      );
      return [];
    }
  }

  getStats() {
    try {
      const stats = {
        totalPlugins: Object.keys(this.pluginSubscriptions).length,
        totalSubscriptions: 0,
        eventsWithListeners: Array.from(this.listeningEvents),
        subscriptionsByPlugin: {},
      };

      Object.entries(this.pluginSubscriptions).forEach(
        ([pluginId, subscriptions]) => {
          const count = Object.keys(subscriptions).length;
          stats.totalSubscriptions += count;
          stats.subscriptionsByPlugin[pluginId] = count;
        }
      );

      return stats;
    } catch (error) {
      console.error("Error al generar estadísticas de eventos:", error);
      return {
        totalPlugins: 0,
        totalSubscriptions: 0,
        eventsWithListeners: [],
        subscriptionsByPlugin: {},
      };
    }
  }
}

const pluginEvents = new PluginEvents();
export default pluginEvents;
