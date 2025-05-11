// index.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app';
import './styles/index.css';

/**
 * Punto de entrada principal de la aplicación Atlas
 * Renderiza el componente raíz en el elemento con id 'root'
 */
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);