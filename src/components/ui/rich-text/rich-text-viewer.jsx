import React from 'react';
import PropTypes from 'prop-types';
import './rich-text-viewer.css';

/**
 * Visualizador de texto enriquecido para plugins de Atlas
 * Muestra contenido HTML con estilos coherentes con la interfaz de Atlas
 */
function RichTextViewer({ 
  content, 
  className = '', 
  maxHeight = null, 
  sanitize = true
}) {
  // Sanitizar HTML si es necesario
  const sanitizeHtml = (html) => {
    if (!html) return '';
    if (!sanitize) return html;
    
    // Implementación básica de sanitización
    // Para una implementación robusta en producción, usar bibliotecas como DOMPurify
    try {
      const allowedTags = [
        'p', 'br', 'b', 'i', 'u', 'strong', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'pre', 'code', 'hr', 'span', 'div'
      ];
      
      const doc = new DOMParser().parseFromString(html, 'text/html');
      
      // Función recursiva para sanitizar nodos
      const processNode = (node) => {
        // Si es un elemento
        if (node.nodeType === 1) {
          // Verificar si es una etiqueta permitida
          if (!allowedTags.includes(node.tagName.toLowerCase())) {
            // Reemplazar con un span
            const span = document.createElement('span');
            while (node.firstChild) {
              span.appendChild(node.firstChild);
            }
            node.parentNode.replaceChild(span, node);
            return span;
          }
          
          // Sanitizar atributos
          const attributes = [...node.attributes];
          attributes.forEach(attr => {
            // Conservar solo atributos seguros
            const name = attr.name.toLowerCase();
            if (name === 'href' || name === 'src' || name === 'alt' || name === 'title' || 
                name === 'class' || name === 'id' || name === 'style') {
              // Para enlaces, asegurar que son seguros
              if (name === 'href' && attr.value.toLowerCase().startsWith('javascript:')) {
                node.removeAttribute(name);
              }
              // Para estilos, permitir solo propiedades básicas
              else if (name === 'style') {
                const cleanStyle = attr.value
                  .split(';')
                  .filter(style => {
                    const prop = style.split(':')[0]?.trim().toLowerCase();
                    return prop && !prop.includes('expression') && !prop.includes('import');
                  })
                  .join(';');
                node.setAttribute(name, cleanStyle);
              }
            } else {
              node.removeAttribute(name);
            }
          });
          
          // Procesar hijos recursivamente
          [...node.childNodes].forEach(processNode);
        }
        
        return node;
      };
      
      // Procesar el cuerpo del documento
      processNode(doc.body);
      
      return doc.body.innerHTML;
    } catch (error) {
      console.error('Error al sanitizar HTML:', error);
      return html; // En caso de error, devolver el HTML original
    }
  };

  const sanitizedContent = sanitizeHtml(content);
  
  const viewerStyle = {
    maxHeight: maxHeight || 'auto',
    overflow: maxHeight ? 'auto' : 'visible'
  };

  return (
    <div 
      className={`rich-text-viewer ${className}`} 
      style={viewerStyle}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
}

RichTextViewer.propTypes = {
  content: PropTypes.string,
  className: PropTypes.string,
  maxHeight: PropTypes.string,
  sanitize: PropTypes.bool
};

export default RichTextViewer;