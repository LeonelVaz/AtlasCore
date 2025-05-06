// jest.config.js
module.exports = {
  // Directorio raíz para la búsqueda de archivos de prueba
  rootDir: '.',
  
  // Entorno de prueba para React
  testEnvironment: 'jsdom',
  
  // Patrones para la búsqueda de archivos de prueba
  testMatch: [
    '<rootDir>/test/unit/**/*.test.js',
    '<rootDir>/test/unit/**/*.test.jsx'
  ],
  
  // Extensiones de archivo a considerar
  moduleFileExtensions: ['js', 'jsx', 'json'],
  
  // Transformaciones para JSX
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  
  // Alias de directorios para simplificar importaciones
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@styles/(.*)$': '<rootDir>/src/styles/$1',
    // Para manejar importaciones de estilos en tests
    '\\.(css|less)$': '<rootDir>/test/__mocks__/styleMock.js'
  },
  
  // Configuración de coverage
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
    '!**/node_modules/**',
    '!**/vendor/**'
  ],
  coverageThreshold: {
    global: {
      statements: 60,
      branches: 60,
      functions: 60,
      lines: 60
    },
    'src/core/': {
      statements: 70,
      branches: 60,
      functions: 70,
      lines: 70
    }
  },
  
  // Configuración de setup
  setupFilesAfterEnv: [
    '<rootDir>/test/setupTests.js'
  ]
};