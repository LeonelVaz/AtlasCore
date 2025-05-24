/**
 * @jest-environment jsdom
 */
import pluginCompatibility from '../../../../../src/core/plugins/plugin-compatibility';
import { PLUGIN_CONSTANTS } from '../../../../../src/core/config/constants';
// La función compareVersions se importa directamente desde plugin-validator,
// y plugin-compatibility la usa. No necesitamos mockearla aquí a menos que
// queramos aislar completamente plugin-compatibility de la implementación de compareVersions.
// Por ahora, asumimos que compareVersions funciona como se espera.

// Mockear dependencias
jest.mock('../../../../../src/core/plugins/plugin-registry', () => ({
  getPlugin: jest.fn(),
  getActivePlugins: jest.fn(() => []), 
}));

jest.mock('../../../../../src/core/bus/event-bus', () => ({
  publish: jest.fn(),
}));

// Importar los módulos mockeados para acceder a sus funciones jest.fn()
const pluginRegistry = require('../../../../../src/core/plugins/plugin-registry');
const eventBus = require('../../../../../src/core/bus/event-bus');


describe('PluginCompatibility', () => {
  // Guardar el valor original de CURRENT_APP_VERSION para restaurarlo
  const originalAppVersion = PLUGIN_CONSTANTS.CURRENT_APP_VERSION;
  let originalConsoleError; // Para mockear console.error

  beforeEach(() => {
    jest.clearAllMocks();
    // pluginCompatibility es un singleton, limpiar su estado interno
    pluginCompatibility.incompatibilities = {};
    pluginCompatibility.conflicts = {};
    
    // Establecer una versión de app conocida para los tests para mayor consistencia
    // y mockear el acceso a PLUGIN_CONSTANTS.CURRENT_APP_VERSION si es necesario,
    // o simplemente setear pluginCompatibility.appVersion.
    pluginCompatibility.appVersion = '0.4.0'; // Usar una versión fija para tests

    // Configuración por defecto de los mocks
    pluginRegistry.getActivePlugins.mockReturnValue([]); // Por defecto, no hay otros plugins activos
    pluginRegistry.getPlugin.mockImplementation(id => null); // Por defecto, los plugins no existen

    originalConsoleError = console.error;
    console.error = jest.fn(); // Mock para silenciar y verificar errores
  });

  afterEach(() => {
    // Restaurar la versión original de la app en PLUGIN_CONSTANTS si se modificó
    PLUGIN_CONSTANTS.CURRENT_APP_VERSION = originalAppVersion;
    // Restaurar appVersion en la instancia si también se cambió allí
    pluginCompatibility.appVersion = originalAppVersion; 
    console.error = originalConsoleError;
  });

  describe('checkAppCompatibility', () => {
    test('debe ser compatible si la versión de la app está en rango', () => {
      const plugin = { id: 'p1', minAppVersion: '0.3.0', maxAppVersion: '0.5.0' };
      pluginCompatibility.appVersion = '0.4.0'; // Asegurar versión de app para este test
      const result = pluginCompatibility.checkAppCompatibility(plugin);
      expect(result.compatible).toBe(true);
    });

    test('debe ser incompatible si la app es más antigua que minAppVersion', () => {
      const plugin = { id: 'p1', minAppVersion: '0.5.0', maxAppVersion: '0.6.0' };
      pluginCompatibility.appVersion = '0.4.0';
      const result = pluginCompatibility.checkAppCompatibility(plugin);
      expect(result.compatible).toBe(false);
      expect(result.reason).toContain('requiere la versión 0.5.0 o superior');
    });

    test('debe ser incompatible si la app es más nueva que maxAppVersion', () => {
      const plugin = { id: 'p1', minAppVersion: '0.3.0', maxAppVersion: '0.3.5' };
      pluginCompatibility.appVersion = '0.4.0';
      const result = pluginCompatibility.checkAppCompatibility(plugin);
      expect(result.compatible).toBe(false);
      expect(result.reason).toContain('solo es compatible hasta la versión 0.3.5');
    });

    test('debe ser incompatible si falta minAppVersion', () => {
        const plugin = { id: 'p1', maxAppVersion: '0.5.0' };
        const result = pluginCompatibility.checkAppCompatibility(plugin);
        expect(result.compatible).toBe(false);
        expect(result.reason).toBe('No se especificó la versión mínima de la aplicación');
    });

    test('debe ser incompatible si falta maxAppVersion', () => {
        const plugin = { id: 'p1', minAppVersion: '0.3.0' };
        const result = pluginCompatibility.checkAppCompatibility(plugin);
        expect(result.compatible).toBe(false);
        expect(result.reason).toBe('No se especificó la versión máxima de la aplicación');
    });

    test('debe manejar error interno y devolver incompatible', () => {
        const plugin = { id: 'p1', minAppVersion: '0.3.0', maxAppVersion: '0.5.0' };
        // Forzar un error en compareVersions (que es usado internamente)
        // Esto es más complejo de mockear ya que es una importación directa.
        // Por ahora, probamos el catch por un error genérico.
        // Haremos que this.appVersion sea inválido para forzar un error en compareVersions si no lo maneja bien
        Object.defineProperty(pluginCompatibility, 'appVersion', { 
            get: () => { throw new Error('Internal compare error simulation'); },
            configurable: true // Permitir redefinir para restaurar después
        });

        const result = pluginCompatibility.checkAppCompatibility(plugin);
        expect(result.compatible).toBe(false);
        expect(result.reason).toContain('Error al verificar compatibilidad: Internal compare error simulation');
        expect(console.error).toHaveBeenCalled();

        // Restaurar appVersion
        Object.defineProperty(pluginCompatibility, 'appVersion', { 
            value: originalAppVersion,
            writable: true, // Asegurar que sea writable para el afterEach
            configurable: true
        });
    });
  });

  describe('checkDependencies', () => {
    test('debe estar satisfecho si no hay dependencias', () => {
      const plugin = { id: 'p1', dependencies: [] };
      const result = pluginCompatibility.checkDependencies(plugin);
      expect(result.satisfied).toBe(true);
    });

    test('debe estar satisfecho si todas las dependencias existen y cumplen versión', () => {
      pluginRegistry.getPlugin.mockImplementation(id => {
        if (id === 'depA') return { id: 'depA', version: '1.2.0' };
        return null;
      });
      const plugin = { id: 'p1', dependencies: [{ id: 'depA', version: '1.0.0' }] };
      const result = pluginCompatibility.checkDependencies(plugin);
      expect(result.satisfied).toBe(true);
    });

    test('no debe estar satisfecho si falta una dependencia', () => {
      pluginRegistry.getPlugin.mockReturnValue(null);
      const plugin = { id: 'p1', dependencies: [{ id: 'depMissing', version: '1.0.0' }] };
      const result = pluginCompatibility.checkDependencies(plugin);
      expect(result.satisfied).toBe(false);
      expect(result.missing[0]).toMatchObject({ id: 'depMissing', reason: 'Plugin no encontrado' });
    });

    test('no debe estar satisfecho si la versión de la dependencia es menor a la requerida', () => {
      pluginRegistry.getPlugin.mockImplementation(id => {
        if (id === 'depOld') return { id: 'depOld', version: '0.9.0' };
        return null;
      });
      const plugin = { id: 'p1', dependencies: [{ id: 'depOld', version: '1.0.0' }] };
      const result = pluginCompatibility.checkDependencies(plugin);
      expect(result.satisfied).toBe(false);
      expect(result.missing[0]).toMatchObject({ id: 'depOld', reason: 'Se requiere versión 1.0.0 o superior' });
    });

    test('debe manejar dependencias con formato inválido', () => {
        const plugin = { id: 'p1', dependencies: [{ version: '1.0.0' }] }; // Falta id
        const result = pluginCompatibility.checkDependencies(plugin);
        expect(result.satisfied).toBe(false);
        expect(result.missing[0]).toMatchObject({ id: 'desconocido', reason: 'Formato de dependencia inválido' });
    });
  });

  describe('checkConflicts & checkReversedConflicts', () => {
    const pluginCurrent = { id: 'currentP', name: 'Current Plugin', conflicts: ['pluginConflictA'] };
    const pluginActiveConflictA = { id: 'pluginConflictA', name: 'Conflicting Plugin A', conflicts: [] };
    const pluginActiveDeclaresConflict = { id: 'pluginX', name: 'Plugin X', conflicts: [{id: 'currentP', reason: 'X conflicts with currentP'}] };

    test('checkConflicts: debe detectar conflicto si un plugin activo está en la lista de conflictos', () => {
      pluginRegistry.getActivePlugins.mockReturnValue([pluginActiveConflictA]);
      const result = pluginCompatibility.checkConflicts(pluginCurrent);
      expect(result.hasConflicts).toBe(true);
      expect(result.conflicts[0]).toMatchObject({ id: 'pluginConflictA', reason: 'Conflicto declarado con este plugin' });
    });

    test('checkConflicts: no debe detectar conflicto si no hay plugins activos conflictivos', () => {
        pluginRegistry.getActivePlugins.mockReturnValue([{id: 'otherPlugin'}]);
        const result = pluginCompatibility.checkConflicts(pluginCurrent);
        expect(result.hasConflicts).toBe(false);
      });

    test('checkReversedConflicts: debe detectar conflicto si un plugin activo declara conflicto con el actual', () => {
      pluginRegistry.getActivePlugins.mockReturnValue([pluginActiveDeclaresConflict]);
      const result = pluginCompatibility.checkReversedConflicts(pluginCurrent);
      expect(result.hasConflicts).toBe(true);
      expect(result.conflicts[0]).toMatchObject({ id: 'pluginX', reason: 'X conflicts with currentP' });
    });

    test('checkReversedConflicts: no debe detectar conflicto si ningún plugin activo declara conflicto', () => {
        pluginRegistry.getActivePlugins.mockReturnValue([pluginActiveConflictA]); // pluginActiveConflictA no declara conflicto con currentP
        const result = pluginCompatibility.checkReversedConflicts(pluginCurrent);
        expect(result.hasConflicts).toBe(false);
      });
  });

  describe('runFullCompatibilityCheck', () => {
    test('debe devolver compatible true si todas las verificaciones pasan', () => {
      const plugin = { id: 'pGood', minAppVersion: '0.3.0', maxAppVersion: '0.5.0', dependencies: [], conflicts: [] };
      pluginCompatibility.appVersion = '0.4.0';
      pluginRegistry.getActivePlugins.mockReturnValue([]); 

      const result = pluginCompatibility.runFullCompatibilityCheck(plugin);
      expect(result.compatible).toBe(true);
      expect(result.reason).toBe('Compatible'); // O una cadena vacía si es la implementación
      expect(eventBus.publish).toHaveBeenCalledWith('pluginSystem.compatibilityChecked', expect.objectContaining({
        pluginId: 'pGood',
        compatible: true,
      }));
      expect(pluginCompatibility.getIncompatibilityInfo('pGood')).toBeNull();
      expect(pluginCompatibility.getConflictInfo('pGood')).toBeNull();
    });

    test('debe devolver compatible false y razones si falla appCompat', () => {
      const plugin = { id: 'pBadApp', minAppVersion: '0.5.0', maxAppVersion: '0.6.0' }; 
      pluginCompatibility.appVersion = '0.4.0';
      
      const result = pluginCompatibility.runFullCompatibilityCheck(plugin);
      expect(result.compatible).toBe(false);
      expect(result.reason).toContain('requiere la versión 0.5.0 o superior');
      expect(pluginCompatibility.getIncompatibilityInfo('pBadApp')).toBeDefined();
      expect(eventBus.publish).toHaveBeenCalledWith('pluginSystem.compatibilityChecked', expect.objectContaining({
        pluginId: 'pBadApp',
        compatible: false,
      }));
    });

    test('debe devolver compatible false y razones si fallan las dependencias', () => {
        const plugin = { id: 'pBadDeps', minAppVersion: '0.3.0', maxAppVersion: '0.5.0', dependencies: [{id: 'missingDep', version: '1.0.0'}] };
        pluginCompatibility.appVersion = '0.4.0';
        pluginRegistry.getPlugin.mockReturnValue(null); // missingDep no existe
        
        const result = pluginCompatibility.runFullCompatibilityCheck(plugin);
        expect(result.compatible).toBe(false);
        expect(result.reason).toContain('Faltan 1 dependencias');
        expect(pluginCompatibility.getIncompatibilityInfo('pBadDeps')).toBeDefined();
      });

    test('debe devolver compatible false y razones si hay conflictos', () => {
        const plugin = { id: 'pBadConflict', minAppVersion: '0.3.0', maxAppVersion: '0.5.0', conflicts: ['activeP'] };
        pluginCompatibility.appVersion = '0.4.0';
        pluginRegistry.getActivePlugins.mockReturnValue([{id: 'activeP', name: 'Active Plugin'}]);
        
        const result = pluginCompatibility.runFullCompatibilityCheck(plugin);
        expect(result.compatible).toBe(false);
        expect(result.reason).toContain('Conflicto con 1 plugins activos');
        expect(pluginCompatibility.getIncompatibilityInfo('pBadConflict')).toBeDefined();
        expect(pluginCompatibility.getConflictInfo('pBadConflict')).toBeDefined();
    });
  });

  describe('getIncompatibilityInfo, getConflictInfo, getAll, clear', () => {
    test('debe gestionar correctamente la información de incompatibilidad y conflictos', () => {
        const plugin = { id: 'p1', minAppVersion: '1.0.0', maxAppVersion: '1.0.0' }; // Incompatible
        pluginCompatibility.appVersion = '0.4.0';
        pluginCompatibility.runFullCompatibilityCheck(plugin);

        expect(pluginCompatibility.getIncompatibilityInfo('p1')).not.toBeNull();
        expect(pluginCompatibility.getAllIncompatibilities()['p1']).toBeDefined();
        
        // Asumimos que no hay conflictos para este plugin
        expect(pluginCompatibility.getConflictInfo('p1')).toBeNull();
        expect(Object.keys(pluginCompatibility.getAllConflicts()).length).toBe(0);

        pluginCompatibility.clear();
        expect(pluginCompatibility.getIncompatibilityInfo('p1')).toBeNull();
        expect(Object.keys(pluginCompatibility.getAllIncompatibilities()).length).toBe(0);
    });
  });
});