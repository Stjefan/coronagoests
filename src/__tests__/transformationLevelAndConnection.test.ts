/* eslint-disable @typescript-eslint/no-explicit-any */
// Test script to verify transformation handles level height and connection position changes correctly
// This test demonstrates that Durchgangspunkt is recalculated properly when GUI values are modified

import { describe, it, expect } from 'vitest';
import { computationToUI, uiToComputation } from '../utils/trasseTransformNew';
import type { UsedTrasse, HLeitertypData } from '../types/usedData';
const files: Record<string, any> = import.meta.glob('../test/data/**/*.json', { eager: true });
describe('Transformation with Modified Level Height and Connection Position', () => {
  
  it('should recalculate Durchgangspunkt.z when level height is modified', () => {
    // Load test data
    const data = files['../test/data/trasse4gelaende.json'];
    const projectData = data.ProjectData;
    
    console.log('\n=== TEST 1: Level Height Change ===\n');
    
    const originalTrasse: UsedTrasse = projectData.Trassen[0];
    const firstMast = originalTrasse.UsedMasten[0];
    const firstEbene = firstMast.UsedEbenen[0];
    const originalLeiter = firstEbene?.UsedLeitungenLinks[0];
    
    // Store original values
    const originalAbstandNullpunkt = firstEbene.AbstandNullpunkt;
    const originalDurchgangspunktZ = originalLeiter?.Durchgangspunkt.z || 0;
    const originalDurchgangspunktGK = {
      Rechts: originalLeiter?.Durchgangspunkt.GK.Rechts || 0,
      Hoch: originalLeiter?.Durchgangspunkt.GK.Hoch || 0
    };
    
    console.log('Original values:');
    console.log(`  - AbstandNullpunkt: ${originalAbstandNullpunkt}`);
    console.log(`  - Durchgangspunkt.z: ${originalDurchgangspunktZ}`);
    console.log(`  - Durchgangspunkt.GK: Rechts=${originalDurchgangspunktGK.Rechts.toFixed(2)}, Hoch=${originalDurchgangspunktGK.Hoch.toFixed(2)}`);
    
    // Convert to UI format
    const templateId = 'template_test';
    const uiResult = computationToUI(originalTrasse, templateId);
    
    // Get first pole and level
    const firstPoleId = uiResult.trasse.poleIds[0];
    const firstPole = uiResult.poles.get(firstPoleId);
    expect(firstPole).toBeDefined();
    
    if (!firstPole) throw new Error('First pole not found');
    
    const firstLevel = firstPole.levels[0];
    const originalLevelHeight = firstLevel.levelHeight;
    console.log(`\nUI Format - Level height: ${originalLevelHeight}`);
    
    // Modify level height (increase by 30m)
    const heightIncrease = 30;
    const modifiedPoles = new Map<string, any>();
    
    // Deep clone poles and modify level heights
    uiResult.poles.forEach((pole, id) => {
      const clonedPole = {
        ...pole,
        levels: pole.levels.map(level => ({
          ...level,
          leftConnections: [...level.leftConnections],
          rightConnections: [...level.rightConnections]
        }))
      };
      
      if (clonedPole.levels[0]) {
        const oldHeight = clonedPole.levels[0].levelHeight;
        clonedPole.levels[0].levelHeight = oldHeight + heightIncrease;
        console.log(`Modified level height from ${oldHeight} to ${clonedPole.levels[0].levelHeight}`);
      }
      
      modifiedPoles.set(id, clonedPole);
    });
    
    // Convert back to computation format
    const leiterTypes: HLeitertypData[] = projectData.LeiterTypes || [];
    const computationTrasse = uiToComputation(
      uiResult.trasse,
      modifiedPoles,
      uiResult.connectionLines,
      leiterTypes
    );
    
    // Check the results
    const newFirstMast = computationTrasse.UsedMasten[0];
    const newFirstLeiter = newFirstMast.UsedEbenen[0]?.UsedLeitungenLinks[0];
    
    // Debug: Check the pole and level values in the computation format
    console.log('\nDebug - After transformation:');
    console.log(`  - Pole position.z: ${newFirstMast.Fusspunkt.GK_Vektor.z}`);
    console.log(`  - MastHoehe: ${newFirstMast.MastHoehe}`);
    console.log(`  - AbstandNullpunkt (level): ${newFirstMast.UsedEbenen[0].AbstandNullpunkt}`);
    const computedLevelHeight = newFirstMast.MastHoehe + newFirstMast.UsedEbenen[0].AbstandNullpunkt;
    console.log(`  - Computed level height: ${computedLevelHeight}`);
    console.log(`  - Expected level height: ${originalLevelHeight + heightIncrease}`);
    
    if (newFirstLeiter && originalLeiter) {
      console.log('\nResults after level height change:');
      console.log(`  - New Durchgangspunkt.z: ${newFirstLeiter.Durchgangspunkt.z}`);
      console.log(`  - Expected z: ${originalDurchgangspunktZ + heightIncrease}`);
      console.log(`  - Actual difference: ${newFirstLeiter.Durchgangspunkt.z - originalDurchgangspunktZ}`);
      
      // The Durchgangspunkt.z should be: pole.position.z + level.levelHeight
      const expectedZ = newFirstMast.Fusspunkt.GK_Vektor.z + (originalLevelHeight + heightIncrease);
      console.log(`  - Recalculated expected z: ${expectedZ}`);
      
      // Verify the Durchgangspunkt.z matches the expected calculation
      expect(Math.abs(newFirstLeiter.Durchgangspunkt.z - expectedZ)).toBeLessThan(0.01);
      
      console.log('\n✅ Durchgangspunkt.z correctly updated with level height change');
      
      // Verify GK coordinates remain unchanged (horizontal position not affected by height)
      console.log('\nGK coordinates comparison:');
      console.log(`  - Original Rechts: ${originalDurchgangspunktGK.Rechts.toFixed(2)}`);
      console.log(`  - New Rechts: ${newFirstLeiter.Durchgangspunkt.GK.Rechts.toFixed(2)}`);
      console.log(`  - Original Hoch: ${originalDurchgangspunktGK.Hoch.toFixed(2)}`);
      console.log(`  - New Hoch: ${newFirstLeiter.Durchgangspunkt.GK.Hoch.toFixed(2)}`);
      
      expect(Math.abs(newFirstLeiter.Durchgangspunkt.GK.Rechts - originalDurchgangspunktGK.Rechts)).toBeLessThan(0.1);
      expect(Math.abs(newFirstLeiter.Durchgangspunkt.GK.Hoch - originalDurchgangspunktGK.Hoch)).toBeLessThan(0.1);
      
      console.log('✅ GK coordinates correctly unchanged (height doesn\'t affect horizontal position)');
    }
  });
  
  it('should recalculate Durchgangspunkt.GK when connection horizontal distance is modified', () => {
    // Load test data
    const data = files['../test/data/trasse4gelaende.json'];
    const projectData = data.ProjectData;
    
    console.log('\n=== TEST 2: Connection Horizontal Distance Change ===\n');
    
    const originalTrasse: UsedTrasse = projectData.Trassen[0];
    const firstMast = originalTrasse.UsedMasten[0];
    const originalLeiter = firstMast.UsedEbenen[0]?.UsedLeitungenLinks[0];
    
    if (!originalLeiter) {
      throw new Error('No left conductor found in first mast');
    }
    
    // Store original values
    const originalAbstandMastachse = originalLeiter.AbstandMastachse;
    const originalDurchgangspunktZ = originalLeiter.Durchgangspunkt.z;
    const originalDurchgangspunktGK = {
      Rechts: originalLeiter.Durchgangspunkt.GK.Rechts,
      Hoch: originalLeiter.Durchgangspunkt.GK.Hoch
    };
    
    console.log('Original values:');
    console.log(`  - AbstandMastachse: ${originalAbstandMastachse}`);
    console.log(`  - Durchgangspunkt.z: ${originalDurchgangspunktZ}`);
    console.log(`  - Durchgangspunkt.GK: Rechts=${originalDurchgangspunktGK.Rechts.toFixed(2)}, Hoch=${originalDurchgangspunktGK.Hoch.toFixed(2)}`);
    
    // Convert to UI format
    const templateId = 'template_test';
    const uiResult = computationToUI(originalTrasse, templateId);
    
    // Get first pole and connection
    const firstPoleId = uiResult.trasse.poleIds[0];
    const firstPole = uiResult.poles.get(firstPoleId);
    expect(firstPole).toBeDefined();
    
    if (!firstPole) throw new Error('First pole not found');
    
    const firstConnection = firstPole.levels[0]?.leftConnections[0];
    const originalDistance = firstConnection?.horizontalDistance2Pole || 0;
    console.log(`\nUI Format - Horizontal distance: ${originalDistance}`);
    
    // Get the GK orientation for calculation verification
    const gkOrientation = firstPole.gkOrientation || {
      Rechts: firstPole.orientation.x,
      Hoch: firstPole.orientation.y
    };
    const gkLength = Math.sqrt(gkOrientation.Rechts * gkOrientation.Rechts + gkOrientation.Hoch * gkOrientation.Hoch);
    const normalizedGK = {
      Rechts: gkOrientation.Rechts / gkLength,
      Hoch: gkOrientation.Hoch / gkLength
    };
    
    // Modify horizontal distance (change from 5m to 15m)
    const newDistance = 15;
    const distanceChange = newDistance - originalDistance;
    const modifiedPoles = new Map<string, any>();
    
    // Deep clone poles and modify connection distances
    uiResult.poles.forEach((pole, id) => {
      const clonedPole = {
        ...pole,
        levels: pole.levels.map(level => ({
          ...level,
          leftConnections: level.leftConnections.map(conn => ({ ...conn })),
          rightConnections: level.rightConnections.map(conn => ({ ...conn }))
        }))
      };
      
      if (clonedPole.levels[0]?.leftConnections[0]) {
        clonedPole.levels[0].leftConnections[0].horizontalDistance2Pole = newDistance;
        console.log(`Modified horizontal distance from ${originalDistance} to ${newDistance}`);
      }
      
      modifiedPoles.set(id, clonedPole);
    });
    
    // Convert back to computation format
    const leiterTypes: HLeitertypData[] = projectData.LeiterTypes || [];
    const computationTrasse = uiToComputation(
      uiResult.trasse,
      modifiedPoles,
      uiResult.connectionLines,
      leiterTypes
    );
    
    // Check the results
    const newFirstMast = computationTrasse.UsedMasten[0];
    const newFirstLeiter = newFirstMast.UsedEbenen[0]?.UsedLeitungenLinks[0];
    
    if (newFirstLeiter) {
      console.log('\nResults after horizontal distance change:');
      console.log(`  - New AbstandMastachse: ${newFirstLeiter.AbstandMastachse}`);
      console.log(`  - New Durchgangspunkt.GK: Rechts=${newFirstLeiter.Durchgangspunkt.GK.Rechts.toFixed(2)}, Hoch=${newFirstLeiter.Durchgangspunkt.GK.Hoch.toFixed(2)}`);
      
      // Verify the horizontal distance was updated
      expect(newFirstLeiter.AbstandMastachse).toBe(newDistance);
      
      // Calculate expected GK change (for left conductor, positive scaling)
      const expectedGKChange = {
        Rechts: normalizedGK.Rechts * distanceChange,
        Hoch: normalizedGK.Hoch * distanceChange
      };
      
      const actualGKChange = {
        Rechts: newFirstLeiter.Durchgangspunkt.GK.Rechts - originalDurchgangspunktGK.Rechts,
        Hoch: newFirstLeiter.Durchgangspunkt.GK.Hoch - originalDurchgangspunktGK.Hoch
      };
      
      console.log(`\nExpected GK change: Rechts=${expectedGKChange.Rechts.toFixed(2)}, Hoch=${expectedGKChange.Hoch.toFixed(2)}`);
      console.log(`Actual GK change: Rechts=${actualGKChange.Rechts.toFixed(2)}, Hoch=${actualGKChange.Hoch.toFixed(2)}`);
      
      // Allow some tolerance for floating point calculations
      expect(Math.abs(actualGKChange.Rechts - expectedGKChange.Rechts)).toBeLessThan(0.1);
      expect(Math.abs(actualGKChange.Hoch - expectedGKChange.Hoch)).toBeLessThan(0.1);
      
      console.log('✅ Durchgangspunkt.GK correctly updated with horizontal distance change');
      
      // Verify Z coordinate is properly recalculated (based on pole.position.z + level.levelHeight)
      console.log('\nZ coordinate comparison:');
      console.log(`  - Original z: ${originalDurchgangspunktZ}`);
      console.log(`  - New z: ${newFirstLeiter.Durchgangspunkt.z}`);
      
      // Z should be recalculated based on actual pole position and level height
      const firstPole2 = modifiedPoles.values().next().value;
      const expectedZ = firstPole2.position.z + firstPole2.levels[0].levelHeight;
      console.log(`  - Expected z (pole.z + level.height): ${expectedZ}`);
      expect(Math.abs(newFirstLeiter.Durchgangspunkt.z - expectedZ)).toBeLessThan(0.01);
      
      console.log('✅ Durchgangspunkt.z correctly unchanged (horizontal distance doesn\'t affect height)');
    }
  });
  
  it('should handle combined level height and connection position changes', () => {
    // Load test data
    const data = files['../test/data/trasse4gelaende.json'];
    const projectData = data.ProjectData;
    
    console.log('\n=== TEST 3: Combined Level Height and Connection Distance Changes ===\n');
    
    const originalTrasse: UsedTrasse = projectData.Trassen[0];
    const firstMast = originalTrasse.UsedMasten[0];
    const originalLeiter = firstMast.UsedEbenen[0]?.UsedLeitungenLinks[0];
    
    if (!originalLeiter) {
      throw new Error('No left conductor found in first mast');
    }
    
    // const originalDurchgangspunktZ = originalLeiter.Durchgangspunkt.z;
    const originalDurchgangspunktGK = {
      Rechts: originalLeiter.Durchgangspunkt.GK.Rechts,
      Hoch: originalLeiter.Durchgangspunkt.GK.Hoch
    };
    
    // Convert to UI format
    const templateId = 'template_test';
    const uiResult = computationToUI(originalTrasse, templateId);
    
    const firstPoleId = uiResult.trasse.poleIds[0];
    const firstPole = uiResult.poles.get(firstPoleId);
    
    if (!firstPole) throw new Error('First pole not found');
    
    const originalLevelHeight = firstPole.levels[0].levelHeight;
    const originalDistance = firstPole.levels[0].leftConnections[0].horizontalDistance2Pole;
    
    // Modify both level height and horizontal distance
    const heightIncrease = 25;
    const newDistance = 20;
    const distanceChange = newDistance - originalDistance;
    
    const modifiedPoles = new Map<string, any>();
    
    // Deep clone poles and modify both level height and connection distance
    uiResult.poles.forEach((pole, id) => {
      const clonedPole = {
        ...pole,
        levels: pole.levels.map((level, levelIndex) => ({
          ...level,
          levelHeight: levelIndex === 0 ? originalLevelHeight + heightIncrease : level.levelHeight,
          leftConnections: level.leftConnections.map(conn => ({ ...conn })),
          rightConnections: level.rightConnections.map(conn => ({ ...conn }))
        }))
      };
      
      // Change connection distance
      if (clonedPole.levels[0]?.leftConnections[0]) {
        clonedPole.levels[0].leftConnections[0].horizontalDistance2Pole = newDistance;
      }
      
      modifiedPoles.set(id, clonedPole);
    });
    
    console.log(`Modified level height: ${originalLevelHeight} -> ${originalLevelHeight + heightIncrease}`);
    console.log(`Modified horizontal distance: ${originalDistance} -> ${newDistance}`);
    
    // Convert back to computation format
    const leiterTypes: HLeitertypData[] = projectData.LeiterTypes || [];
    const computationTrasse = uiToComputation(
      uiResult.trasse,
      modifiedPoles,
      uiResult.connectionLines,
      leiterTypes
    );
    
    const newFirstLeiter = computationTrasse.UsedMasten[0].UsedEbenen[0]?.UsedLeitungenLinks[0];
    
    if (newFirstLeiter) {
      // Verify Z coordinate is correctly calculated
      const firstPole3 = modifiedPoles.values().next().value;
      const expectedZ = firstPole3.position.z + firstPole3.levels[0].levelHeight;
      console.log(`\nZ coordinate:`);
      console.log(`  - New z: ${newFirstLeiter.Durchgangspunkt.z}`);
      console.log(`  - Expected z (pole.z + level.height): ${expectedZ}`);
      expect(Math.abs(newFirstLeiter.Durchgangspunkt.z - expectedZ)).toBeLessThan(0.01);
      
      // Verify GK coordinates changed based on distance
      const gkOrientation = firstPole.gkOrientation || {
        Rechts: firstPole.orientation.x,
        Hoch: firstPole.orientation.y
      };
      const gkLength = Math.sqrt(gkOrientation.Rechts * gkOrientation.Rechts + gkOrientation.Hoch * gkOrientation.Hoch);
      const normalizedGK = {
        Rechts: gkOrientation.Rechts / gkLength,
        Hoch: gkOrientation.Hoch / gkLength
      };
      
      const expectedGKChange = {
        Rechts: normalizedGK.Rechts * distanceChange,
        Hoch: normalizedGK.Hoch * distanceChange
      };
      
      const actualGKChange = {
        Rechts: newFirstLeiter.Durchgangspunkt.GK.Rechts - originalDurchgangspunktGK.Rechts,
        Hoch: newFirstLeiter.Durchgangspunkt.GK.Hoch - originalDurchgangspunktGK.Hoch
      };
      
      console.log(`GK Rechts change: ${actualGKChange.Rechts.toFixed(2)} (expected: ${expectedGKChange.Rechts.toFixed(2)})`);
      console.log(`GK Hoch change: ${actualGKChange.Hoch.toFixed(2)} (expected: ${expectedGKChange.Hoch.toFixed(2)})`);
      
      expect(Math.abs(actualGKChange.Rechts - expectedGKChange.Rechts)).toBeLessThan(0.1);
      expect(Math.abs(actualGKChange.Hoch - expectedGKChange.Hoch)).toBeLessThan(0.1);
      
      console.log('\n✅ Both Z and GK coordinates correctly updated with combined changes');
    }
  });
});