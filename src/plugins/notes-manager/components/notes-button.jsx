import React, { useState } from 'react';
import SidebarItem from '../../../components/ui/sidebar/sidebar-item';
import NotesPanel from './notes-panel';
import Dialog from '../../../components/ui/dialog';
import { NotesProvider } from '../contexts/notes-context';

// Componente para integrar el botón de notas en la barra lateral
const NotesButton = ({ pluginId, options }) => {
  const [showPanel, setShowPanel] = useState(false);
  
  const handleClick = () => {
    setShowPanel(true);
  };
  
  const handleClose = () => {
    setShowPanel(false);
  };
  
  return (
    <>
      <SidebarItem
        icon="note"
        label={options?.label || "Notas"}
        onClick={handleClick}
      />
      
      {showPanel && (
        <Dialog
          isOpen={showPanel}
          onClose={handleClose}
          title="Notas"
          className="notes-dialog"
        >
          <NotesProvider pluginId="notes-manager">
            <NotesPanel />
          </NotesProvider>
        </Dialog>
      )}
    </>
  );
};

export default NotesButton;