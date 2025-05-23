// test/unit/components/calendar/event-form.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react'; // Mantenemos fireEvent para datetime-local
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import EventForm from '../../../../../src/components/calendar/event-form';

// Mock Dialog and Button components
jest.mock('../../../../../src/components/ui/dialog', () => {
  return jest.fn(({ children, isOpen, onClose, title, confirmText, onConfirm }) => (
    isOpen ? (
      <div data-testid="dialog-mock">
        <h2 data-testid="dialog-title">{title}</h2>
        {children}
        <button onClick={onConfirm}>{confirmText}</button>
        <button onClick={onClose}>Close Dialog</button>
      </div>
    ) : null
  ));
});

jest.mock('../../../../../src/components/ui/button', () => {
  return jest.fn(({ children, variant, onClick }) => (
    <button data-variant={variant} onClick={onClick}>
      {children}
    </button>
  ));
});

// Mock ExtensionPoint
const MockExtensionComponent = jest.fn(({ event, isEditing, onChange, pluginId, extensionId, ...props }) => (
  <div data-testid={`extension-${pluginId}-${extensionId}`}>
    Mock Extension for {pluginId}/{extensionId}
    Event: {event?.title}, Editing: {String(isEditing)}
    {/* Añadir name al input de la extensión */}
    <input type="text" data-testid={`ext-input-${extensionId}`} name={`extInput_${extensionId}`} onChange={onChange} />
    <button onClick={() => onChange({target: {name: `customFieldExt_${extensionId}`, value: `extValueFromButton_${extensionId}`}})}>Change Custom Button</button>
  </div>
));

jest.mock('../../../../../src/components/plugin-extension/extension-point', () => {
  const { PLUGIN_CONSTANTS } = require('../../../../../src/core/config/constants');
  return jest.fn(({ zoneId, render, fallback }) => {
    if (zoneId === PLUGIN_CONSTANTS.UI_EXTENSION_ZONES.EVENT_FORM || zoneId === PLUGIN_CONSTANTS.UI_EXTENSION_ZONES.EVENT_DETAIL_VIEW) {
      const mockExtensions = [
        { id: 'ext1', pluginId: 'pluginA', component: MockExtensionComponent, props: { customProp: 'valA' } },
        { id: 'ext2', pluginId: 'pluginB', component: MockExtensionComponent, props: { customProp: 'valB' } }
      ];
      return render(mockExtensions);
    }
    return fallback || null;
  });
});


describe('EventForm Component', () => {
  const initialMockEventData = {
    id: '1',
    title: 'Test Event',
    start: new Date('2023-01-01T10:00:00.000Z').toISOString(), // Usar ISO string para 'start' y 'end'
    end: new Date('2023-01-01T11:00:00.000Z').toISOString(),   // Usar ISO string para 'start' y 'end'
    startFormatted: '2023-01-01T10:00', // Formato para datetime-local input
    endFormatted: '2023-01-01T11:00',   // Formato para datetime-local input
    color: '#aabbcc',
  };
  const mockOnSave = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnClose = jest.fn();

  let user;

  beforeEach(() => {
    jest.clearAllMocks();
    MockExtensionComponent.mockClear();
    user = userEvent.setup();
  });

  test('renders for a new event', () => {
    const newEventInitialData = { title: '', startFormatted: '', endFormatted: '', color: '#2d4b94', start: '', end: '' };
    render(
      <EventForm
        event={newEventInitialData}
        isEditing={false}
        onSave={mockOnSave}
        onChange={jest.fn()}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );
    expect(screen.getByTestId('dialog-mock')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-title')).toHaveTextContent('Nuevo evento');
    expect(screen.getByLabelText('Título:')).toHaveValue('');
  });

  test('renders for an existing event (editing)', () => {
    render(
      <EventForm
        event={{...initialMockEventData}}
        isEditing={true}
        onSave={mockOnSave}
        onChange={jest.fn()}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );
    expect(screen.getByTestId('dialog-title')).toHaveTextContent('Editar evento');
    expect(screen.getByLabelText('Título:')).toHaveValue('Test Event');
  });

  test('displays error message if error prop is provided', () => {
    render(
      <EventForm
        event={{...initialMockEventData}}
        isEditing={true}
        error="Something went wrong"
        onSave={mockOnSave}
        onChange={jest.fn()}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  test('calls onChange prop and updates input value when user types', async () => {
    // Hacemos una copia profunda para asegurar que no hay referencias compartidas inesperadas
    let currentEventInTest = JSON.parse(JSON.stringify(initialMockEventData));

    const simulateParentOnChange = (e) => {
      const { name, value } = e.target;
      let newDateISO = '';

      if (name === 'start' || name === 'end') {
        // Asegurarse de que 'value' es una cadena de fecha válida antes de crear Date
        if (value && typeof value === 'string' && value.includes('T')) {
            const date = new Date(value);
            if (!isNaN(date.getTime())) { // Verifica si la fecha es válida
                newDateISO = date.toISOString();
            } else {
                // Si el valor no es una fecha válida (p.ej. durante la escritura parcial),
                // podrías querer manejarlo, quizás no actualizando el ISO o poniendo un valor nulo/inválido.
                // Por ahora, si es inválida, newDateISO quedará vacío o como estaba.
                // O podrías optar por no llamar a toISOString si la fecha es inválida.
                // Lo más simple es no actualizar el ISO si la fecha parseada no es válida.
                console.warn(`Invalid date value for ${name}: ${value}`);
                // Mantener el valor ISO anterior si el nuevo es inválido
                newDateISO = currentEventInTest[name];
            }
        } else if (!value) { // Si el campo de fecha se borra
            newDateISO = ''; // o null, dependiendo de cómo lo manejes
        } else {
             // Mantener el valor ISO anterior si el nuevo es inválido
            newDateISO = currentEventInTest[name];
        }

        currentEventInTest = {
          ...currentEventInTest,
          [name]: newDateISO, // El valor ISO (o el anterior si el nuevo es inválido)
          [`${name}Formatted`]: value,  // El valor del input tal cual
        };

      } else { // Para otros campos como 'title', 'color'
        currentEventInTest = {
          ...currentEventInTest,
          [name]: value,
        };
      }
      // Re-renderiza el componente con el nuevo 'event' prop
      // Es crucial que esto fuerce a EventForm a usar el nuevo currentEventInTest
      rerender(
        <EventForm
          // Forzar un re-renderizado con una key diferente si es necesario,
          // pero normalmente actualizar la prop 'event' debería ser suficiente.
          // key={Date.now()} // Descomentar esto como último recurso si el DOM no se actualiza.
          event={currentEventInTest}
          isEditing={true}
          onSave={mockOnSave}
          onChange={simulateParentOnChange}
          onDelete={mockOnDelete}
          onClose={mockOnClose}
        />
      );
    };

    const { rerender } = render(
      <EventForm
        event={currentEventInTest}
        isEditing={true}
        onSave={mockOnSave}
        onChange={simulateParentOnChange}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );
    
    const titleInput = screen.getByLabelText('Título:');
    expect(titleInput).toHaveValue(initialMockEventData.title);

    await user.clear(titleInput);
    await user.type(titleInput, 'New Title'); 
    
    expect(titleInput).toHaveValue('New Title');
    expect(currentEventInTest.title).toBe('New Title');


    // --- Prueba para el campo 'start' (datetime-local) ---
    const startInput = screen.getByLabelText('Inicio:');
    const newStartTimeRaw = '2023-01-02T12:00'; // Formato esperado por el input
    const newStartTimeISO = new Date(newStartTimeRaw).toISOString();

    expect(startInput).toHaveValue(initialMockEventData.startFormatted);

    // Para datetime-local, userEvent.type puede no funcionar bien para establecer el valor completo.
    // fireEvent.change es más directo para establecer el value y disparar el evento.
    fireEvent.change(startInput, { target: { name: 'start', value: newStartTimeRaw } });

    expect(startInput).toHaveValue(newStartTimeRaw);
    expect(currentEventInTest.startFormatted).toBe(newStartTimeRaw);
    expect(currentEventInTest.start).toBe(newStartTimeISO);
  });

  test('calls onSave, onClose, onDelete when respective buttons are clicked', async () => {
    render(
      <EventForm
        event={{...initialMockEventData}}
        isEditing={true}
        onSave={mockOnSave}
        onChange={jest.fn()}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    await user.click(screen.getByText('Guardar'));
    expect(mockOnSave).toHaveBeenCalledTimes(1);

    await user.click(screen.getByText('Close Dialog'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);

    await user.click(screen.getByText('Eliminar'));
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });

  test('renders extensions and passes props correctly', async () => {
    // Copia profunda para el estado de este test
    let currentEventInTestExt = JSON.parse(JSON.stringify({ title: 'For Extension', startFormatted: '', endFormatted: '', color: '#2d4b94', start: '', end: '' }));

    const simulateParentOnChangeExt = (e) => {
      const { name, value } = e.target;
      currentEventInTestExt = { ...currentEventInTestExt, [name]: value }; // Actualización simple para el test de extensión
      rerenderExt(
        <EventForm event={currentEventInTestExt} isEditing={false} onSave={mockOnSave} onChange={simulateParentOnChangeExt} onDelete={mockOnDelete} onClose={mockOnClose} />
      );
    };

    const { rerender: rerenderExt } = render(
      <EventForm
        event={currentEventInTestExt}
        isEditing={false}
        onSave={mockOnSave}
        onChange={simulateParentOnChangeExt}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    const formExtensionsContainer = screen.getByLabelText('Título:').closest('.event-form-content').querySelector('.event-form-extensions');
    const extensionPluginA_form = within(formExtensionsContainer).getByTestId('extension-pluginA-ext1');
    
    const formExtensionACall = MockExtensionComponent.mock.calls.find(call => {
        const props = call[0];
        return props.pluginId === 'pluginA' &&
               props.extensionId === 'ext1' &&
               MockExtensionComponent.mock.calls.indexOf(call) < 2; 
    });
    expect(formExtensionACall).toBeDefined();
    const formExtensionACallProps = formExtensionACall[0];

    expect(formExtensionACallProps.event.title).toBe('For Extension');
    expect(formExtensionACallProps.onChange).toBe(simulateParentOnChangeExt);

    const changeButtonInFormExtension = within(extensionPluginA_form).getByText('Change Custom Button');
    await user.click(changeButtonInFormExtension);
    expect(currentEventInTestExt['customFieldExt_ext1']).toBe('extValueFromButton_ext1');

    const extInput = within(extensionPluginA_form).getByTestId('ext-input-ext1');
    const extInputName = `extInput_ext1`; // Corresponde al name que le dimos en el mock
    await user.clear(extInput);
    await user.type(extInput, 'test ext input');
    expect(extInput).toHaveValue('test ext input');
    expect(currentEventInTestExt[extInputName]).toBe('test ext input');
  });
  
  function within(element) {
    const { getByTestId, getByText } = require('@testing-library/dom');
    return {
      getByTestId: (testId) => getByTestId(element, testId),
      getByText: (text, options) => getByText(element, text, options),
    };
  }
});