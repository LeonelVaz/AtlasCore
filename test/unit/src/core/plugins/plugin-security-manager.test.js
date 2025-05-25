/**
 * @jest-environment jsdom
 */
import pluginSecurityManager from '../../../../../src/core/plugins/plugin-security-manager';
import { PLUGIN_CONSTANTS } from '../../../../../src/core/config/constants';

// Mockear todas las dependencias
jest.mock('../../../../../src/core/plugins/plugin-registry', () => ({
  getPlugin: jest.fn(),
  isPluginActive: jest.fn(),
  getAllPlugins: jest.fn(() => []),
}));
jest.mock('../../../../../src/core/plugins/plugin-error-handler', () => ({
  handleError: jest.fn(),
}));
jest.mock('../../../../../src/core/plugins/plugin-sandbox', () => ({
  initialize: jest.fn(),
  validatePluginCode: jest.fn(() => ({ valid: true, reasons: [], violations: [] })), // Asegurar que devuelve violations
  setSecurityLevel: jest.fn(),
  updateSecurityChecks: jest.fn(),
}));
jest.mock('../../../../../src/core/plugins/plugin-resource-monitor', () => ({
  initialize: jest.fn(),
  applyRestrictions: jest.fn(),
  increaseMonitoring: jest.fn(),
  setSecurityLevel: jest.fn(),
  updateSecurityChecks: jest.fn(),
  getPluginResourceUsage: jest.fn(() => ({})),
  getResourceStats: jest.fn(() => ({})),
}));
jest.mock('../../../../../src/core/plugins/plugin-security-audit', () => ({
  initialize: jest.fn(),
  recordSecurityEvent: jest.fn(),
  recordValidationResult: jest.fn(),
  recordPluginDeactivation: jest.fn(),
  recordBlacklistAction: jest.fn(),
  setSecurityLevel: jest.fn(),
  getPluginAuditHistory: jest.fn(() => []),
  getAuditStats: jest.fn(() => ({ totalEntries: 0 })),
}));
jest.mock('../../../../../src/core/plugins/plugin-permission-checker', () => ({
  initialize: jest.fn(),
  validatePermissions: jest.fn(() => ({ valid: true, reasons: [], approvedPermissions: [], pendingPermissions: [], invalidPermissions: [] })), // Ajustar el mock
  getPluginPermissions: jest.fn(() => ({ approved: [], pending: [], revoked: [] })),
  setSecurityLevel: jest.fn(),
  updateSecurityChecks: jest.fn(),
}));
jest.mock('../../../../../src/core/bus/event-bus', () => ({
  publish: jest.fn(),
  subscribe: jest.fn(),
}));

// Importar mocks para aserciones
const pluginRegistry = require('../../../../../src/core/plugins/plugin-registry');
const pluginSandbox = require('../../../../../src/core/plugins/plugin-sandbox');
const pluginResourceMonitor = require('../../../../../src/core/plugins/plugin-resource-monitor');
const pluginSecurityAudit = require('../../../../../src/core/plugins/plugin-security-audit');
const pluginPermissionChecker = require('../../../../../src/core/plugins/plugin-permission-checker');
const eventBus = require('../../../../../src/core/bus/event-bus');

describe('PluginSecurityManager', () => {
  const pluginId = 'testPlugin';
  const mockPlugin = { id: pluginId, name: 'Test Plugin', permissions: ['storage'] };
  let originalConsoleWarn;
  let originalConsoleError; // Añadido para mockear console.error

  beforeEach(() => {
    originalConsoleWarn = console.warn;
    originalConsoleError = console.error; // Guardar original
    console.warn = jest.fn();
    console.error = jest.fn(); // Mockear console.error para silenciar errores esperados o verificar llamadas
    
    jest.clearAllMocks();
    
    pluginSecurityManager.initialized = false;
    pluginSecurityManager.securityLevel = PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL;
    pluginSecurityManager.detectedThreats = [];
    pluginSecurityManager.blacklistedPlugins = new Set();
    pluginSecurityManager.pluginsWithWarnings = {};
    pluginSecurityManager.securityEvents = [];
    pluginSecurityManager.maxSecurityEvents = 100;
    pluginSecurityManager.activeSecurityChecks = new Set([
      'resourceUsage',
      'apiAccess',
      'storageUsage',
      'domManipulation',
      'externalCommunication'
    ]);
    
    pluginRegistry.getPlugin.mockReturnValue(mockPlugin);
    pluginRegistry.isPluginActive.mockReturnValue(false);
    pluginRegistry.getAllPlugins.mockReturnValue([mockPlugin]);

    // Asegurar que los mocks de subsistemas devuelvan valores consistentes
    pluginSandbox.validatePluginCode.mockReturnValue({ valid: true, reasons: [], violations: [] });
    pluginPermissionChecker.validatePermissions.mockReturnValue({ valid: true, reasons: [], approvedPermissions: (mockPlugin.permissions || []), pendingPermissions: [], invalidPermissions: [] });

  });
  
  afterEach(() => {
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError; // Restaurar original
    pluginSecurityManager.initialized = false; // Reset para el siguiente test suite si es necesario
  });

  describe('initialize', () => {
    test('debe inicializar subsistemas y validar plugins existentes', () => {
      const validatePluginSpy = jest.spyOn(pluginSecurityManager, 'validatePlugin').mockImplementation(() => ({ valid: true }));
      
      pluginSecurityManager.initialize({ securityLevel: PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL });
      
      expect(pluginSecurityManager.initialized).toBe(true);
      expect(pluginSandbox.initialize).toHaveBeenCalledWith(PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL);
      expect(pluginResourceMonitor.initialize).toHaveBeenCalledWith(PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL);
      expect(pluginSecurityAudit.initialize).toHaveBeenCalledWith(PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL);
      expect(pluginPermissionChecker.initialize).toHaveBeenCalledWith(PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL);
      expect(eventBus.publish).toHaveBeenCalledWith('pluginSystem.securityInitialized', expect.any(Object));
      expect(validatePluginSpy).toHaveBeenCalledWith(pluginId);
      validatePluginSpy.mockRestore();
    });
  });

  describe('_handleSecurityEvent', () => {
    beforeEach(() => {
      pluginSecurityManager.initialize({ securityLevel: PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL });
      jest.clearAllMocks(); 
    });

    test('debe manejar un evento de seguridad, registrarlo y tomar acción', () => {
      const eventData = { pluginId, type: 'testEvent', details: 'some details' };
      const calculateSeveritySpy = jest.spyOn(pluginSecurityManager, '_calculateEventSeverity').mockReturnValue('medium');
      const takeActionSpy = jest.spyOn(pluginSecurityManager, '_takeActionForSecurityEvent');

      pluginSecurityManager._handleSecurityEvent('customSecurityType', eventData);

      expect(pluginSecurityManager.securityEvents.length).toBe(1);
      expect(pluginSecurityAudit.recordSecurityEvent).toHaveBeenCalled();
      expect(takeActionSpy).toHaveBeenCalled();
      expect(eventBus.publish).toHaveBeenCalledWith('pluginSystem.securityEvent', expect.any(Object));
      
      calculateSeveritySpy.mockRestore();
      takeActionSpy.mockRestore();
    });
    
    test('debe desactivar y añadir a lista negra en evento crítico', () => {
      const deactivatePluginSpy = jest.spyOn(pluginSecurityManager, 'deactivatePlugin').mockImplementation(() => {});
      const blacklistPluginSpy = jest.spyOn(pluginSecurityManager, 'blacklistPlugin').mockImplementation(() => true); // Mock para que devuelva true
      const criticalEvent = { pluginId, type: 'criticalEvent', severity: 'critical', details: 'very bad' };

      pluginSecurityManager._takeActionForSecurityEvent(criticalEvent);

      expect(deactivatePluginSpy).toHaveBeenCalledWith(pluginId, expect.stringContaining('Amenaza de seguridad crítica'));
      expect(blacklistPluginSpy).toHaveBeenCalledWith(pluginId);

      deactivatePluginSpy.mockRestore();
      blacklistPluginSpy.mockRestore();
    });
  });

  describe('validatePlugin', () => {
    beforeEach(() => {
      pluginSecurityManager.initialize({ securityLevel: PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL });
      jest.clearAllMocks();
    });

    test('debe validar un plugin llamando a los subsistemas correspondientes', () => {
      pluginSecurityManager.blacklistedPlugins.clear(); // Asegurar que no está en lista negra
      
      // Asegurar que los mocks se resetean y se configuran bien para este test
      pluginSandbox.validatePluginCode.mockReturnValueOnce({ valid: true, reasons: [], violations: [] });
      pluginPermissionChecker.validatePermissions.mockReturnValueOnce({ valid: true, reasons: [], approvedPermissions: ['storage'], pendingPermissions:[], invalidPermissions: []});
      
      const result = pluginSecurityManager.validatePlugin(pluginId);
      
      expect(result.valid).toBe(true);
      // Usar expect.objectContaining para evitar problemas de referencia de objeto
      expect(pluginSandbox.validatePluginCode).toHaveBeenCalledWith(pluginId, expect.objectContaining({ id: pluginId }));
      expect(pluginPermissionChecker.validatePermissions).toHaveBeenCalledWith(pluginId, mockPlugin.permissions);
      expect(pluginSecurityAudit.recordValidationResult).toHaveBeenCalledWith(pluginId, expect.objectContaining({ valid: true }));
    });

    test('debe marcar como inválido si está en lista negra', () => {
      pluginSecurityManager.blacklistedPlugins.add(pluginId);
      const result = pluginSecurityManager.validatePlugin(pluginId);
      expect(result.valid).toBe(false);
      expect(result.reasons).toContain('Plugin en lista negra por violaciones de seguridad previas');
    });
  });

  describe('blacklistPlugin / whitelistPlugin', () => {
    beforeEach(() => {
      pluginSecurityManager.initialize({ securityLevel: PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL });
      jest.clearAllMocks();
    });

    test('blacklistPlugin debe añadir a lista negra y publicar evento', () => {
      pluginSecurityManager.blacklistedPlugins.clear();
      expect(pluginSecurityManager.blacklistedPlugins.has(pluginId)).toBe(false); // Pre-condición
      
      const result = pluginSecurityManager.blacklistPlugin(pluginId);
      
      expect(result).toBe(true); // Verificar que la función retorna true
      expect(pluginSecurityManager.blacklistedPlugins.has(pluginId)).toBe(true);
      expect(pluginSecurityAudit.recordBlacklistAction).toHaveBeenCalledWith(pluginId, expect.objectContaining({ action: 'add' }));
      expect(eventBus.publish).toHaveBeenCalledWith('pluginSystem.pluginBlacklisted', { pluginId });
    });

    test('whitelistPlugin debe quitar de lista negra', () => {
      pluginSecurityManager.blacklistedPlugins.add(pluginId); // Poner en lista negra primero
      jest.clearAllMocks(); 
      
      const result = pluginSecurityManager.whitelistPlugin(pluginId);
      expect(result).toBe(true);
      expect(pluginSecurityManager.blacklistedPlugins.has(pluginId)).toBe(false);
      expect(pluginSecurityAudit.recordBlacklistAction).toHaveBeenCalledWith(pluginId, expect.objectContaining({ action: 'remove' }));
      expect(eventBus.publish).toHaveBeenCalledWith('pluginSystem.pluginWhitelisted', { pluginId });
    });
  });

  describe('getPluginSecurityInfo', () => {
    beforeEach(() => {
      pluginSecurityManager.initialize({ securityLevel: PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL });
      jest.clearAllMocks();
    });

    test('debe devolver información agregada de seguridad para un plugin', () => {
      pluginSecurityManager.pluginsWithWarnings[pluginId] = [{ type: 'warning1' }];
      const info = pluginSecurityManager.getPluginSecurityInfo(pluginId);
      
      expect(info.warnings.length).toBe(1);
      expect(info.blacklisted).toBe(false);
      expect(info.securityScore).toBeLessThanOrEqual(100);
      expect(pluginPermissionChecker.getPluginPermissions).toHaveBeenCalledWith(pluginId);
      expect(pluginSecurityAudit.getPluginAuditHistory).toHaveBeenCalledWith(pluginId);
      expect(pluginResourceMonitor.getPluginResourceUsage).toHaveBeenCalledWith(pluginId);
    });
  });

  describe('setSecurityLevel', () => {
    beforeEach(() => {
      pluginSecurityManager.initialize({ securityLevel: PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL });
      jest.clearAllMocks();
    });

    test('debe cambiar el nivel de seguridad y notificar a subsistemas', () => {
      pluginSecurityManager.setSecurityLevel('HIGH'); // Usar la cadena que PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH representaría
      expect(pluginSecurityManager.securityLevel).toBe(PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH);
      expect(pluginSandbox.setSecurityLevel).toHaveBeenCalledWith(PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH);
      expect(eventBus.publish).toHaveBeenCalledWith('pluginSystem.securityLevelChanged', { level: PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH });
    });

    test('debe configurar las verificaciones de seguridad según el nivel', () => {
      pluginSecurityManager.setSecurityLevel(PLUGIN_CONSTANTS.SECURITY.LEVEL.LOW);
      expect(pluginSecurityManager.activeSecurityChecks.has('resourceUsage')).toBe(true);
      expect(pluginSecurityManager.activeSecurityChecks.has('domManipulation')).toBe(false);

      pluginSecurityManager.setSecurityLevel(PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH);
      expect(pluginSecurityManager.activeSecurityChecks.has('domManipulation')).toBe(true);
      expect(pluginSecurityManager.activeSecurityChecks.has('codeExecution')).toBe(true);
    });
  });
  
  describe('getSecurityStats', () => {
    beforeEach(() => {
      // La inicialización ya ocurre en el beforeEach global de PluginSecurityManager
      // pero necesitamos asegurarnos de que el estado de los mocks y del manager
      // esté limpio para este conjunto de tests.
      pluginSecurityManager.initialize({ securityLevel: PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL });
      // Limpiar mocks después de la inicialización para que solo contemos las llamadas del test
      jest.clearAllMocks(); 
    });

    test('debe devolver estadísticas agregadas del sistema de seguridad', () => {
      // Modificar el estado DESPUÉS de la inicialización y limpieza de mocks
      pluginSecurityManager.blacklistedPlugins.add('blacklistedP');
      pluginSecurityManager.pluginsWithWarnings['warnP'] = [{ type: 'medium' }];
      pluginSecurityManager.detectedThreats.push({ pluginId: 'threatP', severity: 'high', type: 'testThreat' });

      const stats = pluginSecurityManager.getSecurityStats();
      expect(stats.blacklistedPlugins).toBe(1);
      expect(stats.pluginsWithWarnings).toBe(1);
      expect(stats.detectedThreats.total).toBe(1);
      expect(pluginResourceMonitor.getResourceStats).toHaveBeenCalled();
      expect(pluginSecurityAudit.getAuditStats).toHaveBeenCalled();
    });
  });
});
