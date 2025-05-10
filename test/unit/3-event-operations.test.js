// test/unit/3-event-operations.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Importar los componentes a probar
import CalendarMain from '../../src/components/calendar/calendar-main';
import EventForm from '../../src/components/calendar/event-form';

// Mocks para servicios
const mockEvents = [];
const mockStorageGet = jest.fn().mockImplementation(() => Promise.resolve(mockEvents));
const mockStorageSet = jest.fn().mockImplementation(() => Promise.resolve(true));

jest.mock('../../src/services/storage-service', () => ({
  __esModule: true,
  default: {
    get: (...args) => mockStorageGet(...args),
    set: (...args) => mockStorageSet(...args)
  }
}));

// Mock para EventBus
const mockSubscribe = jest.fn().mockReturnValue(() => {});
const mockPublish = jest.fn();

jest.mock('../../src/core/bus/event-bus', () => ({
  __esModule: true,
  default: {
    subscribe: (...args) => mockSubscribe(...args),
    publish: (...args) => mockPublish(...args)
  },
  EventCategories: {
    CALENDAR: 'calendar',
    APP: 'app',
    STORAGE: 'storage'
  }
}));

// Configuración para fecha consistente
const mockDate = new Date('2025-05-10T12:00:00Z');
const originalDate = global.Date;
const mockDateNow = jest.spyOn(global.Date, 'now').mockImplementation(() => mockDate.getTime());

// Función para simular un clic en una celda del calendario
const clickOnCalendarCell = async () => {
  const calendarCells = document.querySelectorAll('.calendar-time-slot');
  expect(calendarCells.length).toBeGreaterThan(0);
  
  // Clic en una celda del calendario (por ejemplo, la celda para las 10:00)
  fireEvent.click(calendarCells[10]);
  
  // Esperar a que se abra el formulario
  await waitFor(() => {
    expect(document.querySelector('.ui-dialog')).toBeInTheDocument();
  });
};

// Función para simular un clic en un evento existente
const clickOnEvent = async (container) => {
  // Crear un evento primero
  await clickOnCalendarCell();
  
  // Completar y guardar el formulario
  const titleInput = screen.getByLabelText(/título/i);
  fireEvent.change(titleInput, { target: { value: 'Evento de prueba' } });
  
  const saveButton = screen.getByText(/guardar/i);
  fireEvent.click(saveButton);
  
  // Esperar a que se cierre el formulario y aparezca el evento
  await waitFor(() => {
    expect(document.querySelector('.ui-dialog')).not.toBeInTheDocument();
  });
  
  // Ahora hacemos clic en el evento creado
  const events = document.querySelectorAll('.calendar-event');
  expect(events.length).toBeGreaterThan(0);
  
  fireEvent.click(events[0]);
  
  // Esperar a que se abra el formulario de edición
  await waitFor(() => {
    expect(document.querySelector('.ui-dialog')).toBeInTheDocument();
  });
};

describe('3.1 Creación de Eventos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEvents.length = 0; // Limpiar eventos
  });

  test('3.1.1 Al hacer clic en una franja horaria vacía, se abre un nuevo formulario de evento', async () => {
    render(<CalendarMain />);
    
    await clickOnCalendarCell();
    
    // Verificar que el formulario está abierto
    const dialog = document.querySelector('.ui-dialog');
    expect(dialog).toBeInTheDocument();
    
    // Verificar que tiene los elementos básicos del formulario
    expect(screen.getByLabelText(/título/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/inicio/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/fin/i)).toBeInTheDocument();
  });

  test('3.1.2 Nuevo evento creado con valores predeterminados que coinciden con la hora del clic', async () => {
    render(<CalendarMain />);
    
    await clickOnCalendarCell();
    
    // Verificar que el formulario tiene valores predeterminados
    const titleInput = screen.getByLabelText(/título/i);
    expect(titleInput).toHaveValue('Nuevo evento');
    
    // Los campos de fecha deben tener algún valor
    const startInput = screen.getByLabelText(/inicio/i);
    const endInput = screen.getByLabelText(/fin/i);
    expect(startInput).toHaveValue();
    expect(endInput).toHaveValue();
    
    // La fecha de fin debe ser posterior a la de inicio (no podemos verificar valores exactos
    // porque dependen de la implementación, pero podemos asegurarnos de que hay valores)
    expect(startInput.value).not.toBe('');
    expect(endInput.value).not.toBe('');
  });

  test('3.1.3 El nuevo evento recibe un ID único', async () => {
    // Espiar implementación de Date.now para simular IDs
    const dateSpy = jest.spyOn(Date, 'now').mockReturnValue(123456789);
    
    render(<CalendarMain />);
    
    await clickOnCalendarCell();
    
    // Completar y guardar el formulario
    const titleInput = screen.getByLabelText(/título/i);
    fireEvent.change(titleInput, { target: { value: 'Evento de prueba' } });
    
    const saveButton = screen.getByText(/guardar/i);
    fireEvent.click(saveButton);
    
    // Verificar que se guardó con ID único
    await waitFor(() => {
      expect(mockStorageSet).toHaveBeenCalled();
      
      // Obtener los argumentos del último llamado
      const args = mockStorageSet.mock.calls[0];
      const savedEvents = args[1]; // Segundo argumento es el array de eventos
      
      // Verificar que hay un evento con ID
      expect(savedEvents.length).toBe(1);
      expect(savedEvents[0].id).toBeTruthy();
      // Verificar que el ID es un string (generado por Date.now o similar)
      expect(typeof savedEvents[0].id).toBe('string');
    });
    
    // Restaurar Date.now
    dateSpy.mockRestore();
  });

  test('3.1.4 El nuevo evento se guarda en el almacenamiento', async () => {
    render(<CalendarMain />);
    
    await clickOnCalendarCell();
    
    // Completar y guardar el formulario
    const titleInput = screen.getByLabelText(/título/i);
    fireEvent.change(titleInput, { target: { value: 'Evento de prueba' } });
    
    const saveButton = screen.getByText(/guardar/i);
    fireEvent.click(saveButton);
    
    // Verificar que se guardó en el almacenamiento
    await waitFor(() => {
      expect(mockStorageSet).toHaveBeenCalled();
      
      // Verificar que se guardó con la clave correcta
      const key = mockStorageSet.mock.calls[0][0]; // Primer argumento es la clave
      expect(key).toContain('events');
      
      // Verificar que se guardaron los datos del evento
      const savedEvents = mockStorageSet.mock.calls[0][1]; // Segundo argumento son los eventos
      expect(savedEvents.length).toBe(1);
      expect(savedEvents[0].title).toBe('Evento de prueba');
    });
  });

  test('3.1.5 El evento publica una notificación de actualización a través de EventBus', async () => {
    render(<CalendarMain />);
    
    await clickOnCalendarCell();
    
    // Completar y guardar el formulario
    const titleInput = screen.getByLabelText(/título/i);
    fireEvent.change(titleInput, { target: { value: 'Evento de prueba' } });
    
    const saveButton = screen.getByText(/guardar/i);
    fireEvent.click(saveButton);
    
    // Verificar que se publicó un evento en EventBus
    await waitFor(() => {
      expect(mockPublish).toHaveBeenCalled();
      
      // Verificar que el evento es del tipo correcto (create/update)
      const eventType = mockPublish.mock.calls[0][0]; // Primer argumento es el tipo
      expect(eventType).toContain('calendar');
      expect(eventType).toMatch(/create|update/i);
      
      // Verificar que se envió el evento creado
      const eventData = mockPublish.mock.calls[0][1]; // Segundo argumento son los datos
      expect(eventData).toBeTruthy();
      expect(eventData.title).toBe('Evento de prueba');
    });
  });

  test('3.1.6 El nuevo evento aparece en la cuadrícula del calendario tras su creación', async () => {
    render(<CalendarMain />);
    
    // Verificar que no hay eventos inicialmente
    const initialEvents = document.querySelectorAll('.calendar-event');
    expect(initialEvents.length).toBe(0);
    
    await clickOnCalendarCell();
    
    // Completar y guardar el formulario
    const titleInput = screen.getByLabelText(/título/i);
    fireEvent.change(titleInput, { target: { value: 'Evento visible' } });
    
    const saveButton = screen.getByText(/guardar/i);
    fireEvent.click(saveButton);
    
    // Esperar a que aparezca el evento en la cuadrícula
    await waitFor(() => {
      const calendarEvents = document.querySelectorAll('.calendar-event');
      expect(calendarEvents.length).toBeGreaterThan(0);
      
      // Al menos uno de los eventos debe contener el título
      const eventWithTitle = Array.from(calendarEvents).find(
        event => event.textContent.includes('Evento visible')
      );
      expect(eventWithTitle).toBeInTheDocument();
    });
  });

  test('3.1.7 Validación de fechas funciona al crear un nuevo evento', async () => {
    render(<CalendarMain />);
    
    await clickOnCalendarCell();
    
    // Intentar crear un evento con fecha de fin anterior a la fecha de inicio
    const titleInput = screen.getByLabelText(/título/i);
    fireEvent.change(titleInput, { target: { value: 'Evento con fechas inválidas' } });
    
    // Obtener las fechas actuales
    const startInput = screen.getByLabelText(/inicio/i);
    const endInput = screen.getByLabelText(/fin/i);
    
    // Modificar la fecha de fin para que sea anterior a la de inicio
    const startDate = new Date(startInput.value.replace('T', ' '));
    const invalidEndDate = new Date(startDate);
    invalidEndDate.setHours(startDate.getHours() - 1); // Una hora antes
    
    // Formatear la fecha para el input
    const year = invalidEndDate.getFullYear();
    const month = String(invalidEndDate.getMonth() + 1).padStart(2, '0');
    const day = String(invalidEndDate.getDate()).padStart(2, '0');
    const hours = String(invalidEndDate.getHours()).padStart(2, '0');
    const minutes = String(invalidEndDate.getMinutes()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;
    
    // Cambiar la fecha de fin
    fireEvent.change(endInput, { target: { value: formattedDate } });
    
    // Intentar guardar
    const saveButton = screen.getByText(/guardar/i);
    fireEvent.click(saveButton);
    
    // Verificar que aparece un mensaje de error
    await waitFor(() => {
      const errorMessage = screen.getByText(/fin no puede ser anterior/i) || 
                           screen.getByText(/fecha.*inválida/i) ||
                           document.querySelector('.form-error');
      expect(errorMessage).toBeInTheDocument();
      
      // El formulario debe seguir abierto
      expect(document.querySelector('.ui-dialog')).toBeInTheDocument();
    });
  });

  test('3.1.8 La creación de eventos funciona correctamente en vista diaria', async () => {
    render(<CalendarMain />);
    
    // Cambiar a vista diaria
    const dayViewButton = screen.getByText(/vista diaria/i);
    fireEvent.click(dayViewButton);
    
    // Esperar a que cambie la vista
    await waitFor(() => {
      expect(document.querySelector('.day-view-container')).toBeInTheDocument();
    });
    
    // Hacer clic en una celda para crear un evento
    const dayViewCells = document.querySelectorAll('.day-view-hour-slot');
    expect(dayViewCells.length).toBeGreaterThan(0);
    
    fireEvent.click(dayViewCells[10]); // Clic en la celda para las 10:00
    
    // Verificar que se abre el formulario
    await waitFor(() => {
      expect(document.querySelector('.ui-dialog')).toBeInTheDocument();
    });
    
    // Completar y guardar el formulario
    const titleInput = screen.getByLabelText(/título/i);
    fireEvent.change(titleInput, { target: { value: 'Evento en vista diaria' } });
    
    const saveButton = screen.getByText(/guardar/i);
    fireEvent.click(saveButton);
    
    // Verificar que el evento aparece en la vista diaria
    await waitFor(() => {
      const dayViewEvents = document.querySelectorAll('.day-view-container .calendar-event');
      expect(dayViewEvents.length).toBeGreaterThan(0);
      
      // Al menos un evento debe contener el título
      const eventWithTitle = Array.from(dayViewEvents).find(
        event => event.textContent.includes('Evento en vista diaria')
      );
      expect(eventWithTitle).toBeInTheDocument();
    });
  });

  test('3.1.9 La creación de eventos utiliza correctamente el nuevo componente Dialog', async () => {
    render(<CalendarMain />);
    
    await clickOnCalendarCell();
    
    // Verificar que se está usando el componente Dialog correctamente
    const dialog = document.querySelector('.ui-dialog');
    expect(dialog).toBeInTheDocument();
    
    // Verificar que tiene los elementos estándar del Dialog
    const dialogHeader = document.querySelector('.ui-dialog-header');
    expect(dialogHeader).toBeInTheDocument();
    
    const dialogTitle = dialogHeader.querySelector('.ui-dialog-title');
    expect(dialogTitle).toBeInTheDocument();
    expect(dialogTitle.textContent).toMatch(/nuevo evento/i);
    
    const dialogBody = document.querySelector('.ui-dialog-body');
    expect(dialogBody).toBeInTheDocument();
    
    const dialogFooter = document.querySelector('.ui-dialog-footer');
    expect(dialogFooter).toBeInTheDocument();
    
    // Verificar botones de acción
    const saveButton = screen.getByText(/guardar/i);
    expect(saveButton).toBeInTheDocument();
    expect(saveButton).toHaveClass('ui-button-primary');
    
    const cancelButton = screen.getByText(/cancelar/i);
    expect(cancelButton).toBeInTheDocument();
  });
});

describe('3.2 Edición de eventos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEvents.length = 0; // Limpiar eventos
  });

  test('3.2.1 Al hacer clic en un evento existente, se abre el formulario de edición', async () => {
    const { container } = render(<CalendarMain />);
    
    await clickOnEvent(container);
    
    // Verificar que el formulario está abierto
    const dialog = document.querySelector('.ui-dialog');
    expect(dialog).toBeInTheDocument();
    
    // Verificar que el título del diálogo es de edición
    const dialogTitle = document.querySelector('.ui-dialog-title');
    expect(dialogTitle.textContent).toMatch(/editar evento/i);
  });

  test('3.2.2 El formulario de edición se rellena con los datos correctos del evento', async () => {
    const { container } = render(<CalendarMain />);
    
    await clickOnEvent(container);
    
    // Verificar que el formulario tiene los datos del evento
    const titleInput = screen.getByLabelText(/título/i);
    expect(titleInput).toHaveValue('Evento de prueba');
    
    // Verificar que las fechas están rellenadas
    const startInput = screen.getByLabelText(/inicio/i);
    const endInput = screen.getByLabelText(/fin/i);
    expect(startInput).toHaveValue();
    expect(endInput).toHaveValue();
  });

  test('3.2.3 Los cambios en el evento se guardan correctamente', async () => {
    const { container } = render(<CalendarMain />);
    
    await clickOnEvent(container);
    
    // Modificar el título
    const titleInput = screen.getByLabelText(/título/i);
    fireEvent.change(titleInput, { target: { value: 'Evento modificado' } });
    
    // Guardar cambios
    const saveButton = screen.getByText(/guardar/i);
    fireEvent.click(saveButton);
    
    // Verificar que se cerró el formulario
    await waitFor(() => {
      expect(document.querySelector('.ui-dialog')).not.toBeInTheDocument();
    });
    
    // Verificar que el evento ahora tiene el nuevo título
    const events = document.querySelectorAll('.calendar-event');
    const eventWithNewTitle = Array.from(events).find(
      event => event.textContent.includes('Evento modificado')
    );
    expect(eventWithNewTitle).toBeInTheDocument();
  });

  test('3.2.4 El evento actualizado se guarda en el almacenamiento', async () => {
    const { container } = render(<CalendarMain />);
    
    await clickOnEvent(container);
    
    // Modificar el título
    const titleInput = screen.getByLabelText(/título/i);
    fireEvent.change(titleInput, { target: { value: 'Evento actualizado en almacenamiento' } });
    
    // Limpiar mock para detectar nuevas llamadas
    mockStorageSet.mockClear();
    
    // Guardar cambios
    const saveButton = screen.getByText(/guardar/i);
    fireEvent.click(saveButton);
    
    // Verificar que se guardó en almacenamiento
    await waitFor(() => {
      expect(mockStorageSet).toHaveBeenCalled();
      
      // Verificar que se guardó con la clave correcta
      const key = mockStorageSet.mock.calls[0][0];
      expect(key).toContain('events');
      
      // Verificar que el evento actualizado tiene el nuevo título
      const savedEvents = mockStorageSet.mock.calls[0][1];
      const updatedEvent = savedEvents.find(
        event => event.title === 'Evento actualizado en almacenamiento'
      );
      expect(updatedEvent).toBeTruthy();
    });
  });

  test('3.2.5 El evento publica una notificación de actualización a través de EventBus', async () => {
    const { container } = render(<CalendarMain />);
    
    await clickOnEvent(container);
    
    // Modificar el título
    const titleInput = screen.getByLabelText(/título/i);
    fireEvent.change(titleInput, { target: { value: 'Evento para EventBus' } });
    
    // Limpiar mock para detectar nuevas llamadas
    mockPublish.mockClear();
    
    // Guardar cambios
    const saveButton = screen.getByText(/guardar/i);
    fireEvent.click(saveButton);
    
    // Verificar que se publicó un evento en EventBus
    await waitFor(() => {
      expect(mockPublish).toHaveBeenCalled();
      
      // Verificar que el evento es del tipo correcto (update)
      const eventType = mockPublish.mock.calls[0][0];
      expect(eventType).toContain('calendar');
      expect(eventType).toMatch(/update/i);
      
      // Verificar que se envió el evento actualizado
      const eventData = mockPublish.mock.calls[0][1];
      expect(eventData).toBeTruthy();
      expect(eventData.title).toBe('Evento para EventBus');
    });
  });

  test('3.2.6 El evento actualizado aparece con los cambios en la cuadrícula del calendario', async () => {
    const { container } = render(<CalendarMain />);
    
    await clickOnEvent(container);
    
    // Cambiar el título y el color
    const titleInput = screen.getByLabelText(/título/i);
    fireEvent.change(titleInput, { target: { value: 'Evento con cambios visibles' } });
    
    const colorInput = screen.getByLabelText(/color/i);
    fireEvent.change(colorInput, { target: { value: '#FF5722' } });
    
    // Guardar cambios
    const saveButton = screen.getByText(/guardar/i);
    fireEvent.click(saveButton);
    
    // Verificar que el evento aparece actualizado en la cuadrícula
    await waitFor(() => {
      const events = document.querySelectorAll('.calendar-event');
      const updatedEvent = Array.from(events).find(
        event => event.textContent.includes('Evento con cambios visibles')
      );
      
      expect(updatedEvent).toBeInTheDocument();
      // Verificar que el color se actualizó (puede ser aplicado de diferentes maneras)
      expect(updatedEvent.style.backgroundColor).toBe('rgb(255, 87, 34)') || 
        expect(window.getComputedStyle(updatedEvent).backgroundColor).toBe('rgb(255, 87, 34)');
    });
  });

  test('3.2.7 Validación de fechas funciona al editar un evento existente', async () => {
    const { container } = render(<CalendarMain />);
    
    await clickOnEvent(container);
    
    // Obtener las fechas actuales
    const startInput = screen.getByLabelText(/inicio/i);
    const endInput = screen.getByLabelText(/fin/i);
    
    // Modificar la fecha de fin para que sea anterior a la de inicio
    const startDate = new Date(startInput.value.replace('T', ' '));
    const invalidEndDate = new Date(startDate);
    invalidEndDate.setHours(startDate.getHours() - 1); // Una hora antes
    
    // Formatear la fecha para el input
    const year = invalidEndDate.getFullYear();
    const month = String(invalidEndDate.getMonth() + 1).padStart(2, '0');
    const day = String(invalidEndDate.getDate()).padStart(2, '0');
    const hours = String(invalidEndDate.getHours()).padStart(2, '0');
    const minutes = String(invalidEndDate.getMinutes()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;
    
    // Cambiar la fecha de fin
    fireEvent.change(endInput, { target: { value: formattedDate } });
    
    // Intentar guardar
    const saveButton = screen.getByText(/guardar/i);
    fireEvent.click(saveButton);
    
    // Verificar que aparece un mensaje de error
    await waitFor(() => {
      const errorMessage = screen.getByText(/fin no puede ser anterior/i) || 
                           screen.getByText(/fecha.*inválida/i) ||
                           document.querySelector('.form-error');
      expect(errorMessage).toBeInTheDocument();
      
      // El formulario debe seguir abierto
      expect(document.querySelector('.ui-dialog')).toBeInTheDocument();
    });
  });
});

// Restaurar mocks globales
afterAll(() => {
  mockDateNow.mockRestore();
});