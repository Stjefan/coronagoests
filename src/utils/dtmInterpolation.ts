import type { UsedDGMDreieck } from "../types/usedData";

/**
 * Check if a point is inside a triangle using barycentric coordinates
 */
// function pointInTriangle(px: number, py: number, ax: number, ay: number, bx: number, by: number, cx: number, cy: number): boolean {
//   const v0x = cx - ax;
//   const v0y = cy - ay;
//   const v1x = bx - ax;
//   const v1y = by - ay;
//   const v2x = px - ax;
//   const v2y = py - ay;

//   const dot00 = v0x * v0x + v0y * v0y;
//   const dot01 = v0x * v1x + v0y * v1y;
//   const dot02 = v0x * v2x + v0y * v2y;
//   const dot11 = v1x * v1x + v1y * v1y;
//   const dot12 = v1x * v2x + v1y * v2y;

//   const invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
//   const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
//   const v = (dot00 * dot12 - dot01 * dot02) * invDenom;

//   return (u >= 0) && (v >= 0) && (u + v <= 1);
// }

/**
 * Calculate barycentric coordinates for a point in a triangle
 */
function getBarycentricCoordinates(px: number, py: number, ax: number, ay: number, bx: number, by: number, cx: number, cy: number): { u: number; v: number; w: number } | null {
  const v0x = bx - ax;
  const v0y = by - ay;
  const v1x = cx - ax;
  const v1y = cy - ay;
  const v2x = px - ax;
  const v2y = py - ay;

  const den = v0x * v1y - v1x * v0y;
  
  if (Math.abs(den) < 1e-10) {
    return null; // Degenerate triangle
  }

  const v = (v2x * v1y - v1x * v2y) / den;
  const w = (v0x * v2y - v2x * v0y) / den;
  const u = 1.0 - v - w;

  // Check if point is inside triangle
  if (u >= -1e-10 && v >= -1e-10 && w >= -1e-10) {
    return { u, v, w };
  }

  return null;
}

/**
 * Interpolate height at a point using barycentric interpolation within DTM triangles
 */
export function interpolateHeightFromDTM(
  x: number, 
  y: number, 
  triangles: UsedDGMDreieck[]
): number | null {
  
  // Find which triangle contains the point
  for (const triangle of triangles) {
    const pointA = triangle.A?.HP?.GK_Vektor;
    const pointB = triangle.B?.HP?.GK_Vektor;
    const pointC = triangle.C?.HP?.GK_Vektor;

    if (!pointA || !pointB || !pointC) continue;

    // Get barycentric coordinates
    const baryCoords = getBarycentricCoordinates(
      x, y,
      pointA.GK.Rechts, pointA.GK.Hoch,
      pointB.GK.Rechts, pointB.GK.Hoch,
      pointC.GK.Rechts, pointC.GK.Hoch
    );

    if (baryCoords) {
      // Interpolate height using barycentric coordinates
      const interpolatedHeight = 
        baryCoords.u * pointA.z +
        baryCoords.v * pointB.z +
        baryCoords.w * pointC.z;
      
      return interpolatedHeight;
    }
  }

  return null; // Point not in any triangle
}

/**
 * Find the nearest triangle to a point and interpolate height
 * Used when point is outside the triangulation
 */
export function interpolateHeightNearestTriangle(
  x: number,
  y: number,
  triangles: UsedDGMDreieck[]
): number {
  
  let minDistance = Infinity;
  let nearestHeight = 0;

  for (const triangle of triangles) {
    const pointA = triangle.A?.HP?.GK_Vektor;
    const pointB = triangle.B?.HP?.GK_Vektor;
    const pointC = triangle.C?.HP?.GK_Vektor;

    if (!pointA || !pointB || !pointC) continue;

    // Calculate centroid of triangle
    const centroidX = (pointA.GK.Rechts + pointB.GK.Rechts + pointC.GK.Rechts) / 3;
    const centroidY = (pointA.GK.Hoch + pointB.GK.Hoch + pointC.GK.Hoch) / 3;
    
    // Distance to centroid
    const dx = x - centroidX;
    const dy = y - centroidY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < minDistance) {
      minDistance = distance;
      // Average height of triangle vertices
      nearestHeight = (pointA.z + pointB.z + pointC.z) / 3;
    }
  }

  return nearestHeight;
}

/**
 * Create a grid of interpolated heights from DTM triangulation
 */
export function createDTMGrid(
  width: number,
  height: number,
  cellSize: number,
  triangles: UsedDGMDreieck[],
  transformGKToPixel: (gkRechts: number, gkHoch: number) => [number, number]
): { x: number; y: number; value: number }[] {
  
  console.log(`Creating DTM grid: ${width}x${height}, cellSize: ${cellSize}, triangles: ${triangles.length}`);
  
  const data: { x: number; y: number; value: number }[] = [];
  
  // First, let's check if we have valid triangles
  let validTriangles = 0;
  triangles.forEach(triangle => {
    const pointA = triangle.A?.HP?.GK_Vektor;
    const pointB = triangle.B?.HP?.GK_Vektor;
    const pointC = triangle.C?.HP?.GK_Vektor;
    if (pointA && pointB && pointC) {
      validTriangles++;
    }
  });
  console.log(`Valid triangles with all vertices: ${validTriangles}/${triangles.length}`);
  
  // Create a regular grid
  let pointsInTriangles = 0;
  let pointsExtrapolated = 0;
  
  for (let x = 0; x < width; x += cellSize) {
    for (let y = 0; y < height; y += cellSize) {
      // Find the height at this pixel position
      let heightFound = false;
      
      for (const triangle of triangles) {
        const pointA = triangle.A?.HP?.GK_Vektor;
        const pointB = triangle.B?.HP?.GK_Vektor;
        const pointC = triangle.C?.HP?.GK_Vektor;

        if (!pointA || !pointB || !pointC) continue;

        // Convert triangle vertices from GK to pixel coordinates
        const [pxA, pyA] = transformGKToPixel(pointA.GK.Rechts, pointA.GK.Hoch);
        const [pxB, pyB] = transformGKToPixel(pointB.GK.Rechts, pointB.GK.Hoch);
        const [pxC, pyC] = transformGKToPixel(pointC.GK.Rechts, pointC.GK.Hoch);

        // Check if current grid point is inside this triangle
        // Note: pyA, pyB, pyC are already in Leaflet coordinates (bottom-up)
        // but x,y are in screen coordinates (top-down), so we need to flip y
        const leafletY = height - y;
        
        const baryCoords = getBarycentricCoordinates(
          x, leafletY,
          pxA, pyA,
          pxB, pyB,
          pxC, pyC
        );

        if (baryCoords) {
          // Interpolate height using barycentric coordinates
          const interpolatedHeight = 
            baryCoords.u * pointA.z +
            baryCoords.v * pointB.z +
            baryCoords.w * pointC.z;
          
          data.push({
            x: x,
            y: y, // Use top-left origin for display
            value: interpolatedHeight
          });
          
          heightFound = true;
          pointsInTriangles++;
          break;
        }
      }
      
      // If no triangle found, find nearest triangle for extrapolation
      if (!heightFound && triangles.length > 0) {
        let minDistance = Infinity;
        let nearestHeight = 0;

        for (const triangle of triangles) {
          const pointA = triangle.A?.HP?.GK_Vektor;
          const pointB = triangle.B?.HP?.GK_Vektor;
          const pointC = triangle.C?.HP?.GK_Vektor;

          if (!pointA || !pointB || !pointC) continue;

          // Convert triangle vertices to pixel coordinates
          const [pxA, pyA] = transformGKToPixel(pointA.GK.Rechts, pointA.GK.Hoch);
          const [pxB, pyB] = transformGKToPixel(pointB.GK.Rechts, pointB.GK.Hoch);
          const [pxC, pyC] = transformGKToPixel(pointC.GK.Rechts, pointC.GK.Hoch);

          // Calculate centroid in pixel space
          const centroidX = (pxA + pxB + pxC) / 3;
          const centroidY = (pyA + pyB + pyC) / 3;
          
          // Distance to centroid
          const dx = x - centroidX;
          const dy = (height - y) - centroidY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < minDistance) {
            minDistance = distance;
            // Average height of triangle vertices
            nearestHeight = (pointA.z + pointB.z + pointC.z) / 3;
          }
        }

        // Only add if within reasonable distance
        if (minDistance < cellSize * 5) {
          data.push({
            x: x,
            y: y,
            value: nearestHeight
          });
          pointsExtrapolated++;
        }
      }
    }
  }

  console.log(`DTM grid generation complete:`);
  console.log(`  - Points inside triangles: ${pointsInTriangles}`);
  console.log(`  - Points extrapolated: ${pointsExtrapolated}`);
  console.log(`  - Total grid points: ${data.length}`);

  return data;
}