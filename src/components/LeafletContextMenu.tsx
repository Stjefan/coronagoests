import React, { useState, useCallback } from "react";
import ReactDOM from "react-dom";
import { useMapEvents } from "react-leaflet";
import { useProjectStore } from "../store/projectStore";
import { HelmertTransform } from "../utils/helmertTransform";
import L from "leaflet";

interface LeafletContextMenuProps {
  transform: HelmertTransform | null;
  imageHeight: number;
}

export const LeafletContextMenu: React.FC<LeafletContextMenuProps> = ({
  transform,
}) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [mapClickPosition, setMapClickPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const {
    addHoehenpunkt,
    addESQ,
    addImmissionPoint,
    trassenNew,
    dtmProcessor,
    addPole,
  } = useProjectStore();

  const createGKPosition = useCallback(
    (lat: number, lng: number) => {
      if (!transform) return null;

      const [gkRechts, gkHoch] = transform.pixelToGK(lng, lat);

      let terrainHeight = 50;
      if (dtmProcessor) {
        try {
          const gkPosition2D = { Rechts: gkRechts, Hoch: gkHoch };
          terrainHeight = dtmProcessor.berechneHoeheDGM(gkPosition2D);
        } catch (error) {
          console.error("Error calculating terrain height:", error);
          // Use default
        }
      }

      return {
        GK: { Rechts: gkRechts, Hoch: gkHoch },
        z: terrainHeight,
      };
    },
    [transform, dtmProcessor]
  );

  const handleAddHoehenpunkt = useCallback(() => {
    if (!mapClickPosition || !transform) return;

    const position = createGKPosition(
      mapClickPosition.lat,
      mapClickPosition.lng
    );
    if (position) {
      addHoehenpunkt(position);
    }
    setMenuVisible(false);
  }, [mapClickPosition, transform, createGKPosition, addHoehenpunkt]);

  const handleAddESQ = useCallback(() => {
    if (!mapClickPosition || !transform) return;

    const position = createGKPosition(
      mapClickPosition.lat,
      mapClickPosition.lng
    );
    if (position) {
      addESQ(position);
    }
    setMenuVisible(false);
  }, [mapClickPosition, transform, createGKPosition, addESQ]);

  const handleAddImmissionPoint = useCallback(() => {
    if (!mapClickPosition || !transform) return;

    const position = createGKPosition(
      mapClickPosition.lat,
      mapClickPosition.lng
    );
    if (position) {
      addImmissionPoint(position);
    }
    setMenuVisible(false);
  }, [mapClickPosition, transform, createGKPosition, addImmissionPoint]);

  const handleAddMast = useCallback(
    async (trasseId?: string) => {
      if (!mapClickPosition || !transform) return;

      const position = createGKPosition(
        mapClickPosition.lat,
        mapClickPosition.lng
      );
      if (!position) return;

      let selectedTrasseId = trasseId;

      if (!selectedTrasseId) {
        if (trassenNew.size === 0) {
          // No trassen exist, cannot add mast
          return;
        } else if (trassenNew.size === 1) {
          selectedTrasseId = Array.from(trassenNew.keys())[0];
        }
      }

      if (selectedTrasseId) {
        addPole(selectedTrasseId, position);
      }
      setMenuVisible(false);
    },
    [mapClickPosition, transform, createGKPosition, trassenNew, addPole]
  );

  // Removed handleCreateTrasse - Trassen should only be created via Trassen verwalten dialog

  useMapEvents({
    contextmenu: (e) => {
      L.DomEvent.preventDefault(e.originalEvent);
      L.DomEvent.stopPropagation(e.originalEvent);

      const { lat, lng } = e.latlng;
      // Get the actual screen coordinates
      const x = e.originalEvent.pageX || e.originalEvent.clientX;
      const y = e.originalEvent.pageY || e.originalEvent.clientY;

      setMapClickPosition({ lat, lng });
      setMenuPosition({ x, y });
      setMenuVisible(true);
    },
    click: () => {
      setMenuVisible(false);
    },
    dragstart: () => {
      setMenuVisible(false);
    },
  });

  if (!menuVisible) return null;

  const trassenArray = Array.from(trassenNew.entries()).map(([id, trasse]) => ({
    id,
    name: trasse.name,
    mastCount: trasse.poleIds.length,
  }));

  // Render the menu using a portal to ensure it's outside the map container
  return ReactDOM.createPortal(
    <div
      style={{
        position: "fixed",
        left: menuPosition.x,
        top: menuPosition.y,
        zIndex: 10000,
        backgroundColor: "white",
        border: "1px solid #ccc",
        borderRadius: "4px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        padding: "4px 0",
        minWidth: "200px",
      }}
    >
      <div
        style={{
          padding: "8px 12px",
          cursor: "pointer",
          fontSize: "14px",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = "#f0f0f0")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = "transparent")
        }
        onClick={handleAddHoehenpunkt}
      >
        📍 Höhenpunkt hinzufügen
      </div>

      <div
        style={{
          padding: "8px 12px",
          cursor: "pointer",
          fontSize: "14px",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = "#f0f0f0")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = "transparent")
        }
        onClick={handleAddImmissionPoint}
      >
        📡 Immissionspunkt hinzufügen
      </div>

      <div
        style={{
          padding: "8px 12px",
          cursor: "pointer",
          fontSize: "14px",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = "#f0f0f0")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = "transparent")
        }
        onClick={handleAddESQ}
      >
        ⚡ ESQ hinzufügen
      </div>

      <div
        style={{ height: "1px", backgroundColor: "#e0e0e0", margin: "4px 0" }}
      />

      {trassenArray.length === 0 ? (
        <div
          style={{
            padding: "8px 12px",
            fontSize: "14px",
            color: "#999",
            fontStyle: "italic",
          }}
        >
          Keine Trassen vorhanden
        </div>
      ) : trassenArray.length === 1 ? (
        <div
          style={{
            padding: "8px 12px",
            cursor: "pointer",
            fontSize: "14px",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "#f0f0f0")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "transparent")
          }
          onClick={() => handleAddMast(trassenArray[0].id)}
        >
          🏗️ Mast hinzufügen ({trassenArray[0].name})
        </div>
      ) : (
        <>
          <div style={{ padding: "8px 12px", fontSize: "14px", color: "#666" }}>
            Mast hinzufügen zu:
          </div>
          {trassenArray.map((trasse) => (
            <div
              key={trasse.id}
              style={{
                padding: "8px 12px 8px 24px",
                cursor: "pointer",
                fontSize: "14px",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#f0f0f0")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
              onClick={() => handleAddMast(trasse.id)}
            >
              {trasse.name} ({trasse.mastCount} Masten)
            </div>
          ))}
        </>
      )}
    </div>,
    document.body // Render to document.body instead of inside the map
  );
};
