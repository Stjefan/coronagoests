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
import { useProjectStore } from '../../store/projectStore';
import { Save, X, Zap } from 'lucide-react';

interface AllConductorsEditDialogProps {
  mastId: string;
  nextMastId: string;
  isOpen: boolean;
  onClose: () => void;
}

type ConductorEditFormData = {
  ebenen: Array<{
    leitungenLinks: Array<{
      durchhang: number;
      isolatorlaenge: number;
      schallLw: string;
      schallLwDB: number;
    }>;
    leitungenRechts: Array<{
      durchhang: number;
      isolatorlaenge: number;
      schallLw: string;
      schallLwDB: number;
    }>;
  }>;
}
export const AllConductorsEditDialog: React.FC<AllConductorsEditDialogProps> = ({
  mastId,
  nextMastId,
  isOpen,
  onClose,
}) => {
  const { 
    poles,
    trassenNew,
    connectionLines,
    updatePole,
    updateConnectionLine,
    leiterTypes, 
  } = useProjectStore();
  
  // Try to get as pole first, then as mast
  const pole = poles.get(mastId);
  const mast = pole;
  const entity = pole || mast;
  const isPole = !!pole;
  
  const nextPole = poles.get(nextMastId);
  const nextMast = nextPole;
  const nextEntity = nextPole || nextMast;
  
  const trasseNew = pole ? trassenNew.get(pole.trasseId) : undefined;
  const trasseEntity = trasseNew;
  
  const [formData, setFormData] = useState<ConductorEditFormData>({
    ebenen: [],
  });
  
  // Initialize form data from mast or pole conductors
  useEffect(() => {
    if (!entity) return;
    
    let ebenenData: ConductorEditFormData['ebenen'] = [];
    
    if (isPole && pole) {
      // For poles, get data from connection lines
      ebenenData = pole.levels.map(level => {
        // Get connection lines for this level's connections
        const leftConnectionLines = level.leftConnections.map(conn => {
          return Array.from(connectionLines.values()).find(
            line => line.fromConnectionId === conn.id
          );
        });
        const rightConnectionLines = level.rightConnections.map(conn => {
          return Array.from(connectionLines.values()).find(
            line => line.fromConnectionId === conn.id
          );
        });
        
        return {
          leitungenLinks: level.leftConnections.map((conn, i) => {
            const line = leftConnectionLines[i];
            return {
              durchhang: line?.maxSag || 5,
              isolatorlaenge: conn.isolatorLength || 2.5,
              schallLw: line?.connectionLineType || '',
              schallLwDB: line?.soundPowerLevel || 55,
            };
          }),
          leitungenRechts: level.rightConnections.map((conn, i) => {
            const line = rightConnectionLines[i];
            return {
              durchhang: line?.maxSag || 5,
              isolatorlaenge: conn.isolatorLength || 2.5,
              schallLw: line?.connectionLineType || '',
              schallLwDB: line?.soundPowerLevel || 55,
            };
          }),
        };
      });
    } 
    
    
    setFormData({ ebenen: ebenenData });
  }, [entity, isPole, pole, mast, connectionLines]);
  
  if (!entity || !nextEntity || !trasseEntity) {
    return null;
  }
  
  const handleSave = () => {
    if (isPole && pole) {
      // For poles, update connection lines
      formData.ebenen.forEach((ebene, ebeneIndex) => {
        const level = pole.levels[ebeneIndex];
        if (!level) return;
        
        // Update left connection lines
        ebene.leitungenLinks.forEach((leiter, leiterIndex) => {
          const conn = level.leftConnections[leiterIndex];
          if (!conn) return;
          
          // Find and update the connection line
          const line = Array.from(connectionLines.values()).find(
            l => l.fromConnectionId === conn.id
          );
          if (line) {
            updateConnectionLine(line.id, {
              maxSag: leiter.durchhang,
              connectionLineType: leiter.schallLw,
              soundPowerLevel: leiter.schallLwDB,
            });
          }
          
          // Update the connection's isolator length
          const updatedConn = { ...conn, isolatorLength: leiter.isolatorlaenge };
          const updatedLevel = {
            ...level,
            leftConnections: level.leftConnections.map((c, i) => 
              i === leiterIndex ? updatedConn : c
            ),
          };
          const updatedPole = {
            ...pole,
            levels: pole.levels.map((l, i) => 
              i === ebeneIndex ? updatedLevel : l
            ),
          };
          updatePole(mastId, updatedPole);
        });
        
        // Update right connection lines
        ebene.leitungenRechts.forEach((leiter, leiterIndex) => {
          const conn = level.rightConnections[leiterIndex];
          if (!conn) return;
          
          // Find and update the connection line
          const line = Array.from(connectionLines.values()).find(
            l => l.fromConnectionId === conn.id
          );
          if (line) {
            updateConnectionLine(line.id, {
              maxSag: leiter.durchhang,
              connectionLineType: leiter.schallLw,
              soundPowerLevel: leiter.schallLwDB,
            });
          }
          
          // Update the connection's isolator length
          const updatedConn = { ...conn, isolatorLength: leiter.isolatorlaenge };
          const updatedLevel = {
            ...level,
            rightConnections: level.rightConnections.map((c, i) => 
              i === leiterIndex ? updatedConn : c
            ),
          };
          const updatedPole = {
            ...pole,
            levels: pole.levels.map((l, i) => 
              i === ebeneIndex ? updatedLevel : l
            ),
          };
          updatePole(mastId, updatedPole);
        });
      });
    }
    
    onClose();
  };
  
  const updateLeiterProperty = (
    ebeneIndex: number,
    side: 'left' | 'right',
    leiterIndex: number,
    property: 'durchhang' | 'isolatorlaenge' | 'schallLw' | 'schallLwDB',
    value: number | string
  ) => {
    const newEbenen = [...formData.ebenen];
    if (side === 'left') {
      if (property === 'durchhang' || property === 'isolatorlaenge' || property === 'schallLwDB') {
        newEbenen[ebeneIndex].leitungenLinks[leiterIndex][property] = value as number;
      } else {
        newEbenen[ebeneIndex].leitungenLinks[leiterIndex][property] = value as string;
      }
    } else {
      if (property === 'durchhang' || property === 'isolatorlaenge' || property === 'schallLwDB') {
        newEbenen[ebeneIndex].leitungenRechts[leiterIndex][property] = value as number;
      } else {
        newEbenen[ebeneIndex].leitungenRechts[leiterIndex][property] = value as string;
      }
    }
    setFormData({ ...formData, ebenen: newEbenen });
  };
  
  const renderVisualization = () => {
    const svgHeight = 450;
    const svgWidth = 600;
    const mastX1 = 40;
    const mastX2 = svgWidth - 40;
    const groundY = svgHeight - 30;
    const mastTopY = 30;
    

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
        
        {/* Masts */}
        <line x1={mastX1} y1={groundY} x2={mastX1} y2={mastTopY} stroke="#333" strokeWidth={6} />
        <line x1={mastX2} y1={groundY} x2={mastX2} y2={mastTopY} stroke="#333" strokeWidth={6} />
        
        {/* Draw conductors for each level */}
        {formData.ebenen.map((formEbene, ebeneIndex) => {
          const numLevels = formData.ebenen.length;
          const y = mastTopY + ((groundY - mastTopY) / (numLevels + 1)) * (ebeneIndex + 1);
          if (!formEbene) return null;
          
          return (
            <g key={ebeneIndex}>
              {/* Crossarms */}
              <line x1={mastX1 - 30} y1={y} x2={mastX1 + 30} y2={y} stroke="#666" strokeWidth={3} />
              <line x1={mastX2 - 30} y1={y} x2={mastX2 + 30} y2={y} stroke="#666" strokeWidth={3} />
              
              {/* Left conductors */}
              {formEbene.leitungenLinks.map((leiter, lIndex) => {
                const offset = 15 + lIndex * 10;
                const x1 = mastX1 - offset;
                const x2 = mastX2 - offset;
                const midX = (x1 + x2) / 2;
                const sagY = y + leiter.durchhang * 3; // Scale for visualization
                
                return (
                  <g key={`left-${lIndex}`}>
                    <path
                      d={`M ${x1} ${y} Q ${midX} ${sagY} ${x2} ${y}`}
                      fill="none"
                      stroke="#FF0000"
                      strokeWidth={2}
                    />
                  </g>
                );
              })}
              
              {/* Right conductors */}
              {formEbene.leitungenRechts.map((leiter, rIndex) => {
                const offset = 15 + rIndex * 10;
                const x1 = mastX1 + offset;
                const x2 = mastX2 + offset;
                const midX = (x1 + x2) / 2;
                const sagY = y + leiter.durchhang * 3; // Scale for visualization
                
                return (
                  <g key={`right-${rIndex}`}>
                    <path
                      d={`M ${x1} ${y} Q ${midX} ${sagY} ${x2} ${y}`}
                      fill="none"
                      stroke="#0000FF"
                      strokeWidth={2}
                    />
                  </g>
                );
              })}
              
              {/* Level label */}
              <text x={10} y={y + 4} fontSize={12} fill="#333" fontWeight="bold">
                E{ebeneIndex + 1}
              </text>
            </g>
          );
        })}
        
        {/* Mast labels */}
        <text x={mastX1} y={mastTopY - 10} fontSize={11} textAnchor="middle" fill="#333">
          {entity && entity?.name || 'Mast 1'}
        </text>
        <text x={mastX2} y={mastTopY - 10} fontSize={11} textAnchor="middle" fill="#333">
          {nextEntity && (nextEntity?.name) || 'Mast 2'}
        </text>
        
        {/* Legend */}
        <g transform={`translate(10, ${svgHeight - 20})`}>
          <circle cx={0} cy={0} r={3} fill="#FF0000" />
          <text x={8} y={3} fontSize={10} fill="#666">Links</text>
          <circle cx={50} cy={0} r={3} fill="#0000FF" />
          <text x={58} y={3} fontSize={10} fill="#666">Rechts</text>
        </g>
      </svg>
    );
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-[90vw] !w-[90vw] !max-h-[90vh] overflow-y-auto" style={{ width: '90vw', maxWidth: '90vw', height: '85vh' }}>
        <DialogHeader>
          <DialogTitle>
            <Zap className="h-5 w-5 inline-block mr-2" />
            Leitungen bearbeiten: {(pole?.name || '')} → {(nextEntity?.name || '')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left side - Configuration */}
          <div className="flex-1 space-y-4">
            <div className="text-sm text-gray-600">
              Konfigurieren Sie Durchhang und Isolatorlänge für alle Leitungen
            </div>
            
            {formData.ebenen.map((ebene, ebeneIndex) => (
              <div key={ebeneIndex} className="border rounded p-3 space-y-3">
                <div className="font-medium text-sm">
                  Ebene {ebeneIndex + 1}
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {/* Left conductors */}
                  {ebene.leitungenLinks.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Leiter Links</Label>
                      {ebene.leitungenLinks.map((leiter, lIndex) => (
                        <div key={lIndex} className="space-y-1 p-2 bg-gray-50 rounded">
                          <div className="text-xs font-medium">L{lIndex + 1}</div>
                          <div className="grid grid-cols-2 gap-1">
                            <div>
                              <Label className="text-xs text-gray-600">Durchhang (m)</Label>
                              <Input
                                type="number"
                                step="0.1"
                                value={leiter.durchhang}
                                onChange={(e) => updateLeiterProperty(
                                  ebeneIndex, 'left', lIndex, 'durchhang', 
                                  parseFloat(e.target.value) || 0
                                )}
                                className="h-7 text-xs"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-gray-600">Isolator (m)</Label>
                              <Input
                                type="number"
                                step="0.1"
                                value={leiter.isolatorlaenge}
                                onChange={(e) => updateLeiterProperty(
                                  ebeneIndex, 'left', lIndex, 'isolatorlaenge',
                                  parseFloat(e.target.value) || 0
                                )}
                                className="h-7 text-xs"
                              />
                            </div>
                          </div>
                          <div className="mt-2">
                            <Label className="text-xs text-gray-600">Leitertyp (Schall)</Label>
                            <select
                              value={leiter.schallLw}
                              onChange={(e) => {
                                const selectedType = e.target.value;
                                updateLeiterProperty(ebeneIndex, 'left', lIndex, 'schallLw', selectedType);
                                // Update SchallLwDB based on selected type
                                if (selectedType && leiterTypes.has(selectedType)) {
                                  const leiterType = leiterTypes.get(selectedType);
                                  if (leiterType) {
                                    updateLeiterProperty(ebeneIndex, 'left', lIndex, 'schallLwDB', leiterType.SchallLW);
                                  }
                                }
                              }}
                              className="w-full h-7 text-xs rounded-md border border-input bg-background px-2"
                            >
                              <option value="">Kein Typ (Standard)</option>
                              {Array.from(leiterTypes.entries()).map(([key, type]) => (
                                <option key={key} value={key}>
                                  {type.Name} ({type.SchallLW} dB)
                                </option>
                              ))}
                            </select>
                            {!leiter.schallLw && (
                              <div className="mt-1">
                                <Label className="text-xs text-gray-600">SchallLW (dB)</Label>
                                <Input
                                  type="number"
                                  step="0.1"
                                  value={leiter.schallLwDB}
                                  onChange={(e) => updateLeiterProperty(
                                    ebeneIndex, 'left', lIndex, 'schallLwDB',
                                    parseFloat(e.target.value) || 0
                                  )}
                                  className="h-7 text-xs"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Right conductors */}
                  {ebene.leitungenRechts.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Leiter Rechts</Label>
                      {ebene.leitungenRechts.map((leiter, rIndex) => (
                        <div key={rIndex} className="space-y-1 p-2 bg-gray-50 rounded">
                          <div className="text-xs font-medium">R{rIndex + 1}</div>
                          <div className="grid grid-cols-2 gap-1">
                            <div>
                              <Label className="text-xs text-gray-600">Durchhang (m)</Label>
                              <Input
                                type="number"
                                step="0.1"
                                value={leiter.durchhang}
                                onChange={(e) => updateLeiterProperty(
                                  ebeneIndex, 'right', rIndex, 'durchhang',
                                  parseFloat(e.target.value) || 0
                                )}
                                className="h-7 text-xs"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-gray-600">Isolator (m)</Label>
                              <Input
                                type="number"
                                step="0.1"
                                value={leiter.isolatorlaenge}
                                onChange={(e) => updateLeiterProperty(
                                  ebeneIndex, 'right', rIndex, 'isolatorlaenge',
                                  parseFloat(e.target.value) || 0
                                )}
                                className="h-7 text-xs"
                              />
                            </div>
                          </div>
                          <div className="mt-2">
                            <Label className="text-xs text-gray-600">Leitertyp (Schall)</Label>
                            <select
                              value={leiter.schallLw}
                              onChange={(e) => {
                                const selectedType = e.target.value;
                                updateLeiterProperty(ebeneIndex, 'right', rIndex, 'schallLw', selectedType);
                                // Update SchallLwDB based on selected type
                                if (selectedType && leiterTypes.has(selectedType)) {
                                  const leiterType = leiterTypes.get(selectedType);
                                  if (leiterType) {
                                    updateLeiterProperty(ebeneIndex, 'right', rIndex, 'schallLwDB', leiterType.SchallLW);
                                  }
                                }
                              }}
                              className="w-full h-7 text-xs rounded-md border border-input bg-background px-2"
                            >
                              <option value="">Kein Typ (Standard)</option>
                              {Array.from(leiterTypes.entries()).map(([key, type]) => (
                                <option key={key} value={key}>
                                  {type.Name} ({type.SchallLW} dB)
                                </option>
                              ))}
                            </select>
                            {!leiter.schallLw && (
                              <div className="mt-1">
                                <Label className="text-xs text-gray-600">SchallLW (dB)</Label>
                                <Input
                                  type="number"
                                  step="0.1"
                                  value={leiter.schallLwDB}
                                  onChange={(e) => updateLeiterProperty(
                                    ebeneIndex, 'right', rIndex, 'schallLwDB',
                                    parseFloat(e.target.value) || 0
                                  )}
                                  className="h-7 text-xs"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
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