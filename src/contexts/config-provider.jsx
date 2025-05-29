import React from "react";
import PropTypes from "prop-types";
import ThemeProvider from "./theme-context";
import TimeScaleProvider from "./time-scale-context";

/**
 * Componente que proporciona todos los contextos configurables de la aplicación
 * Facilita la gestión anidada de contextos para la configuración global
 */
const ConfigProvider = ({ children }) => {
  return (
    <ThemeProvider>
      <TimeScaleProvider>{children}</TimeScaleProvider>
    </ThemeProvider>
  );
};

ConfigProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ConfigProvider;
