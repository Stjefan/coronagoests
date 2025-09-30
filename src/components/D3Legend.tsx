import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { scaleSequential } from 'd3-scale';

interface D3LegendProps {
  minValue: number;
  maxValue: number;
  colorScheme: (t: number) => string;
  title: string;
  unit?: string;
  width?: number;
  height?: number;
  position?: 'bottomleft' | 'bottomright' | 'topleft' | 'topright';
  customIntervals?: number[];
  intervalLabels?: string[];
}

export const D3Legend: React.FC<D3LegendProps> = ({
  minValue,
  maxValue,
  colorScheme,
  title,
  unit = '',
  width = 100,
  height = 200,
  position = 'bottomleft',
  customIntervals,
  intervalLabels
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    
    // Clear previous content
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    
    const margin = { top: 30, right: 60, bottom: 30, left: 15 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Title
    g.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .text(title);
    
    // Create color scale
    const colorScale = scaleSequential(colorScheme)
      .domain([minValue, maxValue]);
    
    if (customIntervals && customIntervals.length > 0) {
      // Draw discrete intervals
      const intervalHeight = innerHeight / customIntervals.length;
      
      customIntervals.forEach((value, i) => {
        // Draw from top to bottom (standard order)
        const yPos = i * intervalHeight;
        
        // Draw rectangle for each interval
        g.append('rect')
          .attr('x', 0)
          .attr('y', yPos)
          .attr('width', innerWidth)
          .attr('height', intervalHeight)
          .style('fill', colorScale(value))
          .style('stroke', '#ccc')
          .style('stroke-width', 0.5);
      });
      
      // Draw outer border
      g.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', innerWidth)
        .attr('height', innerHeight)
        .style('fill', 'none')
        .style('stroke', '#ccc')
        .style('stroke-width', 1);
    } else {
      // Create gradient for continuous legend
      const gradientId = `legend-gradient-${Date.now()}`;
      const defs = svg.append('defs');
      const linearGradient = defs.append('linearGradient')
        .attr('id', gradientId)
        .attr('x1', '0%')
        .attr('y1', '100%')
        .attr('x2', '0%')
        .attr('y2', '0%');
      
      // Add gradient stops
      const steps = 20;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const value = minValue + t * (maxValue - minValue);
        linearGradient.append('stop')
          .attr('offset', `${t * 100}%`)
          .attr('stop-color', colorScale(value));
      }
      
      // Draw gradient rectangle
      g.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', innerWidth)
        .attr('height', innerHeight)
        .style('fill', `url(#${gradientId})`)
        .style('stroke', '#ccc')
        .style('stroke-width', 1);
    }
    
    // Create scale for axis
    if (customIntervals && intervalLabels) {
      // Create tick positions at interval boundaries
      const intervalHeight = innerHeight / customIntervals.length;
      const tickPositions: number[] = [];
      
      // Add tick at each boundary (N+1 ticks for N intervals)
      for (let i = 0; i <= customIntervals.length; i++) {
        tickPositions.push(i * intervalHeight);
      }
      
      const axis = d3.axisRight(d3.scaleLinear().domain([0, 1]).range([innerHeight, 0]))
        .tickValues(tickPositions.map(pos => 1 - pos / innerHeight))
        .tickFormat((_, i) => {
          // Labels should be the boundary values
          if (i < intervalLabels.length) {
            return intervalLabels[i];
          }
          return ''; // No extra label needed
        });
      
      g.append('g')
        .attr('transform', `translate(${innerWidth}, 0)`)
        .call(axis)
        .style('font-size', '10px');
    } else {
      // Use continuous scale
      const axisScale = d3.scaleLinear()
        .domain([minValue, maxValue])
        .range([innerHeight, 0]);
      
      // Create and add axis
      const axis = d3.axisRight(axisScale)
        .ticks(5)
        .tickFormat(d => {
          const val = Number(d);
          return unit ? `${val.toFixed(1)}${unit}` : val.toFixed(1);
        });
      
      g.append('g')
        .attr('transform', `translate(${innerWidth}, 0)`)
        .call(axis)
        .style('font-size', '10px');
    }
      
  }, [minValue, maxValue, colorScheme, title, unit, width, height, customIntervals, intervalLabels]);

  return (
    <div
      className={`leaflet-control leaflet-control-legend-d3 legend-d3-${position}`}
      style={{
        position: 'absolute',
        [position.includes('bottom') ? 'bottom' : 'top']: '10px',
        [position.includes('left') ? 'left' : 'right']: '10px',
        backgroundColor: 'white',
        padding: '5px',
        borderRadius: '5px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
        zIndex: 1000,
        pointerEvents: 'none' // Prevent blocking map interactions
      }}
    >
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{ display: 'block' }}
      />
    </div>
  );
};