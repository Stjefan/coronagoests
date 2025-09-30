// import React, { useState, useEffect } from 'react';
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from '../ui/dialog';
// import { Button } from '../ui/button';
// import { Input } from '../ui/input';
// import { Label } from '../ui/label';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
// import { useProjectStore } from '../../store/projectStore';
// import type { Pole, Level, Connection, Vector2dWithLength } from '../../types/trasseUINew';
// import { Save, X } from 'lucide-react';

// interface PoleEditDialogProps {
//   poleId: string;
//   isOpen: boolean;
//   onClose: () => void;
// }

// export const PoleEditDialog: React.FC<PoleEditDialogProps> = ({
//   poleId,
//   isOpen,
//   onClose,
// }) => {
//   const { 
//     poles, 
//     connectionLines, 
//     updatePole, 
//     updateConnectionLine 
//   } = useProjectStore();
  
//   const pole = poles.get(poleId);
  
//   const [formData, setFormData] = useState<{
//     poleHeight: number;
//     orientationX: number;
//     orientationY: number;
//     levels: Array<{
//       levelNumber: number;
//       levelHeight: number;
//       leftConnections: Array<{
//         id: string;
//         horizontalDistance2Pole: number;
//         isolatorLength: number;
//       }>;
//       rightConnections: Array<{
//         id: string;
//         horizontalDistance2Pole: number;
//         isolatorLength: number;
//       }>;
//     }>;
//   }>({
//     poleHeight: 60,
//     orientationX: 0,
//     orientationY: 1,
//     levels: []
//   });

//   // Connection lines data for editing
//   const [linesData, setLinesData] = useState<Map<string, {
//     maxSag: number;
//     operatingVoltage: number;
//     soundPowerLevel: number;
//     connectionLineType: string;
//   }>>(new Map());

//   useEffect(() => {
//     if (pole) {
//       setFormData({
//         poleHeight: pole.poleHeight,
//         orientationX: pole.orientation.x,
//         orientationY: pole.orientation.y,
//         levels: pole.levels.map(level => ({
//           levelNumber: level.levelNumber,
//           levelHeight: level.levelHeight,
//           leftConnections: level.leftConnections.map(conn => ({
//             id: conn.id,
//             horizontalDistance2Pole: conn.horizontalDistance2Pole,
//             isolatorLength: conn.isolatorLength || 2.5
//           })),
//           rightConnections: level.rightConnections.map(conn => ({
//             id: conn.id,
//             horizontalDistance2Pole: conn.horizontalDistance2Pole,
//             isolatorLength: conn.isolatorLength || 2.5
//           }))
//         }))
//       });

//       // Load connection lines data
//       const newLinesData = new Map<string, any>();
//       connectionLines.forEach((line) => {
//         // Check if this line starts from one of this pole's connections
//         const isFromThisPole = pole.levels.some(level => 
//           [...level.leftConnections, ...level.rightConnections].some(conn => 
//             conn.id === line.fromConnectionId
//           )
//         );
        
//         if (isFromThisPole) {
//           newLinesData.set(line.id, {
//             maxSag: line.maxSag,
//             operatingVoltage: line.operatingVoltage || 380,
//             soundPowerLevel: line.soundPowerLevel || 80,
//             connectionLineType: line.connectionLineType
//           });
//         }
//       });
//       setLinesData(newLinesData);
//     }
//   }, [pole, connectionLines]);

//   const handleSave = () => {
//     if (!pole) return;

//     // Update pole data
//     const updatedPole: Pole = {
//       ...pole,
//       poleHeight: formData.poleHeight,
//       orientation: {
//         x: formData.orientationX,
//         y: formData.orientationY,
//         Length: Math.sqrt(formData.orientationX ** 2 + formData.orientationY ** 2)
//       } as Vector2dWithLength,
//       levels: formData.levels.map((levelData, levelIndex) => {
//         const originalLevel = pole.levels[levelIndex];
//         return {
//           levelNumber: levelData.levelNumber,
//           levelHeight: levelData.levelHeight,
//           leftConnections: levelData.leftConnections.map((connData, connIndex) => {
//             const originalConn = originalLevel?.leftConnections[connIndex];
//             return {
//               ...originalConn,
//               horizontalDistance2Pole: connData.horizontalDistance2Pole,
//               isolatorLength: connData.isolatorLength
//             } as Connection;
//           }),
//           rightConnections: levelData.rightConnections.map((connData, connIndex) => {
//             const originalConn = originalLevel?.rightConnections[connIndex];
//             return {
//               ...originalConn,
//               horizontalDistance2Pole: connData.horizontalDistance2Pole,
//               isolatorLength: connData.isolatorLength
//             } as Connection;
//           })
//         } as Level;
//       })
//     };

//     updatePole(poleId, updatedPole);

//     // Update connection lines
//     linesData.forEach((lineData, lineId) => {
//       updateConnectionLine(lineId, lineData);
//     });

//     onClose();
//   };

//   if (!pole) {
//     return null;
//   }

//   const handleLevelChange = (levelIndex: number, field: string, value: any) => {
//     const newLevels = [...formData.levels];
//     newLevels[levelIndex] = {
//       ...newLevels[levelIndex],
//       [field]: value
//     };
//     setFormData({ ...formData, levels: newLevels });
//   };

//   const handleConnectionChange = (
//     levelIndex: number,
//     side: 'left' | 'right',
//     connIndex: number,
//     field: string,
//     value: any
//   ) => {
//     const newLevels = [...formData.levels];
//     const connections = side === 'left' 
//       ? [...newLevels[levelIndex].leftConnections]
//       : [...newLevels[levelIndex].rightConnections];
    
//     connections[connIndex] = {
//       ...connections[connIndex],
//       [field]: value
//     };
    
//     if (side === 'left') {
//       newLevels[levelIndex].leftConnections = connections;
//     } else {
//       newLevels[levelIndex].rightConnections = connections;
//     }
    
//     setFormData({ ...formData, levels: newLevels });
//   };

//   const handleLineChange = (lineId: string, field: string, value: any) => {
//     const newLinesData = new Map(linesData);
//     const existing = newLinesData.get(lineId);
//     if (existing) {
//       newLinesData.set(lineId, { ...existing, [field]: value });
//       setLinesData(newLinesData);
//     }
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
//         <DialogHeader>
//           <DialogTitle>Mast bearbeiten: {poleId}</DialogTitle>
//         </DialogHeader>
        
//         <div className="space-y-4">
//           {/* Basic Properties */}
//           <div className="grid grid-cols-3 gap-4">
//             <div>
//               <Label htmlFor="poleHeight">Masthöhe (m)</Label>
//               <Input
//                 id="poleHeight"
//                 type="number"
//                 value={formData.poleHeight}
//                 onChange={(e) => setFormData({ 
//                   ...formData, 
//                   poleHeight: parseFloat(e.target.value) || 0 
//                 })}
//               />
//             </div>
//             <div>
//               <Label htmlFor="orientationX">Ausrichtung X</Label>
//               <Input
//                 id="orientationX"
//                 type="number"
//                 value={formData.orientationX}
//                 onChange={(e) => setFormData({ 
//                   ...formData, 
//                   orientationX: parseFloat(e.target.value) || 0 
//                 })}
//                 step="0.1"
//               />
//             </div>
//             <div>
//               <Label htmlFor="orientationY">Ausrichtung Y</Label>
//               <Input
//                 id="orientationY"
//                 type="number"
//                 value={formData.orientationY}
//                 onChange={(e) => setFormData({ 
//                   ...formData, 
//                   orientationY: parseFloat(e.target.value) || 0 
//                 })}
//                 step="0.1"
//               />
//             </div>
//           </div>

//           {/* Levels */}
//           <Tabs defaultValue="level-0" className="w-full">
//             <TabsList>
//               {formData.levels.map((level, index) => (
//                 <TabsTrigger key={index} value={`level-${index}`}>
//                   Ebene {level.levelNumber}
//                 </TabsTrigger>
//               ))}
//             </TabsList>
            
//             {formData.levels.map((level, levelIndex) => (
//               <TabsContent key={levelIndex} value={`level-${levelIndex}`} className="space-y-4">
//                 <div>
//                   <Label>Ebene Höhe (m)</Label>
//                   <Input
//                     type="number"
//                     value={level.levelHeight}
//                     onChange={(e) => handleLevelChange(
//                       levelIndex, 
//                       'levelHeight', 
//                       parseFloat(e.target.value) || 0
//                     )}
//                   />
//                 </div>

//                 {/* Left Connections */}
//                 <div>
//                   <h4 className="font-semibold mb-2">Linke Leiter</h4>
//                   {level.leftConnections.map((conn, connIndex) => (
//                     <div key={connIndex} className="grid grid-cols-2 gap-2 mb-2 p-2 border rounded">
//                       <div>
//                         <Label className="text-sm">Abstand zur Mastachse (m)</Label>
//                         <Input
//                           type="number"
//                           value={conn.horizontalDistance2Pole}
//                           onChange={(e) => handleConnectionChange(
//                             levelIndex, 'left', connIndex, 
//                             'horizontalDistance2Pole', 
//                             parseFloat(e.target.value) || 0
//                           )}
//                           step="0.1"
//                         />
//                       </div>
//                       <div>
//                         <Label className="text-sm">Isolatorlänge (m)</Label>
//                         <Input
//                           type="number"
//                           value={conn.isolatorLength}
//                           onChange={(e) => handleConnectionChange(
//                             levelIndex, 'left', connIndex, 
//                             'isolatorLength', 
//                             parseFloat(e.target.value) || 0
//                           )}
//                           step="0.1"
//                         />
//                       </div>
//                     </div>
//                   ))}
//                 </div>

//                 {/* Right Connections */}
//                 <div>
//                   <h4 className="font-semibold mb-2">Rechte Leiter</h4>
//                   {level.rightConnections.map((conn, connIndex) => (
//                     <div key={connIndex} className="grid grid-cols-2 gap-2 mb-2 p-2 border rounded">
//                       <div>
//                         <Label className="text-sm">Abstand zur Mastachse (m)</Label>
//                         <Input
//                           type="number"
//                           value={conn.horizontalDistance2Pole}
//                           onChange={(e) => handleConnectionChange(
//                             levelIndex, 'right', connIndex, 
//                             'horizontalDistance2Pole', 
//                             parseFloat(e.target.value) || 0
//                           )}
//                           step="0.1"
//                         />
//                       </div>
//                       <div>
//                         <Label className="text-sm">Isolatorlänge (m)</Label>
//                         <Input
//                           type="number"
//                           value={conn.isolatorLength}
//                           onChange={(e) => handleConnectionChange(
//                             levelIndex, 'right', connIndex, 
//                             'isolatorLength', 
//                             parseFloat(e.target.value) || 0
//                           )}
//                           step="0.1"
//                         />
//                       </div>
//                     </div>
//                   ))}
//                 </div>

//                 {/* Connection Lines from this level */}
//                 <div>
//                   <h4 className="font-semibold mb-2">Leitungsverbindungen</h4>
//                   {Array.from(linesData.entries()).map(([lineId, lineData]) => {
//                     const line = connectionLines.get(lineId);
//                     if (!line) return null;
                    
//                     // Check if this line starts from this level
//                     const isFromThisLevel = [...level.leftConnections, ...level.rightConnections]
//                       .some(conn => conn.id === line.fromConnectionId);
                    
//                     if (!isFromThisLevel) return null;
                    
//                     return (
//                       <div key={lineId} className="grid grid-cols-4 gap-2 mb-2 p-2 border rounded">
//                         <div>
//                           <Label className="text-sm">Durchhang (m)</Label>
//                           <Input
//                             type="number"
//                             value={lineData.maxSag}
//                             onChange={(e) => handleLineChange(
//                               lineId, 'maxSag', 
//                               parseFloat(e.target.value) || 5
//                             )}
//                             step="0.1"
//                           />
//                         </div>
//                         <div>
//                           <Label className="text-sm">Spannung (kV)</Label>
//                           <Input
//                             type="number"
//                             value={lineData.operatingVoltage}
//                             onChange={(e) => handleLineChange(
//                               lineId, 'operatingVoltage', 
//                               parseFloat(e.target.value) || 0
//                             )}
//                           />
//                         </div>
//                         <div>
//                           <Label className="text-sm">Schall (dB)</Label>
//                           <Input
//                             type="number"
//                             value={lineData.soundPowerLevel}
//                             onChange={(e) => handleLineChange(
//                               lineId, 'soundPowerLevel', 
//                               parseFloat(e.target.value) || 0
//                             )}
//                           />
//                         </div>
//                         <div>
//                           <Label className="text-sm">Typ</Label>
//                           <Input
//                             type="text"
//                             value={lineData.connectionLineType}
//                             onChange={(e) => handleLineChange(
//                               lineId, 'connectionLineType', 
//                               e.target.value
//                             )}
//                           />
//                         </div>
//                       </div>
//                     );
//                   })}
//                 </div>
//               </TabsContent>
//             ))}
//           </Tabs>
//         </div>

//         <div className="flex justify-end gap-2 mt-6">
//           <Button variant="outline" onClick={onClose}>
//             <X className="h-4 w-4 mr-2" />
//             Abbrechen
//           </Button>
//           <Button onClick={handleSave}>
//             <Save className="h-4 w-4 mr-2" />
//             Speichern
//           </Button>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// };