// import React, { useState } from 'react';
// import { useProjectStore } from '../store/projectStore';
// import { useDialog } from '../hooks/useDialog';

// export const TrasseManager: React.FC = () => {
//   const {
//     trassen,
//     addTrasse,
//     updateTrasse,
//     deleteTrasse,
//   } = useProjectStore();
  
//   const { prompt, confirm } = useDialog();
//   const [isOpen, setIsOpen] = useState(false);
//   const [newTrasseName, setNewTrasseName] = useState('');
  
//   const containerStyle: React.CSSProperties = {
//     position: 'absolute',
//     bottom: '10px',
//     right: '10px',
//     background: 'rgba(255, 255, 255, 0.95)',
//     padding: '15px',
//     borderRadius: '8px',
//     boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
//     zIndex: 1000,
//     minWidth: '250px',
//     maxWidth: '350px',
//   };
  
//   const buttonStyle: React.CSSProperties = {
//     padding: '8px 12px',
//     border: '1px solid #ccc',
//     borderRadius: '4px',
//     background: 'white',
//     cursor: 'pointer',
//     fontSize: '12px',
//     marginRight: '5px',
//   };
  
//   const trasseItemStyle: React.CSSProperties = {
//     padding: '8px',
//     marginBottom: '5px',
//     background: '#f5f5f5',
//     borderRadius: '4px',
//     display: 'flex',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   };
  
//   if (!isOpen) {
//     return (
//       <div style={{ ...containerStyle, minWidth: 'auto' }}>
//         <button
//           style={{
//             ...buttonStyle,
//             background: '#2196F3',
//             color: 'white',
//             marginRight: 0,
//           }}
//           onClick={() => setIsOpen(true)}
//         >
//           📋 Trassen verwalten ({trassen.size})
//         </button>
//       </div>
//     );
//   }
  
//   return (
//     <div style={containerStyle}>
//       <div style={{ 
//         display: 'flex', 
//         justifyContent: 'space-between', 
//         alignItems: 'center',
//         marginBottom: '15px' 
//       }}>
//         <h3 style={{ margin: 0, fontSize: '16px' }}>Trassen-Verwaltung</h3>
//         <button
//           style={{
//             border: 'none',
//             background: 'transparent',
//             cursor: 'pointer',
//             fontSize: '18px',
//           }}
//           onClick={() => setIsOpen(false)}
//         >
//           ✕
//         </button>
//       </div>
      
//       <div style={{ marginBottom: '15px' }}>
//         <div style={{ display: 'flex', gap: '5px' }}>
//           <input
//             type="text"
//             placeholder="Neue Trasse..."
//             value={newTrasseName}
//             onChange={(e) => setNewTrasseName(e.target.value)}
//             onKeyPress={(e) => {
//               if (e.key === 'Enter' && newTrasseName.trim()) {
//                 addTrasse(newTrasseName);
//                 setNewTrasseName('');
//               }
//             }}
//             style={{
//               flex: 1,
//               padding: '6px',
//               border: '1px solid #ddd',
//               borderRadius: '4px',
//               fontSize: '12px',
//             }}
//           />
//           <button
//             style={{
//               ...buttonStyle,
//               background: '#4CAF50',
//               color: 'white',
//             }}
//             onClick={() => {
//               if (newTrasseName.trim()) {
//                 addTrasse(newTrasseName);
//                 setNewTrasseName('');
//               }
//             }}
//           >
//             ➕
//           </button>
//         </div>
//       </div>
      
//       <div style={{ 
//         maxHeight: '300px', 
//         overflowY: 'auto',
//         marginBottom: '10px',
//       }}>
//         {trassen.size === 0 ? (
//           <div style={{ 
//             textAlign: 'center', 
//             padding: '20px',
//             color: '#666',
//             fontSize: '12px',
//           }}>
//             Keine Trassen vorhanden.<br />
//             Fügen Sie eine neue Trasse hinzu.
//           </div>
//         ) : (
//           Array.from(trassen.entries()).map(([id, trasse]) => (
//             <div key={id} style={trasseItemStyle}>
//               <div>
//                 <strong>{trasse.Name}</strong>
//                 <div style={{ fontSize: '11px', color: '#666' }}>
//                   {trasse.mastIds.length} Masten
//                 </div>
//               </div>
//               <div style={{ display: 'flex', gap: '5px' }}>
//                 <button
//                   style={{
//                     ...buttonStyle,
//                     padding: '4px 8px',
//                     fontSize: '11px',
//                   }}
//                   onClick={async () => {
//                     const newName = await prompt('Neuer Name:', trasse.Name);
//                     if (newName && newName !== trasse.Name) {
//                       updateTrasse(id, { Name: newName });
//                     }
//                   }}
//                 >
//                   ✏️
//                 </button>
//                 <button
//                   style={{
//                     ...buttonStyle,
//                     padding: '4px 8px',
//                     fontSize: '11px',
//                     background: '#f44336',
//                     color: 'white',
//                     border: 'none',
//                   }}
//                   onClick={async () => {
//                     const confirmed = await confirm(`Trasse "${trasse.Name}" und alle ${trasse.mastIds.length} Masten löschen?`);
//                     if (confirmed) {
//                       deleteTrasse(id);
//                     }
//                   }}
//                 >
//                   🗑️
//                 </button>
//               </div>
//             </div>
//           ))
//         )}
//       </div>
      
//       <div style={{
//         padding: '10px',
//         background: '#e3f2fd',
//         borderRadius: '4px',
//         fontSize: '11px',
//         color: '#1976d2',
//       }}>
//         <strong>Tipp:</strong> Wählen Sie im Bearbeitungsmodus "Mast hinzufügen" und klicken Sie auf die Karte, um Masten zu einer Trasse hinzuzufügen.
//       </div>
//     </div>
//   );
// };