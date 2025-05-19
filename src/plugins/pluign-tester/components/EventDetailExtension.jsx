/**
 * Componente para la vista de detalle de eventos
 */
import React from 'react';

export function EventDetailExtension(props) {
  const { plugin, event } = props;
  
  // Solo mostrar si hay un evento
  if (!event) return null;
  
  return (
    <div className="plugin-tester-event-detail">
      <h4>Plugin Tester Info</h4>
      <p>Evento ID: {event.id}</p>
      <p>Última actualización: {new Date().toLocaleTimeString()}</p>
    </div>
  );
}