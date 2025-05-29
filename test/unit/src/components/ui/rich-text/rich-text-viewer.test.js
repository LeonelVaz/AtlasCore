/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import RichTextViewer from "../../../../../../src/components/ui/rich-text/rich-text-viewer"; // Ajusta la ruta

describe("RichTextViewer Component", () => {
  const getViewerContainer = () =>
    screen.getByTestId("rich-text-viewer-container");

  test("debe renderizar contenido HTML simple", () => {
    const htmlContent = "<p>Hola <strong>mundo</strong>!</p>";
    render(<RichTextViewer content={htmlContent} />);
    const viewer = getViewerContainer(); // Usar el helper
    expect(viewer.innerHTML).toBe(htmlContent);
    // Estas verificaciones son buenas para asegurar que el contenido se parsea
    expect(
      screen.getByText(
        (content, element) =>
          element.tagName.toLowerCase() === "p" && content.startsWith("Hola")
      )
    ).toBeInTheDocument();
    expect(screen.getByText("mundo").tagName).toBe("STRONG");
  });

  test("debe aplicar clases adicionales", () => {
    render(<RichTextViewer content="<p>Test</p>" className="extra-class" />);
    const viewer = getViewerContainer();
    expect(viewer).toHaveClass("rich-text-viewer extra-class");
  });

  test("debe aplicar maxHeight si se proporciona", () => {
    render(<RichTextViewer content="<p>Test</p>" maxHeight="100px" />);
    const viewer = getViewerContainer();
    expect(viewer).toHaveStyle("max-height: 100px");
    expect(viewer).toHaveStyle("overflow: auto");
  });

  test("no debe aplicar maxHeight si no se proporciona", () => {
    render(<RichTextViewer content="<p>Test</p>" />);
    const viewer = getViewerContainer();
    expect(viewer).toHaveStyle("max-height: auto");
    expect(viewer).toHaveStyle("overflow: visible");
  });

  describe("Sanitización de HTML", () => {
    test("debe sanitizar scripts por defecto", () => {
      const maliciousContent =
        '<p>Contenido <script>alert("XSS")</script> seguro.</p>';
      render(<RichTextViewer content={maliciousContent} />);
      const viewer = getViewerContainer();
      expect(viewer.innerHTML).not.toContain("<script");
      // La sanitización actual reemplaza la etiqueta no permitida (script) por un span
      // y mueve el contenido al span, o lo elimina si no hay contenido.
      // Si <script>alert("XSS")</script> se vuelve <span>alert("XSS")</span>
      expect(viewer.innerHTML).toContain(
        'Contenido <span>alert("XSS")</span> seguro.'
      );
      expect(
        screen.getByText(
          (content, el) =>
            el.tagName.toLowerCase() === "p" &&
            content.includes("Contenido") &&
            content.includes("seguro")
        )
      ).toBeInTheDocument();
    });

    test("debe remover atributos de evento peligrosos (onclick)", () => {
      const maliciousContent =
        '<p><a href="#" onclick="alert(\'XSS\')">Click Me</a></p>';
      render(<RichTextViewer content={maliciousContent} />);
      const viewer = getViewerContainer(); // Obtenemos el contenedor
      const link = screen.getByText("Click Me");
      expect(link).not.toHaveAttribute("onclick");
      // Verificar el innerHTML del contenedor para más seguridad
      expect(viewer.innerHTML).not.toContain("onclick=");
    });

    test("debe remover href con javascript: URL", () => {
      const maliciousContent =
        "<p><a href=\"javascript:alert('XSS')\">Evil Link</a></p>";
      render(<RichTextViewer content={maliciousContent} />);
      // const viewer = getViewerContainer(); // No es estrictamente necesario para esta aserción
      const link = screen.getByText("Evil Link");
      // La sanitización actual elimina el atributo href si contiene javascript:
      expect(link).not.toHaveAttribute("href");
    });

    test("debe mantener atributos permitidos como href y src válidos", () => {
      const validContent =
        '<p><a href="https://example.com">Link</a> <img src="image.png" alt="alt text"></p>';
      render(<RichTextViewer content={validContent} />);
      const link = screen.getByText("Link");
      expect(link).toHaveAttribute("href", "https://example.com");
      const img = screen.getByAltText("alt text");
      expect(img).toHaveAttribute("src", "image.png");
    });

    test("debe remover etiquetas no permitidas, reemplazándolas por span y manteniendo el contenido", () => {
      const contentWithForbiddenTag =
        "<p>Texto <customtag>interno</customtag></p>";
      render(<RichTextViewer content={contentWithForbiddenTag} />);
      const viewer = getViewerContainer();
      // La lógica de sanitización actual reemplaza <customtag> por <span> y mueve el contenido.
      expect(viewer.innerHTML).toBe("<p>Texto <span>interno</span></p>");
      expect(screen.getByText("interno").tagName).toBe("SPAN");
    });

    test("no debe sanitizar si la prop sanitize es false", () => {
      const maliciousContent =
        '<p>Contenido <script>alert("XSS")</script> inseguro.</p>';
      render(<RichTextViewer content={maliciousContent} sanitize={false} />);
      const viewer = getViewerContainer();
      expect(viewer.innerHTML).toContain('<script>alert("XSS")</script>');
    });

    test("debe manejar contenido vacío o nulo devolviendo un string vacío para innerHTML", () => {
      const { rerender } = render(<RichTextViewer content={null} />);
      const viewerNull = getViewerContainer();
      expect(viewerNull.innerHTML).toBe(""); // dangerouslySetInnerHTML con '' o null resulta en innerHTML vacío

      rerender(<RichTextViewer content="" />);
      const viewerEmpty = getViewerContainer();
      expect(viewerEmpty.innerHTML).toBe("");
    });
  });
});
