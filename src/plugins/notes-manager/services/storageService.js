export class StorageService {
  constructor(plugin, core) {
    this.plugin = plugin;
    this.core = core;
    this.STORAGE_KEY = 'notas-data';
    this.SETTINGS_KEY = 'notas-settings';
  }
  
  // Cargar todos los datos del plugin
  async loadData() {
    try {
      const [notasData, settings] = await Promise.all([
        this.core.storage.getItem(this.plugin.id, this.STORAGE_KEY, null),
        this.core.storage.getItem(this.plugin.id, this.SETTINGS_KEY, null)
      ]);
      
      const data = {};
      
      if (notasData) {
        data.notas = notasData.notas || {};
        data.categorias = notasData.categorias || this.plugin._data.categorias;
      }
      
      if (settings) {
        data.configuracion = settings;
      }
      
      console.log('[StorageService] Datos cargados correctamente');
      return data;
    } catch (error) {
      console.error('[StorageService] Error al cargar datos:', error);
      return null;
    }
  }
  
  // Guardar todos los datos del plugin
  async saveData(data) {
    try {
      const notasData = {
        notas: data.notas,
        categorias: data.categorias
      };
      
      await Promise.all([
        this.core.storage.setItem(this.plugin.id, this.STORAGE_KEY, notasData),
        this.core.storage.setItem(this.plugin.id, this.SETTINGS_KEY, data.configuracion)
      ]);
      
      console.log('[StorageService] Datos guardados correctamente');
      return true;
    } catch (error) {
      console.error('[StorageService] Error al guardar datos:', error);
      throw error;
    }
  }
  
  // Exportar datos como JSON
  async exportData() {
    try {
      const dataToExport = {
        version: this.plugin.version,
        exportDate: new Date().toISOString(),
        notas: this.plugin._data.notas,
        categorias: this.plugin._data.categorias,
        configuracion: this.plugin._data.configuracion
      };
      
      return JSON.stringify(dataToExport, null, 2);
    } catch (error) {
      console.error('[StorageService] Error al exportar datos:', error);
      throw error;
    }
  }
  
  // Importar datos desde JSON
  async importData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      
      // Validar estructura básica
      if (!data.notas || typeof data.notas !== 'object') {
        throw new Error('Formato de datos inválido: falta el campo "notas"');
      }
      
      // Validar versión si existe
      if (data.version) {
        const [major, minor] = data.version.split('.');
        const [currentMajor, currentMinor] = this.plugin.version.split('.');
        
        if (parseInt(major) > parseInt(currentMajor)) {
          throw new Error('Los datos provienen de una versión más nueva del plugin');
        }
      }
      
      // Importar datos
      this.plugin._data.notas = data.notas;
      
      if (data.categorias) {
        this.plugin._data.categorias = { 
          ...this.plugin._data.categorias, 
          ...data.categorias 
        };
      }
      
      if (data.configuracion) {
        this.plugin._data.configuracion = { 
          ...this.plugin._data.configuracion, 
          ...data.configuracion 
        };
      }
      
      // Guardar datos importados
      await this.saveData(this.plugin._data);
      
      // Publicar evento de importación
      this.core.events.publish(
        this.plugin.id,
        'administradorNotas.datosImportados',
        { notasImportadas: Object.keys(data.notas).length }
      );
      
      return true;
    } catch (error) {
      console.error('[StorageService] Error al importar datos:', error);
      throw error;
    }
  }
  
  // Crear backup de datos
  async createBackup() {
    try {
      const backupKey = `backup_${Date.now()}`;
      const backupData = {
        timestamp: Date.now(),
        data: this.plugin._data
      };
      
      await this.core.storage.setItem(this.plugin.id, backupKey, backupData);
      
      // Mantener solo los últimos 5 backups
      await this._cleanOldBackups();
      
      return backupKey;
    } catch (error) {
      console.error('[StorageService] Error al crear backup:', error);
      throw error;
    }
  }
  
  // Restaurar desde backup
  async restoreFromBackup(backupKey) {
    try {
      const backupData = await this.core.storage.getItem(this.plugin.id, backupKey, null);
      
      if (!backupData || !backupData.data) {
        throw new Error('Backup no encontrado o corrupto');
      }
      
      this.plugin._data = backupData.data;
      await this.saveData(this.plugin._data);
      
      // Publicar evento de restauración
      this.core.events.publish(
        this.plugin.id,
        'administradorNotas.datosRestaurados',
        { backupKey: backupKey, timestamp: backupData.timestamp }
      );
      
      return true;
    } catch (error) {
      console.error('[StorageService] Error al restaurar backup:', error);
      throw error;
    }
  }
  
  // Listar backups disponibles
  async listBackups() {
    try {
      // Este método asume que podemos obtener todas las claves del storage
      // Si no es posible, mantendríamos una lista separada de backups
      const allKeys = await this._getAllStorageKeys();
      const backupKeys = allKeys.filter(key => key.startsWith('backup_'));
      
      const backups = [];
      for (const key of backupKeys) {
        const data = await this.core.storage.getItem(this.plugin.id, key, null);
        if (data && data.timestamp) {
          backups.push({
            key: key,
            timestamp: data.timestamp,
            date: new Date(data.timestamp).toLocaleString()
          });
        }
      }
      
      // Ordenar por fecha más reciente
      backups.sort((a, b) => b.timestamp - a.timestamp);
      
      return backups;
    } catch (error) {
      console.error('[StorageService] Error al listar backups:', error);
      return [];
    }
  }
  
  // Limpiar datos antiguos
  async cleanOldData(diasAntiguedad = 365) {
    try {
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - diasAntiguedad);
      const fechaLimiteStr = fechaLimite.toISOString().split('T')[0];
      
      let notasEliminadas = 0;
      
      Object.keys(this.plugin._data.notas).forEach(fecha => {
        if (fecha < fechaLimiteStr) {
          notasEliminadas += this.plugin._data.notas[fecha].length;
          delete this.plugin._data.notas[fecha];
        }
      });
      
      if (notasEliminadas > 0) {
        await this.saveData(this.plugin._data);
      }
      
      return notasEliminadas;
    } catch (error) {
      console.error('[StorageService] Error al limpiar datos antiguos:', error);
      throw error;
    }
  }
  
  // Helpers privados
  async _getAllStorageKeys() {
    // Este es un método placeholder ya que la API actual no proporciona
    // una forma de obtener todas las claves. En una implementación real,
    // mantendríamos una lista de claves en el storage
    return [];
  }
  
  async _cleanOldBackups() {
    try {
      const backups = await this.listBackups();
      
      // Mantener solo los últimos 5 backups
      if (backups.length > 5) {
        const backupsToDelete = backups.slice(5);
        
        for (const backup of backupsToDelete) {
          await this.core.storage.removeItem(this.plugin.id, backup.key);
        }
      }
    } catch (error) {
      console.error('[StorageService] Error al limpiar backups antiguos:', error);
    }
  }
}