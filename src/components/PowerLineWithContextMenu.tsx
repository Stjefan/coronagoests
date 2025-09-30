import React, { useState, useCallback, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Polyline, Popup } from 'react-leaflet';
import { AllConductorsEditDialog } from './dialogs/AllConductorsEditDialog';
import L from 'leaflet';

interface PowerLineWithContextMenuProps {
  mastId: string;
  nextMastId: string;
  mastName: string;
  nextMastName: string;
  trasseName: string;
  mastIndex: number;
  positions: L.LatLngExpression[];
}

export const PowerLineWithContextMenu: React.FC<PowerLineWithContextMenuProps> = ({
  mastId,
  nextMastId,
  mastName,
  nextMastName,
  trasseName,
  mastIndex,
  positions
}) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  const handleContextMenu = useCallback((e: L.LeafletMouseEvent) => {
    L.DomEvent.preventDefault(e.originalEvent);
    L.DomEvent.stopPropagation(e.originalEvent);
    
    const x = e.originalEvent.pageX || e.originalEvent.clientX;
    const y = e.originalEvent.pageY || e.originalEvent.clientY;
    
    setMenuPosition({ x, y });
    setMenuVisible(true);
  }, []);
  
  const handleEdit = useCallback(() => {
    setEditDialogOpen(true);
    setMenuVisible(false);
  }, []);
  
  // Close menu on escape or click outside
  useEffect(() => {
    if (!menuVisible) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuVisible(false);
      }
    };
    
    const handleClickOutside = () => {
      setMenuVisible(false);
    };
    
    document.addEventListener('keydown', handleEscape);
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [menuVisible]);
  
  const lineLabel = `${trasseName}: Mast ${mastIndex + 1} → Mast ${mastIndex + 2}`;
  
  return (
    <>
      <Polyline
        positions={positions}
        pathOptions={{
          color: '#000000',
          weight: 3,
          opacity: 0.7,
        }}
        eventHandlers={{
          contextmenu: handleContextMenu,
          click: (e) => {
            // Prevent map click event
            L.DomEvent.stopPropagation(e);
          }
        }}
      >
        <Popup>
          <div>
            <strong>Leitung {trasseName}</strong><br />
            {mastName} → {nextMastName}<br />
            Mast #{mastIndex + 1} zu Mast #{mastIndex + 2}
          </div>
        </Popup>
      </Polyline>
      
      {menuVisible && ReactDOM.createPortal(
        <div
          style={{
            position: 'fixed',
            left: menuPosition.x,
            top: menuPosition.y,
            zIndex: 10000,
            backgroundColor: 'white',
            border: '1px solid #ccc',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            padding: '4px 0',
            minWidth: '180px'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            onClick={handleEdit}
          >
            ⚡ Leitungen bearbeiten
          </div>
          
          <div style={{ height: '1px', backgroundColor: '#e0e0e0', margin: '4px 0' }} />
          
          <div
            style={{
              padding: '8px 12px',
              fontSize: '12px',
              color: '#666',
              backgroundColor: '#f8f8f8'
            }}
          >
            {lineLabel}
          </div>
        </div>,
        document.body
      )}
      
      {/* All Conductors Edit Dialog */}
      {editDialogOpen && (
        <AllConductorsEditDialog
          mastId={mastId}
          nextMastId={nextMastId}
          isOpen={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
        />
      )}
    </>
  );
};