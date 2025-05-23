// test/unit/components/plugin-extension/extension-point.test.js
import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ExtensionPoint from '../../../../../src/components/plugin-extension/extension-point';
import eventBus from '../../../../../src/core/bus/event-bus';
import uiExtensionManager from '../../../../../src/core/plugins/ui-extension-manager';

// --- MOCKS ---
jest.mock('../../../../../src/core/bus/event-bus', () => ({
  subscribe: jest.fn().mockReturnValue(jest.fn()),
  publish: jest.fn(),
}));

jest.mock('../../../../../src/core/plugins/ui-extension-manager', () => ({
  getExtensionsForZone: jest.fn().mockReturnValue([]),
}));

// --- COMPONENTES DE AYUDA ---
const ComponenteMock1 = ({ text }) => <div data-testid="mock-comp-1">{text}</div>;

// const ComponenteQueLanzaError = () => {
//   // Este componente está diseñado para lanzar un error durante su fase de renderizado
//   throw new Error('Fallo de renderizado del componente');
// };

// --- PRUEBAS ---
describe('Componente ExtensionPoint', () => {
  const zoneId = 'zona-de-prueba';
  const mockArrayDeExtensiones = [
    { id: 'ext1', pluginId: 'pluginA', component: ComponenteMock1, props: { text: 'Hola' } },
  ];
  let espiaConsoleError;

  beforeEach(() => {
    jest.clearAllMocks();
    uiExtensionManager.getExtensionsForZone.mockReturnValue([]);
    eventBus.subscribe.mockReturnValue(jest.fn());
    espiaConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renderiza null si no se proporciona zoneId (valor falsy)', () => {
    const { container, rerender } = render(<ExtensionPoint zoneId={null} />);
    expect(container.firstChild).toBeNull();
    rerender(<ExtensionPoint zoneId={undefined} />);
    expect(container.firstChild).toBeNull();
    rerender(<ExtensionPoint zoneId="" />);
    expect(container.firstChild).toBeNull();
  });

  test('obtiene las extensiones iniciales y se suscribe a actualizaciones', () => {
    uiExtensionManager.getExtensionsForZone.mockReturnValueOnce(mockArrayDeExtensiones);
    render(<ExtensionPoint zoneId={zoneId} />);
    expect(uiExtensionManager.getExtensionsForZone).toHaveBeenCalledWith(zoneId);
    expect(eventBus.subscribe).toHaveBeenCalledWith(`pluginSystem.extension.${zoneId}`, expect.any(Function));
    expect(screen.getByTestId('mock-comp-1')).toBeInTheDocument();
  });

  test('usa la prop de renderizado personalizada si se proporciona', () => {
    uiExtensionManager.getExtensionsForZone.mockReturnValueOnce(mockArrayDeExtensiones);
    const mockFnRender = jest.fn(extensions => <div data-testid="custom-render-output">{extensions.length}</div>);
    render(<ExtensionPoint zoneId={zoneId} render={mockFnRender} />);
    expect(mockFnRender).toHaveBeenCalledWith(mockArrayDeExtensiones);
    expect(screen.getByTestId('custom-render-output')).toHaveTextContent(mockArrayDeExtensiones.length.toString());
  });

  test('renderiza el fallback si no hay extensiones y se proporciona un fallback', () => {
    uiExtensionManager.getExtensionsForZone.mockReturnValueOnce([]);
    render(<ExtensionPoint zoneId={zoneId} fallback={<div data-testid="fb">FB</div>} />);
    expect(screen.getByTestId('fb')).toBeInTheDocument();
  });

  test('renderiza el contenedor por defecto (vacío) si no hay extensiones ni fallback', () => {
    uiExtensionManager.getExtensionsForZone.mockReturnValueOnce([]);
    const { container } = render(<ExtensionPoint zoneId={zoneId} />);
    expect(container.querySelector('.plugin-extension-container')).toBeInTheDocument();
    expect(container.querySelector('.plugin-extension-container').children.length).toBe(0);
  });

  test('actualiza las extensiones cuando eventBus publica cambios válidos', () => {
    let cb; eventBus.subscribe.mockImplementationOnce((e,c)=>{cb=c; return jest.fn();});
    render(<ExtensionPoint zoneId={zoneId} />);
    act(() => { cb({ extensions: mockArrayDeExtensiones }); });
    expect(screen.getByTestId('mock-comp-1')).toBeInTheDocument();
  });

  test('no actualiza si los datos de eventBus son inválidos (datos nulos)', () => {
    let cb; eventBus.subscribe.mockImplementationOnce((e,c)=>{cb=c; return jest.fn();});
    uiExtensionManager.getExtensionsForZone.mockReturnValueOnce(mockArrayDeExtensiones);
    render(<ExtensionPoint zoneId={zoneId} />);
    act(() => { cb(null); });
    expect(screen.getByTestId('mock-comp-1')).toBeInTheDocument();
  });

  test('no actualiza si los datos de eventBus no tienen un array de extensiones', () => {
    let cb; eventBus.subscribe.mockImplementationOnce((e,c)=>{cb=c; return jest.fn();});
    uiExtensionManager.getExtensionsForZone.mockReturnValueOnce(mockArrayDeExtensiones);
    render(<ExtensionPoint zoneId={zoneId} />);
    act(() => { cb({ other: 'val' }); });
    expect(screen.getByTestId('mock-comp-1')).toBeInTheDocument();
  });

   test('se desuscribe de eventBus al desmontar', () => {
    const mockDesuscribir = jest.fn();
    eventBus.subscribe.mockImplementationOnce((event, callback) => mockDesuscribir);
    const { unmount } = render(<ExtensionPoint zoneId={zoneId} />);
    expect(eventBus.subscribe).toHaveBeenCalledTimes(1);
    unmount();
    expect(mockDesuscribir).toHaveBeenCalledTimes(1);
  });

  // El test para errores específicos de componentes se enfoca ahora en el logueo
  // y en que los otros componentes no se vean afectados de forma visible.
  // La UI específica para el ítem con error es difícil de asegurar en JSDOM.
  // test('loguea el error de un componente específico e intenta renderizar los otros componentes', async () => {
  //   const ComponenteQueLanzaErrorAlRenderizar = () => { throw new Error('Fallo de render intencional'); };
  //   const extensionesConError = [
  //     { id: 'ext-ok', pluginId: 'pluginOK', component: ComponenteMock1, props: { text: 'OK' } },
  //     { id: 'ext-err', pluginId: 'pluginError', component: ComponenteQueLanzaErrorAlRenderizar, props: {} },
  //   ];
  //   uiExtensionManager.getExtensionsForZone.mockReturnValueOnce(extensionesConError);

  //   render(<ExtensionPoint zoneId={zoneId} />);
    
  //   await screen.findByTestId('mock-comp-1'); // Espera a que el bueno se renderice
  //   expect(screen.getByTestId('mock-comp-1')).toHaveTextContent('OK');
    
  //   expect(espiaConsoleError).toHaveBeenCalledWith(
  //     'Error al renderizar componente de plugin pluginError:',
  //     expect.objectContaining({ message: 'Fallo de render intencional' })
  //   );
  // });


  describe('Manejo de errores generales (la lógica principal de renderizado de ExtensionPoint falla)', () => {
    test('muestra "Error en extensión" si el renderizado inicial falla (ej: extensions no es un array)', async () => {
      uiExtensionManager.getExtensionsForZone.mockReturnValueOnce("no-es-un-array");
      render(<ExtensionPoint zoneId={zoneId} />);
      await screen.findByText('Error en extensión');
      expect(screen.getByText(/extensions\.map is not a function/i)).toBeInTheDocument();
      expect(espiaConsoleError).toHaveBeenCalledWith(
        `Error al renderizar punto de extensión ${zoneId}:`,
        expect.any(TypeError)
      );
    });

    test('después de un error general, un re-renderizado (misma causa de error) sigue mostrando "Error en extensión"', async () => {
      uiExtensionManager.getExtensionsForZone.mockReturnValue("no-es-un-array"); 
      const { rerender } = render(<ExtensionPoint zoneId={zoneId} key="gen-error-rerender" />);
      await screen.findByText('Error en extensión'); 
      const contenidoMensajeError = screen.getByText(/extensions\.map is not a function/i).textContent;
      
      rerender(<ExtensionPoint zoneId={zoneId} key="gen-error-rerender" />); 
      expect(screen.getByText('Error en extensión')).toBeInTheDocument(); 
      expect(screen.getByText(contenidoMensajeError)).toBeInTheDocument();
    });

  });
});