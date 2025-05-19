/**
 * Servicio de almacenamiento para el plugin
 */

/**
 * Inicializa el servicio de almacenamiento
 * @param {Object} core - Objeto core de Atlas
 */
export function initStorage(core) {
  console.log('[Plugin Tester] Inicializando servicio de almacenamiento...');
}

/**
 * Carga los datos del plugin desde el almacenamiento
 * @param {Object} core - Objeto core de Atlas
 * @param {string} pluginId - ID del plugin
 * @param {Object} defaultData - Datos por defecto a usar si no hay datos guardados
 * @returns {Promise<Object>} Datos cargados o datos por defecto
 */
export async function loadData(core, pluginId, defaultData) {
  try {
    console.log('[Plugin Tester] Cargando datos...');
    const savedData = await core.storage.getItem(
      pluginId,
      'plugin-data',
      null
    );
    
    if (savedData) {
      console.log('[Plugin Tester] Datos cargados:', savedData);
      return { ...defaultData, ...savedData };
    } else {
      console.log('[Plugin Tester] No se encontraron datos guardados. Usando valores predeterminados.');
      return defaultData;
    }
  } catch (error) {
    console.error('[Plugin Tester] Error al cargar datos:', error);
    return defaultData;
  }
}

/**
 * Guarda los datos del plugin en el almacenamiento
 * @param {Object} core - Objeto core de Atlas
 * @param {string} pluginId - ID del plugin
 * @param {Object} data - Datos a guardar
 */
export async function saveData(core, pluginId, data) {
  try {
    console.log('[Plugin Tester] Guardando datos...');
    await core.storage.setItem(
      pluginId,
      'plugin-data',
      data
    );
    console.log('[Plugin Tester] Datos guardados con éxito.');
  } catch (error) {
    console.error('[Plugin Tester] Error al guardar datos:', error);
  }
}