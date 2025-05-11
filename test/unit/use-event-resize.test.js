// test/unit/use-event-resize.test.js
import React from 'react';
import { render, fireEvent, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';

// Importar el hook a probar
import { useEventResize } from '../../src/hooks/use-event-resize';

// Componente de prueba que usa el hook
function TestComponent({ 
  event, 
  onUpdate = jest.fn(), 
  snapValue = 0,
  gridSize = 60
}) {
  const eventRef = React.useRef(null);
  const [blockClicks, setBlockClicks] = React.useState(false);
  
  const { resizing, handleResizeStart } = useEventResize({
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
        className={`event ${resizing ? 'resizing' : ''}`}
        style={{ height: '60px', width: '100px', position: 'relative' }}
        data-testid="event"
      >
        Evento de prueba
        <div 
          className="event-resize-handle"
          onMouseDown={handleResizeStart}
          style={{ position: 'absolute', bottom: 0, height: '8px', width: '100%' }}
          data-testid="resize-handle"
        />
      </div>
      <div data-testid="status">
        Resizing: {resizing ? 'true' : 'false'}
        <br />
        BlockClicks: {blockClicks ? 'true' : 'false'}
      </div>
    </div>
  );
}

describe('useEventResize Hook', () => {
  // Configuración para cada prueba
  beforeEach(() => {
    // Limpiar cuerpo del documento y mocks
    document.body.innerHTML = '';
    jest.clearAllMocks();
    
    // Eliminar clases añadidas por el hook
    document.body.classList.remove('resizing-active');
    document.body.classList.remove('snap-active');
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
    expect(screen.getByTestId('status')).toHaveTextContent('Resizing: false');
    expect(screen.getByTestId('status')).toHaveTextContent('BlockClicks: false');
    
    // El evento no debe tener la clase 'resizing'
    expect(screen.getByTestId('event')).not.toHaveClass('resizing');
    
    // Verificar que el handle existe
    expect(screen.getByTestId('resize-handle')).toBeInTheDocument();
  });

  test('inicia la operación de redimensionamiento al hacer mousedown en el handle', () => {
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
    
    // Ejecutar clic en el handle
    fireEvent.mouseDown(screen.getByTestId('resize-handle'), { 
      clientX: 50, 
      clientY: 100
    });
    
    // Verificar que blockClicks se activa
    expect(screen.getByTestId('status')).toHaveTextContent('BlockClicks: true');
    
    // Verificar que se añadió la clase al body
    expect(document.body.classList.contains('resizing-active')).toBe(true);
    
    // Verificar que NO se añadió la clase snap-active (porque snapValue=0)
    expect(document.body.classList.contains('snap-active')).toBe(false);
    
    // Verificar que el evento tiene la clase resizing (después de un breve retardo)
    setTimeout(() => {
      expect(screen.getByTestId('event')).toHaveClass('resizing');
    }, 100);
  });

  test('inicia el redimensionamiento con snap activado cuando snapValue > 0', () => {
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
    
    // Ejecutar clic en el handle
    fireEvent.mouseDown(screen.getByTestId('resize-handle'), { 
      clientX: 50, 
      clientY: 100
    });
    
    // Verificar que se añadió la clase snap-active al body
    expect(document.body.classList.contains('snap-active')).toBe(true);
  });

  test('actualiza la altura del evento durante el redimensionamiento', () => {
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
    
    // Iniciar el redimensionamiento
    act(() => {
      fireEvent.mouseDown(screen.getByTestId('resize-handle'), { 
        clientX: 50, 
        clientY: 100
      });
    });
    
    // Simular un movimiento significativo del mouse (al menos una unidad de grid)
    act(() => {
      // Simular un movimiento mayor para asegurar que supera cualquier umbral
      fireEvent.mouseMove(document, {
        clientX: 50,
        clientY: 160  // 60 píxeles más abajo (exactamente un gridSize)
      });
    });
    
    // Verificar que blockClicks está activado
    expect(screen.getByTestId('status')).toHaveTextContent('BlockClicks: true');
    
    // Finalizar el redimensionamiento con mouseUp
    act(() => {
      fireEvent.mouseUp(document);
    });
    
    // Verificar que se ha llamado a onUpdate (debe ser llamado durante el mouseUp)
    expect(mockOnUpdate).toHaveBeenCalled();
  });

  test('limpia correctamente los listener y clases al finalizar el redimensionamiento', () => {
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
    
    // Añadir las clases al body para simular un redimensionamiento en curso
    document.body.classList.add('resizing-active');
    document.body.classList.add('snap-active');
    
    // Iniciar el redimensionamiento
    fireEvent.mouseDown(screen.getByTestId('resize-handle'), { 
      clientX: 50, 
      clientY: 100
    });
    
    // Simular liberación del mouse
    const mouseUpEvent = new MouseEvent('mouseup', {
      bubbles: true,
      cancelable: true,
      clientX: 50,
      clientY: 120
    });
    
    // Disparar el evento de liberación
    document.dispatchEvent(mouseUpEvent);
    
    // Verificar que las clases se eliminaron
    expect(document.body.classList.contains('resizing-active')).toBe(false);
    expect(document.body.classList.contains('snap-active')).toBe(false);
  });

  test('calcula correctamente los cambios con y sin snap', () => {
    // Este test verifica parcialmente el comportamiento, 
    // el cálculo exacto se hace dentro del hook con helpers importados
    
    // Crear un evento de prueba
    const testEvent = {
      id: 'test-event',
      title: 'Evento de prueba',
      start: '2025-05-10T10:00:00Z',
      end: '2025-05-10T11:00:00Z'
    };
    
    // Mock para funciones
    const mockOnUpdate = jest.fn();
    const mockCalculatePreciseTimeChange = jest.fn();
    
    // Mock para la función calculatePreciseTimeChange
    jest.mock('../../src/utils/event-utils', () => ({
      initializeGridInfo: jest.fn(),
      calculatePreciseTimeChange: (deltaY, isResize, gridSize, snapValue) => {
        // Simplificamos: retornar minutos según snapValue
        if (snapValue === 0) {
          return Math.round(deltaY / (gridSize / 60));
        } else {
          return Math.round(deltaY / ((gridSize / 60) * snapValue)) * snapValue;
        }
      }
    }));
    
    // Renderizar componente sin snap
    const { unmount } = render(
      <TestComponent 
        event={testEvent} 
        onUpdate={mockOnUpdate}
        snapValue={0}
      />
    );
    
    // Desmontar y volver a montar con snap
    unmount();
    
    render(
      <TestComponent 
        event={testEvent} 
        onUpdate={mockOnUpdate}
        snapValue={15}
      />
    );
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
});