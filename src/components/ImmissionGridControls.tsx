import React, { useState } from 'react';
import { useProjectStore } from '../store/projectStore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Grid3x3, Trash2, Eye, EyeOff } from 'lucide-react';
import { HelmertTransform } from '../utils/helmertTransform';
import { useDialog } from '../hooks/useDialog';
import { LoadingOverlay } from './LoadingOverlay';

interface ImmissionGridControlsProps {
  mapWidth: number;
  mapHeight: number;
  transform: HelmertTransform | null;
}

export const ImmissionGridControls: React.FC<ImmissionGridControlsProps> = ({
  mapWidth,
  mapHeight,
  transform
}) => {
  const {
    immissionGrid,
    immissionGridSettings,
    showImmissionGrid,
    showGridPoints,
    isCalculatingGrid,
    gridCalculationProgress,
    generateImmissionGrid,
    clearImmissionGrid,
    setShowImmissionGrid,
    setShowGridPoints,
    updateImmissionGridSettings,
  } = useProjectStore();

  const [localSettings, setLocalSettings] = useState(immissionGridSettings);

  const handleGenerateGrid = async () => {
    // Update store settings first
    updateImmissionGridSettings(localSettings);
    // Generate grid
    await generateImmissionGrid(mapWidth, mapHeight, transform);
    // Show grid after generation
    if (!showImmissionGrid) {
      setShowImmissionGrid(true);
    }
  };

  const { confirm } = useDialog();
  
  const handleClearGrid = async () => {
    const confirmed = await confirm('Immissionsgitter löschen?');
    if (confirmed) {
      clearImmissionGrid();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Immissionsgitter</h3>
        {immissionGrid.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowImmissionGrid(!showImmissionGrid)}
            className="h-6 px-2"
          >
            {showImmissionGrid ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          </Button>
        )}
      </div>
      
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="gridX" className="text-xs">Punkte X</Label>
            <Input
              id="gridX"
              type="number"
              min="2"
              max="50"
              value={localSettings.gridSizeX}
              onChange={(e) => setLocalSettings({
                ...localSettings,
                gridSizeX: parseInt(e.target.value) || 10
              })}
              className="h-8 text-xs"
            />
          </div>
          <div>
            <Label htmlFor="gridY" className="text-xs">Punkte Y</Label>
            <Input
              id="gridY"
              type="number"
              min="2"
              max="50"
              value={localSettings.gridSizeY}
              onChange={(e) => setLocalSettings({
                ...localSettings,
                gridSizeY: parseInt(e.target.value) || 10
              })}
              className="h-8 text-xs"
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="heightOffset" className="text-xs">Höhenoffset (m)</Label>
          <Input
            id="heightOffset"
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={localSettings.heightOffset}
            onChange={(e) => setLocalSettings({
              ...localSettings,
              heightOffset: parseFloat(e.target.value) || 1.5
            })}
            className="h-8 text-xs"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={handleGenerateGrid}
            disabled={isCalculatingGrid || !transform}
            className="flex-1"
          >
            <Grid3x3 className="h-4 w-4 mr-1" />
            {isCalculatingGrid ? 'Berechne...' : 'Gitter erstellen'}
          </Button>
          
          {immissionGrid.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClearGrid}
              disabled={isCalculatingGrid}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {immissionGrid.length > 0 && (
          <>
            <div className="text-xs text-gray-600">
              {immissionGrid.length} Punkte berechnet
              {immissionGrid.length > 0 && (
                <div className="text-xs">
                  Wertebereich: {Math.min(...immissionGrid.map(p => p.value)).toFixed(1)} - {Math.max(...immissionGrid.map(p => p.value)).toFixed(1)} dB(A)
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-gray-200">
              <Checkbox
                id="showGridPoints"
                checked={showGridPoints}
                onCheckedChange={(checked) => setShowGridPoints(checked as boolean)}
              />
              <label
                htmlFor="showGridPoints"
                className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Gitterpunkte anzeigen
              </label>
            </div>
          </>
        )}
        
        {!transform && (
          <div className="text-xs text-amber-600">
            Hinweis: Helmert-Transformation erforderlich (Referenzpunkte A & B setzen)
          </div>
        )}
      </div>
      
      {/* Loading overlay for grid calculation */}
      <LoadingOverlay 
        isVisible={isCalculatingGrid}
        message={`Berechne ${localSettings.gridSizeX * localSettings.gridSizeY} Gitterpunkte...`}
        progress={gridCalculationProgress || undefined}
      />
    </div>
  );
};