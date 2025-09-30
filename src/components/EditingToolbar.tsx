// import React, { useState } from 'react';
// import { useProjectStore } from '../store/projectStore';
// import type { EditMode, ElementType } from '../store/projectStore';
// import { DraggablePanel } from './DraggablePanel';
// import { Button } from './ui/button';
// import { Eye, Plus, Edit, Trash2, Save, FolderOpen, Calculator, AlertTriangle, Map, Target, Volume2, Building } from 'lucide-react';
// import { useDialog } from '../hooks/useDialog';

// export const EditingToolbar: React.FC = () => {
//   const [calculationResults, setCalculationResults] = useState<Array<{id: string, name: string, value: number}> | null>(null);
//   const [isCalculating, setIsCalculating] = useState(false);
  
//   const {
//     editMode,
//     selectedElementType,
//     setEditMode,
//     setSelectedElementType,
//     clearAll,
//     exportProjectData,
//     calculateImmissionValue,
//     immissionPoints,
//   } = useProjectStore();
  
//   const { confirm } = useDialog();
  
//   const handleExport = () => {
//     const data = exportProjectData();
//     const blob = new Blob([JSON.stringify({ ProjectData: data }, null, 2)], { type: 'application/json' });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = 'project_export.json';
//     a.click();
//     URL.revokeObjectURL(url);
//   };
  
//   const handleImport = () => {
//     const input = document.createElement('input');
//     input.type = 'file';
//     input.accept = 'application/json';
//     input.onchange = async (e) => {
//       const file = (e.target as HTMLInputElement).files?.[0];
//       if (file) {
//         const text = await file.text();
//         const data = JSON.parse(text);
//         useProjectStore.getState().loadProjectData(data.ProjectData);
//       }
//     };
//     input.click();
//   };


//   const modeButtons: Array<{ mode: EditMode; icon: React.ReactNode; label: string }> = [
//     { mode: 'view', icon: <Eye className="h-4 w-4" />, label: 'Ansicht' },
//     { mode: 'add', icon: <Plus className="h-4 w-4" />, label: 'Hinzufügen' },
//     { mode: 'edit', icon: <Edit className="h-4 w-4" />, label: 'Bearbeiten' },
//     { mode: 'delete', icon: <Trash2 className="h-4 w-4" />, label: 'Löschen' },
//   ];

//   const elementButtons: Array<{ type: ElementType; icon: React.ReactNode; label: string }> = [
//     { type: 'hoehenpunkt', icon: <Map className="h-4 w-4" />, label: 'Höhenpunkt' },
//     { type: 'immissionpoint', icon: <Target className="h-4 w-4" />, label: 'Immissionspunkt' },
//     { type: 'esq', icon: <Volume2 className="h-4 w-4" />, label: 'ESQ' },
//     { type: 'mast', icon: <Building className="h-4 w-4" />, label: 'Mast' },
//   ];
  
//   return (
//     <DraggablePanel title="Bearbeitungswerkzeuge" defaultPosition={{ x: window.innerWidth - 320, y: 10 }}>
//       <div className="space-y-4">
//         <div>
//           <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 block">
//             Modus
//           </label>
//           <div className="grid grid-cols-2 gap-2">
//             {modeButtons.map(({ mode, icon, label }) => (
//               <Button
//                 key={mode}
//                 variant={editMode === mode ? 'default' : 'outline'}
//                 size="sm"
//                 onClick={() => setEditMode(mode)}
//                 className="justify-start"
//               >
//                 {icon}
//                 <span className="ml-2">{label}</span>
//               </Button>
//             ))}
//           </div>
//         </div>
        
//         {editMode !== 'view' && (
//           <div>
//             <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 block">
//               Element-Typ
//             </label>
//             <div className="grid grid-cols-2 gap-2">
//               {elementButtons.map(({ type, icon, label }) => (
//                 <Button
//                   key={type}
//                   variant={selectedElementType === type ? 'default' : 'outline'}
//                   size="sm"
//                   onClick={() => setSelectedElementType(type)}
//                   className="justify-start text-xs"
//                 >
//                   {icon}
//                   <span className="ml-1">{label}</span>
//                 </Button>
//               ))}
//             </div>
//           </div>
//         )}
        
//         <div className="space-y-2">
//           <Button
//             variant="secondary"
//             size="sm"
//             onClick={handleExport}
//             className="w-full justify-start"
//           >
//             <Save className="h-4 w-4 mr-2" />
//             Exportieren
//           </Button>
//           <Button
//             variant="secondary"
//             size="sm"
//             onClick={handleImport}
//             className="w-full justify-start"
//           >
//             <FolderOpen className="h-4 w-4 mr-2" />
//             Importieren
//           </Button>
//           <Button
//             variant="destructive"
//             size="sm"
//             onClick={async () => {
//               const confirmed = await confirm('Wirklich alle Elemente löschen?');
//               if (confirmed) {
//                 clearAll();
//               }
//             }}
//             className="w-full justify-start"
//           >
//             <AlertTriangle className="h-4 w-4 mr-2" />
//             Alles löschen
//           </Button>
//         </div>
        
//         {calculationResults && (
//           <div className="p-3 bg-green-50 border border-green-200 rounded-md">
//             <p className="text-xs font-semibold text-green-800 mb-2">Berechnungsergebnisse:</p>
//             {calculationResults.map(result => (
//               <div key={result.id} className="text-xs text-green-700">
//                 <span className="font-medium">{result.name}:</span> {result.value.toFixed(2)} dB
//               </div>
//             ))}
//           </div>
//         )}
        
//         {editMode !== 'view' && (
//           <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
//             <p className="text-xs text-blue-800">
//               <span className="font-semibold">Hinweis:</span><br />
//               {editMode === 'add' && `Klicken Sie auf die Karte, um ${
//                 selectedElementType === 'hoehenpunkt' ? 'einen Höhenpunkt' : 
//                 selectedElementType === 'immissionpoint' ? 'einen Immissionspunkt' :
//                 selectedElementType === 'esq' ? 'eine ESQ' : 
//                 'einen Mast'
//               } hinzuzufügen.`}
//               {editMode === 'edit' && 'Klicken Sie auf ein Element, um es zu bearbeiten.'}
//               {editMode === 'delete' && 'Klicken Sie auf ein Element, um es zu löschen.'}
//             </p>
//           </div>
//         )}
//       </div>
//     </DraggablePanel>
//   );
// };