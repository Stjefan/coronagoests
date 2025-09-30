/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';
import { useProjectStore } from '../store/projectStore';
import type { ReferencePoint } from '../store/projectStore';
import { DraggablePanel } from './DraggablePanel';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { MapPin, Plus, Trash2, Check, X, MousePointer, Bug } from 'lucide-react';
import { useMapEvents } from 'react-leaflet';
import { v4 as uuidv4 } from 'uuid';

type CalibrationState = {
  isCapturing: boolean;
  onMapClick: (pixelX: number, pixelY: number) => void;
};

// Store for calibration state that needs to be shared
const calibrationState: CalibrationState = {
  isCapturing: false,
  onMapClick: () => {}
};

export const setCalibrationCapturing = (capturing: boolean) => {
  calibrationState.isCapturing = capturing;
};

export const setCalibrationCallback = (callback: (pixelX: number, pixelY: number) => void) => {
  calibrationState.onMapClick = callback;
};

// This component must be used inside MapContainer
export const ReferencePointCalibrationHandler: React.FC<{ imageHeight: number }> = ({ imageHeight }) => {
  useMapEvents({
    click: (e) => {
      if (calibrationState.isCapturing) {
        const { lat, lng } = e.latlng;
        // Convert from Leaflet coordinates to pixel coordinates (top-left origin)
        const pixelX = Math.round(lng);
        const pixelY = Math.round(imageHeight - lat);
        calibrationState.onMapClick(pixelX, pixelY);
        calibrationState.isCapturing = false;
      }
    }
  });
  
  return null;
};

export const ReferencePointCalibration: React.FC = () => {
  const {
    referencePoints,
    projectImage,
    addReferencePoint,
    updateReferencePoint,
    deleteReferencePoint,
  } = useProjectStore();
  
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedPixel, setCapturedPixel] = useState<{ x: number; y: number } | null>(null);
  const [newPointGK, setNewPointGK] = useState({ rechts: '', hoch: '' });
  const [editingPoint, setEditingPoint] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ rechts: string; hoch: string }>({ rechts: '', hoch: '' });
  
  const handleStartCapture = () => {
    setIsCapturing(true);
    setCapturedPixel(null);
    setNewPointGK({ rechts: '', hoch: '' });
    setCalibrationCapturing(true);
    setCalibrationCallback((pixelX, pixelY) => {
      setCapturedPixel({ x: pixelX, y: pixelY });
      setIsCapturing(false);
    });
  };
  
  const handleCancelCapture = () => {
    setIsCapturing(false);
    setCapturedPixel(null);
    setNewPointGK({ rechts: '', hoch: '' });
    setCalibrationCapturing(false);
  };
  
  const handleAddPoint = () => {
    if (!capturedPixel || !newPointGK.rechts || !newPointGK.hoch) {
      return;
    }
    
    const gkRechts = parseFloat(newPointGK.rechts);
    const gkHoch = parseFloat(newPointGK.hoch);
    
    if (isNaN(gkRechts) || isNaN(gkHoch)) {
      alert('Bitte gültige Koordinaten eingeben.');
      return;
    }
    
    const newPoint: ReferencePoint = {
      id: uuidv4(),
      pixelX: capturedPixel.x,
      pixelY: capturedPixel.y,
      gkRechts,
      gkHoch,
      label: String.fromCharCode(65 + referencePoints.length), // A, B, C, ...
    };
    
    addReferencePoint(newPoint);
    
    // Reset form
    setCapturedPixel(null);
    setNewPointGK({ rechts: '', hoch: '' });
  };
  
  const handleStartEdit = (point: ReferencePoint) => {
    setEditingPoint(point.id);
    setEditValues({
      rechts: point.gkRechts.toString(),
      hoch: point.gkHoch.toString(),
    });
  };
  
  const handleSaveEdit = () => {
    if (!editingPoint) return;
    
    const gkRechts = parseFloat(editValues.rechts);
    const gkHoch = parseFloat(editValues.hoch);
    
    if (isNaN(gkRechts) || isNaN(gkHoch)) {
      alert('Bitte gültige Koordinaten eingeben.');
      return;
    }
    
    updateReferencePoint(editingPoint, { gkRechts, gkHoch });
    setEditingPoint(null);
    setEditValues({ rechts: '', hoch: '' });
  };
  
  const handleCancelEdit = () => {
    setEditingPoint(null);
    setEditValues({ rechts: '', hoch: '' });
  };
  
  const handleDeletePoint = (id: string) => {
    if (confirm('Referenzpunkt wirklich löschen?')) {
      deleteReferencePoint(id);
    }
  };
  
  const handleDebugPoints = () => {
    // Clear existing points first
    referencePoints.forEach((point) => {
      deleteReferencePoint(point.id);
    });
    
    // Add debug point 1: pixel (2126, 1594), GK (3525941, 5385710)
    const debugPoint1: ReferencePoint = {
      id: uuidv4(),
      pixelX: 2126,
      pixelY: 1594,
      gkRechts: 3525941,
      gkHoch: 5385710,
      label: 'A'
    };
    addReferencePoint(debugPoint1);
    
    // Add debug point 2: pixel (1514, 1150), GK (3525836, 5385784)
    const debugPoint2: ReferencePoint = {
      id: uuidv4(),
      pixelX: 1514,
      pixelY: 1150,
      gkRechts: 3525836,
      gkHoch: 5385784,
      label: 'B'
    };
    addReferencePoint(debugPoint2);
    
    console.log('Debug reference points set:', [debugPoint1, debugPoint2]);
  };
  
  const isValid = referencePoints.length >= 2;
  
  return (
    <DraggablePanel 
        title="Referenzpunkt-Kalibrierung" 
        defaultPosition={{ x: window.innerWidth - 360, y: 300 }}
        className="w-80"
      >
        <div className="space-y-4">
          {!projectImage && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-xs text-yellow-800">
                <span className="font-semibold">Hinweis:</span><br />
                Bitte laden Sie zuerst ein Lageplan-Bild hoch.
              </p>
            </div>
          )}
          
          {projectImage && (
            <>
              {/* Status */}
              <div className={`p-2 rounded text-xs ${
                isValid
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}>
                {referencePoints.length === 0 && 'Setzen Sie mindestens 2 Referenzpunkte'}
                {referencePoints.length === 1 && '1 Referenzpunkt gesetzt (min. 2 benötigt)'}
                {referencePoints.length >= 2 && `${referencePoints.length} Referenzpunkte gesetzt ✓`}
              </div>
              
              {/* Existing Points */}
              {referencePoints.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Gesetzte Punkte:</Label>
                  {referencePoints.map((point) => (
                    <div 
                      key={point.id} 
                      className="p-2 bg-gray-50 rounded border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm">
                          <MapPin className="h-3 w-3 inline mr-1" />
                          Punkt {point.label}
                        </span>
                        <div className="flex gap-1">
                          {editingPoint !== point.id && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2"
                                onClick={() => handleStartEdit(point)}
                              >
                                Bearbeiten
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2 text-red-600 hover:text-red-700"
                                onClick={() => handleDeletePoint(point.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {editingPoint === point.id ? (
                        <div className="space-y-2 mt-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">GK Rechts:</Label>
                              <Input
                                type="number"
                                value={editValues.rechts}
                                onChange={(e) => setEditValues({ ...editValues, rechts: e.target.value })}
                                className="h-7 text-xs"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">GK Hoch:</Label>
                              <Input
                                type="number"
                                value={editValues.hoch}
                                onChange={(e) => setEditValues({ ...editValues, hoch: e.target.value })}
                                className="h-7 text-xs"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              className="h-7 text-xs flex-1"
                              onClick={handleSaveEdit}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Speichern
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs flex-1"
                              onClick={handleCancelEdit}
                            >
                              <X className="h-3 w-3 mr-1" />
                              Abbrechen
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-600 mt-1">
                          <div>Pixel: ({point.pixelX}, {point.pixelY})</div>
                          <div>GK: ({point.gkRechts.toFixed(2)}, {point.gkHoch.toFixed(2)})</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Add New Point */}
              {!isCapturing && !capturedPixel && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleStartCapture}
                  className="w-full"
                  disabled={referencePoints.length >= 4} // Limit to 4 points for simplicity
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Neuen Referenzpunkt hinzufügen
                </Button>
              )}
              
              {isCapturing && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-xs text-blue-800 mb-2">
                    <MousePointer className="h-3 w-3 inline mr-1" />
                    <span className="font-semibold">Klicken Sie auf die Karte</span><br />
                    um die Position des Referenzpunkts zu markieren.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelCapture}
                    className="w-full h-7 text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Abbrechen
                  </Button>
                </div>
              )}
              
              {capturedPixel && (
                <div className="space-y-3 p-3 bg-gray-50 rounded border border-gray-200">
                  <div className="text-xs">
                    <strong>Pixel-Position:</strong> ({capturedPixel.x}, {capturedPixel.y})
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs">GK Rechts-Wert:</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={newPointGK.rechts}
                        onChange={(e) => setNewPointGK({ ...newPointGK, rechts: e.target.value })}
                        placeholder="z.B. 3522278.47"
                        className="h-8 text-xs mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-xs">GK Hoch-Wert:</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={newPointGK.hoch}
                        onChange={(e) => setNewPointGK({ ...newPointGK, hoch: e.target.value })}
                        placeholder="z.B. 5387345.79"
                        className="h-8 text-xs mt-1"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={handleAddPoint}
                      disabled={!newPointGK.rechts || !newPointGK.hoch}
                      className="flex-1 h-8 text-xs"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Punkt hinzufügen
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelCapture}
                      className="flex-1 h-8 text-xs"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Abbrechen
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Debug button for testing */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDebugPoints}
                  className="w-full h-8 text-xs border-orange-300 text-orange-600 hover:bg-orange-50"
                >
                  <Bug className="h-3 w-3 mr-1" />
                  Debug: Test-Referenzpunkte setzen
                </Button>
                <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                  <div>Punkt A: Pixel(2126, 1594) → GK(3525941, 5385710)</div>
                  <div>Punkt B: Pixel(1514, 1150) → GK(3525836, 5385784)</div>
                </div>
              </div>
            </>
          )}
        </div>
      </DraggablePanel>
  );
};