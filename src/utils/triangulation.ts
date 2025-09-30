// @ts-ignore
import Delaunator from 'delaunator';
import type { UsedDGMDreieck, UsedDGMKante, GKVector3d } from '../types/usedData';

interface HoehenpunktLike {
  GK_Vektor: GKVector3d;
}

export function computeTriangulation(hoehenpunkte: HoehenpunktLike[]): {
  dreiecke: UsedDGMDreieck[];
  kanten: UsedDGMKante[];
} {
  console.log('Computing triangulation for', hoehenpunkte.length, 'points');
  if (hoehenpunkte.length < 3) {
    console.log('Not enough points for triangulation');
    return { dreiecke: [], kanten: [] };
  }
  
  // Prepare points for Delaunator (flat array of x, y coordinates)
  // Normalize coordinates to avoid precision issues with large numbers
  const allX = hoehenpunkte.map(hp => hp.GK_Vektor.GK.Rechts);
  const allY = hoehenpunkte.map(hp => hp.GK_Vektor.GK.Hoch);
  const minX = Math.min(...allX);
  const minY = Math.min(...allY);
  
  console.log('Coordinate ranges - X:', Math.min(...allX), 'to', Math.max(...allX));
  console.log('Coordinate ranges - Y:', Math.min(...allY), 'to', Math.max(...allY));
  
  const points: number[] = [];
  hoehenpunkte.forEach((hp, index) => {
    const normalizedX = hp.GK_Vektor.GK.Rechts - minX;
    const normalizedY = hp.GK_Vektor.GK.Hoch - minY;
    console.log(`Point ${index}: original(${hp.GK_Vektor.GK.Rechts}, ${hp.GK_Vektor.GK.Hoch}) normalized(${normalizedX}, ${normalizedY})`);
    points.push(normalizedX);
    points.push(normalizedY);
  });
  
  console.log('Normalized points array for Delaunator:', points);
  
  // Check for duplicate points
  const uniquePoints = new Set();
  for (let i = 0; i < points.length; i += 2) {
    const key = `${points[i]},${points[i + 1]}`;
    if (uniquePoints.has(key)) {
      console.warn('Duplicate point found:', points[i], points[i + 1]);
    }
    uniquePoints.add(key);
  }
  console.log('Unique points count:', uniquePoints.size);
  
  // Test with a simple triangle first
  console.log('Testing Delaunator with simple triangle...');
  console.log('Delaunator constructor:', typeof Delaunator);
  console.log('Delaunator.from function:', typeof Delaunator.from);
  
  try {
    // Use the exact example from Delaunator docs
    const coords = [168,180, 168,178, 168,179, 168,181, 168,183];
    console.log('Using coords from docs:', coords);
    
    const delaunay = new Delaunator(coords);
    console.log('Doc example triangles:', delaunay.triangles.length);
    console.log('Doc example result:', Array.from(delaunay.triangles));
    
    // Test with even simpler points
    const simpleCoords = [0,0, 1,0, 0,1];
    const simpleDelaunay = new Delaunator(simpleCoords);
    console.log('Simple triangle triangles:', simpleDelaunay.triangles.length);
    console.log('Simple triangle result:', Array.from(simpleDelaunay.triangles));
    
  } catch (testError) {
    console.error('Test triangulation failed:', testError);
  }
  
  // Compute Delaunay triangulation
  let delaunay;
  try {
    delaunay = new Delaunator(points);
    console.log('Delaunator triangles array length:', delaunay.triangles.length);
    console.log('First few triangles:', Array.from(delaunay.triangles.slice(0, 12)));
    console.log('Hull:', Array.from(delaunay.hull));
    console.log('Hull length:', delaunay.hull.length);
    
    // Check if triangulation is valid
    if (!delaunay.triangles || delaunay.triangles.length === 0) {
      console.error('Delaunator produced no triangles - points might be collinear or invalid');
      
      // Try to create a manual triangulation for debugging
      if (points.length >= 6) {
        console.log('Attempting manual triangle creation...');
        const p0 = [points[0], points[1]];
        const p1 = [points[2], points[3]];
        const p2 = [points[4], points[5]];
        console.log('Three points for manual triangle:', p0, p1, p2);
        
        // Check if points are collinear
        const cross = (p1[0] - p0[0]) * (p2[1] - p0[1]) - (p1[1] - p0[1]) * (p2[0] - p0[0]);
        console.log('Cross product (collinearity test):', cross);
        if (Math.abs(cross) < 1e-10) {
          console.error('Points are collinear!');
        }
      }
      
      return { dreiecke: [], kanten: [] };
    }
  } catch (error) {
    console.error('Delaunator error:', error);
    return { dreiecke: [], kanten: [] };
  }
  
  // Convert triangles to UsedDGMDreieck format
  const dreiecke: UsedDGMDreieck[] = [];
  const triangleCount = delaunay.triangles.length / 3;
  console.log('Generated', triangleCount, 'triangles');
  
  for (let i = 0; i < triangleCount; i++) {
    const i0 = delaunay.triangles[i * 3];
    const i1 = delaunay.triangles[i * 3 + 1];
    const i2 = delaunay.triangles[i * 3 + 2];
    
    const dreieck: UsedDGMDreieck = {
      LfdNummer: i + 1,
      A: {
        Nummer: -1,
        HP: {
          lfdNummer: i0 + 1,
          OVektor: { x: 0, y: 0, Length: 0 },
          GK_Vektor: hoehenpunkte[i0].GK_Vektor,
        },
      },
      B: {
        Nummer: -1,
        HP: {
          lfdNummer: i1 + 1,
          OVektor: { x: 0, y: 0, Length: 0 },
          GK_Vektor: hoehenpunkte[i1].GK_Vektor,
        },
      },
      C: {
        Nummer: -1,
        HP: {
          lfdNummer: i2 + 1,
          OVektor: { x: 0, y: 0, Length: 0 },
          GK_Vektor: hoehenpunkte[i2].GK_Vektor,
        },
      },
    };
    
    dreiecke.push(dreieck);
  }
  
  // Extract edges from triangulation
  const kanten: UsedDGMKante[] = [];
  const edgeMap = new Map<string, { indices: [number, number], triangles: number[] }>();
  
  // Process each triangle and extract edges
  for (let t = 0; t < triangleCount; t++) {
    const i0 = delaunay.triangles[t * 3];
    const i1 = delaunay.triangles[t * 3 + 1];
    const i2 = delaunay.triangles[t * 3 + 2];
    
    // Three edges per triangle
    const edges: [number, number][] = [
      [Math.min(i0, i1), Math.max(i0, i1)],
      [Math.min(i1, i2), Math.max(i1, i2)],
      [Math.min(i2, i0), Math.max(i2, i0)],
    ];
    
    edges.forEach(edge => {
      const key = `${edge[0]}-${edge[1]}`;
      if (!edgeMap.has(key)) {
        edgeMap.set(key, { indices: edge, triangles: [] });
      }
      edgeMap.get(key)!.triangles.push(t + 1);
    });
  }
  
  // Convert edges to UsedDGMKante format
  edgeMap.forEach((edge) => {
    const [i0, i1] = edge.indices;
    
    const kante: UsedDGMKante = {
      EckeA: {
        Nummer: -1,
        HP: {
          lfdNummer: i0 + 1,
          OVektor: { x: 0, y: 0, Length: 0 },
          GK_Vektor: hoehenpunkte[i0].GK_Vektor,
        },
      },
      EckeB: {
        Nummer: -1,
        HP: {
          lfdNummer: i1 + 1,
          OVektor: { x: 0, y: 0, Length: 0 },
          GK_Vektor: hoehenpunkte[i1].GK_Vektor,
        },
      },
      DreieckA: edge.triangles[0] || -1,
      DreieckB: edge.triangles[1] || -1,
    };
    
    kanten.push(kante);
  });
  
  return { dreiecke, kanten };
}