// Vector math utilities for calculating orientations

import type { vector2d, GKVector2d } from '../types/usedData';

/**
 * Calculate the direction vector from point A to point B
 */
export function directionVector(from: vector2d, to: vector2d): vector2d {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  
  return {
    x: dx,
    y: dy,
    Length: length
  };
}

/**
 * Calculate the direction vector for GK coordinates
 */
export function directionVectorGK(from: GKVector2d, to: GKVector2d): GKVector2d {
  const dRechts = to.Rechts - from.Rechts;
  const dHoch = to.Hoch - from.Hoch;
  
  return {
    Rechts: dRechts,
    Hoch: dHoch
  };
}

/**
 * Calculate the normal (perpendicular) vector to a direction
 * Rotates 90 degrees counter-clockwise
 */
export function normalVector(direction: vector2d): vector2d {
  // Normalize first
  const length = direction.Length || Math.sqrt(direction.x * direction.x + direction.y * direction.y);
  if (length === 0) {
    return { x: 0, y: 1, Length: 1 };
  }
  
  const nx = direction.x / length;
  const ny = direction.y / length;
  
  // Rotate 90 degrees counter-clockwise: (x,y) -> (-y,x)
  return {
    x: -ny,
    y: nx,
    Length: 1
  };
}

/**
 * Calculate the normal vector for GK coordinates
 */
export function normalVectorGK(direction: GKVector2d): GKVector2d {
  const length = Math.sqrt(direction.Rechts * direction.Rechts + direction.Hoch * direction.Hoch);
  if (length === 0) {
    return { Rechts: 0, Hoch: 1 };
  }
  
  const nx = direction.Rechts / length;
  const ny = direction.Hoch / length;
  
  // Rotate 90 degrees counter-clockwise
  return {
    Rechts: -ny,
    Hoch: nx
  };
}

/**
 * Calculate the angle bisector between two vectors from a center point
 * @param center The center point (current mast)
 * @param prev The previous point (previous mast)
 * @param next The next point (next mast)
 */
export function angleBisector(center: vector2d, prev: vector2d, next: vector2d): vector2d {
  // Get direction vectors from center to prev and next
  const toPrev = directionVector(center, prev);
  const toNext = directionVector(center, next);
  
  // Normalize them
  const prevLength = toPrev.Length || Math.sqrt(toPrev.x * toPrev.x + toPrev.y * toPrev.y);
  const nextLength = toNext.Length || Math.sqrt(toNext.x * toNext.x + toNext.y * toNext.y);
  
  if (prevLength === 0 || nextLength === 0) {
    return { x: 0, y: 1, Length: 1 };
  }
  
  const prevNorm = {
    x: toPrev.x / prevLength,
    y: toPrev.y / prevLength
  };
  
  const nextNorm = {
    x: toNext.x / nextLength,
    y: toNext.y / nextLength
  };
  
  // The bisector is the sum of the normalized vectors
  let bisectorX = prevNorm.x + nextNorm.x;
  let bisectorY = prevNorm.y + nextNorm.y;
  
  // Normalize the result
  const bisectorLength = Math.sqrt(bisectorX * bisectorX + bisectorY * bisectorY);
  
  if (bisectorLength < 0.001) {
    // Vectors are opposite, use perpendicular to one of them
    return normalVector(toNext);
  }
  
  bisectorX /= bisectorLength;
  bisectorY /= bisectorLength;
  
  // The bisector should be perpendicular to the angle bisector direction
  // So we rotate it 90 degrees
  return {
    x: -bisectorY,
    y: bisectorX,
    Length: 1
  };
}

/**
 * Calculate the angle bisector for GK coordinates
 */
export function angleBisectorGK(center: GKVector2d, prev: GKVector2d, next: GKVector2d): GKVector2d {
  const toPrev = directionVectorGK(center, prev);
  const toNext = directionVectorGK(center, next);
  
  const prevLength = Math.sqrt(toPrev.Rechts * toPrev.Rechts + toPrev.Hoch * toPrev.Hoch);
  const nextLength = Math.sqrt(toNext.Rechts * toNext.Rechts + toNext.Hoch * toNext.Hoch);
  
  if (prevLength === 0 || nextLength === 0) {
    return { Rechts: 0, Hoch: 1 };
  }
  
  const prevNorm = {
    Rechts: toPrev.Rechts / prevLength,
    Hoch: toPrev.Hoch / prevLength
  };
  
  const nextNorm = {
    Rechts: toNext.Rechts / nextLength,
    Hoch: toNext.Hoch / nextLength
  };
  
  let bisectorRechts = prevNorm.Rechts + nextNorm.Rechts;
  let bisectorHoch = prevNorm.Hoch + nextNorm.Hoch;
  
  const bisectorLength = Math.sqrt(bisectorRechts * bisectorRechts + bisectorHoch * bisectorHoch);
  
  if (bisectorLength < 0.001) {
    return normalVectorGK(toNext);
  }
  
  bisectorRechts /= bisectorLength;
  bisectorHoch /= bisectorLength;
  
  // Rotate 90 degrees for perpendicular
  return {
    Rechts: -bisectorHoch,
    Hoch: bisectorRechts
  };
}

/**
 * Calculate orientations for all masts in a sequence
 * @param mastPositions Array of mast positions (OVektor)
 * @param mastPositionsGK Array of mast positions (GK coordinates)
 * @returns Array of orientations for each mast
 */
export function calculateMastOrientations(
  mastPositions: vector2d[],
  mastPositionsGK: GKVector2d[]
): { ausrichtung: vector2d, gkAusrichtung: GKVector2d }[] {
  const orientations: { ausrichtung: vector2d, gkAusrichtung: GKVector2d }[] = [];
  const n = mastPositions.length;
  
  if (n === 0) return orientations;
  
  if (n === 1) {
    // Single mast - default orientation
    orientations.push({
      ausrichtung: { x: 0, y: 1, Length: 1 },
      gkAusrichtung: { Rechts: 0, Hoch: 1 }
    });
    return orientations;
  }
  
  for (let i = 0; i < n; i++) {
    if (i === 0) {
      // First mast: perpendicular to direction to next mast
      const dirToNext = directionVector(mastPositions[0], mastPositions[1]);
      const dirToNextGK = directionVectorGK(mastPositionsGK[0], mastPositionsGK[1]);
      
      orientations.push({
        ausrichtung: normalVector(dirToNext),
        gkAusrichtung: normalVectorGK(dirToNextGK)
      });
    } else if (i === n - 1) {
      // Last mast: perpendicular to direction from previous mast
      const dirFromPrev = directionVector(mastPositions[i - 1], mastPositions[i]);
      const dirFromPrevGK = directionVectorGK(mastPositionsGK[i - 1], mastPositionsGK[i]);
      
      orientations.push({
        ausrichtung: normalVector(dirFromPrev),
        gkAusrichtung: normalVectorGK(dirFromPrevGK)
      });
    } else {
      // Middle masts: angle bisector
      orientations.push({
        ausrichtung: angleBisector(mastPositions[i], mastPositions[i - 1], mastPositions[i + 1]),
        gkAusrichtung: angleBisectorGK(mastPositionsGK[i], mastPositionsGK[i - 1], mastPositionsGK[i + 1])
      });
    }
  }
  
  return orientations;
}