// import { useState, useCallback, useRef } from 'react';
// import { useProjectStore } from '../store/projectStore';
// import { HelmertTransform } from '../utils/helmertTransform';

// interface ContextMenuPosition {
//   x: number;
//   y: number;
//   leafletLat: number;
//   leafletLng: number;
// }

// export const useMapContextMenu = (
//   transform: HelmertTransform | null,
//   imageHeight: number
// ) => {
//   const [contextMenuPosition, setContextMenuPosition] = useState<ContextMenuPosition | null>(null);
//   const contextMenuRef = useRef<HTMLDivElement>(null);
  
//   const {
//     addHoehenpunkt,
//     addESQ,
//     addImmissionPoint,
//     dtmProcessor
//   } = useProjectStore();

//   const handleContextMenu = useCallback((e: L.LeafletMouseEvent) => {
//     e.originalEvent.preventDefault();
    
//     const { lat, lng } = e.latlng;
//     const containerPoint = e.containerPoint;
    
//     setContextMenuPosition({
//       x: containerPoint.x,
//       y: containerPoint.y,
//       leafletLat: lat,
//       leafletLng: lng
//     });
//   }, []);

//   const closeContextMenu = useCallback(() => {
//     setContextMenuPosition(null);
//   }, []);

//   const createGKPosition = useCallback((lat: number, lng: number) => {
//     if (!transform) return null;
    
//     const [gkRechts, gkHoch] = transform.pixelToGK(lng, lat);
    
//     // Calculate terrain height if DTM processor is available
//     let terrainHeight = 50; // Default elevation
//     if (dtmProcessor) {
//       try {
//         const gkPosition2D = { Rechts: gkRechts, Hoch: gkHoch };
//         terrainHeight = dtmProcessor.berechneHoeheDGM(gkPosition2D);
//       } catch (error) {
//         console.error("Error calculating terrain height", error);
//         // Use default if calculation fails
//       }
//     }
    
//     return {
//       GK: { Rechts: gkRechts, Hoch: gkHoch },
//       z: terrainHeight
//     };
//   }, [transform, dtmProcessor]);

//   const handleAddHochpunkt = useCallback(() => {
//     if (!contextMenuPosition || !transform) return;
    
//     const position = createGKPosition(contextMenuPosition.leafletLat, contextMenuPosition.leafletLng);
//     if (position) {
//       addHoehenpunkt(position);
//       closeContextMenu();
//     }
//   }, [contextMenuPosition, transform, createGKPosition, addHoehenpunkt, closeContextMenu]);

//   const handleAddESQ = useCallback(() => {
//     if (!contextMenuPosition || !transform) return;
    
//     const position = createGKPosition(contextMenuPosition.leafletLat, contextMenuPosition.leafletLng);
//     if (position) {
//       addESQ(position);
//       closeContextMenu();
//     }
//   }, [contextMenuPosition, transform, createGKPosition, addESQ, closeContextMenu]);

//   const handleAddImmissionPoint = useCallback(() => {
//     if (!contextMenuPosition || !transform) return;
    
//     const position = createGKPosition(contextMenuPosition.leafletLat, contextMenuPosition.leafletLng);
//     if (position) {
//       addImmissionPoint(position);
//       closeContextMenu();
//     }
//   }, [contextMenuPosition, transform, createGKPosition, addImmissionPoint, closeContextMenu]);

//   const handleAddMast = useCallback(async (trasseId?: string) => {
//     if (!contextMenuPosition || !transform) return;
    
//     const position = createGKPosition(contextMenuPosition.leafletLat, contextMenuPosition.leafletLng);
//     if (!position) return;
    
//     let selectedTrasseId = trasseId;
    
//     if (!selectedTrasseId) {
//       if (trassen.size === 0) {
//         // No trassen exist, cannot add mast
//         return;
//       } else if (trassen.size === 1) {
//         // Only one trasse exists, use it
//         selectedTrasseId = Array.from(trassen.keys())[0];
//       }
//     }
    
//     if (selectedTrasseId) {
//       addMast(selectedTrasseId, position);
//       closeContextMenu();
//     }
//   }, [contextMenuPosition, transform, createGKPosition, trassen, addMast, closeContextMenu]);

//   // Removed handleCreateTrasse - Trassen should only be created via Trassen verwalten dialog

//   // Prepare trassen data for the context menu
//   const trassenData = Array.from(trassen.entries()).map(([id, trasse]) => ({
//     id,
//     name: trasse.Name,
//     mastCount: trasse.mastIds.length
//   }));

//   return {
//     contextMenuPosition,
//     contextMenuRef,
//     handleContextMenu,
//     closeContextMenu,
//     handleAddHochpunkt,
//     handleAddESQ,
//     handleAddImmissionPoint,
//     handleAddMast,
//     trassenData
//   };
// };