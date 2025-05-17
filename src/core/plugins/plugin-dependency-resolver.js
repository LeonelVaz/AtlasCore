/**
 * Resolvedor de dependencias para plugins de Atlas
 * 
 * Este módulo se encarga de analizar las dependencias entre plugins,
 * detectar ciclos, y determinar el orden correcto de carga/inicialización.
 */

import pluginRegistry from './plugin-registry';
import pluginCompatibility from './plugin-compatibility';
import eventBus from '../bus/event-bus';

/**
 * Clase para resolución de dependencias entre plugins
 */
class PluginDependencyResolver {
  constructor() {
    // Caché de orden de carga
    this.loadOrder = [];
    
    // Registro de dependencias por plugin
    this.dependencyGraph = {};
    
    // Dependencias inversas (quién depende de quién)
    this.reverseDependencies = {};
    
    // Caché de ciclos detectados
    this.detectedCycles = [];
  }

  /**
   * Construye el grafo de dependencias para análisis
   * @private
   */
  _buildDependencyGraph() {
    // Obtener todos los plugins registrados
    const allPlugins = pluginRegistry.getAllPlugins();
    
    // Reiniciar grafos
    this.dependencyGraph = {};
    this.reverseDependencies = {};
    
    // Construir grafo de dependencias
    for (const plugin of allPlugins) {
      if (!plugin.id) continue;
      
      // Inicializar entrada en el grafo si no existe
      if (!this.dependencyGraph[plugin.id]) {
        this.dependencyGraph[plugin.id] = [];
      }
      
      // Si no hay dependencias, continuar
      if (!plugin.dependencies || !Array.isArray(plugin.dependencies) || plugin.dependencies.length === 0) {
        continue;
      }
      
      // Agregar cada dependencia al grafo
      for (const dependency of plugin.dependencies) {
        const depId = typeof dependency === 'string' ? dependency : dependency.id;
        
        if (!depId) continue;
        
        // Añadir dependencia
        this.dependencyGraph[plugin.id].push(depId);
        
        // Inicializar entrada en dependencias inversas
        if (!this.reverseDependencies[depId]) {
          this.reverseDependencies[depId] = [];
        }
        
        // Añadir dependencia inversa
        this.reverseDependencies[depId].push(plugin.id);
      }
    }
    
    // Publicar evento para debug
    eventBus.publish('pluginSystem.dependencyGraphBuilt', {
      graph: { ...this.dependencyGraph },
      reverse: { ...this.reverseDependencies }
    });
  }

  /**
   * Detecta ciclos en el grafo de dependencias
   * @returns {Array} - Lista de ciclos detectados
   * @private
   */
  _detectCycles() {
    // Construir grafo si no existe
    if (Object.keys(this.dependencyGraph).length === 0) {
      this._buildDependencyGraph();
    }
    
    // Lista de ciclos detectados
    const cycles = [];
    
    // Conjuntos para seguimiento de visitas
    const visited = new Set();
    const inProgress = new Set();
    
    // Función recursiva para DFS
    const dfs = (node, path = []) => {
      // Si ya completamos este nodo, no hay ciclo
      if (visited.has(node)) {
        return;
      }
      
      // Si estamos procesando este nodo, encontramos un ciclo
      if (inProgress.has(node)) {
        // Extraer el ciclo
        const cycleStart = path.findIndex(n => n === node);
        const cycle = [...path.slice(cycleStart), node];
        
        // Añadir a la lista si no existe
        const cycleKey = cycle.join('->');
        if (!cycles.some(c => c.key === cycleKey)) {
          cycles.push({
            key: cycleKey,
            nodes: cycle,
            source: node
          });
        }
        return;
      }
      
      // Marcar como en progreso
      inProgress.add(node);
      path.push(node);
      
      // Visitar cada dependencia
      const dependencies = this.dependencyGraph[node] || [];
      for (const dependency of dependencies) {
        dfs(dependency, [...path]);
      }
      
      // Marcar como completado
      inProgress.delete(node);
      visited.add(node);
    };
    
    // Ejecutar DFS para cada nodo no visitado
    for (const node of Object.keys(this.dependencyGraph)) {
      if (!visited.has(node)) {
        dfs(node);
      }
    }
    
    // Guardar ciclos detectados
    this.detectedCycles = cycles;
    
    // Publicar evento si hay ciclos
    if (cycles.length > 0) {
      eventBus.publish('pluginSystem.cyclesDetected', {
        cycles: this.detectedCycles
      });
    }
    
    return cycles;
  }

  /**
   * Calcula el orden de carga basado en dependencias
   * @returns {Array} - Lista de IDs de plugins en orden de carga
   */
  calculateLoadOrder() {
    try {
      // Construir grafo si no existe
      if (Object.keys(this.dependencyGraph).length === 0) {
        this._buildDependencyGraph();
      }
      
      // Detectar ciclos
      const cycles = this._detectCycles();
      
      // Si hay ciclos, tenemos que romperlos para el orden de carga
      if (cycles.length > 0) {
        console.warn(`Detectados ${cycles.length} ciclos de dependencias, se romperán arbitrariamente para calcular orden de carga`);
      }
      
      // Conjunto de nodos visitados
      const visited = new Set();
      
      // Orden resultante
      const order = [];
      
      // Conjunto de nodos en el orden actual (para evitar duplicados)
      const inOrder = new Set();
      
      // Función recursiva para el ordenamiento topológico
      const visit = (node) => {
        // Evitar procesamiento repetido
        if (visited.has(node)) return;
        
        // Marcar como visitado
        visited.add(node);
        
        // Obtener dependencias
        const dependencies = this.dependencyGraph[node] || [];
        
        // Visitar primero las dependencias
        for (const dependency of dependencies) {
          // Si ya está en el orden, saltamos para evitar ciclos infinitos
          if (inOrder.has(dependency)) continue;
          
          visit(dependency);
        }
        
        // Añadir al orden si no está ya
        if (!inOrder.has(node)) {
          order.push(node);
          inOrder.add(node);
        }
      };
      
      // Visitar todos los nodos
      for (const node of Object.keys(this.dependencyGraph)) {
        visit(node);
      }
      
      // Plugins no incluidos en el grafo (sin dependencias)
      const allPlugins = pluginRegistry.getAllPlugins().map(p => p.id);
      const remainingPlugins = allPlugins.filter(id => !inOrder.has(id));
      
      // Añadir plugins sin dependencias al final
      order.push(...remainingPlugins);
      
      // Guardar orden calculado
      this.loadOrder = order;
      
      // Publicar evento con el orden calculado
      eventBus.publish('pluginSystem.loadOrderCalculated', {
        order: this.loadOrder,
        cycles: this.detectedCycles
      });
      
      return order;
    } catch (error) {
      console.error('Error al calcular orden de carga de plugins:', error);
      
      // En caso de error, devolver todos los plugins en cualquier orden
      const allPlugins = pluginRegistry.getAllPlugins().map(p => p.id);
      return allPlugins;
    }
  }

  /**
   * Obtiene la prioridad de un plugin para carga
   * @param {Object} plugin - Plugin a evaluar
   * @returns {number} - Prioridad (menor = carga antes)
   */
  getPluginPriority(plugin) {
    if (!plugin || !plugin.id) return 999;
    
    try {
      // Si el plugin define su propia prioridad, usarla
      if (plugin.priority !== undefined && typeof plugin.priority === 'number') {
        return plugin.priority;
      }
      
      // Si el plugin tiene el atributo "core", darle prioridad alta
      if (plugin.core === true) {
        return 10;
      }
      
      // Calcular basado en número de plugins que dependen de él
      const dependents = this.reverseDependencies[plugin.id] || [];
      
      // Más dependientes = mayor prioridad (número menor)
      return 100 - Math.min(90, dependents.length * 10);
    } catch (error) {
      console.error(`Error al calcular prioridad del plugin ${plugin.id}:`, error);
      return 500; // Prioridad baja por defecto en caso de error
    }
  }

  /**
   * Valida todos los plugins para dependencias
   * @returns {Object} - Resultado de la validación
   */
  validateAllPlugins() {
    try {
      // Construir grafo
      this._buildDependencyGraph();
      
      // Detectar ciclos
      const cycles = this._detectCycles();
      
      // Verificar cada plugin
      const allPlugins = pluginRegistry.getAllPlugins();
      const results = {};
      
      for (const plugin of allPlugins) {
        // Verificar compatibilidad con la app
        const appCompat = pluginCompatibility.checkAppCompatibility(plugin);
        
        // Verificar dependencias
        const dependencies = pluginCompatibility.checkDependencies(plugin);
        
        // Verificar conflictos
        const conflicts = pluginCompatibility.checkConflicts(plugin);
        
        // Verificar conflictos inversos
        const reversedConflicts = pluginCompatibility.checkReversedConflicts(plugin);
        
        // Verificar si está en algún ciclo
        const pluginCycles = cycles.filter(cycle => cycle.nodes.includes(plugin.id));
        
        // Determinar validez general
        const isValid = appCompat.compatible && 
                       dependencies.satisfied && 
                       !conflicts.hasConflicts &&
                       !reversedConflicts.hasConflicts && 
                       pluginCycles.length === 0;
        
        // Guardar resultado
        results[plugin.id] = {
          plugin: plugin.id,
          valid: isValid,
          appCompatibility: appCompat,
          dependencies,
          conflicts,
          reversedConflicts,
          cycles: pluginCycles,
          priority: this.getPluginPriority(plugin)
        };
      }
      
      // Publicar evento con resultados
      eventBus.publish('pluginSystem.pluginsValidated', {
        results,
        valid: Object.values(results).filter(r => r.valid).length,
        invalid: Object.values(results).filter(r => !r.valid).length,
        total: Object.values(results).length
      });
      
      return {
        results,
        valid: Object.values(results).filter(r => r.valid).length,
        invalid: Object.values(results).filter(r => !r.valid).length,
        total: Object.values(results).length,
        cycles
      };
    } catch (error) {
      console.error('Error al validar plugins:', error);
      return {
        error: error.message,
        results: {},
        valid: 0,
        invalid: 0,
        total: 0,
        cycles: []
      };
    }
  }

  /**
   * Obtiene los ciclos detectados en las dependencias
   * @returns {Array} - Lista de ciclos
   */
  getDetectedCycles() {
    // Si no hay ciclos detectados todavía, ejecutar detección
    if (this.detectedCycles.length === 0) {
      this._detectCycles();
    }
    
    return [...this.detectedCycles];
  }

  /**
   * Obtiene plugins que dependen de un plugin específico
   * @param {string} pluginId - ID del plugin
   * @returns {Array} - Lista de plugins dependientes
   */
  getDependentPlugins(pluginId) {
    // Construir grafo si no existe
    if (Object.keys(this.reverseDependencies).length === 0) {
      this._buildDependencyGraph();
    }
    
    return this.reverseDependencies[pluginId] || [];
  }

  /**
   * Limpia caché de cálculos
   */
  clearCache() {
    this.loadOrder = [];
    this.dependencyGraph = {};
    this.reverseDependencies = {};
    this.detectedCycles = [];
  }
}

// Exportar instancia única
const pluginDependencyResolver = new PluginDependencyResolver();
export default pluginDependencyResolver;