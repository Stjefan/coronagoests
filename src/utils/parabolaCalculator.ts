import type { UsedTrasse, UsedMast, UsedLeiter, GKVector2d, GKVector3d } from '../types/usedData';

const COMPUTE_SEGMENT_POINTS = false;
const SHOW_DEBUG_INFO = false;
/**
 * Calculate the distance between two 3D points
 */
function distance3D(p1: GKVector3d, p2: GKVector3d): number {
  const dx = p2.GK.Rechts - p1.GK.Rechts;
  const dy = p2.GK.Hoch - p1.GK.Hoch;
  const dz = p2.z - p1.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Calculate a point on the parabola at a given distance along the conductor
 */
function calculateParabolaPoint(
  distanceTotal: number,
  startPoint: GKVector2d,
  endPoint: GKVector2d,
  parabelA: number,
  parabelB: number,
  parabelC: number,
  durchhang: number,
  distanceAlong: number
): GKVector3d {
  if (SHOW_DEBUG_INFO) {
  console.log("durchhang", durchhang);
  }
  // Calculate the ratio along the conductor
  const ratio = distanceAlong / distanceTotal;
  
  // Interpolate the position in the ground plane
  const gkRechts = startPoint.Rechts + ratio * (endPoint.Rechts - startPoint.Rechts);
  const gkHoch = startPoint.Hoch + ratio * (endPoint.Hoch - startPoint.Hoch);
  
  // Calculate the height using the parabola equation from VB.NET
  // Based on the test data, the equation appears to be different from what we expected
  // The VB.NET code might be using: z(s) = a*s*(L-s) + b*s + c (positive a term)
  // This would explain why we need to adjust the midpoint
  const s = distanceAlong;
  const L = distanceTotal;
  // Use positive coefficient for the parabola term to match VB.NET behavior
  const z = parabelA * s * (L - s) + parabelB * s + parabelC;
  
  return {
    GK: { Rechts: gkRechts, Hoch: gkHoch },
    z: z
  };
}

/**
 * Calculate parabola parameters for all conductors in a trasse
 * Based on the VB.NET code EintragParabelparameter
 */
export function calculateParabolaParameters(trasse: UsedTrasse): void {
  const masts = trasse.UsedMasten;
  
  // Process each mast (except the last one)
  for (let mastIndex = 0; mastIndex < masts.length - 1; mastIndex++) {
    const currentMast = masts[mastIndex];
    const nextMast = masts[mastIndex + 1];
    
    // Process each level (Ebene)
    for (const ebene of currentMast.UsedEbenen) {
      // Process left conductors
      for (const leiter of ebene.UsedLeitungenLinks) {
        calculateConductorParabola(leiter, nextMast);
      }
      
      // Process right conductors
      for (const leiter of ebene.UsedLeitungenRechts) {
        calculateConductorParabola(leiter, nextMast);
      }
    }
  }
}

/**
 * Calculate parabola parameters for a single conductor
 */
function calculateConductorParabola(leiter: UsedLeiter, nextMast: UsedMast): void {
  // Skip if no connection to next mast
  if (leiter.NextMastEbene === 0 || leiter.NextMastLeiter === 0) {
    return;
  }
  
  // Find the next conductor
  const nextLeiter = findNextConductor(nextMast, leiter.NextMastEbene, leiter.NextMastLeiter);
  if (!nextLeiter) {
    return;
  }
  
  console.log("Computing parabola parameters from Durchgangspunkt", leiter.Durchgangspunkt);
  console.log("Next Durchgangspunkt", nextLeiter.Durchgangspunkt);
  // Get start and end points
  const xA = leiter.Durchgangspunkt.GK.Rechts;
  const yA = leiter.Durchgangspunkt.GK.Hoch;
  const zA = leiter.Durchgangspunkt.z;
  
  const xB = nextLeiter.Durchgangspunkt.GK.Rechts;
  const yB = nextLeiter.Durchgangspunkt.GK.Hoch;
  const zB = nextLeiter.Durchgangspunkt.z;
  
  // Calculate horizontal distance
  const horizontalDistanceSquared = (xB - xA) * (xB - xA) + (yB - yA) * (yB - yA);
  if (horizontalDistanceSquared === 0) {
    return; // Points are at the same horizontal position
  }
  
  const horizontalDistance = Math.sqrt(horizontalDistanceSquared);
  const d = leiter.Durchhang; // Sag
  
  // Calculate parabola parameters
  // Based on the VB.NET formulas:
  // ParabelA = 4 * d / ((xB - xA)^2 + (yB - yA)^2)
  // ParabelB = (zB - zA - 4 * d) / Math.Sqrt((xB - xA)^2 + (yB - yA)^2)
  // ParabelC = zA
  leiter.ParabelA = (4 * d) / horizontalDistanceSquared;
  leiter.ParabelB = (zB - zA - 4 * d) / horizontalDistance;
  leiter.ParabelC = zA;
  
  // Calculate segment information
  leiter.BetrU = horizontalDistance;
  leiter.AmSeg = Math.floor(horizontalDistance / 5); // Segments every 5 meters
  if (leiter.AmSeg < 1) leiter.AmSeg = 1; // At least one segment
  leiter.SegLenU = horizontalDistance / leiter.AmSeg;
  
  // Initialize segment points array
  leiter.SegmentPunkte = [];
  
  if (COMPUTE_SEGMENT_POINTS) {
  // Calculate segment points
  for (let i = 0; i < leiter.AmSeg; i++) {
    const segmentDistance = i * leiter.SegLenU;
    const segmentPoint = calculateParabolaPoint(
      horizontalDistance,
      leiter.Durchgangspunkt.GK,
      nextLeiter.Durchgangspunkt.GK,
      leiter.ParabelA,
      leiter.ParabelB,
      leiter.ParabelC,
      d,
      segmentDistance
    );
    leiter.SegmentPunkte.push(segmentPoint);
  }
  }
  // Calculate midpoint
  leiter.Mittelpkt = calculateParabolaPoint(
    horizontalDistance,
    leiter.Durchgangspunkt.GK,
    nextLeiter.Durchgangspunkt.GK,
    leiter.ParabelA,
    leiter.ParabelB,
    leiter.ParabelC,
    d,
    horizontalDistance / 2
  );
  
  // Calculate total conductor length (sum of segment lengths)
  if (COMPUTE_SEGMENT_POINTS) {
  let totalLength = 0;
  for (let i = 0; i < leiter.AmSeg - 1; i++) {
    totalLength += distance3D(leiter.SegmentPunkte[i], leiter.SegmentPunkte[i + 1]);
  }
  // Add the last segment from the last segment point to the end point
  if (leiter.SegmentPunkte.length > 0) {
    const lastSegmentPoint = leiter.SegmentPunkte[leiter.SegmentPunkte.length - 1];
    totalLength += distance3D(lastSegmentPoint, nextLeiter.Durchgangspunkt);
  }
  leiter.LeiterLen = totalLength;
}
}

/**
 * Find the next conductor based on NextMastEbene and NextMastLeiter values
 */
function findNextConductor(nextMast: UsedMast, nextMastEbene: number, nextMastLeiter: number): UsedLeiter | null {
  // Find the target level
  const targetEbene = nextMast.UsedEbenen.find(e => e.NummerEbene === nextMastEbene);
  if (!targetEbene) {
    return null;
  }
  
  if (nextMastLeiter < 0) {
    // Negative value indicates left conductor
    const index = -nextMastLeiter - 1;
    if (index >= 0 && index < targetEbene.UsedLeitungenLinks.length) {
      return targetEbene.UsedLeitungenLinks[index];
    }
  } else if (nextMastLeiter > 0) {
    // Positive value indicates right conductor
    const index = nextMastLeiter - 1;
    if (index >= 0 && index < targetEbene.UsedLeitungenRechts.length) {
      return targetEbene.UsedLeitungenRechts[index];
    }
  }
  
  return null;
}

/**
 * Calculate parabola parameters for multiple trassen
 */
export function calculateParabolaParametersForAll(trassen: UsedTrasse[]): void {
  for (const trasse of trassen) {
    calculateParabolaParameters(trasse);
  }
}