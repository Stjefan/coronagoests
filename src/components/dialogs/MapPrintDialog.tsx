import React, { useState } from 'react';
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
import { Textarea } from '../ui/textarea';
import { Printer } from 'lucide-react';
import * as htmlToImage from 'html-to-image';

interface MapPrintDialogProps {
  isOpen: boolean;
  onClose: () => void;
  contourInfo?: {
    showImmissionGrid: boolean;
    displayMode: 'total' | 'esq' | 'trassen';
    hasDetailedData: boolean;
  };
}

export const MapPrintDialog: React.FC<MapPrintDialogProps> = ({
  isOpen,
  onClose,
  contourInfo,
}) => {
  const [printHeader, setPrintHeader] = useState('Lageplan Karte');
  const [additionalText, setAdditionalText] = useState('');
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [isProcessing, setIsProcessing] = useState(false);

  // Helper function to get contour display description
  const getContourDescription = (): string => {
    if (!contourInfo || !contourInfo.showImmissionGrid) {
      return '';
    }

    if (!contourInfo.hasDetailedData) {
      return 'Immissions-Konturplot: Gesamt';
    }

    switch (contourInfo.displayMode) {
      case 'esq': 
        return 'Immissions-Konturplot: ESQ-Quellen';
      case 'trassen': 
        return 'Immissions-Konturplot: Übertragungsleitungen';
      case 'total':
      default: 
        return 'Immissions-Konturplot: Gesamt (ESQ + Übertragungsleitungen)';
    }
  };

  const handlePrint = async () => {
    setIsProcessing(true);
    
    try {
      // Get the entire map container (includes legends)
      const mapContainer = document.getElementById('map-container');
      const mapElement = document.querySelector('.leaflet-container') as HTMLElement;
      
      if (!mapElement || !mapContainer) {
        alert('Karte konnte nicht gefunden werden.');
        return;
      }

      // Hide controls temporarily but keep legends
      const controls = mapElement.querySelector('.leaflet-control-container') as HTMLElement;
      if (controls) {
        controls.style.display = 'none';
      }

      // Ensure legends are visible
      // const contourLegend = mapContainer.querySelector('.contour-legend-container') as HTMLElement;
      // const immissionLegend = mapContainer.querySelector('.immission-legend-container') as HTMLElement;
      
      // Capture the entire map container (includes map and legends)
      const dataUrl = await htmlToImage.toPng(mapContainer, {
        quality: 1.0,
        backgroundColor: '#ffffff',
        width: mapContainer.offsetWidth,
        height: mapContainer.offsetHeight,
        filter: (node) => {
          // Include everything except controls and buttons
          if (node.classList && (
            node.classList.contains('print-hide') ||
            node.classList.contains('leaflet-control-zoom') ||
            node.classList.contains('leaflet-control-attribution')
          )) {
            return false;
          }
          // Include legends
          if (node.classList && (
            node.classList.contains('contour-legend-container') ||
            node.classList.contains('immission-legend-container') ||
            node.classList.contains('leaflet-control-legend-d3')
          )) {
            return true;
          }
          return true;
        }
      });

      // Restore controls
      if (controls) {
        controls.style.display = '';
      }

      // Create print window
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Bitte erlauben Sie Pop-ups für diese Website, um zu drucken.');
        return;
      }

      // Build print document
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${printHeader}</title>
          <style>
            @page {
              size: ${orientation};
              margin: 1cm;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
            }
            .print-header {
              text-align: center;
              font-size: 24px;
              font-weight: bold;
              padding: 20px;
              margin-bottom: 20px;
              border-bottom: 2px solid #333;
            }
            .contour-info {
              text-align: center;
              font-size: 14px;
              font-style: italic;
              color: #666;
              margin-bottom: 15px;
              padding: 8px;
              background-color: #f8f9fa;
              border-radius: 4px;
            }
            .additional-text {
              font-size: 14px;
              line-height: 1.5;
              margin: 20px 0;
              padding: 12px;
              background-color: #f9f9f9;
              border-left: 4px solid #007bff;
              white-space: pre-wrap;
            }
            .map-image {
              width: 100%;
              height: auto;
              max-height: 80vh;
              object-fit: contain;
            }
            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-header">${printHeader}</div>
          ${additionalText ? `<div class="additional-text">${additionalText}</div>` : ''}
          ${getContourDescription() ? `<div class="contour-info">${getContourDescription()}</div>` : ''}
          <img src="${dataUrl}" class="map-image" />
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 500);
            };
          </script>
        </body>
        </html>
      `);

      printWindow.document.close();
      onClose();
    } catch (error) {
      console.error('Fehler beim Erstellen des Druckbilds:', error);
      alert('Es gab einen Fehler beim Vorbereiten des Drucks. Bitte versuchen Sie es erneut.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Karte drucken
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="header" className="text-right">
              Überschrift:
            </Label>
            <Input
              id="header"
              value={printHeader}
              onChange={(e) => setPrintHeader(e.target.value)}
              className="col-span-3"
              placeholder="Geben Sie eine Überschrift ein..."
            />
          </div>
          
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="additionalText" className="text-right pt-2">
              Zusätzlicher Text:
            </Label>
            <Textarea
              id="additionalText"
              value={additionalText}
              onChange={(e) => setAdditionalText(e.target.value)}
              className="col-span-3"
              placeholder="Optionaler Text für den Ausdruck..."
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="orientation" className="text-right">
              Ausrichtung:
            </Label>
            <select
              id="orientation"
              value={orientation}
              onChange={(e) => setOrientation(e.target.value as 'landscape' | 'portrait')}
              className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="landscape">Querformat</option>
              <option value="portrait">Hochformat</option>
            </select>
          </div>
          
          <div className="text-sm text-gray-600">
            <p>Die Karte wird mit der aktuellen Ansicht gedruckt.</p>
            <p className="mt-2">Hinweis: Für beste Ergebnisse:</p>
            <ul className="list-disc list-inside mt-1">
              <li>Stellen Sie die gewünschte Ansicht ein</li>
              <li>Aktivieren Sie Hintergrundgrafiken</li>
            </ul>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Abbrechen
          </Button>
          <Button onClick={handlePrint} disabled={isProcessing} className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            {isProcessing ? 'Verarbeitung...' : 'Drucken'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};