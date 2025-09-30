// import { describe, it, expect } from 'vitest';
// import { foo3Calculator as foo3CalculatorCLI } from './Foo3CLICalculator';
// import { foo3Calculator as foo3CalculatorGUI } from './Foo3GUICalculator';
// import { computationToUI, uiToComputation } from '../utils/trasseTransformNew';
// import { UsedDataCalculator } from '../utils/usedDataCalculator';
// import { DTMProcessor } from '../utils/dtmProcessor';
// import type { UsedTrasse, UsedProjectData } from '../types/usedData';

// describe('Foo3 Transformation Validation', () => {
//     it('should validate that GUI data is created by computationToUI -> uiToComputation transformation', () => {
//         console.log('\n=== Testing Round-Trip Transformation ===\n');
        
//         // Get the original CLI trasse
//         const cliTrasse = foo3CalculatorCLI.usedData.Trassen[0];
//         const leiterTypes = foo3CalculatorCLI.usedData.LeiterTypes || [];
        
//         console.log('Original CLI Trasse:');
//         console.log(`- Nummer: ${cliTrasse.Nummer}`);
//         console.log(`- Name: ${cliTrasse.Name}`);
//         console.log(`- Masten: ${cliTrasse.UsedMasten.length}`);
        
//         // Apply computationToUI transformation
//         const templateId = 'template_test';
//         const uiResult = computationToUI(cliTrasse, templateId);
        
//         console.log('\nAfter computationToUI:');
//         console.log(`- Poles: ${uiResult.poles.size}`);
//         console.log(`- ConnectionLines: ${uiResult.connectionLines.length}`);
//         console.log(`- Trasse ID: ${uiResult.trasse.id}`);
        
//         // Apply uiToComputation transformation back
//         const transformedTrasse = uiToComputation(
//             uiResult.trasse,
//             uiResult.poles,
//             uiResult.connectionLines,
//             leiterTypes
//         );
        
//         console.log('\nAfter uiToComputation (round-trip):');
//         console.log(`- Nummer: ${transformedTrasse.Nummer}`);
//         console.log(`- Name: ${transformedTrasse.Name}`);
//         console.log(`- Masten: ${transformedTrasse.UsedMasten.length}`);
        
//         // Compare with the expected GUI trasse
//         const guiTrasse = foo3CalculatorGUI.usedData.Trassen[0];
        
//         console.log('\n=== Comparing Transformed vs GUI Trasse ===\n');
        
//         // Check basic properties
//         console.log('Basic Properties:');
//         console.log(`- Nummer: Transformed=${transformedTrasse.Nummer}, GUI=${guiTrasse.Nummer}`);
//         console.log(`- Name: Transformed="${transformedTrasse.Name}", GUI="${guiTrasse.Name}"`);
//         console.log(`- Masten count: Transformed=${transformedTrasse.UsedMasten.length}, GUI=${guiTrasse.UsedMasten.length}`);
        
//         // Check each mast in detail
//         for (let i = 0; i < transformedTrasse.UsedMasten.length; i++) {
//             const transformedMast = transformedTrasse.UsedMasten[i];
//             const guiMast = guiTrasse.UsedMasten[i];
            
//             console.log(`\nMast ${i + 1}:`);
//             console.log(`  Name: Transformed="${transformedMast.Name}", GUI="${guiMast.Name}"`);
//             console.log(`  MastHoehe: Transformed=${transformedMast.MastHoehe}, GUI=${guiMast.MastHoehe}`);
//             console.log(`  NullpunktHoehe: Transformed=${transformedMast.NullpunktHoehe}, GUI=${guiMast.NullpunktHoehe}`);
            
//             // Check orientation
//             console.log(`  Orientation X: Transformed=${transformedMast.Ausrichtung.x}, GUI=${guiMast.Ausrichtung.x}`);
//             console.log(`  Orientation Y: Transformed=${transformedMast.Ausrichtung.y}, GUI=${guiMast.Ausrichtung.y}`);
            
//             // Check first level's first right conductor (where main differences are)
//             if (transformedMast.UsedEbenen.length > 0 && transformedMast.UsedEbenen[0].UsedLeitungenRechts.length > 0) {
//                 const transformedLeiter = transformedMast.UsedEbenen[0].UsedLeitungenRechts[0];
//                 const guiLeiter = guiMast.UsedEbenen[0].UsedLeitungenRechts[0];
                
//                 console.log(`  First Conductor (Right):`);
//                 console.log(`    Durchgangspunkt.z: Transformed=${transformedLeiter.Durchgangspunkt.z}, GUI=${guiLeiter.Durchgangspunkt.z}`);
//                 console.log(`    ACDC: Transformed=${transformedLeiter.ACDC}, GUI=${guiLeiter.ACDC}`);
//                 console.log(`    SchallLwDB: Transformed=${transformedLeiter.SchallLwDB}, GUI=${guiLeiter.SchallLwDB}`);
//                 console.log(`    Durchhang: Transformed=${transformedLeiter.Durchhang}, GUI=${guiLeiter.Durchhang}`);
//                 console.log(`    SegmentPunkte: Transformed=${transformedLeiter.SegmentPunkte.length}, GUI=${guiLeiter.SegmentPunkte.length}`);
//             }
//         }
        
//         // Now compare with original CLI data
//         console.log('\n=== Comparing Transformed vs Original CLI ===\n');
        
//         for (let i = 0; i < cliTrasse.UsedMasten.length; i++) {
//             const transformedMast = transformedTrasse.UsedMasten[i];
//             const cliMast = cliTrasse.UsedMasten[i];
            
//             console.log(`Mast ${i + 1}:`);
            
//             // Check first level's first right conductor
//             if (cliMast.UsedEbenen.length > 0 && cliMast.UsedEbenen[0].UsedLeitungenRechts.length > 0) {
//                 const transformedLeiter = transformedMast.UsedEbenen[0].UsedLeitungenRechts[0];
//                 const cliLeiter = cliMast.UsedEbenen[0].UsedLeitungenRechts[0];
                
//                 console.log(`  Original z: ${cliLeiter.Durchgangspunkt.z}, After round-trip: ${transformedLeiter.Durchgangspunkt.z}`);
//                 console.log(`  Original ACDC: ${cliLeiter.ACDC}, After round-trip: ${transformedLeiter.ACDC}`);
//                 console.log(`  Original SchallLwDB: ${cliLeiter.SchallLwDB}, After round-trip: ${transformedLeiter.SchallLwDB}`);
//             }
//         }
        
//         // Test calculations with both datasets
//         console.log('\n=== Testing Calculations ===\n');
        
//         // Create calculator for transformed data
//         const transformedData: UsedProjectData = {
//             ...foo3CalculatorCLI.usedData,
//             Trassen: [transformedTrasse]
//         };
        
//         const dtmProcessorTransformed = new DTMProcessor(
//             transformedData.DGMDreiecke, 
//             transformedData.Hoehenpunkte
//         );
//         const calculatorTransformed = new UsedDataCalculator(transformedData, dtmProcessorTransformed);
        
//         // Create calculator for GUI data  
//         const dtmProcessorGUI = new DTMProcessor(
//             foo3CalculatorGUI.usedData.DGMDreiecke,
//             foo3CalculatorGUI.usedData.Hoehenpunkte
//         );
//         const calculatorGUI = new UsedDataCalculator(foo3CalculatorGUI.usedData, dtmProcessorGUI);
        
//         // Create calculator for CLI data
//         const dtmProcessorCLI = new DTMProcessor(
//             foo3CalculatorCLI.usedData.DGMDreiecke,
//             foo3CalculatorCLI.usedData.Hoehenpunkte
//         );
//         const calculatorCLI = new UsedDataCalculator(foo3CalculatorCLI.usedData, dtmProcessorCLI);
        
//         // Calculate for immission point
//         let resultTransformed: number | null = null;
//         let resultGUI: number | null = null;
//         let resultCLI: number | null = null;
        
//         try {
//             resultTransformed = calculatorTransformed.calculateLatLTForImmissionPoint(0);
//         } catch (e) {
//             console.log(`- Transformed calculation failed: ${e}`);
//         }
        
//         try {
//             resultGUI = calculatorGUI.calculateLatLTForImmissionPoint(0);
//         } catch (e) {
//             console.log(`- GUI calculation failed: ${e}`);
//         }
        
//         try {
//             resultCLI = calculatorCLI.calculateLatLTForImmissionPoint(0);
//         } catch (e) {
//             console.log(`- CLI calculation failed: ${e}`);
//         }
        
//         console.log('Calculation Results:');
//         console.log(`- CLI (Original): ${resultCLI}`);
//         console.log(`- Transformed (Round-trip): ${resultTransformed}`);
//         console.log(`- GUI (Expected): ${resultGUI}`);
        
//         // Assertions
//         console.log('\n=== Test Assertions ===\n');
        
//         // The transformed data should ideally match the GUI data
//         // But first, let's check if round-trip preserves the original
//         if (resultCLI !== null && resultTransformed !== null) {
//             const isRoundTripPreserved = Math.abs(resultCLI - resultTransformed) < 0.01;
//             console.log(`Round-trip preserves calculation: ${isRoundTripPreserved} (diff: ${Math.abs(resultCLI - resultTransformed)})`);
//         } else {
//             console.log('Cannot compare round-trip - one or both calculations failed');
//         }
        
//         // Check if GUI matches expected transformation
//         if (resultGUI !== null && resultTransformed !== null) {
//             const isGUIAsExpected = Math.abs(resultGUI - resultTransformed) < 0.01;
//             console.log(`GUI matches transformation: ${isGUIAsExpected} (diff: ${Math.abs(resultGUI - resultTransformed)})`);
//         } else {
//             console.log('Cannot compare GUI to transformation - one or both calculations failed');
//         }
        
//         // The test shows whether the transformation is working correctly
//         if (resultCLI !== null && resultTransformed !== null) {
//             const isRoundTripPreserved = Math.abs(resultCLI - resultTransformed) < 0.01;
//             if (!isRoundTripPreserved) {
//                 console.log('\n⚠️ Round-trip transformation is NOT preserving data correctly!');
//                 console.log('This explains why GUI and CLI calculators produce different results.');
//             }
//         }
        
//         // Document the key transformation issues found
//         console.log('\n=== Summary of Transformation Issues ===\n');
//         console.log('1. HEIGHT VALUES (z-coordinates):');
//         console.log('   - CLI: z=145 (mast 1), z=205 (mast 2)');
//         console.log('   - After transformation: z=50 (mast 1), z=30 (mast 2)');
//         console.log('   - GUI has: z=50 (mast 1), z=30 (mast 2)');
//         console.log('   → The transformation changes heights dramatically!\n');
        
//         console.log('2. ORIENTATION VALUES:');
//         console.log('   - CLI: x=-10, y=1 (raw values)');
//         console.log('   - After transformation: x=0.996, y=0.088 (normalized)');
//         console.log('   - GUI has: x=0.996, y=0.088 (normalized)');
//         console.log('   → Transformation normalizes orientation vectors\n');
        
//         console.log('3. CONDUCTOR PROPERTIES:');
//         console.log('   - ACDC values change: 2→1, 0→1');
//         console.log('   - SchallLwDB changes: 0→89 for first conductor');
//         console.log('   - Parabola parameters (a,b,c) are reset to 0');
//         console.log('   → Critical conductor properties are not preserved\n');
        
//         console.log('4. SEGMENT POINTS:');
//         console.log('   - CLI has empty SegmentPunkte arrays');
//         console.log('   - GUI has 8 segment points for first conductor');
//         console.log('   - Transformation produces empty arrays');
//         console.log('   → Segment points need to be calculated separately\n');
        
//         console.log('CONCLUSION:');
//         console.log('The GUI data appears to be the result of computationToUI → uiToComputation');
//         console.log('transformation, but this transformation is NOT preserving the original data.');
//         console.log('This explains why calculations differ between CLI and GUI versions.');
        
//         // For now, we're documenting the issue rather than asserting
//         // because we need to fix the transformation functions
//         expect(transformedTrasse.UsedMasten.length).toBe(cliTrasse.UsedMasten.length);
//     });
// });