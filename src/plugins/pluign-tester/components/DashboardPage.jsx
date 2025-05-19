/**
 * Componente principal del dashboard del plugin
 */
import React, { useState, useEffect } from 'react';

export function DashboardPage(props) {
  const { plugin } = props;
  
  // Valores por defecto en caso de que plugin.publicAPI no esté inicializado
  const [stats, setStats] = useState({
    contador: 0,
    eventos: 0,
    ultimaActualizacion: new Date()
  });
  const [eventos, setEventos] = useState([]);
  
  // Actualizar estadísticas cuando el componente se monta
  useEffect(() => {
    // Cargar estadísticas iniciales si la API está disponible
    if (plugin && plugin.publicAPI && plugin.publicAPI.getEstadisticas) {
      setStats(plugin.publicAPI.getEstadisticas());
    }
    
    // Cargar eventos iniciales si están disponibles
    if (plugin && plugin._data && plugin._data.registroEventos) {
      setEventos([...plugin._data.registroEventos]);
    }
    
    // Configurar actualización periódica
    const interval = setInterval(() => {
      if (plugin && plugin.publicAPI && plugin.publicAPI.getEstadisticas) {
        setStats(plugin.publicAPI.getEstadisticas());
      }
      
      if (plugin && plugin._data && plugin._data.registroEventos) {
        setEventos([...plugin._data.registroEventos]);
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, [plugin]);
  
  // Probar la API de eventos
  const publicarEvento = () => {
    plugin._core.events.publish(
      plugin.id,
      'pluginTester.eventoManual',
      {
        timestamp: Date.now(),
        mensaje: 'Evento de prueba manual'
      }
    );
  };
  
  return (
    <div className="plugin-tester-page">
      {/* Cabecera */}
      <h1>Plugin Tester - Panel de Control</h1>
      <p>Esta página muestra las distintas funcionalidades del sistema de plugins de Atlas</p>
      
      {/* Sección de estadísticas */}
      <div className="plugin-tester-card">
        <h2>Estadísticas</h2>
        <p>Contador: {stats.contador}</p>
        <p>Eventos registrados: {stats.eventos}</p>
        <p>Última actualización: {stats.ultimaActualizacion.toLocaleString()}</p>
        <button 
          className="plugin-tester-button"
          onClick={publicarEvento}
        >
          Publicar evento de prueba
        </button>
      </div>
      
      {/* Sección de pruebas de API */}
      <div className="plugin-tester-card">
        <h2>Pruebas de API</h2>
        <div className="plugin-tester-button-group">
          <button 
            className="plugin-tester-button plugin-tester-button-green"
            onClick={async () => {
              try {
                await plugin._core.storage.setItem(
                  plugin.id,
                  'test-key',
                  { tiempo: Date.now() }
                );
                const data = await plugin._core.storage.getItem(
                  plugin.id,
                  'test-key'
                );
                alert(`Prueba de almacenamiento exitosa: ${JSON.stringify(data)}`);
              } catch (error) {
                alert(`Error en prueba de almacenamiento: ${error.message}`);
              }
            }}
          >
            Probar Almacenamiento
          </button>
          
          <button 
            className="plugin-tester-button plugin-tester-button-orange"
            onClick={() => {
              try {
                plugin._core.events.publish(
                  plugin.id,
                  'pluginTester.testEvent',
                  { tiempo: Date.now() }
                );
                alert('Evento de prueba publicado. Revisa la consola para más detalles.');
              } catch (error) {
                alert(`Error en prueba de eventos: ${error.message}`);
              }
            }}
          >
            Probar Eventos
          </button>
          
          <button 
            className="plugin-tester-button plugin-tester-button-purple"
            onClick={() => {
              try {
                const plugins = plugin._core.plugins.getActivePlugins();
                alert(`Plugins activos: ${plugins.map(p => p.id).join(', ')}`);
              } catch (error) {
                alert(`Error en prueba de plugins: ${error.message}`);
              }
            }}
          >
            Listar Plugins
          </button>
        </div>
      </div>
      
      {/* Registro de eventos */}
      <div className="plugin-tester-card">
        <h2>Registro de Eventos</h2>
        <div className="plugin-tester-events-container">
          {eventos.length > 0
            ? eventos.slice().reverse().map((evento, index) => (
                <div className="plugin-tester-event-item" key={`event-${index}`}>
                  <div className="plugin-tester-event-header">
                    {evento.tipo} - {new Date(evento.timestamp).toLocaleString()}
                  </div>
                  <div className="plugin-tester-event-data">
                    {JSON.stringify(evento.datos)}
                  </div>
                </div>
              ))
            : <p>No hay eventos registrados.</p>}
        </div>
      </div>
    </div>
  );
}