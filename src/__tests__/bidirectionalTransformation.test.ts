// import { describe, it, expect } from 'vitest';
// import type { ConductorConnection } from '../store/projectStore';
// import type { UsedProjectData } from '../types/usedData';
// import type { MastLayoutTemplate } from '../types/mastLayout';
// import { readFileSync } from 'fs';
// import { join } from 'path';
// import { v4 as uuidv4 } from 'uuid';

// // Load test data
// function loadTestData(filename: string): UsedProjectData {
//   const testDataPath = join(__dirname, '..', 'test', 'data', filename);
//   const rawData = readFileSync(testDataPath, 'utf-8');
//   const parsed = JSON.parse(rawData);
//   // Handle both formats - with and without ProjectData wrapper
//   return parsed.ProjectData || parsed;
// }

// describe('Bidirectional Transformation with Real Test Data', () => {
//   describe('Test data from trasse4gelaende.json', () => {
//     const testData = loadTestData('trasse4gelaende.json');
    
//     it('should load test data correctly', () => {
//       expect(testData).toBeDefined();
//       expect(testData.Trassen).toBeDefined();
//       expect(testData.Trassen.length).toBeGreaterThan(0);
      
//       const firstTrasse = testData.Trassen[0];
//       expect(firstTrasse.UsedMasten).toBeDefined();
//       expect(firstTrasse.UsedMasten.length).toBeGreaterThan(0);
//     });
    
//     it('should extract overrides from computation data', () => {
//       const firstTrasse = testData.Trassen[0];
//       const firstMast = firstTrasse.UsedMasten[0];
//       const secondMast = firstTrasse.UsedMasten.length > 1 ? firstTrasse.UsedMasten[1] : null;
      
//       // Create a simple template based on the mast structure
//       const template: MastLayoutTemplate = {
//         id: 'test-template',
//         name: 'Test Template',
//         description: 'Generated from test data',
//         anzahlEbenen: firstMast.UsedEbenen.length,
//         ebenenConfig: firstMast.UsedEbenen.map((ebene, index) => ({
//           nummerEbene: ebene.NummerEbene || index + 1,
//           anzahlLeitungenLinks: ebene.UsedLeitungenLinks?.length || 0,
//           anzahlLeitungenRechts: ebene.UsedLeitungenRechts?.length || 0,
//         })),
//       };
      
//       const nextMastId = secondMast ? uuidv4() : undefined;
//       const overrides = extractMastOverrides(firstMast, template, nextMastId);
      
//       // The overrides should capture differences from template defaults
//       if (overrides) {
//         expect(overrides).toBeInstanceOf(Map);
        
//         // Check if conductor connections are extracted
//         for (const [ebeneNum, ebeneOverride] of overrides) {
//           if (ebeneOverride.leitungenLinksOverrides) {
//             for (const [leiterNum, leiterOverride] of ebeneOverride.leitungenLinksOverrides) {
//               if (leiterOverride.nextMastEbene !== undefined && leiterOverride.nextMastLeiter !== undefined) {
//                 // If there's a next mast, we should have a connection object
//                 if (nextMastId && (leiterOverride.nextMastEbene !== 0 || leiterOverride.nextMastLeiter !== 0)) {
//                   expect(leiterOverride.nextConnection).toBeDefined();
//                 }
//               }
//             }
//           }
//         }
//       }
//     });
    
//     it('should transform computation data to GUI format and back', () => {
//       const firstTrasse = testData.Trassen[0];
      
//       // Create EditableMast instances from UsedMast data
//       const editableMasts = new Map<string, EditableMast>();
//       const mastIds: string[] = [];
      
//       // Create a template based on the first mast
//       const firstMast = firstTrasse.UsedMasten[0];
//       const template: MastLayoutTemplate = {
//         id: 'test-template',
//         name: 'Test Template',
//         description: 'Generated from test data',
//         anzahlEbenen: firstMast.UsedEbenen.length,
//         ebenenConfig: firstMast.UsedEbenen.map((ebene, index) => ({
//           nummerEbene: ebene.NummerEbene || index + 1,
//           anzahlLeitungenLinks: ebene.UsedLeitungenLinks?.length || 0,
//           anzahlLeitungenRechts: ebene.UsedLeitungenRechts?.length || 0,
//         })),
//       };
      
//       // Convert each mast to EditableMast with proper IDs
//       firstTrasse.UsedMasten.forEach((mast, index) => {
//         const mastId = uuidv4();
//         mastIds.push(mastId);
        
//         const nextMastId = index < firstTrasse.UsedMasten.length - 1 ? uuidv4() : undefined;
//         const overrides = extractMastOverrides(mast, template, nextMastId);
        
//         const editableMast: EditableMast = {
//           ...mast,
//           id: mastId,
//           trasseId: 'trasse-1',
//           ebenenOverrides: overrides,
//         };
        
//         editableMasts.set(mastId, editableMast);
//       });
      
//       // Create TrasseUI
//       const trasseUI = {
//         id: 'trasse-1',
//         name: firstTrasse.Name,
//         nummer: firstTrasse.Nummer,
//         layoutTemplateId: template.id,
//         mastIds: mastIds,
//       };
      
//       // Transform back to UsedTrasse
//       const transformedTrasse = trasseUIToUsedTrasse(
//         trasseUI,
//         new Map(), // Empty masts map since we're using existingMasts
//         template,
//         editableMasts,
//         testData.LeiterTypes ? new Map(testData.LeiterTypes.map(lt => [lt.Name, lt])) : undefined
//       );
      
//       // Verify the transformation preserves essential data
//       expect(transformedTrasse.Name).toBe(firstTrasse.Name);
//       expect(transformedTrasse.Nummer).toBe(firstTrasse.Nummer);
//       expect(transformedTrasse.UsedMasten.length).toBe(firstTrasse.UsedMasten.length);
      
//       // Check that conductor properties are preserved
//       transformedTrasse.UsedMasten.forEach((mast, mastIndex) => {
//         const originalMast = firstTrasse.UsedMasten[mastIndex];
        
//         expect(mast.Name).toBe(originalMast.Name);
//         expect(mast.MastHoehe).toBe(originalMast.MastHoehe);
//         expect(mast.UsedEbenen.length).toBe(originalMast.UsedEbenen.length);
        
//         mast.UsedEbenen.forEach((ebene, ebeneIndex) => {
//           const originalEbene = originalMast.UsedEbenen[ebeneIndex];
          
//           // Check left conductors
//           if (ebene.UsedLeitungenLinks && originalEbene.UsedLeitungenLinks) {
//             expect(ebene.UsedLeitungenLinks.length).toBe(originalEbene.UsedLeitungenLinks.length);
            
//             ebene.UsedLeitungenLinks.forEach((leiter, leiterIndex) => {
//               const originalLeiter = originalEbene.UsedLeitungenLinks[leiterIndex];
              
//               // Check key properties are preserved
//               expect(leiter.AbstandMastachse).toBeCloseTo(originalLeiter.AbstandMastachse, 2);
//               // Durchhang might be 0 in the original data, which is valid
//               if (originalLeiter.Durchhang !== undefined) {
//                 expect(leiter.Durchhang).toBeCloseTo(originalLeiter.Durchhang, 2);
//               }
//               if (originalLeiter.Isolatorlaenge !== undefined) {
//                 expect(leiter.Isolatorlaenge).toBeCloseTo(originalLeiter.Isolatorlaenge, 2);
//               }
              
//               // Check SchallLw fields
//               if (originalLeiter.SchallLw) {
//                 expect(leiter.SchallLw).toBe(originalLeiter.SchallLw);
//               }
//             });
//           }
          
//           // Check right conductors
//           if (ebene.UsedLeitungenRechts && originalEbene.UsedLeitungenRechts) {
//             expect(ebene.UsedLeitungenRechts.length).toBe(originalEbene.UsedLeitungenRechts.length);
            
//             ebene.UsedLeitungenRechts.forEach((leiter, leiterIndex) => {
//               const originalLeiter = originalEbene.UsedLeitungenRechts[leiterIndex];
              
//               // Check key properties are preserved
//               expect(leiter.AbstandMastachse).toBeCloseTo(originalLeiter.AbstandMastachse, 2);
//               // Durchhang might be 0 in the original data, which is valid
//               if (originalLeiter.Durchhang !== undefined) {
//                 expect(leiter.Durchhang).toBeCloseTo(originalLeiter.Durchhang, 2);
//               }
//               if (originalLeiter.Isolatorlaenge !== undefined) {
//                 expect(leiter.Isolatorlaenge).toBeCloseTo(originalLeiter.Isolatorlaenge, 2);
//               }
//             });
//           }
//         });
//       });
//     });
//   });
  
//   describe('Test data from simple1.json', () => {
//     const testData = loadTestData('simple1.json');
    
//     it('should handle simple test data', () => {
//       expect(testData).toBeDefined();
      
//       // simple1.json might not have Trassen, check what it has
//       if (testData.Trassen && testData.Trassen.length > 0) {
//         const firstTrasse = testData.Trassen[0];
//         expect(firstTrasse).toBeDefined();
//       }
//     });
//   });
  
//   describe('Conductor connection handling', () => {
//     const testData = loadTestData('trasse4gelaende.json');
    
//     it('should correctly handle NextMastEbene and NextMastLeiter transformations', () => {
//       const firstTrasse = testData.Trassen[0];
//       if (firstTrasse.UsedMasten.length < 2) {
//         // Skip if not enough masts for connections
//         return;
//       }
      
//       // Create mast IDs for all masts
//       const mastIdMap = new Map<number, string>();
//       firstTrasse.UsedMasten.forEach((_, index) => {
//         mastIdMap.set(index, uuidv4());
//       });
      
//       // Check connections in the first mast
//       const firstMast = firstTrasse.UsedMasten[0];
//       const firstMastId = mastIdMap.get(0)!;
//       const secondMastId = mastIdMap.get(1)!;
      
//       // Create a template
//       const template: MastLayoutTemplate = {
//         id: 'test-template',
//         name: 'Test Template',
//         description: 'Generated from test data',
//         anzahlEbenen: firstMast.UsedEbenen.length,
//         ebenenConfig: firstMast.UsedEbenen.map((ebene, index) => ({
//           nummerEbene: ebene.NummerEbene || index + 1,
//           anzahlLeitungenLinks: ebene.UsedLeitungenLinks?.length || 0,
//           anzahlLeitungenRechts: ebene.UsedLeitungenRechts?.length || 0,
//         })),
//       };
      
//       // Extract overrides with proper connection handling
//       const overrides = extractMastOverrides(firstMast, template, secondMastId);
      
//       if (overrides) {
//         // Check each level
//         firstMast.UsedEbenen.forEach(ebene => {
//           const ebeneOverride = overrides.get(ebene.NummerEbene);
          
//           // Check left conductors
//           if (ebene.UsedLeitungenLinks) {
//             ebene.UsedLeitungenLinks.forEach((leiter, index) => {
//               if (leiter.NextMastEbene !== 0 || leiter.NextMastLeiter !== 0) {
//                 const leiterOverride = ebeneOverride?.leitungenLinksOverrides?.get(index + 1);
                
//                 // Should have connection info
//                 if (leiterOverride) {
//                   expect(leiterOverride.nextMastEbene).toBe(leiter.NextMastEbene);
//                   expect(leiterOverride.nextMastLeiter).toBe(leiter.NextMastLeiter);
                  
//                   // Should have connection object if next mast exists
//                   if (secondMastId) {
//                     expect(leiterOverride.nextConnection).toBeDefined();
//                     if (leiterOverride.nextConnection) {
//                       expect(leiterOverride.nextConnection.mastId).toBe(secondMastId);
//                       expect(leiterOverride.nextConnection.ebeneNum).toBe(leiter.NextMastEbene);
                      
//                       // Check side based on NextMastLeiter sign
//                       if (leiter.NextMastLeiter < 0) {
//                         expect(leiterOverride.nextConnection.side).toBe('left');
//                         expect(leiterOverride.nextConnection.leiterNum).toBe(Math.abs(leiter.NextMastLeiter));
//                       } else {
//                         expect(leiterOverride.nextConnection.side).toBe('right');
//                         expect(leiterOverride.nextConnection.leiterNum).toBe(leiter.NextMastLeiter);
//                       }
//                     }
//                   }
//                 }
//               }
//             });
//           }
          
//           // Check right conductors
//           if (ebene.UsedLeitungenRechts) {
//             ebene.UsedLeitungenRechts.forEach((leiter, index) => {
//               if (leiter.NextMastEbene !== 0 || leiter.NextMastLeiter !== 0) {
//                 const leiterOverride = ebeneOverride?.leitungenRechtsOverrides?.get(index + 1);
                
//                 // Should have connection info
//                 if (leiterOverride) {
//                   expect(leiterOverride.nextMastEbene).toBe(leiter.NextMastEbene);
//                   expect(leiterOverride.nextMastLeiter).toBe(leiter.NextMastLeiter);
                  
//                   // Should have connection object if next mast exists
//                   if (secondMastId) {
//                     expect(leiterOverride.nextConnection).toBeDefined();
//                     if (leiterOverride.nextConnection) {
//                       expect(leiterOverride.nextConnection.mastId).toBe(secondMastId);
//                       expect(leiterOverride.nextConnection.ebeneNum).toBe(leiter.NextMastEbene);
                      
//                       // Check side based on NextMastLeiter sign
//                       if (leiter.NextMastLeiter < 0) {
//                         expect(leiterOverride.nextConnection.side).toBe('left');
//                         expect(leiterOverride.nextConnection.leiterNum).toBe(Math.abs(leiter.NextMastLeiter));
//                       } else {
//                         expect(leiterOverride.nextConnection.side).toBe('right');
//                         expect(leiterOverride.nextConnection.leiterNum).toBe(leiter.NextMastLeiter);
//                       }
//                     }
//                   }
//                 }
//               }
//             });
//           }
//         });
//       }
//     });
//   });
// });

// describe('Bidirectional Transformation with Overrides', () => {
//   // Create a test template
//   const testTemplate: MastLayoutTemplate = {
//     id: 'test-template',
//     name: 'Test Template',
//     description: 'Template for testing',
//     anzahlEbenen: 2,
//     ebenenConfig: [
//       {
//         nummerEbene: 1,
//         anzahlLeitungenLinks: 2,
//         anzahlLeitungenRechts: 2,
//       },
//       {
//         nummerEbene: 2,
//         anzahlLeitungenLinks: 1,
//         anzahlLeitungenRechts: 1,
//       },
//     ],
//   };

//   // Create a test mast with overrides
//   const createTestMast = (): EditableMast => {
//     const mast: EditableMast = {
//       id: 'mast-1',
//       trasseId: 'trasse-1',
//       Name: 'Test Mast',
//       Fusspunkt: {
//         lfdNummer: 1,
//         OVektor: { x: 0, y: 0, Length: 0 },
//         GK_Vektor: {
//           GK: { Rechts: 1000, Hoch: 2000 },
//           z: 100,
//         },
//       },
//       MastHoehe: 100,
//       NullpunktHoehe: 150,
//       Ausrichtung: { x: 0, y: 1, Length: 1 },
//       GKAusrichtung: { Rechts: 0, Hoch: 1 },
//       UsedEbenen: [
//         {
//           NummerEbene: 1,
//           AbstandNullpunkt: 30, // Override from default 33.33
//           UsedLeitungenLinks: [
//             {
//               Durchgangspunkt: {
//                 GK: { Rechts: 990, Hoch: 2000 },
//                 z: 130,
//               },
//               ACDC: 1,
//               NummerLeiter: 1,
//               AbstandMastachse: 10,
//               Isolatorlaenge: 3, // Override from default 2.5
//               NextMastEbene: 1,
//               NextMastLeiter: -1,
//               Einbauart: 1, // Override from default 0
//               Durchhang: 6, // Override from default 5
//               ParabelA: 0,
//               ParabelB: 0,
//               ParabelC: 0,
//               SchallLw: 'L1', // Override
//               SchallLwDB: 80,
//               BetrU: 380,
//               AmSeg: 0,
//               SegLenU: 0,
//               LeiterLen: 0,
//               Mittelpkt: { GK: { Rechts: 0, Hoch: 0 }, z: 0 },
//               SegmentPunkte: [],
//             } as UsedLeiter,
//             {
//               Durchgangspunkt: {
//                 GK: { Rechts: 985, Hoch: 2000 },
//                 z: 130,
//               },
//               ACDC: 1,
//               NummerLeiter: 2,
//               AbstandMastachse: 15,
//               Isolatorlaenge: 2.5,
//               NextMastEbene: 1,
//               NextMastLeiter: -2,
//               Einbauart: 0,
//               Durchhang: 5,
//               ParabelA: 0,
//               ParabelB: 0,
//               ParabelC: 0,
//               SchallLw: '',
//               SchallLwDB: 55,
//               BetrU: 380,
//               AmSeg: 0,
//               SegLenU: 0,
//               LeiterLen: 0,
//               Mittelpkt: { GK: { Rechts: 0, Hoch: 0 }, z: 0 },
//               SegmentPunkte: [],
//             } as UsedLeiter,
//           ],
//           UsedLeitungenRechts: [
//             {
//               Durchgangspunkt: {
//                 GK: { Rechts: 1010, Hoch: 2000 },
//                 z: 130,
//               },
//               ACDC: 1,
//               NummerLeiter: 1,
//               AbstandMastachse: 10,
//               Isolatorlaenge: 2.5,
//               NextMastEbene: 1,
//               NextMastLeiter: 1,
//               Einbauart: 0,
//               Durchhang: 5,
//               ParabelA: 0,
//               ParabelB: 0,
//               ParabelC: 0,
//               SchallLw: '',
//               SchallLwDB: 60, // Override from default 55
//               BetrU: 380,
//               AmSeg: 0,
//               SegLenU: 0,
//               LeiterLen: 0,
//               Mittelpkt: { GK: { Rechts: 0, Hoch: 0 }, z: 0 },
//               SegmentPunkte: [],
//             } as UsedLeiter,
//             {
//               Durchgangspunkt: {
//                 GK: { Rechts: 1015, Hoch: 2000 },
//                 z: 130,
//               },
//               ACDC: 1,
//               NummerLeiter: 2,
//               AbstandMastachse: 15,
//               Isolatorlaenge: 2.5,
//               NextMastEbene: 2, // Override connection
//               NextMastLeiter: -1, // Override connection
//               Einbauart: 0,
//               Durchhang: 5,
//               ParabelA: 0,
//               ParabelB: 0,
//               ParabelC: 0,
//               SchallLw: '',
//               SchallLwDB: 55,
//               BetrU: 380,
//               AmSeg: 0,
//               SegLenU: 0,
//               LeiterLen: 0,
//               Mittelpkt: { GK: { Rechts: 0, Hoch: 0 }, z: 0 },
//               SegmentPunkte: [],
//             } as UsedLeiter,
//           ],
//         },
//         {
//           NummerEbene: 2,
//           AbstandNullpunkt: 66.67,
//           UsedLeitungenLinks: [
//             {
//               Durchgangspunkt: {
//                 GK: { Rechts: 990, Hoch: 2000 },
//                 z: 166.67,
//               },
//               ACDC: 1,
//               NummerLeiter: 1,
//               AbstandMastachse: 10,
//               Isolatorlaenge: 2.5,
//               NextMastEbene: 2,
//               NextMastLeiter: -1,
//               Einbauart: 0,
//               Durchhang: 5,
//               ParabelA: 0,
//               ParabelB: 0,
//               ParabelC: 0,
//               SchallLw: '',
//               SchallLwDB: 55,
//               BetrU: 380,
//               AmSeg: 0,
//               SegLenU: 0,
//               LeiterLen: 0,
//               Mittelpkt: { GK: { Rechts: 0, Hoch: 0 }, z: 0 },
//               SegmentPunkte: [],
//             } as UsedLeiter,
//           ],
//           UsedLeitungenRechts: [
//             {
//               Durchgangspunkt: {
//                 GK: { Rechts: 1010, Hoch: 2000 },
//                 z: 166.67,
//               },
//               ACDC: 1,
//               NummerLeiter: 1,
//               AbstandMastachse: 10,
//               Isolatorlaenge: 2.5,
//               NextMastEbene: 2,
//               NextMastLeiter: 1,
//               Einbauart: 0,
//               Durchhang: 5,
//               ParabelA: 0,
//               ParabelB: 0,
//               ParabelC: 0,
//               SchallLw: '',
//               SchallLwDB: 55,
//               BetrU: 380,
//               AmSeg: 0,
//               SegLenU: 0,
//               LeiterLen: 0,
//               Mittelpkt: { GK: { Rechts: 0, Hoch: 0 }, z: 0 },
//               SegmentPunkte: [],
//             } as UsedLeiter,
//           ],
//         },
//       ],
//       ebenenOverrides: new Map([
//         [1, {
//           abstandNullpunkt: 30,
//           leitungenLinksOverrides: new Map([
//             [1, {
//               isolatorlaenge: 3,
//               durchhang: 6,
//               schallLw: 'L1',
//               einbauart: 1,
//             }],
//           ]),
//           leitungenRechtsOverrides: new Map([
//             [1, {
//               schallLwDB: 60,
//             }],
//             [2, {
//               nextMastEbene: 2,
//               nextMastLeiter: -1,
//             }],
//           ]),
//         }],
//       ]),
//     };
    
//     return mast;
//   };

//   it('should extract overrides correctly from UsedMast', () => {
//     const mast = createTestMast();
//     const overrides = extractMastOverrides(mast, testTemplate);
    
//     expect(overrides).toBeDefined();
//     expect(overrides?.size).toBe(1); // Only level 1 has overrides
    
//     const level1Overrides = overrides?.get(1);
//     expect(level1Overrides).toBeDefined();
//     expect(level1Overrides?.abstandNullpunkt).toBe(30);
    
//     // Check left conductor overrides
//     expect(level1Overrides?.leitungenLinksOverrides?.size).toBe(1);
//     const leftLeiter1 = level1Overrides?.leitungenLinksOverrides?.get(1);
//     expect(leftLeiter1?.isolatorlaenge).toBe(3);
//     expect(leftLeiter1?.durchhang).toBe(6);
//     expect(leftLeiter1?.schallLw).toBe('L1');
//     expect(leftLeiter1?.einbauart).toBe(1);
    
//     // Check right conductor overrides
//     expect(level1Overrides?.leitungenRechtsOverrides?.size).toBe(2);
//     const rightLeiter1 = level1Overrides?.leitungenRechtsOverrides?.get(1);
//     expect(rightLeiter1?.schallLwDB).toBe(60);
    
//     const rightLeiter2 = level1Overrides?.leitungenRechtsOverrides?.get(2);
//     expect(rightLeiter2?.nextMastEbene).toBe(2);
//     expect(rightLeiter2?.nextMastLeiter).toBe(-1);
//   });

//   it('should apply overrides correctly in trasseUIToUsedTrasse', () => {
//     const mast = createTestMast();
//     const trasseUI = {
//       id: 'trasse-1',
//       name: 'Test Trasse',
//       nummer: 1,
//       layoutTemplateId: 'test-template',
//       mastIds: ['mast-1'],
//     };
    
//     const masts = new Map();
//     const existingMasts = new Map([['mast-1', mast]]);
//     const leiterTypes = new Map([['L1', { Name: 'L1', SchallLW: 80 }]]);
    
//     const result = trasseUIToUsedTrasse(
//       trasseUI,
//       masts,
//       testTemplate,
//       existingMasts,
//       leiterTypes
//     );
    
//     expect(result.UsedMasten).toHaveLength(1);
//     const resultMast = result.UsedMasten[0];
    
//     // Check that overrides were applied
//     const ebene1 = resultMast.UsedEbenen[0];
//     expect(ebene1.AbstandNullpunkt).toBe(30);
    
//     const leftLeiter1 = ebene1.UsedLeitungenLinks[0];
//     expect(leftLeiter1.Isolatorlaenge).toBe(3);
//     expect(leftLeiter1.Durchhang).toBe(6);
//     expect(leftLeiter1.SchallLw).toBe('L1');
//     expect(leftLeiter1.SchallLwDB).toBe(80); // Updated from LeiterTypes
//     expect(leftLeiter1.Einbauart).toBe(1);
    
//     const rightLeiter1 = ebene1.UsedLeitungenRechts[0];
//     expect(rightLeiter1.SchallLwDB).toBe(60);
    
//     const rightLeiter2 = ebene1.UsedLeitungenRechts[1];
//     expect(rightLeiter2.NextMastEbene).toBe(2);
//     expect(rightLeiter2.NextMastLeiter).toBe(-1);
//   });

//   it('should convert conductor connections correctly', () => {
//     // Test connection to computation format
//     const connection: ConductorConnection = {
//       mastId: 'mast-2',
//       ebeneNum: 2,
//       side: 'left',
//       leiterNum: 3
//     };
    
//     const computed = connectionToComputationFormat(connection);
//     expect(computed.nextMastEbene).toBe(2);
//     expect(computed.nextMastLeiter).toBe(-3); // Negative for left side
    
//     // Test computation to connection format
//     const reverseConnection = computationToConnectionFormat(2, -3, 'mast-2');
//     expect(reverseConnection).toEqual(connection);
    
//     // Test right side
//     const rightConnection: ConductorConnection = {
//       mastId: 'mast-2',
//       ebeneNum: 1,
//       side: 'right',
//       leiterNum: 2
//     };
    
//     const rightComputed = connectionToComputationFormat(rightConnection);
//     expect(rightComputed.nextMastEbene).toBe(1);
//     expect(rightComputed.nextMastLeiter).toBe(2); // Positive for right side
    
//     const rightReverse = computationToConnectionFormat(1, 2, 'mast-2');
//     expect(rightReverse).toEqual(rightConnection);
    
//     // Test null connection
//     const nullComputed = connectionToComputationFormat(null);
//     expect(nullComputed.nextMastEbene).toBe(0);
//     expect(nullComputed.nextMastLeiter).toBe(0);
    
//     const nullReverse = computationToConnectionFormat(0, 0, 'mast-2');
//     expect(nullReverse).toBeNull();
//   });
  
//   it('should maintain data through round-trip transformation', () => {
//     const originalMast = createTestMast();
    
//     // Extract overrides
//     const extractedOverrides = extractMastOverrides(originalMast, testTemplate);
    
//     // Create a new mast with the same overrides
//     const newMast: EditableMast = {
//       ...originalMast,
//       ebenenOverrides: extractedOverrides,
//     };
    
//     // Transform to UsedTrasse and back
//     const trasseUI = {
//       id: 'trasse-1',
//       name: 'Test Trasse',
//       nummer: 1,
//       layoutTemplateId: 'test-template',
//       mastIds: ['mast-1'],
//     };
    
//     const masts = new Map();
//     const existingMasts = new Map([['mast-1', newMast]]);
//     const leiterTypes = new Map([['L1', { Name: 'L1', SchallLW: 80 }]]);
    
//     const transformedTrasse = trasseUIToUsedTrasse(
//       trasseUI,
//       masts,
//       testTemplate,
//       existingMasts,
//       leiterTypes
//     );
    
//     const transformedMast = transformedTrasse.UsedMasten[0];
    
//     // Check critical values are preserved
//     expect(transformedMast.UsedEbenen[0].AbstandNullpunkt).toBe(30);
//     expect(transformedMast.UsedEbenen[0].UsedLeitungenLinks[0].Isolatorlaenge).toBe(3);
//     expect(transformedMast.UsedEbenen[0].UsedLeitungenLinks[0].Durchhang).toBe(6);
//     expect(transformedMast.UsedEbenen[0].UsedLeitungenLinks[0].SchallLw).toBe('L1');
//     expect(transformedMast.UsedEbenen[0].UsedLeitungenLinks[0].Einbauart).toBe(1);
//     expect(transformedMast.UsedEbenen[0].UsedLeitungenRechts[0].SchallLwDB).toBe(60);
//     expect(transformedMast.UsedEbenen[0].UsedLeitungenRechts[1].NextMastEbene).toBe(2);
//     expect(transformedMast.UsedEbenen[0].UsedLeitungenRechts[1].NextMastLeiter).toBe(-1);
//   });
// });