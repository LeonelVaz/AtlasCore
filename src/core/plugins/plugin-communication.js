/**
 * Sistema de comunicación entre plugins de Atlas
 * 
 * Este módulo proporciona una capa de abstracción para facilitar
 * la comunicación segura y controlada entre plugins.
 */

import eventBus from '../bus/event-bus';
import pluginRegistry from './plugin-registry';
import pluginAPIRegistry from './plugin-api-registry';
import pluginCompatibility from './plugin-compatibility';
import pluginErrorHandler from './plugin-error-handler';

/**
 * Clase para gestionar la comunicación entre plugins
 */
class PluginCommunication {
  constructor() {
    // Historial de comunicaciones entre plugins
    this.communicationHistory = {};
    
    // ID de la última comunicación
    this.lastCommunicationId = 0;
    
    // Límite de tamaño del historial por plugin
    this.maxHistorySize = 100;
    
    // Registro de canales de comunicación
    this.channels = {};
  }

  /**
   * Invoca un método de la API pública de otro plugin
   * @param {string} callerPluginId - ID del plugin llamador
   * @param {string} targetPluginId - ID del plugin objetivo
   * @param {string} methodName - Nombre del método a invocar
   * @param {Array} args - Argumentos para el método
   * @returns {Promise<*>} - Resultado de la invocación
   */
  async callPluginMethod(callerPluginId, targetPluginId, methodName, args = []) {
    if (!callerPluginId || !targetPluginId || !methodName) {
      throw new Error('Argumentos inválidos para callPluginMethod');
    }
    
    // Registrar intento de comunicación
    const communicationId = this._registerCommunication(callerPluginId, targetPluginId, methodName);
    
    try {
      // Verificar que ambos plugins estén activos
      if (!pluginRegistry.isPluginActive(callerPluginId)) {
        throw new Error(`Plugin llamador no está activo: ${callerPluginId}`);
      }
      
      if (!pluginRegistry.isPluginActive(targetPluginId)) {
        throw new Error(`Plugin objetivo no está activo: ${targetPluginId}`);
      }
      
      // Verificar compatibilidad entre plugins
      const isCompatible = this._checkPluginsCompatibility(callerPluginId, targetPluginId);
      if (!isCompatible.compatible) {
        throw new Error(`Plugins incompatibles: ${isCompatible.reason}`);
      }
      
      // Realizar la llamada a través del registro de APIs
      const result = await pluginAPIRegistry.callPluginMethod(
        callerPluginId,
        targetPluginId,
        methodName,
        args
      );
      
      // Registrar éxito
      this._updateCommunicationStatus(communicationId, true);
      
      return result;
    } catch (error) {
      // Registrar error
      this._updateCommunicationStatus(communicationId, false, error.message);
      
      // Notificar error
      pluginErrorHandler.handleError(
        callerPluginId,
        'pluginCommunication',
        error,
        { target: targetPluginId, method: methodName }
      );
      
      throw error;
    }
  }

  /**
   * Verifica si dos plugins son compatibles para comunicarse
   * @param {string} pluginId1 - ID del primer plugin
   * @param {string} pluginId2 - ID del segundo plugin
   * @returns {Object} - Resultado de la verificación
   * @private
   */
  _checkPluginsCompatibility(pluginId1, pluginId2) {
    try {
      // Verificar conflictos declarados
      const conflicts1 = pluginCompatibility.getConflictInfo(pluginId1);
      const conflicts2 = pluginCompatibility.getConflictInfo(pluginId2);
      
      // Comprobar si pluginId1 declara conflicto con pluginId2
      if (conflicts1 && conflicts1.declared) {
        const hasConflict = conflicts1.declared.some(conflict => {
          const conflictId = typeof conflict === 'string' ? conflict : conflict.id;
          return conflictId === pluginId2;
        });
        
        if (hasConflict) {
          const reason = conflicts1.declared.find(conflict => {
            const conflictId = typeof conflict === 'string' ? conflict : conflict.id;
            return conflictId === pluginId2;
          });
          
          return {
            compatible: false,
            reason: typeof reason === 'string' ? 
              `${pluginId1} declara conflicto con ${pluginId2}` : 
              reason.reason
          };
        }
      }
      
      // Comprobar si pluginId2 declara conflicto con pluginId1
      if (conflicts2 && conflicts2.declared) {
        const hasConflict = conflicts2.declared.some(conflict => {
          const conflictId = typeof conflict === 'string' ? conflict : conflict.id;
          return conflictId === pluginId1;
        });
        
        if (hasConflict) {
          const reason = conflicts2.declared.find(conflict => {
            const conflictId = typeof conflict === 'string' ? conflict : conflict.id;
            return conflictId === pluginId1;
          });
          
          return {
            compatible: false,
            reason: typeof reason === 'string' ? 
              `${pluginId2} declara conflicto con ${pluginId1}` : 
              reason.reason
          };
        }
      }
      
      // Si no hay conflictos explícitos, son compatibles
      return {
        compatible: true
      };
    } catch (error) {
      console.error('Error al verificar compatibilidad entre plugins:', error);
      
      return {
        compatible: false,
        reason: `Error al verificar compatibilidad: ${error.message}`
      };
    }
  }

  /**
   * Registra un intento de comunicación en el historial
   * @param {string} callerPluginId - ID del plugin llamador
   * @param {string} targetPluginId - ID del plugin objetivo
   * @param {string} methodName - Nombre del método
   * @returns {string} - ID de la comunicación
   * @private
   */
  _registerCommunication(callerPluginId, targetPluginId, methodName) {
    const id = `comm_${++this.lastCommunicationId}`;
    
    const communication = {
      id,
      timestamp: Date.now(),
      callerPluginId,
      targetPluginId,
      methodName,
      status: 'pending',
      error: null
    };
    
    // Registrar en historial del llamador
    if (!this.communicationHistory[callerPluginId]) {
      this.communicationHistory[callerPluginId] = [];
    }
    
    this.communicationHistory[callerPluginId].unshift(communication);
    
    // Limitar tamaño del historial
    if (this.communicationHistory[callerPluginId].length > this.maxHistorySize) {
      this.communicationHistory[callerPluginId] = 
        this.communicationHistory[callerPluginId].slice(0, this.maxHistorySize);
    }
    
    // Registrar en historial del objetivo (referencia al mismo objeto)
    if (!this.communicationHistory[targetPluginId]) {
      this.communicationHistory[targetPluginId] = [];
    }
    
    this.communicationHistory[targetPluginId].unshift(communication);
    
    // Limitar tamaño del historial
    if (this.communicationHistory[targetPluginId].length > this.maxHistorySize) {
      this.communicationHistory[targetPluginId] = 
        this.communicationHistory[targetPluginId].slice(0, this.maxHistorySize);
    }
    
    return id;
  }

  /**
   * Actualiza el estado de una comunicación en el historial
   * @param {string} id - ID de la comunicación
   * @param {boolean} success - Si la comunicación fue exitosa
   * @param {string} [error] - Mensaje de error, si hubo
   * @private
   */
  _updateCommunicationStatus(id, success, error = null) {
    // Buscar la comunicación en los historiales de todos los plugins
    Object.values(this.communicationHistory).forEach(history => {
      const communication = history.find(comm => comm.id === id);
      
      if (communication) {
        communication.status = success ? 'success' : 'error';
        communication.error = error;
        communication.completedAt = Date.now();
      }
    });
    
    // Publicar evento de comunicación completada
    eventBus.publish('pluginSystem.communication', {
      id,
      success,
      error
    });
  }

  /**
   * Crea un canal de comunicación entre plugins
   * @param {string} channelName - Nombre del canal
   * @param {string} creatorPluginId - ID del plugin creador
   * @param {Object} [options] - Opciones del canal
   * @returns {Object} - API del canal
   */
  createChannel(channelName, creatorPluginId, options = {}) {
    if (!channelName || !creatorPluginId) {
      throw new Error('Argumentos inválidos para createChannel');
    }
    
    // Verificar que el canal no exista
    if (this.channels[channelName]) {
      throw new Error(`El canal ya existe: ${channelName}`);
    }
    
    // Crear canal
    const channel = {
      name: channelName,
      creator: creatorPluginId,
      created: Date.now(),
      subscribers: {},
      messages: [],
      options: {
        maxMessages: options.maxMessages || 100,
        ...options
      }
    };
    
    this.channels[channelName] = channel;
    
    // Publicar evento de canal creado
    eventBus.publish('pluginSystem.channelCreated', {
      channelName,
      creatorPluginId
    });
    
    // Devolver API para interactuar con el canal
    return this._createChannelAPI(channelName, creatorPluginId);
  }

  /**
   * Suscribe un plugin a un canal de comunicación
   * @param {string} channelName - Nombre del canal
   * @param {string} pluginId - ID del plugin a suscribir
   * @param {Function} callback - Función a llamar cuando hay mensajes
   * @returns {Function} - Función para cancelar suscripción
   */
  subscribeToChannel(channelName, pluginId, callback) {
    if (!channelName || !pluginId || typeof callback !== 'function') {
      throw new Error('Argumentos inválidos para subscribeToChannel');
    }
    
    // Verificar que el canal exista
    const channel = this.channels[channelName];
    if (!channel) {
      throw new Error(`Canal no encontrado: ${channelName}`);
    }
    
    // Verificar compatibilidad con el creador
    const compatibility = this._checkPluginsCompatibility(pluginId, channel.creator);
    if (!compatibility.compatible) {
      throw new Error(`No se puede suscribir al canal: ${compatibility.reason}`);
    }
    
    // Registrar suscripción
    channel.subscribers[pluginId] = {
      callback,
      subscribedAt: Date.now(),
      lastMessage: null
    };
    
    // Publicar evento de suscripción
    eventBus.publish('pluginSystem.channelSubscribed', {
      channelName,
      pluginId
    });
    
    // Enviar historial de mensajes al suscriptor
    if (channel.messages.length > 0 && channel.options.sendHistoryOnSubscribe) {
      // Solo enviar último mensaje o todos según configuración
      const messagesToSend = channel.options.sendFullHistoryOnSubscribe ?
        channel.messages : [channel.messages[0]];
      
      messagesToSend.forEach(message => {
        try {
          callback(message);
        } catch (error) {
          console.error(`Error al enviar mensaje histórico a ${pluginId}:`, error);
        }
      });
    }
    
    // Devolver función para cancelar suscripción
    return () => {
      this.unsubscribeFromChannel(channelName, pluginId);
    };
  }

  /**
   * Cancela la suscripción de un plugin a un canal
   * @param {string} channelName - Nombre del canal
   * @param {string} pluginId - ID del plugin
   * @returns {boolean} - true si se canceló correctamente
   */
  unsubscribeFromChannel(channelName, pluginId) {
    if (!channelName || !pluginId) {
      return false;
    }
    
    // Verificar que el canal exista
    const channel = this.channels[channelName];
    if (!channel) {
      return false;
    }
    
    // Verificar que el plugin esté suscrito
    if (!channel.subscribers[pluginId]) {
      return false;
    }
    
    // Eliminar suscripción
    delete channel.subscribers[pluginId];
    
    // Publicar evento de cancelación
    eventBus.publish('pluginSystem.channelUnsubscribed', {
      channelName,
      pluginId
    });
    
    return true;
  }

  /**
   * Publica un mensaje en un canal
   * @param {string} channelName - Nombre del canal
   * @param {string} publisherPluginId - ID del plugin que publica
   * @param {*} message - Mensaje a publicar
   * @returns {boolean} - true si se publicó correctamente
   */
  publishToChannel(channelName, publisherPluginId, message) {
    if (!channelName || !publisherPluginId) {
      return false;
    }
    
    // Verificar que el canal exista
    const channel = this.channels[channelName];
    if (!channel) {
      return false;
    }
    
    // Solo el creador y los suscriptores pueden publicar, por defecto
    const canPublish = publisherPluginId === channel.creator || 
                      channel.subscribers[publisherPluginId] ||
                      channel.options.allowAnyPublisher === true;
    
    if (!canPublish) {
      console.error(`Plugin ${publisherPluginId} no puede publicar en el canal ${channelName}`);
      return false;
    }
    
    // Crear objeto de mensaje
    const messageObject = {
      id: `msg_${channelName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      publisher: publisherPluginId,
      channel: channelName,
      content: message
    };
    
    // Añadir al historial
    channel.messages.unshift(messageObject);
    
    // Limitar tamaño del historial
    if (channel.messages.length > channel.options.maxMessages) {
      channel.messages = channel.messages.slice(0, channel.options.maxMessages);
    }
    
    // Notificar a suscriptores
    Object.entries(channel.subscribers).forEach(([pluginId, subscription]) => {
      try {
        subscription.callback(messageObject);
        subscription.lastMessage = messageObject.id;
      } catch (error) {
        console.error(`Error al notificar mensaje a plugin ${pluginId}:`, error);
        
        // Notificar error específico del suscriptor
        pluginErrorHandler.handleError(
          pluginId,
          'channelMessage',
          error,
          { channelName, messageId: messageObject.id }
        );
      }
    });
    
    return true;
  }

  /**
   * Cierra y elimina un canal de comunicación
   * @param {string} channelName - Nombre del canal
   * @param {string} pluginId - ID del plugin que solicita el cierre
   * @returns {boolean} - true si se cerró correctamente
   */
  closeChannel(channelName, pluginId) {
    if (!channelName || !pluginId) {
      return false;
    }
    
    // Verificar que el canal exista
    const channel = this.channels[channelName];
    if (!channel) {
      return false;
    }
    
    // Solo el creador puede cerrar el canal, por defecto
    if (pluginId !== channel.creator && !channel.options.allowAnyClose) {
      console.error(`Plugin ${pluginId} no puede cerrar el canal ${channelName}`);
      return false;
    }
    
    // Notificar a suscriptores
    Object.keys(channel.subscribers).forEach(subscriberId => {
      try {
        // Publicar mensaje de cierre a cada suscriptor
        this.publishToChannel(channelName, channel.creator, {
          type: 'channel_closed',
          reason: 'Channel closed by creator'
        });
      } catch (error) {
        console.error(`Error al notificar cierre a plugin ${subscriberId}:`, error);
      }
    });
    
    // Eliminar canal
    delete this.channels[channelName];
    
    // Publicar evento de canal cerrado
    eventBus.publish('pluginSystem.channelClosed', {
      channelName,
      closedBy: pluginId
    });
    
    return true;
  }

  /**
   * Crea la API para interactuar con un canal específico
   * @param {string} channelName - Nombre del canal
   * @param {string} pluginId - ID del plugin
   * @returns {Object} - API del canal
   * @private
   */
  _createChannelAPI(channelName, pluginId) {
    return {
      /**
       * Publica un mensaje en el canal
       * @param {*} message - Mensaje a publicar
       * @returns {boolean} - true si se publicó correctamente
       */
      publish: (message) => {
        return this.publishToChannel(channelName, pluginId, message);
      },
      
      /**
       * Suscribe una función al canal
       * @param {Function} callback - Función a llamar cuando hay mensajes
       * @returns {Function} - Función para cancelar suscripción
       */
      subscribe: (callback) => {
        return this.subscribeToChannel(channelName, pluginId, callback);
      },
      
      /**
       * Cierra el canal
       * @returns {boolean} - true si se cerró correctamente
       */
      close: () => {
        return this.closeChannel(channelName, pluginId);
      },
      
      /**
       * Obtiene el historial de mensajes del canal
       * @returns {Array} - Historial de mensajes
       */
      getHistory: () => {
        return this.channels[channelName]?.messages || [];
      },
      
      /**
       * Obtiene información del canal
       * @returns {Object} - Información del canal
       */
      getInfo: () => {
        const channel = this.channels[channelName];
        if (!channel) return null;
        
        return {
          name: channel.name,
          creator: channel.creator,
          created: channel.created,
          subscribersCount: Object.keys(channel.subscribers).length,
          messagesCount: channel.messages.length
        };
      }
    };
  }

  /**
   * Obtiene el historial de comunicaciones de un plugin
   * @param {string} pluginId - ID del plugin
   * @returns {Array} - Historial de comunicaciones
   */
  getCommunicationHistory(pluginId) {
    if (!pluginId) {
      return [];
    }
    
    return this.communicationHistory[pluginId] || [];
  }

  /**
   * Limpia el historial de comunicaciones de un plugin
   * @param {string} pluginId - ID del plugin
   */
  clearCommunicationHistory(pluginId) {
    if (!pluginId) {
      return;
    }
    
    delete this.communicationHistory[pluginId];
  }

  /**
   * Limpia todos los recursos asociados a un plugin
   * @param {string} pluginId - ID del plugin
   */
  clearPluginResources(pluginId) {
    if (!pluginId) {
      return;
    }
    
    // Limpiar historial
    this.clearCommunicationHistory(pluginId);
    
    // Cancelar suscripciones a canales
    Object.keys(this.channels).forEach(channelName => {
      this.unsubscribeFromChannel(channelName, pluginId);
    });
    
    // Cerrar canales creados por el plugin
    Object.entries(this.channels).forEach(([channelName, channel]) => {
      if (channel.creator === pluginId) {
        this.closeChannel(channelName, pluginId);
      }
    });
  }

  /**
   * Obtiene información sobre los canales disponibles
   * @returns {Object} - Información de canales
   */
  getChannelsInfo() {
    const info = {};
    
    Object.entries(this.channels).forEach(([channelName, channel]) => {
      info[channelName] = {
        creator: channel.creator,
        created: channel.created,
        subscribers: Object.keys(channel.subscribers),
        messagesCount: channel.messages.length
      };
    });
    
    return info;
  }
}

// Exportar instancia única
const pluginCommunication = new PluginCommunication();
export default pluginCommunication;