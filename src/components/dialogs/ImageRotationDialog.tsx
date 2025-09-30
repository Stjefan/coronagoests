import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { RotateCw, RotateCcw, Check, X } from 'lucide-react';

interface ImageRotationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (rotation: number) => void;
  imageUrl: string;
  originalWidth: number;
  originalHeight: number;
}

export const ImageRotationDialog: React.FC<ImageRotationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  imageUrl,
  originalWidth,
  originalHeight
}) => {
  const [currentRotation, setCurrentRotation] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewDimensions, setPreviewDimensions] = useState({
    width: originalWidth,
    height: originalHeight
  });

  const rotateImage = useCallback((imageUrl: string, degrees: number): Promise<{ rotatedUrl: string; width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Calculate new dimensions based on rotation
        const rad = (degrees * Math.PI) / 180;
        const sin = Math.abs(Math.sin(rad));
        const cos = Math.abs(Math.cos(rad));
        
        const newWidth = img.width * cos + img.height * sin;
        const newHeight = img.width * sin + img.height * cos;
        
        canvas.width = newWidth;
        canvas.height = newHeight;
        
        // Move to center and rotate
        ctx.translate(newWidth / 2, newHeight / 2);
        ctx.rotate(rad);
        
        // Draw image centered
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        
        const rotatedUrl = canvas.toDataURL('image/png');
        resolve({ rotatedUrl, width: Math.round(newWidth), height: Math.round(newHeight) });
      };
      img.onerror = () => reject(new Error('Failed to load image for rotation'));
      img.src = imageUrl;
    });
  }, []);

  const updatePreview = useCallback(async (rotation: number) => {
    try {
      if (rotation === 0) {
        setPreviewUrl(imageUrl);
        setPreviewDimensions({ width: originalWidth, height: originalHeight });
      } else {
        const result = await rotateImage(imageUrl, rotation);
        setPreviewUrl(result.rotatedUrl);
        setPreviewDimensions({ width: result.width, height: result.height });
      }
    } catch (error) {
      console.error('Error generating preview:', error);
    }
  }, [imageUrl, originalWidth, originalHeight, rotateImage]);

  const handleRotateClockwise = () => {
    const newRotation = (currentRotation + 90) % 360;
    setCurrentRotation(newRotation);
    updatePreview(newRotation);
  };

  const handleRotateCounterclockwise = () => {
    const newRotation = (currentRotation - 90 + 360) % 360;
    setCurrentRotation(newRotation);
    updatePreview(newRotation);
  };

  const handleConfirm = () => {
    onConfirm(currentRotation);
  };

  const handleCancel = () => {
    setCurrentRotation(0);
    setPreviewUrl(null);
    onClose();
  };

  // Initialize preview when dialog opens
  React.useEffect(() => {
    if (isOpen && !previewUrl) {
      setPreviewUrl(imageUrl);
      setPreviewDimensions({ width: originalWidth, height: originalHeight });
    }
  }, [isOpen, imageUrl, originalWidth, originalHeight, previewUrl]);

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Lageplan-Bild drehen</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col space-y-4">
          {/* Rotation Controls */}
          <div className="flex items-center justify-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <Button
              onClick={handleRotateCounterclockwise}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <RotateCcw className="h-4 w-4" />
              <span>90° links</span>
            </Button>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-700">
                Aktuell: {currentRotation}°
              </div>
              <div className="text-sm text-gray-500">
                {previewDimensions.width} × {previewDimensions.height} px
              </div>
            </div>
            
            <Button
              onClick={handleRotateClockwise}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <RotateCw className="h-4 w-4" />
              <span>90° rechts</span>
            </Button>
          </div>

          {/* Image Preview */}
          <div className="flex justify-center items-center bg-gray-100 rounded-lg p-4 min-h-[300px] max-h-[500px] overflow-auto">
            {previewUrl ? (
              <img 
                src={previewUrl} 
                alt="Rotation Preview"
                className="max-w-full max-h-full object-contain border border-gray-300 rounded"
                style={{
                  maxWidth: '100%',
                  maxHeight: '400px'
                }}
              />
            ) : (
              <div className="text-gray-500">Lade Vorschau...</div>
            )}
          </div>

          {/* Info */}
          <div className="text-sm text-gray-600 text-center">
            <p>Verwenden Sie die Schaltflächen, um das Bild in 90°-Schritten zu drehen.</p>
            <p>Die Vorschau zeigt, wie das Bild nach der Rotation aussehen wird.</p>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button 
            onClick={handleCancel}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <X className="h-4 w-4" />
            <span>Abbrechen</span>
          </Button>
          <Button 
            onClick={handleConfirm}
            className="flex items-center space-x-2"
          >
            <Check className="h-4 w-4" />
            <span>Übernehmen</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};