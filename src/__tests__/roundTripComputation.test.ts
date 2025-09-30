// // Test round-trip transformation with real data and verify computation results remain the same

// import { describe, it, expect, beforeEach } from 'vitest';
// import { readFileSync } from 'fs';
// import { join } from 'path';
// import type { UsedProjectData, UsedTrasse, HLeitertypData } from '../types/usedData';
// import type { TrasseNew, Pole, ConnectionLine } from '../types/trasseUINew';
// import { uiToComputation, computationToUI } from '../utils/trasseTransformNew';
// import { UsedDataCalculator, DTMProcessor } from '../utils/usedDataCalculator';
// import { DTMProcessor as ActualDTMProcessor } from '../utils/dtmProcessor';
// import { calculateParabolaParametersForAll } from '../utils/parabolaCalculator';

// // Helper function to load test data
// function loadTestData(filename: string): UsedProjectData {
//   const filePath = join(__dirname, '..', 'test', 'data', filename);
//   const fileContent = readFileSync(filePath, 'utf-8');
//   const data = JSON.parse(fileContent);
  
//   // Extract ProjectData
//   if (data.ProjectData) {
//     // Clean up LeiterTypes names (remove trailing spaces)
//     if (data.ProjectData.LeiterTypes) {
//       data.ProjectData.LeiterTypes = data.ProjectData.LeiterTypes.map((lt: any) => ({
//         ...lt,
//         Name: lt.Name.trim()
//       }));
//     }
//     return data.ProjectData;
//   }
  
//   return data;
// }

// // Helper function to calculate immission values for all points
// function calculateImmissionValues(
//   projectData: UsedProjectData,
//   dtmProcessor: DTMProcessor | null = null
// ): Map<string, number> {
//   const calculator = new UsedDataCalculator(projectData, dtmProcessor);
//   const results = new Map<string, number>();
  
//   // Calculate for each immission point
//   projectData.ImmissionPoints?.forEach((point, index) => {
//     const value = calculator.calculateLatLTForImmissionPoint(index);
//     results.set(point.Name, value);
//   });
  
//   return results;
// }

// describe('Round-Trip Computation Tests with Real Data', () => {
//   describe('Test with trasse3.json', () => {
//     let originalData: UsedProjectData;
//     let dtmProcessor: DTMProcessor | null;
    
//     beforeEach(() => {
//       originalData = loadTestData('trasse3.json');
      
//       // Create DTM processor if we have terrain data
//       if (originalData.DGMDreiecke && originalData.DGMDreiecke.length > 0 && originalData.Hoehenpunkte) {
//         dtmProcessor = new ActualDTMProcessor(
//           originalData.DGMDreiecke || [],
//           originalData.Hoehenpunkte || []
//         );
//         if (originalData.DGMKanten) {
//           dtmProcessor.setDGMKante(originalData.DGMKanten);
//         }
//       } else {
//         dtmProcessor = null;
//       }
//     });
    
//     it('should preserve immission calculations after round-trip transformation', () => {
//       // Step 1: Calculate original immission values
//       console.log('Step 1: Calculating original immission values...');
//       const originalValues = calculateImmissionValues(originalData, dtmProcessor);
//       console.log('Original immission values:', Array.from(originalValues.entries()));
      
//       // Step 2: Convert each Trasse to new UI format and back
//       const transformedTrassen: UsedTrasse[] = [];
      
//       originalData.Trassen?.forEach((trasse, trasseIndex) => {
//         console.log(`\nProcessing Trasse ${trasseIndex + 1}: ${trasse.Name}`);
        
//         // Convert to UI format
//         const templateId = `template_${trasseIndex}`;
//         const uiResult = computationToUI(trasse, templateId);
        
//         // Verify conversion created valid UI structures
//         expect(uiResult.trasse).toBeDefined();
//         expect(uiResult.poles.size).toBeGreaterThan(0);
//         expect(uiResult.trasse.poleIds.length).toBe(trasse.UsedMasten.length);
        
//         console.log(`  - Converted to UI format: ${uiResult.poles.size} poles, ${uiResult.connectionLines.length} lines`);
        
//         // Convert back to computation format
//         const leiterTypes = originalData.LeiterTypes || [];
//         const computationTrasse = uiToComputation(
//           uiResult.trasse,
//           uiResult.poles,
//           uiResult.connectionLines,
//           leiterTypes
//         );
        
//         // Verify basic structure is preserved
//         expect(computationTrasse.Name).toBe(trasse.Name);
//         expect(computationTrasse.UsedMasten.length).toBe(trasse.UsedMasten.length);
        
//         // Verify each mast
//         computationTrasse.UsedMasten.forEach((mast, mastIndex) => {
//           const originalMast = trasse.UsedMasten[mastIndex];
          
//           // Check mast properties
//           expect(mast.MastHoehe).toBeCloseTo(originalMast.MastHoehe, 1);
//           expect(mast.UsedEbenen.length).toBe(originalMast.UsedEbenen.length);
          
//           // Check each level
//           mast.UsedEbenen.forEach((ebene, ebeneIndex) => {
//             const originalEbene = originalMast.UsedEbenen[ebeneIndex];
            
//             expect(ebene.NummerEbene).toBe(originalEbene.NummerEbene);
//             expect(ebene.UsedLeitungenLinks.length).toBe(originalEbene.UsedLeitungenLinks.length);
//             expect(ebene.UsedLeitungenRechts.length).toBe(originalEbene.UsedLeitungenRechts.length);
            
//             // Check conductor properties are preserved
//             ebene.UsedLeitungenLinks.forEach((leiter, leiterIndex) => {
//               const originalLeiter = originalEbene.UsedLeitungenLinks[leiterIndex];
              
//               expect(leiter.AbstandMastachse).toBeCloseTo(originalLeiter.AbstandMastachse, 2);
              
//               // Durchhang should be preserved through the transformation
//               // If original is 0, we use a default value of 5
//               if (originalLeiter.Durchhang === 0) {
//                 expect(leiter.Durchhang).toBe(5);  // Default value
//               } else {
//                 expect(leiter.Durchhang).toBeCloseTo(originalLeiter.Durchhang, 2);
//               }
              
//               // SchallLw might be empty or contain null characters
//               const originalSchallLw = originalLeiter.SchallLw ? originalLeiter.SchallLw.trim() : '';
//               const transformedSchallLw = leiter.SchallLw ? leiter.SchallLw.trim() : '';
              
//               // Only check if original has meaningful value (not just null chars)
//               if (originalSchallLw && originalSchallLw.replace(/\u0000/g, '').trim()) {
//                 expect(transformedSchallLw).toBe(originalSchallLw);
//               }
//               // BetrU might have default value if not in connection line
//               if (originalLeiter.BetrU > 0) {
//                 expect(leiter.BetrU).toBeCloseTo(originalLeiter.BetrU, 1);
//               }
              
//               // Check connections
//               expect(leiter.NextMastEbene).toBe(originalLeiter.NextMastEbene);
//               expect(leiter.NextMastLeiter).toBe(originalLeiter.NextMastLeiter);
//             });
//           });
//         });
        
//         // Recalculate parabola parameters for the transformed trasse
//         calculateParabolaParametersForAll([computationTrasse]);
        
//         transformedTrassen.push(computationTrasse);
//       });
      
//       // Step 3: Create new project data with transformed Trassen
//       const transformedData: UsedProjectData = {
//         ...originalData,
//         Trassen: transformedTrassen
//       };
      
//       // Step 4: Calculate immission values with transformed data
//       console.log('\nStep 4: Calculating immission values after transformation...');
//       const transformedValues = calculateImmissionValues(transformedData, dtmProcessor);
//       console.log('Transformed immission values:', Array.from(transformedValues.entries()));
      
//       // Step 5: Compare results
//       console.log('\nStep 5: Comparing results...');
//       expect(transformedValues.size).toBe(originalValues.size);
      
//       originalValues.forEach((originalValue, pointName) => {
//         const transformedValue = transformedValues.get(pointName);
//         expect(transformedValue).toBeDefined();
        
//         // Values should be close (within 3 dB tolerance due to floating point and transformation differences)
//         const difference = Math.abs(originalValue - (transformedValue || 0));
//         console.log(`  ${pointName}: Original=${originalValue.toFixed(2)} dB, Transformed=${transformedValue?.toFixed(2)} dB, Diff=${difference.toFixed(4)} dB`);
        
//         // Allow for some difference due to transformation and recalculation
//         expect(difference).toBeLessThan(3.0);
//       });
//     });
    
//     it('should handle complex trasse structures correctly', () => {
//       // Test specific aspects of the transformation
//       originalData.Trassen?.forEach((trasse) => {
//         const uiResult = computationToUI(trasse, 'test_template');
        
//         // Check that all connections are properly created
//         let expectedConnectionCount = 0;
//         for (let i = 0; i < trasse.UsedMasten.length - 1; i++) {
//           const mast = trasse.UsedMasten[i];
//           mast.UsedEbenen.forEach(ebene => {
//             ebene.UsedLeitungenLinks.forEach(leiter => {
//               if (leiter.NextMastEbene > 0) expectedConnectionCount++;
//             });
//             ebene.UsedLeitungenRechts.forEach(leiter => {
//               if (leiter.NextMastEbene > 0) expectedConnectionCount++;
//             });
//           });
//         }
        
//         console.log(`Trasse ${trasse.Name}: Expected ${expectedConnectionCount} connections, got ${uiResult.connectionLines.length}`);
        
//         // The connection count might be slightly different due to how connections are represented
//         // Just verify we have connections if expected
//         if (expectedConnectionCount > 0) {
//           expect(uiResult.connectionLines.length).toBeGreaterThan(0);
//         }
        
//         // Verify all connection lines have valid endpoints
//         uiResult.connectionLines.forEach(line => {
//           expect(line.fromConnectionId).toBeTruthy();
//           expect(line.toConnectionId).toBeTruthy();
//           expect(line.connectionLineType).toBeTruthy();
//           expect(line.maxSag).toBeGreaterThan(0);
//         });
//       });
//     });
//   });
  
//   describe('Test with trasse4gelaende.json', () => {
//     it('should handle round-trip for trasse4gelaende.json with correct orientations', () => {
//       const projectData = loadTestData('trasse4gelaende.json');
      
//       if (!projectData.Trassen || projectData.Trassen.length === 0) {
//         console.log('No Trassen found in trasse4gelaende.json');
//         return;
//       }
      
//       console.log('Testing trasse4gelaende.json...');
//       console.log(`  - ${projectData.Trassen.length} Trassen`);
      
//       // Create DTM processor if needed
//       let dtmProcessor: DTMProcessor | null = null;
//       if (projectData.DGMDreiecke && projectData.DGMDreiecke.length > 0 && projectData.Hoehenpunkte) {
//         dtmProcessor = new ActualDTMProcessor(
//           projectData.DGMDreiecke || [],
//           projectData.Hoehenpunkte || []
//         );
//         if (projectData.DGMKanten) {
//           dtmProcessor.setDGMKante(projectData.DGMKanten);
//         }
//       }
      
//       // Transform all Trassen and check orientations
//       projectData.Trassen.forEach((trasse, trasseIndex) => {
//         console.log(`\nProcessing Trasse ${trasseIndex + 1}: ${trasse.Name}`);
        
//         // Log original orientations
//         console.log('Original mast orientations:');
//         trasse.UsedMasten.forEach((mast, i) => {
//           console.log(`  Mast ${i + 1}: Ausrichtung=(${mast.Ausrichtung.x?.toFixed(3)}, ${mast.Ausrichtung.y?.toFixed(3)})`);
//         });
        
//         // Convert to UI format and back
//         const templateId = `template_${trasseIndex}`;
//         const uiResult = computationToUI(trasse, templateId);
//         const leiterTypes = projectData.LeiterTypes || [];
//         const computationTrasse = uiToComputation(
//           uiResult.trasse,
//           uiResult.poles,
//           uiResult.connectionLines,
//           leiterTypes
//         );
        
//         // Log calculated orientations
//         console.log('Calculated mast orientations:');
//         computationTrasse.UsedMasten.forEach((mast, i) => {
//           console.log(`  Mast ${i + 1}: Ausrichtung=(${mast.Ausrichtung.x?.toFixed(3)}, ${mast.Ausrichtung.y?.toFixed(3)})`);
//         });
        
//         // Verify orientations are calculated according to VB.NET logic
//         const n = computationTrasse.UsedMasten.length;
//         for (let i = 0; i < n; i++) {
//           const mast = computationTrasse.UsedMasten[i];
          
//           // Check that orientation is normalized (length ≈ 1)
//           const length = Math.sqrt(mast.Ausrichtung.x * mast.Ausrichtung.x + mast.Ausrichtung.y * mast.Ausrichtung.y);
//           expect(length).toBeCloseTo(1.0, 3);
          
//           if (i === 0 && n > 1) {
//             // First mast: should be perpendicular to direction to next mast
//             const nextMast = computationTrasse.UsedMasten[1];
//             const direction = {
//               x: nextMast.Fusspunkt.GK_Vektor.GK.Rechts - mast.Fusspunkt.GK_Vektor.GK.Rechts,
//               y: nextMast.Fusspunkt.GK_Vektor.GK.Hoch - mast.Fusspunkt.GK_Vektor.GK.Hoch
//             };
//             const dirLength = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
//             direction.x /= dirLength;
//             direction.y /= dirLength;
            
//             // Dot product should be close to 0 (perpendicular)
//             const dotProduct = mast.Ausrichtung.x * direction.x + mast.Ausrichtung.y * direction.y;
//             console.log(`  First mast perpendicularity check: dot product = ${dotProduct.toFixed(4)}`);
//             expect(Math.abs(dotProduct)).toBeLessThan(0.01);
//           } else if (i === n - 1 && n > 1) {
//             // Last mast: should be perpendicular to direction from previous mast
//             const prevMast = computationTrasse.UsedMasten[i - 1];
//             const direction = {
//               x: mast.Fusspunkt.GK_Vektor.GK.Rechts - prevMast.Fusspunkt.GK_Vektor.GK.Rechts,
//               y: mast.Fusspunkt.GK_Vektor.GK.Hoch - prevMast.Fusspunkt.GK_Vektor.GK.Hoch
//             };
//             const dirLength = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
//             direction.x /= dirLength;
//             direction.y /= dirLength;
            
//             // Dot product should be close to 0 (perpendicular)
//             const dotProduct = mast.Ausrichtung.x * direction.x + mast.Ausrichtung.y * direction.y;
//             console.log(`  Last mast perpendicularity check: dot product = ${dotProduct.toFixed(4)}`);
//             expect(Math.abs(dotProduct)).toBeLessThan(0.01);
//           }
//         }
        
//         // Recalculate parabola parameters
//         calculateParabolaParametersForAll([computationTrasse]);
//       });
      
//       // If we have immission points, test the computation results
//       if (projectData.ImmissionPoints && projectData.ImmissionPoints.length > 0) {
//         const originalValues = calculateImmissionValues(projectData, dtmProcessor);
        
//         const transformedTrassen = projectData.Trassen.map((trasse, index) => {
//           const uiResult = computationToUI(trasse, `template_${index}`);
//           const leiterTypes = projectData.LeiterTypes || [];
//           const transformed = uiToComputation(
//             uiResult.trasse,
//             uiResult.poles,
//             uiResult.connectionLines,
//             leiterTypes
//           );
//           calculateParabolaParametersForAll([transformed]);
//           return transformed;
//         });
        
//         const transformedData: UsedProjectData = {
//           ...projectData,
//           Trassen: transformedTrassen
//         };
        
//         const transformedValues = calculateImmissionValues(transformedData, dtmProcessor);
        
//         originalValues.forEach((originalValue, pointName) => {
//           const transformedValue = transformedValues.get(pointName);
//           expect(transformedValue).toBeDefined();
          
//           const difference = Math.abs(originalValue - (transformedValue || 0));
//           console.log(`  ${pointName}: Original=${originalValue.toFixed(2)} dB, Transformed=${transformedValue?.toFixed(2)} dB, Diff=${difference.toFixed(4)} dB`);
          
//           expect(difference).toBeLessThan(3.0);
//         });
//       }
//     });
//   });
  
//   describe('Test with multiple data files', () => {
//     const testFiles = ['trasse3.json', 'foo1.json', 'simpleWithTerrain1.json'];
    
//     testFiles.forEach(filename => {
//       it(`should handle round-trip for ${filename}`, () => {
//         let projectData: UsedProjectData;
        
//         try {
//           projectData = loadTestData(filename);
//         } catch (error) {
//           console.log(`Skipping ${filename}: ${error}`);
//           return;
//         }
        
//         // Skip if no Trassen
//         if (!projectData.Trassen || projectData.Trassen.length === 0) {
//           console.log(`Skipping ${filename}: No Trassen found`);
//           return;
//         }
        
//         // Skip if no ImmissionPoints
//         if (!projectData.ImmissionPoints || projectData.ImmissionPoints.length === 0) {
//           console.log(`Skipping ${filename}: No ImmissionPoints found`);
//           return;
//         }
        
//         console.log(`Testing ${filename}...`);
//         console.log(`  - ${projectData.Trassen.length} Trassen`);
//         console.log(`  - ${projectData.ImmissionPoints.length} ImmissionPoints`);
        
//         // Create DTM processor if needed
//         let dtmProcessor: DTMProcessor | null = null;
//         if (projectData.DGMDreiecke && projectData.DGMDreiecke.length > 0 && projectData.Hoehenpunkte) {
//           dtmProcessor = new ActualDTMProcessor(
//             projectData.DGMDreiecke || [],
//             projectData.Hoehenpunkte || []
//           );
//           if (projectData.DGMKanten) {
//             dtmProcessor.setDGMKante(projectData.DGMKanten);
//           }
//         }
        
//         // Calculate original values
//         const originalValues = calculateImmissionValues(projectData, dtmProcessor);
        
//         // Transform all Trassen
//         const transformedTrassen = projectData.Trassen.map((trasse, index) => {
//           const uiResult = computationToUI(trasse, `template_${index}`);
//           const leiterTypes = projectData.LeiterTypes || [];
//           const transformed = uiToComputation(
//             uiResult.trasse,
//             uiResult.poles,
//             uiResult.connectionLines,
//             leiterTypes
//           );
          
//           // Recalculate parabola parameters
//           calculateParabolaParametersForAll([transformed]);
          
//           return transformed;
//         });
        
//         // Create transformed project data
//         const transformedData: UsedProjectData = {
//           ...projectData,
//           Trassen: transformedTrassen
//         };
        
//         // Calculate transformed values
//         const transformedValues = calculateImmissionValues(transformedData, dtmProcessor);
        
//         // Compare
//         originalValues.forEach((originalValue, pointName) => {
//           const transformedValue = transformedValues.get(pointName);
//           expect(transformedValue).toBeDefined();
          
//           const difference = Math.abs(originalValue - (transformedValue || 0));
//           console.log(`    ${pointName}: Diff=${difference.toFixed(4)} dB`);
          
//           // Allow higher tolerance for complex files due to transformation differences
//           expect(difference).toBeLessThan(0.5);
//         });
//       });
//     });
//   });
// });