import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useProjectStore } from '../../store/projectStore';
import type { Pole, ConnectionLine } from '../../types/trasseUINew';
import { Save, X } from 'lucide-react';


interface DialogFormData 
  {
    name: string;
    mastHoehe: number;
    nullpunktHoehe: number;
    ebenen: Array<{
      abstandNullpunkt: number;
      leitungenLinks: Array<{ 
        abstandMastachse: number;
        nextMastEbene: number;
        nextMastLeiter: number;
        einbauart: number;
        connected2Connection?: string;
      }>;
      leitungenRechts: Array<{ 
        abstandMastachse: number;
        nextMastEbene: number;
        nextMastLeiter: number;
        einbauart: number;
        connected2Connection?: string;
      }>;
    }>;
  }


interface LeitungenFormData {
  abstandMastachse: number;
  nextMastEbene: number;
  nextMastLeiter: number;
  einbauart: number;
  connected2Connection?: string;
}
interface PoleFormData {
  abstandNullpunkt: number; leitungenLinks: LeitungenFormData[]
  leitungenRechts: LeitungenFormData[]

}


interface MastEditDialogProps {
  mastId: string;
  isPole?: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export const MastEditDialog: React.FC<MastEditDialogProps> = ({
  mastId,
  isPole = false,
  isOpen,
  onClose,
}) => {
  const { 

    poles,
    trassenNew,
    connectionLines,
    mastLayoutTemplates, 
    updatePole,
    addConnectionLine,
    updateConnectionLine,
    dtmProcessor,
  } = useProjectStore();
  
  // Get the mast or pole based on isPole flag
  const mast = isPole;
  const pole = isPole ? poles.get(mastId) : undefined;
  const entity = mast || pole;
  
  // Get the associated trasse
  const trasseNew = pole ? trassenNew.get(pole.trasseId) : undefined;
  const trasseEntity = trasseNew;
  
  // Get the template
  const template = trasseNew?.templateId ? mastLayoutTemplates.get(trasseNew.templateId) : undefined;
  
  const [formData, setFormData] = useState<DialogFormData>({
    name: '',
    mastHoehe: 100,
    nullpunktHoehe: 150,
    ebenen: [],
  });
  
  const [activeTab, setActiveTab] = useState('general');
  const [disableAutoConnection, setDisableAutoConnection] = useState(false);
  
  // Determine if this is the last mast/pole in the trasse
  const entityIndex = trasseNew ? trasseNew.poleIds.indexOf(mastId) : -1
  const isLastEntity = trasseNew ? entityIndex === trasseNew.poleIds.length - 1 : true
  const nextEntityId =     (trasseNew && !isLastEntity ? trasseNew.poleIds[entityIndex + 1] : null)
  const nextEntity = nextEntityId ? poles.get(nextEntityId) : null
  
  // Initialize form data from mast or pole
  useEffect(() => {
    if (!entity) return;
    
    let ebenenData: PoleFormData[] = [];
    let name = '';
    let mastHoehe = 100;
    let nullpunktHoehe = 150;
    
    console.log("Input is this pole: ", pole);
    if (isPole && pole) {
      // Convert pole levels to form format
      name = pole.name || '';
      mastHoehe = pole.poleHeight;
      nullpunktHoehe = pole.nullpunktHeight;
      
      ebenenData = pole.levels.map(level => {
        // Get connection lines for this level
        // const leftConnectionLines = level.leftConnections.map(conn => {
        //   const line = Array.from(connectionLines.values()).find(l => l.fromConnectionId === conn.id);
        //   return { conn, line };
        // });
        // const rightConnectionLines = level.rightConnections.map(conn => {
        //   const line = Array.from(connectionLines.values()).find(l => l.fromConnectionId === conn.id);
        //   return { conn, line };
        // });
        
        return {
          abstandNullpunkt: level.levelHeight /*- mastHoehe*/, // Convert to offset from nullpunkt
          leitungenLinks: level.leftConnections.map((conn) => {
            let nextMastEbene = 0;
            let nextMastLeiter = 0;
            
            if (conn.connected2Connection) {
              // Parse the connected connection ID to get level and side/number
              // Format: poleId_L{levelNumber}_{L or R}{connectionNumber}
              const match = conn.connected2Connection.match(/_L(\d+)_([LR])(\d+)$/);
              if (match) {
                nextMastEbene = parseInt(match[1]) || 0;
                const side = match[2];
                const num = parseInt(match[3]) || 1;
                // For LEFT conductors: L = positive (left target), R = negative (right target)
                nextMastLeiter = side === 'L' ? num : -num;
              }
            }
            
            return {
              abstandMastachse: conn.horizontalDistance2Pole,
              nextMastEbene,
              nextMastLeiter,
              einbauart: conn.einbauart || 0,
              connected2Connection: conn.connected2Connection,
            };
          }),
          leitungenRechts: level.rightConnections.map((conn) => {
            let nextMastEbene = 0;
            let nextMastLeiter = 0;
            
            if (conn.connected2Connection) {
              // Parse the connected connection ID to get level and side/number
              // Format: poleId_L{levelNumber}_{L or R}{connectionNumber}
              const match = conn.connected2Connection.match(/_L(\d+)_([LR])(\d+)$/);
              if (match) {
                nextMastEbene = parseInt(match[1]) || 0;
                const side = match[2];
                const num = parseInt(match[3]) || 1;
                // For RIGHT conductors: L = negative (left target), R = positive (right target)
                nextMastLeiter = side === 'L' ? -num : num;
              }
            }
            
            return {
              abstandMastachse: conn.horizontalDistance2Pole,
              nextMastEbene,
              nextMastLeiter,
              einbauart: conn.einbauart || 0,
              connected2Connection: conn.connected2Connection,
            };
          }),
        };
      });
    }
    
    // If no ebenen exist but we have a template, create default from template
    if (ebenenData.length === 0 && template) {
      const defaultSpacing = mastHoehe / (template.anzahlEbenen + 1);
      template.ebenenConfig.forEach((ebeneConfig, index) => {
        ebenenData.push({
          abstandNullpunkt: (index + 1) * defaultSpacing,
          leitungenLinks: Array.from({ length: ebeneConfig.anzahlLeitungenLinks }, (_, i) => ({
            abstandMastachse: 10 + (i * 5),
            nextMastEbene: index + 1,
            nextMastLeiter: i + 1,
            einbauart: 0,
          })),
          leitungenRechts: Array.from({ length: ebeneConfig.anzahlLeitungenRechts }, (_, i) => ({
            abstandMastachse: 10 + (i * 5),
            nextMastEbene: index + 1,
            nextMastLeiter: -(i + 1),
            einbauart: 0,
          })),
        });
      });
    }
    
    setFormData({
      name,
      mastHoehe,
      nullpunktHoehe,
      ebenen: ebenenData,
    });

    console.log("Using this ebenenData: ", ebenenData);
  }, [entity, mast, pole, template, isPole, connectionLines]);
  
  if (!entity || !trasseEntity) {
    return null;
  }
  
  const handleSave = () => {
    if (isPole && pole) {
      // Update pole properties
      const updatedPole = {
        ...pole,
        name: formData.name,
        poleHeight: formData.mastHoehe,
        nullpunktHeight: formData.nullpunktHoehe,
        levels: formData.ebenen.map((ebene, ebeneIndex) => ({
          levelNumber: ebeneIndex + 1,
          levelHeight: /* formData.mastHoehe + */ ebene.abstandNullpunkt,
          leftConnections: ebene.leitungenLinks.map((leiter, lIndex) => {
            const origConn = pole.levels[ebeneIndex]?.leftConnections[lIndex];
            const connId = origConn?.id || `${mastId}_${ebeneIndex + 1}_left_${lIndex + 1}`;
            
            // Use the direct connection reference
            let connected2Connection = leiter.connected2Connection;
            
            // Only fall back to computing from nextMastEbene/nextMastLeiter if auto-connection is enabled
            if (!connected2Connection && !disableAutoConnection && nextEntityId && leiter.nextMastEbene > 0) {
              // For LEFT conductors: positive nextMastLeiter = connect to LEFT side of next mast
              const side = leiter.nextMastLeiter > 0 ? 'left' : 'right';
              const num = Math.abs(leiter.nextMastLeiter);
              // Use the correct format: poleId_L{level}_{L or R}{number}
              const sideChar = side === 'left' ? 'L' : 'R';
              connected2Connection = `${nextEntityId}_L${leiter.nextMastEbene}_${sideChar}${num}`;
            }
            
            return {
              id: connId,
              poleId: mastId,
              levelNumber: ebeneIndex + 1,
              side: 'left' as const,
              connectionNumber: lIndex + 1,
              horizontalDistance2Pole: leiter.abstandMastachse,
              isolatorLength: origConn?.isolatorLength || 2.5,
              einbauart: leiter.einbauart,
              connected2Connection,
              durchgangspunktGK: origConn?.durchgangspunktGK,
              durchgangspunktZ: origConn?.durchgangspunktZ,
            };
          }),
          rightConnections: ebene.leitungenRechts.map((leiter, rIndex) => {
            const origConn = pole.levels[ebeneIndex]?.rightConnections[rIndex];
            const connId = origConn?.id || `${mastId}_${ebeneIndex + 1}_right_${rIndex + 1}`;
            
            // Use the direct connection reference
            let connected2Connection = leiter.connected2Connection;
            
            // Only fall back to computing from nextMastEbene/nextMastLeiter if auto-connection is enabled
            if (!connected2Connection && !disableAutoConnection && nextEntityId && leiter.nextMastEbene > 0) {
              // For RIGHT conductors: positive nextMastLeiter = connect to RIGHT side of next mast
              const side = leiter.nextMastLeiter > 0 ? 'right' : 'left';
              const num = Math.abs(leiter.nextMastLeiter);
              // Use the correct format: poleId_L{level}_{L or R}{number}
              const sideChar = side === 'left' ? 'L' : 'R';
              connected2Connection = `${nextEntityId}_L${leiter.nextMastEbene}_${sideChar}${num}`;
            }
            
            return {
              id: connId,
              poleId: mastId,
              levelNumber: ebeneIndex + 1,
              side: 'right' as const,
              connectionNumber: rIndex + 1,
              horizontalDistance2Pole: leiter.abstandMastachse,
              isolatorLength: origConn?.isolatorLength || 2.5,
              einbauart: leiter.einbauart,
              connected2Connection,
              durchgangspunktGK: origConn?.durchgangspunktGK,
              durchgangspunktZ: origConn?.durchgangspunktZ,
            };
          }),
        })),
      };
      
      updatePole(mastId, updatedPole);
      
      // Update or create connection lines based on the connections
      // For each connection that has a connected2Connection, ensure a connection line exists
      updatedPole.levels.forEach((level) => {
        // Process left connections
        level.leftConnections.forEach((conn) => {
          if (conn.connected2Connection) {
            // Find existing connection line or create a new one
            const existingLine = Array.from(connectionLines.values()).find(
              line => line.fromConnectionId === conn.id
            );
            
            if (existingLine) {
              // Update existing line if needed (connection target might have changed)
              if (existingLine.toConnectionId !== conn.connected2Connection) {
                updateConnectionLine(existingLine.id, {
                  toConnectionId: conn.connected2Connection
                });
              }
            } else if (nextEntityId) {
              // Create new connection line
              const newLineId = `line_${mastId}_${nextEntityId}_L${level.levelNumber}_L${conn.connectionNumber}`;
              const newLine: ConnectionLine = {
                id: newLineId,
                trasseId: pole.trasseId,
                fromConnectionId: conn.id,
                toConnectionId: conn.connected2Connection,
                connectionLineType: 'L_80dB',
                maxSag: 5,
                operatingVoltage: 380,
                soundPowerLevel: 80
              };
              addConnectionLine(newLine);
            }
          }
        });
        
        // Process right connections
        level.rightConnections.forEach((conn) => {
          if (conn.connected2Connection) {
            // Find existing connection line or create a new one
            const existingLine = Array.from(connectionLines.values()).find(
              line => line.fromConnectionId === conn.id
            );
            
            if (existingLine) {
              // Update existing line if needed
              if (existingLine.toConnectionId !== conn.connected2Connection) {
                updateConnectionLine(existingLine.id, {
                  toConnectionId: conn.connected2Connection
                });
              }
            } else if (nextEntityId) {
              // Create new connection line
              const newLineId = `line_${mastId}_${nextEntityId}_L${level.levelNumber}_R${conn.connectionNumber}`;
              const newLine: ConnectionLine = {
                id: newLineId,
                trasseId: pole.trasseId,
                fromConnectionId: conn.id,
                toConnectionId: conn.connected2Connection,
                connectionLineType: 'L_80dB',
                maxSag: 5,
                operatingVoltage: 380,
                soundPowerLevel: 80
              };
              addConnectionLine(newLine);
            }
          }
        });
      });
      
    }
    
    onClose();
  };
  
  const updateEbeneHeight = (ebeneIndex: number, height: number) => {
    const newEbenen = [...formData.ebenen];
    newEbenen[ebeneIndex].abstandNullpunkt = height;
    setFormData({ ...formData, ebenen: newEbenen });
  };
  
  const updateLeiterDistance = (ebeneIndex: number, side: 'left' | 'right', leiterIndex: number, distance: number) => {
    const newEbenen = [...formData.ebenen];
    if (side === 'left') {
      newEbenen[ebeneIndex].leitungenLinks[leiterIndex].abstandMastachse = distance;
    } else {
      newEbenen[ebeneIndex].leitungenRechts[leiterIndex].abstandMastachse = distance;
    }
    setFormData({ ...formData, ebenen: newEbenen });
  };
  
  // const updateLeiterConnection = (
  //   ebeneIndex: number, 
  //   side: 'left' | 'right', 
  //   leiterIndex: number, 
  //   nextEbene: number, 
  //   nextLeiter: number
  // ) => {
  //   const newEbenen = [...formData.ebenen];
  //   if (side === 'left') {
  //     newEbenen[ebeneIndex].leitungenLinks[leiterIndex].nextMastEbene = nextEbene;
  //     newEbenen[ebeneIndex].leitungenLinks[leiterIndex].nextMastLeiter = nextLeiter;
  //   } else {
  //     newEbenen[ebeneIndex].leitungenRechts[leiterIndex].nextMastEbene = nextEbene;
  //     newEbenen[ebeneIndex].leitungenRechts[leiterIndex].nextMastLeiter = nextLeiter;
  //   }
  //   setFormData({ ...formData, ebenen: newEbenen });
  // };
  
  const updateLeiterDirectConnection = (
    ebeneIndex: number,
    side: 'left' | 'right',
    leiterIndex: number,
    connectionId: string
  ) => {
    const newEbenen = [...formData.ebenen];
    if (side === 'left') {
      newEbenen[ebeneIndex].leitungenLinks[leiterIndex].connected2Connection = connectionId || undefined;
    } else {
      newEbenen[ebeneIndex].leitungenRechts[leiterIndex].connected2Connection = connectionId || undefined;
    }
    setFormData({ ...formData, ebenen: newEbenen });
  };
  
  const updateLeiterEinbauart = (
    ebeneIndex: number,
    side: 'left' | 'right',
    leiterIndex: number,
    einbauart: number
  ) => {
    const newEbenen = [...formData.ebenen];
    if (side === 'left') {
      newEbenen[ebeneIndex].leitungenLinks[leiterIndex].einbauart = einbauart;
    } else {
      newEbenen[ebeneIndex].leitungenRechts[leiterIndex].einbauart = einbauart;
    }
    setFormData({ ...formData, ebenen: newEbenen });
  };
  
  const renderVisualization = () => {
    const svgHeight = 450;
    const svgWidth = 500;
    const mastX = svgWidth / 2;
    const groundY = svgHeight - 30;
    const mastTopY = 30;
    const mastHeight = groundY - mastTopY;
    
    // Scale factors for visualization
    const heightScale = mastHeight / formData.mastHoehe;
    
    // Calculate max conductor distance for dynamic width scaling
    let maxDistance = 20; // minimum 20m
    formData.ebenen.forEach(ebene => {
      ebene.leitungenLinks.forEach(l => {
        maxDistance = Math.max(maxDistance, l.abstandMastachse);
      });
      ebene.leitungenRechts.forEach(l => {
        maxDistance = Math.max(maxDistance, l.abstandMastachse);
      });
    });
    const widthScale = Math.min(3, 150 / maxDistance); // Dynamic scaling
    
    return (
      <svg width={svgWidth} height={svgHeight} className="border rounded bg-gray-50">
        {/* Ground line */}
        <line x1={0} y1={groundY} x2={svgWidth} y2={groundY} stroke="#8B4513" strokeWidth={3} />
        
        {/* Ground hatching */}
        {Array.from({ length: 20 }, (_, i) => (
          <line 
            key={`ground-${i}`}
            x1={i * 25} 
            y1={groundY} 
            x2={i * 25 + 10} 
            y2={groundY + 10} 
            stroke="#8B4513" 
            strokeWidth={1}
            opacity={0.5}
          />
        ))}
        
        {/* Mast pole */}
        <line x1={mastX} y1={groundY} x2={mastX} y2={mastTopY} stroke="#333" strokeWidth={6} />
        
        {/* Mast height label */}
        <text x={mastX + 10} y={mastTopY - 5} fontSize={12} fill="#666">
          {formData.mastHoehe.toFixed(1)}m
        </text>
        
        {/* Nullpunkt line */}
        <line 
          x1={mastX - 30} 
          y1={groundY - (formData.nullpunktHoehe * heightScale)} 
          x2={mastX + 30} 
          y2={groundY - (formData.nullpunktHoehe * heightScale)} 
          stroke="#0066CC" 
          strokeWidth={1}
          strokeDasharray="5,5"
        />
        <text 
          x={mastX + 35} 
          y={groundY - (formData.nullpunktHoehe * heightScale) + 4} 
          fontSize={10} 
          fill="#0066CC"
        >
          Nullpunkt ({formData.nullpunktHoehe.toFixed(1)}m)
        </text>
        
        {/* Ebenen (levels) */}
        {formData.ebenen.map((ebene, index) => {
          const y = groundY - (ebene.abstandNullpunkt * heightScale);
          
          return (
            <g key={index}>
              {/* Level crossarm */}
              <line 
                x1={mastX - (maxDistance * widthScale + 20)} 
                y1={y} 
                x2={mastX + (maxDistance * widthScale + 20)} 
                y2={y} 
                stroke="#666" 
                strokeWidth={3}
              />
              
              {/* Left conductors */}
              {ebene.leitungenLinks.map((leiter, lIndex) => {
                const x = mastX - (leiter.abstandMastachse * widthScale);
                return (
                  <g key={`left-${lIndex}`}>
                    {/* Insulator */}
                    <line 
                      x1={mastX - 5} 
                      y1={y} 
                      x2={x} 
                      y2={y + 8} 
                      stroke="#4A5568" 
                      strokeWidth={2}
                    />
                    {/* Conductor */}
                    <circle 
                      cx={x} 
                      cy={y + 8} 
                      r={5} 
                      fill="#FF0000"
                      stroke="#CC0000"
                      strokeWidth={1}
                    />
                    {/* Distance label */}
                    <text 
                      x={x - 10} 
                      y={y + 25} 
                      fontSize={9} 
                      fill="#666"
                      textAnchor="middle"
                    >
                      {leiter.abstandMastachse.toFixed(1)}m
                    </text>
                  </g>
                );
              })}
              
              {/* Right conductors */}
              {ebene.leitungenRechts.map((leiter, rIndex) => {
                const x = mastX + (leiter.abstandMastachse * widthScale);
                return (
                  <g key={`right-${rIndex}`}>
                    {/* Insulator */}
                    <line 
                      x1={mastX + 5} 
                      y1={y} 
                      x2={x} 
                      y2={y + 8} 
                      stroke="#4A5568" 
                      strokeWidth={2}
                    />
                    {/* Conductor */}
                    <circle 
                      cx={x} 
                      cy={y + 8} 
                      r={5} 
                      fill="#0000FF"
                      stroke="#0000CC"
                      strokeWidth={1}
                    />
                    {/* Distance label */}
                    <text 
                      x={x + 10} 
                      y={y + 25} 
                      fontSize={9} 
                      fill="#666"
                      textAnchor="middle"
                    >
                      {leiter.abstandMastachse.toFixed(1)}m
                    </text>
                  </g>
                );
              })}
              
              {/* Level label */}
              <text 
                x={mastX - (maxDistance * widthScale + 30)} 
                y={y + 4} 
                fontSize={12} 
                fill="#333"
                fontWeight="bold"
              >
                E{index + 1}
              </text>
              
              {/* Height label */}
              <text 
                x={mastX + (maxDistance * widthScale + 25)} 
                y={y + 4} 
                fontSize={10} 
                fill="#666"
              >
                {ebene.abstandNullpunkt.toFixed(1)}m
              </text>
            </g>
          );
        })}
        
        {/* Legend */}
        <g transform={`translate(10, 20)`}>
          <text fontSize={11} fontWeight="bold" fill="#333">Legende:</text>
          <circle cx={10} cy={20} r={4} fill="#FF0000" />
          <text x={20} y={24} fontSize={10} fill="#666">Links</text>
          <circle cx={70} cy={20} r={4} fill="#0000FF" />
          <text x={80} y={24} fontSize={10} fill="#666">Rechts</text>
        </g>
      </svg>
    );
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-[90vw] !w-[90vw] !max-h-[90vh] overflow-y-auto" style={{ width: '90vw', maxWidth: '90vw', height: '85vh' }}>
        <DialogHeader>
          <DialogTitle>Mast bearbeiten: {pole?.name || 'Unnamed Pole'} </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">Allgemein</TabsTrigger>
            <TabsTrigger value="levels">Ebenen & Leiter</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mastHoehe">Masthöhe [m] (nur visuelle Darstellung)</Label>
                <Input
                  id="mastHoehe"
                  type="number"
                  step="0.1"
                  value={formData.mastHoehe}
                  onChange={(e) => setFormData({ ...formData, mastHoehe: parseFloat(e.target.value) || 0 })}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="nullpunktHoehe">Nullpunkthöhe (m)</Label>
                  {pole && dtmProcessor && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        try {
                          const terrainHeight = dtmProcessor.berechneHoeheDGM(pole.position.GK);
                          if (!isNaN(terrainHeight)) {
                            setFormData({ ...formData, nullpunktHoehe: terrainHeight });
                          }
                        } catch (error) {
                          console.error('Error calculating terrain height:', error);
                        }
                      }}
                      className="h-7 text-xs"
                    >
                      An Gelände anpassen
                    </Button>
                  )}
                </div>
                <Input
                  id="nullpunktHoehe"
                  type="number"
                  step="0.1"
                  value={formData.nullpunktHoehe}
                  onChange={(e) => setFormData({ ...formData, nullpunktHoehe: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            
            {template && (
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-sm font-medium text-blue-900">Template: {template.name}</div>
                <div className="text-xs text-blue-700 mt-1">{template.description}</div>
              </div>
            )}
            
            <div className="bg-gray-50 p-3 rounded space-y-1 text-sm">
              <div className="font-medium">Trasse: {isPole ?? trasseNew?.name}</div>
              {isPole && pole ? (
                <>
                  <div>Position: {pole.position.GK.Rechts.toFixed(2)}, {pole.position.GK.Hoch.toFixed(2)}</div>
                  <div>Höhe über NN: {pole.position.z.toFixed(2)}m</div>
                </>
              ) 
              : null}
            </div>
          </TabsContent>
          
          <TabsContent value="levels" className="space-y-4">
            {template ? (
              <>
                <div className="flex items-center space-x-2 mb-4">
                  <input
                    type="checkbox"
                    id="disableAutoConnection"
                    checked={disableAutoConnection}
                    onChange={(e) => setDisableAutoConnection(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="disableAutoConnection" className="text-sm">
                    Automatische Verbindungen deaktivieren (erlaubt explizites "Keine Verbindung")
                  </Label>
                </div>
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Left side - Configuration */}
                <div className="flex-1 space-y-4">
                  <div className="text-sm text-gray-600">
                    Konfiguration basiert auf Template "{template.name}"
                  </div>
                  
                  {formData.ebenen.map((ebene, ebeneIndex) => {
                  const templateEbene = template.ebenenConfig[ebeneIndex];
                  if (!templateEbene) return null;
                  
                  return (
                    <div key={ebeneIndex} className="border rounded p-3 space-y-2">
                      <div className="font-medium text-sm">
                        Ebene {ebeneIndex + 1} ({templateEbene.anzahlLeitungenLinks}L/{templateEbene.anzahlLeitungenRechts}R)
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-xs">Höhe über Nullpunkt (m)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={ebene.abstandNullpunkt}
                          onChange={(e) => updateEbeneHeight(ebeneIndex, parseFloat(e.target.value) || 0)}
                          className="h-8"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        {/* Left conductors */}
                        {ebene.leitungenLinks.length > 0 && (
                          <div className="space-y-1">
                            <Label className="text-xs font-medium">Leiter Links</Label>
                            {ebene.leitungenLinks.map((leiter, lIndex) => (
                              <div key={lIndex} className="space-y-1">
                                <div className="flex items-center gap-1">
                                  <span className="text-xs w-8">L{lIndex + 1}:</span>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    value={leiter.abstandMastachse}
                                    onChange={(e) => updateLeiterDistance(ebeneIndex, 'left', lIndex, parseFloat(e.target.value) || 0)}
                                    className="flex-1 h-7 text-xs"
                                    placeholder="Abstand (m)"
                                  />
                                </div>
                                {!isLastEntity && nextEntity && (
                                  <select
                                    value={leiter.connected2Connection || ''}
                                    onChange={(e) => {
                                      updateLeiterDirectConnection(ebeneIndex, 'left', lIndex, e.target.value);
                                    }}
                                    className="w-full h-6 text-xs rounded border border-input bg-background px-2"
                                  >
                                    <option value="">Keine Verbindung</option>
                                    {isPole && nextEntity ? 
                                      // For poles, use levels structure
                                      (nextEntity as Pole).levels.map((nextLevel, nEbeneIdx) => (
                                        <optgroup key={nEbeneIdx} label={`Ebene ${nEbeneIdx + 1}`}>
                                          {nextLevel.leftConnections.map((conn, nLeiterIdx) => (
                                            <option key={`l-${nLeiterIdx}`} value={conn.id}>
                                              Links {nLeiterIdx + 1}
                                            </option>
                                          ))}
                                          {nextLevel.rightConnections.map((conn, nLeiterIdx) => (
                                            <option key={`r-${nLeiterIdx}`} value={conn.id}>
                                              Rechts {nLeiterIdx + 1}
                                            </option>
                                          ))}
                                        </optgroup>
                                      ))
                                    : <div></div>// For masts, use UsedEbenen structure
                                      }
                                  </select>
                                )}
                                <select
                                  value={leiter.einbauart}
                                  onChange={(e) => updateLeiterEinbauart(ebeneIndex, 'left', lIndex, parseInt(e.target.value))}
                                  className="w-full h-6 text-xs rounded border border-input bg-background px-2"
                                  title="Isolator-Einbauart"
                                >
                                  <option value="0">T-380KV</option>
                                  <option value="1">T-220KV</option>
                                  <option value="2">Abspann</option>
                                </select>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Right conductors */}
                        {ebene.leitungenRechts.length > 0 && (
                          <div className="space-y-1">
                            <Label className="text-xs font-medium">Leiter Rechts</Label>
                            {ebene.leitungenRechts.map((leiter, rIndex) => (
                              <div key={rIndex} className="space-y-1">
                                <div className="flex items-center gap-1">
                                  <span className="text-xs w-8">R{rIndex + 1}:</span>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    value={leiter.abstandMastachse}
                                    onChange={(e) => updateLeiterDistance(ebeneIndex, 'right', rIndex, parseFloat(e.target.value) || 0)}
                                    className="flex-1 h-7 text-xs"
                                    placeholder="Abstand (m)"
                                  />
                                </div>
                                {!isLastEntity && nextEntity && (
                                  <select
                                    value={leiter.connected2Connection || ''}
                                    onChange={(e) => {
                                      updateLeiterDirectConnection(ebeneIndex, 'right', rIndex, e.target.value);
                                    }}
                                    className="w-full h-6 text-xs rounded border border-input bg-background px-2"
                                  >
                                    <option value="">Keine Verbindung</option>
                                    {(isPole && nextEntity) ? 
                                      // For poles, use levels structure with actual connection IDs
                                      (nextEntity as Pole).levels.map((nextLevel) => (
                                        <optgroup key={nextLevel.levelNumber} label={`Ebene ${nextLevel.levelNumber}`}>
                                          {nextLevel.leftConnections.map((conn) => (
                                            <option key={conn.id} value={conn.id}>
                                              Links {conn.connectionNumber} ({conn.id})
                                            </option>
                                          ))}
                                          {nextLevel.rightConnections.map((conn) => (
                                            <option key={conn.id} value={conn.id}>
                                              Rechts {conn.connectionNumber} ({conn.id})
                                            </option>
                                          ))}
                                        </optgroup>
                                      ))
                                     : <div></div>// For masts, use UsedEbenen structure
                                      }
                                  </select>
                                )}
                                <select
                                  value={leiter.einbauart}
                                  onChange={(e) => updateLeiterEinbauart(ebeneIndex, 'right', rIndex, parseInt(e.target.value))}
                                  className="w-full h-6 text-xs rounded border border-input bg-background px-2"
                                  title="Isolator-Einbauart"
                                >
                                  <option value="0">T-380KV</option>
                                  <option value="1">T-220KV</option>
                                  <option value="2">Abspann</option>
                                </select>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                  })}
                </div>
                
                {/* Right side - Visualization */}
                <div className="flex-1 space-y-2">
                  <div className="text-sm font-medium text-gray-600">Visualisierung</div>
                  <div className="overflow-auto p-2">
                    <div className="inline-block min-w-fit">
                      {renderVisualization()}
                    </div>
                  </div>
                </div>
              </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Dieser Mast hat kein Template zugewiesen.</p>
                <p className="text-sm mt-2">Bitte weisen Sie der Trasse ein Template zu.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Abbrechen
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Speichern
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};