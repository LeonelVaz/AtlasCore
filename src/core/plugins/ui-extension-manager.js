/**
 * Gestor de extensiones UI para plugins
 * 
 * Este módulo se encarga de la administración de puntos de extensión UI
 * donde los plugins pueden integrar sus componentes visuales
 */

import { PLUGIN_CONSTANTS } from '../config/constants';
import eventBus from '../bus/event-bus';

/**
 * Clase para gestionar puntos de extensión UI para plugins
 */
class UIExtensionManager {
  constructor() {
    // Registro de extensiones por zona
    this.extensionPoints = {};
    
    // Registro de componentes por plugin
    this.pluginComponents = {};
    
    // Asignar ID único a cada extensión
    this.lastExtensionId = 0;
    
    // Inicializar puntos de extensión predefinidos
    this._initializeExtensionPoints();

    // Suscribirse a eventos de activación/desactivación de plugins
    this._setupEventListeners();
  }

  /**
   * Inicializa los puntos de extensión estándar del sistema
   * @private
   */
  _initializeExtensionPoints() {
    const zones = PLUGIN_CONSTANTS.UI_EXTENSION_ZONES;
    
    // Crear puntos de extensión iniciales con arrays vacíos
    Object.values(zones).forEach(zoneId => {
      this.extensionPoints[zoneId] = [];
    });
    
    console.log('Puntos de extensión UI inicializados:', Object.keys(this.extensionPoints));
  }

  /**
   * Configura listeners para eventos del sistema de plugins
   * @private
   */
  _setupEventListeners() {
    // Escuchar cuando un plugin es desactivado
    eventBus.subscribe('pluginSystem.pluginDeactivated', (data) => {
      if (data && data.pluginId) {
        this.removeAllPluginExtensions(data.pluginId);
      }
    });

    // Escuchar cuando un plugin es activado (por si necesita restaurar componentes)
    eventBus.subscribe('pluginSystem.pluginActivated', (data) => {
      // De momento no hacemos nada, los plugins deben registrar explícitamente sus componentes
    });
  }

  /**
   * Genera un ID único para cada extensión
   * @private
   * @returns {string} ID único para la extensión
   */
  _generateExtensionId() {
    const id = `ext_${++this.lastExtensionId}_${Date.now()}`;
    return id;
  }

  /**
   * Verifica si una zona de extensión existe
   * @param {string} zoneId - ID de la zona a verificar
   * @returns {boolean} true si la zona existe
   */
  extensionZoneExists(zoneId) {
    return zoneId && zoneId in this.extensionPoints;
  }

  /**
   * Registra un componente en un punto de extensión
   * @param {string} pluginId - ID del plugin que registra el componente
   * @param {string} zoneId - ID de la zona donde registrar
   * @param {Object} componentInfo - Información del componente
   * @param {React.Component|Function} componentInfo.component - Componente React
   * @param {Object} [componentInfo.props] - Props adicionales para el componente
   * @param {number} [componentInfo.order=100] - Orden de renderizado (menor = primero)
   * @returns {string|null} ID de la extensión o null si falla
   */
  registerExtension(pluginId, zoneId, componentInfo) {
    if (!pluginId || !zoneId || !componentInfo || !componentInfo.component) {
      console.error('Argumentos inválidos para registerExtension');
      return null;
    }
    
    // Verificar que la zona exista
    if (!this.extensionZoneExists(zoneId)) {
      console.error(`Zona de extensión no válida: ${zoneId}`);
      return null;
    }
    
    try {
      // Generar ID único para esta extensión
      const extensionId = this._generateExtensionId();
      
      // Preparar datos de la extensión
      const extension = {
        id: extensionId,
        pluginId,
        component: componentInfo.component,
        props: componentInfo.props || {},
        order: componentInfo.order || 100, // Orden predeterminado
        registrationTime: Date.now()
      };
      
      // Añadir al punto de extensión
      this.extensionPoints[zoneId].push(extension);
      
      // Ordenar extensiones por orden
      this.extensionPoints[zoneId].sort((a, b) => a.order - b.order);
      
      // Registrar también por plugin (para limpieza rápida)
      if (!this.pluginComponents[pluginId]) {
        this.pluginComponents[pluginId] = [];
      }
      
      this.pluginComponents[pluginId].push({
        extensionId,
        zoneId
      });
      
      // Notificar cambio en punto de extensión
      this._notifyExtensionPointChanged(zoneId);
      
      console.log(`[UIExtensionManager] Extensión registrada: ${pluginId} en ${zoneId}`);
      return extensionId;
    } catch (error) {
      console.error(`Error al registrar extensión para plugin ${pluginId} en ${zoneId}:`, error);
      return null;
    }
  }

  /**
   * Elimina una extensión específica
   * @param {string} extensionId - ID de la extensión a eliminar
   * @returns {boolean} true si se eliminó correctamente
   */
  removeExtension(extensionId) {
    if (!extensionId) return false;
    
    try {
      let removed = false;
      let affectedZone = null;
      
      // Buscar y eliminar la extensión en todos los puntos de extensión
      Object.entries(this.extensionPoints).forEach(([zoneId, extensions]) => {
        const initialLength = extensions.length;
        this.extensionPoints[zoneId] = extensions.filter(ext => ext.id !== extensionId);
        
        if (initialLength !== this.extensionPoints[zoneId].length) {
          removed = true;
          affectedZone = zoneId;
        }
      });
      
      // Si se encontró y eliminó, actualizar registro de plugin
      if (removed) {
        // Limpiar registro en pluginComponents
        Object.entries(this.pluginComponents).forEach(([pluginId, registrations]) => {
          const filtered = registrations.filter(reg => reg.extensionId !== extensionId);
          
          if (filtered.length !== registrations.length) {
            this.pluginComponents[pluginId] = filtered;
            
            // Si el plugin no tiene más componentes, eliminar entrada
            if (filtered.length === 0) {
              delete this.pluginComponents[pluginId];
            }
          }
        });
        
        // Notificar cambio si se afectó alguna zona
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

  /**
   * Elimina todas las extensiones de un plugin
   * @param {string} pluginId - ID del plugin
   * @returns {boolean} true si se eliminaron correctamente
   */
  removeAllPluginExtensions(pluginId) {
    if (!pluginId || !this.pluginComponents[pluginId]) {
      return false;
    }
    
    try {
      // Recopilar zonas afectadas para notificar después
      const affectedZones = new Set();
      
      // Copiar la lista de extensiones para poder iterar de forma segura
      const extensionsToRemove = [...this.pluginComponents[pluginId]];
      
      // Eliminar cada extensión
      extensionsToRemove.forEach(registration => {
        const { extensionId, zoneId } = registration;
        
        // Filtrar la extensión
        if (this.extensionPoints[zoneId]) {
          this.extensionPoints[zoneId] = this.extensionPoints[zoneId].filter(
            ext => ext.id !== extensionId
          );
          
          // Marcar zona como afectada
          affectedZones.add(zoneId);
        }
      });
      
      // Limpiar registro del plugin
      delete this.pluginComponents[pluginId];
      
      // Notificar cambios en zonas afectadas
      affectedZones.forEach(zone => this._notifyExtensionPointChanged(zone));
      
      return true;
    } catch (error) {
      console.error(`Error al eliminar extensiones del plugin ${pluginId}:`, error);
      return false;
    }
  }

  /**
   * Obtiene las extensiones para un punto específico
   * @param {string} zoneId - ID de la zona
   * @returns {Array} Array de extensiones para la zona
   */
  getExtensionsForZone(zoneId) {
    if (!zoneId || !this.extensionPoints[zoneId]) {
      return [];
    }
    
    return [...this.extensionPoints[zoneId]];
  }

  /**
   * Obtiene todas las extensiones registradas por un plugin
   * @param {string} pluginId - ID del plugin
   * @returns {Array} Array de extensiones del plugin
   */
  getPluginExtensions(pluginId) {
    if (!pluginId || !this.pluginComponents[pluginId]) {
      return [];
    }
    
    return this.pluginComponents[pluginId].map(reg => {
      const { extensionId, zoneId } = reg;
      const extension = this.extensionPoints[zoneId]?.find(ext => ext.id === extensionId);
      return extension ? { ...extension, zoneId } : null;
    }).filter(Boolean);
  }

  /**
   * Obtiene estadísticas de uso de extensiones
   * @returns {Object} Estadísticas de uso
   */
  getExtensionStats() {
    const stats = {
      totalExtensions: 0,
      extensionsByZone: {},
      extensionsByPlugin: {}
    };
    
    // Calcular totales por zona
    Object.entries(this.extensionPoints).forEach(([zoneId, extensions]) => {
      stats.totalExtensions += extensions.length;
      stats.extensionsByZone[zoneId] = extensions.length;
    });
    
    // Calcular totales por plugin
    Object.entries(this.pluginComponents).forEach(([pluginId, registrations]) => {
      stats.extensionsByPlugin[pluginId] = registrations.length;
    });
    
    return stats;
  }

  /**
   * Notifica un cambio en un punto de extensión
   * @param {string} zoneId - ID de la zona que cambió
   * @private
   */
  _notifyExtensionPointChanged(zoneId) {
    if (!zoneId) return;
    
    // Notificar mediante evento
    eventBus.publish('pluginSystem.extensionPointChanged', {
      zoneId,
      extensions: this.extensionPoints[zoneId] || []
    });
    
    // Notificar en zona específica
    eventBus.publish(`pluginSystem.extension.${zoneId}`, {
      extensions: this.extensionPoints[zoneId] || []
    });
  }
}

// Exportar instancia única
const uiExtensionManager = new UIExtensionManager();
export default uiExtensionManager;