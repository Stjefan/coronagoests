/* eslint-disable @typescript-eslint/no-explicit-any */
// Test script to verify transformation handles pole height changes correctly
// This test demonstrates the issue where Durchgangspunkt is not recalculated properly
// when GUI values like pole height are modified

import { describe, it, expect } from 'vitest';
import { computationToUI, uiToComputation } from '../utils/trasseTransformNew';
import type { UsedTrasse, HLeitertypData } from '../types/usedData';

const files: Record<string, any> = import.meta.glob('../test/data/**/*.json', { eager: true });

describe('Transformation with Modified Pole Height', () => {
  it('should recalculate Durchgangspunkt when pole height is modified', () => {
    // Load test data
    const data = files['../test/data/trasse4gelaende.json'];
    const projectData = data.ProjectData;
    
    console.log('Testing Transformation with Modified Pole Height...\n');
    console.log('='.repeat(60));
    
    const originalTrasse: UsedTrasse = projectData.Trassen[0];
    console.log(`\n1. ORIGINAL DATA FROM trasse4gelaende.json:`);
    console.log(`Trasse: ${originalTrasse.Name}`);
    console.log(`Number of Masts: ${originalTrasse.UsedMasten.length}`);
    
    // Show original values for first mast
    const firstMast = originalTrasse.UsedMasten[0];
    console.log(`\nFirst Mast "${firstMast.Name}":`);
    console.log(`  - MastHoehe: ${firstMast.MastHoehe}`);
    console.log(`  - NullpunktHoehe: ${firstMast.NullpunktHoehe}`);
    console.log(`  - Fusspunkt.z: ${firstMast.Fusspunkt.GK_Vektor.z}`);
    console.log(`  - GKAusrichtung: Rechts=${firstMast.GKAusrichtung.Rechts.toFixed(2)}, Hoch=${firstMast.GKAusrichtung.Hoch.toFixed(2)}`);
    
    const originalLeiter = firstMast.UsedEbenen[0]?.UsedLeitungenLinks[0];
    if (originalLeiter) {
      console.log(`  - First Conductor (Left):`);
      console.log(`    - AbstandMastachse: ${originalLeiter.AbstandMastachse}`);
      console.log(`    - Durchgangspunkt.z: ${originalLeiter.Durchgangspunkt.z}`);
      console.log(`    - Durchgangspunkt.GK: Rechts=${originalLeiter.Durchgangspunkt.GK.Rechts.toFixed(2)}, Hoch=${originalLeiter.Durchgangspunkt.GK.Hoch.toFixed(2)}`);
    }
    
    // Step 2: Convert to UI format
    console.log('\n2. CONVERTING TO UI FORMAT:');
    const templateId = 'template_test';
    const uiResult = computationToUI(originalTrasse, templateId);
    
    expect(uiResult.poles.size).toBe(originalTrasse.UsedMasten.length);
    
    // Get first pole and show its values
    const firstPoleId = uiResult.trasse.poleIds[0];
    const firstPole = uiResult.poles.get(firstPoleId);
    expect(firstPole).toBeDefined();
    
    if (!firstPole) throw new Error('First pole not found');
    
    console.log(`\nFirst Pole "${firstPole.name}":`);
    console.log(`  - poleHeight: ${firstPole.poleHeight}`);
    console.log(`  - nullpunktHeight: ${firstPole.nullpunktHeight}`);
    console.log(`  - position.z: ${firstPole.position.z}`);
    
    const firstConn = firstPole.levels[0]?.leftConnections[0];
    if (firstConn) {
      console.log(`  - First Connection (Left):`);
      console.log(`    - horizontalDistance2Pole: ${firstConn.horizontalDistance2Pole}`);
      if (firstConn.durchgangspunktZ !== undefined) {
        console.log(`    - Stored durchgangspunktZ: ${firstConn.durchgangspunktZ}`);
        console.log(`    - Stored durchgangspunktGK: Rechts=${firstConn.durchgangspunktGK?.Rechts?.toFixed(2)}, Hoch=${firstConn.durchgangspunktGK?.Hoch?.toFixed(2)}`);
      }
    }
    
    // Store original values for comparison
    const originalPoleHeight = firstPole.poleHeight;
    const originalDurchgangspunktZ = originalLeiter?.Durchgangspunkt.z || 0;
    const originalDurchgangspunktGKRechts = originalLeiter?.Durchgangspunkt.GK.Rechts || 0;
    const originalDurchgangspunktGKHoch = originalLeiter?.Durchgangspunkt.GK.Hoch || 0;
    
    // Step 3: Modify pole height to 1000
    console.log('\n3. MODIFYING POLE HEIGHT TO 1000:');
    const modifiedPoles = new Map(uiResult.poles);
    modifiedPoles.forEach((pole) => {
      const oldHeight = pole.poleHeight;
      pole.poleHeight = 1000;
      console.log(`  - Changed pole "${pole.name}" height from ${oldHeight} to ${pole.poleHeight}`);
    });
    
    // Step 4: Convert back to computation format
    console.log('\n4. CONVERTING BACK TO COMPUTATION FORMAT:');
    const leiterTypes: HLeitertypData[] = projectData.LeiterTypes || [];
    const computationTrasse = uiToComputation(
      uiResult.trasse,
      modifiedPoles,
      uiResult.connectionLines,
      leiterTypes
    );
    
    expect(computationTrasse.UsedMasten.length).toBe(originalTrasse.UsedMasten.length);
    
    // Step 5: Compare the results
    console.log('\n5. COMPARING RESULTS:');
    const newFirstMast = computationTrasse.UsedMasten[0];
    console.log(`\nFirst Mast After Transformation "${newFirstMast.Name}":`);
    console.log(`  - MastHoehe: ${newFirstMast.MastHoehe} (should be 1000)`);
    
    // Verify pole height was updated
    expect(newFirstMast.MastHoehe).toBe(1000);
    
    const newFirstLeiter = newFirstMast.UsedEbenen[0]?.UsedLeitungenLinks[0];
    if (newFirstLeiter && originalLeiter) {
      console.log(`  - First Conductor (Left):`);
      console.log(`    - AbstandMastachse: ${newFirstLeiter.AbstandMastachse}`);
      console.log(`    - Durchgangspunkt.z: ${newFirstLeiter.Durchgangspunkt.z}`);
      console.log(`    - Durchgangspunkt.GK: Rechts=${newFirstLeiter.Durchgangspunkt.GK.Rechts.toFixed(2)}, Hoch=${newFirstLeiter.Durchgangspunkt.GK.Hoch.toFixed(2)}`);
      
      // Calculate expected values
      const levelHeight = firstPole.levels[0].levelHeight;
      const expectedZ = firstPole.position.z + levelHeight;
      
      console.log(`\n  Expected Durchgangspunkt.z calculation:`);
      console.log(`    - Pole position.z: ${firstPole.position.z}`);
      console.log(`    - Level height: ${levelHeight}`);
      console.log(`    - Expected z: ${expectedZ}`);
      console.log(`    - Actual z: ${newFirstLeiter.Durchgangspunkt.z}`);
      console.log(`    - Difference: ${Math.abs(expectedZ - newFirstLeiter.Durchgangspunkt.z).toFixed(2)}`);
      
      // Step 6: Verify the issue
      console.log('\n6. ISSUE VERIFICATION:');
      console.log('\nDurchgangspunkt.z comparison:');
      console.log(`  - Original: ${originalDurchgangspunktZ}`);
      console.log(`  - After height change: ${newFirstLeiter.Durchgangspunkt.z}`);
      console.log(`  - Difference: ${(newFirstLeiter.Durchgangspunkt.z - originalDurchgangspunktZ).toFixed(2)}`);
      
      const heightDifference = 1000 - originalPoleHeight;
      console.log(`\nPole height changed by: ${heightDifference}`);
      
      // Check if the transformation preserved stored values instead of recalculating
      if (Math.abs(newFirstLeiter.Durchgangspunkt.z - originalDurchgangspunktZ) < 1) {
        console.log('\n❌ ISSUE CONFIRMED: Durchgangspunkt.z is not being recalculated!');
        console.log('   The stored values are being used instead of recalculating based on GUI values.');
        
        // This test should fail to highlight the issue
        expect(Math.abs(newFirstLeiter.Durchgangspunkt.z - originalDurchgangspunktZ)).toBeGreaterThan(1);
      } else {
        console.log('\n✅ SUCCESS: Durchgangspunkt.z has been recalculated correctly!');
        console.log(`   Change in z: ${(newFirstLeiter.Durchgangspunkt.z - originalDurchgangspunktZ).toFixed(2)}`);
        
        // Verify the z-coordinate changed appropriately
        expect(Math.abs(newFirstLeiter.Durchgangspunkt.z - originalDurchgangspunktZ)).toBeGreaterThan(1);
      }
      
      // Check GK coordinates
      console.log('\nDurchgangspunkt.GK comparison:');
      console.log(`  - Original Rechts: ${originalDurchgangspunktGKRechts.toFixed(2)}`);
      console.log(`  - New Rechts: ${newFirstLeiter.Durchgangspunkt.GK.Rechts.toFixed(2)}`);
      console.log(`  - Original Hoch: ${originalDurchgangspunktGKHoch.toFixed(2)}`);
      console.log(`  - New Hoch: ${newFirstLeiter.Durchgangspunkt.GK.Hoch.toFixed(2)}`);
      
      // Note: GK coordinates should remain the same because pole height doesn't affect horizontal position
      if (Math.abs(newFirstLeiter.Durchgangspunkt.GK.Rechts - originalDurchgangspunktGKRechts) < 0.1 &&
          Math.abs(newFirstLeiter.Durchgangspunkt.GK.Hoch - originalDurchgangspunktGKHoch) < 0.1) {
        console.log('\n✅ GK coordinates are correctly unchanged (pole height does not affect horizontal position)');
        
        // This is expected behavior
        expect(Math.abs(newFirstLeiter.Durchgangspunkt.GK.Rechts - originalDurchgangspunktGKRechts)).toBeLessThan(0.1);
        expect(Math.abs(newFirstLeiter.Durchgangspunkt.GK.Hoch - originalDurchgangspunktGKHoch)).toBeLessThan(0.1);
      } else {
        console.log('\n⚠️ WARNING: GK coordinates changed unexpectedly!');
        // This would be unexpected
        expect(Math.abs(newFirstLeiter.Durchgangspunkt.GK.Rechts - originalDurchgangspunktGKRechts)).toBeLessThan(0.1);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('Test completed. The issue is that Durchgangspunkt values are not');
    console.log('being recalculated when GUI values like pole height are modified.');
    console.log('The transformation should use the GUI values (NullpunktHoehe, MastHoehe,');
    console.log('GKAusrichtung, AbstandMastachse) to compute new Durchgangspunkt values.');
  });
});