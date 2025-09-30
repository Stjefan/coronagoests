import React from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { ImmissionGridControls } from '../ImmissionGridControls';
import { HelmertTransform } from '../../utils/helmertTransform';

interface ImmissionGridDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mapWidth: number;
  mapHeight: number;
  transform: HelmertTransform | null;
}

export const ImmissionGridDialog: React.FC<ImmissionGridDialogProps> = ({
  isOpen,
  onClose,
  mapWidth,
  mapHeight,
  transform
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Immissionsgitter Einstellungen</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <ImmissionGridControls 
            mapWidth={mapWidth}
            mapHeight={mapHeight}
            transform={transform}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};