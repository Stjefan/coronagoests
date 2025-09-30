// import { describe, it, expect } from 'vitest';
// import { uiToComputation } from './trasseTransformNew';
// import type { TrasseNew, Pole, ConnectionLine } from '../types/trasseUINew';
// import type { HLeitertypData } from '../types/usedData';

// describe('uiToComputation', () => {
//   it('should transform poles with right-to-left connections correctly', () => {
//     // Test data from the actual bug report
//     const trasse: TrasseNew = {
//       id: 'c4d329bc-c89e-4418-b079-0069ceedcbcf',
//       name: 'Test Trasse',
//       templateId: 'template_1',
//       poleIds: [
//         'pole_c4d329bc-c89e-4418-b079-0069ceedcbcf_1',
//         'pole_c4d329bc-c89e-4418-b079-0069ceedcbcf_2'
//       ]
//     };

//     const poles = new Map<string, Pole>([
//       [
//         "pole_c4d329bc-c89e-4418-b079-0069ceedcbcf_1",
//         {
//           "id": "pole_c4d329bc-c89e-4418-b079-0069ceedcbcf_1",
//           "trasseId": "c4d329bc-c89e-4418-b079-0069ceedcbcf",
//           "name": "Mast 1",
//           "position": {
//             "GK": {
//               "Rechts": 3525786.0476796576,
//               "Hoch": 5385768.886343292
//             },
//             "z": 0
//           },
//           "poleHeight": 60,
//           "nullpunktHeight": 0,
//           "orientation": {
//             "x": 0,
//             "y": 1,
//             "Length": 1
//           },
//           "gkOrientation": {
//             "Rechts": 0,
//             "Hoch": 1
//           },
//           "levels": [
//             {
//               "levelNumber": 1,
//               "levelHeight": 50,
//               "leftConnections": [],
//               "rightConnections": [
//                 {
//                   "id": "pole_c4d329bc-c89e-4418-b079-0069ceedcbcf_1_L1_R1",
//                   "poleId": "pole_c4d329bc-c89e-4418-b079-0069ceedcbcf_1",
//                   "levelNumber": 1,
//                   "side": "right",
//                   "connectionNumber": 1,
//                   "horizontalDistance2Pole": 5,
//                   "isolatorLength": 2.5,
//                   "connected2Connection": "pole_c4d329bc-c89e-4418-b079-0069ceedcbcf_2_L1_L1"
//                 }
//               ]
//             }
//           ]
//         }
//       ],
//       [
//         "pole_c4d329bc-c89e-4418-b079-0069ceedcbcf_2",
//         {
//           "id": "pole_c4d329bc-c89e-4418-b079-0069ceedcbcf_2",
//           "trasseId": "c4d329bc-c89e-4418-b079-0069ceedcbcf",
//           "name": "Mast 2",
//           "position": {
//             "GK": {
//               "Rechts": 3525876.7937121787,
//               "Hoch": 5385767.711707564
//             },
//             "z": 0
//           },
//           "poleHeight": 60,
//           "nullpunktHeight": 0,
//           "orientation": {
//             "x": 0,
//             "y": 1,
//             "Length": 1
//           },
//           "gkOrientation": {
//             "Rechts": 0,
//             "Hoch": 1
//           },
//           "levels": [
//             {
//               "levelNumber": 1,
//               "levelHeight": 50,
//               "leftConnections": [],
//               "rightConnections": [
//                 {
//                   "id": "pole_c4d329bc-c89e-4418-b079-0069ceedcbcf_2_L1_R1",
//                   "poleId": "pole_c4d329bc-c89e-4418-b079-0069ceedcbcf_2",
//                   "levelNumber": 1,
//                   "side": "right",
//                   "connectionNumber": 1,
//                   "horizontalDistance2Pole": 5,
//                   "isolatorLength": 2.5
//                 }
//               ]
//             }
//           ]
//         }
//       ]
//     ]);

//     const connectionLines: ConnectionLine[] = [
//       {
//         "id": "line_pole_c4d329bc-c89e-4418-b079-0069ceedcbcf_1_pole_c4d329bc-c89e-4418-b079-0069ceedcbcf_2_L1_R1",
//         "trasseId": "c4d329bc-c89e-4418-b079-0069ceedcbcf",
//         "fromConnectionId": "pole_c4d329bc-c89e-4418-b079-0069ceedcbcf_1_L1_R1",
//         "toConnectionId": "pole_c4d329bc-c89e-4418-b079-0069ceedcbcf_2_L1_L1", // Note: This references L1 (left) but pole 2 only has R1 (right)
//         "connectionLineType": "L_80dB",
//         "maxSag": 5,
//         "operatingVoltage": 380,
//         "soundPowerLevel": 80
//       }
//     ];

//     const leiterTypes: HLeitertypData[] = [
//       {
//         Name: 'L_80dB',
//         SchallLW: 'L_80dB'
//       }
//     ];

//     // Call the transformation
//     const result = uiToComputation(trasse, poles, connectionLines, leiterTypes);

//     // Assertions
//     expect(result).toBeDefined();
//     expect(result.Name).toBe('Test Trasse');
//     expect(result.UsedMasten).toHaveLength(2);
    
//     // Check first mast
//     const mast1 = result.UsedMasten[0];
//     expect(mast1.Name).toBe('Mast 1');
//     expect(mast1.UsedEbenen).toHaveLength(1);
//     expect(mast1.UsedEbenen[0].UsedLeitungenLinks).toHaveLength(0);
//     expect(mast1.UsedEbenen[0].UsedLeitungenRechts).toHaveLength(1);
    
//     // Check the connection from mast 1 right to mast 2
//     const mast1RightConductor = mast1.UsedEbenen[0].UsedLeitungenRechts[0];
//     expect(mast1RightConductor.NextMastEbene).toBe(1);
//     // The issue: The connection line says it goes to pole_2_L1_L1 (left side, conductor 1)
//     // But pole 2 doesn't have left conductors, only right
//     // So NextMastLeiter should indicate this properly
    
//     // Check second mast
//     const mast2 = result.UsedMasten[1];
//     expect(mast2.Name).toBe('Mast 2');
//     expect(mast2.UsedEbenen).toHaveLength(1);
//     expect(mast2.UsedEbenen[0].UsedLeitungenLinks).toHaveLength(0);
//     expect(mast2.UsedEbenen[0].UsedLeitungenRechts).toHaveLength(1);
    
//     // The second mast's conductor should not have a next connection
//     const mast2RightConductor = mast2.UsedEbenen[0].UsedLeitungenRechts[0];
//     expect(mast2RightConductor.NextMastEbene).toBe(0);
//     expect(mast2RightConductor.NextMastLeiter).toBe(0);
//   });

//   it('should handle the corrected connection data', () => {
//     // Same test but with corrected connection data
//     const trasse: TrasseNew = {
//       id: 'c4d329bc-c89e-4418-b079-0069ceedcbcf',
//       name: 'Test Trasse Corrected',
//       templateId: 'template_1',
//       poleIds: [
//         'pole_c4d329bc-c89e-4418-b079-0069ceedcbcf_1',
//         'pole_c4d329bc-c89e-4418-b079-0069ceedcbcf_2'
//       ]
//     };

//     const poles = new Map<string, Pole>([
//       [
//         "pole_c4d329bc-c89e-4418-b079-0069ceedcbcf_1",
//         {
//           "id": "pole_c4d329bc-c89e-4418-b079-0069ceedcbcf_1",
//           "trasseId": "c4d329bc-c89e-4418-b079-0069ceedcbcf",
//           "name": "Mast 1",
//           "position": {
//             "GK": {
//               "Rechts": 3525786.0476796576,
//               "Hoch": 5385768.886343292
//             },
//             "z": 0
//           },
//           "poleHeight": 60,
//           "nullpunktHeight": 0,
//           "orientation": {
//             "x": 0,
//             "y": 1,
//             "Length": 1
//           },
//           "gkOrientation": {
//             "Rechts": 0,
//             "Hoch": 1
//           },
//           "levels": [
//             {
//               "levelNumber": 1,
//               "levelHeight": 50,
//               "leftConnections": [],
//               "rightConnections": [
//                 {
//                   "id": "pole_c4d329bc-c89e-4418-b079-0069ceedcbcf_1_L1_R1",
//                   "poleId": "pole_c4d329bc-c89e-4418-b079-0069ceedcbcf_1",
//                   "levelNumber": 1,
//                   "side": "right",
//                   "connectionNumber": 1,
//                   "horizontalDistance2Pole": 5,
//                   "isolatorLength": 2.5,
//                   "connected2Connection": "pole_c4d329bc-c89e-4418-b079-0069ceedcbcf_2_L1_R1" // Corrected to R1
//                 }
//               ]
//             }
//           ]
//         }
//       ],
//       [
//         "pole_c4d329bc-c89e-4418-b079-0069ceedcbcf_2",
//         {
//           "id": "pole_c4d329bc-c89e-4418-b079-0069ceedcbcf_2",
//           "trasseId": "c4d329bc-c89e-4418-b079-0069ceedcbcf",
//           "name": "Mast 2",
//           "position": {
//             "GK": {
//               "Rechts": 3525876.7937121787,
//               "Hoch": 5385767.711707564
//             },
//             "z": 0
//           },
//           "poleHeight": 60,
//           "nullpunktHeight": 0,
//           "orientation": {
//             "x": 0,
//             "y": 1,
//             "Length": 1
//           },
//           "gkOrientation": {
//             "Rechts": 0,
//             "Hoch": 1
//           },
//           "levels": [
//             {
//               "levelNumber": 1,
//               "levelHeight": 50,
//               "leftConnections": [],
//               "rightConnections": [
//                 {
//                   "id": "pole_c4d329bc-c89e-4418-b079-0069ceedcbcf_2_L1_R1",
//                   "poleId": "pole_c4d329bc-c89e-4418-b079-0069ceedcbcf_2",
//                   "levelNumber": 1,
//                   "side": "right",
//                   "connectionNumber": 1,
//                   "horizontalDistance2Pole": 5,
//                   "isolatorLength": 2.5
//                 }
//               ]
//             }
//           ]
//         }
//       ]
//     ]);

//     const connectionLines: ConnectionLine[] = [
//       {
//         "id": "line_pole_c4d329bc-c89e-4418-b079-0069ceedcbcf_1_pole_c4d329bc-c89e-4418-b079-0069ceedcbcf_2_L1_R1",
//         "trasseId": "c4d329bc-c89e-4418-b079-0069ceedcbcf",
//         "fromConnectionId": "pole_c4d329bc-c89e-4418-b079-0069ceedcbcf_1_L1_R1",
//         "toConnectionId": "pole_c4d329bc-c89e-4418-b079-0069ceedcbcf_2_L1_R1", // Corrected to R1
//         "connectionLineType": "L_80dB",
//         "maxSag": 5,
//         "operatingVoltage": 380,
//         "soundPowerLevel": 80
//       }
//     ];

//     const leiterTypes: HLeitertypData[] = [
//       {
//         Name: 'L_80dB',
//         SchallLW: 'L_80dB'
//       }
//     ];

//     // Call the transformation
//     const result = uiToComputation(trasse, poles, connectionLines, leiterTypes);

//     // Assertions
//     expect(result).toBeDefined();
//     expect(result.Name).toBe('Test Trasse Corrected');
//     expect(result.UsedMasten).toHaveLength(2);
    
//     // Check first mast
//     const mast1 = result.UsedMasten[0];
//     expect(mast1.Name).toBe('Mast 1');
//     expect(mast1.UsedEbenen).toHaveLength(1);
//     expect(mast1.UsedEbenen[0].UsedLeitungenRechts).toHaveLength(1);
    
//     // Check the connection from mast 1 right to mast 2 right
//     const mast1RightConductor = mast1.UsedEbenen[0].UsedLeitungenRechts[0];
//     expect(mast1RightConductor.NextMastEbene).toBe(1);
//     expect(mast1RightConductor.NextMastLeiter).toBe(1); // Positive for right-to-right connection
    
//     // Check second mast
//     const mast2 = result.UsedMasten[1];
//     expect(mast2.Name).toBe('Mast 2');
//     expect(mast2.UsedEbenen).toHaveLength(1);
//     expect(mast2.UsedEbenen[0].UsedLeitungenRechts).toHaveLength(1);
//   });
// });