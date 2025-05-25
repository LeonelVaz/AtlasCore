// src\core\plugins\plugin-communication.js

/**
 * Sistema de comunicación entre plugins de Atlas
 */
import eventBus from '../bus/event-bus';
import pluginRegistry from './plugin-registry';
import pluginAPIRegistry from './plugin-api-registry';
import pluginCompatibility from './plugin-compatibility';
import pluginErrorHandler from './plugin-error-handler';

class PluginCommunication {
  constructor() {
    this.communicationHistory = {};
    this.lastCommunicationId = 0;
    this.maxHistorySize = 100;
    this.channels = {};
  }

  async callPluginMethod(callerPluginId, targetPluginId, methodName, args = []) {
    if (!callerPluginId || !targetPluginId || !methodName) {
      throw new Error('Argumentos inválidos para callPluginMethod');
    }
    
    const communicationId = this._registerCommunication(callerPluginId, targetPluginId, methodName);
    
    try {
      if (!pluginRegistry.isPluginActive(callerPluginId)) {
        throw new Error(`Plugin llamador no está activo: ${callerPluginId}`);
      }
      if (!pluginRegistry.isPluginActive(targetPluginId)) {
        throw new Error(`Plugin objetivo no está activo: ${targetPluginId}`);
      }
      const isCompatible = this._checkPluginsCompatibility(callerPluginId, targetPluginId);
      if (!isCompatible.compatible) {
        throw new Error(`Plugins incompatibles: ${isCompatible.reason}`);
      }
      const result = await pluginAPIRegistry.callPluginMethod(
        callerPluginId, targetPluginId, methodName, args
      );
      this._updateCommunicationStatus(communicationId, true);
      return result;
    } catch (error) {
      this._updateCommunicationStatus(communicationId, false, error.message);
      pluginErrorHandler.handleError(
        callerPluginId, 'pluginCommunication', error,
        { target: targetPluginId, method: methodName }
      );
      throw error;
    }
  }

  _checkPluginsCompatibility(pluginId1, pluginId2) {
    try {
      const conflicts1 = pluginCompatibility.getConflictInfo(pluginId1);
      const conflicts2 = pluginCompatibility.getConflictInfo(pluginId2);
      if (conflicts1 && conflicts1.declared) {
        const hasConflict = conflicts1.declared.some(conflict => 
          (typeof conflict === 'string' ? conflict : conflict.id) === pluginId2
        );
        if (hasConflict) {
          const reason = conflicts1.declared.find(conflict => 
            (typeof conflict === 'string' ? conflict : conflict.id) === pluginId2
          );
          return { compatible: false, reason: typeof reason === 'string' ? `${pluginId1} declara conflicto con ${pluginId2}` : reason.reason };
        }
      }
      if (conflicts2 && conflicts2.declared) {
        const hasConflict = conflicts2.declared.some(conflict => 
          (typeof conflict === 'string' ? conflict : conflict.id) === pluginId1
        );
        if (hasConflict) {
          const reason = conflicts2.declared.find(conflict => 
            (typeof conflict === 'string' ? conflict : conflict.id) === pluginId1
          );
          return { compatible: false, reason: typeof reason === 'string' ? `${pluginId2} declara conflicto con ${pluginId1}` : reason.reason };
        }
      }
      return { compatible: true };
    } catch (error) {
      console.error('Error al verificar compatibilidad entre plugins:', error);
      return { compatible: false, reason: `Error al verificar compatibilidad: ${error.message}` };
    }
  }

  _registerCommunication(callerPluginId, targetPluginId, methodName) {
    const id = `comm_${++this.lastCommunicationId}`;
    const communication = { id, timestamp: Date.now(), callerPluginId, targetPluginId, methodName, status: 'pending', error: null };
    if (!this.communicationHistory[callerPluginId]) this.communicationHistory[callerPluginId] = [];
    this.communicationHistory[callerPluginId].unshift(communication);
    if (this.communicationHistory[callerPluginId].length > this.maxHistorySize) {
      this.communicationHistory[callerPluginId] = this.communicationHistory[callerPluginId].slice(0, this.maxHistorySize);
    }
    if (!this.communicationHistory[targetPluginId]) this.communicationHistory[targetPluginId] = [];
    this.communicationHistory[targetPluginId].unshift(communication);
    if (this.communicationHistory[targetPluginId].length > this.maxHistorySize) {
      this.communicationHistory[targetPluginId] = this.communicationHistory[targetPluginId].slice(0, this.maxHistorySize);
    }
    return id;
  }

  _updateCommunicationStatus(id, success, error = null) {
    Object.values(this.communicationHistory).forEach(history => {
      const communication = history.find(comm => comm.id === id);
      if (communication) {
        communication.status = success ? 'success' : 'error';
        communication.error = error;
        communication.completedAt = Date.now();
      }
    });
    eventBus.publish('pluginSystem.communication', { id, success, error });
  }

  createChannel(channelName, creatorPluginId, options = {}) {
    if (!channelName || !creatorPluginId) throw new Error('Argumentos inválidos para createChannel');
    if (this.channels[channelName]) throw new Error(`El canal ya existe: ${channelName}`);
    const channel = {
      name: channelName, creator: creatorPluginId, created: Date.now(),
      subscribers: {}, messages: [],
      options: { maxMessages: options.maxMessages || 100, ...options }
    };
    this.channels[channelName] = channel;
    eventBus.publish('pluginSystem.channelCreated', { channelName, creatorPluginId });
    return this._createChannelAPI(channelName, creatorPluginId);
  }

  // NUEVO MÉTODO AÑADIDO
  getChannel(callerPluginId, channelName) {
    if (!channelName) {
      this._handleError(callerPluginId, 'getChannel', new Error('Nombre de canal no proporcionado'));
      return null;
    }
    const channelData = this.channels[channelName];
    if (!channelData) {
      // console.warn(`PluginCommunication: Canal no encontrado al intentar obtenerlo: ${channelName}`);
      return null;
    }
    // Aquí podrías añadir lógica de permisos/compatibilidad si es necesario
    // Por ejemplo, verificar si callerPluginId tiene permiso para "ver" este canal
    // o si es compatible con el creador.
    // const compatibility = this._checkPluginsCompatibility(callerPluginId, channelData.creator);
    // if (!compatibility.compatible) {
    //   this._handleError(callerPluginId, 'getChannel.compatibility', new Error(`Incompatible con creador de canal ${channelData.creator}: ${compatibility.reason}`));
    //   return null;
    // }
    return this._createChannelAPI(channelName, callerPluginId);
  }

  subscribeToChannel(channelName, pluginId, callback) {
    if (!channelName || !pluginId || typeof callback !== 'function') throw new Error('Argumentos inválidos para subscribeToChannel');
    const channel = this.channels[channelName];
    if (!channel) throw new Error(`Canal no encontrado: ${channelName}`);
    const compatibility = this._checkPluginsCompatibility(pluginId, channel.creator);
    if (!compatibility.compatible) throw new Error(`No se puede suscribir al canal: ${compatibility.reason}`);
    channel.subscribers[pluginId] = { callback, subscribedAt: Date.now(), lastMessage: null };
    eventBus.publish('pluginSystem.channelSubscribed', { channelName, pluginId });
    if (channel.messages.length > 0 && channel.options.sendHistoryOnSubscribe) {
      const messagesToSend = channel.options.sendFullHistoryOnSubscribe ? channel.messages : [channel.messages[0]];
      messagesToSend.forEach(message => { try { callback(message); } catch (error) { console.error(`Error al enviar mensaje histórico a ${pluginId}:`, error); }});
    }
    return () => this.unsubscribeFromChannel(channelName, pluginId);
  }

  unsubscribeFromChannel(channelName, pluginId) {
    if (!channelName || !pluginId) return false;
    const channel = this.channels[channelName];
    if (!channel || !channel.subscribers[pluginId]) return false;
    delete channel.subscribers[pluginId];
    eventBus.publish('pluginSystem.channelUnsubscribed', { channelName, pluginId });
    return true;
  }

  publishToChannel(channelName, publisherPluginId, message) {
    if (!channelName || !publisherPluginId) return false;
    const channel = this.channels[channelName];
    if (!channel) return false;
    const canPublish = publisherPluginId === channel.creator || channel.subscribers[publisherPluginId] || channel.options.allowAnyPublisher === true;
    if (!canPublish) {
      console.error(`Plugin ${publisherPluginId} no puede publicar en el canal ${channelName}`);
      return false;
    }
    const messageObject = { id: `msg_${channelName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, timestamp: Date.now(), publisher: publisherPluginId, channel: channelName, content: message };
    channel.messages.unshift(messageObject);
    if (channel.messages.length > channel.options.maxMessages) {
      channel.messages = channel.messages.slice(0, channel.options.maxMessages);
    }
    Object.entries(channel.subscribers).forEach(([pluginId, subscription]) => {
      try {
        subscription.callback(messageObject);
        subscription.lastMessage = messageObject.id;
      } catch (error) {
        console.error(`Error al notificar mensaje a plugin ${pluginId}:`, error);
        pluginErrorHandler.handleError(pluginId, 'channelMessage', error, { channelName, messageId: messageObject.id });
      }
    });
    return true;
  }

  closeChannel(channelName, pluginId) {
    if (!channelName || !pluginId) return false;
    const channel = this.channels[channelName];
    if (!channel) return false;
    if (pluginId !== channel.creator && !channel.options.allowAnyClose) {
      console.error(`Plugin ${pluginId} no puede cerrar el canal ${channelName}`);
      return false;
    }
    Object.keys(channel.subscribers).forEach(subscriberId => {
      try {
        this.publishToChannel(channelName, channel.creator, { type: 'channel_closed', reason: 'Channel closed by creator' });
      } catch (error) { console.error(`Error al notificar cierre a plugin ${subscriberId}:`, error); }
    });
    delete this.channels[channelName];
    eventBus.publish('pluginSystem.channelClosed', { channelName, closedBy: pluginId });
    return true;
  }

  _createChannelAPI(channelName, pluginId) {
    return {
      publish: (message) => this.publishToChannel(channelName, pluginId, message),
      subscribe: (callback) => this.subscribeToChannel(channelName, pluginId, callback),
      close: () => this.closeChannel(channelName, pluginId),
      getHistory: () => this.channels[channelName]?.messages || [],
      getInfo: () => {
        const channel = this.channels[channelName];
        if (!channel) return null;
        return { name: channel.name, creator: channel.creator, created: channel.created, subscribersCount: Object.keys(channel.subscribers).length, messagesCount: channel.messages.length };
      }
    };
  }

  getCommunicationHistory(pluginId) {
    return pluginId ? (this.communicationHistory[pluginId] || []) : [];
  }

  clearCommunicationHistory(pluginId) {
    if (pluginId) delete this.communicationHistory[pluginId];
  }

  clearPluginResources(pluginId) {
    if (!pluginId) return;
    this.clearCommunicationHistory(pluginId);
    Object.keys(this.channels).forEach(channelName => {
      this.unsubscribeFromChannel(channelName, pluginId);
    });
    Object.entries(this.channels).forEach(([channelName, channel]) => {
      if (channel.creator === pluginId) this.closeChannel(channelName, pluginId);
    });
  }

  getChannelsInfo() {
    const info = {};
    Object.entries(this.channels).forEach(([channelName, channel]) => {
      info[channelName] = { creator: channel.creator, created: channel.created, subscribers: Object.keys(channel.subscribers), messagesCount: channel.messages.length };
    });
    return info;
  }

  // NUEVO MÉTODO AÑADIDO
  listChannels() {
    const channelsInfo = this.getChannelsInfo();
    return Object.keys(channelsInfo).map(channelName => ({
        name: channelName,
        createdBy: channelsInfo[channelName].creator,
        subscribersCount: channelsInfo[channelName].subscribers.length
    }));
  }

  // Helper para manejo de errores internos si es necesario
  _handleError(callerPluginId, operation, error) {
    // Podríamos usar pluginErrorHandler aquí si es apropiado para errores internos
    // del sistema de comunicación que no son necesariamente errores de plugin.
    // Por ahora, solo console.error para errores internos de getChannel, por ejemplo.
    console.error(`PluginCommunication Error (${operation}) para ${callerPluginId}:`, error.message);
  }
}

const pluginCommunicationInstance = new PluginCommunication();
export default pluginCommunicationInstance;