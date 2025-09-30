import React, { useMemo, useEffect, useRef } from 'react';
import { contours } from 'd3-contour';
import { scaleSequential } from 'd3-scale';
import { geoPath, geoTransform, type GeoPermissibleObjects } from 'd3-geo';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { createRoot, type Root } from 'react-dom/client';
import { HelmertTransform } from '../utils/helmertTransform';
import Delaunator from 'delaunator';
import { D3Legend } from './D3Legend';
import { useProjectStore, type ContourDisplayMode } from '../store/projectStore';
import { getColorSchemeByName } from './dialogs/ColorPaletteDialog';

interface ImmissionGridOverlayProps {
  width: number;
  height: number;
  transform: HelmertTransform | null;
  gridValues: Array<{ x: number; y: number; value: number }>;
  gridValuesDetailed?: Array<{ x: number; y: number; total: number; esq: number; trassen: number }>;
  displayMode?: ContourDisplayMode;
  opacity?: number;
  thresholds?: number;
}

export const ImmissionGridOverlay: React.FC<ImmissionGridOverlayProps> = ({
  width,
  height,
  transform,
  gridValues,
  gridValuesDetailed,
  displayMode = 'total',
  opacity = 0.6,
  thresholds = [5]
}) => {
  const map = useMap();
  const svgOverlayRef = useRef<L.SVGOverlay | null>(null);
  const legendContainerRef = useRef<HTMLDivElement | null>(null);
  const legendRootRef = useRef<Root | null>(null);
  const { colorPalettes, immissionGridSettings } = useProjectStore();
  const colorScheme = getColorSchemeByName('immission', colorPalettes.immissionGrid);
  
  const { contourSVG, minValue, maxValue, legendMin, legendMax } = useMemo(() => {
    // Determine which data to use based on display mode
    const useDetailedData = displayMode !== 'total' && gridValuesDetailed && gridValuesDetailed.length > 0;
    const dataToUse = useDetailedData ? gridValuesDetailed : gridValues;
    
    if (!dataToUse || dataToUse.length === 0 || !transform) {
      console.log('No grid values or transform available');
      return { contourSVG: null, minValue: 0, maxValue: 0, legendMin: 0, legendMax: 0 };
    }
    
    console.log(`Generating immission grid contours (${displayMode} mode): ${width}x${height}, ${dataToUse.length} points`);
    
    // Helper function to extract value based on display mode
    const getValue = (point: { total?: number; esq?: number; trassen?: number; value?: number }): number => {
      if (useDetailedData) {
        switch (displayMode) {
          case 'esq': return point.esq || 0;
          case 'trassen': return point.trassen || 0;
          default: return point.total || 0;
        }
      }
      return point.value || 0;
    };
    
    // Find grid dimensions
    const xValues = dataToUse.map(p => p.x);
    const yValues = dataToUse.map(p => p.y);

    // Calculate grid spacing
    const uniqueX = [...new Set(xValues)].sort((a, b) => a - b);
    const uniqueY = [...new Set(yValues)].sort((a, b) => a - b);
    const gridWidth = uniqueX.length;
    const gridHeight = uniqueY.length;

    console.log(`Grid dimensions: ${gridWidth}x${gridHeight}`);
    
    // Get actual value range from data
    const values = dataToUse.map(p => getValue(p)).filter(v => !isNaN(v));
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    
    // Determine scale domain based on legend mode
    let legendMin = minValue;
    let legendMax = maxValue;
    let contourThresholds = thresholds;
    
    if (immissionGridSettings.legendMode === 'custom') {
      legendMin = immissionGridSettings.legendMinValue;
      legendMax = legendMin + (immissionGridSettings.legendIntervalSize * immissionGridSettings.legendIntervalCount);
      
      // Create custom thresholds for contours based on intervals
      const customThresholds: number[] = [];
      for (let i = 0; i <= immissionGridSettings.legendIntervalCount; i++) {
        customThresholds.push(legendMin + (i * immissionGridSettings.legendIntervalSize));
      }
      contourThresholds = customThresholds;
    }
    
    console.log(`Immission value range: ${minValue.toFixed(2)} to ${maxValue.toFixed(2)} dB(A)`);
    console.log(`Legend range: ${legendMin.toFixed(2)} to ${legendMax.toFixed(2)} dB(A)`);
    
    // For triangular interpolation, we need to create a Delaunay triangulation
    // Transform y-coordinates: Leaflet has (0,0) at bottom-left, SVG has it at top-left
    const points: [number, number][] = dataToUse.map(p => [p.x, height - p.y]);
    const delaunay = Delaunator.from(points);
    
    // Create a regular grid for contouring
    const contourGridWidth = Math.ceil(width / 10); // Higher resolution for smoother contours
    const contourGridHeight = Math.ceil(height / 10);
    const contourValues: number[] = new Array(contourGridWidth * contourGridHeight);
    
    // Interpolate values on the regular grid using triangulation
    for (let cy = 0; cy < contourGridHeight; cy++) {
      for (let cx = 0; cx < contourGridWidth; cx++) {
        const px = (cx / (contourGridWidth - 1)) * width;
        const py = (cy / (contourGridHeight - 1)) * height;
        
        // Find the triangle containing this point
        let interpolatedValue = NaN;
        
        // Check each triangle
        for (let i = 0; i < delaunay.triangles.length; i += 3) {
          const i0 = delaunay.triangles[i];
          const i1 = delaunay.triangles[i + 1];
          const i2 = delaunay.triangles[i + 2];
          
          const p0 = dataToUse[i0];
          const p1 = dataToUse[i1];
          const p2 = dataToUse[i2];
          
          // Calculate barycentric coordinates (using transformed y-coordinates)
          const p0y = height - p0.y;
          const p1y = height - p1.y;
          const p2y = height - p2.y;
          
          const v0x = p2.x - p0.x;
          const v0y = p2y - p0y;
          const v1x = p1.x - p0.x;
          const v1y = p1y - p0y;
          const v2x = px - p0.x;
          const v2y = py - p0y;
          
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
            const w = 1 - u - v;
            interpolatedValue = w * getValue(p0) + u * getValue(p2) + v * getValue(p1);
            break;
          }
        }
        
        const index = cy * contourGridWidth + cx;
        contourValues[index] = interpolatedValue;
      }
    }
    
    // Replace NaN with minimum value for contouring
    const filledValues = contourValues.map(v => isNaN(v) ? minValue - 1 : v);
    
    // Generate contours
    const contourGenerator = contours()
      .size([contourGridWidth, contourGridHeight])
      .thresholds(contourThresholds)
      .smooth(true);
    
    const contourLines = contourGenerator(filledValues);
    
    // Create color scale using legend domain for consistent colors
    const colorScale = scaleSequential(colorScheme)
      .domain([legendMin, legendMax]);
    
    // Create path generator that scales from grid to pixel coordinates
    const pathTransform = geoTransform({
      point: function(x, y) {
        this.stream.point(
          x * (width / (contourGridWidth - 1)), 
          y * (height / (contourGridHeight - 1))
        );
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
      const d = pathGenerator(contour as GeoPermissibleObjects);
      if (d) {
        path.setAttribute('d', d);
        path.setAttribute('fill', colorScale(contour.value));
        path.setAttribute('fill-opacity', '0.5');
        path.setAttribute('stroke', colorScale(contour.value));
        path.setAttribute('stroke-width', '0.5');
        path.setAttribute('stroke-opacity', '0.8');
      }
      g.appendChild(path);
    });
    
    // Add grid points as small circles for debugging (optional)
    const showPoints = false; // Set to true to see grid points
    if (showPoints) {
      dataToUse.forEach(point => {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', point.x.toString());
        // Transform y-coordinate: Leaflet has (0,0) at bottom-left, SVG has it at top-left
        circle.setAttribute('cy', (height - point.y).toString());
        circle.setAttribute('r', '2');
        circle.setAttribute('fill', colorScale(getValue(point)));
        circle.setAttribute('fill-opacity', '1');
        g.appendChild(circle);
      });
    }
    
    svg.appendChild(g);
    console.log(`Generated ${contourLines.length} immission contour lines`);
    
    return { contourSVG: svg, minValue, maxValue, legendMin, legendMax };
  }, [width, height, gridValues, gridValuesDetailed, displayMode, transform, opacity, colorScheme, thresholds, immissionGridSettings]);
  
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
      zIndex: 450 // Higher than ContourOverlay (400)
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
    console.log('ImmissionGrid Legend effect:', { 
      hasMap: !!map, 
      minValue: minValue.toFixed(2), 
      maxValue: maxValue.toFixed(2), 
      hasContourSVG: !!contourSVG,
      isValidRange: minValue !== maxValue && !isNaN(minValue) && !isNaN(maxValue),
      legendMode: immissionGridSettings.legendMode
    });
    
    if (!map || !contourSVG) {
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
    
    // Use the legend values from contour generation for consistency
    let customIntervals: number[] | undefined;
    let intervalLabels: string[] | undefined;
    
    if (immissionGridSettings.legendMode === 'custom') {
      // Create custom intervals
      customIntervals = [];
      intervalLabels = [];
      
      // Create interval midpoints for colors (from high to low for display)
      for (let i = immissionGridSettings.legendIntervalCount - 1; i >= 0; i--) {
        const intervalStart = legendMin + (i * immissionGridSettings.legendIntervalSize);
        const intervalMid = intervalStart + (immissionGridSettings.legendIntervalSize / 2);
        customIntervals.push(intervalMid);
      }
      
      // Create boundary labels (N+1 labels for N intervals, from high to low)
      for (let i = immissionGridSettings.legendIntervalCount; i >= 0; i--) {
        const boundaryValue = legendMin + (i * immissionGridSettings.legendIntervalSize);
        intervalLabels.push(`${boundaryValue.toFixed(0)} dB(A)`);
      }
    }
    
    // Skip rendering if auto mode has invalid range
    if (immissionGridSettings.legendMode === 'auto' && (legendMin === legendMax || isNaN(legendMin) || isNaN(legendMax))) {
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
    
    console.log('Creating ImmissionGrid legend with range:', legendMin.toFixed(2), 'to', legendMax.toFixed(2), 'dB(A)');
    
    // Create or update legend container
    if (!legendContainerRef.current) {
      const container = document.createElement('div');
      container.className = 'immission-legend-container';
      container.style.position = 'absolute';
      container.style.bottom = '10px';
      container.style.right = '10px';
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
      console.log('Rendering ImmissionGrid D3Legend component');
      
      // Determine legend title based on display mode
      let legendTitle = "Immission";
      switch (displayMode) {
        case 'esq': legendTitle = "ESQ Sources"; break;
        case 'trassen': legendTitle = "Transmission Lines"; break;
        case 'total': 
        default: legendTitle = "Total Immission"; break;
      }
      
      legendRootRef.current.render(
        <D3Legend
          minValue={legendMin}
          maxValue={legendMax}
          colorScheme={colorScheme}
          title={legendTitle}
          unit=" dB(A)"
          position="bottomright"
          width={150}
          height={220}
          customIntervals={customIntervals}
          intervalLabels={intervalLabels}
        />
      );
    }
    
    // Cleanup
    return () => {
      console.log('Cleaning up ImmissionGrid legend');
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
  }, [map, legendMin, legendMax, colorScheme, contourSVG, immissionGridSettings, displayMode]);
  
  return null; // This component doesn't render anything directly
};