// jest.config.js
module.exports = {
  testMatch: [
    "<rootDir>/test/unit/**/*.test.js",
    "<rootDir>/test/unit/**/*.test.jsx",
  ],
  testPathIgnorePatterns: ["/node_modules/"],
  setupFilesAfterEnv: ["<rootDir>/test/setup/setupTests.js"],
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.(js|jsx)$": "babel-jest",
  },

  // CAMBIO PRINCIPAL: Usar v8 en lugar de babel
  coverageProvider: "v8",

  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "<rootDir>/test/mocks/styleMock.js",
    "\\.(gif|ttf|eot|svg|png)$": "<rootDir>/test/mocks/fileMock.js",
  },

  collectCoverageFrom: [
    "src/**/*.{js,jsx}",
    "!src/**/*.d.ts",
    "!src/index.js",
    "!src/main.jsx",
    "!src/vite-env.d.ts",
  ],

  coveragePathIgnorePatterns: ["/node_modules/", "<rootDir>/test/"],

  // Configuración adicional para v8
  coverageReporters: ["text", "lcov", "html"],

  // Directorio donde se guarda la cobertura
  coverageDirectory: "coverage",

  moduleDirectories: ["node_modules", "src"],

  moduleFileExtensions: ["js", "jsx", "json", "node"],

  watchPathIgnorePatterns: ["<rootDir>/node_modules/"],

  notify: false,

  // Configuración adicional para evitar conflictos
  clearMocks: true,
  restoreMocks: true,
};
