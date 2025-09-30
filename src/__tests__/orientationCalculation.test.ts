/* eslint-disable @typescript-eslint/no-explicit-any */
// Test that orientation calculations match expected values

import { describe, it, expect } from 'vitest';

import type { UsedProjectData } from '../types/usedData';
import { computationToUI, uiToComputation } from '../utils/trasseTransformNew';
import { calculateMastOrientations } from '../utils/vectorMath';

const files: Record<string, any> = import.meta.glob('../test/data/**/*.json', { eager: true });

// Helper function to load test data
function loadTestData(filename: string): UsedProjectData {
  const data = files[`../test/data/${filename}.json`];
  
  if (data.ProjectData) {
    if (data.ProjectData.LeiterTypes) {
      data.ProjectData.LeiterTypes = data.ProjectData.LeiterTypes.map((lt: any) => ({
        ...lt,
        Name: lt.Name.trim()
      }));
    }
    return data.ProjectData;
  }
  
  return data;
}

describe('Orientation Calculation Tests', () => {
  it('should compute correct orientations for trasse4gelaende.json', () => {
    const projectData = loadTestData('trasse4gelaende.json');
    
    expect(projectData.Trassen).toBeDefined();
    expect(projectData.Trassen!.length).toBe(1);
    
    const originalTrasse = projectData.Trassen![0];
    
    // Get original orientations (normalized)
    const originalOrientations = originalTrasse.UsedMasten.map(mast => {
      const length = Math.sqrt(
        mast.Ausrichtung.x * mast.Ausrichtung.x + 
        mast.Ausrichtung.y * mast.Ausrichtung.y
      );
      return {
        x: mast.Ausrichtung.x / length,
        y: mast.Ausrichtung.y / length,
        gkRechts: mast.GKAusrichtung.Rechts,
        gkHoch: mast.GKAusrichtung.Hoch
      };
    });
    
    console.log('Original orientations (normalized):');
    originalOrientations.forEach((o, i) => {
      console.log(`  Mast ${i + 1}: x=${o.x.toFixed(4)}, y=${o.y.toFixed(4)}, GK=(${o.gkRechts.toFixed(2)}, ${o.gkHoch.toFixed(2)})`);
    });
    
    // Convert to UI format and back to trigger recalculation
    const uiResult = computationToUI(originalTrasse, 'template_test');
    const leiterTypes = projectData.LeiterTypes || [];
    const recalculatedTrasse = uiToComputation(
      uiResult.trasse,
      uiResult.poles,
      uiResult.connectionLines,
      leiterTypes
    );
    
    // Get recalculated orientations
    const recalculatedOrientations = recalculatedTrasse.UsedMasten.map(mast => ({
      x: mast.Ausrichtung.x,
      y: mast.Ausrichtung.y,
      gkRechts: mast.GKAusrichtung.Rechts,
      gkHoch: mast.GKAusrichtung.Hoch
    }));
    
    console.log('Recalculated orientations:');
    recalculatedOrientations.forEach((o, i) => {
      console.log(`  Mast ${i + 1}: x=${o.x.toFixed(4)}, y=${o.y.toFixed(4)}, GK=(${o.gkRechts.toFixed(2)}, ${o.gkHoch.toFixed(2)})`);
    });
    
    // Test the calculated orientations are correct based on mast positions
    const mast1Pos = originalTrasse.UsedMasten[0].Fusspunkt.GK_Vektor.GK;
    const mast2Pos = originalTrasse.UsedMasten[1].Fusspunkt.GK_Vektor.GK;
    
    // Direction from mast1 to mast2
    const directionX = mast2Pos.Rechts - mast1Pos.Rechts;
    const directionY = mast2Pos.Hoch - mast1Pos.Hoch;
    const dirLength = Math.sqrt(directionX * directionX + directionY * directionY);
    const dirNormX = directionX / dirLength;
    const dirNormY = directionY / dirLength;
    
    console.log(`\nDirection from Mast 1 to Mast 2: (${dirNormX.toFixed(4)}, ${dirNormY.toFixed(4)})`);
    
    // Expected orientation for first mast: perpendicular to direction (rotate 90° CCW)
    const expectedMast1X = -dirNormY;
    const expectedMast1Y = dirNormX;
    
    console.log(`Expected Mast 1 orientation: (${expectedMast1X.toFixed(4)}, ${expectedMast1Y.toFixed(4)})`);
    
    // Expected orientation for last mast: same as first (perpendicular to direction)
    const expectedMast2X = -dirNormY;
    const expectedMast2Y = dirNormX;
    
    console.log(`Expected Mast 2 orientation: (${expectedMast2X.toFixed(4)}, ${expectedMast2Y.toFixed(4)})`);
    
    // Verify recalculated orientations match expected
    expect(recalculatedOrientations[0].x).toBeCloseTo(expectedMast1X, 4);
    expect(recalculatedOrientations[0].y).toBeCloseTo(expectedMast1Y, 4);
    expect(recalculatedOrientations[1].x).toBeCloseTo(expectedMast2X, 4);
    expect(recalculatedOrientations[1].y).toBeCloseTo(expectedMast2Y, 4);
    
    // Check if recalculated GK orientations match expected
    // GK orientation should also be perpendicular to the direction
    const expectedGKRechts = -dirNormY;
    const expectedGKHoch = dirNormX;
    
    console.log(`\nExpected GK orientation: Rechts=${expectedGKRechts.toFixed(4)}, Hoch=${expectedGKHoch.toFixed(4)}`);
    
    // The GK orientations in the original data are not normalized, but should point in same direction
    const originalGKLength = Math.sqrt(
      originalTrasse.UsedMasten[0].GKAusrichtung.Rechts * originalTrasse.UsedMasten[0].GKAusrichtung.Rechts +
      originalTrasse.UsedMasten[0].GKAusrichtung.Hoch * originalTrasse.UsedMasten[0].GKAusrichtung.Hoch
    );
    const originalGKNormRechts = originalTrasse.UsedMasten[0].GKAusrichtung.Rechts / originalGKLength;
    const originalGKNormHoch = originalTrasse.UsedMasten[0].GKAusrichtung.Hoch / originalGKLength;
    
    console.log(`Original GK orientation (normalized): Rechts=${originalGKNormRechts.toFixed(4)}, Hoch=${originalGKNormHoch.toFixed(4)}`);
    
    // Check that our calculation matches the expected perpendicular direction
    expect(recalculatedOrientations[0].gkRechts).toBeCloseTo(expectedGKRechts, 4);
    expect(recalculatedOrientations[0].gkHoch).toBeCloseTo(expectedGKHoch, 4);
  });
  
  it('should verify orientation calculation logic with simple test case', () => {
    // Test with simple positions to verify the logic
    const mastPositions = [
      { x: 0, y: 0, Length: 0 },      // Mast 1 at origin
      { x: 100, y: 0, Length: 100 }   // Mast 2 at (100, 0)
    ];
    
    const mastPositionsGK = [
      { Rechts: 0, Hoch: 0 },
      { Rechts: 100, Hoch: 0 }
    ];
    
    const orientations = calculateMastOrientations(mastPositions, mastPositionsGK);
    
    console.log('\nSimple test case:');
    console.log('Mast positions: (0,0) and (100,0)');
    console.log('Direction vector: (1,0)');
    console.log('Expected perpendicular: (0,1)');
    
    orientations.forEach((o, i) => {
      console.log(`  Mast ${i + 1}: Ausrichtung=(${o.ausrichtung.x.toFixed(4)}, ${o.ausrichtung.y.toFixed(4)})`);
    });
    
    // Direction is (1, 0), so perpendicular should be (0, 1)
    expect(orientations[0].ausrichtung.x).toBeCloseTo(0, 4);
    expect(orientations[0].ausrichtung.y).toBeCloseTo(1, 4);
    expect(orientations[1].ausrichtung.x).toBeCloseTo(0, 4);
    expect(orientations[1].ausrichtung.y).toBeCloseTo(1, 4);
  });
  
  it('should handle angle bisector for middle masts', () => {
    // Test with 3 masts forming an angle
    const mastPositions = [
      { x: 0, y: 0, Length: 0 },       // Mast 1
      { x: 100, y: 0, Length: 100 },   // Mast 2
      { x: 100, y: 100, Length: 141.42 } // Mast 3
    ];
    
    const mastPositionsGK = [
      { Rechts: 0, Hoch: 0 },
      { Rechts: 100, Hoch: 0 },
      { Rechts: 100, Hoch: 100 }
    ];
    
    const orientations = calculateMastOrientations(mastPositions, mastPositionsGK);
    
    console.log('\nAngle bisector test:');
    console.log('Mast positions: (0,0), (100,0), (100,100)');
    
    orientations.forEach((o, i) => {
      console.log(`  Mast ${i + 1}: Ausrichtung=(${o.ausrichtung.x.toFixed(4)}, ${o.ausrichtung.y.toFixed(4)})`);
      const length = Math.sqrt(o.ausrichtung.x * o.ausrichtung.x + o.ausrichtung.y * o.ausrichtung.y);
      console.log(`    Length: ${length.toFixed(4)}`);
    });
    
    // First mast: perpendicular to direction to mast 2 (direction is (1,0), perpendicular is (0,1))
    expect(orientations[0].ausrichtung.x).toBeCloseTo(0, 4);
    expect(orientations[0].ausrichtung.y).toBeCloseTo(1, 4);
    
    // Middle mast: angle bisector
    // Direction from mast 1 to mast 2: (1, 0)
    // Direction from mast 2 to mast 3: (0, 1)
    // Bisector of these directions: (1, 1) normalized = (0.707, 0.707)
    // Perpendicular to bisector (rotated 90° CCW): (-0.707, -0.707)
    expect(orientations[1].ausrichtung.x).toBeCloseTo(-0.7071, 3);
    expect(orientations[1].ausrichtung.y).toBeCloseTo(-0.7071, 3);
    
    // Last mast: perpendicular to direction from mast 2 (direction is (0,1), perpendicular is (-1,0))
    expect(orientations[2].ausrichtung.x).toBeCloseTo(-1, 4);
    expect(orientations[2].ausrichtung.y).toBeCloseTo(0, 4);
  });
});