// test/unit/use-event-drag.test.jsx
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
// Importar act directamente desde react
import { act } from 'react';
import '@testing-library/jest-dom';

// Importar el hook a probar
import { useEventDrag } from '../../src/hooks/use-event-drag';
// Importar funciones de utils
import * as eventUtils from '../../src/utils/event-utils';

// Mock del módulo utils/event-utils al nivel superior del archivo
jest.mock('../../src/utils/event-utils', () => {
  const original = jest.requireActual('../../src/utils/event-utils');
  return {
    ...original,
    findTargetSlot: jest.fn(),
    initializeGridInfo: jest.fn(),
    // Otras funciones que necesiten ser mockeadas
  };
});

// Mock de hook y módulos antes de los test
// Esto permite que los tests para casos límite no llamen al código real
const mockOnUpdateFn = jest.fn();

// Componente de prueba que usa el hook
function TestComponent({ 
  event, 
  onUpdate = mockOnUpdateFn, 
  snapValue = 0,
  gridSize = 60
}) {
  const eventRef = React.useRef(null);
  const [blockClicks, setBlockClicks] = React.useState(false);
  
  const { dragging, handleDragStart } = useEventDrag({
    eventRef,
    event,
    onUpdate,
    gridSize,
    snapValue,
    setBlockClicks
  });
  
  return (
    <div data-testid="container">
      <div 
        ref={eventRef}
        className={`event ${dragging ? 'dragging' : ''}`}
        style={{ height: '60px', width: '100px', position: 'relative' }}
        data-testid="event"
        onMouseDown={handleDragStart}
      >
        Evento de prueba
        
        {/* Handle de resize que no debe iniciar arrastre */}
        <div 
          className="event-resize-handle"
          style={{ position: 'absolute', bottom: 0, height: '8px', width: '100%' }}
          data-testid="resize-handle"
        />
      </div>
      <div data-testid="status">
        Dragging: {dragging ? 'true' : 'false'}
        <br />
        BlockClicks: {blockClicks ? 'true' : 'false'}
      </div>
    </div>
  );
}

// Componente con un grid simulado para probar findTargetSlot
function TestGridComponent({ event, onUpdate = mockOnUpdateFn, snapValue = 0 }) {
  const eventRef = React.useRef(null);
  const [blockClicks, setBlockClicks] = React.useState(false);
  
  const { dragging, handleDragStart } = useEventDrag({
    eventRef,
    event,
    onUpdate,
    gridSize: 60,
    snapValue,
    setBlockClicks
  });
  
  return (
    <div data-testid="container" className="calendar-grid">
      <div className="calendar-day-header"></div>
      <div className="calendar-row">
        <div className="calendar-time">00:00</div>
        <div className="calendar-time-slot" data-testid="time-slot-1"></div>
        <div className="calendar-time-slot" data-testid="time-slot-2"></div>
      </div>
      <div className="calendar-row">
        <div className="calendar-time">01:00</div>
        <div className="calendar-time-slot" data-testid="time-slot-3"></div>
        <div className="calendar-time-slot" data-testid="time-slot-4"></div>
      </div>
      <div 
        ref={eventRef}
        className={`calendar-event ${dragging ? 'dragging' : ''}`}
        style={{ height: '60px', width: '100px', position: 'absolute', top: '10px', left: '10px' }}
        data-testid="event"
        onMouseDown={handleDragStart}
      >
        Evento de prueba
      </div>
    </div>
  );
}

describe('useEventDrag Hook', () => {
  // Configuración para cada prueba
  beforeEach(() => {
    // Limpiar cuerpo del documento y mocks
    document.body.innerHTML = '';
    jest.clearAllMocks();
    
    // Eliminar clases añadidas por el hook
    document.body.classList.remove('dragging-active');
    document.body.classList.remove('snap-active');
    
    // Restaurar el mock de onUpdate
    mockOnUpdateFn.mockClear();

    // Configurar un mock básico para initializeGridInfo para que no falle
    eventUtils.initializeGridInfo.mockImplementation(() => ({
      gridRect: { width: 500, height: 500 },
      hourHeight: 60,
      dayWidth: 100,
      inWeekView: true,
      timeSlots: [],
      startSlot: null
    }));
  });
  
  // Restaurar mouseup y mousemove globales después de cada prueba
  afterEach(() => {
    document.removeEventListener('mousemove', expect.any(Function));
    document.removeEventListener('mouseup', expect.any(Function));
  });

  test('debe inicializar correctamente el estado del hook', () => {
    // Crear un evento de prueba
    const testEvent = {
      id: 'test-event',
      title: 'Evento de prueba',
      start: '2025-05-10T10:00:00Z',
      end: '2025-05-10T11:00:00Z'
    };
    
    // Renderizar el componente
    render(<TestComponent event={testEvent} />);
    
    // Verificar que el estado inicial es correcto
    expect(screen.getByTestId('status')).toHaveTextContent('Dragging: false');
    expect(screen.getByTestId('status')).toHaveTextContent('BlockClicks: false');
    
    // El evento no debe tener la clase 'dragging'
    expect(screen.getByTestId('event')).not.toHaveClass('dragging');
  });

  test('no inicia arrastre si se hace click en el handle de resize', () => {
    // Crear un evento de prueba
    const testEvent = {
      id: 'test-event',
      title: 'Evento de prueba',
      start: '2025-05-10T10:00:00Z',
      end: '2025-05-10T11:00:00Z'
    };
    
    // Mock para la función onUpdate
    const mockOnUpdate = jest.fn();
    
    // Renderizar el componente
    render(
      <TestComponent 
        event={testEvent} 
        onUpdate={mockOnUpdate}
      />
    );
    
    // Hacer clic en el handle de resize
    act(() => {
      fireEvent.mouseDown(screen.getByTestId('resize-handle'), { 
        clientX: 50, 
        clientY: 100,
        target: {
          classList: {
            contains: (className) => className === 'event-resize-handle'
          }
        }
      });
    });
    
    // Verificar que no se inició el arrastre
    expect(screen.getByTestId('status')).toHaveTextContent('Dragging: false');
    expect(screen.getByTestId('status')).toHaveTextContent('BlockClicks: false');
    
    // Verificar que no se añadió la clase al body
    expect(document.body.classList.contains('dragging-active')).toBe(false);
  });

  test('inicia la operación de arrastre al hacer mousedown en el evento', () => {
    // Crear un evento de prueba
    const testEvent = {
      id: 'test-event',
      title: 'Evento de prueba',
      start: '2025-05-10T10:00:00Z',
      end: '2025-05-10T11:00:00Z'
    };
    
    // Mock para la función onUpdate
    const mockOnUpdate = jest.fn();
    
    // Renderizar el componente
    render(
      <TestComponent 
        event={testEvent} 
        onUpdate={mockOnUpdate}
      />
    );
    
    // Ejecutar mousedown en el evento
    act(() => {
      fireEvent.mouseDown(screen.getByTestId('event'), { 
        clientX: 50, 
        clientY: 100
      });
    });
    
    // En este punto el arrastre se inicia pero no se activa hasta que haya movimiento
    
    // Simular un movimiento significativo del mouse
    act(() => {
      fireEvent.mouseMove(document, {
        clientX: 70,
        clientY: 120
      });
    });
    
    // Verificar que blockClicks se activa
    expect(screen.getByTestId('status')).toHaveTextContent('BlockClicks: true');
    
    // Verificar que se añadió la clase al body
    expect(document.body.classList.contains('dragging-active')).toBe(true);
    
    // Verificar que NO se añadió la clase snap-active (porque snapValue=0)
    expect(document.body.classList.contains('snap-active')).toBe(false);
    
    // Verificar que el evento tiene la clase dragging
    expect(screen.getByTestId('event')).toHaveClass('dragging');
  });

  test('inicia el arrastre con snap activado cuando snapValue > 0', () => {
    // Crear un evento de prueba
    const testEvent = {
      id: 'test-event',
      title: 'Evento de prueba',
      start: '2025-05-10T10:00:00Z',
      end: '2025-05-10T11:00:00Z'
    };
    
    // Renderizar el componente con snap activado
    render(
      <TestComponent 
        event={testEvent} 
        snapValue={15} // 15 minutos
      />
    );
    
    // Ejecutar mousedown en el evento
    act(() => {
      fireEvent.mouseDown(screen.getByTestId('event'), { 
        clientX: 50, 
        clientY: 100
      });
    });
    
    // Simular un movimiento significativo del mouse
    act(() => {
      fireEvent.mouseMove(document, {
        clientX: 70,
        clientY: 120
      });
    });
    
    // Verificar que se añadió la clase snap-active al body
    expect(document.body.classList.contains('snap-active')).toBe(true);
  });

  test('no actualiza el estado si no hay movimiento significativo', () => {
    // Crear un evento de prueba
    const testEvent = {
      id: 'test-event',
      title: 'Evento de prueba',
      start: '2025-05-10T10:00:00Z',
      end: '2025-05-10T11:00:00Z'
    };
    
    // Mock para la función onUpdate
    const mockOnUpdate = jest.fn();
    
    // Renderizar el componente
    render(
      <TestComponent 
        event={testEvent} 
        onUpdate={mockOnUpdate}
      />
    );
    
    // Iniciar el arrastre
    act(() => {
      fireEvent.mouseDown(screen.getByTestId('event'), { 
        clientX: 50, 
        clientY: 100
      });
    });
    
    // Simular un movimiento MUY PEQUEÑO del mouse (menos del umbral de 5px)
    act(() => {
      fireEvent.mouseMove(document, {
        clientX: 51,
        clientY: 101  // Solo 1px en cada dirección, no debería activar arrastre
      });
    });
    
    // Verificar que no se inició el arrastre real
    expect(screen.getByTestId('status')).toHaveTextContent('Dragging: false');
    expect(screen.getByTestId('status')).toHaveTextContent('BlockClicks: false');
    
    // Finalizar el arrastre con mouseUp
    act(() => {
      fireEvent.mouseUp(document);
    });
    
    // Verificar que no se ha llamado a onUpdate
    expect(mockOnUpdate).not.toHaveBeenCalled();
  });

  test('limpia los listener al desmontar el componente', () => {
    // Spy en removeEventListener
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
    
    // Crear un evento de prueba
    const testEvent = {
      id: 'test-event',
      title: 'Evento de prueba',
      start: '2025-05-10T10:00:00Z',
      end: '2025-05-10T11:00:00Z'
    };
    
    // Renderizar el componente
    const { unmount } = render(<TestComponent event={testEvent} />);
    
    // Desmontar el componente
    unmount();
    
    // Verificar que se llamó a removeEventListener
    expect(removeEventListenerSpy).toHaveBeenCalled();
    
    // Restaurar el spy
    removeEventListenerSpy.mockRestore();
  });

  test('calcula correctamente los cambios sin snap y actualiza el evento', () => {
    // Crear un evento de prueba
    const testEvent = {
      id: 'test-event',
      title: 'Evento de prueba',
      start: '2025-05-10T10:00:00Z',
      end: '2025-05-10T11:00:00Z'
    };
    
    // Mock para la función onUpdate
    const mockOnUpdate = jest.fn();
    
    // Renderizar el componente
    render(
      <TestComponent 
        event={testEvent} 
        onUpdate={mockOnUpdate}
        snapValue={0}
      />
    );
    
    // Iniciar el arrastre
    act(() => {
      fireEvent.mouseDown(screen.getByTestId('event'), { 
        clientX: 50, 
        clientY: 100
      });
    });
    
    // Simular un movimiento significativo del mouse
    act(() => {
      fireEvent.mouseMove(document, {
        clientX: 50,
        clientY: 160  // 60px hacia abajo = 1 hora completa
      });
    });
    
    // Verificar que se activó el estado de arrastre
    expect(screen.getByTestId('status')).toHaveTextContent('Dragging: true');
    
    // Finalizar el arrastre
    act(() => {
      fireEvent.mouseUp(document);
    });
    
    // Verificar que se ha llamado a onUpdate con el evento actualizado
    expect(mockOnUpdate).toHaveBeenCalled();
  });

  test('calcula correctamente los cambios con snap y actualiza el evento', () => {
    // Crear un evento de prueba
    const testEvent = {
      id: 'test-event',
      title: 'Evento de prueba',
      start: '2025-05-10T10:00:00Z',
      end: '2025-05-10T11:00:00Z'
    };
    
    // Mock para la función onUpdate
    const mockOnUpdate = jest.fn();
    
    // Renderizar el componente
    render(
      <TestComponent 
        event={testEvent} 
        onUpdate={mockOnUpdate}
        snapValue={15} // 15 minutos
      />
    );
    
    // Iniciar el arrastre
    act(() => {
      fireEvent.mouseDown(screen.getByTestId('event'), { 
        clientX: 50, 
        clientY: 100
      });
    });
    
    // Simular un movimiento que corresponda a 15 minutos
    act(() => {
      fireEvent.mouseMove(document, {
        clientX: 50,
        clientY: 115  // 15px ~ 15 minutos
      });
    });
    
    // Finalizar el arrastre
    act(() => {
      fireEvent.mouseUp(document);
    });
    
    // Verificar que se ha llamado a onUpdate
    expect(mockOnUpdate).toHaveBeenCalled();
  });

  test('maneja clic sin arrastre como un clic normal', () => {
    // Crear un evento de prueba
    const testEvent = {
      id: 'test-event',
      title: 'Evento de prueba',
      start: '2025-05-10T10:00:00Z',
      end: '2025-05-10T11:00:00Z'
    };
    
    // Mock para la función onUpdate
    const mockOnUpdate = jest.fn();
    
    // Renderizar el componente
    render(
      <TestComponent 
        event={testEvent} 
        onUpdate={mockOnUpdate}
      />
    );
    
    // Ejecutar mousedown y mouseup sin movimiento significativo
    act(() => {
      fireEvent.mouseDown(screen.getByTestId('event'), { 
        clientX: 50, 
        clientY: 100
      });
    });
    
    act(() => {
      fireEvent.mouseUp(document);
    });
    
    // Verificar que no se ha llamado a onUpdate
    expect(mockOnUpdate).not.toHaveBeenCalled();
    
    // Verificar que no se activó el bloqueo de clics
    expect(screen.getByTestId('status')).toHaveTextContent('BlockClicks: false');
  });

  test('desbloquea los clics después de un tiempo tras finalizar el arrastre', async () => {
    // Mock para setTimeout
    jest.useFakeTimers();
    
    // Crear un evento de prueba
    const testEvent = {
      id: 'test-event',
      title: 'Evento de prueba',
      start: '2025-05-10T10:00:00Z',
      end: '2025-05-10T11:00:00Z'
    };
    
    // Renderizar el componente
    render(<TestComponent event={testEvent} />);
    
    // Iniciar el arrastre
    act(() => {
      fireEvent.mouseDown(screen.getByTestId('event'), { 
        clientX: 50, 
        clientY: 100
      });
    });
    
    // Simular movimiento significativo
    act(() => {
      fireEvent.mouseMove(document, {
        clientX: 70,
        clientY: 120
      });
    });
    
    // Verificar que blockClicks está activado
    expect(screen.getByTestId('status')).toHaveTextContent('BlockClicks: true');
    
    // Finalizar arrastre
    act(() => {
      fireEvent.mouseUp(document);
    });
    
    // En este punto, blockClicks debería seguir siendo true
    expect(screen.getByTestId('status')).toHaveTextContent('BlockClicks: true');
    
    // Avanzar el temporizador para permitir que se ejecute el setTimeout
    act(() => {
      jest.advanceTimersByTime(300);
    });
    
    // Ahora blockClicks debería ser false
    expect(screen.getByTestId('status')).toHaveTextContent('BlockClicks: false');
    
    // Restaurar temporizadores reales
    jest.useRealTimers();
  });

  test('maneja correctamente casos límite con fechas inválidas', () => {
    // Crear un evento de prueba con fechas no válidas
    const invalidDateEvent = {
      id: 'test-event',
      title: 'Evento de prueba',
      start: 'fecha-invalida',
      end: 'fecha-invalida'
    };
    
    // Mock para console.error y para evitar errores con fechas inválidas
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    // Spy y mock específico para manejar el error de Date.toISOString()
    const origToISOString = Date.prototype.toISOString;
    Date.prototype.toISOString = jest.fn().mockImplementation(function() {
      if (isNaN(this.getTime())) {
        return "INVALID_DATE";
      }
      return origToISOString.call(this);
    });
    
    try {
      // Renderizar con evento inválido
      render(<TestComponent event={invalidDateEvent} />);
      
      // Iniciar arrastre
      act(() => {
        fireEvent.mouseDown(screen.getByTestId('event'), { 
          clientX: 50, 
          clientY: 100
        });
      });
      
      // Simular movimiento
      act(() => {
        fireEvent.mouseMove(document, {
          clientX: 70,
          clientY: 120
        });
      });
      
      // Finalizar arrastre
      act(() => {
        fireEvent.mouseUp(document);
      });
      
      // Si llegamos aquí sin errores, la prueba pasa
      // Verificar que se llamó a console.error
      expect(console.error).toHaveBeenCalled();
    } finally {
      // Restaurar funciones originales
      console.error = originalConsoleError;
      Date.prototype.toISOString = origToISOString;
    }
  });

  test('maneja eventos sin inicio o fin', () => {
    // Crear un evento de prueba incompleto
    const incompleteEvent = {
      id: 'test-event',
      title: 'Evento incompleto'
      // Sin start o end
    };
    
    // Mock para console.error y para evitar errores con fechas inválidas
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    // Spy y mock específico para manejar el error de Date.toISOString()
    const origToISOString = Date.prototype.toISOString;
    Date.prototype.toISOString = jest.fn().mockImplementation(function() {
      if (isNaN(this.getTime())) {
        return "INVALID_DATE";
      }
      return origToISOString.call(this);
    });
    
    try {
      // Renderizar con evento incompleto
      render(<TestComponent event={incompleteEvent} />);
      
      // Hacer acciones normales
      act(() => {
        fireEvent.mouseDown(screen.getByTestId('event'), { clientX: 50, clientY: 100 });
      });
      
      act(() => {
        fireEvent.mouseMove(document, { clientX: 70, clientY: 120 });
      });
      
      act(() => {
        fireEvent.mouseUp(document);
      });
      
      // Verificar que se llamó a console.error
      expect(console.error).toHaveBeenCalled();
    } finally {
      // Restaurar funciones originales
      console.error = originalConsoleError;
      Date.prototype.toISOString = origToISOString;
    }
  });

  test('encuentra correctamente el slot objetivo al arrastrar', () => {
    // Crear un evento de prueba
    const testEvent = {
      id: 'test-event',
      title: 'Evento de prueba',
      start: '2025-05-10T10:00:00Z',
      end: '2025-05-10T11:00:00Z'
    };
    
    // Configurar el mock de findTargetSlot para devolver un elemento
    const mockTargetSlot = document.createElement('div');
    eventUtils.findTargetSlot.mockReturnValue(mockTargetSlot);
    
    // Renderizar el componente con grid
    render(<TestGridComponent event={testEvent} />);
    
    // Iniciar el arrastre
    act(() => {
      fireEvent.mouseDown(screen.getByTestId('event'), { 
        clientX: 50, 
        clientY: 100
      });
    });
    
    // Simular un movimiento significativo
    act(() => {
      fireEvent.mouseMove(document, {
        clientX: 150,
        clientY: 200
      });
    });
    
    // Verificar que se llamó a findTargetSlot
    expect(eventUtils.findTargetSlot).toHaveBeenCalled();
    
    // Finalizar arrastre
    act(() => {
      fireEvent.mouseUp(document);
    });
  });

  test('maneja correctamente arrastre con cambio de día (horizontalmente)', () => {
    // Crear un evento de prueba
    const testEvent = {
      id: 'test-event',
      title: 'Evento de prueba',
      start: '2025-05-10T10:00:00Z',
      end: '2025-05-10T11:00:00Z'
    };
    
    // Configurar un grid que permita detectar cambio de día (dayWidth > 0)
    eventUtils.initializeGridInfo.mockReturnValue({
      containerElement: document.createElement('div'),
      gridRect: { width: 700, height: 500 },
      dayWidth: 100, // importante para detectar cambio de día
      hourHeight: 60,
      inWeekView: true,
      days: [new Date('2025-05-10T00:00:00Z')],
      dayElements: [document.createElement('div')],
      timeSlots: [document.createElement('div')],
      startSlot: document.createElement('div'),
      targetSlot: document.createElement('div'),
      startDay: new Date('2025-05-10T00:00:00Z')
    });
    
    // Configurar un mock para calculatePreciseTimeChange
    const originalCalculatePreciseTimeChange = eventUtils.calculatePreciseTimeChange;
    eventUtils.calculatePreciseTimeChange = jest.fn().mockReturnValue(0); // No cambio vertical
    
    // Mock para la función onUpdate
    const mockOnUpdate = jest.fn();
    
    // Renderizar el componente
    render(
      <TestGridComponent 
        event={testEvent} 
        onUpdate={mockOnUpdate}
      />
    );
    
    // Iniciar el arrastre
    act(() => {
      fireEvent.mouseDown(screen.getByTestId('event'), { 
        clientX: 50, 
        clientY: 100
      });
    });
    
    // Simular un movimiento horizontal significativo
    act(() => {
      fireEvent.mouseMove(document, {
        clientX: 250, // Movimiento horizontal de 200px > dayWidth (100px)
        clientY: 100  // Sin cambio vertical
      });
    });
    
    // Finalizar arrastre
    act(() => {
      fireEvent.mouseUp(document);
    });
    
    // Verificar que se llamó a onUpdate
    expect(mockOnUpdate).toHaveBeenCalled();
    
    // Restaurar la función original
    eventUtils.calculatePreciseTimeChange = originalCalculatePreciseTimeChange;
  });

  test('maneja los clics inmediatos después de soltar con handleDocumentClick', () => {
    // Crear un evento de prueba
    const testEvent = {
      id: 'test-event',
      title: 'Evento de prueba',
      start: '2025-05-10T10:00:00Z',
      end: '2025-05-10T11:00:00Z'
    };
    
    // Spy en addEventListener y removeEventListener
    const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
    
    // Renderizar el componente
    render(<TestComponent event={testEvent} />);
    
    // Iniciar y completar arrastre con movimiento significativo
    act(() => {
      fireEvent.mouseDown(screen.getByTestId('event'), { clientX: 50, clientY: 100 });
    });
    
    act(() => {
      fireEvent.mouseMove(document, { clientX: 70, clientY: 120 });
    });
    
    act(() => {
      fireEvent.mouseUp(document);
    });
    
    // Verificar que se añadió el listener para click
    expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function), true);
    
    // Simular un clic inmediato después de soltar
    const preventDefaultMock = jest.fn();
    const stopPropagationMock = jest.fn();
    
    // Disparar el evento click capturado por el listener
    // Para esto, necesitamos simular el evento y llamar al handler directamente
    const clickHandler = addEventListenerSpy.mock.calls.find(
      call => call[0] === 'click'
    )[1];
    
    // Llamar al handler manualmente
    act(() => {
      clickHandler({
        preventDefault: preventDefaultMock,
        stopPropagation: stopPropagationMock
      });
    });
    
    // Verificar que se llamó a preventDefault y stopPropagation
    expect(preventDefaultMock).toHaveBeenCalled();
    expect(stopPropagationMock).toHaveBeenCalled();
    
    // Verificar que eventualmente se eliminó el listener
    expect(removeEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function), true);
    
    // Restaurar los spies
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });
  
  test('maneja correctamente al intentar arrastrar cuando el evento ya no existe', () => {
    // Crear un evento de prueba
    const testEvent = {
      id: 'test-event',
      title: 'Evento de prueba',
      start: '2025-05-10T10:00:00Z',
      end: '2025-05-10T11:00:00Z'
    };
    
    // Renderizar el componente
    const { container, rerender } = render(<TestComponent event={testEvent} />);
    
    // Iniciar arrastre
    act(() => {
      fireEvent.mouseDown(screen.getByTestId('event'), { 
        clientX: 50, 
        clientY: 100
      });
    });
    
    // Antes de mover, volver a renderizar el componente sin el evento (simular que fue eliminado)
    rerender(<div>Evento eliminado</div>);
    
    // Intentar mover el mouse
    act(() => {
      fireEvent.mouseMove(document, {
        clientX: 70,
        clientY: 120
      });
    });
    
    // Finalizar arrastre
    act(() => {
      fireEvent.mouseUp(document);
    });
    
    // Si no hay errores, la prueba pasa
    expect(true).toBe(true);
  });
});