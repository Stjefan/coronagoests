// import { describe, it, expect, beforeEach } from 'vitest';
// import { useProjectStore } from '../store/projectStore';
// import { calculateParabolaParametersForAll } from '../utils/parabolaCalculator';
// import { trasseUIToUsedTrasse } from '../types/trasseUI';
// import { UsedDataCalculator } from '../utils/usedDataCalculator';
// import { DTMProcessor } from '../utils/dtmProcessor';
// import type { UsedTrasse, UsedProjectData } from '../types/usedData';
// import testDataTrasse4 from '../test/data/trasse4gelaende.json';
// import testDataTerrain4 from '../test/data/terrain4combined.json';
// import testDataTerrain5 from '../test/data/terrain5complex.json';

// describe('Compute from GUI vs Direct Computation', () => {
//   beforeEach(() => {
//     // Reset the store before each test
//     useProjectStore.setState({
//       originalData: null,
//       hoehenpunkte: new Map(),
//       esqSources: new Map(),
//       immissionPoints: new Map(),
//       masts: new Map(),
//       trassen: new Map(),
//       mastLayoutTemplates: new Map(),
//       leiterTypes: new Map(),
//       cachedImmissionValues: new Map(),
//     });
//   });

//   // Parameterized test for multiple datasets
//   const testDatasets = [
//     { name: 'trasse4gelaende', data: testDataTrasse4 },
//     { name: 'terrain4combined', data: testDataTerrain4 },
//     { name: 'terrain5complex', data: testDataTerrain5 },
//   ];

//   it.each(testDatasets)('should produce identical results for $name dataset', ({ name, data }) => {
//     const projectData = data.ProjectData as UsedProjectData;
    
//     // Skip if no immission points
//     if (!projectData.ImmissionPoints || projectData.ImmissionPoints.length === 0) {
//       console.log(`Skipping ${name}: No immission points`);
//       return;
//     }
    
//     // Skip if no trassen
//     if (!projectData.Trassen || projectData.Trassen.length === 0) {
//       console.log(`Skipping ${name}: No trassen`);
//       return;
//     }
    
//     console.log(`\n${'='.repeat(70)}`);
//     console.log(`Testing dataset: ${name}`);
//     console.log(`Total immission points: ${projectData.ImmissionPoints.length}`);
//     console.log(`Total trassen: ${projectData.Trassen.length}`);
//     console.log(`${'='.repeat(70)}`);
    
//     // Test all immission points
//     for (let pointIndex = 0; pointIndex < projectData.ImmissionPoints.length; pointIndex++) {
//       const immissionPoint = projectData.ImmissionPoints[pointIndex];
//       console.log(`\n${'='.repeat(60)}`);
//       console.log(`Testing immission point ${pointIndex + 1}/${projectData.ImmissionPoints.length}: ${immissionPoint.Name}`);
//       console.log('Position:', immissionPoint.Position);
    
//       // ========================================
//       // CASE 1: Direct computation from parsed data
//       // ========================================
//       console.log('\n=== CASE 1: Direct Computation ===');
      
//       // Calculate parabola parameters for the original data
//       const originalTrassen = [...projectData.Trassen];
//       calculateParabolaParametersForAll(originalTrassen);
      
//       // Create DTM processor
//       const dtmProcessor = new DTMProcessor(
//         projectData.DGMDreiecke || [],
//         projectData.Hoehenpunkte || []
//       );
//       dtmProcessor.setDGMKante(projectData.DGMKanten || []);
      
//       // Create calculator with original data
//       const directCalculator = new UsedDataCalculator(
//         { ...projectData, Trassen: originalTrassen },
//         dtmProcessor
//       );
      
//       // Calculate immission value for current point
//       const directValue = directCalculator.calculateLatLTForImmissionPoint(pointIndex);
//       console.log('Direct computation result:', directValue, 'dB');
      
//       // Log details only for the first point to avoid clutter
//       if (pointIndex === 0) {
//         console.log('\nDirect computation trasse details:');
//         const directTrasse = originalTrassen[0];
//         console.log('- Trasse name:', directTrasse.Name);
//         console.log('- Number of masts:', directTrasse.UsedMasten.length);
//         console.log('- First mast position:', directTrasse.UsedMasten[0].Fusspunkt.GK_Vektor);
//         console.log('- First conductor details:');
//         const directLeiter = directTrasse.UsedMasten[0].UsedEbenen[0].UsedLeitungenLinks[0];
//         console.log('  - ParabelA:', directLeiter.ParabelA);
//         console.log('  - ParabelB:', directLeiter.ParabelB);
//         console.log('  - ParabelC:', directLeiter.ParabelC);
//         console.log('  - Durchhang:', directLeiter.Durchhang);
//         console.log('  - SchallLw:', directLeiter.SchallLw);
//         console.log('  - SchallLwDB:', directLeiter.SchallLwDB);
//         console.log('  - NextMastEbene:', directLeiter.NextMastEbene);
//         console.log('  - NextMastLeiter:', directLeiter.NextMastLeiter);
//         console.log('  - Mittelpkt:', directLeiter.Mittelpkt);
//       }
      
//       // ========================================
//       // CASE 2: GUI round-trip computation
//       // ========================================
//       console.log('\n=== CASE 2: GUI Round-trip Computation ===');
      
//       // Load the data into the store (simulating GUI load) - only do this once
//       if (pointIndex === 0) {
//         const store = useProjectStore.getState();
//         store.loadProjectData(projectData);
//       }
      
//       // Get the loaded data from store
//       const { trassen, masts, mastLayoutTemplates, leiterTypes } = useProjectStore.getState();
      
//       // Log store state only for first point
//       if (pointIndex === 0) {
//         console.log('Store state after loading:');
//         console.log('- Trassen count:', trassen.size);
//         console.log('- Masts count:', masts.size);
//         console.log('- Templates count:', mastLayoutTemplates.size);
//         console.log('- LeiterTypes count:', leiterTypes.size);
//       }
      
//       // Transform GUI trassen to UsedTrasse format (simulating what happens in MenuBar)
//       const usedTrassen: UsedTrasse[] = [];
      
//       trassen.forEach((trasse, trasseId) => {
//         if (pointIndex === 0) {
//           console.log('\nTransforming trasse:', trasse.Name);
//           console.log('- Mast IDs:', trasse.mastIds);
//         }
      
//       // Create TrasseUI structure
//       const trasseUI = {
//         id: trasse.id,
//         name: trasse.Name,
//         nummer: trasse.Nummer,
//         layoutTemplateId: trasse.layoutTemplateId,
//         layoutTemplate: trasse.layoutTemplateId ? mastLayoutTemplates.get(trasse.layoutTemplateId) : undefined,
//         mastIds: trasse.mastIds,
//         customAnzahlMastebenen: trasse.AnzahlMastebenen,
//         customAnzahlMastleitungen: trasse.AnzahlMastleitungen,
//       };
      
//       // Get template
//       const template = trasse.layoutTemplateId ? mastLayoutTemplates.get(trasse.layoutTemplateId) : undefined;
      
//       // Convert to UsedTrasse
//       const mastUIMap = new Map(); // Empty map, not used since we pass existing masts
//       const usedTrasse = trasseUIToUsedTrasse(trasseUI, mastUIMap, template, masts, leiterTypes);
        
//         if (pointIndex === 0) {
//           console.log('Transformed trasse result:');
//           console.log('- Name:', usedTrasse.Name);
//           console.log('- Masts count:', usedTrasse.UsedMasten.length);
//         }
        
//         usedTrassen.push(usedTrasse);
//       });
      
//       // Calculate parabola parameters for GUI trassen
//       calculateParabolaParametersForAll(usedTrassen);
      
//       // Log GUI-transformed details only for first point
//       if (pointIndex === 0) {
//         console.log('\nGUI-transformed trasse details:');
//         const guiTrasse = usedTrassen[0];
//         console.log('- Trasse name:', guiTrasse.Name);
//         console.log('- Number of masts:', guiTrasse.UsedMasten.length);
//         console.log('- First mast position:', guiTrasse.UsedMasten[0].Fusspunkt?.GK_Vektor);
//         console.log('- First conductor details:');
//         const guiLeiter = guiTrasse.UsedMasten[0].UsedEbenen[0].UsedLeitungenLinks[0];
//         console.log('  - ParabelA:', guiLeiter.ParabelA);
//         console.log('  - ParabelB:', guiLeiter.ParabelB);
//         console.log('  - ParabelC:', guiLeiter.ParabelC);
//         console.log('  - Durchhang:', guiLeiter.Durchhang);
//         console.log('  - SchallLw:', guiLeiter.SchallLw);
//         console.log('  - SchallLwDB:', guiLeiter.SchallLwDB);
//         console.log('  - NextMastEbene:', guiLeiter.NextMastEbene);
//         console.log('  - NextMastLeiter:', guiLeiter.NextMastLeiter);
//         console.log('  - Mittelpkt:', guiLeiter.Mittelpkt);
//       }
      
//       // Create new project data with GUI trassen
//       const guiProjectData: UsedProjectData = {
//         ...projectData,
//         Trassen: usedTrassen,
//       };
      
//       // Create calculator with GUI data
//       const guiCalculator = new UsedDataCalculator(guiProjectData, dtmProcessor);
      
//       // Calculate immission value for current point
//       const guiValue = guiCalculator.calculateLatLTForImmissionPoint(pointIndex);
//       console.log('GUI computation result:', guiValue, 'dB');
      
//       // ========================================
//       // COMPARISON
//       // ========================================
//       console.log('\n=== COMPARISON ===');
//       console.log('Direct computation:', directValue, 'dB');
//       console.log('GUI computation:', guiValue, 'dB');
//       console.log('Difference:', Math.abs(directValue - guiValue), 'dB');
      
//       // NOTE: The SchallLwDB values differ (0 vs 80) but computation results are identical
//       // This is because the calculator ignores SchallLwDB and always looks up the value
//       // from LeiterTypes using the SchallLw reference ("L1" → 80 dB)
      
//       // Deep comparison of data structures - only for first point
//       if (pointIndex === 0) {
//         console.log('\n=== DETAILED COMPARISON ===');
        
//         const directTrasse = originalTrassen[0];
//         const guiTrasse = usedTrassen[0];
//         const directLeiter = directTrasse.UsedMasten[0].UsedEbenen[0].UsedLeitungenLinks[0];
//         const guiLeiter = guiTrasse.UsedMasten[0].UsedEbenen[0].UsedLeitungenLinks[0];
        
//         // Compare mast data
//         console.log('\nMast comparison:');
//         const directMast1 = directTrasse.UsedMasten[0];
//         const guiMast1 = guiTrasse.UsedMasten[0];
    
//         console.log('Fusspunkt comparison:');
//         console.log('- Direct:', directMast1.Fusspunkt);
//         console.log('- GUI:', guiMast1.Fusspunkt);
        
//         console.log('Name comparison:');
//         console.log('- Direct:', directMast1.Name);
//         console.log('- GUI:', guiMast1.Name);
        
//         console.log('Heights comparison:');
//         console.log('- Direct NullpunktHoehe:', directMast1.NullpunktHoehe);
//         console.log('- GUI NullpunktHoehe:', guiMast1.NullpunktHoehe);
//         console.log('- Direct MastHoehe:', directMast1.MastHoehe);
//         console.log('- GUI MastHoehe:', guiMast1.MastHoehe);
    
//         // Compare conductor connections
//         console.log('\nConductor connections:');
//         if (directTrasse.UsedMasten.length > 1 && guiTrasse.UsedMasten.length > 1) {
//           const directMast2 = directTrasse.UsedMasten[1];
//           const guiMast2 = guiTrasse.UsedMasten[1];
          
//           console.log('Second mast comparison:');
//           console.log('- Direct position:', directMast2.Fusspunkt?.GK_Vektor);
//           console.log('- GUI position:', guiMast2.Fusspunkt?.GK_Vektor);
          
//           const directLeiter2 = directMast2.UsedEbenen[0].UsedLeitungenLinks[0];
//           const guiLeiter2 = guiMast2.UsedEbenen[0].UsedLeitungenLinks[0];
          
//           console.log('Second conductor Durchgangspunkt:');
//           console.log('- Direct:', directLeiter2.Durchgangspunkt);
//           console.log('- GUI:', guiLeiter2.Durchgangspunkt);
//         }
    
//         // Compare LeiterTypes
//         console.log('\nLeiterTypes comparison:');
//         console.log('- Original LeiterTypes:', projectData.LeiterTypes);
//         console.log('- Store LeiterTypes:', Array.from(leiterTypes.entries()));
    
//         // Check segment points
//         console.log('\nSegment points comparison:');
//         console.log('- Direct segments count:', directLeiter.SegmentPunkte?.length);
//         console.log('- GUI segments count:', guiLeiter.SegmentPunkte?.length);
//         if (directLeiter.SegmentPunkte?.length > 0 && guiLeiter.SegmentPunkte?.length > 0) {
//           console.log('- Direct first segment:', directLeiter.SegmentPunkte[0]);
//           console.log('- GUI first segment:', guiLeiter.SegmentPunkte[0]);
//         }
//       } // End of detailed comparison for first point
      
//       // Expected result from test data
//       const expectedResult = testDataTrasse4.ExpectedResults?.ImmissionPoints?.[pointIndex];
//       if (expectedResult) {
//         console.log('\n=== EXPECTED RESULT ===');
//         console.log('Expected value from test data:', expectedResult.LatLT, 'dB');
//         console.log('Direct computation matches expected:', Math.abs(directValue - expectedResult.LatLT) < 0.1);
//         console.log('GUI computation matches expected:', Math.abs(guiValue - expectedResult.LatLT) < 0.1);
//       }
      
//       // The test expectation - they should be identical
//       expect(Math.abs(directValue - guiValue)).toBeLessThan(0.01);
//     } // End of loop for all immission points
//   });

//   // Keep the original detailed test for trasse4gelaende
//   it('should produce identical results for direct computation vs GUI round-trip for all immission points (detailed)', () => {
//     const projectData = testDataTrasse4.ProjectData as UsedProjectData;
    
//     console.log('Total immission points to test:', projectData.ImmissionPoints.length);
    
//     // Test all immission points
//     for (let pointIndex = 0; pointIndex < projectData.ImmissionPoints.length; pointIndex++) {
//       const immissionPoint = projectData.ImmissionPoints[pointIndex];
//       console.log(`\n${'='.repeat(60)}`);
//       console.log(`Testing immission point ${pointIndex + 1}/${projectData.ImmissionPoints.length}: ${immissionPoint.Name}`);
//       console.log('Position:', immissionPoint.Position);
      
//       // ========================================
//       // CASE 1: Direct computation from parsed data
//       // ========================================
//       console.log('\n=== CASE 1: Direct Computation ===');
      
//       // Calculate parabola parameters for the original data
//       const originalTrassen = [...projectData.Trassen];
//       calculateParabolaParametersForAll(originalTrassen);
      
//       // Create DTM processor
//       const dtmProcessor = new DTMProcessor(
//         projectData.DGMDreiecke || [],
//         projectData.Hoehenpunkte || []
//       );
//       dtmProcessor.setDGMKante(projectData.DGMKanten || []);
      
//       // Create calculator with original data
//       const directCalculator = new UsedDataCalculator(
//         { ...projectData, Trassen: originalTrassen },
//         dtmProcessor
//       );
      
//       // Calculate immission value for current point
//       const directValue = directCalculator.calculateLatLTForImmissionPoint(pointIndex);
//       console.log('Direct computation result:', directValue, 'dB');
      
//       // Log details only for the first point to avoid clutter
//       if (pointIndex === 0) {
//         console.log('\nDirect computation trasse details:');
//         const directTrasse = originalTrassen[0];
//         console.log('- Trasse name:', directTrasse.Name);
//         console.log('- Number of masts:', directTrasse.UsedMasten.length);
//         console.log('- First mast position:', directTrasse.UsedMasten[0].Fusspunkt.GK_Vektor);
//         console.log('- First conductor details:');
//         const directLeiter = directTrasse.UsedMasten[0].UsedEbenen[0].UsedLeitungenLinks[0];
//         console.log('  - ParabelA:', directLeiter.ParabelA);
//         console.log('  - ParabelB:', directLeiter.ParabelB);
//         console.log('  - ParabelC:', directLeiter.ParabelC);
//         console.log('  - Durchhang:', directLeiter.Durchhang);
//         console.log('  - SchallLw:', directLeiter.SchallLw);
//         console.log('  - SchallLwDB:', directLeiter.SchallLwDB);
//         console.log('  - NextMastEbene:', directLeiter.NextMastEbene);
//         console.log('  - NextMastLeiter:', directLeiter.NextMastLeiter);
//         console.log('  - Mittelpkt:', directLeiter.Mittelpkt);
//       }
      
//       // ========================================
//       // CASE 2: GUI round-trip computation
//       // ========================================
//       console.log('\n=== CASE 2: GUI Round-trip Computation ===');
      
//       // Load the data into the store (simulating GUI load) - only do this once
//       if (pointIndex === 0) {
//         const store = useProjectStore.getState();
//         store.loadProjectData(projectData);
//       }
      
//       // Get the loaded data from store
//       const { trassen, masts, mastLayoutTemplates, leiterTypes } = useProjectStore.getState();
      
//       // Log store state only for first point
//       if (pointIndex === 0) {
//         console.log('Store state after loading:');
//         console.log('- Trassen count:', trassen.size);
//         console.log('- Masts count:', masts.size);
//         console.log('- Templates count:', mastLayoutTemplates.size);
//         console.log('- LeiterTypes count:', leiterTypes.size);
//       }
      
//       // Transform GUI trassen to UsedTrasse format (simulating what happens in MenuBar)
//       const usedTrassen: UsedTrasse[] = [];
      
//       trassen.forEach((trasse, trasseId) => {
//         if (pointIndex === 0) {
//           console.log('\nTransforming trasse:', trasse.Name);
//           console.log('- Mast IDs:', trasse.mastIds);
//         }
        
//         // Create TrasseUI structure
//         const trasseUI = {
//           id: trasse.id,
//           name: trasse.Name,
//           nummer: trasse.Nummer,
//           layoutTemplateId: trasse.layoutTemplateId,
//           layoutTemplate: trasse.layoutTemplateId ? mastLayoutTemplates.get(trasse.layoutTemplateId) : undefined,
//           mastIds: trasse.mastIds,
//           customAnzahlMastebenen: trasse.AnzahlMastebenen,
//           customAnzahlMastleitungen: trasse.AnzahlMastleitungen,
//         };
        
//         // Get template
//         const template = trasse.layoutTemplateId ? mastLayoutTemplates.get(trasse.layoutTemplateId) : undefined;
        
//         // Convert to UsedTrasse
//         const mastUIMap = new Map(); // Empty map, not used since we pass existing masts
//         const usedTrasse = trasseUIToUsedTrasse(trasseUI, mastUIMap, template, masts, leiterTypes);
        
//         if (pointIndex === 0) {
//           console.log('Transformed trasse result:');
//           console.log('- Name:', usedTrasse.Name);
//           console.log('- Masts count:', usedTrasse.UsedMasten.length);
//         }
        
//         usedTrassen.push(usedTrasse);
//       });
      
//       // Calculate parabola parameters for GUI trassen
//       calculateParabolaParametersForAll(usedTrassen);
      
//       // Log GUI-transformed details only for first point
//       if (pointIndex === 0) {
//         console.log('\nGUI-transformed trasse details:');
//         const guiTrasse = usedTrassen[0];
//         console.log('- Trasse name:', guiTrasse.Name);
//         console.log('- Number of masts:', guiTrasse.UsedMasten.length);
//         console.log('- First mast position:', guiTrasse.UsedMasten[0].Fusspunkt?.GK_Vektor);
//         console.log('- First conductor details:');
//         const guiLeiter = guiTrasse.UsedMasten[0].UsedEbenen[0].UsedLeitungenLinks[0];
//         console.log('  - ParabelA:', guiLeiter.ParabelA);
//         console.log('  - ParabelB:', guiLeiter.ParabelB);
//         console.log('  - ParabelC:', guiLeiter.ParabelC);
//         console.log('  - Durchhang:', guiLeiter.Durchhang);
//         console.log('  - SchallLw:', guiLeiter.SchallLw);
//         console.log('  - SchallLwDB:', guiLeiter.SchallLwDB);
//         console.log('  - NextMastEbene:', guiLeiter.NextMastEbene);
//         console.log('  - NextMastLeiter:', guiLeiter.NextMastLeiter);
//         console.log('  - Mittelpkt:', guiLeiter.Mittelpkt);
//       }
      
//       // Create new project data with GUI trassen
//       const guiProjectData: UsedProjectData = {
//         ...projectData,
//         Trassen: usedTrassen,
//       };
      
//       // Create calculator with GUI data
//       const guiCalculator = new UsedDataCalculator(guiProjectData, dtmProcessor);
      
//       // Calculate immission value for current point
//       const guiValue = guiCalculator.calculateLatLTForImmissionPoint(pointIndex);
//       console.log('GUI computation result:', guiValue, 'dB');
      
//       // ========================================
//       // COMPARISON
//       // ========================================
//       console.log('\n=== COMPARISON ===');
//       console.log('Direct computation:', directValue, 'dB');
//       console.log('GUI computation:', guiValue, 'dB');
//       console.log('Difference:', Math.abs(directValue - guiValue), 'dB');
      
//       // NOTE: The SchallLwDB values differ (0 vs 80) but computation results are identical
//       // This is because the calculator ignores SchallLwDB and always looks up the value
//       // from LeiterTypes using the SchallLw reference ("L1" → 80 dB)
      
//       // Deep comparison of data structures - only for first point
//       if (pointIndex === 0) {
//         console.log('\n=== DETAILED COMPARISON ===');
        
//         const directTrasse = originalTrassen[0];
//         const guiTrasse = usedTrassen[0];
//         const directLeiter = directTrasse.UsedMasten[0].UsedEbenen[0].UsedLeitungenLinks[0];
//         const guiLeiter = guiTrasse.UsedMasten[0].UsedEbenen[0].UsedLeitungenLinks[0];
        
//         // Compare mast data
//         console.log('\nMast comparison:');
//         const directMast1 = directTrasse.UsedMasten[0];
//         const guiMast1 = guiTrasse.UsedMasten[0];
        
//         console.log('Fusspunkt comparison:');
//         console.log('- Direct:', directMast1.Fusspunkt);
//         console.log('- GUI:', guiMast1.Fusspunkt);
        
//         console.log('Name comparison:');
//         console.log('- Direct:', directMast1.Name);
//         console.log('- GUI:', guiMast1.Name);
        
//         console.log('Heights comparison:');
//         console.log('- Direct NullpunktHoehe:', directMast1.NullpunktHoehe);
//         console.log('- GUI NullpunktHoehe:', guiMast1.NullpunktHoehe);
//         console.log('- Direct MastHoehe:', directMast1.MastHoehe);
//         console.log('- GUI MastHoehe:', guiMast1.MastHoehe);
        
//         // Compare conductor connections
//         console.log('\nConductor connections:');
//         if (directTrasse.UsedMasten.length > 1 && guiTrasse.UsedMasten.length > 1) {
//           const directMast2 = directTrasse.UsedMasten[1];
//           const guiMast2 = guiTrasse.UsedMasten[1];
          
//           console.log('Second mast comparison:');
//           console.log('- Direct position:', directMast2.Fusspunkt?.GK_Vektor);
//           console.log('- GUI position:', guiMast2.Fusspunkt?.GK_Vektor);
          
//           const directLeiter2 = directMast2.UsedEbenen[0].UsedLeitungenLinks[0];
//           const guiLeiter2 = guiMast2.UsedEbenen[0].UsedLeitungenLinks[0];
          
//           console.log('Second conductor Durchgangspunkt:');
//           console.log('- Direct:', directLeiter2.Durchgangspunkt);
//           console.log('- GUI:', guiLeiter2.Durchgangspunkt);
//         }
        
//         // Compare LeiterTypes
//         console.log('\nLeiterTypes comparison:');
//         console.log('- Original LeiterTypes:', projectData.LeiterTypes);
//         console.log('- Store LeiterTypes:', Array.from(leiterTypes.entries()));
        
//         // Check segment points
//         console.log('\nSegment points comparison:');
//         console.log('- Direct segments count:', directLeiter.SegmentPunkte?.length);
//         console.log('- GUI segments count:', guiLeiter.SegmentPunkte?.length);
//         if (directLeiter.SegmentPunkte?.length > 0 && guiLeiter.SegmentPunkte?.length > 0) {
//           console.log('- Direct first segment:', directLeiter.SegmentPunkte[0]);
//           console.log('- GUI first segment:', guiLeiter.SegmentPunkte[0]);
//         }
//       } // End of detailed comparison for first point
      
//       // Expected result from test data
//       const expectedResult = testDataTrasse4.ExpectedResults?.ImmissionPoints?.[pointIndex];
//       if (expectedResult) {
//         console.log('\n=== EXPECTED RESULT ===');
//         console.log('Expected value from test data:', expectedResult.LatLT, 'dB');
//         console.log('Direct computation matches expected:', Math.abs(directValue - expectedResult.LatLT) < 0.1);
//         console.log('GUI computation matches expected:', Math.abs(guiValue - expectedResult.LatLT) < 0.1);
//       }
      
//       // The test expectation - they should be identical
//       expect(Math.abs(directValue - guiValue)).toBeLessThan(0.01);
//     } // End of loop for all immission points
//   });

//   it('should correctly transform GUI conductor connections to computation format', () => {
//     const projectData = testDataTrasse4.ProjectData as UsedProjectData;
    
//     console.log('\n=== TEST: GUI Conductor Connection Transformation ===');
    
//     // ========================================
//     // STEP 1: Load original data and compute baseline
//     // ========================================
//     console.log('\n--- STEP 1: Compute baseline from original data ---');
    
//     // Calculate parabola parameters for the original data
//     const originalTrassen = [...projectData.Trassen];
//     calculateParabolaParametersForAll(originalTrassen);
    
//     // Create DTM processor
//     const dtmProcessor = new DTMProcessor(
//       projectData.DGMDreiecke || [],
//       projectData.Hoehenpunkte || []
//     );
//     dtmProcessor.setDGMKante(projectData.DGMKanten || []);
    
//     // Create calculator with original data
//     const baselineCalculator = new UsedDataCalculator(
//       { ...projectData, Trassen: originalTrassen },
//       dtmProcessor
//     );
    
//     // Calculate baseline values for all immission points
//     const baselineValues: number[] = [];
//     for (let i = 0; i < projectData.ImmissionPoints.length; i++) {
//       const value = baselineCalculator.calculateLatLTForImmissionPoint(i);
//       baselineValues.push(value);
//       console.log(`Baseline for point ${i} (${projectData.ImmissionPoints[i].Name}): ${value} dB`);
//     }
    
//     // Store the original conductor connections before any modifications
//     console.log('\n--- Storing Original Conductor Connections ---');
//     const origTrasse = originalTrassen[0];
//     const originalConnections: any[] = [];
    
//     for (let mastIdx = 0; mastIdx < origTrasse.UsedMasten.length; mastIdx++) {
//       const mast = origTrasse.UsedMasten[mastIdx];
//       console.log(`Mast ${mastIdx + 1} (${mast.Name}):`);
//       const mastConnections: any = { ebenen: [] };
      
//       for (const ebene of mast.UsedEbenen) {
//         console.log(`  Ebene ${ebene.NummerEbene}:`);
//         const ebeneConnections: any = { 
//           nummerEbene: ebene.NummerEbene,
//           leftConductors: [],
//           rightConductors: []
//         };
        
//         for (let i = 0; i < ebene.UsedLeitungenLinks.length; i++) {
//           const leiter = ebene.UsedLeitungenLinks[i];
//           console.log(`    Left conductor ${i + 1}: NextMastEbene=${leiter.NextMastEbene}, NextMastLeiter=${leiter.NextMastLeiter}`);
//           ebeneConnections.leftConductors.push({
//             nextMastEbene: leiter.NextMastEbene,
//             nextMastLeiter: leiter.NextMastLeiter
//           });
//         }
//         for (let i = 0; i < ebene.UsedLeitungenRechts.length; i++) {
//           const leiter = ebene.UsedLeitungenRechts[i];
//           console.log(`    Right conductor ${i + 1}: NextMastEbene=${leiter.NextMastEbene}, NextMastLeiter=${leiter.NextMastLeiter}`);
//           ebeneConnections.rightConductors.push({
//             nextMastEbene: leiter.NextMastEbene,
//             nextMastLeiter: leiter.NextMastLeiter
//           });
//         }
        
//         mastConnections.ebenen.push(ebeneConnections);
//       }
      
//       originalConnections.push(mastConnections);
//     }
    
//     // ========================================
//     // STEP 2: Load into GUI store
//     // ========================================
//     console.log('\n--- STEP 2: Load data into GUI store ---');
//     const store = useProjectStore.getState();
//     store.loadProjectData(projectData);
    
//     // Get the updated state after loading
//     let storeState = useProjectStore.getState();
//     let { trassen, masts, mastLayoutTemplates, leiterTypes } = storeState;
    
//     console.log('Store state after loading:');
//     console.log('- Trassen count:', trassen.size);
//     console.log('- Masts count:', masts.size);
    
//     // Clear the conductor connections to test if transformation recreates them
//     console.log('\nClearing conductor connections from all masts...');
//     masts.forEach((mast, mastId) => {
//       if (mast.UsedEbenen) {
//         mast.UsedEbenen.forEach(ebene => {
//           // Clear connections from left conductors
//           if (ebene.UsedLeitungenLinks) {
//             ebene.UsedLeitungenLinks.forEach(leiter => {
//               console.log(`  Clearing connection from mast ${mast.Name}, ebene ${ebene.NummerEbene}, left conductor: was NextMastEbene=${leiter.NextMastEbene}, NextMastLeiter=${leiter.NextMastLeiter}`);
//               leiter.NextMastEbene = 0;
//               leiter.NextMastLeiter = 0;
//             });
//           }
//           // Clear connections from right conductors
//           if (ebene.UsedLeitungenRechts) {
//             ebene.UsedLeitungenRechts.forEach(leiter => {
//               console.log(`  Clearing connection from mast ${mast.Name}, ebene ${ebene.NummerEbene}, right conductor: was NextMastEbene=${leiter.NextMastEbene}, NextMastLeiter=${leiter.NextMastLeiter}`);
//               leiter.NextMastEbene = 0;
//               leiter.NextMastLeiter = 0;
//             });
//           }
//         });
//       }
//     });
    
//     // ========================================
//     // STEP 3: Transform GUI data using trasseUIToUsedTrasse
//     // ========================================
//     console.log('\n--- STEP 3: Transform GUI data using trasseUIToUsedTrasse ---');
    
//     const transformedTrassen: UsedTrasse[] = [];
    
//     trassen.forEach((trasse) => {
//       console.log(`Transforming trasse: ${trasse.Name}`);
      
//       // Create TrasseUI structure
//       const trasseUI = {
//         id: trasse.id,
//         name: trasse.Name,
//         nummer: trasse.Nummer,
//         layoutTemplateId: trasse.layoutTemplateId,
//         layoutTemplate: trasse.layoutTemplateId ? mastLayoutTemplates.get(trasse.layoutTemplateId) : undefined,
//         mastIds: trasse.mastIds,
//         customAnzahlMastebenen: trasse.AnzahlMastebenen,
//         customAnzahlMastleitungen: trasse.AnzahlMastleitungen,
//       };
      
//       const template = trasse.layoutTemplateId ? mastLayoutTemplates.get(trasse.layoutTemplateId) : undefined;
      
//       // This is the key transformation we're testing
//       const usedTrasse = trasseUIToUsedTrasse(trasseUI, new Map(), template, masts, leiterTypes);
      
//       transformedTrassen.push(usedTrasse);
//     });
    
//     // Log the transformed conductor connections
//     console.log('\n--- Transformed Conductor Connections ---');
//     const transTrasse = transformedTrassen[0];
//     for (let mastIdx = 0; mastIdx < transTrasse.UsedMasten.length; mastIdx++) {
//       const mast = transTrasse.UsedMasten[mastIdx];
//       console.log(`Mast ${mastIdx + 1} (${mast.Name}):`);
//       for (const ebene of mast.UsedEbenen) {
//         console.log(`  Ebene ${ebene.NummerEbene}:`);
//         for (let i = 0; i < ebene.UsedLeitungenLinks.length; i++) {
//           const leiter = ebene.UsedLeitungenLinks[i];
//           console.log(`    Left conductor ${i + 1}: NextMastEbene=${leiter.NextMastEbene}, NextMastLeiter=${leiter.NextMastLeiter}`);
//         }
//         for (let i = 0; i < ebene.UsedLeitungenRechts.length; i++) {
//           const leiter = ebene.UsedLeitungenRechts[i];
//           console.log(`    Right conductor ${i + 1}: NextMastEbene=${leiter.NextMastEbene}, NextMastLeiter=${leiter.NextMastLeiter}`);
//         }
//       }
//     }
    
//     // ========================================
//     // STEP 4: Compute with transformed data
//     // ========================================
//     console.log('\n--- STEP 4: Compute with transformed data ---');
    
//     // Calculate parabola parameters
//     calculateParabolaParametersForAll(transformedTrassen);
    
//     // Create new project data with transformed trassen
//     const transformedProjectData: UsedProjectData = {
//       ...projectData,
//       Trassen: transformedTrassen,
//     };
    
//     // Create calculator with transformed data
//     const transformedCalculator = new UsedDataCalculator(transformedProjectData, dtmProcessor);
    
//     // Calculate values for all immission points
//     const transformedValues: number[] = [];
//     for (let i = 0; i < projectData.ImmissionPoints.length; i++) {
//       const value = transformedCalculator.calculateLatLTForImmissionPoint(i);
//       transformedValues.push(value);
//       console.log(`Transformed value for point ${i} (${projectData.ImmissionPoints[i].Name}): ${value} dB`);
//     }
    
//     // ========================================
//     // STEP 5: Compare results and connections
//     // ========================================
//     console.log('\n--- STEP 5: Compare results ---');
    
//     // Compare conductor connections
//     console.log('\n=== Connection Comparison ===');
//     console.log('Comparing ORIGINAL connections (stored before clearing) with TRANSFORMED connections:');
//     let connectionsMatch = true;
    
//     // Use the stored original connections for comparison
//     for (let mastIdx = 0; mastIdx < transTrasse.UsedMasten.length; mastIdx++) {
//       const origMastConnections = originalConnections[mastIdx];
//       const transMast = transTrasse.UsedMasten[mastIdx];
      
//       for (let ebeneIdx = 0; ebeneIdx < transMast.UsedEbenen.length; ebeneIdx++) {
//         const origEbeneConnections = origMastConnections.ebenen[ebeneIdx];
//         const transEbene = transMast.UsedEbenen[ebeneIdx];
        
//         // Check left conductors
//         for (let i = 0; i < transEbene.UsedLeitungenLinks.length; i++) {
//           const origConn = origEbeneConnections.leftConductors[i];
//           const transLeiter = transEbene.UsedLeitungenLinks[i];
          
//           if (origConn.nextMastEbene !== transLeiter.NextMastEbene ||
//               origConn.nextMastLeiter !== transLeiter.NextMastLeiter) {
//             console.log(`MISMATCH: Mast ${mastIdx + 1}, Ebene ${ebeneIdx + 1}, Left conductor ${i + 1}`);
//             console.log(`  Original: NextMastEbene=${origConn.nextMastEbene}, NextMastLeiter=${origConn.nextMastLeiter}`);
//             console.log(`  Transformed: NextMastEbene=${transLeiter.NextMastEbene}, NextMastLeiter=${transLeiter.NextMastLeiter}`);
//             connectionsMatch = false;
//           }
//         }
        
//         // Check right conductors
//         for (let i = 0; i < transEbene.UsedLeitungenRechts.length; i++) {
//           const origConn = origEbeneConnections.rightConductors[i];
//           const transLeiter = transEbene.UsedLeitungenRechts[i];
          
//           if (origConn.nextMastEbene !== transLeiter.NextMastEbene ||
//               origConn.nextMastLeiter !== transLeiter.NextMastLeiter) {
//             console.log(`MISMATCH: Mast ${mastIdx + 1}, Ebene ${ebeneIdx + 1}, Right conductor ${i + 1}`);
//             console.log(`  Original: NextMastEbene=${origConn.nextMastEbene}, NextMastLeiter=${origConn.nextMastLeiter}`);
//             console.log(`  Transformed: NextMastEbene=${transLeiter.NextMastEbene}, NextMastLeiter=${transLeiter.NextMastLeiter}`);
//             connectionsMatch = false;
//           }
//         }
//       }
//     }
    
//     console.log(`\nConnections match: ${connectionsMatch ? '✓' : '✗'}`);
    
//     // Compare computation results
//     console.log('\n=== Computation Results ===');
//     let allMatch = true;
//     for (let i = 0; i < baselineValues.length; i++) {
//       const difference = Math.abs(baselineValues[i] - transformedValues[i]);
//       const match = difference < 0.01;
      
//       console.log(`Point ${i} (${projectData.ImmissionPoints[i].Name}):`);
//       console.log(`  Baseline:    ${baselineValues[i]} dB`);
//       console.log(`  Transformed: ${transformedValues[i]} dB`);
//       console.log(`  Difference:  ${difference} dB`);
//       console.log(`  Match: ${match ? '✓' : '✗'}`);
      
//       if (!match) {
//         allMatch = false;
//       }
      
//       // Test expectation
//       expect(difference).toBeLessThan(0.01);
//     }
    
//     console.log(`\n=== FINAL RESULT: ${allMatch && connectionsMatch ? 'ALL TESTS PASSED ✓' : 'SOME TESTS FAILED ✗'} ===`);
    
//     // Test that connections match
//     expect(connectionsMatch).toBe(true);
//   });
  
//   it('should produce identical results after recreating trasse using GUI methods', () => {
//     const projectData = testDataTrasse4.ProjectData as UsedProjectData;
    
//     console.log('\n=== TEST: Delete and Recreate Trasse via GUI ===');
    
//     // ========================================
//     // STEP 1: Load original data and compute baseline
//     // ========================================
//     console.log('\n--- STEP 1: Compute baseline from original data ---');
    
//     // Calculate parabola parameters for the original data
//     const originalTrassen = [...projectData.Trassen];
//     calculateParabolaParametersForAll(originalTrassen);
    
//     // Create DTM processor
//     const dtmProcessor = new DTMProcessor(
//       projectData.DGMDreiecke || [],
//       projectData.Hoehenpunkte || []
//     );
//     dtmProcessor.setDGMKante(projectData.DGMKanten || []);
    
//     // Create calculator with original data
//     const baselineCalculator = new UsedDataCalculator(
//       { ...projectData, Trassen: originalTrassen },
//       dtmProcessor
//     );
    
//     // Calculate baseline values for all immission points
//     const baselineValues: number[] = [];
//     for (let i = 0; i < projectData.ImmissionPoints.length; i++) {
//       const value = baselineCalculator.calculateLatLTForImmissionPoint(i);
//       baselineValues.push(value);
//       console.log(`Baseline for point ${i} (${projectData.ImmissionPoints[i].Name}): ${value} dB`);
//     }
    
//     // ========================================
//     // STEP 2: Load into GUI store
//     // ========================================
//     console.log('\n--- STEP 2: Load data into GUI store ---');
//     const store = useProjectStore.getState();
//     store.loadProjectData(projectData);
    
//     // Get the updated state after loading
//     let storeState = useProjectStore.getState();
//     let { trassen, masts, mastLayoutTemplates, leiterTypes } = storeState;
    
//     console.log('Initial store state:');
//     console.log('- Trassen count:', trassen.size);
//     console.log('- Masts count:', masts.size);
//     console.log('- Templates count:', mastLayoutTemplates.size);
    
//     // Check if trassen were loaded
//     if (trassen.size === 0) {
//       throw new Error('No trassen loaded into store');
//     }
    
//     // Get the original trasse details before deletion
//     const originalTrasseEntry = Array.from(trassen.entries())[0];
//     const originalTrasseId = originalTrasseEntry[0];
//     const originalTrasseData = originalTrasseEntry[1];
    
//     console.log('\nOriginal trasse details:');
//     console.log('- ID:', originalTrasseId);
//     console.log('- Name:', originalTrasseData.Name);
//     console.log('- Nummer:', originalTrasseData.Nummer);
//     console.log('- Mast IDs:', originalTrasseData.mastIds);
//     console.log('- Template ID:', originalTrasseData.layoutTemplateId);
    
//     // Store original mast data for recreation
//     const originalMastData: any[] = [];
//     originalTrasseData.mastIds.forEach(mastId => {
//       const mast = masts.get(mastId);
//       if (mast) {
//         originalMastData.push({
//           name: mast.Name || mast.name || 'Mast',
//           position: mast.Fusspunkt?.GK_Vektor || mast.position,
//           mastHoehe: mast.MastHoehe || mast.mastHoehe,
//           nullpunktHoehe: mast.NullpunktHoehe || mast.nullpunktHoehe,
//           ausrichtung: mast.Ausrichtung || mast.ausrichtung,
//           gkAusrichtung: mast.GKAusrichtung || mast.gkAusrichtung,
//           usedEbenen: mast.UsedEbenen,
//         });
//       }
//     });
    
//     console.log('\nStored mast data for recreation:', originalMastData.length, 'masts');
    
//     // ========================================
//     // STEP 3: Delete the trasse
//     // ========================================
//     console.log('\n--- STEP 3: Delete trasse from GUI ---');
    
//     // Delete the trasse (this should also delete associated masts)
//     store.deleteTrasse(originalTrasseId);
    
//     // Get updated store state
//     ({ trassen, masts } = useProjectStore.getState());
//     console.log('After deletion:');
//     console.log('- Trassen count:', trassen.size);
//     console.log('- Masts count:', masts.size);
    
//     // ========================================
//     // STEP 4: Recreate the trasse using GUI operations
//     // ========================================
//     console.log('\n--- STEP 4: Recreate trasse via GUI operations ---');
    
//     // Create a new trasse (requires template ID)
//     const newTrasseId = store.addTrasse(
//       originalTrasseData.Name,
//       originalTrasseData.layoutTemplateId
//     );
    
//     if (!newTrasseId) {
//       throw new Error('Failed to create new trasse');
//     }
//     console.log('Created new trasse with ID:', newTrasseId);
    
//     // Add masts to the new trasse
//     const newMastIds: string[] = [];
//     originalMastData.forEach((mastData, index) => {
//       console.log(`Adding mast ${index + 1}:`, mastData.name);
      
//       // Create mast with position
//       const mastId = store.addMast(newTrasseId, mastData.position);
      
//       if (!mastId) {
//         throw new Error(`Failed to create mast ${index + 1}`);
//       }
      
//       newMastIds.push(mastId);
      
//       // Update the mast with stored properties
//       storeState = useProjectStore.getState();
//       const mast = storeState.masts.get(mastId);
//       if (mast) {
//         // Update mast properties directly in the store
//         mast.Name = mastData.name;
//         if (mastData.mastHoehe !== undefined) mast.MastHoehe = mastData.mastHoehe;
//         if (mastData.nullpunktHoehe !== undefined) mast.NullpunktHoehe = mastData.nullpunktHoehe;
//         if (mastData.ausrichtung) mast.Ausrichtung = mastData.ausrichtung;
//         if (mastData.gkAusrichtung) mast.GKAusrichtung = mastData.gkAusrichtung;
        
//         // IMPORTANT: Use the new override system to simulate GUI operations
//         // This properly simulates GUI operations for creating/editing ebenen
//         if (mastData.usedEbenen && mastData.usedEbenen.length > 0) {
//           console.log(`  Setting overrides for ${mastData.usedEbenen.length} ebenen for mast ${index + 1}`);
          
//           const { setMastEbeneOverride } = useProjectStore.getState();
          
//           // Set overrides for each ebene from the original data
//           mastData.usedEbenen.forEach((originalEbene: any, ebeneIndex: number) => {
//             const ebeneNum = ebeneIndex + 1;
//             console.log(`    Setting overrides for ebene ${ebeneNum} with ${originalEbene.UsedLeitungenLinks?.length || 0} left and ${originalEbene.UsedLeitungenRechts?.length || 0} right conductors`);
            
//             // Prepare the ebene override
//             const ebeneOverride: any = {
//               abstandNullpunkt: originalEbene.AbstandNullpunkt,
//               leitungenLinksOverrides: new Map(),
//               leitungenRechtsOverrides: new Map()
//             };
            
//             // Set left conductor overrides
//             if (originalEbene.UsedLeitungenLinks) {
//               originalEbene.UsedLeitungenLinks.forEach((leiter: any, leiterIndex: number) => {
//                 const leiterNum = leiterIndex + 1;
//                 console.log(`      Setting left conductor ${leiterNum} overrides: SchallLw='${leiter.SchallLw}', Durchhang=${leiter.Durchhang}`);
                
//                 ebeneOverride.leitungenLinksOverrides.set(leiterNum, {
//                   abstandMastachse: leiter.AbstandMastachse,
//                   isolatorlaenge: leiter.Isolatorlaenge,
//                   durchhang: leiter.Durchhang,
//                   schallLw: leiter.SchallLw,
//                   schallLwDB: leiter.SchallLwDB,
//                   nextMastEbene: leiter.NextMastEbene,
//                   nextMastLeiter: leiter.NextMastLeiter,
//                 });
//               });
//             }
            
//             // Set right conductor overrides
//             if (originalEbene.UsedLeitungenRechts) {
//               originalEbene.UsedLeitungenRechts.forEach((leiter: any, leiterIndex: number) => {
//                 const leiterNum = leiterIndex + 1;
//                 console.log(`      Setting right conductor ${leiterNum} overrides: SchallLw='${leiter.SchallLw}', Durchhang=${leiter.Durchhang}`);
                
//                 ebeneOverride.leitungenRechtsOverrides.set(leiterNum, {
//                   abstandMastachse: leiter.AbstandMastachse,
//                   isolatorlaenge: leiter.Isolatorlaenge,
//                   durchhang: leiter.Durchhang,
//                   schallLw: leiter.SchallLw,
//                   schallLwDB: leiter.SchallLwDB,
//                   nextMastEbene: leiter.NextMastEbene,
//                   nextMastLeiter: leiter.NextMastLeiter,
//                   einbauart: leiter.Einbauart,
//                 });
//               });
//             }
            
//             // Apply the ebene override
//             setMastEbeneOverride(mastId, ebeneNum, ebeneOverride);
//           });
          
//           console.log(`  Successfully set overrides for ${mastData.usedEbenen.length} ebenen`);
//         }
//       } else {
//         console.log(`  WARNING: Could not find mast ${mastId} to update`);
//       }
//     });
    
//     console.log('Created', newMastIds.length, 'new masts');
    
//     // Get updated store state
//     ({ trassen, masts } = useProjectStore.getState());
//     console.log('\nAfter recreation:');
//     console.log('- Trassen count:', trassen.size);
//     console.log('- Masts count:', masts.size);
    
//     const recreatedTrasse = trassen.get(newTrasseId);
//     console.log('Recreated trasse:');
//     console.log('- Name:', recreatedTrasse?.Name);
//     console.log('- Mast IDs:', recreatedTrasse?.mastIds);
    
//     // ========================================
//     // STEP 5: Transform recreated GUI data and compute
//     // ========================================
//     console.log('\n--- STEP 5: Transform recreated GUI data and compute ---');
    
//     // Transform GUI trassen to UsedTrasse format
//     const recreatedUsedTrassen: UsedTrasse[] = [];
    
//     trassen.forEach((trasse, trasseId) => {
//       console.log('Transforming trasse:', trasse.Name);
      
//       const trasseUI = {
//         id: trasse.id,
//         name: trasse.Name,
//         nummer: trasse.Nummer,
//         layoutTemplateId: trasse.layoutTemplateId,
//         layoutTemplate: trasse.layoutTemplateId ? mastLayoutTemplates.get(trasse.layoutTemplateId) : undefined,
//         mastIds: trasse.mastIds,
//         customAnzahlMastebenen: trasse.AnzahlMastebenen,
//         customAnzahlMastleitungen: trasse.AnzahlMastleitungen,
//       };
      
//       const template = trasse.layoutTemplateId ? mastLayoutTemplates.get(trasse.layoutTemplateId) : undefined;
//       const mastUIMap = new Map();
//       const usedTrasse = trasseUIToUsedTrasse(trasseUI, mastUIMap, template, masts, leiterTypes);
      
//       recreatedUsedTrassen.push(usedTrasse);
//     });
    
//     // Calculate parabola parameters
//     calculateParabolaParametersForAll(recreatedUsedTrassen);
    
//     // Create new project data with recreated trassen
//     const recreatedProjectData: UsedProjectData = {
//       ...projectData,
//       Trassen: recreatedUsedTrassen,
//     };
    
//     // Create calculator with recreated data
//     const recreatedCalculator = new UsedDataCalculator(recreatedProjectData, dtmProcessor);
    
//     // Calculate values for all immission points with recreated data
//     const recreatedValues: number[] = [];
//     for (let i = 0; i < projectData.ImmissionPoints.length; i++) {
//       const value = recreatedCalculator.calculateLatLTForImmissionPoint(i);
//       recreatedValues.push(value);
//       console.log(`Recreated value for point ${i} (${projectData.ImmissionPoints[i].Name}): ${value} dB`);
//     }
    
//     // ========================================
//     // STEP 6: Compare results
//     // ========================================
//     console.log('\n--- STEP 6: Compare baseline vs recreated results ---');
    
//     let allMatch = true;
//     for (let i = 0; i < baselineValues.length; i++) {
//       const difference = Math.abs(baselineValues[i] - recreatedValues[i]);
//       const match = difference < 0.01;
      
//       console.log(`Point ${i} (${projectData.ImmissionPoints[i].Name}):`);
//       console.log(`  Baseline:  ${baselineValues[i]} dB`);
//       console.log(`  Recreated: ${recreatedValues[i]} dB`);
//       console.log(`  Difference: ${difference} dB`);
//       console.log(`  Match: ${match ? '✓' : '✗'}`);
      
//       if (!match) {
//         allMatch = false;
//       }
      
//       // Test expectation
//       expect(difference).toBeLessThan(0.01);
//     }
    
//     console.log(`\n=== FINAL RESULT: ${allMatch ? 'ALL TESTS PASSED ✓' : 'SOME TESTS FAILED ✗'} ===`);
//   });

//   it('should handle SchallLwDB differences correctly', () => {
//     const projectData = testDataTrasse4.ProjectData as UsedProjectData;
    
//     // Get original conductor with SchallLwDB = 0
//     const originalLeiter = projectData.Trassen[0].UsedMasten[0].UsedEbenen[0].UsedLeitungenLinks[0];
//     expect(originalLeiter.SchallLw).toBe('L1');
//     expect(originalLeiter.SchallLwDB).toBe(0);
    
//     // Load into store and transform through GUI
//     const store = useProjectStore.getState();
//     store.loadProjectData(projectData);
    
//     const { trassen, masts, mastLayoutTemplates, leiterTypes } = useProjectStore.getState();
    
//     // Transform GUI trasse
//     const trasseEntry = Array.from(trassen.entries())[0];
//     const trasse = trasseEntry[1];
    
//     const trasseUI = {
//       id: trasse.id,
//       name: trasse.Name,
//       nummer: trasse.Nummer,
//       layoutTemplateId: trasse.layoutTemplateId,
//       layoutTemplate: trasse.layoutTemplateId ? mastLayoutTemplates.get(trasse.layoutTemplateId) : undefined,
//       mastIds: trasse.mastIds,
//       customAnzahlMastebenen: trasse.AnzahlMastebenen,
//       customAnzahlMastleitungen: trasse.AnzahlMastleitungen,
//     };
    
//     const template = trasse.layoutTemplateId ? mastLayoutTemplates.get(trasse.layoutTemplateId) : undefined;
//     const mastUIMap = new Map();
//     const guiTrasse = trasseUIToUsedTrasse(trasseUI, mastUIMap, template, masts, leiterTypes);
    
//     // Check that GUI transformation updates SchallLwDB from LeiterTypes
//     const guiLeiter = guiTrasse.UsedMasten[0].UsedEbenen[0].UsedLeitungenLinks[0];
//     expect(guiLeiter.SchallLw).toBe('L1');
//     expect(guiLeiter.SchallLwDB).toBe(80); // Updated from LeiterTypes lookup
    
//     // Verify LeiterTypes contains the mapping
//     const leiterType = leiterTypes.get('L1');
//     expect(leiterType).toBeDefined();
//     expect(leiterType?.SchallLW).toBe(80);
    
//     console.log('\n=== SchallLwDB Behavior ===');
//     console.log('Original SchallLwDB:', originalLeiter.SchallLwDB);
//     console.log('GUI SchallLwDB:', guiLeiter.SchallLwDB);
//     console.log('LeiterTypes["L1"].SchallLW:', leiterType?.SchallLW);
//     console.log('Explanation: GUI transformation updates SchallLwDB from LeiterTypes lookup');
//     console.log('However, the calculator ignores SchallLwDB and uses SchallLw to look up the value');
//     console.log('Therefore, computation results are identical despite the data structure difference');
//   });

//   it('should identify specific differences in data structures', () => {
//     const projectData = testDataTrasse4.ProjectData as UsedProjectData;
    
//     // Load into store
//     const store = useProjectStore.getState();
//     store.loadProjectData(projectData);
    
//     const { trassen, masts, mastLayoutTemplates, leiterTypes } = useProjectStore.getState();
    
//     // Get original trasse
//     const originalTrasse = projectData.Trassen[0];
    
//     // Transform GUI trasse
//     const trasseEntry = Array.from(trassen.entries())[0];
//     const trasse = trasseEntry[1];
    
//     const trasseUI = {
//       id: trasse.id,
//       name: trasse.Name,
//       nummer: trasse.Nummer,
//       layoutTemplateId: trasse.layoutTemplateId,
//       layoutTemplate: trasse.layoutTemplateId ? mastLayoutTemplates.get(trasse.layoutTemplateId) : undefined,
//       mastIds: trasse.mastIds,
//       customAnzahlMastebenen: trasse.AnzahlMastebenen,
//       customAnzahlMastleitungen: trasse.AnzahlMastleitungen,
//     };
    
//     const template = trasse.layoutTemplateId ? mastLayoutTemplates.get(trasse.layoutTemplateId) : undefined;
//     const mastUIMap = new Map();
//     const guiTrasse = trasseUIToUsedTrasse(trasseUI, mastUIMap, template, masts, leiterTypes);
    
//     // Detailed field-by-field comparison
//     console.log('\n=== FIELD-BY-FIELD COMPARISON ===');
    
//     // Compare trasse-level fields
//     expect(guiTrasse.Name).toBe(originalTrasse.Name);
//     expect(guiTrasse.Nummer).toBe(originalTrasse.Nummer);
//     expect(guiTrasse.AnzahlMastebenen).toBe(originalTrasse.AnzahlMastebenen);
//     expect(guiTrasse.AnzahlMastleitungen).toBe(originalTrasse.AnzahlMastleitungen);
//     expect(guiTrasse.UsedMasten.length).toBe(originalTrasse.UsedMasten.length);
    
//     // Compare each mast
//     for (let i = 0; i < originalTrasse.UsedMasten.length; i++) {
//       const origMast = originalTrasse.UsedMasten[i];
//       const guiMast = guiTrasse.UsedMasten[i];
      
//       console.log(`\nMast ${i} comparison:`);
      
//       // Check if Fusspunkt exists
//       if (!guiMast.Fusspunkt) {
//         console.error(`GUI Mast ${i} is missing Fusspunkt!`);
//         expect(guiMast.Fusspunkt).toBeDefined();
//       }
      
//       // Compare Fusspunkt
//       expect(guiMast.Fusspunkt?.GK_Vektor?.GK?.Rechts).toBeCloseTo(
//         origMast.Fusspunkt.GK_Vektor.GK.Rechts, 5
//       );
//       expect(guiMast.Fusspunkt?.GK_Vektor?.GK?.Hoch).toBeCloseTo(
//         origMast.Fusspunkt.GK_Vektor.GK.Hoch, 5
//       );
//       expect(guiMast.Fusspunkt?.GK_Vektor?.z).toBeCloseTo(
//         origMast.Fusspunkt.GK_Vektor.z, 5
//       );
      
//       // Compare other mast properties
//       expect(guiMast.Name).toBe(origMast.Name);
//       expect(guiMast.NullpunktHoehe).toBeCloseTo(origMast.NullpunktHoehe, 5);
//       expect(guiMast.MastHoehe).toBeCloseTo(origMast.MastHoehe, 5);
      
//       // Compare Ebenen
//       expect(guiMast.UsedEbenen.length).toBe(origMast.UsedEbenen.length);
      
//       for (let j = 0; j < origMast.UsedEbenen.length; j++) {
//         const origEbene = origMast.UsedEbenen[j];
//         const guiEbene = guiMast.UsedEbenen[j];
        
//         console.log(`  Ebene ${j} comparison:`);
//         expect(guiEbene.NummerEbene).toBe(origEbene.NummerEbene);
//         expect(guiEbene.AbstandNullpunkt).toBeCloseTo(origEbene.AbstandNullpunkt, 5);
        
//         // Compare left conductors
//         expect(guiEbene.UsedLeitungenLinks.length).toBe(origEbene.UsedLeitungenLinks.length);
        
//         for (let k = 0; k < origEbene.UsedLeitungenLinks.length; k++) {
//           const origLeiter = origEbene.UsedLeitungenLinks[k];
//           const guiLeiter = guiEbene.UsedLeitungenLinks[k];
          
//           console.log(`    Left conductor ${k} comparison:`);
//           console.log(`      SchallLw - Orig: ${origLeiter.SchallLw}, GUI: ${guiLeiter.SchallLw}`);
//           console.log(`      SchallLwDB - Orig: ${origLeiter.SchallLwDB}, GUI: ${guiLeiter.SchallLwDB}`);
//           console.log(`      NextMastEbene - Orig: ${origLeiter.NextMastEbene}, GUI: ${guiLeiter.NextMastEbene}`);
//           console.log(`      NextMastLeiter - Orig: ${origLeiter.NextMastLeiter}, GUI: ${guiLeiter.NextMastLeiter}`);
          
//           // These are the critical fields for computation
//           expect(guiLeiter.SchallLw).toBe(origLeiter.SchallLw);
//           // SchallLwDB is updated from LeiterTypes during GUI transformation
//           // Original has 0, GUI updates it to 80 from LeiterTypes["L1"]
//           if (origLeiter.SchallLw === 'L1') {
//             expect(guiLeiter.SchallLwDB).toBe(80); // Updated from LeiterTypes
//           } else {
//             expect(guiLeiter.SchallLwDB).toBeCloseTo(origLeiter.SchallLwDB, 5);
//           }
//           expect(guiLeiter.Durchhang).toBeCloseTo(origLeiter.Durchhang, 5);
//         }
//       }
//     }
//   });
// });