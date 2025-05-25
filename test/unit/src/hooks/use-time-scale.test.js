// test/unit/src/hooks/use-time-scale.test.jsx

/**
 * @jest-environment jsdom
 */
import React from 'react';
import { renderHook } from '@testing-library/react';
// Importar el hook bajo prueba
import useTimeScale from '../../../../src/hooks/use-time-scale'; // Ruta corregida
// Importar el Contexto real para el Provider
import { TimeScaleContext } from '../../../../src/contexts/time-scale-context'; // Ruta corregida
// Importar constantes para valores de prueba
// El mock de constants se define abajo para ser específico a este archivo de test

// Mock de constants.js SÓLO para este test
jest.mock('../../../../src/core/config/constants', () => ({ // Ruta corregida
  __esModule: true,
  TIME_SCALES: {
    STANDARD: { id: 'standard', name: 'Estándar', height: 60, pixelsPerMinute: 1 },
    COMPACT: { id: 'compact', name: 'Compacta', height: 40, pixelsPerMinute: 40/60 },
  }
}));

// Importar TIME_SCALES DESPUÉS del mock
const { TIME_SCALES } = require('../../../../src/core/config/constants');


describe('useTimeScale Hook', () => {
  test('debe devolver el contexto de escala de tiempo cuando se usa dentro de un TimeScaleProvider', () => {
    const mockTimeScaleContextValue = {
      currentTimeScale: TIME_SCALES.STANDARD,
      setCurrentTimeScaleById: jest.fn(),
      cellHeight: TIME_SCALES.STANDARD.height,
      pixelsPerMinute: TIME_SCALES.STANDARD.pixelsPerMinute,
      availableTimeScales: TIME_SCALES,
    };

    const wrapper = ({ children }) => (
      <TimeScaleContext.Provider value={mockTimeScaleContextValue}>
        {children}
      </TimeScaleContext.Provider>
    );

    const { result } = renderHook(() => useTimeScale(), { wrapper });

    expect(result.current.currentTimeScale).toBe(TIME_SCALES.STANDARD);
    expect(result.current.setCurrentTimeScaleById).toBe(mockTimeScaleContextValue.setCurrentTimeScaleById);
    expect(result.current.cellHeight).toBe(TIME_SCALES.STANDARD.height);
    expect(result.current.availableTimeScales).toEqual(TIME_SCALES);
  });

  test('debe lanzar un error si se usa fuera de un TimeScaleProvider', () => {
    const originalError = console.error;
    console.error = jest.fn();

    expect(() => renderHook(() => useTimeScale())).toThrow('useTimeScale debe usarse dentro de un TimeScaleProvider');

    console.error = originalError;
  });
});