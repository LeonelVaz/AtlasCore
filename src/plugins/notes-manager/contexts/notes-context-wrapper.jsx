import React from 'react';
import { NotesProvider } from './notes-context';

/**
 * Wrapper para asegurar que los componentes de notas tengan acceso al contexto
 * Útil para componentes que se utilizan fuera del ámbito del plugin
 */
const NotesContextWrapper = ({ children, pluginId = 'notes-manager' }) => {
  return (
    <NotesProvider pluginId={pluginId}>
      {children}
    </NotesProvider>
  );
};

export default NotesContextWrapper;