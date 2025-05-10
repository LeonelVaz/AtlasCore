// jest.config.js
module.exports = {
  // Directorios donde Jest buscará los archivos de test
  testMatch: [
    "<rootDir>/test/unit/**/*.test.js",
    "<rootDir>/test/unit/**/*.test.jsx"
  ],
  
  // Directorios que Jest debe ignorar
  testPathIgnorePatterns: [
    "/node_modules/"
  ],
  
  // Archivo de configuración para Jest
  setupFilesAfterEnv: [
    "<rootDir>/test/setup/setupTests.js"
  ],
  
  // Entorno para ejecutar las pruebas
  testEnvironment: "jsdom",
  
  // Transformaciones para los archivos
  transform: {
    "^.+\\.(js|jsx)$": "babel-jest"
  },
  
  // Mapeo de módulos para que Jest pueda encontrarlos
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "<rootDir>/test/mocks/styleMock.js",
    "\\.(gif|ttf|eot|svg|png)$": "<rootDir>/test/mocks/fileMock.js"
  },
  
  // Cobertura de código
  collectCoverageFrom: [
    "src/**/*.{js,jsx}",
    "!src/**/*.d.ts",
    "!src/index.js",
    "!src/setupTests.js"
  ],
  
  // Directorios donde Jest debe buscar los módulos
  moduleDirectories: [
    "node_modules",
    "src"
  ],
  
  // Extensiones de archivo que Jest debe reconocer
  moduleFileExtensions: [
    "js",
    "jsx",
    "json",
    "node"
  ],
  
  // Configuración para la caché
  watchPathIgnorePatterns: [
    "<rootDir>/node_modules/"
  ],
  
  // Desactivar notificaciones para evitar errores con node-notifier
  notify: false
};