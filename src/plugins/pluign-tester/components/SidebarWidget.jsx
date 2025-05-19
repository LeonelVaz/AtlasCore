/**
 * Componente para la barra lateral del plugin
 */
import React, { useState, useEffect } from 'react';

export function SidebarWidget(props) {
  const { plugin } = props;
  const [contador, setContador] = useState(plugin && plugin._data ? plugin._data.contador || 0 : 0);
  
  // Actualizar contador cuando cambie en el plugin
  useEffect(() => {
    if (!plugin || !plugin._core) return;
    
    const unsub = plugin._core.events.subscribe(
      plugin.id,
      'pluginTester.actualizacionPeriodica',
      (data) => {
        setContador(data.contador);
      }
    );
    
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [plugin]);
  
  const incrementarContador = () => {
    const nuevoContador = plugin.publicAPI.incrementarContador();
    setContador(nuevoContador);
  };
  
  return (
    <div className="plugin-tester-sidebar">
      <h3>Plugin Tester</h3>
      <p>Contador: {contador}</p>
      <button 
        className="plugin-tester-button"
        onClick={incrementarContador}
      >
        Incrementar
      </button>
    </div>
  );
}