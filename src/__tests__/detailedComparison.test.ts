/* eslint-disable @typescript-eslint/no-explicit-any */
// Detailed comparison test to find differences between original and transformed data

import { describe, it, expect } from 'vitest';
import type { UsedProjectData, UsedTrasse, UsedMast, UsedEbene, UsedLeiter } from '../types/usedData';
import { computationToUI, uiToComputation } from '../utils/trasseTransformNew';
import { calculateParabolaParametersForAll } from '../utils/parabolaCalculator';
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

function compareLeiter(original: UsedLeiter, transformed: UsedLeiter, path: string): string[] {
  const differences: string[] = [];
  
  // Compare Durchgangspunkt
  const dpDiffRechts = Math.abs(original.Durchgangspunkt.GK.Rechts - transformed.Durchgangspunkt.GK.Rechts);
  const dpDiffHoch = Math.abs(original.Durchgangspunkt.GK.Hoch - transformed.Durchgangspunkt.GK.Hoch);
  const dpDiffZ = Math.abs(original.Durchgangspunkt.z - transformed.Durchgangspunkt.z);
  
  if (dpDiffRechts > 0.01 || dpDiffHoch > 0.01 || dpDiffZ > 0.01) {
    differences.push(`${path}: Durchgangspunkt differs - Rechts: ${dpDiffRechts.toFixed(4)}, Hoch: ${dpDiffHoch.toFixed(4)}, Z: ${dpDiffZ.toFixed(4)}`);
  }
  
  // Compare other properties
  if (Math.abs(original.AbstandMastachse - transformed.AbstandMastachse) > 0.01) {
    differences.push(`${path}: AbstandMastachse differs - Original: ${original.AbstandMastachse}, Transformed: ${transformed.AbstandMastachse}`);
  }
  
  if (Math.abs(original.Durchhang - transformed.Durchhang) > 0.01) {
    differences.push(`${path}: Durchhang differs - Original: ${original.Durchhang}, Transformed: ${transformed.Durchhang}`);
  }
  
  if (Math.abs(original.ParabelA - transformed.ParabelA) > 1e-8) {
    differences.push(`${path}: ParabelA differs - Original: ${original.ParabelA}, Transformed: ${transformed.ParabelA}`);
  }
  
  if (Math.abs(original.ParabelB - transformed.ParabelB) > 0.0001) {
    differences.push(`${path}: ParabelB differs - Original: ${original.ParabelB}, Transformed: ${transformed.ParabelB}`);
  }
  
  if (Math.abs(original.ParabelC - transformed.ParabelC) > 0.01) {
    differences.push(`${path}: ParabelC differs - Original: ${original.ParabelC}, Transformed: ${transformed.ParabelC}`);
  }
  
  // Compare Mittelpkt
  const mpDiffRechts = Math.abs(original.Mittelpkt.GK.Rechts - transformed.Mittelpkt.GK.Rechts);
  const mpDiffHoch = Math.abs(original.Mittelpkt.GK.Hoch - transformed.Mittelpkt.GK.Hoch);
  const mpDiffZ = Math.abs(original.Mittelpkt.z - transformed.Mittelpkt.z);
  
  if (mpDiffRechts > 0.01 || mpDiffHoch > 0.01 || mpDiffZ > 0.01) {
    differences.push(`${path}: Mittelpkt differs - Rechts: ${mpDiffRechts.toFixed(4)}, Hoch: ${mpDiffHoch.toFixed(4)}, Z: ${mpDiffZ.toFixed(4)}`);
  }
  
  if (original.BetrU !== transformed.BetrU) {
    differences.push(`${path}: BetrU differs - Original: ${original.BetrU}, Transformed: ${transformed.BetrU}`);
  }
  
  if (original.SchallLwDB !== transformed.SchallLwDB) {
    differences.push(`${path}: SchallLwDB differs - Original: ${original.SchallLwDB}, Transformed: ${transformed.SchallLwDB}`);
  }
  
  return differences;
}

function compareEbene(original: UsedEbene, transformed: UsedEbene, path: string): string[] {
  const differences: string[] = [];
  
  if (Math.abs(original.AbstandNullpunkt - transformed.AbstandNullpunkt) > 0.01) {
    differences.push(`${path}: AbstandNullpunkt differs - Original: ${original.AbstandNullpunkt}, Transformed: ${transformed.AbstandNullpunkt}`);
  }
  
  // Compare left conductors
  for (let i = 0; i < original.UsedLeitungenLinks.length; i++) {
    const leiterDiffs = compareLeiter(
      original.UsedLeitungenLinks[i],
      transformed.UsedLeitungenLinks[i],
      `${path}/LeftConductor[${i}]`
    );
    differences.push(...leiterDiffs);
  }
  
  // Compare right conductors
  for (let i = 0; i < original.UsedLeitungenRechts.length; i++) {
    const leiterDiffs = compareLeiter(
      original.UsedLeitungenRechts[i],
      transformed.UsedLeitungenRechts[i],
      `${path}/RightConductor[${i}]`
    );
    differences.push(...leiterDiffs);
  }
  
  return differences;
}

function compareMast(original: UsedMast, transformed: UsedMast, path: string): string[] {
  const differences: string[] = [];
  
  // Compare Fusspunkt
  const fpDiffRechts = Math.abs(original.Fusspunkt.GK_Vektor.GK.Rechts - transformed.Fusspunkt.GK_Vektor.GK.Rechts);
  const fpDiffHoch = Math.abs(original.Fusspunkt.GK_Vektor.GK.Hoch - transformed.Fusspunkt.GK_Vektor.GK.Hoch);
  const fpDiffZ = Math.abs(original.Fusspunkt.GK_Vektor.z - transformed.Fusspunkt.GK_Vektor.z);
  
  if (fpDiffRechts > 0.01 || fpDiffHoch > 0.01 || fpDiffZ > 0.01) {
    differences.push(`${path}: Fusspunkt differs - Rechts: ${fpDiffRechts.toFixed(4)}, Hoch: ${fpDiffHoch.toFixed(4)}, Z: ${fpDiffZ.toFixed(4)}`);
  }
  
  // Compare MastHoehe
  if (Math.abs(original.MastHoehe - transformed.MastHoehe) > 0.01) {
    differences.push(`${path}: MastHoehe differs - Original: ${original.MastHoehe}, Transformed: ${transformed.MastHoehe}`);
  }
  
  // Compare NullpunktHoehe
  if (Math.abs(original.NullpunktHoehe - transformed.NullpunktHoehe) > 0.01) {
    differences.push(`${path}: NullpunktHoehe differs - Original: ${original.NullpunktHoehe}, Transformed: ${transformed.NullpunktHoehe}`);
  }
  
  // Compare Ausrichtung
  const ausrDiffX = Math.abs(original.Ausrichtung.x - transformed.Ausrichtung.x);
  const ausrDiffY = Math.abs(original.Ausrichtung.y - transformed.Ausrichtung.y);
  
  if (ausrDiffX > 0.01 || ausrDiffY > 0.01) {
    differences.push(`${path}: Ausrichtung differs - X: ${ausrDiffX.toFixed(4)}, Y: ${ausrDiffY.toFixed(4)}`);
    differences.push(`  Original: (${original.Ausrichtung.x}, ${original.Ausrichtung.y})`);
    differences.push(`  Transformed: (${transformed.Ausrichtung.x}, ${transformed.Ausrichtung.y})`);
  }
  
  // Compare GKAusrichtung
  const gkDiffRechts = Math.abs(original.GKAusrichtung.Rechts - transformed.GKAusrichtung.Rechts);
  const gkDiffHoch = Math.abs(original.GKAusrichtung.Hoch - transformed.GKAusrichtung.Hoch);
  
  if (gkDiffRechts > 0.01 || gkDiffHoch > 0.01) {
    differences.push(`${path}: GKAusrichtung differs - Rechts: ${gkDiffRechts.toFixed(4)}, Hoch: ${gkDiffHoch.toFixed(4)}`);
    differences.push(`  Original: (${original.GKAusrichtung.Rechts}, ${original.GKAusrichtung.Hoch})`);
    differences.push(`  Transformed: (${transformed.GKAusrichtung.Rechts}, ${transformed.GKAusrichtung.Hoch})`);
  }
  
  // Compare levels
  for (let i = 0; i < original.UsedEbenen.length; i++) {
    const ebeneDiffs = compareEbene(
      original.UsedEbenen[i],
      transformed.UsedEbenen[i],
      `${path}/Level[${i}]`
    );
    differences.push(...ebeneDiffs);
  }
  
  return differences;
}

function compareTrasse(original: UsedTrasse, transformed: UsedTrasse): string[] {
  const differences: string[] = [];
  
  if (original.Name !== transformed.Name) {
    differences.push(`Trasse name differs - Original: ${original.Name}, Transformed: ${transformed.Name}`);
  }
  
  if (original.Nummer !== transformed.Nummer) {
    differences.push(`Trasse number differs - Original: ${original.Nummer}, Transformed: ${transformed.Nummer}`);
  }
  
  if (original.UsedMasten.length !== transformed.UsedMasten.length) {
    differences.push(`Number of masts differs - Original: ${original.UsedMasten.length}, Transformed: ${transformed.UsedMasten.length}`);
    return differences;
  }
  
  // Compare each mast
  for (let i = 0; i < original.UsedMasten.length; i++) {
    const mastDiffs = compareMast(
      original.UsedMasten[i],
      transformed.UsedMasten[i],
      `Mast[${i}]`
    );
    differences.push(...mastDiffs);
  }
  
  return differences;
}

describe('Detailed Comparison Tests', () => {
  it('should find all differences in trasse4gelaende.json', () => {
    const projectData = loadTestData('trasse4gelaende.json');
    const originalTrasse = projectData.Trassen![0];
    
    console.log('\n=== ORIGINAL DATA ===');
    console.log('Trasse:', originalTrasse.Name);
    console.log('Number of masts:', originalTrasse.UsedMasten.length);
    
    // Convert to UI format and back
    const uiResult = computationToUI(originalTrasse, 'template_test');
    const leiterTypes = projectData.LeiterTypes || [];
    const transformedTrasse = uiToComputation(
      uiResult.trasse,
      uiResult.poles,
      uiResult.connectionLines,
      leiterTypes
    );
    
    // Recalculate parabola parameters
    calculateParabolaParametersForAll([transformedTrasse]);
    
    console.log('\n=== TRANSFORMED DATA ===');
    console.log('Trasse:', transformedTrasse.Name);
    console.log('Number of masts:', transformedTrasse.UsedMasten.length);
    
    // Compare in detail
    const differences = compareTrasse(originalTrasse, transformedTrasse);
    
    console.log('\n=== DIFFERENCES FOUND ===');
    if (differences.length === 0) {
      console.log('No differences found!');
    } else {
      console.log(`Found ${differences.length} differences:`);
      differences.forEach(diff => console.log(diff));
    }
    
    // The test should ideally pass with no differences
    expect(differences.length).toBe(0);
  });
});