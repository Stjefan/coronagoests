/* eslint-disable react-refresh/only-export-components */
import React, { useState } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { useProjectStore } from '../../store/projectStore';
import { 
  interpolateYlOrBr,
  interpolateRdYlGn,
  interpolateViridis,
  interpolateBlues,
  interpolateGreens,
  interpolateOranges,
  interpolatePurples,
  interpolatePlasma,
  interpolateInferno,
  interpolateMagma,
  interpolateWarm,
  interpolateCool,
  interpolateCubehelixDefault,
  interpolateRainbow,
  interpolateSinebow
} from 'd3-scale-chromatic';

interface ColorPaletteDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ColorScheme {
  name: string;
  label: string;
  interpolator: (t: number) => string;
}

const dgmColorSchemes: ColorScheme[] = [
  { name: 'YlOrBr', label: 'Gelb-Orange-Braun', interpolator: interpolateYlOrBr },
  { name: 'Viridis', label: 'Viridis', interpolator: interpolateViridis },
  { name: 'Plasma', label: 'Plasma', interpolator: interpolatePlasma },
  { name: 'Inferno', label: 'Inferno', interpolator: interpolateInferno },
  { name: 'Magma', label: 'Magma', interpolator: interpolateMagma },
  { name: 'Warm', label: 'Warm', interpolator: interpolateWarm },
  { name: 'Cool', label: 'Cool', interpolator: interpolateCool },
  { name: 'Cubehelix', label: 'Cubehelix', interpolator: interpolateCubehelixDefault },
  { name: 'Blues', label: 'Blau', interpolator: interpolateBlues },
  { name: 'Greens', label: 'Grün', interpolator: interpolateGreens },
  { name: 'Oranges', label: 'Orange', interpolator: interpolateOranges },
  { name: 'Purples', label: 'Lila', interpolator: interpolatePurples },
];

const immissionColorSchemes: ColorScheme[] = [
  { name: 'RdYlGn', label: 'Rot-Gelb-Grün (umgekehrt)', interpolator: (t: number) => interpolateRdYlGn(1 - t) },
  { name: 'RdYlGnNormal', label: 'Rot-Gelb-Grün', interpolator: interpolateRdYlGn },
  { name: 'Viridis', label: 'Viridis', interpolator: interpolateViridis },
  { name: 'ViridisReverse', label: 'Viridis (umgekehrt)', interpolator: (t: number) => interpolateViridis(1 - t) },
  { name: 'Plasma', label: 'Plasma', interpolator: interpolatePlasma },
  { name: 'PlasmaReverse', label: 'Plasma (umgekehrt)', interpolator: (t: number) => interpolatePlasma(1 - t) },
  { name: 'Inferno', label: 'Inferno', interpolator: interpolateInferno },
  { name: 'InfernoReverse', label: 'Inferno (umgekehrt)', interpolator: (t: number) => interpolateInferno(1 - t) },
  { name: 'Rainbow', label: 'Regenbogen', interpolator: interpolateRainbow },
  { name: 'Sinebow', label: 'Sinebow', interpolator: interpolateSinebow },
];

const ColorSchemePreview: React.FC<{ scheme: ColorScheme; width?: number; height?: number }> = ({ 
  scheme, 
  width = 200, 
  height = 20 
}) => {
  const steps = 50;
  const gradientId = `gradient-${scheme.name}-${Date.now()}`;
  
  return (
    <svg width={width} height={height} style={{ border: '1px solid #ccc', borderRadius: '2px' }}>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          {Array.from({ length: steps }, (_, i) => {
            const t = i / (steps - 1);
            return (
              <stop
                key={i}
                offset={`${t * 100}%`}
                stopColor={scheme.interpolator(t)}
              />
            );
          })}
        </linearGradient>
      </defs>
      <rect x="0" y="0" width={width} height={height} fill={`url(#${gradientId})`} />
    </svg>
  );
};

export const ColorPaletteDialog: React.FC<ColorPaletteDialogProps> = ({
  isOpen,
  onClose
}) => {
  const { colorPalettes, setColorPalette, immissionGridSettings, updateImmissionGridSettings } = useProjectStore();
  const [selectedDgm, setSelectedDgm] = useState(colorPalettes.dgm);
  const [selectedImmission, setSelectedImmission] = useState(colorPalettes.immissionGrid);
  const [legendMode, setLegendMode] = useState(immissionGridSettings.legendMode);
  const [legendMinValue, setLegendMinValue] = useState(immissionGridSettings.legendMinValue);
  const [legendIntervalSize, setLegendIntervalSize] = useState(immissionGridSettings.legendIntervalSize);
  const [legendIntervalCount, setLegendIntervalCount] = useState(immissionGridSettings.legendIntervalCount);
  const [opacity, setOpacity] = useState(immissionGridSettings.opacity);

  const handleApply = () => {
    setColorPalette('dgm', selectedDgm);
    setColorPalette('immissionGrid', selectedImmission);
    updateImmissionGridSettings({
      legendMode,
      legendMinValue,
      legendIntervalSize,
      legendIntervalCount,
      opacity
    });
    onClose();
  };

  const handleCancel = () => {
    // Reset to current values
    setSelectedDgm(colorPalettes.dgm);
    setSelectedImmission(colorPalettes.immissionGrid);
    setLegendMode(immissionGridSettings.legendMode);
    setLegendMinValue(immissionGridSettings.legendMinValue);
    setLegendIntervalSize(immissionGridSettings.legendIntervalSize);
    setLegendIntervalCount(immissionGridSettings.legendIntervalCount);
    setOpacity(immissionGridSettings.opacity);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Farbpaletten Einstellungen</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4 space-y-6">
          {/* DGM Color Palette */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Digitales Geländemodell (DGM)</h3>
            <div className="grid grid-cols-1 gap-2">
              {dgmColorSchemes.map(scheme => (
                <div key={scheme.name} className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id={`dgm-${scheme.name}`}
                    name="dgm-palette"
                    value={scheme.name}
                    checked={selectedDgm === scheme.name}
                    onChange={(e) => setSelectedDgm(e.target.value)}
                    className="w-4 h-4"
                  />
                  <Label 
                    htmlFor={`dgm-${scheme.name}`}
                    className="flex items-center gap-3 cursor-pointer flex-1"
                  >
                    <span className="min-w-[150px]">{scheme.label}</span>
                    <ColorSchemePreview scheme={scheme} />
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Immission Grid Color Palette */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Immissionsgitter</h3>
            <div className="grid grid-cols-1 gap-2">
              {immissionColorSchemes.map(scheme => (
                <div key={scheme.name} className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id={`immission-${scheme.name}`}
                    name="immission-palette"
                    value={scheme.name}
                    checked={selectedImmission === scheme.name}
                    onChange={(e) => setSelectedImmission(e.target.value)}
                    className="w-4 h-4"
                  />
                  <Label 
                    htmlFor={`immission-${scheme.name}`}
                    className="flex items-center gap-3 cursor-pointer flex-1"
                  >
                    <span className="min-w-[150px]">{scheme.label}</span>
                    <ColorSchemePreview scheme={scheme} />
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Legend Settings for Immission Grid */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Immissionsgitter Legende & Darstellung</h3>
            <div className="space-y-4">
              {/* Opacity Control */}
              <div className="flex items-center space-x-3">
                <Label htmlFor="opacity" className="min-w-[120px]">Transparenz:</Label>
                <Input
                  id="opacity"
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="w-24"
                />
                <span className="text-sm text-gray-600">(0 = transparent, 1 = opak)</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="auto-legend"
                  checked={legendMode === 'auto'}
                  onCheckedChange={(checked) => setLegendMode(checked ? 'auto' : 'custom')}
                />
                <Label htmlFor="auto-legend">Automatische Legende</Label>
              </div>
              
              {legendMode === 'custom' && (
                <div className="space-y-3 ml-6">
                  <div className="flex items-center space-x-3">
                    <Label htmlFor="min-value" className="min-w-[120px]">Min Wert:</Label>
                    <Input
                      id="min-value"
                      type="number"
                      value={legendMinValue}
                      onChange={(e) => setLegendMinValue(Number(e.target.value))}
                      className="w-24"
                    />
                    <span className="text-sm text-gray-600">dB(A)</span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Label htmlFor="interval-size" className="min-w-[120px]">Intervallgröße:</Label>
                    <Input
                      id="interval-size"
                      type="number"
                      value={legendIntervalSize}
                      onChange={(e) => setLegendIntervalSize(Number(e.target.value))}
                      className="w-24"
                    />
                    <span className="text-sm text-gray-600">dB(A)</span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Label htmlFor="interval-count" className="min-w-[120px]">Anzahl Intervalle:</Label>
                    <Input
                      id="interval-count"
                      type="number"
                      value={legendIntervalCount}
                      onChange={(e) => setLegendIntervalCount(Number(e.target.value))}
                      className="w-24"
                    />
                  </div>
                  
                  <div className="text-sm text-gray-600 mt-2">
                    Bereich: {legendMinValue} - {legendMinValue + legendIntervalSize * legendIntervalCount} dB(A)
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={handleCancel}>
            Abbrechen
          </Button>
          <Button onClick={handleApply}>
            Anwenden
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Export the color scheme maps for use in the overlay components
export const getColorSchemeByName = (type: 'dgm' | 'immission', name: string): ((t: number) => string) => {
  const schemes = type === 'dgm' ? dgmColorSchemes : immissionColorSchemes;
  const scheme = schemes.find(s => s.name === name);
  return scheme ? scheme.interpolator : (type === 'dgm' ? interpolateYlOrBr : (t: number) => interpolateRdYlGn(1 - t));
};