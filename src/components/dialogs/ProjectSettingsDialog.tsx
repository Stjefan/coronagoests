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
import { Checkbox } from '../ui/checkbox';
import { useProjectStore } from '../../store/projectStore';
import { Info, FileText } from 'lucide-react';

interface ProjectSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectSettingsDialog: React.FC<ProjectSettingsDialogProps> = ({
  isOpen,
  onClose
}) => {
  const { projectName, mitFrequenz, kt, setProjectName, setMitFrequenz, setKt, clearImmissionGrid } = useProjectStore();
  
  const [localProjectName, setLocalProjectName] = useState(projectName);
  const [localMitFrequenz, setLocalMitFrequenz] = useState(mitFrequenz);
  const [localKt, setLocalKt] = useState(kt);
  
  // Sync with store when dialog opens
  useEffect(() => {
    if (isOpen) {
      setLocalProjectName(projectName);
      setLocalMitFrequenz(mitFrequenz);
      setLocalKt(kt);
    }
  }, [isOpen, projectName, mitFrequenz, kt]);
  
  const handleSave = () => {
    // Check if computation settings changed
    const computationSettingsChanged = localMitFrequenz !== mitFrequenz || localKt !== kt;
    
    setProjectName(localProjectName);
    setMitFrequenz(localMitFrequenz);
    setKt(localKt);
    
    // Clear immission grid if computation settings changed
    if (computationSettingsChanged) {
      console.log('Clearing immission grid due to computation settings change');
      clearImmissionGrid();
    }
    
    onClose();
  };
  
  const handleCancel = () => {
    // Reset to original values
    setLocalProjectName(projectName);
    setLocalMitFrequenz(mitFrequenz);
    setLocalKt(kt);
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Projekteinstellungen</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="projectName" className="text-sm font-medium">
              Projektname
            </Label>
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-gray-500" />
              <Input
                id="projectName"
                type="text"
                value={localProjectName}
                onChange={(e) => setLocalProjectName(e.target.value)}
                placeholder="Projektname eingeben..."
                className="flex-1"
              />
            </div>
          </div>
          
          <div className="border-t pt-4" />
          
          {/* Frequency-dependent computation */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="mitFrequenz"
                checked={localMitFrequenz}
                onCheckedChange={(checked) => setLocalMitFrequenz(checked as boolean)}
              />
              <Label htmlFor="mitFrequenz" className="text-sm font-medium">
                Frequenzabhängige Berechnung
              </Label>
            </div>
            <div className="flex items-start space-x-2 text-sm text-gray-600 ml-6">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                Aktiviert die frequenzabhängige Berechnung der Schallimmissionen
              </span>
            </div>
          </div>
          
          {/* Kt parameter */}
          <div className="space-y-2">
            <Label htmlFor="kt" className="text-sm font-medium">
              Kt - Ton- und Informationshaltigkeit
            </Label>
            <div className="flex items-center space-x-2">
              <Input
                id="kt"
                type="number"
                value={localKt}
                onChange={(e) => setLocalKt(parseFloat(e.target.value) || 0)}
                step="0.1"
                className="w-32"
              />
              <span className="text-sm text-gray-600">dB</span>
            </div>
            <div className="flex items-start space-x-2 text-sm text-gray-600">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                Zuschlag für Ton- und Informationshaltigkeit nach TA Lärm. 
                Typische Werte: 0 dB (keine Auffälligkeit), 3-6 dB (deutliche Ton- oder Informationshaltigkeit)
              </span>
            </div>
          </div>
          
          {/* Additional information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Hinweis:</p>
                <p>
                  Änderungen an diesen Einstellungen führen dazu, dass alle zwischengespeicherten 
                  Berechnungsergebnisse gelöscht werden und eine Neuberechnung erforderlich ist.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={handleCancel}>
            Abbrechen
          </Button>
          <Button onClick={handleSave}>
            Speichern
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};