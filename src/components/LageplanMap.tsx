import React, { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import {
  MapContainer,
  ImageOverlay,
  Marker,
  Popup,
  Polygon,
  Polyline,
  useMapEvents,
} from "react-leaflet";
import { ReferencePointCalibrationHandler } from "./ReferencePointCalibration";
import { HelmertTransform } from "../utils/helmertTransform";
import { useProjectStore } from "../store/projectStore";
import type { UsedProjectData } from "../types/usedData";
import { ContourOverlay } from "./ContourOverlay";
import { ImmissionGridOverlay } from "./ImmissionGridOverlay";
import { useDialog } from "../hooks/useDialog";
import { LeafletContextMenu } from "./LeafletContextMenu";
import { MarkerWithContextMenu } from "./MarkerContextMenu";
import { PowerLineWithContextMenu } from "./PowerLineWithContextMenu";
import { MapPrintDialog } from "./dialogs/MapPrintDialog";
import { Button } from "./ui/button";
import { Printer } from "lucide-react";
import { MapScaleControl } from "./MapScaleControl";
import "leaflet/dist/leaflet.css";
import "../styles/print.css";

interface LageplanMapProps {
  imageWidth?: number;
  imageHeight?: number;
  onTransformUpdate?: (transform: HelmertTransform | null) => void;
  showTrassen?: boolean;
  showDGM?: boolean;
  showContour?: boolean;
  onDimensionsUpdate?: (dimensions: { width: number; height: number }) => void;
}

// const MapUpdater: React.FC<{
//   bounds: L.LatLngBoundsExpression;
//   onMapRef?: (map: L.Map) => void;
// }> = ({ bounds, onMapRef }) => {
//   const map = useMap();

//   useEffect(() => {
//     if (onMapRef) {
//       onMapRef(map);
//     }
//   }, [map, onMapRef]);

//   useEffect(() => {
//     // map.fitBounds(bounds);
//   }, [map, bounds]);

//   return null;
// };

const CoordinateDisplay: React.FC<{
  transform: HelmertTransform | null;
  imageHeight: number;
  imageWidth: number;
}> = ({ transform, imageHeight, imageWidth }) => {
  const [position, setPosition] = useState<{
    pixel: [number, number];
    gk: [number, number];
    terrainHeight: number | null;
    gridImmission: number | null;
  } | null>(null);

  const store = useProjectStore();
  const {
    editMode,
    selectedElementType,
    addHoehenpunkt,
    addESQ,
    addImmissionPoint,
    dtmProcessor,
    immissionGrid,
    showImmissionGrid,
    getInterpolatedGridValue,
    getInterpolatedDetailedGridValue,
  } = store;


  useMapEvents({
    mousemove: (e) => {
      const { lat, lng } = e.latlng;
      const pixelX = lng;
      const pixelY = imageHeight - lat; // Convert from bottom-left to top-left origin for display

      // Check if cursor is within image bounds
      const isWithinBounds =
        pixelX >= 0 && pixelX <= imageWidth && lat >= 0 && lat <= imageHeight;

      if (transform && isWithinBounds) {
        const [gkRechts, gkHoch] = transform.pixelToGK(pixelX, lat);

        // Calculate terrain height at this position
        let terrainHeight: number | null = null;
        if (dtmProcessor) {
          try {
            const gkPosition2D = { Rechts: gkRechts, Hoch: gkHoch };
            terrainHeight = dtmProcessor.berechneHoeheDGM(gkPosition2D);
          } catch (error) {
            console.error("Error calculating terrain height", error);
            // Silently ignore errors for hover
          }
        }

        // Get interpolated grid immission value based on display mode
        let gridImmission: number | null = null;
        if (showImmissionGrid && immissionGrid.length > 0) {
          // Use detailed grid if available and display mode is not 'total'
          const immissionGridDetailed = store.immissionGridDetailed || [];
          const contourDisplayMode = store.contourDisplayMode || "total";

          if (
            immissionGridDetailed.length > 0 &&
            contourDisplayMode !== "total"
          ) {
            gridImmission = getInterpolatedDetailedGridValue(
              pixelX,
              lat,
              imageWidth,
              imageHeight,
              contourDisplayMode
            );
          } else {
            gridImmission = getInterpolatedGridValue(
              pixelX,
              lat,
              imageWidth,
              imageHeight
            );
          }
        }

        setPosition({
          pixel: [pixelX, pixelY],
          gk: [gkRechts, gkHoch],
          terrainHeight,
          gridImmission,
        });
      } else if (transform && !isWithinBounds) {
        // Outside image bounds - show pixel coordinates only, no terrain/immission data
        setPosition({
          pixel: [pixelX, pixelY],
          gk: [0, 0],
          terrainHeight: null,
          gridImmission: null,
        });
      } else {
        setPosition({
          pixel: [pixelX, pixelY],
          gk: [0, 0],
          terrainHeight: null,
          gridImmission: null,
        });
      }
    },
    mouseout: () => {
      setPosition(null);
    },
    click: (e) => {
      // Allow adding elements via left-click when in 'add' edit mode
      if (editMode === "add" && transform) {
        const { lat, lng } = e.latlng;
        const [gkRechts, gkHoch] = transform.pixelToGK(lng, lat);
        const gkPosition = {
          GK: { Rechts: gkRechts, Hoch: gkHoch },
          z: 50, // Default elevation
        };

        if (selectedElementType === "hoehenpunkt") {
          addHoehenpunkt(gkPosition);
        } else if (selectedElementType === "immissionpoint") {
          addImmissionPoint(gkPosition);
        } else if (selectedElementType === "esq") {
          addESQ(gkPosition);
        }
      }
    },
  });

  if (!position) return null;

  // Color coding for immission values
  const getImmissionColor = (value: number) => {
    if (value < 35) return "#22c55e"; // green
    if (value < 45) return "#84cc16"; // lime
    if (value < 55) return "#eab308"; // yellow
    if (value < 65) return "#f97316"; // orange
    return "#ef4444"; // red
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "10px",
        right: "10px",
        background: "rgba(255, 255, 255, 0.95)",
        padding: "12px",
        borderRadius: "5px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
        zIndex: 1000,
        fontSize: "12px",
        fontFamily: "monospace",
        minWidth: "200px",
      }}
    >
      <div style={{ marginBottom: "4px" }}>
        <strong>Pixel:</strong> ({position.pixel[0].toFixed(1)},{" "}
        {position.pixel[1].toFixed(1)})
      </div>
      {transform && (
        <>
          <div style={{ marginBottom: "4px" }}>
            <strong>GK:</strong> ({position.gk[0].toFixed(2)},{" "}
            {position.gk[1].toFixed(2)})
          </div>
          {position.terrainHeight !== null && (
            <div style={{ marginBottom: "4px" }}>
              <strong>Geländehöhe:</strong> {position.terrainHeight.toFixed(1)}{" "}
              m
            </div>
          )}
          {position.gridImmission !== null && (
            <div
              style={{
                padding: "4px",
                marginTop: "6px",
                borderRadius: "3px",
                backgroundColor:
                  getImmissionColor(position.gridImmission) + "20",
                border: `1px solid ${getImmissionColor(
                  position.gridImmission
                )}`,
              }}
            >
              <strong>
                {(() => {
                  const immissionGridDetailed =
                    store.immissionGridDetailed || [];
                  const contourDisplayMode =
                    store.contourDisplayMode || "total";

                  if (
                    immissionGridDetailed.length > 0 &&
                    contourDisplayMode !== "total"
                  ) {
                    switch (contourDisplayMode) {
                      case "esq":
                        return "Immission (ESQ only):";
                      case "trassen":
                        return "Immission (Trassen only):";
                      default:
                        return "Immission (Grid):";
                    }
                  }
                  return "Immission (Grid):";
                })()}
              </strong>
              <span
                style={{
                  marginLeft: "4px",
                  fontWeight: "bold",
                  color: getImmissionColor(position.gridImmission),
                }}
              >
                {position.gridImmission.toFixed(1)} dB(A)
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const createIcon = (color: string, isHighlighted?: boolean, isFocused?: boolean) => {
  const size = isFocused ? 18 : (isHighlighted ? 14 : 12);
  const borderWidth = isFocused ? 3 : 2;
  const iconTotalSize = size + borderWidth * 2;
  
  return L.divIcon({
    className: `custom-marker ${isFocused ? 'marker-focused' : ''} ${isHighlighted ? 'marker-highlighted' : ''}`,
    html: `<div style="
      background-color: ${color};
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      border: ${borderWidth}px solid ${isFocused ? '#ffff00' : 'white'};
      box-shadow: ${isFocused ? '0 0 10px 2px rgba(255,255,0,0.5), 0 2px 4px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.3)'};
      ${isFocused ? 'animation: pulse 1.5s ease-in-out infinite;' : ''}
    "></div>`,
    iconSize: [iconTotalSize, iconTotalSize],
    iconAnchor: [iconTotalSize / 2, iconTotalSize / 2],
  });
};

const createReferenceIcon = (label: string) => {
  return L.divIcon({
    className: "reference-marker",
    html: `<div style="
      background-color: #ff00ff;
      width: 20px;
      height: 20px;
      border-radius: 3px;
      border: 2px solid #000;
      box-shadow: 0 2px 6px rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 12px;
    ">${label}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const createMastIcon = (isHighlighted?: boolean, isFocused?: boolean) => {
  const size = isFocused ? 22 : (isHighlighted ? 18 : 16);
  const borderWidth = isFocused ? 3 : 2;
  const iconTotalSize = size + borderWidth * 2;
  const bgColor = isHighlighted ? '#D2691E' : '#8B4513';
  
  return L.divIcon({
    className: `mast-marker ${isFocused ? 'marker-focused' : ''} ${isHighlighted ? 'marker-highlighted' : ''}`,
    html: `<div style="
      background-color: ${bgColor};
      width: ${size}px;
      height: ${size}px;
      border-radius: 2px;
      border: ${borderWidth}px solid ${isFocused ? '#ffff00' : '#654321'};
      box-shadow: ${isFocused ? '0 0 10px 2px rgba(255,255,0,0.5), 0 2px 4px rgba(0,0,0,0.5)' : '0 2px 4px rgba(0,0,0,0.5)'};
      display: flex;
      align-items: center;
      justify-content: center;
      ${isFocused ? 'animation: pulse 1.5s ease-in-out infinite;' : ''}
    ">
      <div style="
        width: ${size * 0.5}px;
        height: ${size * 0.5}px;
        background-color: #fff;
        border-radius: 50%;
      "></div>
    </div>`,
    iconSize: [iconTotalSize, iconTotalSize],
    iconAnchor: [iconTotalSize / 2, iconTotalSize / 2],
  });
};

const createGridPointIcon = (value: number) => {
  // Color coding for immission values
  const getColor = (v: number) => {
    if (v < 35) return "#22c55e"; // green
    if (v < 45) return "#84cc16"; // lime
    if (v < 55) return "#eab308"; // yellow
    if (v < 65) return "#f97316"; // orange
    return "#ef4444"; // red
  };

  const color = getColor(value);

  return L.divIcon({
    className: "grid-point-marker",
    html: `<div style="
      background-color: ${color};
      width: 6px;
      height: 6px;
      border-radius: 50%;
      border: 1px solid rgba(0,0,0,0.3);
      box-shadow: 0 1px 2px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [8, 8],
    iconAnchor: [4, 4],
  });
};

export const LageplanMap: React.FC<LageplanMapProps> = ({
  imageWidth: propImageWidth,
  imageHeight: propImageHeight,
  onTransformUpdate,
  showTrassen: propShowTrassen = true,
  showDGM: propShowDGM = false,
  showContour: propShowContour = false,
  onDimensionsUpdate,
}) => {
  const {
    originalData,
    projectImage,
    imageWidth: storeImageWidth,
    imageHeight: storeImageHeight,
    referencePoints,
    hoehenpunkte,
    esqSources,
    immissionPoints,

    trassenNew,
    poles,
    dgmDreiecke,
    dgmKanten,
    immissionGrid,
    immissionGridSettings,
    showImmissionGrid,
    showGridPoints,
    showImmissionPoints,
    showESQPoints,
    showHoehenpunkte,
    showPoles,
    showReferencePoints,

    deleteHoehenpunkt,
    deleteESQ,
    deleteImmissionPoint,
    deletePole,
    getCachedImmissionValue,
    immissionGridDetailed,
    setContourDisplayMode,
    contourDisplayMode,
    
    // Marker selection state
    selectedMarkerType,
    focusedMarkerId,
    markerHighlightColors,
    setSelectedMarkerType,
    focusToNextMarker,
    focusToPreviousMarker,
    clearMarkerSelection,
  } = useProjectStore();

  // Use store dimensions if available, otherwise use props or defaults
  const imageWidth = storeImageWidth || propImageWidth || 893;
  const imageHeight = storeImageHeight || propImageHeight || 639;

  const { confirm } = useDialog();

  const projectData = originalData || ({} as UsedProjectData);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [actualDimensions, setActualDimensions] = useState({
    width: imageWidth,
    height: imageHeight,
  });
  const [scaledImageUrl, setScaledImageUrl] = useState<string | null>(null);
  const showDGM = propShowDGM;
  const showTrassen = propShowTrassen;
  const showContour = propShowContour;
  const [transform, setTransform] = useState<HelmertTransform | null>(null);
  const transformRef = useRef<HelmertTransform | null>(null);
  const [showPrintDialog, setShowPrintDialog] = useState(false);

  // Function to scale image to match IM_X_MAX/IM_Y_MAX dimensions
  const scaleImageToTargetDimensions = useCallback(
    (
      imageUrl: string,
      targetWidth: number,
      targetHeight: number
    ): Promise<string> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Could not get canvas context"));
            return;
          }

          canvas.width = targetWidth;
          canvas.height = targetHeight;

          // Draw the image scaled to exact target dimensions
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

          // Convert to data URL
          const scaledDataUrl = canvas.toDataURL("image/png");
          resolve(scaledDataUrl);
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = imageUrl;
      });
    },
    []
  );

  // Effect to scale the project image when it changes
  useEffect(() => {
    if (projectImage && imageWidth && imageHeight) {
      console.log("Scaling image to dimensions:", {
        imageWidth,
        imageHeight,
        projectImage: projectImage.substring(0, 50) + "...",
      });
      scaleImageToTargetDimensions(projectImage, imageWidth, imageHeight)
        .then((scaledUrl) => {
          console.log("Image scaling completed successfully");
          setScaledImageUrl(scaledUrl);
          setImageLoaded(true);
        })
        .catch((error) => {
          console.error("Failed to scale image:", error);
          // Fall back to using original image
          setScaledImageUrl(projectImage);
          setImageLoaded(true);
        });
    } else if (projectImage) {
      // If no dimensions specified, use original image
      setScaledImageUrl(projectImage);
      setImageLoaded(true);
    } else {
      setScaledImageUrl(null);
      setImageLoaded(false);
    }
  }, [projectImage, imageWidth, imageHeight, scaleImageToTargetDimensions]);

  useEffect(() => {
    // Use the dynamic dimensions from the store or props
    setActualDimensions({ width: imageWidth, height: imageHeight });
    onDimensionsUpdate?.({ width: imageWidth, height: imageHeight });
  }, [imageWidth, imageHeight, onDimensionsUpdate]);
  
  // Keyboard event handlers for marker selection and navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if the user is typing in an input field
      const target = e.target as HTMLElement;
      const isTyping = target && (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.contentEditable === 'true' ||
        target.isContentEditable
      );
      
      // If user is typing, don't intercept keyboard shortcuts
      if (isTyping) {
        return;
      }
      
      // Number keys for marker type selection
      if (e.key === '1') {
        setSelectedMarkerType('hoehenpunkt');
        e.preventDefault();
      } else if (e.key === '2') {
        setSelectedMarkerType('immissionpoint');
        e.preventDefault();
      } else if (e.key === '3') {
        setSelectedMarkerType('esq');
        e.preventDefault();
      } else if (e.key === '4') {
        setSelectedMarkerType('pole');
        e.preventDefault();
      }
      // Tab navigation - only when a marker type is selected
      else if (e.key === 'Tab' && selectedMarkerType) {
        e.preventDefault();
        if (e.shiftKey) {
          focusToPreviousMarker();
        } else {
          focusToNextMarker();
        }
      }
      // Escape to clear selection
      else if (e.key === 'Escape') {
        clearMarkerSelection();
        e.preventDefault();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [setSelectedMarkerType, focusToNextMarker, focusToPreviousMarker, clearMarkerSelection, selectedMarkerType]);

  useEffect(() => {
    // Only compute transform if we have valid dimensions
    if (actualDimensions.height === 0) return;

    // Try to use reference points from store first (supports any number of points)
    if (referencePoints.length >= 2) {
      const transformPoints = referencePoints.map((rp) => ({
        gkRechts: rp.gkRechts,
        gkHoch: rp.gkHoch,
        pixelX: rp.pixelX,
        pixelY: actualDimensions.height - rp.pixelY, // Convert to Leaflet coordinates
      }));

      const newTransform = new HelmertTransform(transformPoints);
      transformRef.current = newTransform;
      setTransform(newTransform);
      onTransformUpdate?.(newTransform);
    }
    // Fall back to project data if available (check for multiple points)
    else {
      console.log("Running in fallback mode");
      // Collect all available reference points from projectData
      const transformPoints = [];
      const refPointLetters = ["A", "B"] as const;

      for (const letter of refPointLetters) {
        const gkrKey = `GKR_${letter}` as const;
        const gkhKey = `GKH_${letter}` as const;
        const pxKey = `PX_${letter}` as const;
        const pyKey = `PY_${letter}` as const;

        if (
          projectData[gkrKey] !== undefined &&
          projectData[gkhKey] !== undefined &&
          projectData[pxKey] !== undefined &&
          projectData[pyKey] !== undefined
        ) {
          transformPoints.push({
            gkRechts: projectData[gkrKey],
            gkHoch: projectData[gkhKey],
            pixelX: projectData[pxKey],
            pixelY: actualDimensions.height - projectData[pyKey], // Convert to Leaflet coordinates
          });
        }
      }

      if (transformPoints.length >= 2) {
        const newTransform = new HelmertTransform(transformPoints);
        transformRef.current = newTransform;
        setTransform(newTransform);
        onTransformUpdate?.(newTransform);
      } else {
        // Clear transform when no reference points are available
        transformRef.current = null;
        setTransform(null);
        onTransformUpdate?.(null);
      }
    }
  }, [
    actualDimensions.height,
    referencePoints, // Use the stable key instead of the array
  ]);

  // Bounds: Using Leaflet's default Simple CRS where (0,0) is bottom-left
  const bounds: L.LatLngBoundsExpression = [
    [0, 0],
    [actualDimensions.height, actualDimensions.width],
  ];

  // Get icon colors based on selection state
  const getMarkerIcon = (type: 'hoehenpunkt' | 'immissionpoint' | 'esq', id: string) => {
    const isHighlighted = selectedMarkerType === type;
    const isFocused = focusedMarkerId === id;
    const colors = markerHighlightColors.get(type);
    
    if (!colors) {
      // Fallback colors
      const defaultColors = {
        hoehenpunkt: '#44ff44',
        immissionpoint: '#ff4444',
        esq: '#4444ff',
      };
      return createIcon(defaultColors[type], isHighlighted, isFocused);
    }
    
    const color = isFocused ? colors.focused : (isHighlighted ? colors.highlighted : colors.normal);
    return createIcon(color, isHighlighted, isFocused);
  };
  
  const getPoleIcon = (id: string) => {
    const isHighlighted = selectedMarkerType === 'pole';
    const isFocused = focusedMarkerId === id;
    return createMastIcon(isHighlighted, isFocused);
  };

  // Transform GK coordinates to Leaflet coordinates
  // Pixel space: (0,0) is top-left, x increases right, y increases down
  // Our CRS transformation handles the y-axis flip, so we just pass pixel coordinates
  const transformGKToLeaflet = (
    gkRechts: number,
    gkHoch: number
  ): [number, number] | null => {
    if (!transform) return null;
    const [px, py] = transform.gkToPixel(gkRechts, gkHoch);
    // Return [y, x] for Leaflet coordinates (lat, lng format)
    return [py, px];
  };

  return (
    <div
      id="map-container"
      style={{ height: "800px", width: "100%", position: "relative" }}
    >
      <MapPrintDialog
        isOpen={showPrintDialog}
        onClose={() => setShowPrintDialog(false)}
        contourInfo={{
          showImmissionGrid: showImmissionGrid,
          displayMode: contourDisplayMode || "total",
          hasDetailedData:
            (immissionGridDetailed && immissionGridDetailed.length > 0) ||
            false,
        }}
      />

      {/* Print Button */}
      {scaledImageUrl && (
        <Button
          onClick={() => setShowPrintDialog(true)}
          className="absolute top-24 left-4 z-[1000] shadow-md print-hide bg-white"
          title="Karte drucken"
        >
          <Printer className="h-5 w-5" color="black" />
        </Button>
      )}

      {/* Contour Display Mode Controls */}
      {scaledImageUrl &&
        showImmissionGrid &&
        Array.isArray(immissionGridDetailed) &&
        immissionGridDetailed.length > 0 && (
          <div className="absolute top-36 left-4 z-[1000] shadow-md print-hide bg-white rounded-md p-2">
            <div className="text-xs font-medium mb-1 text-gray-700">
              Contour Display:
            </div>
            <div className="flex flex-col space-y-1">
              <Button
                onClick={() => setContourDisplayMode("total")}
                variant={contourDisplayMode === "total" ? "default" : "outline"}
                size="sm"
                className="text-xs h-8"
                title="Show total immission (ESQ + Transmission Lines)"
              >
                Total
              </Button>
              <Button
                onClick={() => setContourDisplayMode("esq")}
                variant={contourDisplayMode === "esq" ? "default" : "outline"}
                size="sm"
                className="text-xs h-8"
                title="Show ESQ sources only"
              >
                ESQ
              </Button>
              <Button
                onClick={() => setContourDisplayMode("trassen")}
                variant={
                  contourDisplayMode === "trassen" ? "default" : "outline"
                }
                size="sm"
                className="text-xs h-8"
                title="Show transmission lines only"
              >
                Trassen
              </Button>
            </div>
          </div>
        )}

      {!scaledImageUrl && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            padding: "20px",
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            borderRadius: "10px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            zIndex: 1000,
            maxWidth: "400px",
          }}
        >
          <h2
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              marginBottom: "15px",
              color: "#333",
            }}
          >
            Kein Projekt geladen
          </h2>
          <p
            style={{
              fontSize: "14px",
              color: "#666",
              marginBottom: "20px",
            }}
          >
            Bitte verwenden Sie die Menüleiste, um:
          </p>
          <ul
            style={{
              textAlign: "left",
              fontSize: "14px",
              color: "#666",
              paddingLeft: "20px",
            }}
          >
            <li>Ein neues Projekt zu erstellen</li>
            <li>Ein gespeichertes Projekt zu öffnen</li>
          </ul>
        </div>
      )}

      {imageLoaded && (
        <MapContainer
          crs={L.CRS.Simple}
          bounds={bounds}
          style={{ height: "100%", width: "100%" }}
          minZoom={-10}
          maxZoom={10}
        >
          {/* <MapUpdater bounds={bounds} onMapRef={(map) => { mapRef.current = map; }} /> */}
          <CoordinateDisplay
            transform={transform}
            imageHeight={actualDimensions.height}
            imageWidth={actualDimensions.width}
          />
          <ReferencePointCalibrationHandler
            imageHeight={actualDimensions.height}
          />
          {transform && (
            <>
              <LeafletContextMenu
                transform={transform}
                imageHeight={actualDimensions.height}
              />
              <MapScaleControl transform={transform} position="bottomleft" />
            </>
          )}
          {scaledImageUrl && (
            <ImageOverlay url={scaledImageUrl} bounds={bounds} />
          )}

          {/* Contour Overlay */}
          {showContour && (
            <ContourOverlay
              width={actualDimensions.width}
              height={actualDimensions.height}
              dgmDreiecke={dgmDreiecke}
              transform={transform}
              gridSize={25}
              thresholds={15}
              opacity={0.5}
            />
          )}

          {/* Immission Grid Overlay */}
          {showImmissionGrid && immissionGrid.length > 0 && (
            <ImmissionGridOverlay
              width={actualDimensions.width}
              height={actualDimensions.height}
              transform={transform}
              gridValues={immissionGrid}
              gridValuesDetailed={immissionGridDetailed}
              displayMode={contourDisplayMode}
              opacity={immissionGridSettings.opacity}
              thresholds={15}
            />
          )}

          {/* Grid Points Visualization */}
          {showGridPoints &&
            immissionGrid.length > 0 &&
            immissionGrid.map((point, index) => {
              // Convert pixel coordinates to Leaflet coordinates
              const leafletY = point.y; // y is already in Leaflet coordinates
              const leafletX = point.x;

              return (
                <Marker
                  key={`grid-point-${index}`}
                  position={[leafletY, leafletX]}
                  icon={createGridPointIcon(point.value)}
                  eventHandlers={{
                    click: (e) => {
                      // Prevent click propagation to avoid adding new elements
                      L.DomEvent.stopPropagation(e);
                    },
                  }}
                >
                  <Popup>
                    <div style={{ fontSize: "12px" }}>
                      <strong>Gitterpunkt #{index + 1}</strong>
                      <br />
                      <hr style={{ margin: "5px 0" }} />
                      <strong>Immissionswert:</strong>
                      <span
                        style={{
                          marginLeft: "4px",
                          fontWeight: "bold",
                          color:
                            point.value < 35
                              ? "#22c55e"
                              : point.value < 45
                              ? "#84cc16"
                              : point.value < 55
                              ? "#eab308"
                              : point.value < 65
                              ? "#f97316"
                              : "#ef4444",
                        }}
                      >
                        {point.value.toFixed(2)} dB(A)
                      </span>
                      <br />
                      <strong>Position:</strong>
                      <br />
                      Pixel: ({point.x.toFixed(1)},{" "}
                      {(actualDimensions.height - point.y).toFixed(1)})
                    </div>
                  </Popup>
                </Marker>
              );
            })}

          {/* Reference Points from Store */}
          {showReferencePoints && referencePoints.map((refPoint) => (
            <Marker
              key={refPoint.id}
              position={[
                actualDimensions.height - refPoint.pixelY,
                refPoint.pixelX,
              ]}
              icon={createReferenceIcon(refPoint.label)}
            >
              <Popup>
                <div>
                  <strong>Referenzpunkt {refPoint.label}</strong>
                  <br />
                  Pixel: ({refPoint.pixelX}, {refPoint.pixelY})<br />
                  GK Rechts: {refPoint.gkRechts.toFixed(2)}
                  <br />
                  GK Hoch: {refPoint.gkHoch.toFixed(2)}
                </div>
              </Popup>
            </Marker>
          ))}

          {/* {!referencePoints.length && projectData.PX_A !== undefined && projectData.PY_A !== undefined && (
            <Marker
              position={[actualDimensions.height - projectData.PY_A, projectData.PX_A]}
              icon={createReferenceIcon('A')}
            >
              <Popup>
                <div>
                  <strong>Reference Point A</strong><br />
                  Pixel (original): ({projectData.PX_A}, {projectData.PY_A})<br />
                  GK Rechts: {projectData.GKR_A?.toFixed(2)}<br />
                  GK Hoch: {projectData.GKH_A?.toFixed(2)}
                </div>
              </Popup>
            </Marker>
          )}
           */}
          {/* {!referencePoints.length && projectData.PX_B !== undefined && projectData.PY_B !== undefined && (
            <Marker
              position={[actualDimensions.height - projectData.PY_B, projectData.PX_B]}
              icon={createReferenceIcon('B')}
            >
              <Popup>
                <div>
                  <strong>Reference Point B</strong><br />
                  Pixel (original): ({projectData.PX_B}, {projectData.PY_B})<br />
                  GK Rechts: {projectData.GKR_B?.toFixed(2)}<br />
                  GK Hoch: {projectData.GKH_B?.toFixed(2)}
                </div>
              </Popup>
            </Marker>
          )} */}

          {showImmissionPoints && Array.from(immissionPoints.entries()).map(([id, point]) => {
            const coords = transformGKToLeaflet(
              point.Position.GK.Rechts,
              point.Position.GK.Hoch
            );
            if (!coords) return null;

            return (
              <MarkerWithContextMenu
                key={`immission-${id}`}
                id={id}
                type="immissionpoint"
                position={coords}
                icon={getMarkerIcon('immissionpoint', id)}
                onDelete={async () => {
                  const confirmed = await confirm("Immissionspunkt löschen?");
                  if (confirmed) {
                    deleteImmissionPoint(id);
                  }
                }}
                popupContent={
                  <div>
                    <strong>Immissionspunkt: {point.Name}</strong>
                    <br />
                    <hr style={{ margin: "5px 0" }} />
                    <strong>Berechneter Wert:</strong>
                    <br />
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: "bold",
                        color: "#d9534f",
                        backgroundColor: "#f9f2f4",
                        padding: "2px 6px",
                        borderRadius: "3px",
                        border: "1px solid #ebccd1",
                      }}
                    >
                      {getCachedImmissionValue(id).toFixed(2)} dB(A)
                    </span>
                    <br />
                    <hr style={{ margin: "5px 0" }} />
                    <strong>Pixel Koordinaten:</strong>
                    <br />
                    X: {coords[1].toFixed(1)}, Y: {coords[0].toFixed(1)}
                    <br />
                    <strong>GK Koordinaten:</strong>
                    <br />
                    Rechts: {point.Position.GK.Rechts.toFixed(2)}
                    <br />
                    Hoch: {point.Position.GK.Hoch.toFixed(2)}
                    <br />
                    <hr style={{ margin: "5px 0" }} />
                    Höhe: {point.Position.z.toFixed(2)} m<br />
                    Höhenoffset: {point.HeightOffset} m
                  </div>
                }
              />
            );
          })}

          {showESQPoints && Array.from(esqSources.entries()).map(([id, source]) => {
            const coords = transformGKToLeaflet(
              source.Position.GK.Rechts,
              source.Position.GK.Hoch
            );
            if (!coords) return null;

            return (
              <MarkerWithContextMenu
                key={`esq-${id}`}
                id={id}
                type="esq"
                position={coords}
                icon={getMarkerIcon('esq', id)}
                onDelete={async () => {
                  const confirmed = await confirm("ESQ löschen?");
                  if (confirmed) {
                    deleteESQ(id);
                  }
                }}
                popupContent={
                  <div>
                    <strong>ESQ: {source.Bezeichnung}</strong>
                    <br />
                    <hr style={{ margin: "5px 0" }} />
                    <strong>Pixel Koordinaten:</strong>
                    <br />
                    X: {coords[1].toFixed(1)}, Y: {coords[0].toFixed(1)}
                    <br />
                    <strong>GK Koordinaten:</strong>
                    <br />
                    Rechts: {source.Position.GK.Rechts.toFixed(2)}
                    <br />
                    Hoch: {source.Position.GK.Hoch.toFixed(2)}
                    <br />Z (Gelände): {source.Position.z.toFixed(2)} m<br />
                    <hr style={{ margin: "5px 0" }} />
                    Höhe über Grund: {source.Hoehe.toFixed(2)} m<br />
                    Gesamthöhe: {(source.Position.z + source.Hoehe).toFixed(
                      2
                    )}{" "}
                    m<br />
                    Schallleistungspegel: {source.L} dB
                  </div>
                }
              />
            );
          })}

          {showHoehenpunkte && Array.from(hoehenpunkte.entries()).map(([id, punkt]) => {
            const coords = transformGKToLeaflet(
              punkt.GK_Vektor.GK.Rechts,
              punkt.GK_Vektor.GK.Hoch
            );
            if (!coords) return null;

            return (
              <MarkerWithContextMenu
                key={`hoehe-${id}`}
                id={id}
                type="hoehenpunkt"
                position={coords}
                icon={getMarkerIcon('hoehenpunkt', id)}
                onDelete={async () => {
                  const confirmed = await confirm("Höhenpunkt löschen?");
                  if (confirmed) {
                    deleteHoehenpunkt(id);
                  }
                }}
                popupContent={
                  <div>
                    <strong>Höhenpunkt</strong>
                    <br />
                    <hr style={{ margin: "5px 0" }} />
                    <strong>Pixel Koordinaten:</strong>
                    <br />
                    X: {coords[1].toFixed(1)}, Y: {coords[0].toFixed(1)}
                    <br />
                    <strong>GK Koordinaten:</strong>
                    <br />
                    Rechts: {punkt.GK_Vektor.GK.Rechts.toFixed(2)}
                    <br />
                    Hoch: {punkt.GK_Vektor.GK.Hoch.toFixed(2)}
                    <br />
                    <hr style={{ margin: "5px 0" }} />
                    Höhe: {punkt.GK_Vektor.z.toFixed(2)} m
                  </div>
                }
              />
            );
          })}

          {/* Trassen with Poles and Power Lines */}
          {showTrassen &&
            Array.from(trassenNew.entries()).map(([trasseId, trasseNew]) => {
              // Get all poles for this trasse
              const trassePoles = trasseNew.poleIds
                .map((poleId) => poles.get(poleId))
                .filter(Boolean) as Array<ReturnType<typeof poles.get>>;

              return (
                <React.Fragment key={`trasse-${trasseId}`}>
                  {/* Render Poles */}
                  {showPoles && trassePoles.map((pole, poleIndex) => {
                    if (!pole) return null;
                    const position = pole.position;
                    if (!position) return null;

                    const coords = transformGKToLeaflet(
                      position.GK.Rechts,
                      position.GK.Hoch
                    );
                    if (!coords) return null;

                    return (
                      <MarkerWithContextMenu
                        key={`pole-${pole.id}`}
                        id={pole.id}
                        type="pole"
                        position={coords}
                        icon={getPoleIcon(pole.id)}
                        onDelete={async () => {
                          const confirmed = await confirm(
                            `Mast "${pole.name}" löschen?`
                          );
                          if (confirmed) {
                            deletePole(pole.id);
                          }
                        }}
                        popupContent={
                          <div>
                            <strong>
                              Mast {trasseNew.name} #{poleIndex + 1}
                            </strong>
                            <br />
                            {pole.name !== "No Name" && (
                              <>
                                Name: {pole.name}
                                <br />
                              </>
                            )}
                            <hr style={{ margin: "5px 0" }} />
                            <strong>Position:</strong>
                            <br />
                            GK Rechts: {position.GK.Rechts.toFixed(2)}
                            <br />
                            GK Hoch: {position.GK.Hoch.toFixed(2)}

                            <hr style={{ margin: "5px 0" }} />
                            Nullpunkt Höhe: {pole.nullpunktHeight.toFixed(2)} m
                            <br />
                            Mast Höhe: {pole.poleHeight.toFixed(2)} m<br />
                            Mastspitze:{" "}
                            {(
                              pole.nullpunktHeight +
                              pole.poleHeight
                            ).toFixed(2)}{" "}
                            m<br />
                            Ebenen: {pole.levels?.length || 0}
                          </div>
                        }
                      />
                    );
                  })}

                  {/* Render simple connecting line between consecutive poles */}
                  {trassePoles.map((pole, poleIndex) => {
                    if (poleIndex === trassePoles.length - 1) return null; // Skip last pole as it has no next connection
                    const nextPole = trassePoles[poleIndex + 1];
                    const currPosition = pole?.position;
                    const nextPosition = nextPole?.position;

                    if (!currPosition || !nextPosition) return null;

                    const currCoords = transformGKToLeaflet(
                      currPosition.GK.Rechts,
                      currPosition.GK.Hoch
                    );
                    const nextCoords = transformGKToLeaflet(
                      nextPosition.GK.Rechts,
                      nextPosition.GK.Hoch
                    );

                    if (!currCoords || !nextCoords) return null;

                    // Draw a simple line between consecutive poles with context menu
                    return (
                      <PowerLineWithContextMenu
                        key={`line-${trasseId}-${poleIndex}`}
                        mastId={pole.id}
                        nextMastId={nextPole.id}
                        mastName={pole.name}
                        nextMastName={nextPole.name}
                        trasseName={trasseNew.name}
                        mastIndex={poleIndex}
                        positions={[currCoords, nextCoords]}
                      />
                    );
                  })}
                </React.Fragment>
              );
            })}

          {/* DGM Dreiecke (Triangles) */}
          {showDGM &&
            dgmDreiecke?.map((dreieck, index) => {
              // Get coordinates for each corner of the triangle
              const pointA = dreieck.A?.HP?.GK_Vektor;
              const pointB = dreieck.B?.HP?.GK_Vektor;
              const pointC = dreieck.C?.HP?.GK_Vektor;

              if (!pointA || !pointB || !pointC) return null;

              const coordsA = transformGKToLeaflet(
                pointA.GK.Rechts,
                pointA.GK.Hoch
              );
              const coordsB = transformGKToLeaflet(
                pointB.GK.Rechts,
                pointB.GK.Hoch
              );
              const coordsC = transformGKToLeaflet(
                pointC.GK.Rechts,
                pointC.GK.Hoch
              );

              if (!coordsA || !coordsB || !coordsC) return null;

              const positions: L.LatLngExpression[] = [
                coordsA,
                coordsB,
                coordsC,
              ];

              return (
                <Polygon
                  key={`dreieck-${index}`}
                  positions={positions}
                  pathOptions={{
                    color: "#0088cc",
                    weight: 1,
                    opacity: 0.6,
                    fillColor: "#0088cc",
                    fillOpacity: 0.1,
                  }}
                >
                  <Popup>
                    <div>
                      <strong>DGM Dreieck #{dreieck.LfdNummer}</strong>
                      <br />
                      <hr style={{ margin: "5px 0" }} />
                      Punkt A: Höhe {pointA.z.toFixed(2)} m<br />
                      Punkt B: Höhe {pointB.z.toFixed(2)} m<br />
                      Punkt C: Höhe {pointC.z.toFixed(2)} m
                    </div>
                  </Popup>
                </Polygon>
              );
            })}

          {/* DGM Kanten (Edges) */}
          {showDGM &&
            dgmKanten?.map((kante, index) => {
              const eckeA = kante.EckeA?.HP?.GK_Vektor;
              const eckeB = kante.EckeB?.HP?.GK_Vektor;

              if (!eckeA || !eckeB) return null;

              const coordsA = transformGKToLeaflet(
                eckeA.GK.Rechts,
                eckeA.GK.Hoch
              );
              const coordsB = transformGKToLeaflet(
                eckeB.GK.Rechts,
                eckeB.GK.Hoch
              );

              if (!coordsA || !coordsB) return null;

              const positions: L.LatLngExpression[] = [coordsA, coordsB];

              return (
                <Polyline
                  key={`kante-${index}`}
                  positions={positions}
                  pathOptions={{
                    color: "#004466",
                    weight: 2,
                    opacity: 0.8,
                    dashArray: "5, 5",
                  }}
                >
                  <Popup>
                    <div>
                      <strong>DGM Kante</strong>
                      <br />
                      <hr style={{ margin: "5px 0" }} />
                      Dreieck A: #{kante.DreieckA}
                      <br />
                      Dreieck B: #{kante.DreieckB}
                      <br />
                      Höhe A: {eckeA.z.toFixed(2)} m<br />
                      Höhe B: {eckeB.z.toFixed(2)} m
                    </div>
                  </Popup>
                </Polyline>
              );
            })}
        </MapContainer>
      )}
    </div>
  );
};
