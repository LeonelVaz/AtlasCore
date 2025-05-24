/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import RichTextEditor from '../../../../../../src/components/ui/rich-text/rich-text-editor';

describe('RichTextEditor Component', () => {
  const mockOnChange = jest.fn();
  let originalExecCommand;
  let originalPrompt;
  let originalAlert;
  let originalGetSelection;

  beforeAll(() => {
    originalExecCommand = document.execCommand;
    document.execCommand = jest.fn();
  });

  afterAll(() => {
    document.execCommand = originalExecCommand;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    originalPrompt = window.prompt;
    originalAlert = window.alert;
    originalGetSelection = window.getSelection;
    window.prompt = jest.fn();
    window.alert = jest.fn();
    window.getSelection = jest.fn(() => ({
        rangeCount: 0,
        toString: () => '',
        removeAllRanges: jest.fn(),
        addRange: jest.fn(),
        getRangeAt: jest.fn(() => ({
            setStart: jest.fn(),
            setEnd: jest.fn(),
            commonAncestorContainer: document.createElement('div'),
        })),
    }));
  });

  afterEach(() => {
    window.prompt = originalPrompt;
    window.alert = originalAlert;
    window.getSelection = originalGetSelection;
  });

  // Helper para obtener el editor, usando findBy para darle tiempo de renderizar
  const findEditorContentDiv = async () => screen.findByTestId('rich-editor-content-div');

  test('debe renderizar el editor y mostrar placeholder si no hay valor inicial', async () => {
    const placeholderText = "Escribe aquí...";
    render(<RichTextEditor onChange={mockOnChange} placeholder={placeholderText} />);
    const editorContent = await findEditorContentDiv();
    expect(editorContent).toBeInTheDocument();
    // La lógica del componente actual inserta el placeholder como textContent
    // cuando value es undefined y es la carga inicial.
    expect(editorContent.textContent).toBe(placeholderText);
    expect(editorContent.innerHTML).toBe(placeholderText); // Asumiendo que el placeholder es texto plano
  });

  test('debe renderizar con valor inicial', async () => {
    const initialValue = '<p>Hola <strong>mundo</strong></p>';
    render(<RichTextEditor value={initialValue} onChange={mockOnChange} />);
    const editorContent = await findEditorContentDiv();
    // El useEffect que establece el innerHTML desde la prop 'value' se ejecuta después del montaje.
    await waitFor(() => expect(editorContent.innerHTML).toBe(initialValue));
  });

  test('debe llamar a onChange cuando el contenido cambia', async () => {
    render(<RichTextEditor onChange={mockOnChange} />);
    const editorContent = await findEditorContentDiv();

    await act(async () => {
      editorContent.innerHTML = '<p>Nuevo contenido</p>';
      fireEvent.input(editorContent, { target: { innerHTML: '<p>Nuevo contenido</p>' } });
    });
    
    // Esperar a que onChange sea llamado, ya que handleInput es síncrono dentro del evento.
    expect(mockOnChange).toHaveBeenCalledWith('<p>Nuevo contenido</p>');
  });

  test('debe actualizar el contenido del editor cuando la prop value cambia externamente', async () => {
    const initialValue = '<p>Inicial</p>';
    const { rerender } = render(<RichTextEditor value={initialValue} onChange={mockOnChange} />);
    const editorContent = await findEditorContentDiv();
    await waitFor(() => expect(editorContent.innerHTML).toBe(initialValue));

    const newValue = '<p>Actualizado Externamente</p>';
    rerender(<RichTextEditor value={newValue} onChange={mockOnChange} />);
    // Esperar a que el useEffect [value] actualice el innerHTML
    await waitFor(() => expect(editorContent.innerHTML).toBe(newValue));
  });


  describe('Funcionalidad de la Barra de Herramientas', () => {
    test('debe ejecutar comando "bold" al hacer clic en el botón de negrita', async () => {
      render(<RichTextEditor onChange={mockOnChange} />);
      await findEditorContentDiv(); // Asegurar que el editor esté renderizado
      const boldButton = screen.getByTitle(/Negrita/i);
      fireEvent.click(boldButton);
      expect(document.execCommand).toHaveBeenCalledWith('bold', false, null);
      expect(mockOnChange).toHaveBeenCalled(); 
    });

    test('debe ejecutar comando "italic" al hacer clic en el botón de cursiva', async () => {
      render(<RichTextEditor onChange={mockOnChange} />);
      await findEditorContentDiv();
      const italicButton = screen.getByTitle(/Cursiva/i);
      fireEvent.click(italicButton);
      expect(document.execCommand).toHaveBeenCalledWith('italic', false, null);
      expect(mockOnChange).toHaveBeenCalled();
    });

    test('debe llamar a createLink y mostrar prompt al hacer clic en el botón de enlace', async () => {
      window.prompt.mockReturnValue('https://ejemplo.com');
      window.getSelection.mockReturnValue({
        rangeCount: 1,
        toString: () => 'texto seleccionado',
        getRangeAt: jest.fn().mockReturnValue({}),
      });

      render(<RichTextEditor onChange={mockOnChange} />);
      await findEditorContentDiv();
      const linkButton = screen.getByTitle(/Insertar enlace/i);
      fireEvent.click(linkButton);

      expect(window.prompt).toHaveBeenCalledWith('Ingresa la URL del enlace:', 'https://');
      expect(document.execCommand).toHaveBeenCalledWith('createLink', false, 'https://ejemplo.com');
      expect(mockOnChange).toHaveBeenCalled();
    });
    
    test('no debe crear enlace si no hay texto seleccionado', async () => {
        window.getSelection.mockReturnValue({ rangeCount: 0, toString: () => '' });
        render(<RichTextEditor onChange={mockOnChange} />);
        await findEditorContentDiv();
        const linkButton = screen.getByTitle(/Insertar enlace/i);
        fireEvent.click(linkButton);
    
        expect(window.alert).toHaveBeenCalledWith('Por favor, selecciona el texto que quieres convertir en enlace');
        expect(document.execCommand).not.toHaveBeenCalledWith('createLink', expect.anything(), expect.anything());
    });

    test('debe mostrar la barra de herramientas completa por defecto', async () => {
        render(<RichTextEditor onChange={mockOnChange} />);
        await findEditorContentDiv(); // Esperar render completo
        expect(screen.getByTitle(/Negrita/i)).toBeInTheDocument();
        expect(screen.getByTitle(/Alinear a la izquierda/i)).toBeInTheDocument(); 
    });

    test('debe mostrar la barra de herramientas mínima si se especifica', async () => {
        render(<RichTextEditor onChange={mockOnChange} toolbar="minimal" />);
        await findEditorContentDiv();
        expect(screen.getByTitle(/Negrita/i)).toBeInTheDocument();
        expect(screen.queryByTitle(/Alinear a la izquierda/i)).not.toBeInTheDocument();
    });
  });

  describe('Atajos de Teclado', () => {
    test('debe aplicar negrita con Ctrl+B', async () => {
      render(<RichTextEditor onChange={mockOnChange} />);
      const editorContent = await findEditorContentDiv();
      fireEvent.keyDown(editorContent, { key: 'b', ctrlKey: true });
      expect(document.execCommand).toHaveBeenCalledWith('bold', false, null);
      expect(mockOnChange).toHaveBeenCalled();
    });

    test('debe aplicar cursiva con Ctrl+I', async () => {
        render(<RichTextEditor onChange={mockOnChange} />);
        const editorContent = await findEditorContentDiv();
        fireEvent.keyDown(editorContent, { key: 'i', ctrlKey: true });
        expect(document.execCommand).toHaveBeenCalledWith('italic', false, null);
        expect(mockOnChange).toHaveBeenCalled();
      });

      test('debe aplicar subrayado con Ctrl+U', async () => {
        render(<RichTextEditor onChange={mockOnChange} />);
        const editorContent = await findEditorContentDiv();
        fireEvent.keyDown(editorContent, { key: 'u', ctrlKey: true });
        expect(document.execCommand).toHaveBeenCalledWith('underline', false, null);
        expect(mockOnChange).toHaveBeenCalled();
      });
  });
});