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
import { 
  type MastLayoutTemplate, 
  createMastLayoutTemplate, 
  validateMastLayoutTemplate,
  STANDARD_TEMPLATES,
  type EbeneConfig
} from '../../types/mastLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { AlertCircle, Save, X } from 'lucide-react';

interface MastLayoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: MastLayoutTemplate) => void;
  existingTemplate?: MastLayoutTemplate;
  existingTemplates?: Map<string, MastLayoutTemplate>;
}

export const MastLayoutDialog: React.FC<MastLayoutDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  existingTemplate,
}) => {
  const [template, setTemplate] = useState<Partial<MastLayoutTemplate>>(() => {
    if (existingTemplate) {
      return existingTemplate;
    }
    
    // Create default template with one level
    return {
      name: '',
      description: '',
      anzahlEbenen: 1,
      ebenenConfig: [{
        nummerEbene: 1,
        anzahlLeitungenLinks: 1,
        anzahlLeitungenRechts: 1,
      }],
    };
  });
  
  const [selectedStandardTemplate, setSelectedStandardTemplate] = useState<string>('none');
  const [errors, setErrors] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('general');
  
  // Reset template when dialog opens with a different template
  useEffect(() => {
    if (isOpen) {
      if (existingTemplate) {
        // Ensure we have a deep copy of the existing template
        setTemplate({
          ...existingTemplate,
          ebenenConfig: existingTemplate.ebenenConfig ? [...existingTemplate.ebenenConfig] : [],
        });
      } else {
        // Reset to default for new template
        setTemplate({
          name: '',
          description: '',
          anzahlEbenen: 1,
          ebenenConfig: [{
            nummerEbene: 1,
            anzahlLeitungenLinks: 1,
            anzahlLeitungenRechts: 1,
          }],
        });
      }
      setActiveTab('general');
      setSelectedStandardTemplate('none');
    }
  }, [isOpen, existingTemplate]);
  
  // Handle anzahlEbenen changes
  const handleAnzahlEbenenChange = (newAnzahl: number) => {
    const currentConfig = template.ebenenConfig || [];
    let newConfig: EbeneConfig[] = [];
    
    if (newAnzahl > currentConfig.length) {
      // Add new levels
      newConfig = [...currentConfig];
      for (let i = currentConfig.length; i < newAnzahl; i++) {
        newConfig.push({
          nummerEbene: i + 1,
          anzahlLeitungenLinks: 1,
          anzahlLeitungenRechts: 1,
        });
      }
    } else if (newAnzahl < currentConfig.length) {
      // Remove levels
      newConfig = currentConfig.slice(0, newAnzahl);
    } else {
      // No change in number
      newConfig = currentConfig;
    }
    
    // Update level numbers
    newConfig = newConfig.map((config, index) => ({
      ...config,
      nummerEbene: index + 1,
    }));
    
    setTemplate({
      ...template,
      anzahlEbenen: newAnzahl,
      ebenenConfig: newConfig,
    });
  };
  
  const handleStandardTemplateSelect = (templateValue: string) => {
    console.log('Selected template:', templateValue);
    setSelectedStandardTemplate(templateValue);
    
    if (templateValue === 'none') {
      return;
    }
    
    // Map the simplified values to template names
    const templateMap: { [key: string]: string } = {
      'simple': 'Einfacher Einzelmast',
      '380kv': 'Standard 380kV',
      '110kv': 'Kompakt 110kV',
      '220kv': 'Doppelsystem 220kV',
    };
    
    const templateName = templateMap[templateValue];
    const standardTemplate = STANDARD_TEMPLATES.find(t => t.name === templateName);
    
    if (standardTemplate) {
      const fullTemplate = createMastLayoutTemplate(standardTemplate);
      setTemplate(fullTemplate);
    }
  };
  
  const handleSave = () => {
    const fullTemplate = createMastLayoutTemplate(template);
    const validationErrors = validateMastLayoutTemplate(fullTemplate);
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    onSave(fullTemplate);
    onClose();
  };
  
  const updateEbeneConfig = (ebeneIndex: number, updates: Partial<EbeneConfig>) => {
    setTemplate(prev => {
      const newEbenenConfig = [...(prev.ebenenConfig || [])];
      newEbenenConfig[ebeneIndex] = {
        ...newEbenenConfig[ebeneIndex],
        ...updates,
      };
      return {
        ...prev,
        ebenenConfig: newEbenenConfig,
      };
    });
  };
  
  
  const renderVisualization = () => {
    const { anzahlEbenen = 1, ebenenConfig = [] } = template;
    const svgHeight = 400;
    const svgWidth = 450;
    const mastX = svgWidth / 2;
    const groundY = svgHeight - 30;
    const mastTopY = 30;
    const mastHeight = groundY - mastTopY;
    
    return (
      <svg width={svgWidth} height={svgHeight} className="border rounded">
        {/* Ground line */}
        <line x1={0} y1={groundY} x2={svgWidth} y2={groundY} stroke="#8B4513" strokeWidth={2} />
        
        {/* Mast */}
        <line x1={mastX} y1={groundY} x2={mastX} y2={mastTopY} stroke="#333" strokeWidth={4} />
        
        {/* Ebenen (levels) */}
        {ebenenConfig.map((ebene, index) => {
          const y = groundY - ((index + 1) / (anzahlEbenen + 1)) * mastHeight;
          const leftCount = ebene.anzahlLeitungenLinks || 0;
          const rightCount = ebene.anzahlLeitungenRechts || 0;
          
          return (
            <g key={index}>
              {/* Level line */}
              <line 
                x1={mastX - 60} 
                y1={y} 
                x2={mastX + 60} 
                y2={y} 
                stroke="#666" 
                strokeWidth={2}
              />
              
              {/* Left conductors */}
              {Array.from({length: leftCount}, (_, lIndex) => {
                const x = mastX - 20 - (lIndex * 15);
                return (
                  <circle 
                    key={`left-${lIndex}`}
                    cx={x} 
                    cy={y} 
                    r={4} 
                    fill="#FF0000"
                  />
                );
              })}
              
              {/* Right conductors */}
              {Array.from({length: rightCount}, (_, rIndex) => {
                const x = mastX + 20 + (rIndex * 15);
                return (
                  <circle 
                    key={`right-${rIndex}`}
                    cx={x} 
                    cy={y} 
                    r={4} 
                    fill="#0000FF"
                  />
                );
              })}
              
              {/* Level label with conductor count */}
              <text 
                x={mastX + 70} 
                y={y + 5} 
                fontSize={12} 
                fill="#333"
              >
                E{ebene.nummerEbene}: {leftCount}L/{rightCount}R
              </text>
            </g>
          );
        })}
        
        {/* Labels */}
        <text x={mastX - 50} y={20} fontSize={14} fill="#333">Links</text>
        <text x={mastX + 20} y={20} fontSize={14} fill="#333">Rechts</text>
      </svg>
    );
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal={true}>
      <DialogContent className="!max-w-[90vw] !w-[90vw] !max-h-[90vh] overflow-y-auto" style={{ width: '90vw', maxWidth: '90vw', height: '85vh' }} onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>
            {existingTemplate ? 'Mast-Layout bearbeiten' : 'Neues Mast-Layout erstellen'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left side - Form */}
          <div className="flex-1 space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="general">Allgemein</TabsTrigger>
                <TabsTrigger value="details">Ebenen-Details</TabsTrigger>
              </TabsList>
              
              <TabsContent value="general" className="space-y-4">
                {/* Standard templates */}
                {!existingTemplate && (
                  <div className="space-y-2">
                    <Label htmlFor="template-select">Vorlage verwenden</Label>
                    <div className="flex gap-2">
                      <select 
                        id="template-select"
                        className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={selectedStandardTemplate} 
                        onChange={(e) => {
                          console.log('Select changed to:', e.target.value);
                          handleStandardTemplateSelect(e.target.value);
                        }}
                      >
                        <option value="none">Keine Vorlage</option>
                        <option value="simple">Einfacher Einzelmast</option>
                        <option value="380kv">Standard 380kV</option>
                        <option value="110kv">Kompakt 110kV</option>
                        <option value="220kv">Doppelsystem 220kV</option>
                      </select>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          console.log('Test button clicked!');
                          alert('Button works!');
                        }}
                      >
                        Test
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={template.name || ''}
                    onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                    placeholder="z.B. Standard 380kV"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Beschreibung</Label>
                  <Input
                    id="description"
                    value={template.description || ''}
                    onChange={(e) => setTemplate({ ...template, description: e.target.value })}
                    placeholder="Optionale Beschreibung..."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="anzahlEbenen">Anzahl Ebenen *</Label>
                  <Input
                    id="anzahlEbenen"
                    type="number"
                    min={1}
                    max={10}
                    value={template.anzahlEbenen || 1}
                    onChange={(e) => {
                      const newValue = parseInt(e.target.value) || 1;
                      handleAnzahlEbenenChange(newValue);
                    }}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="details" className="space-y-4">
                {template.ebenenConfig?.map((ebene, ebeneIndex) => (
                  <div key={ebeneIndex} className="border rounded p-3 space-y-3">
                    <div className="font-medium">Ebene {ebene.nummerEbene}</div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Leiter Links</Label>
                        <Input
                          type="number"
                          min={0}
                          max={10}
                          value={ebene.anzahlLeitungenLinks || 0}
                          onChange={(e) => {
                            const newCount = parseInt(e.target.value) || 0;
                            updateEbeneConfig(ebeneIndex, {
                              anzahlLeitungenLinks: newCount,
                            });
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Leiter Rechts</Label>
                        <Input
                          type="number"
                          min={0}
                          max={10}
                          value={ebene.anzahlLeitungenRechts || 0}
                          onChange={(e) => {
                            const newCount = parseInt(e.target.value) || 0;
                            updateEbeneConfig(ebeneIndex, {
                              anzahlLeitungenRechts: newCount,
                            });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
            
            {/* Errors */}
            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded p-3 space-y-1">
                <div className="flex items-center gap-2 text-red-600 font-medium">
                  <AlertCircle className="h-4 w-4" />
                  Validierungsfehler
                </div>
                {errors.map((error, index) => (
                  <div key={index} className="text-sm text-red-600">
                    • {error}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Right side - Visualization */}
          <div className="flex-1 space-y-4">
            <div className="font-medium">Vorschau</div>
            <div className="overflow-auto p-2">
              <div className="inline-block min-w-fit">
                {renderVisualization()}
              </div>
            </div>
            
            <div className="bg-gray-50 rounded p-3 space-y-2 text-sm">
              <div className="font-medium">Zusammenfassung</div>
              <div>• {template.anzahlEbenen || 1} Ebene(n)</div>
              {template.ebenenConfig?.map((ebene, idx) => (
                <div key={idx}>
                  • Ebene {ebene.nummerEbene}: {ebene.anzahlLeitungenLinks || 0}L/{ebene.anzahlLeitungenRechts || 0}R
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Actions */}
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