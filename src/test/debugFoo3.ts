// import { UsedDataCalculator } from '../utils/usedDataCalculator';
// import { UsedDataLoader } from '../utils/usedDataLoader';
// import { DTMProcessor } from '../utils/dtmProcessor';
// import * as fs from 'fs';
// import * as path from 'path';
// import { fileURLToPath } from 'url';

// const __dirname = path.dirname(fileURLToPath(import.meta.url));
// const jsonPath = path.join(__dirname, 'data/Foo3.json');
// const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
// const testData = JSON.parse(jsonContent);

// const projectData = UsedDataLoader.loadFromJson(JSON.stringify(testData.ProjectData));

// console.log('=== Debug Foo3.json ===');
// console.log(`mitFrequenz: ${projectData.mitFrequenz}`);

// // Create DTM processor
// let dtmProcessor = null;
// if (projectData.DGMDreiecke && projectData.Hoehenpunkte) {
//   dtmProcessor = new DTMProcessor(projectData.DGMDreiecke, projectData.Hoehenpunkte);
//   console.log('\nTerrain points:');
//   projectData.Hoehenpunkte.forEach((hp: any) => {
//     console.log(`  Point ${hp.LfdNummer}: (${hp.GK_Vektor.GK.Rechts}, ${hp.GK_Vektor.GK.Hoch}) z=${hp.GK_Vektor.z}`);
//   });
  
//   const immiPoint = projectData.ImmissionPoints[0];
//   console.log(`\nImmission point I1:`);
//   console.log(`  Position: (${immiPoint.Position.GK.Rechts}, ${immiPoint.Position.GK.Hoch})`);
//   console.log(`  z: ${immiPoint.Position.z}`);
//   console.log(`  HeightOffset: ${immiPoint.HeightOffset}`);
  
//   // Calculate terrain height at immission point
//   const terrainHeight = dtmProcessor.berechneHoeheDGM(immiPoint.Position.GK);
//   console.log(`  Terrain height at immission point: ${terrainHeight}`);
//   console.log(`  Height above terrain: ${immiPoint.Position.z - terrainHeight}`);
// }

// // Check ESQ source
// const esq = projectData.ESQSources[0];
// console.log(`\nESQ source E1:`);
// console.log(`  Position: (${esq.Position.GK.Rechts}, ${esq.Position.GK.Hoch})`);
// console.log(`  z: ${esq.Position.z}`);
// console.log(`  Hoehe: ${esq.Hoehe}`);
// console.log(`  L: ${esq.L}`);

// // Check transmission line
// const trasse = projectData.Trassen[0];
// const mast1 = trasse.UsedMasten[0];
// const mast2 = trasse.UsedMasten[1];
// console.log(`\nTransmission line:`);
// console.log(`  Mast 1 position: (${mast1.Fusspunkt.GK_Vektor.GK.Rechts}, ${mast1.Fusspunkt.GK_Vektor.GK.Hoch})`);
// console.log(`  Mast 2 position: (${mast2.Fusspunkt.GK_Vektor.GK.Rechts}, ${mast2.Fusspunkt.GK_Vektor.GK.Hoch})`);

// const leiter = mast1.UsedEbenen[0].UsedLeitungenRechts[0];
// console.log(`  Conductor ACDC type: ${leiter.ACDC}`);
// console.log(`  Conductor height at mast 1: ${leiter.Durchgangspunkt.z}`);

// const calculator = new UsedDataCalculator(projectData, dtmProcessor);
// console.log('\n\nCalculating...\n');
// const result = calculator.calculateLatLTForImmissionPoint(0);
// console.log(`\n\nFinal Result: ${result.toFixed(2)} dB`);
// console.log(`Expected: 32.7 dB`);
// console.log(`Difference: ${(result - 32.7).toFixed(2)} dB`);