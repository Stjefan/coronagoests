import React from 'react';
import { useProjectStore } from '../store/projectStore';
import type { MarkerType } from '../store/projectStore';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { MapPin, Radio, Mountain, Home } from 'lucide-react';

export const MarkerSelectionToolbar: React.FC = () => {
  const {
    selectedMarkerType,
    focusedMarkerId,
    setSelectedMarkerType,
    clearMarkerSelection,
    hoehenpunkte,
    immissionPoints,
    esqSources,
    poles,
    getMarkersByType,
    showHoehenpunkte,
    showImmissionPoints,
    showESQPoints,
    showPoles,
    setShowHoehenpunkte,
    setShowImmissionPoints,
    setShowESQPoints,
    setShowPoles,
  } = useProjectStore();

  const markerConfigs: Array<{
    type: MarkerType;
    icon: React.ReactNode;
    label: string;
    count: number;
    shortcut: string;
    color: string;
    visible: boolean;
    setVisible: (visible: boolean) => void;
  }> = [
    {
      type: 'hoehenpunkt',
      icon: <Mountain className="h-4 w-4" />,
      label: 'Höhenpunkte',
      count: hoehenpunkte.size,
      shortcut: '1',
      color: '#00ff00',
      visible: showHoehenpunkte,
      setVisible: setShowHoehenpunkte,
    },
    {
      type: 'immissionpoint',
      icon: <MapPin className="h-4 w-4" />,
      label: 'Immissionspunkte',
      count: immissionPoints.size,
      shortcut: '2',
      color: '#ff0000',
      visible: showImmissionPoints,
      setVisible: setShowImmissionPoints,
    },
    {
      type: 'esq',
      icon: <Radio className="h-4 w-4" />,
      label: 'ESQ',
      count: esqSources.size,
      shortcut: '3',
      color: '#0000ff',
      visible: showESQPoints,
      setVisible: setShowESQPoints,
    },
    {
      type: 'pole',
      icon: <Home className="h-4 w-4" />,
      label: 'Masten',
      count: poles.size,
      shortcut: '4',
      color: '#D2691E',
      visible: showPoles,
      setVisible: setShowPoles,
    },
  ];

  const getFocusedMarkerIndex = () => {
    if (!selectedMarkerType || !focusedMarkerId) return null;
    const markers = getMarkersByType(selectedMarkerType);
    const index = markers.findIndex(m => m.id === focusedMarkerId);
    return index >= 0 ? index + 1 : null;
  };

  const focusedIndex = getFocusedMarkerIndex();
  const totalCount = selectedMarkerType ? getMarkersByType(selectedMarkerType).length : 0;

  return (
    <div className="absolute bottom-24 right-4 z-[1000] bg-white rounded-lg shadow-md p-3 print-hide">
      <div className="flex flex-col space-y-2">
        <div className="text-sm font-medium mb-1">Marker-Auswahl</div>
        
        {markerConfigs.map((config) => (
          <div key={config.type} className="flex items-center gap-2">
            <Checkbox
              id={`visibility-${config.type}`}
              checked={config.visible}
              onCheckedChange={(checked) => config.setVisible(checked as boolean)}
              className="data-[state=checked]:bg-transparent data-[state=checked]:border-current"
              style={{
                borderColor: config.color,
                color: config.color,
              }}
            />
            <Button
              onClick={() => {
                if (selectedMarkerType === config.type) {
                  clearMarkerSelection();
                } else {
                  setSelectedMarkerType(config.type);
                }
              }}
              variant={selectedMarkerType === config.type ? 'default' : 'outline'}
              size="sm"
              className={`flex-1 justify-start text-xs ${
                selectedMarkerType === config.type
                  ? 'ring-2 ring-offset-2'
                  : ''
              } ${!config.visible ? 'opacity-50' : ''}`}
              style={{
                ...(selectedMarkerType === config.type && {
                  borderColor: config.color,
                  boxShadow: `0 0 0 2px ${config.color}40`,
                }),
              }}
              disabled={config.count === 0 || !config.visible}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <div
                    className="flex items-center justify-center"
                    style={{ color: config.color }}
                  >
                    {config.icon}
                  </div>
                  <span>{config.label}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500">({config.count})</span>
                  <kbd className="px-1 py-0.5 text-xs bg-gray-100 border border-gray-300 rounded">
                    {config.shortcut}
                  </kbd>
                </div>
              </div>
            </Button>
          </div>
        ))}

        {selectedMarkerType && totalCount > 0 && (
          <>
            <div className="border-t pt-2 mt-2">
              <div className="text-xs text-gray-600">
                Navigation: {focusedIndex ? `${focusedIndex}/${totalCount}` : 'Kein Fokus'}
              </div>
              <div className="flex gap-1 mt-1">
                <kbd className="px-1 py-0.5 text-xs bg-gray-100 border border-gray-300 rounded">
                  Tab
                </kbd>
                <span className="text-xs text-gray-500">Nächster</span>
                <kbd className="px-1 py-0.5 text-xs bg-gray-100 border border-gray-300 rounded">
                  Shift+Tab
                </kbd>
                <span className="text-xs text-gray-500">Vorheriger</span>
              </div>
            </div>
          </>
        )}

        {selectedMarkerType && (
          <Button
            onClick={clearMarkerSelection}
            variant="ghost"
            size="sm"
            className="text-xs mt-2"
          >
            <span>Auswahl aufheben</span>
            <kbd className="ml-2 px-1 py-0.5 text-xs bg-gray-100 border border-gray-300 rounded">
              Esc
            </kbd>
          </Button>
        )}
      </div>
    </div>
  );
};