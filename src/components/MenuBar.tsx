import React, { useState, useRef, useEffect } from 'react';
import { useProjectStore } from '../store/projectStore';
import type { GKVector3d } from '../types/usedData';
import { Button } from './ui/button';
import { 
  FolderOpen, 
  Save, 
  Plus, 
  Image, 
  Archive,
  FileText,
  Map as MapIcon,
  ChevronDown,
  Grid3x3,
  Route,
  Layers,
  Cpu,
  Palette,
  Settings,
  Upload,
  HelpCircle,
  MapPin
} from 'lucide-react';
import { useDialog } from '../hooks/useDialog';
import { ProjectExporter } from '../utils/projectExporter';
import { ProjectImporter } from '../utils/projectImporter';
import { ImmissionGridDialog } from './dialogs/ImmissionGridDialog';
import { TrasseManagerDialog } from './dialogs/TrasseManagerDialog';
import { MapLayersDialog } from './dialogs/MapLayersDialog';
import { ColorPaletteDialog } from './dialogs/ColorPaletteDialog';
import { ProjectSettingsDialog } from './dialogs/ProjectSettingsDialog';
import { HelmertTransform } from '../utils/helmertTransform';
import { LoadingOverlay } from './LoadingOverlay';
import { ImageRotationDialog } from './dialogs/ImageRotationDialog';

interface MenuBarProps {
  mapWidth: number;
  mapHeight: number;
  transform: HelmertTransform | null;
  showTrassen: boolean;
  setShowTrassen: (show: boolean) => void;
  showDGM: boolean;
  setShowDGM: (show: boolean) => void;
  showContour: boolean;
  setShowContour: (show: boolean) => void;
  showReferenceCalibration: boolean;
  setShowReferenceCalibration: (show: boolean) => void;
}

console.log("SHOW_EXAMPLE_PROJECTS: ", import.meta.env.VITE_SHOW_EXAMPLE_PROJECTS);
const SHOW_EXAMPLE_PROJECTS = import.meta.env.VITE_SHOW_EXAMPLE_PROJECTS === 'true';
export const MenuBar: React.FC<MenuBarProps> = ({
  mapWidth,
  mapHeight,
  transform,
  showTrassen,
  setShowTrassen,
  showDGM,
  setShowDGM,
  showContour,
  setShowContour,
  showReferenceCalibration,
  setShowReferenceCalibration
}) => {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const projectInputRef = useRef<HTMLInputElement>(null);
  const migrationInputRef = useRef<HTMLInputElement>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Berechnung läuft...');
  const [loadingProgress, setLoadingProgress] = useState<{ current: number; total: number } | undefined>(undefined);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  
  // Dialog states
  const [immissionGridDialogOpen, setImmissionGridDialogOpen] = useState(false);
  const [trasseManagerDialogOpen, setTrasseManagerDialogOpen] = useState(false);
  const [mapLayersDialogOpen, setMapLayersDialogOpen] = useState(false);
  const [colorPaletteDialogOpen, setColorPaletteDialogOpen] = useState(false);
  const [projectSettingsDialogOpen, setProjectSettingsDialogOpen] = useState(false);
  const [imageRotationDialogOpen, setImageRotationDialogOpen] = useState(false);
  
  // Image rotation state
  const [pendingImageData, setPendingImageData] = useState<{
    url: string;
    width: number;
    height: number;
  } | null>(null);
  
  const {
    projectName,
    projectImage,
    imageWidth,
    imageHeight,
    referencePoints,
    setProjectName,
    createNewProject,
    setProjectImage,
    exportProjectData,
    loadProjectData,
    computeImmissionPointsFromGUI,
    immissionPoints,
    mitFrequenz,
    kt
  } = useProjectStore();
  
  const { prompt, confirm } = useDialog();
  
  const hasValidSetup = projectImage && referencePoints.length >= 2;
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if Ctrl (Windows/Linux) or Cmd (Mac) is pressed
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      
      if (!isCtrlOrCmd) return;
      
      // Handle Ctrl+N - New Project
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        handleNewProject();
      }
      
      // Handle Ctrl+S - Save/Download as ZIP
      if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        if (hasValidSetup) {
          handleExportProject(true);
        }
      }
      
      // Handle Ctrl+L - Load/Open Project
      if (e.key === 'x' || e.key === 'X') {
        e.preventDefault();
        projectInputRef.current?.click();
      }
    };
    
    // Add event listener
    window.addEventListener('keydown', handleKeyDown);
    
    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [hasValidSetup]); // Include hasValidSetup as dependency
  
  const handleNewProject = async () => {
    const name = await prompt('Name für neues Projekt:', 'Neues Projekt');
    if (name) {
      const confirmed = await confirm('Aktuelle Projektdaten werden gelöscht. Fortfahren?');
      if (confirmed) {
        createNewProject(name);
      }
    }
  };
  
  const loadDefaultProject = async (projectFile: string, projectName: string, imagePath: string) => {
    try {
      const confirmed = await confirm(`Beispielprojekt "${projectName}" laden? Aktuelle Daten werden überschrieben.`);
      if (!confirmed) return;
      
      const response = await fetch(projectFile);
      if (!response.ok) {
        throw new Error(`Failed to load project: ${response.statusText}`);
      }
      
      const data = await response.json();
      loadProjectData(data.ProjectData);
      console.log("Project name: ", projectName);
      if (projectName.toLowerCase().includes("tausend")) {
        const { imageWidth: freshWidth, imageHeight: freshHeight } = useProjectStore.getState();
        console.log("Setting image width and height to ", freshWidth, freshHeight);
        setProjectImage(imagePath, freshWidth, freshHeight);
      } else {
        setProjectImage(imagePath, 893, 639);
      }
      setProjectName(projectName);
      
    } catch (error) {
      console.error('Error loading default project:', error);
      alert(`Fehler beim Laden des Beispielprojekts: ${(error as Error).message}`);
    }
  };
  
  const rotateImage = (imageUrl: string, degrees: number): Promise<{ rotatedUrl: string; width: number; height: number }> => {
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
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      alert('Bitte wählen Sie eine Bilddatei aus.');
      return;
    }
    
    setIsLoadingImage(true);
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageUrl = e.target?.result as string;
      
      const img = document.createElement('img');
      img.onload = async () => {
        try {
          // Ask user if they want to rotate the image
          const shouldRotate = await confirm('Möchten Sie das hochgeladene Lageplan-Bild drehen?');
          
          if (shouldRotate) {
            // Store the image data and open rotation dialog
            setPendingImageData({
              url: imageUrl,
              width: img.width,
              height: img.height
            });
            setImageRotationDialogOpen(true);
            setIsLoadingImage(false);
          } else {
            // Use image as-is
            setProjectImage(imageUrl, img.width, img.height);
            setIsLoadingImage(false);
          }
        } catch (error) {
          console.error('Error during image processing:', error);
          alert('Fehler beim Verarbeiten des Bildes.');
          setIsLoadingImage(false);
        }
      };
      img.onerror = () => {
        alert('Fehler beim Laden des Bildes.');
        setIsLoadingImage(false);
      };
      img.src = imageUrl;
    };
    
    reader.onerror = () => {
      alert('Fehler beim Lesen der Datei.');
      setIsLoadingImage(false);
    };
    
    reader.readAsDataURL(file);
  };

  const handleRotationConfirm = async (rotation: number) => {
    if (!pendingImageData) return;
    
    setIsLoadingImage(true);
    setImageRotationDialogOpen(false);
    
    try {
      if (rotation === 0) {
        // No rotation needed
        setProjectImage(pendingImageData.url, pendingImageData.width, pendingImageData.height);
      } else {
        // Apply rotation
        const rotationResult = await rotateImage(pendingImageData.url, rotation);
        setProjectImage(rotationResult.rotatedUrl, rotationResult.width, rotationResult.height);
      }
    } catch (error) {
      console.error('Error applying rotation:', error);
      alert('Fehler beim Drehen des Bildes. Das ursprüngliche Bild wird verwendet.');
      setProjectImage(pendingImageData.url, pendingImageData.width, pendingImageData.height);
    } finally {
      setPendingImageData(null);
      setIsLoadingImage(false);
    }
  };

  const handleRotationCancel = () => {
    setImageRotationDialogOpen(false);
    setPendingImageData(null);
    setIsLoadingImage(false);
  };
  
  const handleExportProject = async (asZip: boolean = false) => {
    try {
      const projectData = exportProjectData();
      const filename = `${projectName.replace(/[^a-z0-9]/gi, '_')}_export`;
      
      if (asZip) {
        const zipBlob = await ProjectExporter.exportToZip(
          projectData,
          projectName,
          projectImage || undefined
        );
        ProjectExporter.downloadBlob(zipBlob, `${filename}.zip`);
      } else {
        const jsonStr = ProjectExporter.exportToJson(
          projectData,
          projectName,
          projectImage || undefined
        );
        const blob = new Blob([jsonStr], { type: 'application/json' });
        ProjectExporter.downloadBlob(blob, `${filename}.json`);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Fehler beim Exportieren des Projekts.');
    }
  };
  
  const handleImportProject = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      const result = await ProjectImporter.importProject(file);
      
      console.log('Import result:', { 
        hasImageData: !!result.imageData, 
        imageWidth: result.imageWidth, 
        imageHeight: result.imageHeight,
        hasProjectDataImageData: !!result.projectData.ImageData,
        IM_X_max: result.projectData.IM_X_max,
        IM_Y_max: result.projectData.IM_Y_max
      });
      
      loadProjectData(result.projectData);
      
      if (result.imageData) {
        // Prioritize IM_X_MAX/IM_Y_MAX dimensions from project data over natural image dimensions
        const width = (result.imageWidth && result.imageWidth > 0) ? result.imageWidth : 893;
        const height = (result.imageHeight && result.imageHeight > 0) ? result.imageHeight : 639;
        console.log('PATH 1: Setting project image dimensions from migration with embedded imageData:', { width, height, fromProjectData: result.imageWidth, fromProjectHeight: result.imageHeight });
        setProjectImage(result.imageData!, width, height);
      } else if (result.imageWidth && result.imageHeight && 
                 result.imageWidth > 0 && result.imageHeight > 0) {
        console.log('PATH 2: No imageData, but setting dimensions in store:', { width: result.imageWidth, height: result.imageHeight });
        useProjectStore.setState({ 
          imageWidth: result.imageWidth, 
          imageHeight: result.imageHeight 
        });
      }
      
      if (!result.imageData && result.projectData.ImageData) {
        console.log('PATH 3: Using ImageData from projectData with dimensions:', { width: result.imageWidth || 893, height: result.imageHeight || 639 });
        setProjectImage(result.projectData.ImageData, result.imageWidth || 893, result.imageHeight || 639);
      }
      
      const nameFromFile = file.name
        .replace(/_export\.(json|zip)$/, '')
        .replace(/_/g, ' ');
      setProjectName(result.projectName || result.projectData.Name || nameFromFile);
      
    } catch (error) {
      console.error('Import error:', error);
      alert(`Fehler beim Importieren: ${(error as Error).message}`);
    }
    
    if (projectInputRef.current) {
      projectInputRef.current.value = '';
    }
  };

  const handleMigrateZip = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.name.toLowerCase().endsWith('.zip')) {
      alert('Bitte wählen Sie eine ZIP-Datei aus.');
      return;
    }
    
    setIsMigrating(true);
    setLoadingMessage('Transformiere ZIP-Datei...');
    
    try {
      const formData = new FormData();
      formData.append('ZipFile', file);
      
      // Call the transform-zip API endpoint
      const apiUrl = import.meta.env.VITE_API_URL || 'https://localhost:7147';
      const response = await fetch(`${apiUrl}/api/Project/transform-zip`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Load the transformed project data
      if (result.projectData) {
        loadProjectData(result.projectData);
        
        // Set the lageplan image if provided
        if (result.lageplanImage) {
          // Create a data URL from the base64 image data
          const imageUrl = `data:image/jpeg;base64,${result.lageplanImage}`;
          // Use IM_X_MAX/IM_Y_MAX from project data instead of natural image dimensions
          const width = result.projectData?.IM_X_max || 893;
          const height = result.projectData?.IM_Y_max || 639;
          console.log('Setting lageplan image from migration API with project dimensions:', { width, height, IM_X_max: result.projectData?.IM_X_max, IM_Y_max: result.projectData?.IM_Y_max });
          setProjectImage(imageUrl, width, height);
        }
        
        // Set project name from the ZIP filename or response
        const extractedProjectName = file.name
          .replace(/\.zip$/i, '')
          .replace(/_/g, ' ');
        setProjectName(result.projectData.Name || extractedProjectName);
        
        // Automatically save the transformed project with the lageplan image
        const projectData = result.projectData;
        const filename = `${extractedProjectName}_migrated`;
        
        // Include the lageplan image in the export
        const imageDataForExport = result.lageplanImage ? 
          `data:image/jpeg;base64,${result.lageplanImage}` : undefined;
        
        const zipBlob = await ProjectExporter.exportToZip(
          projectData,
          extractedProjectName,
          imageDataForExport
        );
        ProjectExporter.downloadBlob(zipBlob, `${filename}.zip`);
        
        alert('Projekt erfolgreich migriert und gespeichert!');
      } else {
        throw new Error('Keine Projektdaten in der Antwort erhalten.');
      }
      
    } catch (error) {
      console.error('Migration error:', error);
      alert(`Fehler bei der Migration: ${(error as Error).message}`);
    } finally {
      setIsMigrating(false);
      setLoadingMessage('Berechnung läuft...');
      
      if (migrationInputRef.current) {
        migrationInputRef.current.value = '';
      }
    }
  };


  const handleCalculateFromGUI = async () => {
    setLoadingMessage(`Konvertiere GUI-Daten und berechne ${immissionPoints.size} Immissionspunkte...`);
    setLoadingProgress(undefined);
    setIsCalculating(true);
    
    try {
      console.log('Converting GUI data to UsedData format...');
      
      // Get the exportProjectData function from store which already handles the conversion
      const projectData = useProjectStore.getState().exportProjectData();
      
      // Get the Trassen which are already in UsedTrasse format
      const usedTrassen = projectData.Trassen || [];
      
      console.log('Converted', usedTrassen.length, 'trassen for computation');
      
      // Call the computation with the converted data
      if (typeof computeImmissionPointsFromGUI !== 'function') {
        console.error('computeImmissionPointsFromGUI not implemented yet');
        alert('Die Funktion wird noch implementiert...');
      } else {
        await new Promise(resolve => setTimeout(resolve, 100));
        computeImmissionPointsFromGUI(usedTrassen);
        console.log('GUI-based immission points calculation complete');
      }
    } catch (error) {
      console.error('Error during GUI-based calculation:', error);
      alert('Fehler bei der GUI-basierten Berechnung: ' + (error as Error).message);
    } finally {
      setIsCalculating(false);
      setLoadingProgress(undefined);
    }
  };
  
  const toggleDropdown = (menu: string) => {
    setDropdownOpen(dropdownOpen === menu ? null : menu);
  };
  
  return (
    <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-sm z-[9999]">
      <div className="flex items-center px-4 h-12 space-x-1">
        {/* Project Name */}
        <div className="flex items-center space-x-2 mr-4">
          <span className="text-sm font-medium text-gray-600">Projekt:</span>
          <span className="text-sm font-semibold text-gray-800">{projectName || 'Unbenanntes Projekt'}</span>
        </div>
        
        {/* Main separator */}
        <div className="h-8 w-px bg-gray-300 mr-2" />
        
        {/* Projekt Menu */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleDropdown('projekt')}
            className="h-8 hover:bg-gray-100"
          >
            <FileText className="h-4 w-4 mr-1" />
            Projekt
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
          
          {dropdownOpen === 'projekt' && (
            <div className="absolute top-full left-0 mt-1 bg-white border rounded-md shadow-lg w-52 py-1 z-[10000]">
              <button
                onClick={() => { handleNewProject(); setDropdownOpen(null); }}
                className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Neues Projekt
              </button>
              <button
                onClick={() => { projectInputRef.current?.click(); setDropdownOpen(null); }}
                className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 flex items-center"
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                Öffnen
              </button>
              <div className="border-t my-1" />
              <button
                onClick={() => { handleExportProject(false); setDropdownOpen(null); }}
                disabled={!hasValidSetup}
                className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4 mr-2" />
                Als JSON speichern
              </button>
              <button
                onClick={() => { handleExportProject(true); setDropdownOpen(null); }}
                disabled={!hasValidSetup}
                className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Archive className="h-4 w-4 mr-2" />
                Als ZIP speichern
              </button>
              <div className="border-t my-1" />
              <button
                onClick={() => { migrationInputRef.current?.click(); setDropdownOpen(null); }}
                disabled={isMigrating}
                className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isMigrating ? 'Transformiere...' : 'Migration aus ZIP'}
              </button>
              <div className="border-t my-1" />
              <button
                onClick={() => { setProjectSettingsDialogOpen(true); setDropdownOpen(null); }}
                className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 flex items-center"
              >
                <Settings className="h-4 w-4 mr-2" />
                Projekteinstellungen {mitFrequenz && "(F)"} {kt !== 0 && `(Kt: ${kt})`}
              </button>
            </div>
          )}
        </div>
        
        {/* Daten Menu */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleDropdown('daten')}
            className="h-8 hover:bg-gray-100"
          >
            <Image className="h-4 w-4 mr-1" />
            Daten
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
          
          {dropdownOpen === 'daten' && (
            <div className="absolute top-full left-0 mt-1 bg-white border rounded-md shadow-lg w-64 py-1 z-[10000]">
              <button
                onClick={() => { imageInputRef.current?.click(); setDropdownOpen(null); }}
                disabled={isLoadingImage}
                className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 flex items-center"
              >
                <Image className="h-4 w-4 mr-2" />
                {isLoadingImage ? 'Lade Bild...' : 
                 projectImage ? 'Lageplan ändern' : 'Lageplan hochladen'}
              </button>
              {projectImage && (
                <div className="px-3 py-2 text-xs text-gray-600">
                  Größe: {imageWidth} × {imageHeight} px
                </div>
              )}
              <div className="border-t my-1" />
              <button
                onClick={async () => {
                  const confirmed = await confirm('Alle Höhen der Objekte (Masten, ESQ, Immissionspunkte) werden an die Geländehöhe angepasst. Fortfahren?');
                  if (confirmed) {
                    useProjectStore.getState().resetAllHeightsToTerrain();
                    alert('Höhen wurden erfolgreich an das Gelände angepasst.');
                  }
                  setDropdownOpen(null);
                }}
                className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100"
              >
                <MapIcon className="h-4 w-4 mr-2 inline" />
                Höhen an Gelände anpassen
              </button>
              <button
                onClick={async () => {
                  const heightStr = await prompt('Höhe für alle Eckpunkte (in Metern):', '100');
                  if (heightStr !== null) {
                    const height = parseFloat(heightStr);
                    if (isNaN(height)) {
                      alert('Ungültige Höhenangabe');
                      return;
                    }
                    
                    // Get transform and image dimensions
                    const state = useProjectStore.getState();
                    if (!transform || !projectImage) {
                      alert('Bitte laden Sie zuerst ein Bild und setzen Sie Referenzpunkte.');
                      return;
                    }
                    
                    // Define corner positions in pixel coordinates
                    const corners = [
                      { x: 0, y: 0, name: 'Ecke_OL' },  // Top-left
                      { x: imageWidth, y: 0, name: 'Ecke_OR' },  // Top-right
                      { x: 0, y: imageHeight, name: 'Ecke_UL' },  // Bottom-left
                      { x: imageWidth, y: imageHeight, name: 'Ecke_UR' }  // Bottom-right
                    ];
                    
                    // Add or update Hoehenpunkte at corners
                    for (const corner of corners) {
                      // Transform pixel to GK coordinates
                      const [gkRechts, gkHoch] = transform.pixelToGK(corner.x, corner.y);
                      
                      // Check if a Hoehenpunkt already exists at this position (within tolerance)
                      const tolerance = 1.0; // 1 meter tolerance
                      let existingId: string | null = null;
                      
                      state.hoehenpunkte.forEach((hp, id) => {
                        if (hp.GK_Vektor && hp.GK_Vektor.GK) {
                          const dx = Math.abs(hp.GK_Vektor.GK.Rechts - gkRechts);
                          const dy = Math.abs(hp.GK_Vektor.GK.Hoch - gkHoch);
                          if (dx < tolerance && dy < tolerance) {
                            existingId = id;
                          }
                        }
                      });
                      
                      if (existingId) {
                        // Update existing Hoehenpunkt
                        state.updateHoehenpunkt(existingId, {
                          GK_Vektor: {
                            GK: {
                              Rechts: gkRechts,
                              Hoch: gkHoch
                            },
                            z: height
                          }
                        });
                      } else {
                        // Add new Hoehenpunkt
                        const position: GKVector3d = {
                          GK: {
                            Rechts: gkRechts,
                            Hoch: gkHoch
                          },
                          z: height
                        };
                        const id = state.addHoehenpunkt(position);
                        if (id) {
                          // Note: Name property doesn't seem to exist on EditableHoehenpunkt
                          // You might need to add it to the type or remove this update
                        }
                      }
                    }
                    
                    alert(`Höhenpunkte mit Höhe ${height}m wurden in allen vier Ecken des Bildes gesetzt.`);
                  }
                  setDropdownOpen(null);
                }}
                className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100"
              >
                <MapIcon className="h-4 w-4 mr-2 inline" />
                Eckpunkte mit Höhe setzen
              </button>
            </div>
          )}
        </div>
        
        {/* Ansicht Menu */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleDropdown('ansicht')}
            className="h-8 hover:bg-gray-100"
          >
            <Layers className="h-4 w-4 mr-1" />
            Ansicht
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
          
          {dropdownOpen === 'ansicht' && (
            <div className="absolute top-full left-0 mt-1 bg-white border rounded-md shadow-lg w-56 py-1 z-[10000]">
              <button
                onClick={() => { setMapLayersDialogOpen(true); setDropdownOpen(null); }}
                className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 flex items-center"
              >
                <Layers className="h-4 w-4 mr-2" />
                Kartenebenen
              </button>
              <button
                onClick={() => { setColorPaletteDialogOpen(true); setDropdownOpen(null); }}
                className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 flex items-center"
              >
                <Palette className="h-4 w-4 mr-2" />
                Farbpaletten
              </button>
              <div className="border-t my-1" />
              <button
                onClick={() => { setShowReferenceCalibration(!showReferenceCalibration); setDropdownOpen(null); }}
                className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 flex items-center"
              >
                <MapPin className="h-4 w-4 mr-2" />
                {showReferenceCalibration ? '✓ ' : ''}Referenzpunkt-Kalibrierung
              </button>
            </div>
          )}
        </div>

        {/* Sample Projects Menu */}
        {SHOW_EXAMPLE_PROJECTS && (
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleDropdown('samples')}
            className="h-8 hover:bg-gray-100"
          >
            <MapIcon className="h-4 w-4 mr-1" />
            Beispiele
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
          
          {dropdownOpen === 'samples' && (
            <div className="absolute top-full left-0 mt-1 bg-white border rounded-md shadow-lg w-56 py-1 z-[10000]">
              {[
                {
                  file: '/src/test/data/simple1.json',
                  name: 'Simple 1',
                  image: '/Lageplan.jpg',
                },
                {
                  file: '/src/test/data/foo1.json',
                  name: 'Foo1',
                  image: '/Lageplan.jpg',
                },
                {
                  file: '/src/test/data/terrain4combined.json',
                  name: 'Terrain 4 Combined',
                  image: '/Lageplan.jpg',
                },
                {
                  file: '/src/test/data/terrain5complex.json',
                  name: 'Terrain 5 Complex',
                  image: '/Lageplan.jpg',
                },
                {
                  file: '/src/test/data/trasse3.json',
                  name: 'Trasse 3',
                  image: '/Lageplan.jpg',
                },
                {
                  file: '/src/test/data/trasse4gelaende.json',
                  name: 'Trasse 4 Gelände',
                  image: '/Lageplan.jpg',
                },
                {
                  file: '/src/test/data/Foo3.json',
                  name: 'Foo3',
                  image: '/Lageplan.jpg',
                },
                {
                  file: '/src/test/data/Foo3TrasseOnly.json',
                  name: 'Foo3 Trasse Only',
                  image: '/Lageplan.jpg',
                },
                {
                  file: '/src/test/data/Tausend_2025_1.json',
                  name: 'Tausend',
                  image: '/Lageplan_Tausend.jpg',
                },
              ].map(({ file, name, image }) => (
                <button
                  key={name}
                  onClick={() => {
                    loadDefaultProject(file, name, image);
                    setDropdownOpen(null);
                  }}
                  className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100"
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>
        )}
        
        {/* Help Menu */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleDropdown('help')}
            className="h-8 hover:bg-gray-100"
          >
            <HelpCircle className="h-4 w-4 mr-1" />
            Hilfe
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
          
          {dropdownOpen === 'help' && (
            <div className="absolute top-full left-0 mt-1 bg-white border rounded-md shadow-lg w-48 py-1 z-[10000]">
              <button
                onClick={() => { 
                  window.open('/Handbuch.pdf', '_blank');
                  setDropdownOpen(null); 
                }}
                className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 flex items-center"
              >
                <FileText className="h-4 w-4 mr-2" />
                Handbuch öffnen (PDF)
              </button>
            </div>
          )}
        </div>
        
        {/* Separator */}
        <div className="h-8 w-px bg-gray-300 mx-2" />
        
        {/* Direct Action Buttons - Most Used Features */}
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTrasseManagerDialogOpen(true)}
            className="h-8 hover:bg-blue-50 hover:text-blue-700"
          >
            <Route className="h-4 w-4 mr-2" />
            Trassen
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setImmissionGridDialogOpen(true)}
            className="h-8 hover:bg-blue-50 hover:text-blue-700"
          >
            <Grid3x3 className="h-4 w-4 mr-2" />
            Immissionsgitter
          </Button>
        </div>
        
        {/* Separator */}
        <div className="h-8 w-px bg-gray-300 mx-2" />
        
        {/* Berechnung Menu */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleDropdown('berechnung')}
            className="h-8 hover:bg-gray-100"
          >
            <Cpu className="h-4 w-4 mr-1" />
            Berechnung
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
          
          {dropdownOpen === 'berechnung' && (
            <div className="absolute top-full left-0 mt-1 bg-white border rounded-md shadow-lg w-64 py-1 z-[10000]">
              <button
                onClick={() => { handleCalculateFromGUI(); setDropdownOpen(null); }}
                disabled={isCalculating || immissionPoints.size === 0}
                className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Cpu className="h-4 w-4 mr-2" />
                {isCalculating ? 'Berechnung läuft...' : 'Immissionspunkte berechnen'}
              </button>
              <div className="border-t my-1" />
              <button
                onClick={() => { setProjectSettingsDialogOpen(true); setDropdownOpen(null); }}
                className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 flex items-center"
              >
                <Settings className="h-4 w-4 mr-2" />
                Berechnungseinstellungen {mitFrequenz && "(F)"} {kt !== 0 && `(Kt: ${kt})`}
              </button>
            </div>
          )}
        </div>

      </div>
      
      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ display: 'none' }}
      />
      
      <input
        ref={projectInputRef}
        type="file"
        accept="application/json,.json,.zip,application/zip"
        onChange={handleImportProject}
        style={{ display: 'none' }}
      />
      
      <input
        ref={migrationInputRef}
        type="file"
        accept=".zip,application/zip"
        onChange={handleMigrateZip}
        style={{ display: 'none' }}
      />
      
      {/* Dialogs */}
      <ImmissionGridDialog
        isOpen={immissionGridDialogOpen}
        onClose={() => setImmissionGridDialogOpen(false)}
        mapWidth={mapWidth}
        mapHeight={mapHeight}
        transform={transform}
      />
      
      <TrasseManagerDialog
        isOpen={trasseManagerDialogOpen}
        onClose={() => setTrasseManagerDialogOpen(false)}
      />
      
      <MapLayersDialog
        isOpen={mapLayersDialogOpen}
        onClose={() => setMapLayersDialogOpen(false)}
        showTrassen={showTrassen}
        setShowTrassen={setShowTrassen}
        showDGM={showDGM}
        setShowDGM={setShowDGM}
        showContour={showContour}
        setShowContour={setShowContour}
        showReferenceCalibration={showReferenceCalibration}
        setShowReferenceCalibration={setShowReferenceCalibration}
      />
      
      <ColorPaletteDialog
        isOpen={colorPaletteDialogOpen}
        onClose={() => setColorPaletteDialogOpen(false)}
      />
      
      <ProjectSettingsDialog
        isOpen={projectSettingsDialogOpen}
        onClose={() => setProjectSettingsDialogOpen(false)}
      />
      
      {/* Image Rotation Dialog */}
      {pendingImageData && (
        <ImageRotationDialog
          isOpen={imageRotationDialogOpen}
          onClose={handleRotationCancel}
          onConfirm={handleRotationConfirm}
          imageUrl={pendingImageData.url}
          originalWidth={pendingImageData.width}
          originalHeight={pendingImageData.height}
        />
      )}
      
      {/* Loading Overlay */}
      <LoadingOverlay 
        isVisible={isCalculating || isMigrating}
        message={loadingMessage}
        progress={loadingProgress}
      />
    </div>
  );
};