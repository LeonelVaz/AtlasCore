import React from 'react';
import PropTypes from 'prop-types';

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
  // Sanitizar HTML usando un enfoque más seguro sin DOMParser
  const sanitizeHtml = (html) => {
    if (!html || typeof html !== 'string') return '';
    if (!sanitize) return html;
    
    try {
      // Lista de etiquetas permitidas
      const allowedTags = [
        'p', 'br', 'b', 'i', 'u', 'strong', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'pre', 'code', 'hr', 'span', 'div'
      ];
      
      // Crear un elemento temporal en el DOM real
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      
      // Función recursiva para sanitizar nodos
      const processNode = (node) => {
        if (!node) return;
        
        // Si es un elemento
        if (node.nodeType === 1) {
          const tagName = node.tagName.toLowerCase();
          
          // Si no es una etiqueta permitida, reemplazar con span
          if (!allowedTags.includes(tagName)) {
            const span = document.createElement('span');
            // Mover todos los hijos al nuevo span
            while (node.firstChild) {
              span.appendChild(node.firstChild);
            }
            // Reemplazar el nodo original
            if (node.parentNode) {
              node.parentNode.replaceChild(span, node);
            }
            // Procesar el nuevo span
            processNode(span);
            return;
          }
          
          // Sanitizar atributos
          const attributes = Array.from(node.attributes || []);
          attributes.forEach(attr => {
            const name = attr.name.toLowerCase();
            const value = attr.value;
            
            // Lista de atributos permitidos
            const allowedAttributes = ['href', 'src', 'alt', 'title', 'class', 'id', 'style'];
            
            if (!allowedAttributes.includes(name)) {
              node.removeAttribute(name);
            } else {
              // Validaciones específicas
              if (name === 'href' && value.toLowerCase().startsWith('javascript:')) {
                node.removeAttribute(name);
              } else if (name === 'style') {
                // Limpiar estilos peligrosos
                const cleanStyle = value
                  .split(';')
                  .filter(style => {
                    const prop = style.split(':')[0]?.trim().toLowerCase();
                    return prop && 
                           !prop.includes('expression') && 
                           !prop.includes('import') &&
                           !prop.includes('javascript');
                  })
                  .join(';');
                node.setAttribute(name, cleanStyle);
              }
            }
          });
        }
        
        // Procesar hijos recursivamente
        const children = Array.from(node.childNodes || []);
        children.forEach(processNode);
      };
      
      // Procesar todos los nodos hijos
      const children = Array.from(tempDiv.childNodes);
      children.forEach(processNode);
      
      // Devolver el HTML sanitizado
      const result = tempDiv.innerHTML;
      
      // Limpiar el elemento temporal
      tempDiv.remove();
      
      return result;
      
    } catch (error) {
      console.error('Error al sanitizar HTML:', error);
      // En caso de error, aplicar sanitización básica por regex
      return basicSanitize(html);
    }
  };

  // Sanitización básica de respaldo usando regex
  const basicSanitize = (html) => {
    if (!html) return '';
    
    // Remover scripts y eventos peligrosos
    let cleaned = html
      .replace(/<script[^>]*>.*?<\/script>/gis, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/on\w+='[^']*'/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gis, '')
      .replace(/<object[^>]*>.*?<\/object>/gis, '')
      .replace(/<embed[^>]*>/gi, '')
      .replace(/<form[^>]*>.*?<\/form>/gis, '');
    
    return cleaned;
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