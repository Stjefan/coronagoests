import React from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { useProjectStore } from '../../store/projectStore';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Grid3x3, Route, Mountain, Map, Target, MapPin, Radio, TriangleAlert, Zap, Anchor } from 'lucide-react';

interface MapLayersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  showTrassen: boolean;
  setShowTrassen: (show: boolean) => void;
  showDGM: boolean;
  setShowDGM: (show: boolean) => void;
  showContour: boolean;
  setShowContour: (show: boolean) => void;
  showReferenceCalibration: boolean;
  setShowReferenceCalibration: (show: boolean) => void;
}

export const MapLayersDialog: React.FC<MapLayersDialogProps> = ({
  isOpen,
  onClose,
  showTrassen,
  setShowTrassen,
  showDGM,
  setShowDGM,
  showContour,
  setShowContour,
  showReferenceCalibration,
  setShowReferenceCalibration
}) => {
  const {
    showImmissionGrid,
    setShowImmissionGrid,
    showGridPoints,
    setShowGridPoints,
    immissionGrid,
    dgmKanten,
    showImmissionPoints,
    setShowImmissionPoints,
    showESQPoints,
    setShowESQPoints,
    showHoehenpunkte,
    setShowHoehenpunkte,
    showPoles,
    setShowPoles,
    showReferencePoints,
    setShowReferencePoints,
    immissionPoints,
    esqSources,
    hoehenpunkte,
    poles,
    referencePoints,
  } = useProjectStore();
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Kartenebenen</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4 space-y-4">
          <div className="space-y-3">
            {/* Trassen Layer */}
            <div className="flex items-center space-x-3">
              <Checkbox
                id="trassen-layer"
                checked={showTrassen}
                onCheckedChange={(checked) => setShowTrassen(checked as boolean)}
              />
              <Label 
                htmlFor="trassen-layer" 
                className="flex items-center gap-2 cursor-pointer flex-1"
              >
                <Route className="h-4 w-4" />
                <span>Trassen anzeigen</span>
              </Label>
            </div>
            
            {/* DGM Layer */}
            <div className="flex items-center space-x-3">
              <Checkbox
                id="dgm-layer"
                checked={showDGM}
                onCheckedChange={(checked) => setShowDGM(checked as boolean)}
                disabled={!dgmKanten || dgmKanten.length === 0}
              />
              <Label 
                htmlFor="dgm-layer" 
                className="flex items-center gap-2 cursor-pointer flex-1"
              >
                <Mountain className="h-4 w-4" />
                <span>DGM anzeigen</span>
                {(!dgmKanten || dgmKanten.length === 0) && (
                  <span className="text-xs text-gray-500">(nicht verfügbar)</span>
                )}
              </Label>
            </div>
            
            {/* Contour Layer */}
            <div className="flex items-center space-x-3">
              <Checkbox
                id="contour-layer"
                checked={showContour}
                onCheckedChange={(checked) => setShowContour(checked as boolean)}
              />
              <Label 
                htmlFor="contour-layer" 
                className="flex items-center gap-2 cursor-pointer flex-1"
              >
                <Map className="h-4 w-4" />
                <span>Höhenlinien anzeigen</span>
              </Label>
            </div>
            
            {/* Immission Grid Layer */}
            <div className="flex items-center space-x-3">
              <Checkbox
                id="immission-grid-layer"
                checked={showImmissionGrid}
                onCheckedChange={(checked) => setShowImmissionGrid(checked as boolean)}
                disabled={!immissionGrid || immissionGrid.length === 0}
              />
              <Label 
                htmlFor="immission-grid-layer" 
                className="flex items-center gap-2 cursor-pointer flex-1"
              >
                <Grid3x3 className="h-4 w-4" />
                <span>Immissionsgitter anzeigen</span>
                {(!immissionGrid || immissionGrid.length === 0) && (
                  <span className="text-xs text-gray-500">(nicht berechnet)</span>
                )}
              </Label>
            </div>
            
            {/* Grid Points Layer */}
            {immissionGrid && immissionGrid.length > 0 && (
              <div className="flex items-center space-x-3 ml-6">
                <Checkbox
                  id="grid-points-layer"
                  checked={showGridPoints}
                  onCheckedChange={(checked) => setShowGridPoints(checked as boolean)}
                />
                <Label 
                  htmlFor="grid-points-layer" 
                  className="flex items-center gap-2 cursor-pointer flex-1"
                >
                  <Target className="h-4 w-4" />
                  <span>Gitterpunkte anzeigen</span>
                </Label>
              </div>
            )}
          </div>
          
          {/* Marker Layers Section */}
          <div className="pt-3 border-t">
            <h3 className="text-sm font-medium mb-3 text-gray-700">Markierungen</h3>
            <div className="space-y-3">
              {/* Immission Points */}
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="immission-points-layer"
                  checked={showImmissionPoints}
                  onCheckedChange={(checked) => setShowImmissionPoints(checked as boolean)}
                />
                <Label 
                  htmlFor="immission-points-layer" 
                  className="flex items-center gap-2 cursor-pointer flex-1"
                >
                  <MapPin className="h-4 w-4 text-red-500" />
                  <span>Immissionspunkte</span>
                  <span className="text-xs text-gray-500">({immissionPoints.size})</span>
                </Label>
              </div>
              
              {/* ESQ Points */}
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="esq-points-layer"
                  checked={showESQPoints}
                  onCheckedChange={(checked) => setShowESQPoints(checked as boolean)}
                />
                <Label 
                  htmlFor="esq-points-layer" 
                  className="flex items-center gap-2 cursor-pointer flex-1"
                >
                  <Radio className="h-4 w-4 text-blue-500" />
                  <span>ESQ-Quellen</span>
                  <span className="text-xs text-gray-500">({esqSources.size})</span>
                </Label>
              </div>
              
              {/* Höhenpunkte */}
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="hoehenpunkte-layer"
                  checked={showHoehenpunkte}
                  onCheckedChange={(checked) => setShowHoehenpunkte(checked as boolean)}
                />
                <Label 
                  htmlFor="hoehenpunkte-layer" 
                  className="flex items-center gap-2 cursor-pointer flex-1"
                >
                  <TriangleAlert className="h-4 w-4 text-green-500" />
                  <span>Höhenpunkte</span>
                  <span className="text-xs text-gray-500">({hoehenpunkte.size})</span>
                </Label>
              </div>
              
              {/* Poles/Masts */}
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="poles-layer"
                  checked={showPoles}
                  onCheckedChange={(checked) => setShowPoles(checked as boolean)}
                />
                <Label 
                  htmlFor="poles-layer" 
                  className="flex items-center gap-2 cursor-pointer flex-1"
                >
                  <Zap className="h-4 w-4 text-amber-700" />
                  <span>Masten</span>
                  <span className="text-xs text-gray-500">({poles.size})</span>
                </Label>
              </div>
              
              {/* Reference Points */}
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="reference-points-layer"
                  checked={showReferencePoints}
                  onCheckedChange={(checked) => setShowReferencePoints(checked as boolean)}
                />
                <Label 
                  htmlFor="reference-points-layer" 
                  className="flex items-center gap-2 cursor-pointer flex-1"
                >
                  <Anchor className="h-4 w-4 text-purple-500" />
                  <span>Referenzpunkte</span>
                  <span className="text-xs text-gray-500">({referencePoints.length})</span>
                </Label>
              </div>
            </div>
          </div>
          
          {/* UI Elements Section */}
          <div className="pt-3 border-t">
            <h3 className="text-sm font-medium mb-3 text-gray-700">Benutzeroberfläche</h3>
            <div className="space-y-3">
              {/* Reference Calibration Panel */}
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="reference-calibration-layer"
                  checked={showReferenceCalibration}
                  onCheckedChange={(checked) => setShowReferenceCalibration(checked as boolean)}
                />
                <Label 
                  htmlFor="reference-calibration-layer" 
                  className="flex items-center gap-2 cursor-pointer flex-1"
                >
                  <Target className="h-4 w-4 text-indigo-500" />
                  <span>Referenzpunkt-Kalibrierung</span>
                </Label>
              </div>
            </div>
          </div>
          
          {/* Status info */}
          <div className="pt-3 border-t space-y-1">
            <div className="text-xs text-gray-600">
              {immissionGrid && immissionGrid.length > 0 && (
                <div>{immissionGrid.length} Immissionsgitterpunkte berechnet</div>
              )}
              {dgmKanten && dgmKanten.length > 0 && (
                <div>{dgmKanten.length} DGM-Kanten geladen</div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};