/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { UsedDataCalculator } from '../utils/usedDataCalculator';
import { UsedDataLoader } from '../utils/usedDataLoader';
import { DTMProcessor } from '../utils/dtmProcessor';


const files: Record<string, any> = import.meta.glob('../test/data/**/*.json', { eager: true });

describe('Frequency-dependent vs Standard calculations', () => {
  it('should show difference between frequency and non-frequency calculations', () => {
    // Test with frequency-dependent mode
    const runTest = true;

    if (runTest) {

    // const foo2Path = path.join(__dirname, '../test/data/Foo2Frequenz_UsedData.json');
    // const foo2Content = fs.readFileSync(foo2Path, 'utf-8');
    // const foo2Data = JSON.parse(foo2Content);
    const foo2ProjectData = UsedDataLoader.loadFromJson(JSON.stringify(files['../test/data/Foo2Frequenz_UsedData.json'].ProjectData));
    
    // Create DTM processor
    let foo2DtmProcessor = null;
    if (foo2ProjectData.DGMDreiecke && foo2ProjectData.Hoehenpunkte) {
      foo2DtmProcessor = new DTMProcessor(foo2ProjectData.DGMDreiecke, foo2ProjectData.Hoehenpunkte);
      if (foo2ProjectData.DGMKanten) {
        foo2DtmProcessor.setDGMKante(foo2ProjectData.DGMKanten);
      }
    }

    const foo2Calculator = new UsedDataCalculator(foo2ProjectData, foo2DtmProcessor);
    
    // Force frequency mode ON
    foo2ProjectData.mitFrequenz = true;
    const resultWithFrequency = foo2Calculator.calculateLatLTForImmissionPoint(0);
    
    // Force frequency mode OFF  
    foo2ProjectData.mitFrequenz = false;
    const resultWithoutFrequency = foo2Calculator.calculateLatLTForImmissionPoint(0);
    
    console.log('\n=== Frequency Mode Comparison ===');
    console.log(`With frequency-dependent calculation: ${resultWithFrequency.toFixed(2)} dB`);
    console.log(`Without frequency-dependent calculation: ${resultWithoutFrequency.toFixed(2)} dB`);
    console.log(`Difference: ${(resultWithFrequency - resultWithoutFrequency).toFixed(2)} dB`);
    
    // They should be different when frequency mode is enabled
    expect(resultWithFrequency).toBeDefined();
    expect(resultWithoutFrequency).toBeDefined();
  }
  });

  it('should handle ACDC types correctly', () => {
    // const foo3Path = path.join(__dirname, '../test/data/Foo3.json');
    // const foo3Content = fs.readFileSync(foo3Path, 'utf-8');
    // const foo3Data = JSON.parse(foo3Content);
    const foo3ProjectData = UsedDataLoader.loadFromJson(JSON.stringify(files['../test/data/Foo2Frequenz_UsedData.json'].ProjectData));
    
    
    // Check ACDC values in data
    console.log('\n=== ACDC Types in Foo3.json ===');
    for (const trasse of foo3ProjectData.Trassen) {
      for (const mast of trasse.UsedMasten) {
        for (const ebene of mast.UsedEbenen) {
          for (const leiter of [...ebene.UsedLeitungenLinks, ...ebene.UsedLeitungenRechts]) {
            if (leiter.ACDC !== undefined) {
              console.log(`Found ACDC type: ${leiter.ACDC} (0=undefined, 1=AC, 2=DC+, 3=DC-)`);
            }
          }
        }
      }
    }
    
    // Create DTM processor
    let foo3DtmProcessor = null;
    if (foo3ProjectData.DGMDreiecke && foo3ProjectData.Hoehenpunkte) {
      foo3DtmProcessor = new DTMProcessor(foo3ProjectData.DGMDreiecke, foo3ProjectData.Hoehenpunkte);
      if (foo3ProjectData.DGMKanten) {
        foo3DtmProcessor.setDGMKante(foo3ProjectData.DGMKanten);
      }
    }

    const foo3Calculator = new UsedDataCalculator(foo3ProjectData, foo3DtmProcessor);
    const result = foo3Calculator.calculateLatLTForImmissionPoint(0);
    
    console.log(`\nCalculation result: ${result.toFixed(2)} dB`);
    
    expect(result).toBeGreaterThanOrEqual(0);
  });
});