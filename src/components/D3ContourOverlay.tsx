import React, { useMemo } from 'react';
import * as d3 from 'd3';
import { contours } from 'd3-contour';
import { scaleSequential } from 'd3-scale';
import { interpolateViridis } from 'd3-scale-chromatic';
import { geoPath, geoTransform } from 'd3-geo';
import L from 'leaflet';
import { SVGOverlay } from 'react-leaflet';

interface ContourData {
  x: number;
  y: number;
  value: number;
}

interface D3ContourOverlayProps {
  data: ContourData[];
  width: number;
  height: number;
  cellSize?: number;
  thresholds?: number;
  opacity?: number;
  colorScheme?: (t: number) => string;
}

export const D3ContourOverlay: React.FC<D3ContourOverlayProps> = ({
  data,
  width,
  height,
  cellSize = 10,
  thresholds = 10,
  opacity = 0.6,
  colorScheme = interpolateViridis
}) => {

  console.log('D3ContourOverlay rendering with data points:', data.length);

  // Generate contours in useMemo to avoid recalculation
  const contourPaths = useMemo(() => {
    if (!data || data.length === 0) {
      console.log('No data, skipping contour generation');
      return [];
    }

    // Create grid for contour calculation
    const gridWidth = Math.ceil(width / cellSize);
    const gridHeight = Math.ceil(height / cellSize);
    
    console.log(`Grid dimensions: ${gridWidth}x${gridHeight}, cellSize: ${cellSize}`);
    
    // Initialize grid with zeros
    const values = new Array(gridWidth * gridHeight).fill(0);
    
    // Check if data is already gridded (from DTM)
    const isGridded = data.length > 50 && 
      data.every(d => d.x % cellSize < 1 && d.y % cellSize < 1);
    
    if (isGridded) {
      // Data is already on a grid, just place values directly
      console.log('Using pre-gridded DTM data');
      data.forEach(point => {
        const gx = Math.round(point.x / cellSize);
        const gy = Math.round(point.y / cellSize);
        if (gx >= 0 && gx < gridWidth && gy >= 0 && gy < gridHeight) {
          const index = gy * gridWidth + gx;
          values[index] = point.value;
        }
      });
    } else {
      // Interpolate sparse data points to grid using IDW
      console.log('Interpolating sparse data to grid');
      for (let gy = 0; gy < gridHeight; gy++) {
        for (let gx = 0; gx < gridWidth; gx++) {
          const px = gx * cellSize;
          const py = gy * cellSize;
          
          let weightedSum = 0;
          let weightSum = 0;
          
          // IDW interpolation
          data.forEach(point => {
            const dx = px - point.x;
            const dy = py - point.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 0.1) {
              // Very close to the point, use its value directly
              weightedSum = point.value;
              weightSum = 1;
            } else if (distance < cellSize * 3) {
              // Within influence radius - use inverse distance squared
              const weight = 1 / (1 + distance * distance / (cellSize * cellSize));
              weightedSum += point.value * weight;
              weightSum += weight;
            }
          });
          
          const index = gy * gridWidth + gx;
          values[index] = weightSum > 0 ? weightedSum / weightSum : 0;
        }
      }
    }

    // Apply light smoothing for better contour appearance
    const smoothedValues = new Array(values.length);
    for (let gy = 0; gy < gridHeight; gy++) {
      for (let gx = 0; gx < gridWidth; gx++) {
        const index = gy * gridWidth + gx;
        let sum = values[index] * 4; // Center weight
        let count = 4;
        
        // Add neighbors with lower weight
        if (gx > 0 && values[index - 1] > 0) { 
          sum += values[index - 1]; 
          count++; 
        }
        if (gx < gridWidth - 1 && values[index + 1] > 0) { 
          sum += values[index + 1]; 
          count++; 
        }
        if (gy > 0 && values[index - gridWidth] > 0) { 
          sum += values[index - gridWidth]; 
          count++; 
        }
        if (gy < gridHeight - 1 && values[index + gridWidth] > 0) { 
          sum += values[index + gridWidth]; 
          count++; 
        }
        
        smoothedValues[index] = count > 0 ? sum / count : 0;
      }
    }

    // Find non-zero values for debugging
    const nonZeroCount = smoothedValues.filter(v => v > 0).length;
    console.log(`Grid has ${nonZeroCount} non-zero values out of ${smoothedValues.length}`);

    // Generate contours
    const contourGenerator = contours()
      .size([gridWidth, gridHeight])
      .thresholds(thresholds);

    const contourData = contourGenerator(smoothedValues);
    console.log(`Generated ${contourData.length} contour levels`);

    // Create color scale
    const extent = d3.extent(smoothedValues.filter(v => v > 0)) as [number, number];
    console.log(`Value range: ${extent?.[0]?.toFixed(2)} to ${extent?.[1]?.toFixed(2)}`);
    
    const colorScale = scaleSequential(colorScheme)
      .domain(extent || [0, 1]);

    // Create geo transform for converting contour coordinates to pixel coordinates
    const transform = geoTransform({
      point: function(x, y) {
        // Scale from grid coordinates back to pixel coordinates
        this.stream.point(x * cellSize, y * cellSize);
      }
    });

    const pathGenerator = geoPath().projection(transform);

    // Generate path data for each contour
    return contourData.map((d, i) => ({
      d: pathGenerator(d as d3.GeoPermissibleObjects),
      fill: colorScale(d.value),
      value: d.value,
      index: i
    }));
  }, [data, width, height, cellSize, thresholds, colorScheme]);

  // Use SVGOverlay to render the contours directly on the map
  const bounds: L.LatLngBoundsExpression = [[0, 0], [height, width]];

  return (
    <SVGOverlay bounds={bounds} attributes={{ opacity: opacity.toString() }}>
      <g>
        {contourPaths.map((path) => (
          <path
            key={`contour-${path.index}`}
            d={path.d || ''}
            fill={path.fill}
            stroke="white"
            strokeWidth="0.5"
            strokeOpacity="0.3"
            fillOpacity={opacity}
          />
        ))}
      </g>
    </SVGOverlay>
  );
};