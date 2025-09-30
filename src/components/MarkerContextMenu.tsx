import React, { useState, useCallback, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Marker, Popup } from 'react-leaflet';
import { useProjectStore } from '../store/projectStore';
import L from 'leaflet';

interface MarkerContextMenuProps {
  id: string;
  type: 'hoehenpunkt' | 'esq' | 'immissionpoint' | 'pole';
  position: L.LatLngExpression;
  icon: L.Icon | L.DivIcon;
  popupContent: React.ReactNode;
  onDelete: () => void;
  onEdit?: () => void;
}

export const MarkerWithContextMenu: React.FC<MarkerContextMenuProps> = ({
  id,
  type,
  position,
  icon,
  popupContent,
  onDelete,
  onEdit
}) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  
  const { selectElement, setEditFormOpen, setSelectedElementType } = useProjectStore();

  const handleContextMenu = useCallback((e: L.LeafletMouseEvent) => {
    L.DomEvent.preventDefault(e.originalEvent);
    L.DomEvent.stopPropagation(e.originalEvent);
    
    const x = e.originalEvent.pageX || e.originalEvent.clientX;
    const y = e.originalEvent.pageY || e.originalEvent.clientY;
    
    setMenuPosition({ x, y });
    setMenuVisible(true);
  }, []);

  const handleEdit = useCallback(() => {
    if (onEdit) {
      onEdit();
    } else {
      selectElement(id);
      setSelectedElementType(type === 'immissionpoint' ? 'immissionpoint' : type);
      setEditFormOpen(true);
    }
    setMenuVisible(false);
  }, [id, type, onEdit, selectElement, setSelectedElementType, setEditFormOpen]);

  const handleDelete = useCallback(() => {
    onDelete();
    setMenuVisible(false);
  }, [onDelete]);

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

  const getTypeLabel = () => {
    switch (type) {
      case 'hoehenpunkt': return 'Höhenpunkt';
      case 'esq': return 'ESQ';
      case 'immissionpoint': return 'Immissionspunkt';
      case 'pole': return 'Mast';
      default: return 'Element';
    }
  };

  return (
    <>
      <Marker
        position={position}
        icon={icon}
        eventHandlers={{
          contextmenu: handleContextMenu,
          click: (e) => {
            // Prevent map click event
            L.DomEvent.stopPropagation(e);
          }
        }}
      >
        <Popup>{popupContent}</Popup>
      </Marker>

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
            minWidth: '150px'
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
            ✏️ {getTypeLabel()} bearbeiten
          </div>
          
          <div style={{ height: '1px', backgroundColor: '#e0e0e0', margin: '4px 0' }} />
          
          <div
            style={{
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#dc2626'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fee2e2';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            onClick={handleDelete}
          >
            🗑️ {getTypeLabel()} löschen
          </div>
        </div>,
        document.body
      )}
    </>
  );
};