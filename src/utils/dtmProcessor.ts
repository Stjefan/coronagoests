import type { GKVector2d, GKVector3d } from '../types/usedData.ts';

export interface DGMDreieck {
  A: { Nummer: number; HP: { lfdNummer: number } };
  B: { Nummer: number; HP: { lfdNummer: number } };
  C: { Nummer: number; HP: { lfdNummer: number } };
  LfdNummer: number;
}

export interface HPunkt {
  LfdNummer: number;
  GK_Vektor: GKVector3d;
}

export interface DGMKante {
  EckeA: { Nummer: number; HP: { lfdNummer: number } };
  EckeB: { Nummer: number; HP: { lfdNummer: number } };
  DreieckA: number;
  DreieckB: number;
}

export class DTMProcessor {
  private dreiecke: DGMDreieck[];
  private hPunkte: HPunkt[];
  private dgmKanten: DGMKante[] = [];
  
  constructor(dgmDreiecke: DGMDreieck[], hoehenpunkte: HPunkt[]) {
    this.dreiecke = dgmDreiecke || [];
    this.hPunkte = hoehenpunkte || [];
    
    // Auto-generate edges from triangles if no edges provided
    if (this.dreiecke.length > 0) {
      this.generateEdgesFromTriangles();
    }
  }

  setDGMKante(kanten: DGMKante[]): void {
    // Only override generated edges if provided edges are non-empty
    if (kanten && kanten.length > 0) {
      this.dgmKanten = kanten;
    }
  }

  get DGMKante(): DGMKante[] {
    return this.dgmKanten;
  }

  /**
   * Generate edges from triangles
   * Each triangle contributes 3 edges (A-B, B-C, C-A)
   */
  private generateEdgesFromTriangles(): void {
    const edgeMap = new Map<string, DGMKante>();
    
    for (const triangle of this.dreiecke) {
      if (!triangle || !triangle.A || !triangle.B || !triangle.C) continue;
      
      // Create three edges for this triangle
      const edges: Array<[typeof triangle.A, typeof triangle.B]> = [
        [triangle.A, triangle.B],
        [triangle.B, triangle.C],
        [triangle.C, triangle.A]
      ];
      
      for (const [eckeA, eckeB] of edges) {
        // Create a unique key for this edge (order-independent)
        const lfdA = eckeA.HP.lfdNummer;
        const lfdB = eckeB.HP.lfdNummer;
        const key = lfdA < lfdB ? `${lfdA}-${lfdB}` : `${lfdB}-${lfdA}`;
        
        // Only add if not already present (avoid duplicates from adjacent triangles)
        if (!edgeMap.has(key)) {
          const edge: DGMKante = {
            EckeA: {
              Nummer: eckeA.Nummer,
              HP: { lfdNummer: eckeA.HP.lfdNummer }
            },
            EckeB: {
              Nummer: eckeB.Nummer,
              HP: { lfdNummer: eckeB.HP.lfdNummer }
            },
            DreieckA: triangle.LfdNummer,
            DreieckB: -1 // Will be updated if shared with another triangle
          };
          
          edgeMap.set(key, edge);
        } else {
          // Update DreieckB for shared edge
          const existingEdge = edgeMap.get(key)!;
          if (existingEdge.DreieckB === -1) {
            existingEdge.DreieckB = triangle.LfdNummer;
          }
        }
      }
    }
    
    // Convert map to array
    this.dgmKanten = Array.from(edgeMap.values());
  }

  /**
   * Calculate terrain height at a given 2D position using triangulated surface
   */
  berechneHoeheDGM(position: GKVector2d): number {
    // Find which triangle contains this point
    for (const dreieck of this.dreiecke) {
      if (!dreieck || dreieck.LfdNummer === 0) continue;
      
      // Get the three vertices of the triangle
      const pA = this.getPointFromHLinie(dreieck.A);
      const pB = this.getPointFromHLinie(dreieck.B);
      const pC = this.getPointFromHLinie(dreieck.C);
      
      if (!pA || !pB || !pC) continue;
      
      // Check if point is inside triangle using barycentric coordinates
      if (this.isPointInTriangle(position, pA.GK, pB.GK, pC.GK)) {
        // Interpolate height using barycentric coordinates
        return this.interpolateHeight(position, pA, pB, pC);
      }
    }
    
    // If point is not in any triangle, return a default height (0 or nearest point)
    return this.getNearestPointHeight(position);
  }

  private getPointFromHLinie(hlinie: { Nummer: number; HP: { lfdNummer: number } }): GKVector3d | null {
    if (!hlinie || !hlinie.HP) return null;
    
    const lfdNummer = hlinie.HP.lfdNummer;
    if (lfdNummer === 0) return null;
    
    // Find the corresponding height point
    const hPunkt = this.hPunkte.find(p => p.LfdNummer === lfdNummer);
    if (!hPunkt) return null;
    
    return hPunkt.GK_Vektor;
  }

  private isPointInTriangle(
    p: GKVector2d,
    a: GKVector2d,
    b: GKVector2d,
    c: GKVector2d
  ): boolean {
    // Use barycentric coordinates to check if point is inside triangle
    const v0x = c.Rechts - a.Rechts;
    const v0y = c.Hoch - a.Hoch;
    const v1x = b.Rechts - a.Rechts;
    const v1y = b.Hoch - a.Hoch;
    const v2x = p.Rechts - a.Rechts;
    const v2y = p.Hoch - a.Hoch;
    
    const dot00 = v0x * v0x + v0y * v0y;
    const dot01 = v0x * v1x + v0y * v1y;
    const dot02 = v0x * v2x + v0y * v2y;
    const dot11 = v1x * v1x + v1y * v1y;
    const dot12 = v1x * v2x + v1y * v2y;
    
    const invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
    const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
    const v = (dot00 * dot12 - dot01 * dot02) * invDenom;
    
    // Check if point is in triangle
    return (u >= 0) && (v >= 0) && (u + v <= 1);
  }

  private interpolateHeight(
    p: GKVector2d,
    a: GKVector3d,
    b: GKVector3d,
    c: GKVector3d
  ): number {
    // Calculate barycentric coordinates
    const v0x = c.GK.Rechts - a.GK.Rechts;
    const v0y = c.GK.Hoch - a.GK.Hoch;
    const v1x = b.GK.Rechts - a.GK.Rechts;
    const v1y = b.GK.Hoch - a.GK.Hoch;
    const v2x = p.Rechts - a.GK.Rechts;
    const v2y = p.Hoch - a.GK.Hoch;
    
    const dot00 = v0x * v0x + v0y * v0y;
    const dot01 = v0x * v1x + v0y * v1y;
    const dot02 = v0x * v2x + v0y * v2y;
    const dot11 = v1x * v1x + v1y * v1y;
    const dot12 = v1x * v2x + v1y * v2y;
    
    const invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
    const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
    const v = (dot00 * dot12 - dot01 * dot02) * invDenom;
    const w = 1 - u - v;
    
    // Interpolate height using barycentric coordinates
    return w * a.z + v * b.z + u * c.z;
  }

  private getNearestPointHeight(position: GKVector2d): number {
    if (this.hPunkte.length === 0) return 0;
    
    let minDist = Number.MAX_VALUE;
    let nearestHeight = 0;
    
    for (const punkt of this.hPunkte) {
      if (!punkt || punkt.LfdNummer === 0) continue;
      
      const dx = punkt.GK_Vektor.GK.Rechts - position.Rechts;
      const dy = punkt.GK_Vektor.GK.Hoch - position.Hoch;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < minDist) {
        minDist = dist;
        nearestHeight = punkt.GK_Vektor.z;
      }
    }
    
    return nearestHeight;
  }

  /**
   * Find intersection points between a line segment and DGM edges
   * This is used for screening calculations
   */
  findEdgeIntersections(
    start: GKVector2d,
    end: GKVector2d
  ): Array<{ distance: number; point: GKVector3d; edgeIndex: number }> {
    const intersections: Array<{ distance: number; point: GKVector3d; edgeIndex: number }> = [];
    
    for (let i = 0; i < this.dgmKanten.length; i++) {
      const kante = this.dgmKanten[i];
      if (!kante) continue;
      
      const edgeStart = this.getPointFromHLinie(kante.EckeA);
      const edgeEnd = this.getPointFromHLinie(kante.EckeB);
      
      if (!edgeStart || !edgeEnd) continue;
      
      // Check if the line segments intersect
      const intersection = this.lineSegmentIntersection(
        start,
        end,
        edgeStart.GK,
        edgeEnd.GK
      );
      
      if (intersection) {
        // Calculate distance from start point
        const dx = intersection.Rechts - start.Rechts;
        const dy = intersection.Hoch - start.Hoch;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Interpolate height at intersection point
        const t = this.getParameterOnLineSegment(
          edgeStart.GK,
          edgeEnd.GK,
          intersection
        );
        const height = edgeStart.z + t * (edgeEnd.z - edgeStart.z);
        
        intersections.push({
          distance,
          point: {
            GK: intersection,
            z: height
          },
          edgeIndex: i
        });
      }
    }
    
    // Sort by distance from start
    intersections.sort((a, b) => a.distance - b.distance);
    
    return intersections;
  }

  private lineSegmentIntersection(
    p1: GKVector2d,
    p2: GKVector2d,
    p3: GKVector2d,
    p4: GKVector2d
  ): GKVector2d | null {
    const x1 = p1.Rechts, y1 = p1.Hoch;
    const x2 = p2.Rechts, y2 = p2.Hoch;
    const x3 = p3.Rechts, y3 = p3.Hoch;
    const x4 = p4.Rechts, y4 = p4.Hoch;
    
    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    
    if (Math.abs(denom) < 1e-10) {
      return null; // Lines are parallel
    }
    
    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
    
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      // The line segments intersect
      return {
        Rechts: x1 + t * (x2 - x1),
        Hoch: y1 + t * (y2 - y1)
      };
    }
    
    return null;
  }

  private getParameterOnLineSegment(
    start: GKVector2d,
    end: GKVector2d,
    point: GKVector2d
  ): number {
    const dx = end.Rechts - start.Rechts;
    const dy = end.Hoch - start.Hoch;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      return (point.Rechts - start.Rechts) / dx;
    } else {
      return (point.Hoch - start.Hoch) / dy;
    }
  }
}