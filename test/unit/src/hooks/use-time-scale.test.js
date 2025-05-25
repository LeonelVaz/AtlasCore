// test/unit/src/hooks/use-time-scale.test.jsx

/**
 * @jest-environment jsdom
 */
import React from 'react';
import { renderHook } from '@testing-library/react';
import useTimeScale from '../../../../src/hooks/use-time-scale';
import { TimeScaleContext } from '../../../../src/contexts/time-scale-context'; // Importar el contexto real
import { TIME_SCALES } from '../../../../src/core/config/constants';

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
  });

  test('debe lanzar un error si se usa fuera de un TimeScaleProvider', () => {
    const originalError = console.error;
    console.error = jest.fn();

    expect(() => renderHook(() => useTimeScale())).toThrow('useTimeScale debe usarse dentro de un TimeScaleProvider');

    console.error = originalError;
  });
});