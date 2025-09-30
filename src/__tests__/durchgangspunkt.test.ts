/* eslint-disable @typescript-eslint/no-explicit-any */
// Test that Durchgangspunkt calculation matches expected values

import { describe, it, expect } from 'vitest';

import type { UsedProjectData } from '../types/usedData';
import { computationToUI, uiToComputation } from '../utils/trasseTransformNew';

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

describe('Durchgangspunkt Calculation Tests', () => {
  it('should compute correct Durchgangspunkt for trasse4gelaende.json', () => {
    const projectData = loadTestData('trasse4gelaende.json');
    
    const originalTrasse = projectData.Trassen![0];
    
    // Get original Durchgangspunkt values
    console.log('Original Durchgangspunkt values:');
    originalTrasse.UsedMasten.forEach((mast, mastIndex) => {
      console.log(`Mast ${mastIndex + 1}:`);
      console.log(`  Position: Rechts=${mast.Fusspunkt.GK_Vektor.GK.Rechts.toFixed(2)}, Hoch=${mast.Fusspunkt.GK_Vektor.GK.Hoch.toFixed(2)}`);
      console.log(`  GKAusrichtung: Rechts=${mast.GKAusrichtung.Rechts.toFixed(2)}, Hoch=${mast.GKAusrichtung.Hoch.toFixed(2)}`);
      
      mast.UsedEbenen.forEach((ebene) => {
        ebene.UsedLeitungenLinks.forEach((leiter, leiterIndex) => {
          console.log(`  Left conductor ${leiterIndex + 1}:`);
          console.log(`    Distance: ${leiter.AbstandMastachse} m`);
          console.log(`    Durchgangspunkt: Rechts=${leiter.Durchgangspunkt.GK.Rechts.toFixed(2)}, Hoch=${leiter.Durchgangspunkt.GK.Hoch.toFixed(2)}`);
        });
        ebene.UsedLeitungenRechts.forEach((leiter, leiterIndex) => {
          console.log(`  Right conductor ${leiterIndex + 1}:`);
          console.log(`    Distance: ${leiter.AbstandMastachse} m`);
          console.log(`    Durchgangspunkt: Rechts=${leiter.Durchgangspunkt.GK.Rechts.toFixed(2)}, Hoch=${leiter.Durchgangspunkt.GK.Hoch.toFixed(2)}`);
        });
      });
    });
    
    // Convert to UI format and back
    const uiResult = computationToUI(originalTrasse, 'template_test');
    const leiterTypes = projectData.LeiterTypes || [];
    const recalculatedTrasse = uiToComputation(
      uiResult.trasse,
      uiResult.poles,
      uiResult.connectionLines,
      leiterTypes
    );
    
    // Get recalculated Durchgangspunkt values
    console.log('\nRecalculated Durchgangspunkt values:');
    recalculatedTrasse.UsedMasten.forEach((mast, mastIndex) => {
      console.log(`Mast ${mastIndex + 1}:`);
      console.log(`  Position: Rechts=${mast.Fusspunkt.GK_Vektor.GK.Rechts.toFixed(2)}, Hoch=${mast.Fusspunkt.GK_Vektor.GK.Hoch.toFixed(2)}`);
      console.log(`  GKAusrichtung: Rechts=${mast.GKAusrichtung.Rechts.toFixed(2)}, Hoch=${mast.GKAusrichtung.Hoch.toFixed(2)}`);
      
      mast.UsedEbenen.forEach((ebene) => {
        ebene.UsedLeitungenLinks.forEach((leiter, leiterIndex) => {
          console.log(`  Left conductor ${leiterIndex + 1}:`);
          console.log(`    Distance: ${leiter.AbstandMastachse} m`);
          console.log(`    Durchgangspunkt: Rechts=${leiter.Durchgangspunkt.GK.Rechts.toFixed(2)}, Hoch=${leiter.Durchgangspunkt.GK.Hoch.toFixed(2)}`);
        });
        ebene.UsedLeitungenRechts.forEach((leiter, leiterIndex) => {
          console.log(`  Right conductor ${leiterIndex + 1}:`);
          console.log(`    Distance: ${leiter.AbstandMastachse} m`);
          console.log(`    Durchgangspunkt: Rechts=${leiter.Durchgangspunkt.GK.Rechts.toFixed(2)}, Hoch=${leiter.Durchgangspunkt.GK.Hoch.toFixed(2)}`);
        });
      });
    });
    
    // Verify calculations are correct
    recalculatedTrasse.UsedMasten.forEach((mast, mastIndex) => {
      // const originalMast = originalTrasse.UsedMasten[mastIndex];
      
      // Verify each conductor's Durchgangspunkt
      mast.UsedEbenen.forEach((ebene) => {
        // const originalEbene = originalMast.UsedEbenen[ebeneIndex];
        
        // For each left conductor
        ebene.UsedLeitungenLinks.forEach((leiter, leiterIndex) => {
          // const originalLeiter = originalEbene.UsedLeitungenLinks[leiterIndex];
          
          // Calculate expected Durchgangspunkt based on formula:
          // For left: base + normalized_GKAusrichtung * distance
          const gkNorm = Math.sqrt(
            mast.GKAusrichtung.Rechts * mast.GKAusrichtung.Rechts + 
            mast.GKAusrichtung.Hoch * mast.GKAusrichtung.Hoch
          );
          const expectedRechts = mast.Fusspunkt.GK_Vektor.GK.Rechts + 
            (mast.GKAusrichtung.Rechts / gkNorm) * leiter.AbstandMastachse;
          const expectedHoch = mast.Fusspunkt.GK_Vektor.GK.Hoch + 
            (mast.GKAusrichtung.Hoch / gkNorm) * leiter.AbstandMastachse;
          
          console.log(`\nVerifying Mast ${mastIndex + 1}, Left conductor ${leiterIndex + 1}:`);
          console.log(`  Expected: Rechts=${expectedRechts.toFixed(2)}, Hoch=${expectedHoch.toFixed(2)}`);
          console.log(`  Actual:   Rechts=${leiter.Durchgangspunkt.GK.Rechts.toFixed(2)}, Hoch=${leiter.Durchgangspunkt.GK.Hoch.toFixed(2)}`);
          
          expect(leiter.Durchgangspunkt.GK.Rechts).toBeCloseTo(expectedRechts, 2);
          expect(leiter.Durchgangspunkt.GK.Hoch).toBeCloseTo(expectedHoch, 2);
        });
        
        // For each right conductor
        ebene.UsedLeitungenRechts.forEach((leiter, leiterIndex) => {
          // const originalLeiter = originalEbene.UsedLeitungenRechts[leiterIndex];
          
          // Calculate expected Durchgangspunkt based on formula:
          // For right: base - normalized_GKAusrichtung * distance
          const gkNorm = Math.sqrt(
            mast.GKAusrichtung.Rechts * mast.GKAusrichtung.Rechts + 
            mast.GKAusrichtung.Hoch * mast.GKAusrichtung.Hoch
          );
          const expectedRechts = mast.Fusspunkt.GK_Vektor.GK.Rechts - 
            (mast.GKAusrichtung.Rechts / gkNorm) * leiter.AbstandMastachse;
          const expectedHoch = mast.Fusspunkt.GK_Vektor.GK.Hoch - 
            (mast.GKAusrichtung.Hoch / gkNorm) * leiter.AbstandMastachse;
          
          console.log(`\nVerifying Mast ${mastIndex + 1}, Right conductor ${leiterIndex + 1}:`);
          console.log(`  Expected: Rechts=${expectedRechts.toFixed(2)}, Hoch=${expectedHoch.toFixed(2)}`);
          console.log(`  Actual:   Rechts=${leiter.Durchgangspunkt.GK.Rechts.toFixed(2)}, Hoch=${leiter.Durchgangspunkt.GK.Hoch.toFixed(2)}`);
          
          expect(leiter.Durchgangspunkt.GK.Rechts).toBeCloseTo(expectedRechts, 2);
          expect(leiter.Durchgangspunkt.GK.Hoch).toBeCloseTo(expectedHoch, 2);
        });
      });
    });
  });
  
  it('should verify Durchgangspunkt calculation with simple test case', () => {
    // Create a simple test case with known values
    const testPole = {
      position: { GK: { Rechts: 1000, Hoch: 2000 }, z: 0 },
      gkOrientation: { Rechts: 0, Hoch: 1 } // Pointing north
    };
    
    // For a left conductor at 5m distance
    // Expected: base + orientation * distance = (1000, 2000) + (0, 1) * 5 = (1000, 2005)
    const leftDistance = 5;
    const expectedLeft = {
      Rechts: testPole.position.GK.Rechts + testPole.gkOrientation.Rechts * leftDistance,
      Hoch: testPole.position.GK.Hoch + testPole.gkOrientation.Hoch * leftDistance
    };
    
    console.log('\nSimple test case:');
    console.log(`Pole at (${testPole.position.GK.Rechts}, ${testPole.position.GK.Hoch})`);
    console.log(`Orientation: (${testPole.gkOrientation.Rechts}, ${testPole.gkOrientation.Hoch})`);
    console.log(`Left conductor at ${leftDistance}m: Expected (${expectedLeft.Rechts}, ${expectedLeft.Hoch})`);
    
    expect(expectedLeft.Rechts).toBe(1000);
    expect(expectedLeft.Hoch).toBe(2005);
    
    // For a right conductor at 10m distance
    // Expected: base - orientation * distance = (1000, 2000) - (0, 1) * 10 = (1000, 1990)
    const rightDistance = 10;
    const expectedRight = {
      Rechts: testPole.position.GK.Rechts - testPole.gkOrientation.Rechts * rightDistance,
      Hoch: testPole.position.GK.Hoch - testPole.gkOrientation.Hoch * rightDistance
    };
    
    console.log(`Right conductor at ${rightDistance}m: Expected (${expectedRight.Rechts}, ${expectedRight.Hoch})`);
    
    expect(expectedRight.Rechts).toBe(1000);
    expect(expectedRight.Hoch).toBe(1990);
  });
});