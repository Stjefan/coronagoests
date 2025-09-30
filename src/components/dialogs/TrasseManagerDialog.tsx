import React, { useState, useEffect } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { useProjectStore } from '../../store/projectStore';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Plus, Trash2, Edit, Route, Layout, AlertCircle, Play, Zap } from 'lucide-react';
import { useDialog } from '../../hooks/useDialog';
import { MastLayoutDialog } from './MastLayoutDialog';
import { LeiterTypesDialog } from './LeiterTypesDialog';
import { type MastLayoutTemplate } from '../../types/mastLayout';
import { type Pole } from '../../types/trasseUINew'
import { uiToComputation } from '../../utils/trasseTransformNew';

interface TrasseManagerDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TrasseManagerDialog: React.FC<TrasseManagerDialogProps> = ({
  isOpen,
  onClose
}) => {
  const {
    trassenNew,
    poles,
    connectionLines,
    mastLayoutTemplates,
    leiterTypes,
    addTrasseNew,
    updateTrasseNew,
    deleteTrasseNew,
    addMastLayoutTemplate,
    updateMastLayoutTemplate,
    deleteMastLayoutTemplate,
    loadStandardTemplates,
  } = useProjectStore();
  
  console.log('TrasseManagerDialog - trassenNew from store:', trassenNew);
  console.log('TrasseManagerDialog - trassenNew size:', trassenNew.size);
  console.log("Templates", mastLayoutTemplates);
  
  const { prompt, confirm } = useDialog();
  const [newTrasseName, setNewTrasseName] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [isLayoutDialogOpen, setIsLayoutDialogOpen] = useState(false);
  const [isLeiterTypesDialogOpen, setIsLeiterTypesDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MastLayoutTemplate | undefined>();
  
  // Load standard templates if none exist when dialog opens
  useEffect(() => {
    if (isOpen && mastLayoutTemplates.size === 0) {
      console.log('Loading standard templates...');
      loadStandardTemplates();
    }
  }, [isOpen]); // Remove dependencies that might prevent loading
  
  const handleAddTrasse = () => {
    console.log('handleAddTrasse called');
    console.log('newTrasseName:', newTrasseName);
    console.log('selectedTemplateId:', selectedTemplateId);
    if (newTrasseName.trim() && selectedTemplateId) {
      console.log('Calling addTrasseNew...');
      const trasseId = addTrasseNew(newTrasseName, selectedTemplateId);
      console.log('addTrasseNew returned trasseId:', trasseId);
      if (trasseId) {
        setNewTrasseName('');
        setSelectedTemplateId('');
        console.log('Trasse created successfully');
      } else {
        // Show error message if trasse creation failed
        console.error('Failed to create Trasse - template required');
      }
    } else {
      console.log('Cannot add trasse - missing name or templateId');
    }
  };
  
  const handleEditTrasse = async (id: string, currentName: string) => {
    const newName = await prompt('Trassen-Name bearbeiten:', currentName);
    if (newName && newName !== currentName) {
      updateTrasseNew(id, { name: newName });
    }
  };
  
  const handleDeleteTrasse = async (id: string, name: string) => {
    const confirmed = await confirm(`Trasse "${name}" wirklich löschen?`);
    if (confirmed) {
      deleteTrasseNew(id);
    }
  };
  
  const handleSaveLayoutTemplate = (template: MastLayoutTemplate) => {
    if (editingTemplate) {
      updateMastLayoutTemplate(editingTemplate.id, template);
    } else {
      addMastLayoutTemplate(template);
    }
    setEditingTemplate(undefined);
  };
  
  const handleEditTemplate = (template: MastLayoutTemplate) => {
    setEditingTemplate(template);
    setIsLayoutDialogOpen(true);
  };
  
  const handleDeleteTemplate = async (id: string, name: string) => {
    const confirmed = await confirm(`Vorlage "${name}" wirklich löschen?`);
    if (confirmed) {
      deleteMastLayoutTemplate(id);
    }
  };
  
  const handleRunTrasseUIToUsedTrasse = (trasseId: string) => {
    const trasse = trassenNew.get(trasseId);
    if (!trasse) {
      console.error('Trasse not found:', trasseId);
      return;
    }
    
    
    // Collect poles for this trasse
    const trassePoles = new Map<string, Pole>();
    trasse.poleIds.forEach(poleId => {
      const pole = poles.get(poleId);
      if (pole) {
        trassePoles.set(poleId, pole);
      }
    });
    
    // Collect connection lines for this trasse
    const trasseConnectionLines = Array.from(connectionLines.values()).filter(
      line => line.trasseId === trasseId
    );
    
    // Convert to computation format
    const usedTrasse = uiToComputation(
      trasse,
      trassePoles,
      trasseConnectionLines,
      Array.from(leiterTypes.values())
    );
    
    // Log results
    console.log('=== New UI to UsedTrasse Conversion ===');
    console.log('Input TrasseNew:', trasse);
    console.log('Input Poles:', trassePoles);
    console.log('Input ConnectionLines:', trasseConnectionLines);
    console.log('Output UsedTrasse:', usedTrasse);
    
    // Check first conductor for details
    if (usedTrasse.UsedMasten.length > 0) {
      const firstMast = usedTrasse.UsedMasten[0];
      if (firstMast.UsedEbenen.length > 0) {
        const firstEbene = firstMast.UsedEbenen[0];
        if (firstEbene.UsedLeitungenLinks && firstEbene.UsedLeitungenLinks.length > 0) {
          const firstLeiter = firstEbene.UsedLeitungenLinks[0];
          console.log('First conductor details:');
          console.log('  - SchallLw:', firstLeiter.SchallLw);
          console.log('  - SchallLwDB:', firstLeiter.SchallLwDB);
          console.log('  - Durchhang:', firstLeiter.Durchhang);
        }
      }
    }
    
    alert(`Conversion completed for Trasse "${trasse.name}". Check the console for details.`);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Trassen verwalten</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4 space-y-4">
          {/* LeiterTypes management section */}
          <div className="p-3 bg-green-50 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Leitertypen (Schallpegel)</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsLeiterTypesDialogOpen(true)}
              >
                <Zap className="h-4 w-4 mr-2" />
                Leitertypen verwalten
              </Button>
            </div>
            <div className="text-xs text-gray-600">
              {leiterTypes.size} Leitertyp(en) definiert
            </div>
          </div>
          
          {/* Template management section */}
          <div className="p-3 bg-blue-50 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Mast-Layout-Vorlagen</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingTemplate(undefined);
                  setIsLayoutDialogOpen(true);
                }}
              >
                <Layout className="h-4 w-4 mr-2" />
                Neue Vorlage
              </Button>
            </div>
            
            {mastLayoutTemplates && mastLayoutTemplates.size > 0 ? (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {Array.from(mastLayoutTemplates.entries()).map(([id, template]) => (
                  <div
                    key={id}
                    className="flex items-center justify-between px-2 py-1 bg-white rounded text-xs"
                  >
                    <span>{template.name}</span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditTemplate(template)}
                        className="h-6 w-6 p-0"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTemplate(id, template.name)}
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-3 bg-gray-50 rounded text-xs text-gray-500">
                <p>Keine Vorlagen vorhanden</p>
                <Button
                  variant="link"
                  size="sm"
                  onClick={loadStandardTemplates}
                  className="mt-1"
                >
                  Standard-Vorlagen laden
                </Button>
              </div>
            )}
          </div>
          
          {/* Add new Trasse */}
          <div className="space-y-2">
            <Label className="text-sm">Neue Trasse hinzufügen</Label>
            {!selectedTemplateId && newTrasseName.trim() && (
              <div className="text-xs text-amber-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Bitte wählen Sie eine Vorlage aus
              </div>
            )}
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Trassen-Name..."
                value={newTrasseName}
                onChange={(e) => setNewTrasseName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && newTrasseName.trim() && selectedTemplateId) {
                    handleAddTrasse();
                  }
                }}
                className="flex-1"
              />
              {mastLayoutTemplates && mastLayoutTemplates.size > 0 ? (
                <select
                  value={selectedTemplateId || ""}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-[180px] h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Vorlage wählen (erforderlich)</option>
                  {Array.from(mastLayoutTemplates.entries()).map(([id, template]) => (
                    <option key={id} value={id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadStandardTemplates}
                  className="w-[180px]"
                >
                  Vorlagen laden
                </Button>
              )}
              <Button
                onClick={handleAddTrasse}
                disabled={!newTrasseName.trim() || !selectedTemplateId}
                size="sm"
                title={!selectedTemplateId ? "Bitte wählen Sie eine Vorlage" : ""}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* List of Trassen */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {trassenNew.size === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Route className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Keine Trassen vorhanden</p>
                <p className="text-xs mt-1">Fügen Sie eine neue Trasse hinzu</p>
              </div>
            ) : (
              Array.from(trassenNew.entries()).map(([id, trasse]) => (
                <div
                  key={id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm">{trasse.name}</div>
                    <div className="text-xs text-gray-500">
                      {trasse.poleIds.length} Mast(e)
                      {trasse.templateId && mastLayoutTemplates?.get(trasse.templateId) && (
                        <span className="ml-2 text-blue-600" title="Basiert auf Vorlage (Kopie)">
                          ⚡ {mastLayoutTemplates.get(trasse.templateId)!.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRunTrasseUIToUsedTrasse(id)}
                      className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                      title="Run trasseUIToUsedTrasse conversion"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditTrasse(id, trasse.name)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTrasse(id, trasse.name)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {trassenNew.size > 0 && (
            <div className="pt-3 border-t text-xs text-gray-600">
              {trassenNew.size} Trasse(n) insgesamt
            </div>
          )}
        </div>
      </DialogContent>
      
      {/* Mast Layout Dialog */}
      <MastLayoutDialog
        isOpen={isLayoutDialogOpen}
        onClose={() => {
          setIsLayoutDialogOpen(false);
          setEditingTemplate(undefined);
        }}
        onSave={handleSaveLayoutTemplate}
        existingTemplate={editingTemplate}
        existingTemplates={mastLayoutTemplates}
      />
      
      {/* LeiterTypes Dialog */}
      <LeiterTypesDialog
        isOpen={isLeiterTypesDialogOpen}
        onClose={() => setIsLeiterTypesDialogOpen(false)}
      />
    </Dialog>
  );
};