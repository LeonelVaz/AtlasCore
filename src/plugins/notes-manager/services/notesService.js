export class NotesService {
  constructor(plugin, core) {
    this.plugin = plugin;
    this.core = core;
  }
  
  // Crear una nueva nota
  crearNota(fecha, contenido, opciones = {}) {
    try {
      const fechaStr = this._formatDateKey(fecha);
      const notaId = this._generateId();
      
      const nuevaNota = {
        id: notaId,
        contenido: contenido,
        fechaCreacion: Date.now(),
        fechaModificacion: Date.now(),
        categoria: opciones.categoria || 'general',
        color: opciones.color || this.plugin._data.categorias[opciones.categoria || 'general'].color,
        etiquetas: opciones.etiquetas || [],
        eventoId: opciones.eventoId || null,
        completada: false,
        ...opciones
      };
      
      // Inicializar array de notas para la fecha si no existe
      if (!this.plugin._data.notas[fechaStr]) {
        this.plugin._data.notas[fechaStr] = [];
      }
      
      // Agregar la nota
      this.plugin._data.notas[fechaStr].push(nuevaNota);
      
      // Guardar cambios
      this._guardarCambios();
      
      // Publicar evento
      this.core.events.publish(
        this.plugin.id,
        'administradorNotas.notaCreada',
        { fecha: fechaStr, nota: nuevaNota }
      );
      
      return nuevaNota;
    } catch (error) {
      console.error('[NotesService] Error al crear nota:', error);
      throw error;
    }
  }
  
  // Actualizar una nota existente
  actualizarNota(fecha, notaId, cambios) {
    try {
      const fechaStr = this._formatDateKey(fecha);
      const notas = this.plugin._data.notas[fechaStr];
      
      if (!notas) {
        throw new Error('No hay notas para esta fecha');
      }
      
      const indiceNota = notas.findIndex(nota => nota.id === notaId);
      if (indiceNota === -1) {
        throw new Error('Nota no encontrada');
      }
      
      // Actualizar la nota
      const notaActualizada = {
        ...notas[indiceNota],
        ...cambios,
        fechaModificacion: Date.now()
      };
      
      this.plugin._data.notas[fechaStr][indiceNota] = notaActualizada;
      
      // Guardar cambios
      this._guardarCambios();
      
      // Publicar evento
      this.core.events.publish(
        this.plugin.id,
        'administradorNotas.notaActualizada',
        { fecha: fechaStr, nota: notaActualizada }
      );
      
      return notaActualizada;
    } catch (error) {
      console.error('[NotesService] Error al actualizar nota:', error);
      throw error;
    }
  }
  
  // Eliminar una nota
  eliminarNota(fecha, notaId) {
    try {
      const fechaStr = this._formatDateKey(fecha);
      const notas = this.plugin._data.notas[fechaStr];
      
      if (!notas) {
        throw new Error('No hay notas para esta fecha');
      }
      
      const indiceNota = notas.findIndex(nota => nota.id === notaId);
      if (indiceNota === -1) {
        throw new Error('Nota no encontrada');
      }
      
      // Eliminar la nota
      const notaEliminada = notas.splice(indiceNota, 1)[0];
      
      // Si no quedan notas para esta fecha, eliminar la entrada
      if (this.plugin._data.notas[fechaStr].length === 0) {
        delete this.plugin._data.notas[fechaStr];
      }
      
      // Guardar cambios
      this._guardarCambios();
      
      // Publicar evento
      this.core.events.publish(
        this.plugin.id,
        'administradorNotas.notaEliminada',
        { fecha: fechaStr, notaId: notaId }
      );
      
      return true;
    } catch (error) {
      console.error('[NotesService] Error al eliminar nota:', error);
      throw error;
    }
  }
  
  // Buscar notas por término
  buscarNotas(termino) {
    const resultados = [];
    const terminoLower = termino.toLowerCase();
    
    Object.entries(this.plugin._data.notas).forEach(([fecha, notas]) => {
      notas.forEach(nota => {
        // Buscar en contenido
        if (nota.contenido.toLowerCase().includes(terminoLower)) {
          resultados.push({ fecha, nota, coincidencia: 'contenido' });
          return;
        }
        
        // Buscar en etiquetas
        if (nota.etiquetas.some(etiqueta => etiqueta.toLowerCase().includes(terminoLower))) {
          resultados.push({ fecha, nota, coincidencia: 'etiquetas' });
          return;
        }
        
        // Buscar en categoría
        const categoria = this.plugin._data.categorias[nota.categoria];
        if (categoria && categoria.nombre.toLowerCase().includes(terminoLower)) {
          resultados.push({ fecha, nota, coincidencia: 'categoria' });
        }
      });
    });
    
    // Ordenar por fecha más reciente
    resultados.sort((a, b) => {
      const fechaA = new Date(a.fecha);
      const fechaB = new Date(b.fecha);
      return fechaB - fechaA;
    });
    
    return resultados;
  }
  
  // Mover nota a otra fecha
  moverNota(fechaOrigen, fechaDestino, notaId) {
    try {
      const fechaOrigenStr = this._formatDateKey(fechaOrigen);
      const fechaDestinoStr = this._formatDateKey(fechaDestino);
      
      const notasOrigen = this.plugin._data.notas[fechaOrigenStr];
      if (!notasOrigen) {
        throw new Error('No hay notas en la fecha de origen');
      }
      
      const indiceNota = notasOrigen.findIndex(nota => nota.id === notaId);
      if (indiceNota === -1) {
        throw new Error('Nota no encontrada');
      }
      
      // Extraer la nota
      const nota = notasOrigen.splice(indiceNota, 1)[0];
      
      // Limpiar fecha origen si está vacía
      if (notasOrigen.length === 0) {
        delete this.plugin._data.notas[fechaOrigenStr];
      }
      
      // Inicializar fecha destino si no existe
      if (!this.plugin._data.notas[fechaDestinoStr]) {
        this.plugin._data.notas[fechaDestinoStr] = [];
      }
      
      // Agregar nota a fecha destino
      this.plugin._data.notas[fechaDestinoStr].push(nota);
      
      // Guardar cambios
      this._guardarCambios();
      
      // Publicar evento
      this.core.events.publish(
        this.plugin.id,
        'administradorNotas.notaMovida',
        { 
          fechaOrigen: fechaOrigenStr, 
          fechaDestino: fechaDestinoStr, 
          nota: nota 
        }
      );
      
      return true;
    } catch (error) {
      console.error('[NotesService] Error al mover nota:', error);
      throw error;
    }
  }
  
  // Actualizar referencias de evento cuando cambia de fecha
  actualizarReferenciasEvento(eventoId, fechaAnterior, fechaNueva) {
    try {
      const fechaAnteriorStr = this._formatDateKey(fechaAnterior);
      const fechaNuevaStr = this._formatDateKey(fechaNueva);
      
      const notasAfectadas = [];
      
      // Buscar notas con este eventoId en la fecha anterior
      if (this.plugin._data.notas[fechaAnteriorStr]) {
        const notasEvento = this.plugin._data.notas[fechaAnteriorStr].filter(
          nota => nota.eventoId === eventoId
        );
        
        notasEvento.forEach(nota => {
          this.moverNota(fechaAnterior, fechaNueva, nota.id);
          notasAfectadas.push(nota);
        });
      }
      
      return notasAfectadas;
    } catch (error) {
      console.error('[NotesService] Error al actualizar referencias:', error);
      return [];
    }
  }
  
  // Marcar notas como huérfanas cuando se elimina un evento
  marcarNotasHuerfanas(eventoId) {
    let notasActualizadas = 0;
    
    Object.entries(this.plugin._data.notas).forEach(([fecha, notas]) => {
      notas.forEach(nota => {
        if (nota.eventoId === eventoId) {
          nota.huerfana = true;
          nota.eventoIdAnterior = eventoId;
          nota.eventoId = null;
          notasActualizadas++;
        }
      });
    });
    
    if (notasActualizadas > 0) {
      this._guardarCambios();
      
      this.core.events.publish(
        this.plugin.id,
        'administradorNotas.notasHuerfanas',
        { eventoId: eventoId, cantidad: notasActualizadas }
      );
    }
    
    return notasActualizadas;
  }
  
  // Limpiar notas huérfanas
  limpiarNotasHuerfanas() {
    let notasEliminadas = 0;
    
    Object.entries(this.plugin._data.notas).forEach(([fecha, notas]) => {
      const notasValidas = notas.filter(nota => {
        if (nota.huerfana) {
          notasEliminadas++;
          return false;
        }
        return true;
      });
      
      if (notasValidas.length === 0) {
        delete this.plugin._data.notas[fecha];
      } else {
        this.plugin._data.notas[fecha] = notasValidas;
      }
    });
    
    if (notasEliminadas > 0) {
      this._guardarCambios();
    }
    
    return notasEliminadas;
  }
  
  // Obtener estadísticas
  obtenerEstadisticas() {
    const stats = {
      totalNotas: 0,
      notasPorCategoria: {},
      notasPorMes: {},
      etiquetasMasUsadas: {},
      notasHuerfanas: 0
    };
    
    Object.entries(this.plugin._data.notas).forEach(([fecha, notas]) => {
      stats.totalNotas += notas.length;
      
      const mes = fecha.substring(0, 7); // YYYY-MM
      stats.notasPorMes[mes] = (stats.notasPorMes[mes] || 0) + notas.length;
      
      notas.forEach(nota => {
        // Por categoría
        stats.notasPorCategoria[nota.categoria] = 
          (stats.notasPorCategoria[nota.categoria] || 0) + 1;
        
        // Etiquetas
        nota.etiquetas.forEach(etiqueta => {
          stats.etiquetasMasUsadas[etiqueta] = 
            (stats.etiquetasMasUsadas[etiqueta] || 0) + 1;
        });
        
        // Huérfanas
        if (nota.huerfana) {
          stats.notasHuerfanas++;
        }
      });
    });
    
    // Ordenar etiquetas por frecuencia
    stats.etiquetasMasUsadas = Object.entries(stats.etiquetasMasUsadas)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .reduce((acc, [etiqueta, count]) => {
        acc[etiqueta] = count;
        return acc;
      }, {});
    
    return stats;
  }
  
  // Helpers privados
  _formatDateKey(fecha) {
    if (typeof fecha === 'string') {
      return fecha.split('T')[0];
    }
    return new Date(fecha).toISOString().split('T')[0];
  }
  
  _generateId() {
    return 'nota_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  _guardarCambios() {
    this.plugin._storageService.saveData(this.plugin._data)
      .catch(error => {
        console.error('[NotesService] Error al guardar cambios:', error);
      });
  }
}