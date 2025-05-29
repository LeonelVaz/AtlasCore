// src/hooks/use-time-scale.jsx
import { useContext } from "react";
import { TimeScaleContext } from "../contexts/time-scale-context";

/**
 * Hook personalizado para acceder al contexto de escala de tiempo
 * @returns {Object} - Valores y funciones del contexto de escala de tiempo
 */
function useTimeScale() {
  const context = useContext(TimeScaleContext);

  if (!context) {
    throw new Error("useTimeScale debe usarse dentro de un TimeScaleProvider");
  }

  return context;
}

export default useTimeScale;
