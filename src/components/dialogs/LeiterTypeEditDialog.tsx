import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Zap } from 'lucide-react';
import type { HLeitertypData } from '../../types/usedData';

interface LeiterTypeEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (leiterType: HLeitertypData, originalName?: string) => void;
  leiterType?: HLeitertypData & { originalName?: string };
  existingNames: string[];
}

export const LeiterTypeEditDialog: React.FC<LeiterTypeEditDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  leiterType,
  existingNames,
}) => {
  const [name, setName] = useState('');
  const [schallLW, setSchallLW] = useState(55);
  const [errors, setErrors] = useState<{ name?: string }>({});
  
  useEffect(() => {
    if (isOpen) {
      if (leiterType) {
        setName(leiterType.Name);
        setSchallLW(leiterType.SchallLW);
      } else {
        setName('');
        setSchallLW(55);
      }
      setErrors({});
    }
  }, [isOpen, leiterType]);
  
  const validate = (): boolean => {
    const newErrors: { name?: string } = {};
    
    if (!name.trim()) {
      newErrors.name = 'Name ist erforderlich';
    } else if (
      existingNames.includes(name.trim()) && 
      (!leiterType || leiterType.originalName !== name.trim())
    ) {
      newErrors.name = `Ein Leitertyp mit dem Namen "${name.trim()}" existiert bereits`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSave = () => {
    if (validate()) {
      onSave(
        {
          Name: name.trim(),
          SchallLW: schallLW,
        },
        leiterType?.originalName
      );
      onClose();
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            {leiterType ? 'Leitertyp bearbeiten' : 'Neuer Leitertyp'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="z.B. L1"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) {
                  setErrors({ ...errors, name: undefined });
                }
              }}
              onKeyPress={handleKeyPress}
              className={errors.name ? 'border-red-500' : ''}
              autoFocus
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="schallLW">SchallLW (dB)</Label>
            <Input
              id="schallLW"
              type="number"
              placeholder="55"
              value={schallLW}
              onChange={(e) => setSchallLW(parseFloat(e.target.value) || 0)}
              onKeyPress={handleKeyPress}
              min={0}
              max={200}
              step={0.1}
            />
            <p className="text-xs text-gray-500">
              Schallleistungspegel in Dezibel (0-200 dB)
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Abbrechen
          </Button>
          <Button onClick={handleSave}>
            {leiterType ? 'Speichern' : 'Hinzufügen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};