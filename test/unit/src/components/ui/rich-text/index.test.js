// test/unit/src/components/ui/rich-text/index.test.js

describe('rich-text/index', () => {
  let richTextIndex;

  beforeAll(() => {
    // Mock de los componentes antes de importar el índice
    jest.doMock('../../../../../../src/components/ui/rich-text/rich-text-editor', () => {
      return function MockRichTextEditor() {
        return 'RichTextEditor';
      };
    });

    jest.doMock('../../../../../../src/components/ui/rich-text/rich-text-viewer', () => {
      return function MockRichTextViewer() {
        return 'RichTextViewer';
      };
    });

    // Importar el módulo después de los mocks
    richTextIndex = require('../../../../../../src/components/ui/rich-text/index');
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('exportaciones named', () => {
    test('debería exportar RichTextEditor', () => {
      expect(richTextIndex.RichTextEditor).toBeDefined();
      expect(typeof richTextIndex.RichTextEditor).toBe('function');
    });

    test('debería exportar RichTextViewer', () => {
      expect(richTextIndex.RichTextViewer).toBeDefined();
      expect(typeof richTextIndex.RichTextViewer).toBe('function');
    });
  });

  describe('exportación por defecto', () => {
    test('debería exportar un objeto con Editor y Viewer', () => {
      expect(richTextIndex.default).toBeDefined();
      expect(typeof richTextIndex.default).toBe('object');
      expect(richTextIndex.default.Editor).toBeDefined();
      expect(richTextIndex.default.Viewer).toBeDefined();
    });

    test('debería tener Editor que apunte a RichTextEditor', () => {
      expect(richTextIndex.default.Editor).toBe(richTextIndex.RichTextEditor);
    });

    test('debería tener Viewer que apunte a RichTextViewer', () => {
      expect(richTextIndex.default.Viewer).toBe(richTextIndex.RichTextViewer);
    });
  });

  describe('verificación de estructura', () => {
    test('debería tener todas las exportaciones esperadas', () => {
      const exportedKeys = Object.keys(richTextIndex);
      
      expect(exportedKeys).toContain('RichTextEditor');
      expect(exportedKeys).toContain('RichTextViewer');
      expect(exportedKeys).toContain('default');
    });

    test('debería poder desestructurar las exportaciones named', () => {
      const { RichTextEditor, RichTextViewer } = richTextIndex;
      
      expect(RichTextEditor).toBeDefined();
      expect(RichTextViewer).toBeDefined();
      expect(typeof RichTextEditor).toBe('function');
      expect(typeof RichTextViewer).toBe('function');
    });

    test('debería poder acceder a los componentes a través del default export', () => {
      const RichText = richTextIndex.default;
      
      expect(RichText.Editor).toBeDefined();
      expect(RichText.Viewer).toBeDefined();
      expect(typeof RichText.Editor).toBe('function');
      expect(typeof RichText.Viewer).toBe('function');
    });
  });
});