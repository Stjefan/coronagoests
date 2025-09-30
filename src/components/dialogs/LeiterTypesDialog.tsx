import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Plus, Trash2, Edit, Zap } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { LeiterTypeEditDialog } from './LeiterTypeEditDialog';
import type { HLeitertypData } from '../../types/usedData';

interface LeiterTypesDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LeiterTypeWithKey extends HLeitertypData {
  key: string;
}

export const LeiterTypesDialog: React.FC<LeiterTypesDialogProps> = ({
  isOpen,
  onClose
}) => {
  const { leiterTypes, addLeiterType, updateLeiterType, deleteLeiterType } = useProjectStore();
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingLeiterType, setEditingLeiterType] = useState<(HLeitertypData & { originalName?: string }) | undefined>();
  const [leiterTypesList, setLeiterTypesList] = useState<LeiterTypeWithKey[]>([]);
  
  useEffect(() => {
    if (isOpen) {
      const types: LeiterTypeWithKey[] = [];
      leiterTypes.forEach((value, key) => {
        types.push({
          key,
          Name: value.Name,
          SchallLW: value.SchallLW,
        });
      });
      setLeiterTypesList(types);
    }
  }, [isOpen, leiterTypes]);
  
  const handleAddClick = () => {
    setEditingLeiterType(undefined);
    setEditDialogOpen(true);
  };
  
  const handleEditClick = (leiterType: LeiterTypeWithKey) => {
    setEditingLeiterType({
      Name: leiterType.Name,
      SchallLW: leiterType.SchallLW,
      originalName: leiterType.key,
    });
    setEditDialogOpen(true);
  };
  
  const handleDeleteClick = async (key: string, name: string) => {
    const confirmed = confirm(`Leitertyp "${name}" wirklich löschen?`);
    if (confirmed) {
      deleteLeiterType(key);
      
      const types: LeiterTypeWithKey[] = [];
      const updatedTypes = useProjectStore.getState().leiterTypes;
      updatedTypes.forEach((value, key) => {
        types.push({
          key,
          Name: value.Name,
          SchallLW: value.SchallLW,
        });
      });
      setLeiterTypesList(types);
    }
  };
  
  const handleSaveLeiterType = (leiterType: HLeitertypData, originalName?: string) => {
    if (originalName) {
      updateLeiterType(originalName, leiterType);
    } else {
      addLeiterType(leiterType);
    }
    
    const types: LeiterTypeWithKey[] = [];
    const updatedTypes = useProjectStore.getState().leiterTypes;
    updatedTypes.forEach((value, key) => {
      types.push({
        key,
        Name: value.Name,
        SchallLW: value.SchallLW,
      });
    });
    setLeiterTypesList(types);
  };
  
  const existingNames = leiterTypesList.map(lt => lt.Name);
  
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Leitertypen verwalten
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Verwalten Sie die verfügbaren Leitertypen für Ihr Projekt.
              </p>
              <Button
                onClick={handleAddClick}
                size="sm"
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Neuer Typ
              </Button>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {leiterTypesList.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Zap className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-medium">Keine Leitertypen vorhanden</p>
                  <p className="text-xs mt-1">Klicken Sie auf "Neuer Typ" um zu beginnen</p>
                </div>
              ) : (
                leiterTypesList.map((leiterType) => (
                  <div
                    key={leiterType.key}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">{leiterType.Name}</div>
                      <div className="text-xs text-gray-500">
                        SchallLW: {leiterType.SchallLW} dB
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(leiterType)}
                        className="h-8 w-8 p-0"
                        title="Bearbeiten"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(leiterType.key, leiterType.Name)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Löschen"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {leiterTypesList.length > 0 && (
              <div className="pt-3 border-t text-xs text-gray-600 flex justify-between">
                <span>{leiterTypesList.length} Leitertyp(en) insgesamt</span>
                <span className="text-gray-400">
                  Änderungen werden sofort gespeichert
                </span>
              </div>
            )}
            
            <div className="flex justify-end pt-3 border-t">
              <Button variant="outline" onClick={onClose}>
                Schließen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <LeiterTypeEditDialog
        isOpen={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSave={handleSaveLeiterType}
        leiterType={editingLeiterType}
        existingNames={existingNames}
      />
    </>
  );
};