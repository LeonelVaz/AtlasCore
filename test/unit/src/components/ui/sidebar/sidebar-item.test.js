/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import SidebarItem from "../../../../../../src/components/ui/sidebar/sidebar-item";

describe("SidebarItem Component", () => {
  const mockOnClick = jest.fn();

  beforeEach(() => {
    mockOnClick.mockClear();
  });

  test("debe renderizar con etiqueta y sin icono", () => {
    render(<SidebarItem label="Test Label" onClick={mockOnClick} />);
    const item = screen.getByText("Test Label");
    expect(item).toBeInTheDocument();
    const sidebarItemDiv = item.closest(".sidebar-item");
    expect(sidebarItemDiv).not.toHaveClass("active");
    expect(
      sidebarItemDiv.querySelector(".sidebar-item-icon")
    ).not.toBeInTheDocument();
  });

  test("debe renderizar con etiqueta e icono de Material Icons", () => {
    render(<SidebarItem label="Home" icon="home" onClick={mockOnClick} />);
    expect(screen.getByText("Home")).toBeInTheDocument();
    const iconTextNode = screen.getByText("home");
    expect(iconTextNode).toHaveClass("material-icons");
    expect(iconTextNode.parentElement).toHaveClass("sidebar-item-icon");
  });

  test("debe renderizar con etiqueta y un nodo de icono (ej. SVG)", () => {
    const CustomIcon = () => <svg data-testid="custom-icon" />;
    render(
      <SidebarItem label="Custom" icon={<CustomIcon />} onClick={mockOnClick} />
    );
    expect(screen.getByText("Custom")).toBeInTheDocument();
    const customIconElement = screen.getByTestId("custom-icon");
    expect(
      customIconElement.closest("span.sidebar-item-icon")
    ).toBeInTheDocument();
  });

  test("debe renderizar con etiqueta y un emoji como icono", () => {
    render(<SidebarItem label="Emoji" icon="🏠" onClick={mockOnClick} />);
    expect(screen.getByText("Emoji")).toBeInTheDocument();

    const sidebarItemDiv = screen.getByText("Emoji").closest(".sidebar-item");
    // Buscar el span del icono por su clase dentro del div principal
    const iconContainer = sidebarItemDiv.querySelector(".sidebar-item-icon");

    // Verificar que el contenedor del icono existe
    expect(iconContainer).toBeInTheDocument();
    // Verificar que el contenedor del icono tiene el emoji como textContent
    expect(iconContainer).toHaveTextContent("🏠");
    // Verificar que el contenedor del icono tiene la clase correcta
    expect(iconContainer).toHaveClass("sidebar-item-icon"); // Esta debería ser la aserción principal

    // Adicionalmente, asegurar que no se interpretó como un material icon
    expect(
      within(sidebarItemDiv).queryByText((content, node) =>
        node.classList.contains("material-icons")
      )
    ).not.toBeInTheDocument();
  });

  test('debe tener la clase "active" si la prop active es true', () => {
    render(
      <SidebarItem label="Active Item" active={true} onClick={mockOnClick} />
    );
    expect(
      screen.getByText("Active Item").closest(".sidebar-item")
    ).toHaveClass("active");
  });

  test('no debe tener la clase "active" si la prop active es false o no se proporciona', () => {
    render(<SidebarItem label="Inactive Item" onClick={mockOnClick} />);
    expect(
      screen.getByText("Inactive Item").closest(".sidebar-item")
    ).not.toHaveClass("active");
  });

  test("debe llamar a onClick cuando se hace clic en el item", () => {
    render(<SidebarItem label="Clickable" onClick={mockOnClick} />);
    fireEvent.click(screen.getByText("Clickable").closest(".sidebar-item"));
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });
});
