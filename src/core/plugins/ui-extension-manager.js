/**
 * Gestor de extensiones UI para plugins
 */
import { PLUGIN_CONSTANTS } from '../config/constants';
import eventBus from '../bus/event-bus';

class UIExtensionManager {
  constructor() {
    this.extensionPoints = {};
    this.pluginComponents = {};
    this.lastExtensionId = 0;
    this._initializeExtensionPoints();
    this._setupEventListeners();
  }

  _initializeExtensionPoints() {
    const zones = PLUGIN_CONSTANTS.UI_EXTENSION_ZONES;
    Object.values(zones).forEach(zoneId => {
      this.extensionPoints[zoneId] = [];
    });
    
    console.log('Puntos de extensión UI inicializados:', Object.keys(this.extensionPoints));
  }

  _setupEventListeners() {
    eventBus.subscribe('pluginSystem.pluginDeactivated', (data) => {
      if (data && data.pluginId) {
        this.removeAllPluginExtensions(data.pluginId);
      }
    });
  }

  _generateExtensionId() {
    return `ext_${++this.lastExtensionId}_${Date.now()}`;
  }

  extensionZoneExists(zoneId) {
    return zoneId && zoneId in this.extensionPoints;
  }

  registerExtension(pluginId, zoneId, componentInfo) {
    if (!pluginId || !zoneId || !componentInfo || !componentInfo.component) {
      console.error('Argumentos inválidos para registerExtension');
      return null;
    }
    
    if (!this.extensionZoneExists(zoneId)) {
      console.error(`Zona de extensión no válida: ${zoneId}`);
      return null;
    }
    
    try {
      const extensionId = this._generateExtensionId();
      
      const extension = {
        id: extensionId,
        pluginId,
        component: componentInfo.component,
        props: componentInfo.props || {},
        order: componentInfo.order || 100,
        registrationTime: Date.now()
      };
      
      this.extensionPoints[zoneId].push(extension);
      this.extensionPoints[zoneId].sort((a, b) => a.order - b.order);
      
      if (!this.pluginComponents[pluginId]) {
        this.pluginComponents[pluginId] = [];
      }
      
      this.pluginComponents[pluginId].push({ extensionId, zoneId });
      this._notifyExtensionPointChanged(zoneId);
      
      console.log(`[UIExtensionManager] Extensión registrada: ${pluginId} en ${zoneId}`);
      return extensionId;
    } catch (error) {
      console.error(`Error al registrar extensión para plugin ${pluginId} en ${zoneId}:`, error);
      return null;
    }
  }

  removeExtension(extensionId) {
    if (!extensionId) return false;
    
    try {
      let removed = false;
      let affectedZone = null;
      
      Object.entries(this.extensionPoints).forEach(([zoneId, extensions]) => {
        const initialLength = extensions.length;
        this.extensionPoints[zoneId] = extensions.filter(ext => ext.id !== extensionId);
        
        if (initialLength !== this.extensionPoints[zoneId].length) {
          removed = true;
          affectedZone = zoneId;
        }
      });
      
      if (removed) {
        Object.entries(this.pluginComponents).forEach(([pluginId, registrations]) => {
          const filtered = registrations.filter(reg => reg.extensionId !== extensionId);
          
          if (filtered.length !== registrations.length) {
            this.pluginComponents[pluginId] = filtered;
            
            if (filtered.length === 0) {
              delete this.pluginComponents[pluginId];
            }
          }
        });
        
        if (affectedZone) {
          this._notifyExtensionPointChanged(affectedZone);
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`Error al eliminar extensión ${extensionId}:`, error);
      return false;
    }
  }

  removeAllPluginExtensions(pluginId) {
    if (!pluginId || !this.pluginComponents[pluginId]) return false;
    
    try {
      const affectedZones = new Set();
      const extensionsToRemove = [...this.pluginComponents[pluginId]];
      
      extensionsToRemove.forEach(registration => {
        const { extensionId, zoneId } = registration;
        
        if (this.extensionPoints[zoneId]) {
          this.extensionPoints[zoneId] = this.extensionPoints[zoneId].filter(
            ext => ext.id !== extensionId
          );
          
          affectedZones.add(zoneId);
        }
      });
      
      delete this.pluginComponents[pluginId];
      affectedZones.forEach(zone => this._notifyExtensionPointChanged(zone));
      
      return true;
    } catch (error) {
      console.error(`Error al eliminar extensiones del plugin ${pluginId}:`, error);
      return false;
    }
  }

  getExtensionsForZone(zoneId) {
    if (!zoneId || !this.extensionPoints[zoneId]) return [];
    return [...this.extensionPoints[zoneId]];
  }

  getPluginExtensions(pluginId) {
    if (!pluginId || !this.pluginComponents[pluginId]) return [];
    
    return this.pluginComponents[pluginId].map(reg => {
      const { extensionId, zoneId } = reg;
      const extension = this.extensionPoints[zoneId]?.find(ext => ext.id === extensionId);
      return extension ? { ...extension, zoneId } : null;
    }).filter(Boolean);
  }

  getExtensionStats() {
    const stats = {
      totalExtensions: 0,
      extensionsByZone: {},
      extensionsByPlugin: {}
    };
    
    Object.entries(this.extensionPoints).forEach(([zoneId, extensions]) => {
      stats.totalExtensions += extensions.length;
      stats.extensionsByZone[zoneId] = extensions.length;
    });
    
    Object.entries(this.pluginComponents).forEach(([pluginId, registrations]) => {
      stats.extensionsByPlugin[pluginId] = registrations.length;
    });
    
    return stats;
  }

  _notifyExtensionPointChanged(zoneId) {
    if (!zoneId) return;
    
    eventBus.publish('pluginSystem.extensionPointChanged', {
      zoneId,
      extensions: this.extensionPoints[zoneId] || []
    });
    
    eventBus.publish(`pluginSystem.extension.${zoneId}`, {
      extensions: this.extensionPoints[zoneId] || []
    });
  }
}

const uiExtensionManager = new UIExtensionManager();
export default uiExtensionManager;