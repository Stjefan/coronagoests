/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { UsedDataCalculator } from '../utils/usedDataCalculator';
import { UsedDataLoader } from '../utils/usedDataLoader';
import { DTMProcessor } from '../utils/dtmProcessor';
// import * as fs from 'fs';
// import * as path from 'path';


const files: Record<string, any> = import.meta.glob('../test/data/**/*.json', { eager: true });

describe('Frequency-dependent calculations', () => {
  [
    // "foo2.json",
    // "foo1.json",
    // "terrain5complex.json",
    // 'Foo2Frequenz_UsedData.json', 
    // 'Foo3.json',
    // 'Foo3TrasseOnly.json',
    'Tausend_2025_1.json'
  ].forEach(file => {
    it(`should calculate with frequency-dependent mode (${file})`, () => {
    // const jsonPath = path.join(__dirname, '../test/data/', file);
    // const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
    // const testData = JSON.parse(jsonContent);
    const testData = files[`../test/data/${file}.json`];
    console.log(`\n=== ${file} ===`);
    const projectData = UsedDataLoader.loadFromJson(JSON.stringify(testData.ProjectData));
    
    console.log(`mitFrequenz: ${projectData.mitFrequenz}`);
    console.log(`Transmission lines: ${projectData.Trassen.length}`);
    console.log(`ESQ sources: ${projectData.ESQSources.length}`);
    console.log(`Immission points: ${projectData.ImmissionPoints.length}`);
    
    // Create DTM processor
    let dtmProcessor = null;
    if (projectData.DGMDreiecke && projectData.Hoehenpunkte) {
      dtmProcessor = new DTMProcessor(projectData.DGMDreiecke, projectData.Hoehenpunkte);
      if (projectData.DGMKanten) {
        dtmProcessor.setDGMKante(projectData.DGMKanten);
      }
    }

    const calculator = new UsedDataCalculator(projectData, dtmProcessor, { enableLogging: true });

    // fs.writeFileSync("calculator.json", JSON.stringify(calculator, null, 2));
    
    console.log("calculator", calculator);
    console.log('\nCalculating for immission point I1...');
    const result = calculator.calculateLatLTForImmissionPoint(0);
    // fs.writeFileSync("result.json", JSON.stringify(calculator, null, 2));
    // console.log(`\nResult: ${result.toFixed(2)} dB`);
   
    const io0 = calculator.usedData.ImmissionPoints[0];
    console.log("io0", io0);
    const expectedResult = projectData.ImmissionPoints?.[0]?.OriginalData?.IPunkt?.Trasse_BeurtPegel;
    const expectedResult2 = projectData.ImmissionPoints?.[0]?.OriginalData?.IPunkt?.Tag_GES_BeurtPegel;
    console.log(`Expected result: ${expectedResult?.toFixed(2)} dB`);
    console.log(`Expected result2: ${expectedResult2?.toFixed(2)} dB`);
    console.log(`Result: ${result.toFixed(2)} dB`);
    expect(result).toBeCloseTo(expectedResult2 ?? 0, 0);


  });
});
  
});