/**
 * @jest-environment jsdom
 */
import permissionCheckerModule from "../../../../../src/core/plugins/plugin-permission-checker";
import { PLUGIN_CONSTANTS } from "../../../../../src/core/config/constants";

// Mockear dependencias
jest.mock("../../../../../src/core/bus/event-bus", () => ({
  publish: jest.fn(),
}));

const eventBus = require("../../../../../src/core/bus/event-bus");
const permissionChecker = permissionCheckerModule;

describe("PluginPermissionChecker", () => {
  let originalConsoleWarn;
  let originalConsoleError;
  let originalConsoleLog;

  // Definir constantes locales para claridad, asumiendo que las originales son minúsculas
  const LEVEL_LOW = PLUGIN_CONSTANTS.SECURITY.LEVEL.LOW.toLowerCase();
  const LEVEL_NORMAL = PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL.toLowerCase();
  const LEVEL_HIGH = PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH.toLowerCase();

  beforeEach(() => {
    jest.clearAllMocks();
    permissionChecker.initialized = false;
    // Inicializar con el valor minúscula correspondiente
    permissionChecker.securityLevel = LEVEL_NORMAL;
    permissionChecker.activeChecks = new Set(["apiAccess"]);
    permissionChecker.pluginPermissions = {};
    permissionChecker.elevatedPermissionPlugins = new Set();
    permissionChecker.permissionRequests = [];
    permissionChecker.apiAccessLogs = {};

    originalConsoleWarn = console.warn;
    originalConsoleError = console.error;
    originalConsoleLog = console.log;
    console.warn = jest.fn();
    console.error = jest.fn();
    console.log = jest.fn();
  });

  afterEach(() => {
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
    console.log = originalConsoleLog;
  });

  describe("initialize", () => {
    test("debe inicializar con un nivel de seguridad y loguear", () => {
      // Pasamos la constante original (asumida minúscula por ej. "high")
      const result = permissionChecker.initialize(
        PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH
      );
      expect(result).toBe(true);
      expect(permissionChecker.initialized).toBe(true);
      // Espera que this.securityLevel sea la versión minúscula
      expect(permissionChecker.securityLevel).toBe(LEVEL_HIGH);
      expect(console.log).toHaveBeenCalledWith(
        "Inicializando verificador de permisos para plugins..."
      );
      // El log en el código fuente convierte a MAYÚSCULA para mostrar
      expect(console.log).toHaveBeenCalledWith(
        "Verificador de permisos inicializado (nivel: HIGH)"
      );
    });

    test("debe usar nivel NORMAL por defecto si no se especifica ninguno en initialize", () => {
      permissionChecker.initialize();
      // Espera que this.securityLevel sea la versión minúscula
      expect(permissionChecker.securityLevel).toBe(LEVEL_NORMAL);
      // El log en el código fuente convierte a MAYÚSCULA para mostrar
      expect(console.log).toHaveBeenCalledWith(
        "Verificador de permisos inicializado (nivel: NORMAL)"
      );
    });

    test("debe manejar un nivel inválido en initialize y usar default", () => {
      permissionChecker.initialize("INVALID_LEVEL");
      // Debe mantenerse en el nivel default del constructor (minúscula)
      expect(permissionChecker.securityLevel).toBe(LEVEL_NORMAL);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining(
          "Nivel de seguridad de inicialización 'INVALID_LEVEL' inválido"
        )
      );
    });
  });

  describe("setSecurityLevel", () => {
    beforeEach(() => {
      permissionChecker.initialize(PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL);
      eventBus.publish.mockClear();
    });

    test("debe cambiar el nivel de seguridad y publicar evento", () => {
      // Pasamos la constante original (asumida minúscula por ej. "low")
      const result = permissionChecker.setSecurityLevel(
        PLUGIN_CONSTANTS.SECURITY.LEVEL.LOW
      );
      expect(result).toBe(true);
      // Espera que this.securityLevel sea la versión minúscula
      expect(permissionChecker.securityLevel).toBe(LEVEL_LOW);
      expect(eventBus.publish).toHaveBeenCalledWith(
        "pluginSystem.permissionCheckerSecurityLevelChanged",
        {
          level: LEVEL_LOW, // El evento publica el nivel almacenado (minúscula)
        }
      );
    });

    test("no debe cambiar el nivel si es el mismo", () => {
      const result = permissionChecker.setSecurityLevel(
        PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL
      );
      expect(result).toBe(true);
      expect(permissionChecker.securityLevel).toBe(LEVEL_NORMAL);
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    test("debe devolver false y no cambiar el nivel si es inválido", () => {
      const initialLevel = permissionChecker.securityLevel; // "normal"
      const result = permissionChecker.setSecurityLevel("BOGUS_LEVEL");
      expect(result).toBe(false);
      expect(permissionChecker.securityLevel).toBe(initialLevel);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("Nivel de seguridad inválido: 'BOGUS_LEVEL'")
      );
    });
  });

  describe("validatePermissions", () => {
    beforeEach(() => {
      permissionChecker.initialize(PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL);
    });

    test("debe auto-aprobar permisos según el nivel NORMAL", () => {
      const result = permissionChecker.validatePermissions("pluginA", [
        "storage",
        "network",
        "ui",
      ]);
      expect(result.valid).toBe(false);
      expect(result.approvedPermissions).toEqual(
        expect.arrayContaining(["storage", "ui"])
      );
      expect(result.pendingPermissions).toEqual(["network"]);
      expect(permissionChecker.pluginPermissions["pluginA"].approved).toEqual(
        expect.arrayContaining(["storage", "ui"])
      );
      expect(permissionChecker.pluginPermissions["pluginA"].pending).toEqual([
        "network",
      ]);
    });

    test("debe auto-aprobar todos los permisos relevantes en nivel LOW", () => {
      permissionChecker.setSecurityLevel(PLUGIN_CONSTANTS.SECURITY.LEVEL.LOW);
      const result = permissionChecker.validatePermissions("pluginB", [
        "storage",
        "network",
        "dom",
      ]);
      expect(result.valid).toBe(true);
      expect(result.approvedPermissions).toEqual(["storage", "network", "dom"]);
      expect(result.pendingPermissions).toEqual([]);
      expect(permissionChecker.elevatedPermissionPlugins.has("pluginB")).toBe(
        true
      );
    });

    test("debe marcar permisos como pendientes en nivel HIGH si no son básicos", () => {
      permissionChecker.setSecurityLevel(PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH);
      const result = permissionChecker.validatePermissions("pluginC", [
        "ui",
        "storage",
        "events",
      ]);
      expect(result.valid).toBe(false);
      expect(result.approvedPermissions).toEqual(
        expect.arrayContaining(["ui", "events"])
      );
      expect(result.pendingPermissions).toEqual(["storage"]);
    });

    test("debe manejar permisos inválidos o no reconocidos", () => {
      const result = permissionChecker.validatePermissions("pluginD", [
        "storage",
        "nonExistentPermission",
      ]);
      expect(result.valid).toBe(false);
      expect(result.approvedPermissions).toEqual(["storage"]);
      expect(result.invalidPermissions).toEqual(["nonExistentPermission"]);
      expect(result.reasons).toContain(
        "Permiso inválido: nonExistentPermission - Permiso no reconocido"
      );
    });

    test("debe usar permisos UI y EVENTS por defecto si no se especifican permisos", () => {
      const result = permissionChecker.validatePermissions(
        "pluginE",
        undefined
      );
      expect(result.valid).toBe(true);
      expect(result.permissions).toEqual(["ui", "events"]);
      expect(permissionChecker.pluginPermissions["pluginE"].approved).toEqual([
        "ui",
        "events",
      ]);
    });

    test("debe mantener permisos previamente aprobados si se revalida con un subconjunto", () => {
      permissionChecker.validatePermissions("pluginF", [
        "storage",
        "ui",
        "network",
      ]);

      const result = permissionChecker.validatePermissions("pluginF", ["ui"]);

      expect(result.approvedPermissions).toEqual(["ui"]);
      expect(result.pendingPermissions).toEqual([]);

      const finalPermissions =
        permissionChecker.getPluginPermissions("pluginF");
      expect(finalPermissions.approved).toContain("storage");
      expect(finalPermissions.approved).toContain("ui");
      expect(finalPermissions.pending).toContain("network");
    });
  });

  describe("hasPermission", () => {
    beforeEach(() => {
      permissionChecker.initialize(PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL);
      permissionChecker.pluginPermissions["pluginA"] = {
        approved: ["storage", "ui"],
        pending: [],
        revoked: [],
      };
    });

    test("debe devolver true si el plugin tiene el permiso aprobado", () => {
      expect(permissionChecker.hasPermission("pluginA", "storage")).toBe(true);
    });

    test("debe devolver false si el plugin no tiene el permiso o no está aprobado", () => {
      expect(permissionChecker.hasPermission("pluginA", "network")).toBe(false);
      expect(permissionChecker.hasPermission("pluginB", "storage")).toBe(false);
    });
  });

  describe("checkMethodAccess", () => {
    beforeEach(() => {
      permissionChecker.initialize(PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL);
      permissionChecker.pluginPermissions["pluginA"] = {
        approved: ["storage"],
        pending: [],
        revoked: [],
      };
      permissionChecker.pluginPermissions["pluginB"] = {
        approved: ["network"],
        pending: [],
        revoked: [],
      };
    });

    test("debe permitir acceso si el plugin tiene el permiso requerido para el método", () => {
      const result = permissionChecker.checkMethodAccess(
        "pluginA",
        "core.storage.setItem"
      );
      expect(result.permitted).toBe(true);
      expect(result.permission).toBe("storage");
    });

    test("debe denegar acceso si el plugin no tiene el permiso requerido", () => {
      const result = permissionChecker.checkMethodAccess("pluginA", "fetch");
      expect(result.permitted).toBe(false);
      expect(result.permission).toBe("network");
      expect(result.reason).toBe("Se requiere el permiso network");
    });

    test('debe permitir acceso a métodos "libres" como console.log', () => {
      const result = permissionChecker.checkMethodAccess(
        "pluginA",
        "console.log"
      );
      expect(result.permitted).toBe(true);
      expect(result.permission).toBe("free");
    });

    test("debe denegar acceso a métodos no especificados en nivel NORMAL/HIGH", () => {
      permissionChecker.setSecurityLevel(
        PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL
      );
      const resultNormal = permissionChecker.checkMethodAccess(
        "pluginA",
        "some.unknown.method"
      );
      expect(resultNormal.permitted).toBe(false);

      permissionChecker.setSecurityLevel(PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH);
      const resultHigh = permissionChecker.checkMethodAccess(
        "pluginA",
        "some.unknown.method"
      );
      expect(resultHigh.permitted).toBe(false);
    });

    test("debe permitir acceso a métodos no especificados en nivel LOW", () => {
      permissionChecker.setSecurityLevel(PLUGIN_CONSTANTS.SECURITY.LEVEL.LOW);
      const result = permissionChecker.checkMethodAccess(
        "pluginA",
        "some.unknown.method"
      );
      expect(result.permitted).toBe(true);
      expect(result.permission).toBe("unspecified");
      expect(result.warning).toBeDefined();
    });

    test("debe loguear acceso y publicar evento en nivel HIGH si se deniega", () => {
      permissionChecker.setSecurityLevel(PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH);
      eventBus.publish.mockClear();

      permissionChecker.checkMethodAccess("pluginA", "fetch");
      expect(permissionChecker.getApiAccessHistory("pluginA").length).toBe(1);
      expect(eventBus.publish).toHaveBeenCalledWith(
        "pluginSystem.unauthorizedAccess",
        {
          pluginId: "pluginA",
          method: "fetch",
          requiredPermission: "network",
        }
      );
    });
  });

  describe("approvePermissions, rejectPermissions, revokePermissions", () => {
    beforeEach(() => {
      permissionChecker.initialize(PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL);
      permissionChecker.pluginPermissions["pluginX"] = {
        approved: ["ui"],
        pending: ["storage", "network"],
        revoked: [],
      };

      permissionChecker.permissionRequests.push({
        pluginId: "pluginX",
        permissions: ["storage"],
        timestamp: Date.now(),
        status: "pending",
        originalPermissionsForTest_DoNotModify: ["storage"],
      });
      permissionChecker.permissionRequests.push({
        pluginId: "pluginX",
        permissions: ["network"],
        timestamp: Date.now(),
        status: "pending",
        originalPermissionsForTest_DoNotModify: ["network"],
      });
    });

    test("approvePermissions debe mover permisos de pendiente a aprobado y actualizar la solicitud específica", () => {
      const result = permissionChecker.approvePermissions("pluginX", [
        "storage",
      ]);
      expect(result).toBe(true);
      expect(permissionChecker.pluginPermissions["pluginX"].approved).toContain(
        "storage"
      );
      expect(permissionChecker.pluginPermissions["pluginX"].approved).toContain(
        "ui"
      );
      expect(
        permissionChecker.pluginPermissions["pluginX"].pending
      ).not.toContain("storage");
      expect(permissionChecker.pluginPermissions["pluginX"].pending).toContain(
        "network"
      );

      expect(eventBus.publish).toHaveBeenCalledWith(
        "pluginSystem.permissionsApproved",
        expect.objectContaining({
          pluginId: "pluginX",
          permissions: ["storage"],
        })
      );

      const storageRequest = permissionChecker.permissionRequests.find(
        (r) =>
          r.pluginId === "pluginX" &&
          r.originalPermissionsForTest_DoNotModify &&
          r.originalPermissionsForTest_DoNotModify[0] === "storage"
      );
      expect(storageRequest).toBeDefined();
      expect(storageRequest.status).toBe("approved");

      const networkRequest = permissionChecker.permissionRequests.find(
        (r) =>
          r.pluginId === "pluginX" &&
          r.originalPermissionsForTest_DoNotModify &&
          r.originalPermissionsForTest_DoNotModify[0] === "network"
      );
      expect(networkRequest).toBeDefined();
      expect(networkRequest.status).toBe("pending");
    });

    test("rejectPermissions debe mover permisos de pendiente a revocado", () => {
      const result = permissionChecker.rejectPermissions("pluginX", [
        "network",
      ]);
      expect(result).toBe(true);
      expect(
        permissionChecker.pluginPermissions["pluginX"].pending
      ).not.toContain("network");
      expect(permissionChecker.pluginPermissions["pluginX"].revoked).toContain(
        "network"
      );
      expect(eventBus.publish).toHaveBeenCalledWith(
        "pluginSystem.permissionsRejected",
        expect.objectContaining({
          pluginId: "pluginX",
          permissions: ["network"],
        })
      );
    });

    test("revokePermissions debe mover permisos de aprobado a revocado", () => {
      permissionChecker.pluginPermissions["pluginX"].approved.push("dom");
      permissionChecker.elevatedPermissionPlugins.add("pluginX");

      const result = permissionChecker.revokePermissions("pluginX", [
        "ui",
        "dom",
      ]);
      expect(result).toBe(true);
      expect(
        permissionChecker.pluginPermissions["pluginX"].approved
      ).not.toContain("ui");
      expect(
        permissionChecker.pluginPermissions["pluginX"].approved
      ).not.toContain("dom");
      expect(permissionChecker.pluginPermissions["pluginX"].revoked).toContain(
        "ui"
      );
      expect(permissionChecker.pluginPermissions["pluginX"].revoked).toContain(
        "dom"
      );
      expect(permissionChecker.elevatedPermissionPlugins.has("pluginX")).toBe(
        false
      );
      expect(eventBus.publish).toHaveBeenCalledWith(
        "pluginSystem.permissionsRevoked",
        expect.objectContaining({
          pluginId: "pluginX",
          permissions: ["ui", "dom"],
        })
      );
    });
  });

  describe("getPluginPermissions", () => {
    test("debe devolver la estructura de permisos correcta para un plugin", () => {
      permissionChecker.initialize(PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL);
      permissionChecker.pluginPermissions["myPlugin"] = {
        approved: ["storage"],
        pending: ["network"],
        revoked: ["dom"],
      };
      permissionChecker.elevatedPermissionPlugins.add("myPlugin");

      const perms = permissionChecker.getPluginPermissions("myPlugin");
      expect(perms.approved).toEqual(["storage"]);
      expect(perms.pending).toEqual(["network"]);
      expect(perms.revoked).toEqual(["dom"]);
      expect(perms.hasElevatedPermissions).toBe(true);
      expect(perms.hasStoragePermission).toBe(true);
      expect(perms.hasNetworkPermission).toBe(false);
    });

    test("debe devolver una estructura base si el plugin no tiene permisos registrados", () => {
      permissionChecker.initialize(PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL);
      const perms = permissionChecker.getPluginPermissions("unheardPlugin");
      expect(perms.approved).toEqual([]);
      expect(perms.pending).toEqual([]);
      expect(perms.revoked).toEqual([]);
      expect(perms.hasElevatedPermissions).toBe(false);
    });
  });

  describe("getPermissionStats", () => {
    test("debe calcular y devolver estadísticas de permisos", () => {
      permissionChecker.initialize(PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL);
      permissionChecker.validatePermissions("p1", ["storage", "ui"]);
      permissionChecker.validatePermissions("p2", ["storage", "network"]);
      permissionChecker.validatePermissions("p3", ["dom"]);
      permissionChecker.approvePermissions("p3", ["dom"]);

      const stats = permissionChecker.getPermissionStats();
      expect(stats.pluginsWithPermissions).toBe(3);
      expect(stats.pluginsWithElevatedPermissions).toBe(1);
      expect(stats.pendingRequests).toBe(1);
      expect(stats.permissionsByType).toEqual({ storage: 2, ui: 1, dom: 1 });
      expect(stats.mostCommonPermissions.length).toBeGreaterThanOrEqual(1);
      expect(stats.mostCommonPermissions[0].permission).toBe("storage");
      expect(stats.mostCommonPermissions[0].count).toBe(2);
      // this.securityLevel se almacena en minúsculas, así que comparamos con la versión minúscula de la constante
      expect(stats.securityLevel).toBe(LEVEL_NORMAL);
    });
  });
});
