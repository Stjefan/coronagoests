import React, { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import { HelmertTransform } from '../utils/helmertTransform';

interface MapScaleControlProps {
  transform: HelmertTransform | null;
  position?: 'bottomleft' | 'bottomright' | 'topleft' | 'topright';
}

export const MapScaleControl: React.FC<MapScaleControlProps> = ({ 
  transform, 
  position = 'bottomleft' 
}) => {
  const map = useMap();
  const [scaleInfo, setScaleInfo] = useState<{
    width: number;
    label: string;
  } | null>(null);

  useEffect(() => {
    if (!transform) {
      setScaleInfo(null);
      return;
    }

    const updateScale = () => {
      
      // Get the map container width
      const containerWidth = map.getContainer().offsetWidth;
      
      // Calculate the maximum scale bar width (typically 100-200 pixels)
      const maxScaleBarWidth = Math.min(200, containerWidth / 4);
      
      // Get two points at the center latitude, separated horizontally
      const leftPoint = map.containerPointToLatLng([0, map.getContainer().offsetHeight / 2]);
      const rightPoint = map.containerPointToLatLng([maxScaleBarWidth, map.getContainer().offsetHeight / 2]);
      
      // Convert to GK coordinates
      const [gkLeft_rechts, gkLeft_hoch] = transform.pixelToGK(leftPoint.lng, leftPoint.lat);
      const [gkRight_rechts, gkRight_hoch] = transform.pixelToGK(rightPoint.lng, rightPoint.lat);
      
      // Calculate the distance in meters (GK coordinates are in meters)
      const distanceMeters = Math.sqrt(
        Math.pow(gkRight_rechts - gkLeft_rechts, 2) + 
        Math.pow(gkRight_hoch - gkLeft_hoch, 2)
      );
      
      // Find a nice round number for the scale
      const scales = [
        1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 
        1000, 2000, 2500, 5000, 10000, 20000, 25000, 50000, 100000
      ];
      
      let scaleDistance = scales[0];
      for (const scale of scales) {
        if (scale <= distanceMeters) {
          scaleDistance = scale;
        } else {
          break;
        }
      }
      
      // Calculate the pixel width for this scale distance
      const scaleWidth = (scaleDistance / distanceMeters) * maxScaleBarWidth;
      
      // Format the label
      let label: string;
      if (scaleDistance >= 1000) {
        label = `${scaleDistance / 1000} km`;
      } else {
        label = `${scaleDistance} m`;
      }
      
      setScaleInfo({
        width: Math.round(scaleWidth),
        label
      });
    };

    // Update scale on map events
    map.on('zoomend', updateScale);
    map.on('moveend', updateScale);
    
    // Initial update
    updateScale();

    // Cleanup
    return () => {
      map.off('zoomend', updateScale);
      map.off('moveend', updateScale);
    };
  }, [map, transform]);

  if (!scaleInfo || !transform) {
    return null;
  }

  const positionStyles: Record<string, React.CSSProperties> = {
    bottomleft: { bottom: '10px', left: '10px' },
    bottomright: { bottom: '10px', right: '10px' },
    topleft: { top: '10px', left: '10px' },
    topright: { top: '10px', right: '10px' }
  };

  return (
    <div
      className="leaflet-control-scale leaflet-control"
      style={{
        position: 'absolute',
        ...positionStyles[position],
        zIndex: 1000,
        background: 'rgba(255, 255, 255, 0.8)',
        padding: '5px 10px',
        borderRadius: '4px',
        boxShadow: '0 1px 5px rgba(0,0,0,0.4)',
        fontSize: '11px',
        lineHeight: '1.5'
      }}
    >
      <div style={{ marginBottom: '2px', fontWeight: 'bold', color: '#333' }}>
        GK Koordinatensystem
      </div>
      <div style={{ position: 'relative' }}>
        <div
          style={{
            width: `${scaleInfo.width}px`,
            height: '4px',
            border: '1px solid #333',
            borderTop: 'none',
            background: 'white',
            position: 'relative'
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: '0',
              top: '-1px',
              width: '1px',
              height: '6px',
              background: '#333'
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: '0',
              top: '-1px',
              width: '1px',
              height: '6px',
              background: '#333'
            }}
          />
        </div>
        <div
          style={{
            marginTop: '2px',
            textAlign: 'center',
            color: '#333',
            fontWeight: 'bold'
          }}
        >
          {scaleInfo.label}
        </div>
      </div>
    </div>
  );
};