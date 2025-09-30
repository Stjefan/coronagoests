import React, { useMemo, useEffect, useRef } from 'react';
import { contours } from 'd3-contour';
import { scaleSequential } from 'd3-scale';
import { geoPath, geoTransform } from 'd3-geo';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { createRoot, type Root } from 'react-dom/client';
import type { UsedDGMDreieck } from '../types/usedData';
import { HelmertTransform } from '../utils/helmertTransform';
import { D3Legend } from './D3Legend';
import { useProjectStore } from '../store/projectStore';
import { getColorSchemeByName } from './dialogs/ColorPaletteDialog';

interface ContourOverlayProps {
  width: number;
  height: number;
  dgmDreiecke: UsedDGMDreieck[] | undefined;
  transform: HelmertTransform | null;
  gridSize?: number;
  thresholds?: number;
  opacity?: number;
}

/**
 * Find which triangle contains a point and interpolate height using barycentric coordinates
 */
function getHeightAtPoint(
  px: number, 
  py: number, 
  triangles: UsedDGMDreieck[],
  transform: HelmertTransform
): number | null {
  // Convert pixel to GK coordinates
  const [gkRechts, gkHoch] = transform.pixelToGK(px, py);
  
  // Check each triangle
  for (const triangle of triangles) {
    const pointA = triangle.A?.HP?.GK_Vektor;
    const pointB = triangle.B?.HP?.GK_Vektor;
    const pointC = triangle.C?.HP?.GK_Vektor;
    
    if (!pointA || !pointB || !pointC) continue;
    
    // Check if point is inside triangle using barycentric coordinates
    const ax = pointA.GK.Rechts;
    const ay = pointA.GK.Hoch;
    const bx = pointB.GK.Rechts;
    const by = pointB.GK.Hoch;
    const cx = pointC.GK.Rechts;
    const cy = pointC.GK.Hoch;
    
    // Calculate barycentric coordinates
    const v0x = cx - ax;
    const v0y = cy - ay;
    const v1x = bx - ax;
    const v1y = by - ay;
    const v2x = gkRechts - ax;
    const v2y = gkHoch - ay;
    
    const dot00 = v0x * v0x + v0y * v0y;
    const dot01 = v0x * v1x + v0y * v1y;
    const dot02 = v0x * v2x + v0y * v2y;
    const dot11 = v1x * v1x + v1y * v1y;
    const dot12 = v1x * v2x + v1y * v2y;
    
    const invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
    const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
    const v = (dot00 * dot12 - dot01 * dot02) * invDenom;
    
    // Check if point is inside triangle
    if (u >= 0 && v >= 0 && u + v <= 1) {
      // Interpolate height using barycentric coordinates
      const w = 1 - u - v;
      const height = w * pointA.z + u * pointC.z + v * pointB.z;
      return height;
    }
  }
  
  return null;
}

export const ContourOverlay: React.FC<ContourOverlayProps> = ({
  width,
  height,
  dgmDreiecke,
  transform,
  gridSize = 25,
  thresholds = 15,
  opacity = 0.5
}) => {
  const map = useMap();
  const svgOverlayRef = useRef<L.SVGOverlay | null>(null);
  const legendContainerRef = useRef<HTMLDivElement | null>(null);
  const legendRootRef = useRef<Root | null>(null);
  const { colorPalettes } = useProjectStore();
  const colorScheme = getColorSchemeByName('dgm', colorPalettes.dgm);
  
  const { contourSVG, minHeight, maxHeight } = useMemo(() => {
    if (!dgmDreiecke || dgmDreiecke.length === 0 || !transform) {
      console.log('No DTM data or transform available');
      return { contourSVG: null, minHeight: 0, maxHeight: 0 };
    }
    
    console.log(`Generating contour grid: ${width}x${height}, gridSize: ${gridSize}`);
    
    // Create grid of sample points
    const gridWidth = Math.ceil(width / gridSize);
    const gridHeight = Math.ceil(height / gridSize);
    const values: number[] = new Array(gridWidth * gridHeight);
    
    let validPoints = 0;
    let minHeight = Infinity;
    let maxHeight = -Infinity;
    
    // For each grid point, extract height from DTM
    for (let gy = 0; gy < gridHeight; gy++) {
      for (let gx = 0; gx < gridWidth; gx++) {
        const px = gx * gridSize;
        const py = gy * gridSize;
        
        // Note: Leaflet uses bottom-left origin, so we need to flip Y
        const leafletY = height - py;
        
        // Get height at this point from DTM
        const heightValue = getHeightAtPoint(px, leafletY, dgmDreiecke, transform);
        
        const index = gy * gridWidth + gx;
        if (heightValue !== null) {
          values[index] = heightValue;
          validPoints++;
          minHeight = Math.min(minHeight, heightValue);
          maxHeight = Math.max(maxHeight, heightValue);
        } else {
          values[index] = NaN; // Mark as no data
        }
      }
    }
    
    console.log(`Extracted heights at ${validPoints} grid points`);
    console.log(`Height range: ${minHeight.toFixed(2)} to ${maxHeight.toFixed(2)}`);
    
    if (validPoints === 0) {
      console.warn('No valid height points found in DTM');
      return { contourSVG: null, minHeight: 0, maxHeight: 0 };
    }
    
    // Generate contours using d3-contour
    const contourGenerator = contours()
      .size([gridWidth, gridHeight])
      .thresholds(thresholds)
      .smooth(true);
    
    // Replace NaN with a value below minimum for contouring
    const filledValues = values.map(v => isNaN(v) ? minHeight - 1 : v);
    
    const contourLines = contourGenerator(filledValues);
    
    // Create color scale
    const colorScale = scaleSequential(colorScheme)
      .domain([minHeight, maxHeight]);
    
    // Create path generator that scales from grid to pixel coordinates
    const pathTransform = geoTransform({
      point: function(x, y) {
        this.stream.point(x * gridSize, y * gridSize);
      }
    });
    
    const pathGenerator = geoPath().projection(pathTransform);
    
    // Create SVG element
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.style.width = '100%';
    svg.style.height = '100%';
    
    // Create group for contours
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('opacity', opacity.toString());
    
    // Add contour paths
    contourLines.forEach((contour) => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const d = pathGenerator(contour);
      if (d) {
        path.setAttribute('d', d);
        path.setAttribute('fill', colorScale(contour.value));
        path.setAttribute('fill-opacity', '0.4');
        path.setAttribute('stroke', colorScale(contour.value));
        path.setAttribute('stroke-width', '1');
        path.setAttribute('stroke-opacity', '0.8');
      }
      g.appendChild(path);
    });
    
    svg.appendChild(g);
    console.log(`Generated ${contourLines.length} contour lines`);
    
    return { contourSVG: svg, minHeight, maxHeight };
  }, [width, height, dgmDreiecke, transform, gridSize, thresholds, opacity, colorScheme]);
  
  // Effect for managing the SVG overlay
  useEffect(() => {
    if (!contourSVG || !map) return;
    
    // Remove previous overlay if it exists
    if (svgOverlayRef.current) {
      map.removeLayer(svgOverlayRef.current);
    }
    
    // Create bounds matching the image
    const bounds: L.LatLngBoundsExpression = [[0, 0], [height, width]];
    
    // Create SVG overlay fixed to image bounds
    const svgOverlay = L.svgOverlay(contourSVG.cloneNode(true) as SVGElement, bounds, {
      interactive: false,
      zIndex: 400
    });
    
    svgOverlay.addTo(map);
    svgOverlayRef.current = svgOverlay;
    
    // Cleanup
    return () => {
      if (svgOverlayRef.current) {
        map.removeLayer(svgOverlayRef.current);
        svgOverlayRef.current = null;
      }
    };
  }, [contourSVG, map, height, width]);

  // Effect for managing the D3 legend
  useEffect(() => {
    console.log('ContourOverlay Legend effect:', { 
      hasMap: !!map, 
      minHeight: minHeight.toFixed(2), 
      maxHeight: maxHeight.toFixed(2), 
      hasContourSVG: !!contourSVG,
      isValidRange: minHeight !== maxHeight && !isNaN(minHeight) && !isNaN(maxHeight)
    });
    
    if (!map || !contourSVG || minHeight === maxHeight || isNaN(minHeight) || isNaN(maxHeight)) {
      // Clean up if legend should not be shown
      if (legendRootRef.current) {
        const root = legendRootRef.current;
        legendRootRef.current = null;
        setTimeout(() => root.unmount(), 0);
      }
      if (legendContainerRef.current) {
        legendContainerRef.current.remove();
        legendContainerRef.current = null;
      }
      return;
    }
    
    console.log('Creating ContourOverlay legend with height range:', minHeight.toFixed(2), 'to', maxHeight.toFixed(2), 'm');
    
    // Create or update legend container
    if (!legendContainerRef.current) {
      const container = document.createElement('div');
      container.className = 'contour-legend-container';
      container.style.position = 'absolute';
      container.style.bottom = '10px';
      container.style.left = '10px';
      container.style.zIndex = '1000';
      container.style.pointerEvents = 'none';
      
      // Add to map container
      const mapContainer = map.getContainer();
      mapContainer.appendChild(container);
      legendContainerRef.current = container;
      
      // Create React root for the container
      legendRootRef.current = createRoot(container);
    }
    
    // Render D3Legend into the container
    if (legendRootRef.current) {
      console.log('Rendering ContourOverlay D3Legend component');
      legendRootRef.current.render(
        <D3Legend
          minValue={minHeight}
          maxValue={maxHeight}
          colorScheme={colorScheme}
          title="Höhe"
          unit=" m"
          position="bottomleft"
          width={120}
          height={220}
        />
      );
    }
    
    // Cleanup
    return () => {
      console.log('Cleaning up ContourOverlay legend');
      if (legendRootRef.current) {
        const root = legendRootRef.current;
        legendRootRef.current = null;
        setTimeout(() => root.unmount(), 0);
      }
      if (legendContainerRef.current) {
        legendContainerRef.current.remove();
        legendContainerRef.current = null;
      }
    };
  }, [map, minHeight, maxHeight, colorScheme, contourSVG]);
  
  return null; // This component doesn't render anything directly
};