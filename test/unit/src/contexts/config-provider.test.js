/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock de los Providers hijos
const mockThemeProvider = jest.fn(({ children }) => (
  <div data-testid="mock-theme-provider">{children}</div>
));
const mockTimeScaleProvider = jest.fn(({ children }) => (
  <div data-testid="mock-timescale-provider">{children}</div>
));

jest.mock("../../../../src/contexts/theme-context", () => ({
  __esModule: true, // Necesario si el módulo usa export default
  default: mockThemeProvider, // Mockear el export default (ThemeProvider)
  ThemeProvider: mockThemeProvider, // Mockear el export nombrado (ThemeProvider)
}));
jest.mock("../../../../src/contexts/time-scale-context", () => ({
  __esModule: true,
  default: mockTimeScaleProvider,
  TimeScaleProvider: mockTimeScaleProvider,
}));

// Importar el componente después de los mocks
const ConfigProvider =
  require("../../../../src/contexts/config-provider").default;

describe("ConfigProvider Component", () => {
  beforeEach(() => {
    mockThemeProvider.mockClear();
    mockTimeScaleProvider.mockClear();
  });

  test("debe renderizar a sus hijos", () => {
    render(
      <ConfigProvider>
        <div data-testid="child-element">Child</div>
      </ConfigProvider>
    );
    expect(screen.getByTestId("child-element")).toBeInTheDocument();
    expect(screen.getByText("Child")).toBeInTheDocument();
  });

  test("debe envolver a los hijos con ThemeProvider y TimeScaleProvider", () => {
    render(
      <ConfigProvider>
        <div>Child</div>
      </ConfigProvider>
    );
    expect(mockThemeProvider).toHaveBeenCalled();
    expect(screen.getByTestId("mock-theme-provider")).toBeInTheDocument();

    // TimeScaleProvider está anidado dentro de ThemeProvider
    expect(mockTimeScaleProvider).toHaveBeenCalled();
    expect(screen.getByTestId("mock-timescale-provider")).toBeInTheDocument();

    // Verificar el anidamiento (opcional, pero bueno para la estructura)
    const themeProviderNode = screen.getByTestId("mock-theme-provider");
    expect(themeProviderNode).toContainElement(
      screen.getByTestId("mock-timescale-provider")
    );
    const timeScaleProviderNode = screen.getByTestId("mock-timescale-provider");
    expect(timeScaleProviderNode).toContainElement(screen.getByText("Child"));
  });
});
