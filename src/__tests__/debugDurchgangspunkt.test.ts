/* eslint-disable @typescript-eslint/no-explicit-any */
// Debug test to understand Durchgangspunkt z values

import { describe, it } from 'vitest';
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

describe('Debug Durchgangspunkt Z Values', () => {
  it('should analyze z-coordinate calculation', () => {
    const projectData = loadTestData('trasse4gelaende.json');
    const originalTrasse = projectData.Trassen![0];
    
    console.log('\n=== ORIGINAL DATA ANALYSIS ===');
    originalTrasse.UsedMasten.forEach((mast, mastIndex) => {
      console.log(`\nMast ${mastIndex + 1}:`);
      console.log(`  Fusspunkt.z: ${mast.Fusspunkt.GK_Vektor.z}`);
      console.log(`  MastHoehe: ${mast.MastHoehe}`);
      console.log(`  NullpunktHoehe: ${mast.NullpunktHoehe}`);
      console.log(`  Expected base + height: ${mast.Fusspunkt.GK_Vektor.z + mast.MastHoehe}`);
      
      mast.UsedEbenen.forEach((ebene) => {
        console.log(`  Level ${ebene.NummerEbene}:`);
        console.log(`    AbstandNullpunkt: ${ebene.AbstandNullpunkt}`);
        console.log(`    Level height above ground: ${mast.MastHoehe + ebene.AbstandNullpunkt}`);
        console.log(`    Expected z: ${mast.Fusspunkt.GK_Vektor.z + mast.MastHoehe + ebene.AbstandNullpunkt}`);
        
        ebene.UsedLeitungenLinks.forEach((leiter, leiterIndex) => {
          console.log(`    Left conductor ${leiterIndex + 1}:`);
          console.log(`      Durchgangspunkt.z: ${leiter.Durchgangspunkt.z}`);
          console.log(`      ParabelC: ${leiter.ParabelC}`);
          console.log(`      Match? ${Math.abs(leiter.Durchgangspunkt.z - leiter.ParabelC) < 0.01}`);
        });
      });
    });
    
    // Convert to UI format and back
    const uiResult = computationToUI(originalTrasse, 'template_test');
    
    console.log('\n=== UI FORMAT ANALYSIS ===');
    uiResult.poles.forEach((pole) => {
      console.log(`\nPole ${pole.id}:`);
      console.log(`  position.z: ${pole.position.z}`);
      console.log(`  poleHeight: ${pole.poleHeight}`);
      
      pole.levels.forEach((level) => {
        console.log(`  Level ${level.levelNumber}:`);
        console.log(`    levelHeight: ${level.levelHeight}`);
        console.log(`    Expected conductor z: ${pole.position.z + level.levelHeight}`);
      });
    });
    
    // Transform back
    const leiterTypes = projectData.LeiterTypes || [];
    const transformedTrasse = uiToComputation(
      uiResult.trasse,
      uiResult.poles,
      uiResult.connectionLines,
      leiterTypes
    );
    
    console.log('\n=== TRANSFORMED DATA ANALYSIS ===');
    transformedTrasse.UsedMasten.forEach((mast, mastIndex) => {
      console.log(`\nMast ${mastIndex + 1}:`);
      console.log(`  Fusspunkt.z: ${mast.Fusspunkt.GK_Vektor.z}`);
      console.log(`  MastHoehe: ${mast.MastHoehe}`);
      console.log(`  NullpunktHoehe: ${mast.NullpunktHoehe}`);
      
      mast.UsedEbenen.forEach((ebene) => {
        console.log(`  Level ${ebene.NummerEbene}:`);
        console.log(`    AbstandNullpunkt: ${ebene.AbstandNullpunkt}`);
        console.log(`    Level height above ground: ${mast.MastHoehe + ebene.AbstandNullpunkt}`);
        
        ebene.UsedLeitungenLinks.forEach((leiter, leiterIndex) => {
          console.log(`    Left conductor ${leiterIndex + 1}:`);
          console.log(`      Durchgangspunkt.z: ${leiter.Durchgangspunkt.z}`);
          console.log(`      ParabelC: ${leiter.ParabelC}`);
          console.log(`      Expected z: ${mast.Fusspunkt.GK_Vektor.z + mast.MastHoehe + ebene.AbstandNullpunkt}`);
          console.log(`      Match expected? ${Math.abs(leiter.Durchgangspunkt.z - (mast.Fusspunkt.GK_Vektor.z + mast.MastHoehe + ebene.AbstandNullpunkt)) < 0.01}`);
        });
      });
    });
    
    // Check if the z values match what we expect
    transformedTrasse.UsedMasten.forEach((mast, mastIndex) => {
      const originalMast = originalTrasse.UsedMasten[mastIndex];
      
      mast.UsedEbenen.forEach((ebene, ebeneIndex) => {
        const originalEbene = originalMast.UsedEbenen[ebeneIndex];
        
        ebene.UsedLeitungenLinks.forEach((leiter, leiterIndex) => {
          const originalLeiter = originalEbene.UsedLeitungenLinks[leiterIndex];
          
          const expectedZ = mast.Fusspunkt.GK_Vektor.z + mast.MastHoehe + ebene.AbstandNullpunkt;
          
          console.log(`\nVerifying Mast ${mastIndex + 1}, Left conductor ${leiterIndex + 1}:`);
          console.log(`  Original Durchgangspunkt.z: ${originalLeiter.Durchgangspunkt.z}`);
          console.log(`  Transformed Durchgangspunkt.z: ${leiter.Durchgangspunkt.z}`);
          console.log(`  Expected z: ${expectedZ}`);
          console.log(`  Difference from original: ${Math.abs(originalLeiter.Durchgangspunkt.z - leiter.Durchgangspunkt.z)}`);
        });
      });
    });
  });
});