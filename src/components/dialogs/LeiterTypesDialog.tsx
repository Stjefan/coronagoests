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
import { Plus, Trash2, Edit, Save, X, Zap } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import type { HLeitertypData } from '../../types/usedData';

interface LeiterTypesDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface EditableLeiterType extends HLeitertypData {
  id: string;
  isEditing?: boolean;
  tempName?: string;
  tempSchallLW?: number;
}

export const LeiterTypesDialog: React.FC<LeiterTypesDialogProps> = ({
  isOpen,
  onClose
}) => {
  const { leiterTypes } = useProjectStore();
  
  const [localLeiterTypes, setLocalLeiterTypes] = useState<EditableLeiterType[]>([]);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeSchallLW, setNewTypeSchallLW] = useState<number>(55);
  
  // Sync with store when dialog opens
  useEffect(() => {
    if (isOpen) {
      const types: EditableLeiterType[] = [];
      leiterTypes.forEach((value, key) => {
        types.push({
          id: key,
          Name: value.Name,
          SchallLW: value.SchallLW,
          isEditing: false,
        });
      });
      setLocalLeiterTypes(types);
      setNewTypeName('');
      setNewTypeSchallLW(55);
    }
  }, [isOpen, leiterTypes]);
  
  const handleAddLeiterType = () => {
    if (newTypeName.trim()) {
      const newType: EditableLeiterType = {
        id: newTypeName.trim(),
        Name: newTypeName.trim(),
        SchallLW: newTypeSchallLW,
        isEditing: false,
      };
      
      // Check for duplicates
      if (localLeiterTypes.some(lt => lt.Name === newType.Name)) {
        alert(`Ein Leitertyp mit dem Namen "${newType.Name}" existiert bereits.`);
        return;
      }
      
      setLocalLeiterTypes([...localLeiterTypes, newType]);
      setNewTypeName('');
      setNewTypeSchallLW(55);
    }
  };
  
  const handleEditLeiterType = (id: string) => {
    setLocalLeiterTypes(localLeiterTypes.map(lt => {
      if (lt.id === id) {
        return {
          ...lt,
          isEditing: true,
          tempName: lt.Name,
          tempSchallLW: lt.SchallLW,
        };
      }
      return { ...lt, isEditing: false };
    }));
  };
  
  const handleSaveEdit = (id: string) => {
    setLocalLeiterTypes(localLeiterTypes.map(lt => {
      if (lt.id === id && lt.tempName) {
        return {
          ...lt,
          id: lt.tempName.trim(),
          Name: lt.tempName.trim(),
          SchallLW: lt.tempSchallLW || lt.SchallLW,
          isEditing: false,
          tempName: undefined,
          tempSchallLW: undefined,
        };
      }
      return lt;
    }));
  };
  
  const handleCancelEdit = (id: string) => {
    setLocalLeiterTypes(localLeiterTypes.map(lt => {
      if (lt.id === id) {
        return {
          ...lt,
          isEditing: false,
          tempName: undefined,
          tempSchallLW: undefined,
        };
      }
      return lt;
    }));
  };
  
  const handleDeleteLeiterType = async (id: string, name: string) => {
    const confirmed = await confirm(`Leitertyp "${name}" wirklich löschen?`);
    if (confirmed) {
      setLocalLeiterTypes(localLeiterTypes.filter(lt => lt.id !== id));
    }
  };
  
  const handleSaveChanges = () => {
    // Update the store with the new leiterTypes
    const store = useProjectStore.getState();
    
    // Get current leiterTypes to detect changes
    const currentTypes = new Map<string, HLeitertypData>();
    store.leiterTypes.forEach((value, key) => {
      currentTypes.set(key, value);
    });
    
    // Find types to delete (in current but not in local)
    currentTypes.forEach((_, key) => {
      if (!localLeiterTypes.some(lt => lt.Name === key)) {
        store.deleteLeiterType(key);
      }
    });
    
    // Add or update all local types
    localLeiterTypes.forEach(lt => {
      const existing = currentTypes.get(lt.Name);
      if (!existing) {
        // Add new type
        store.addLeiterType({
          Name: lt.Name,
          SchallLW: lt.SchallLW,
        });
      } else if (existing.SchallLW !== lt.SchallLW) {
        // Update existing type if SchallLW changed
        store.updateLeiterType(lt.Name, {
          Name: lt.Name,
          SchallLW: lt.SchallLW,
        });
      }
    });
    
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Leitertypen verwalten
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Add new LeiterType */}
          <div className="p-3 bg-blue-50 rounded-lg space-y-2">
            <Label className="text-sm font-medium">Neuen Leitertyp hinzufügen</Label>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Name (z.B. L1)"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && newTypeName.trim()) {
                    handleAddLeiterType();
                  }
                }}
                className="flex-1"
              />
              <Input
                type="number"
                placeholder="SchallLW (dB)"
                value={newTypeSchallLW}
                onChange={(e) => setNewTypeSchallLW(parseFloat(e.target.value) || 0)}
                min={0}
                max={200}
                step={0.1}
                className="w-32"
              />
              <Button
                onClick={handleAddLeiterType}
                disabled={!newTypeName.trim()}
                size="sm"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* List of LeiterTypes */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {localLeiterTypes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Zap className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Keine Leitertypen vorhanden</p>
                <p className="text-xs mt-1">Fügen Sie einen neuen Leitertyp hinzu</p>
              </div>
            ) : (
              localLeiterTypes.map((leiterType) => (
                <div
                  key={leiterType.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {leiterType.isEditing ? (
                    <>
                      <div className="flex gap-2 flex-1">
                        <Input
                          type="text"
                          value={leiterType.tempName || ''}
                          onChange={(e) => {
                            setLocalLeiterTypes(localLeiterTypes.map(lt => 
                              lt.id === leiterType.id 
                                ? { ...lt, tempName: e.target.value }
                                : lt
                            ));
                          }}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          value={leiterType.tempSchallLW}
                          onChange={(e) => {
                            setLocalLeiterTypes(localLeiterTypes.map(lt => 
                              lt.id === leiterType.id 
                                ? { ...lt, tempSchallLW: parseFloat(e.target.value) || 0 }
                                : lt
                            ));
                          }}
                          min={0}
                          max={200}
                          step={0.1}
                          className="w-32"
                        />
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSaveEdit(leiterType.id)}
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelEdit(leiterType.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{leiterType.Name}</div>
                        <div className="text-xs text-gray-500">
                          SchallLW: {leiterType.SchallLW} dB
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditLeiterType(leiterType.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteLeiterType(leiterType.id, leiterType.Name)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
          
          {localLeiterTypes.length > 0 && (
            <div className="pt-3 border-t text-xs text-gray-600">
              {localLeiterTypes.length} Leitertyp(en) insgesamt
            </div>
          )}
          
          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button onClick={handleSaveChanges}>
              Änderungen speichern
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};