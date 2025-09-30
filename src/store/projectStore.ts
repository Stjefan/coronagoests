/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { UsedProjectData, UsedHoehenpunkt, UsedESQ, UsedTrasse, GKVector3d, UsedDGMDreieck, UsedDGMKante, HLeitertypData } from '../types/usedData';
import type { MastLayoutTemplate, EbeneConfig } from '../types/mastLayout';
import { createMastLayoutTemplate, STANDARD_TEMPLATES } from '../types/mastLayout';
import type { 
  TrasseNew, 
  Pole, 
  Level,
  Connection,
  ConnectionLine, 
  PoleTemplate 
} from '../types/trasseUINew';
import { 
  uiToComputation, 
  computationToUI 
} from '../utils/trasseTransformNew';
import { computeTriangulation } from '../utils/triangulation';
import { UsedDataCalculator,} from '../utils/usedDataCalculator';
import { DTMProcessor } from '../utils/dtmProcessor';
import { HelmertTransform } from '../utils/helmertTransform';
import { calculateParabolaParametersForAll } from '../utils/parabolaCalculator';
import { createConnection } from '../utils/UIFactory';

export type EditMode = 'view' | 'add' | 'edit' | 'delete';
export type ElementType = 'hoehenpunkt' | 'esq' | 'pole' | 'immissionpoint';
export type ContourDisplayMode = 'total' | 'esq' | 'trassen';
export type MarkerType = 'hoehenpunkt' | 'immissionpoint' | 'esq' | 'pole';

export interface ReferencePoint {
  id: string;
  pixelX: number;
  pixelY: number;
  gkRechts: number;
  gkHoch: number;
  label: string;
}

export interface EditableHoehenpunkt extends Omit<UsedHoehenpunkt, 'LfdNummer'> {
  id: string;
}

export interface EditableESQ extends Omit<UsedESQ, 'OriginalData'> {
  id: string;
}

export interface EditableImmissionPoint {
  id: string;
  Name: string;
  Position: GKVector3d;
  HeightOffset: number;
  G_Bodenfaktor: number;
}

// Conductor connection identifier for GUI
export interface ConductorConnection {
  mastId: string;      // Target mast ID
  ebeneNum: number;    // Target level number (1-based)
  side: 'left' | 'right';  // Target side
  leiterNum: number;   // Target conductor number (1-based)
}

interface ProjectStore {
  // Project management
  projectName: string;
  projectImage: string | null; // Base64 or blob URL
  imageWidth: number;
  imageHeight: number;
  referencePoints: ReferencePoint[];
  
  // Original data (read-only reference)
  originalData: UsedProjectData | null;
  
  // Editable elements stored by UUID
  hoehenpunkte: Map<string, EditableHoehenpunkt>;
  esqSources: Map<string, EditableESQ>;
  immissionPoints: Map<string, EditableImmissionPoint>;

  leiterTypes: Map<string, HLeitertypData>;  // Conductor types with their noise levels
  
  // New UI data structures
  trassenNew: Map<string, TrasseNew>;
  poles: Map<string, Pole>;
  connectionLines: Map<string, ConnectionLine>;
  poleTemplates: Map<string, PoleTemplate>;
  
  // Computed elements (auto-generated from Hoehenpunkte)
  dgmDreiecke: UsedDGMDreieck[];
  dgmKanten: UsedDGMKante[];
  
  // Immission grid state
  immissionGrid: Array<{ x: number; y: number; value: number }>;
  immissionGridDetailed: Array<{ x: number; y: number; total: number; esq: number; trassen: number }>;
  contourDisplayMode: ContourDisplayMode;
  immissionGridSettings: {
    gridSizeX: number;
    gridSizeY: number;
    heightOffset: number;
    legendMode: 'auto' | 'custom';
    legendMinValue: number;
    legendIntervalSize: number;
    legendIntervalCount: number;
    opacity: number;
  };
  showImmissionGrid: boolean;
  showGridPoints: boolean;
  isCalculatingGrid: boolean;
  gridCalculationProgress: { current: number; total: number } | null;
  
  // Marker visibility controls
  showImmissionPoints: boolean;
  showESQPoints: boolean;
  showHoehenpunkte: boolean;
  showPoles: boolean;
  showReferencePoints: boolean;
  
  // Calculator instance
  calculator: UsedDataCalculator | null;
  
  // DTM processor instance
  dtmProcessor: DTMProcessor | null;
  
  // Color palette settings
  colorPalettes: {
    dgm: string;
    immissionGrid: string;
  };
  
  // Computation settings
  mitFrequenz: boolean;  // Enable frequency-dependent computation
  kt: number;  // Ton- und Informationshaltigkeit (tone and information content)
  
  // Error handling
  computationErrors: string[];  // Store computation errors to display to user
  
  // UI state
  editMode: EditMode;
  selectedElementType: ElementType;
  selectedElementId: string | null;
  isEditFormOpen: boolean;
  
  // Marker selection and highlighting
  selectedMarkerType: MarkerType | null;
  focusedMarkerId: string | null;
  markerHighlightColors: Map<MarkerType, { normal: string; highlighted: string; focused: string }>;
  
  // Actions
  loadProjectData: (data: UsedProjectData) => void;
  setEditMode: (mode: EditMode) => void;
  setSelectedElementType: (type: ElementType) => void;
  selectElement: (id: string | null) => void;
  setEditFormOpen: (open: boolean) => void;
  
  // Project management actions
  createNewProject: (name: string) => void;
  setProjectImage: (imageUrl: string, width: number, height: number) => void;
  addReferencePoint: (point: ReferencePoint) => void;
  updateReferencePoint: (id: string, point: Partial<ReferencePoint>) => void;
  deleteReferencePoint: (id: string) => void;
  setProjectName: (name: string) => void;
  
  // Hoehenpunkt actions
  addHoehenpunkt: (position: GKVector3d) => string;
  updateHoehenpunkt: (id: string, data: Partial<EditableHoehenpunkt>) => void;
  deleteHoehenpunkt: (id: string) => void;
  
  // ESQ actions
  addESQ: (position: GKVector3d) => string;
  updateESQ: (id: string, data: Partial<EditableESQ>) => void;
  deleteESQ: (id: string) => void;
  
  // ImmissionPoint actions
  addImmissionPoint: (position: GKVector3d) => string;
  updateImmissionPoint: (id: string, data: Partial<EditableImmissionPoint>) => void;
  deleteImmissionPoint: (id: string) => void;


  
  // Mast Layout Template actions
  addMastLayoutTemplate: (template: MastLayoutTemplate) => string;
  updateMastLayoutTemplate: (id: string, template: MastLayoutTemplate) => void;
  deleteMastLayoutTemplate: (id: string) => void;
  loadStandardTemplates: () => void;
  
  // New UI structure actions
  addTrasseNew: (name: string, templateId: string) => string;
  updateTrasseNew: (id: string, data: Partial<TrasseNew>) => void;
  deleteTrasseNew: (id: string) => void;
  addPole: (trasseId: string, position: GKVector3d) => string;
  // addPole: (trasseId: string, pole: Pole) => string;
  updatePole: (id: string, data: Partial<Pole>) => void;
  deletePole: (id: string) => void;
  addConnectionLine: (line: ConnectionLine) => string;
  updateConnectionLine: (id: string, data: Partial<ConnectionLine>) => void;
  deleteConnectionLine: (id: string) => void;
  // convertTrasseToNewFormat: (trasseId: string) => void;
  convertNewFormatToComputation: (trasseId: string) => UsedTrasse | null;
  
  // Terrain height functions
  resetAllHeightsToTerrain: () => void;
  
  // Utility
  exportProjectData: () => UsedProjectData;
  clearAll: () => void;
  
  // Calculator methods
  calculateImmissionValue: (immissionPointId: string) => number;
  getCachedImmissionValue: (immissionPointId: string) => number;
  computeImmissionPointsFromGUI: (usedTrassen: UsedTrasse[]) => void;
  clearImmissionCache: () => void;
  // setComputationEnabled: (enabled: boolean) => void;
  clearComputationErrors: () => void;
  isImmissionPointsComputed: boolean;
  isGridComputed: boolean;
  cachedImmissionValues: Map<string, number>;
  isComputationEnabled: boolean;
  
  // Immission grid methods
  generateImmissionGrid: (mapWidth: number, mapHeight: number, transform: HelmertTransform | null) => Promise<void>;
  clearImmissionGrid: () => void;
  setShowImmissionGrid: (show: boolean) => void;
  setShowGridPoints: (show: boolean) => void;
  setShowImmissionPoints: (show: boolean) => void;
  setShowESQPoints: (show: boolean) => void;
  setShowHoehenpunkte: (show: boolean) => void;
  setShowPoles: (show: boolean) => void;
  setShowReferencePoints: (show: boolean) => void;
  updateImmissionGridSettings: (settings: Partial<ProjectStore['immissionGridSettings']>) => void;
  getInterpolatedGridValue: (px: number, py: number, mapWidth: number, mapHeight: number) => number | null;
  getInterpolatedDetailedGridValue: (px: number, py: number, mapWidth: number, mapHeight: number, displayMode: ContourDisplayMode) => number | null;
  setContourDisplayMode: (mode: ContourDisplayMode) => void;
  
  // Helper methods
  hasValidTransformation: () => boolean;
  recomputeTriangulation: () => void;
  addCornerHoehenpunkte: () => number | undefined;
  
  // LeiterType management
  addLeiterType: (leiterType: HLeitertypData) => void;
  updateLeiterType: (name: string, leiterType: HLeitertypData) => void;
  deleteLeiterType: (name: string) => void;
  
  // Color palette management
  setColorPalette: (type: 'dgm' | 'immissionGrid', palette: string) => void;
  
  // Computation settings
  setMitFrequenz: (enabled: boolean) => void;
  setKt: (value: number) => void;
  
  // Marker selection actions
  setSelectedMarkerType: (type: MarkerType | null) => void;
  setFocusedMarkerId: (id: string | null) => void;
  focusToNextMarker: () => void;
  focusToPreviousMarker: () => void;
  clearMarkerSelection: () => void;
  getMarkersByType: (type: MarkerType) => Array<{ id: string; position: [number, number] }>;

  mastLayoutTemplates: Map<string, MastLayoutTemplate>;
}

// Default leiterTypes that are always loaded
const getDefaultLeiterTypes = () => {
  const defaultTypes = new Map<string, HLeitertypData>();
  
  // Add a default 80dB leiterType
  defaultTypes.set('L_80dB', {
    Name: 'L_80dB',
    SchallLW: 80,
  });
  
  return defaultTypes;
};

export const useProjectStore = create<ProjectStore>((set, get) => ({

  // Initial state
  projectName: 'Neues Projekt',
  projectImage: null,
  imageWidth: 893,
  imageHeight: 639,
  referencePoints: [],
  originalData: null,
  hoehenpunkte: new Map(),
  esqSources: new Map(),
  immissionPoints: new Map(),
  leiterTypes: getDefaultLeiterTypes(),  // Initialize with default leiterTypes
  trassenNew: new Map(),
  poles: new Map(),
  connectionLines: new Map(),
  poleTemplates: new Map(),
  dgmDreiecke: [],
  dgmKanten: [],
  immissionGrid: [],
  immissionGridDetailed: [],
  contourDisplayMode: 'total' as ContourDisplayMode,
  immissionGridSettings: {
    gridSizeX: 10,
    gridSizeY: 10,
    heightOffset: 1.5,
    legendMode: 'auto',
    legendMinValue: 0,
    legendIntervalSize: 10,
    legendIntervalCount: 5,
    opacity: 0.6,
  },
  showImmissionGrid: false,
  showGridPoints: false,
  isCalculatingGrid: false,
  gridCalculationProgress: null,
  showImmissionPoints: true,
  showESQPoints: true,
  showHoehenpunkte: true,
  showPoles: true,
  showReferencePoints: true,
  cachedImmissionValues: new Map(),
  isComputationEnabled: false,
  isImmissionPointsComputed: false,
  isGridComputed: false,
  calculator: null,
  dtmProcessor: null,
  colorPalettes: {
    dgm: 'YlOrBr',
    immissionGrid: 'RdYlGn'
  },
  mitFrequenz: false,  // Default to non-frequency mode
  kt: 0,  // Default to 0 for Ton- und Informationshaltigkeit
  computationErrors: [],  // Initialize empty error array
  editMode: 'view',
  selectedElementType: 'hoehenpunkt',
  selectedElementId: null,
  isEditFormOpen: false,
  mastLayoutTemplates: new Map(),
  
  // Marker selection initial state
  selectedMarkerType: null,
  focusedMarkerId: null,
  markerHighlightColors: new Map([
    ['hoehenpunkt', { normal: '#44ff44', highlighted: '#00ff00', focused: '#00ff00' }],
    ['immissionpoint', { normal: '#ff4444', highlighted: '#ff0000', focused: '#ff0000' }],
    ['esq', { normal: '#4444ff', highlighted: '#0000ff', focused: '#0000ff' }],
    ['pole', { normal: '#8B4513', highlighted: '#D2691E', focused: '#D2691E' }],
  ]),
  // Load project data and convert to editable format
  loadProjectData: (data) => {
    const hoehenpunkte = new Map<string, EditableHoehenpunkt>();
    const esqSources = new Map<string, EditableESQ>();
    const immissionPoints = new Map<string, EditableImmissionPoint>();

    const mastLayoutTemplates = new Map<string, MastLayoutTemplate>();
    let leiterTypes = new Map<string, HLeitertypData>();  // Using let since we reassign it
    const referencePoints: ReferencePoint[] = [];
    
    // New UI structures
    const trassenNew = new Map<string, TrasseNew>();
    const poles = new Map<string, Pole>();
    const connectionLines = new Map<string, ConnectionLine>();
    const poleTemplates = new Map<string, PoleTemplate>();
    
    console.log('loadProjectData - Checking for reference points:', {
      hasReferencePoints: !!(data).ReferencePoints,
      hasGKR_A: data.GKR_A !== undefined,
      hasGKH_A: data.GKH_A !== undefined,
      hasPX_A: data.PX_A !== undefined,
      hasPY_A: data.PY_A !== undefined,
      GKR_A: data.GKR_A,
      GKH_A: data.GKH_A,
      PX_A: data.PX_A,
      PY_A: data.PY_A
    });
    
    // First check if we have the custom ReferencePoints field (for projects with 2+ points)
    if (data.ReferencePoints && Array.isArray(data.ReferencePoints)) {
      console.log('Loading from ReferencePoints array:', (data).ReferencePoints);
      (data).ReferencePoints.forEach((rp) => {
        referencePoints.push({
          id: uuidv4(),
          pixelX: rp.pixelX,
          pixelY: rp.pixelY,
          gkRechts: rp.gkRechts,
          gkHoch: rp.gkHoch,
          label: rp.label || String.fromCharCode(65 + referencePoints.length)
        });
      });
    } else {
      // Load reference points from legacy format - support any number of points (A, B, C, ...)
      const refPointLetters = ['A', 'B',];
      
      for (const letter of refPointLetters) {
        const gkrKey = `GKR_${letter}` as keyof typeof data;
        const gkhKey = `GKH_${letter}` as keyof typeof data;
        const pxKey = `PX_${letter}` as keyof typeof data;
        const pyKey = `PY_${letter}` as keyof typeof data;
        
        if ((data)[gkrKey] !== undefined && (data)[gkhKey] !== undefined && 
            (data)[pxKey] !== undefined && (data)[pyKey] !== undefined) {
          console.log(`Loading reference point ${letter} from legacy format`);
          referencePoints.push({
            id: uuidv4(),
            pixelX: (data)[pxKey] as number,
            pixelY: (data)[pyKey] as number,
            gkRechts: (data)[gkrKey] as number,
            gkHoch: (data)[gkhKey] as number,
            label: letter
          });
        }
      }
    }
    
    console.log('Final reference points loaded:', referencePoints);
    
    // Load image dimensions if available and not zero
    let imageWidth = 893;
    let imageHeight = 639;
    console.log("Found image width and height: ", data.IM_X_max, data.IM_Y_max);
    if (data.IM_X_max && data.IM_X_max > 0) {
      imageWidth = data.IM_X_max;
    }
    if (data.IM_Y_max && data.IM_Y_max > 0) {
      imageHeight = data.IM_Y_max;
    }
    
    // Check if image data is embedded in the project
    let projectImage = null;
    if ((data).ImageData) {
      projectImage = (data).ImageData;
    }
    
    // Convert Hoehenpunkte
    data.Hoehenpunkte?.forEach((hp) => {
      const id = uuidv4();
      hoehenpunkte.set(id, {
        id,
        GK_Vektor: hp.GK_Vektor,
      });
    });
    
    // Convert ESQ Sources
    data.ESQSources?.forEach((esq) => {
      const id = uuidv4();
      esqSources.set(id, {
        id,
        Bezeichnung: esq.Bezeichnung,
        Position: esq.Position,
        Hoehe: esq.Hoehe,
        Raumwinkelmass: esq.Raumwinkelmass,
        Beurteilungszeitraum: esq.Beurteilungszeitraum,
        Schallleistungspegel: esq.Schallleistungspegel,
        L: esq.L,
        S: esq.S,
        Z_Impulshaltigkeit: esq.Z_Impulshaltigkeit,
        Z_Tonhaltigkeit: esq.Z_Tonhaltigkeit,
        Z_Cmet: esq.Z_Cmet,
        Ruhezeitzuschlag: esq.Ruhezeitzuschlag,
        Einwirkzeit: esq.Einwirkzeit,
        Zeiteinheit: esq.Zeiteinheit,
      });
    });
    
    // Convert ImmissionPoints
    data.ImmissionPoints?.forEach((ip) => {
      const id = uuidv4();
      immissionPoints.set(id, {
        id,
        Name: ip.Name,
        Position: ip.Position,
        HeightOffset: ip.HeightOffset,
        G_Bodenfaktor: ip.G_Bodenfaktor,
      });
    });
    
    // Start with default leiterTypes
    leiterTypes = getDefaultLeiterTypes();
    
    // Convert and merge LeiterTypes (conductor types with noise levels)
    data.LeiterTypes?.forEach((lt) => {
      // Use trimmed name as the key for easy lookup
      const name = lt.Name.trim();
      leiterTypes.set(name, {
        Name: name,
        SchallLW: lt.SchallLW,
      });
    });
    
    // Convert Trassen and Masts - both old and new formats
    data.Trassen?.forEach((trasse) => {
      const trasseId = uuidv4();
      const mastIds: string[] = [];
      
      // Generate a template ID that will be used for both old and new formats
      const templateId = `template_${trasseId}`;
      
      // Convert to new UI format - pass the trasseId to preserve UUID
      const uiResult = computationToUI(trasse, templateId, trasseId);
      
      // Store the new UI structures - now uses the UUID as key
      trassenNew.set(trasseId, uiResult.trasse);
      uiResult.poles.forEach((pole) => {
        poles.set(pole.id, pole);
      });
      uiResult.connectionLines.forEach((line) => {
        connectionLines.set(line.id, line);
      });
      
      // Also create pole template if not exists
      if (!poleTemplates.has(templateId) && trasse.UsedMasten.length > 0) {
        const firstMast = trasse.UsedMasten[0];
        const poleTemplate: PoleTemplate = {
          id: templateId,
          name: `Template for ${trasse.Name}`,
          description: `Auto-generated from ${trasse.Name}`,
          levels: firstMast.UsedEbenen.map((ebene) => ({
            levelNumber: ebene.NummerEbene,
            defaultHeight: ebene.AbstandNullpunkt,
            leftConnections: ebene.UsedLeitungenLinks.length,
            rightConnections: ebene.UsedLeitungenRechts.length,
          })),
        };
        poleTemplates.set(templateId, poleTemplate);
      }
      
      // Keep old format for backward compatibility (for now)
      // Extract template from first mast if available
      let oldTemplateId: string | undefined;
      
      if (trasse.UsedMasten && trasse.UsedMasten.length > 0) {
        const firstMast = trasse.UsedMasten[0];
        if (firstMast.UsedEbenen && firstMast.UsedEbenen.length > 0) {
          // Create a template based on the first mast's configuration
          const ebenenConfig: EbeneConfig[] = firstMast.UsedEbenen.map((ebene, index) => ({
            nummerEbene: index + 1,  // Use index + 1 for consistent numbering
            anzahlLeitungenLinks: ebene.UsedLeitungenLinks?.length || 0,
            anzahlLeitungenRechts: ebene.UsedLeitungenRechts?.length || 0,
          }));
          
          // Use the same template ID as the new format
          oldTemplateId = templateId;
          
          // Create the template
          const template: MastLayoutTemplate = {
            id: oldTemplateId,
            name: `Template für ${trasse.Name}`,
            description: `Auto-generiert aus ${trasse.Name} Konfiguration`,
            anzahlEbenen: firstMast.UsedEbenen.length,
            ebenenConfig: ebenenConfig,
          };
          
          mastLayoutTemplates.set(oldTemplateId, template);
          
  
        }
      }
      
      trasse.UsedMasten?.forEach(() => {
        const mastId = uuidv4();
        mastIds.push(mastId);
       
      });
      
    
    });
    
    // Calculate parabola parameters for all trassen before creating calculator
    if (data.Trassen && data.Trassen.length > 0) {
      console.log('Calculating parabola parameters for loaded trassen...');
      calculateParabolaParametersForAll(data.Trassen);
    }
    
    // Create calculator instance with DTM processor
    // First create DTM processor from the loaded data
    const dtmProcessor = new DTMProcessor(data.DGMDreiecke || [], data.Hoehenpunkte || []);
    dtmProcessor.setDGMKante(data.DGMKanten || []);
    
    const calculator = new UsedDataCalculator(data, dtmProcessor);
    
    set({
      
      originalData: data,
      hoehenpunkte,
      esqSources,
      immissionPoints,

      leiterTypes,
      // New UI structures
      trassenNew,
      poles,
      connectionLines,
      poleTemplates,
      mastLayoutTemplates,  // Add this to pass the templates to the store
      
      // Load computation settings
      mitFrequenz: data.mitFrequenz || false,
      kt: data.Kt !== undefined ? data.Kt : 0,  // Load Kt parameter, default to 0
      calculator,
      dtmProcessor,
      referencePoints,
      imageWidth,
      imageHeight,
      projectImage,
      projectName: data.Name || 'Imported Project',
      // Clear computed immission values when loading new project
      cachedImmissionValues: new Map(),
      isImmissionPointsComputed: false,
      isGridComputed: false,
      immissionGrid: [],
      immissionGridDetailed: [],
      showImmissionGrid: false,
      showGridPoints: false
    });
    
    // Compute initial triangulation
    get().recomputeTriangulation();
    console.log("Loading finished with image width and height: ", imageWidth, imageHeight);
  },
  
  // UI state actions
  setEditMode: (mode) => set({ editMode: mode }),
  setSelectedElementType: (type) => set({ selectedElementType: type }),
  selectElement: (id) => set({ selectedElementId: id }),
  setEditFormOpen: (open) => set({ isEditFormOpen: open }),
  
  // Marker selection actions
  setSelectedMarkerType: (type) => set({ 
    selectedMarkerType: type,
    focusedMarkerId: null  // Reset focused marker when changing type
  }),
  
  setFocusedMarkerId: (id) => set({ focusedMarkerId: id }),
  
  clearMarkerSelection: () => set({
    selectedMarkerType: null,
    focusedMarkerId: null
  }),
  
  getMarkersByType: (type) => {
    const state = get();
    const markers: Array<{ id: string; position: [number, number] }> = [];
    
    switch (type) {
      case 'hoehenpunkt':
        state.hoehenpunkte.forEach((punkt, id) => {
          markers.push({
            id,
            position: [punkt.GK_Vektor.GK.Rechts, punkt.GK_Vektor.GK.Hoch]
          });
        });
        break;
      case 'immissionpoint':
        state.immissionPoints.forEach((point, id) => {
          markers.push({
            id,
            position: [point.Position.GK.Rechts, point.Position.GK.Hoch]
          });
        });
        break;
      case 'esq':
        state.esqSources.forEach((source, id) => {
          markers.push({
            id,
            position: [source.Position.GK.Rechts, source.Position.GK.Hoch]
          });
        });
        break;
      case 'pole':
        state.poles.forEach((pole, id) => {
          if (pole.position) {
            markers.push({
              id,
              position: [pole.position.GK.Rechts, pole.position.GK.Hoch]
            });
          }
        });
        break;
    }
    
    return markers;
  },
  
  focusToNextMarker: () => {
    const state = get();
    if (!state.selectedMarkerType) return;
    
    const markers = state.getMarkersByType(state.selectedMarkerType);
    if (markers.length === 0) return;
    
    const currentIndex = state.focusedMarkerId 
      ? markers.findIndex(m => m.id === state.focusedMarkerId)
      : -1;
    
    const nextIndex = (currentIndex + 1) % markers.length;
    set({ focusedMarkerId: markers[nextIndex].id });
  },
  
  focusToPreviousMarker: () => {
    const state = get();
    if (!state.selectedMarkerType) return;
    
    const markers = state.getMarkersByType(state.selectedMarkerType);
    if (markers.length === 0) return;
    
    const currentIndex = state.focusedMarkerId 
      ? markers.findIndex(m => m.id === state.focusedMarkerId)
      : 0;
    
    const prevIndex = (currentIndex - 1 + markers.length) % markers.length;
    set({ focusedMarkerId: markers[prevIndex].id });
  },
  
  // Project management actions
  createNewProject: (name) => {
    set({
      projectName: name,
      projectImage: null,
      imageWidth: 893,
      imageHeight: 639,
      referencePoints: [],
      originalData: null,
      hoehenpunkte: new Map(),
      esqSources: new Map(),
      immissionPoints: new Map(),
      leiterTypes: getDefaultLeiterTypes(),  // Reset to default leiterTypes
      // New UI structures
      trassenNew: new Map(),
      poles: new Map(),
      connectionLines: new Map(),
      poleTemplates: new Map(),
      dgmDreiecke: [],
      dgmKanten: [],
      immissionGrid: [],
      immissionGridDetailed: [],
      calculator: null,
      dtmProcessor: null,
      // Clear computed immission values
      cachedImmissionValues: new Map(),
      isImmissionPointsComputed: false,
      isGridComputed: false,
      showImmissionGrid: false,
      showGridPoints: false
    });
  },
  
  setProjectImage: (imageUrl, width, height) => {
    console.log('setProjectImage called with:', { 
      imageUrl: imageUrl.substring(0, 50) + '...', 
      width, 
      height,
      stack: new Error().stack?.split('\n').slice(1, 4).join('\n')
    });
    set({
      projectImage: imageUrl,
      imageWidth: width,
      imageHeight: height,
    });
  },
  
  addReferencePoint: (point) => {
    set((state) => ({
      referencePoints: [...state.referencePoints, point],
    }));
  },
  
  updateReferencePoint: (id, updates) => {
    set((state) => ({
      referencePoints: state.referencePoints.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    }));
  },
  
  deleteReferencePoint: (id) => {
    set((state) => {
      const newReferencePoints = state.referencePoints.filter((p) => p.id !== id);
      
      // Check if we still have a valid transformation (at least 2 points)
      if (newReferencePoints.length < 2) {
        console.log('Less than 2 reference points remaining, clearing transformed elements');
        
        // Clear all elements that depend on transformation
        return {
          referencePoints: newReferencePoints,
          hoehenpunkte: new Map(),
          esqSources: new Map(),
          immissionPoints: new Map(),
          trassenNew: new Map(),
          poles: new Map(),
          connections: new Map(),
          connectionLines: new Map()
        };
      }
      
      return {
        referencePoints: newReferencePoints
      };
    });
  },
  
  setProjectName: (name) => {
    set({ projectName: name });
  },
  
  // Hoehenpunkt actions
  addHoehenpunkt: (position) => {
    const state = get();
    
    // Check if we have a valid transformation
    if (!state.hasValidTransformation()) {
      console.warn('Cannot add Hoehenpunkt: No valid transformation available (need at least 2 reference points)');
      return '';
    }
    
    const id = uuidv4();
    const hoehenpunkt: EditableHoehenpunkt = {
      id,
      GK_Vektor: position,
    };
    
    set((state) => {
      const newHoehenpunkte = new Map(state.hoehenpunkte);
      newHoehenpunkte.set(id, hoehenpunkt);
      return { hoehenpunkte: newHoehenpunkte };
    });
    
    get().recomputeTriangulation();
    // Clear immission calculations when terrain changes
    get().clearImmissionCache();
    get().clearImmissionGrid();
    return id;
  },
  
  updateHoehenpunkt: (id, data) => {
    set((state) => {
      const newHoehenpunkte = new Map(state.hoehenpunkte);
      const existing = newHoehenpunkte.get(id);
      if (existing) {
        newHoehenpunkte.set(id, { ...existing, ...data });
        console.log('Updated Hoehenpunkt:', id, 'New data:', { ...existing, ...data });
      }
      return { hoehenpunkte: newHoehenpunkte };
    });
    
    console.log('Triggering recomputeTriangulation after Hoehenpunkt update');
    get().recomputeTriangulation();
    // Clear immission calculations when terrain changes
    get().clearImmissionCache();
    get().clearImmissionGrid();
  },
  
  deleteHoehenpunkt: (id) => {
    set((state) => {
      const newHoehenpunkte = new Map(state.hoehenpunkte);
      newHoehenpunkte.delete(id);
      return { hoehenpunkte: newHoehenpunkte };
    });
    
    get().recomputeTriangulation();
    // Clear immission calculations when terrain changes
    get().clearImmissionCache();
    get().clearImmissionGrid();
  },
  
  // ESQ actions
  addESQ: (position) => {
    const state = get();
    
    // Check if we have a valid transformation
    if (!state.hasValidTransformation()) {
      console.warn('Cannot add ESQ: No valid transformation available (need at least 2 reference points)');
      return '';
    }
    
    const id = uuidv4();
    const esq: EditableESQ = {
      id,
      Bezeichnung: 'Neue ESQ',
      Position: position,
      Hoehe: 0,
      Raumwinkelmass: 0,
      Beurteilungszeitraum: 0,
      Schallleistungspegel: true,
      L: 85,
      S: 0,
      Z_Impulshaltigkeit: 0,
      Z_Tonhaltigkeit: 0,
      Z_Cmet: 0,
      Ruhezeitzuschlag: false,
      Einwirkzeit: 16,
      Zeiteinheit: 2,
    };
    
    set((state) => {
      const newESQ = new Map(state.esqSources);
      newESQ.set(id, esq);
      return { esqSources: newESQ };
    });
    
    // Clear immission calculations when ESQ changes
    get().clearImmissionCache();
    get().clearImmissionGrid();
    
    return id;
  },
  
  updateESQ: (id, data) => {
    set((state) => {
      const newESQ = new Map(state.esqSources);
      const existing = newESQ.get(id);
      if (existing) {
        newESQ.set(id, { ...existing, ...data });
      }
      return { esqSources: newESQ };
    });
    
    // Clear immission calculations when ESQ changes
    get().clearImmissionCache();
    get().clearImmissionGrid();
  },
  
  deleteESQ: (id) => {
    set((state) => {
      const newESQ = new Map(state.esqSources);
      newESQ.delete(id);
      return { esqSources: newESQ };
    });
    
    // Clear immission calculations when ESQ changes
    get().clearImmissionCache();
    get().clearImmissionGrid();
  },
  
  // ImmissionPoint actions
  addImmissionPoint: (position) => {
    const state = get();
    
    // Check if we have a valid transformation
    if (!state.hasValidTransformation()) {
      console.warn('Cannot add ImmissionPoint: No valid transformation available (need at least 2 reference points)');
      return '';
    }
    
    const id = uuidv4();
    const immissionPoint: EditableImmissionPoint = {
      id,
      Name: 'Neuer Immissionspunkt',
      Position: position,
      HeightOffset: 0,
      G_Bodenfaktor: 1,
    };
    
    set((state) => {
      const newImmissionPoints = new Map(state.immissionPoints);
      newImmissionPoints.set(id, immissionPoint);
      // Clear the immission points computation flag
      return { 
        immissionPoints: newImmissionPoints,
        isImmissionPointsComputed: false
      };
    });
    
    return id;
  },
  
  updateImmissionPoint: (id, data) => {
    set((state) => {
      const newImmissionPoints = new Map(state.immissionPoints);
      const existing = newImmissionPoints.get(id);
      if (existing) {
        newImmissionPoints.set(id, { ...existing, ...data });
      }
      // Clear the immission points computation flag
      return { 
        immissionPoints: newImmissionPoints,
        isImmissionPointsComputed: false
      };
    });
  },
  
  deleteImmissionPoint: (id) => {
    set((state) => {
      const newImmissionPoints = new Map(state.immissionPoints);
      newImmissionPoints.delete(id);
      return { immissionPoints: newImmissionPoints };
    });
  },
  
  // Mast actions
  addPole: (trasseId: string, position: GKVector3d) => {
    console.log('addMast called with trasseId:', trasseId, 'position:', position);
    const state = get();
    
    // Check if we have a valid transformation
    if (!state.hasValidTransformation()) {
      console.warn('Cannot add Mast: No valid transformation available (need at least 2 reference points)');
      return '';
    }
    
    // Check if we have a trasseNew with this ID
    const trasseNew = state.trassenNew.get(trasseId);
    console.log('trasseNew found:', trasseNew);
    console.log('All trassenNew IDs:', Array.from(state.trassenNew.keys()));
    
    if (trasseNew) {
      // Use new structure - add a pole instead of a mast
      console.log('Using new structure for trasseId:', trasseId);
      const templateId = trasseNew.templateId;
      
      // Try to get the MastLayoutTemplate first
      const mastLayoutTemplate = state.mastLayoutTemplates.get(templateId);
      console.log('Template ID:', templateId, 'MastLayoutTemplate found:', mastLayoutTemplate);
      
      // Convert MastLayoutTemplate to PoleTemplate structure
      let poleTemplate: PoleTemplate;
      if (mastLayoutTemplate) {
        // Convert from MastLayoutTemplate to PoleTemplate
        poleTemplate = {
          id: templateId,
          name: mastLayoutTemplate.name,
          description: mastLayoutTemplate.description,
          levels: mastLayoutTemplate.ebenenConfig.map((ebene) => ({
            levelNumber: ebene.nummerEbene,
            defaultHeight: 50 - (ebene.nummerEbene - 1) * 10, // Default spacing
            leftConnections: ebene.anzahlLeitungenLinks,
            rightConnections: ebene.anzahlLeitungenRechts,
          }))
        };
      } else {
        // Fallback: create a default template
        console.warn('No MastLayoutTemplate found for ID:', templateId, 'Creating default');
        poleTemplate = {
          id: templateId,
          name: 'Default Template',
          description: 'Auto-generated template',
          levels: [
            {
              levelNumber: 1,
              defaultHeight: 50,
              leftConnections: 3,
              rightConnections: 3,
            }
          ]
        };
      }
      
      // Generate pole ID
      const poleCount = trasseNew.poleIds.length;
      const poleId = `pole_${trasseId}_${poleCount + 1}`;
      
      // Create pole from template
      const pole: Pole = {
        id: poleId,
        trasseId: trasseId,
        name: `Mast ${poleCount + 1}`,
        position: position,
        poleHeight: 60,
        nullpunktHeight: position.z, // Set nullpunktHeight to terrain height
        orientation: { x: 0, y: 1, Length: 1 },
        gkOrientation: { Rechts: 0, Hoch: 1 },
        levels: []
      };
      
      // Create levels from template
      for (const levelTemplate of poleTemplate.levels) {
        const level: Level = {
          levelNumber: levelTemplate.levelNumber,
          levelHeight: levelTemplate.defaultHeight,
          leftConnections: [],
          rightConnections: []
        };
        
        // Create left connections
        for (let i = 0; i < levelTemplate.leftConnections; i++) {
          const connection: Connection = createConnection(pole.id, levelTemplate.levelNumber, 'left', i + 1, 5 + i * 2, 2.5, 0);
          // const connection: Connection = {
          //   id: getConnectionId(pole.id, levelTemplate.levelNumber, 'left', i + 1),
          //   poleId: pole.id,
          //   levelNumber: levelTemplate.levelNumber,
          //   side: 'left',  
          //   connectionNumber: i + 1,
          //   horizontalDistance2Pole: 5 + i * 2,  // Default spacing
          //   isolatorLength: 2.5,
          //   einbauart: 0,
          // };
          level.leftConnections.push(connection);
        }
        
        // Create right connections
        for (let i = 0; i < levelTemplate.rightConnections; i++) {
            const connection: Connection = createConnection(pole.id, levelTemplate.levelNumber, 'right', i + 1, 5 + i * 2, 2.5, 0);
          level.rightConnections.push(connection);
        }
        
        pole.levels.push(level);
      }
      
      // If there are existing poles, try to connect to the previous pole
      if (trasseNew.poleIds.length > 0) {
        const prevPoleId = trasseNew.poleIds[trasseNew.poleIds.length - 1];
        const prevPole = state.poles.get(prevPoleId);
        
        if (prevPole) {
          // Auto-connect matching levels
          for (const prevLevel of prevPole.levels) {
            const newLevel = pole.levels.find(l => l.levelNumber === prevLevel.levelNumber);
            if (newLevel) {
              // Connect left to left connections
              const leftCount = Math.min(prevLevel.leftConnections.length, newLevel.leftConnections.length);
              for (let i = 0; i < leftCount; i++) {
                const fromConn = prevLevel.leftConnections[i];
                const toConn = newLevel.leftConnections[i];
                fromConn.connected2Connection = toConn.id;
                
                // Create connection line
                const connectionLine: ConnectionLine = {
                  id: `line_${prevPoleId}_${poleId}_L${prevLevel.levelNumber}_L${i + 1}`,
                  trasseId: trasseId,
                  fromConnectionId: fromConn.id,
                  toConnectionId: toConn.id,
                  connectionLineType: 'L_80dB',
                  maxSag: 5,
                  operatingVoltage: 380,
                  soundPowerLevel: 80
                };
                
                // Add connection line
                set((state) => {
                  const newLines = new Map(state.connectionLines);
                  newLines.set(connectionLine.id, connectionLine);
                  return { connectionLines: newLines };
                });
              }
              
              // Connect right to right connections  
              const rightCount = Math.min(prevLevel.rightConnections.length, newLevel.rightConnections.length);
              for (let i = 0; i < rightCount; i++) {
                const fromConn = prevLevel.rightConnections[i];
                const toConn = newLevel.rightConnections[i];
                fromConn.connected2Connection = toConn.id;
                
                // Create connection line
                const connectionLine: ConnectionLine = {
                  id: `line_${prevPoleId}_${poleId}_L${prevLevel.levelNumber}_R${i + 1}`,
                  trasseId: trasseId,
                  fromConnectionId: fromConn.id,
                  toConnectionId: toConn.id,
                  connectionLineType: 'L_80dB',
                  maxSag: 5,
                  operatingVoltage: 380,
                  soundPowerLevel: 80
                };
                
                // Add connection line
                set((state) => {
                  const newLines = new Map(state.connectionLines);
                  newLines.set(connectionLine.id, connectionLine);
                  return { connectionLines: newLines };
                });
              }
            }
          }
          
          // Update the previous pole's connections
          set((state) => {
            const newPoles = new Map(state.poles);
            newPoles.set(prevPoleId, prevPole);
            return { poles: newPoles };
          });
        }
      }
      
      // Add the new pole
      set((state) => {
        const newPoles = new Map(state.poles);
        newPoles.set(pole.id, pole);
        
        // Update trasse pole list
        const newTrassen = new Map(state.trassenNew);
        const trasse = newTrassen.get(trasseId);
        if (trasse) {
          trasse.poleIds.push(pole.id);
          newTrassen.set(trasseId, trasse);
        }
        
        return { 
          poles: newPoles,
          trassenNew: newTrassen
        };
      });
      
      return pole.id;
    } else {
      return '';
    }
    



  },

  



  
  // Export data back to original format
  exportProjectData: () => {
    const state = get();
    const hoehenpunkteArray = Array.from(state.hoehenpunkte.values()).map((hp, index) => ({
      LfdNummer: index + 1,
      GK_Vektor: hp.GK_Vektor,
    }));
    
    const esqArray = Array.from(state.esqSources.values()).map((esq) => ({
      ...esq,
      OriginalData: {} as any,
    }));
    
    const immissionPointsArray = Array.from(state.immissionPoints.values()).map((ip) => ({
      Name: ip.Name,
      Position: ip.Position,
      HeightOffset: ip.HeightOffset,
      G_Bodenfaktor: ip.G_Bodenfaktor,
      OriginalData: {} as any,
    }));
    
    // Convert new UI format to computation format
    const trassenArray: UsedTrasse[] = [];

    state.trassenNew.forEach((trasseNew) => {
      const poles = new Map<string, Pole>();
      const connectionLines: ConnectionLine[] = [];
      
      // Collect poles for this trasse
      trasseNew.poleIds.forEach(poleId => {
        const pole = state.poles.get(poleId);
        if (pole) {
          poles.set(poleId, pole);
        }
      });
      
      // Collect connection lines for this trasse
      state.connectionLines.forEach(line => {
        if (line.trasseId === trasseNew.id) {
          connectionLines.push(line);
        }
      });
      console.log("using trasseNew", trasseNew, "poles", poles, "connectionLines", connectionLines,
        Array.from(state.leiterTypes.values())
      );
      // Convert to computation format
      const usedTrasse = uiToComputation(
        trasseNew,
        poles,
        connectionLines,
        Array.from(state.leiterTypes.values())
      );
      
      trassenArray.push(usedTrasse);
    });
    
    // Include reference points data if available
    const exportData: UsedProjectData = {
      ...state.originalData,
      Hoehenpunkte: hoehenpunkteArray,
      ESQSources: esqArray,
      ImmissionPoints: immissionPointsArray,
      Trassen: trassenArray,
      LeiterTypes: Array.from(state.leiterTypes.values()),  // Export the current leiterTypes from GUI
      DGMDreiecke: state.dgmDreiecke,
      DGMKanten: state.dgmKanten,
      Name: state.projectName,
      IM_X_max: state.imageWidth,
      IM_Y_max: state.imageHeight,
      mitFrequenz: state.mitFrequenz,
      AgrKorrektur: state.originalData?.AgrKorrektur || false,
      Kt: state.kt,  // Export the Kt parameter
    };

    
    // Include image data if available (for JSON exports)
    if (state.projectImage) {
      exportData.ImageData = state.projectImage;
    }
    
    // Export reference points in both legacy format and new array format
    if (state.referencePoints.length > 0) {
      // Export all points in legacy format (A, B, C, ...)
      const refPointLetters = ['A', 'B'] as const;
      state.referencePoints.forEach((rp, index) => {
        if (index < refPointLetters.length) {
          const letter = refPointLetters[index];
          exportData[`GKR_${letter}`] = rp.gkRechts;
          exportData[`GKH_${letter}`] = rp.gkHoch;
          exportData[`PX_${letter}`] = rp.pixelX;
          exportData[`PY_${letter}`] = rp.pixelY;
        }
      });
      
      // Also store all reference points in array format for better future compatibility
      exportData.ReferencePoints = state.referencePoints.map(rp => ({
        pixelX: rp.pixelX,
        pixelY: rp.pixelY,
        gkRechts: rp.gkRechts,
        gkHoch: rp.gkHoch,
        label: rp.label,
        id: rp.id,
        name: rp.label
      }));
    }
    
    console.log("exportData", exportData);

    return exportData as UsedProjectData;
  },
  
  clearAll: () => {
    set({
      hoehenpunkte: new Map(),
      esqSources: new Map(),
      immissionPoints: new Map(),
      dgmDreiecke: [],
      dgmKanten: [],
      selectedElementId: null,
    });
  },
  
  // Calculate immission value for a specific point
  calculateImmissionValue: (immissionPointId: string) => {
    const state = get();
    const { originalData, immissionPoints } = state;
    
    if (!originalData) {
      return 0;
    }
    
    // Get the immission point from the store
    const immissionPoint = immissionPoints.get(immissionPointId);
    if (!immissionPoint) {
      return 0;
    }
    
    // Create updated project data with current immission points
    const currentProjectData = get().exportProjectData();
    
    // Calculate parabola parameters if trassen exist (they might have been modified)
    if (currentProjectData.Trassen && currentProjectData.Trassen.length > 0) {
    
        calculateParabolaParametersForAll(currentProjectData.Trassen);
      
    }
    
    // Create a new calculator instance with current data and the current DTM processor
    const currentCalculator = new UsedDataCalculator(currentProjectData, state.dtmProcessor);
    
    // Find the index of the immission point in the current data
    const immissionPointIndex = currentProjectData.ImmissionPoints.findIndex(
      (point) => point.Name === immissionPoint.Name
    );
    
    if (immissionPointIndex === -1) {
      console.warn(`Immission point ${immissionPoint.Name} not found in current data`);
      return 0;
    }
    
    try {
      console.log(`DTM processor available: ${state.dtmProcessor !== null}`);
      
      if (state.dtmProcessor) {
        console.log(`DTM has ${state.dtmProcessor.DGMKante?.length || 0} edges`);
      }
      console.log("Computing immission value for", immissionPoint);
      const result = currentCalculator.calculateLatLTForImmissionPoint(immissionPointIndex);
      console.log(`Calculated value for ${immissionPoint.Name}: ${result} dB`);
      return result;
    } catch (error) {
      console.error('Error calculating immission value:', error);
      return 0;
    }
  },
  
  // Get cached immission value (returns 0 if not cached)
  getCachedImmissionValue: (immissionPointId: string) => {
    const state = get();
    return state.cachedImmissionValues.get(immissionPointId) || 0;
  },
  

  

  computeImmissionPointsFromGUI: (usedTrassen: UsedTrasse[]) => {
    const state = get();
    const errors: string[] = [];  // Collect errors to display
    
    // Calculate parabola parameters for all conductors if there are trassen
    if (usedTrassen && usedTrassen.length > 0) {
      console.log('Calculating parabola parameters for conductors...');
      calculateParabolaParametersForAll(usedTrassen);
    } else {
      console.log('No trassen to calculate parabola parameters for');
    }
    
    // Convert ESQ sources from GUI state to array format
    const esqArray = Array.from(state.esqSources.values()).map((esq) => ({
      Bezeichnung: esq.Bezeichnung,
      Position: esq.Position,
      Hoehe: esq.Hoehe,
      Raumwinkelmass: esq.Raumwinkelmass,
      Beurteilungszeitraum: esq.Beurteilungszeitraum,
      Schallleistungspegel: esq.Schallleistungspegel,
      L: esq.L,
      S: esq.S,
      Z_Impulshaltigkeit: esq.Z_Impulshaltigkeit,
      Z_Tonhaltigkeit: esq.Z_Tonhaltigkeit,
      Z_Cmet: esq.Z_Cmet,
      Ruhezeitzuschlag: esq.Ruhezeitzuschlag,
      Einwirkzeit: esq.Einwirkzeit,
      Zeiteinheit: esq.Zeiteinheit,
      OriginalData: {} as any,
    }));
    
    // Convert immission points to array format for calculator
    const immissionPointsArray = Array.from(state.immissionPoints.values()).map(point => ({
      Name: point.Name,
      Position: point.Position,
      HeightOffset: point.HeightOffset,
      G_Bodenfaktor: point.G_Bodenfaktor,
    }));
    
    console.log("state.originalData", state.originalData);
    
    // Use the terrain model that's already in the store (updated by recomputeTriangulation)
    let dtmProcessor = state.dtmProcessor;
    let dgmDreiecke = state.dgmDreiecke || [];
    let dgmKanten = state.dgmKanten || [];
    let hoehenpunkteArray: UsedHoehenpunkt[] = [];
    
    // If no DTM processor in store, create one
    if (!dtmProcessor) {
      console.log('No DTM processor in store, creating one...');
      
      // Check if we have Hoehenpunkte in GUI state to create terrain model
      const hoehenpunkte = Array.from(state.hoehenpunkte.values());
      if (hoehenpunkte.length >= 3) {
        console.log('Creating terrain model from GUI Hoehenpunkte...');
        const { dreiecke, kanten } = computeTriangulation(hoehenpunkte);
        dgmDreiecke = dreiecke;
        dgmKanten = kanten;
        
        // Convert hoehenpunkte to the format expected by DTMProcessor
        hoehenpunkteArray = hoehenpunkte.map((hp, index) => ({
          LfdNummer: index + 1,
          GK_Vektor: hp.GK_Vektor
        }));
        
        // Create DTM processor with GUI terrain data
        dtmProcessor = new DTMProcessor(dgmDreiecke, hoehenpunkteArray);
        if (dgmKanten) {
          dtmProcessor.setDGMKante(dgmKanten);
        }
        set({ dtmProcessor, dgmDreiecke, dgmKanten });
      } else if (state.originalData?.DGMDreiecke && state.originalData?.Hoehenpunkte) {
        // Fall back to original data if no GUI Hoehenpunkte
        console.log('Using terrain model from original data...');
        dgmDreiecke = state.originalData.DGMDreiecke;
        dgmKanten = state.originalData.DGMKanten || [];
        hoehenpunkteArray = state.originalData.Hoehenpunkte;
        
        dtmProcessor = new DTMProcessor(dgmDreiecke, hoehenpunkteArray);
        if (dgmKanten) {
          dtmProcessor.setDGMKante(dgmKanten);
        }
        set({ dtmProcessor });
      } else {
        // Create minimal DTM processor if no terrain data available
        console.warn('No terrain data available, creating minimal DTM processor');
        dtmProcessor = new DTMProcessor([], []);
        set({ dtmProcessor });
      }
    } else {
      console.log('Using existing DTM processor from store');
      // Get the current hoehenpunkte array for the project data
      const hoehenpunkte = Array.from(state.hoehenpunkte.values());
      hoehenpunkteArray = hoehenpunkte.map((hp, index) => ({
        LfdNummer: index + 1,
        GK_Vektor: hp.GK_Vektor
      }));
    }
    
    // Create a complete UsedProjectData with GUI trassen, ESQ sources, immission points, and terrain model
    const guiProjectData: UsedProjectData = {
      ...state.originalData,
      Trassen: usedTrassen,
      // Use terrain model from GUI or original data
      Hoehenpunkte: hoehenpunkteArray,
      DGMDreiecke: dgmDreiecke,
      DGMKanten: dgmKanten,
      ImmissionPoints: immissionPointsArray,  // Use current immission points from GUI
      LeiterTypes: Array.from(state.leiterTypes.values()),  // Use current leiterTypes from GUI
      ESQSources: esqArray,  // Use current ESQ sources from GUI
      AgrKorrektur: state.originalData?.AgrKorrektur || false,
      mitFrequenz: state.mitFrequenz,  // Include frequency-dependent computation setting
    };
    
    // Create calculator with complete GUI data - only create it once
    let calculator: UsedDataCalculator | null = null;
    if (dtmProcessor) {
      calculator = new UsedDataCalculator(guiProjectData, dtmProcessor);
      set({ calculator });  // Store the calculator in state for reuse
    } else {
      const errorMsg = 'Failed to create DTM processor, cannot create calculator';
      console.error(errorMsg);
      errors.push(errorMsg);
    }
    console.log("Running with calculator", calculator);

    // Now compute with the calculator
    const newCache = new Map<string, number>();
    
    console.log('Computing immission values from GUI data...');
    console.log('Using trassen:', usedTrassen);
    console.log('Using immission points:', immissionPointsArray);
    
    // Calculate values for each immission point
    if (calculator) {
      for (const [id, point] of state.immissionPoints) {
        // Find the index of this immission point
        const pointIndex = immissionPointsArray.findIndex(
          ip => ip.Name === point.Name && 
          ip.Position.GK.Rechts === point.Position.GK.Rechts &&
          ip.Position.GK.Hoch === point.Position.GK.Hoch
        );
        
        if (pointIndex >= 0) {
          // Calculate using the correct method name
          try {
            const value = calculator.calculateLatLTForImmissionPoint(pointIndex);
            newCache.set(id, value);
            console.log(`Calculated value for ${point.Name} (index ${pointIndex}): ${value} dB`);
          } catch (error) {
            const errorMsg = `Error calculating immission for point "${point.Name}": ${error instanceof Error ? error.message : String(error)}`;
            console.error(errorMsg);
            errors.push(errorMsg);
            newCache.set(id, 0);
          }
        } else {
          const errorMsg = `Could not find immission point "${point.Name}" in data array`;
          console.warn(errorMsg);
          errors.push(errorMsg);
          newCache.set(id, 0);
        }
      }
    } else {
      const errorMsg = 'Calculator not available - cannot compute immission values';
      console.error(errorMsg);
      errors.push(errorMsg);
      // Set all values to 0 if no calculator
      for (const [id] of state.immissionPoints) {
        newCache.set(id, 0);
      }
    }
    
    set({ 
      cachedImmissionValues: newCache,
      isImmissionPointsComputed: true,
      computationErrors: errors  // Store any errors that occurred
    });
    console.log(`Computed and cached ${newCache.size} immission point values from GUI data`);
    
    // If there were errors, they are now stored in state for display
    if (errors.length > 0) {
      console.error(`Computation completed with ${errors.length} error(s)`);
    }
  },
  
  
  // Clear the immission cache
  clearImmissionCache: () => {
    set({ 
      cachedImmissionValues: new Map(),
      isImmissionPointsComputed: false,
      isGridComputed: false 
    });
    console.log('Immission cache cleared');
  },
  
 
  
  // Clear computation errors
  clearComputationErrors: () => {
    set({ computationErrors: [] });
  },
  
  // Generate immission grid
  generateImmissionGrid: async (mapWidth: number, mapHeight: number, transform: HelmertTransform | null) => {
    const state = get();
    const { gridSizeX, gridSizeY, heightOffset } = state.immissionGridSettings;
    const errors: string[] = []; // Collect errors to display
    
    if (!transform) {
      console.warn('No Helmert transform available for grid generation');
      return;
    }
    
    set({ 
      isCalculatingGrid: true, 
      immissionGrid: [],
      immissionGridDetailed: [],
      gridCalculationProgress: null,
      computationErrors: [] // Clear previous errors
    });
    
    try {
      const gridPoints: Array<{ x: number; y: number; value: number }> = [];
      const gridPointsDetailed: Array<{ x: number; y: number; total: number; esq: number; trassen: number }> = [];
      const currentProjectData = get().exportProjectData();
      calculateParabolaParametersForAll(currentProjectData.Trassen);
      // Create temporary immission points for the grid
      const tempImmissionPoints: Array<{ gk: GKVector3d; index: number }> = [];
      
      // Generate grid points
      for (let gy = 0; gy < gridSizeY; gy++) {
        for (let gx = 0; gx < gridSizeX; gx++) {
          // Calculate pixel position (evenly distributed)
          const px = (gx / (gridSizeX - 1)) * mapWidth;
          const py = (gy / (gridSizeY - 1)) * mapHeight;
          
          // Convert to GK coordinates (note: py is in Leaflet coordinates)
          const [gkRechts, gkHoch] = transform.pixelToGK(px, py);
          
          // Get terrain height at this point from DTM if available
          let terrainHeight = 50; // Default height
          if (state.dtmProcessor) {
            try {
              const gkPosition2D = { Rechts: gkRechts, Hoch: gkHoch };
              terrainHeight = state.dtmProcessor.berechneHoeheDGM(gkPosition2D);
            } catch (error) {
              console.warn(`Could not get DTM height at (${gkRechts}, ${gkHoch}):`, error);
            }
          }
          
          const gkPosition: GKVector3d = {
            GK: { Rechts: gkRechts, Hoch: gkHoch },
            z: terrainHeight + heightOffset,
          };
          
          tempImmissionPoints.push({
            gk: gkPosition,
            index: tempImmissionPoints.length
          });
          
          // Store pixel position for visualization
          gridPoints.push({ x: px, y: py, value: 0 });
          gridPointsDetailed.push({ x: px, y: py, total: 0, esq: 0, trassen: 0 });
        }
      }
      
      // Create a temporary project data with grid points as immission points
      const tempProjectData = {
        ...currentProjectData,
        mitFrequenz: state.mitFrequenz,
        ImmissionPoints: tempImmissionPoints.map((point, idx) => ({
          Name: `Grid_${idx}`,
          Position: point.gk,
          HeightOffset: heightOffset,
          G_Bodenfaktor: 1,
          OriginalData: {} as any,
        }))
      };
      
      // Create calculator with temporary data
      const tempCalculator = new UsedDataCalculator(tempProjectData, state.dtmProcessor);
      
      // Calculate immission values for each grid point
      console.log(`Calculating immission values for ${tempImmissionPoints.length} grid points...`);
      console.log("mitFrequenz", state.mitFrequenz);
      
      // Set initial progress
      set({ gridCalculationProgress: { current: 0, total: tempImmissionPoints.length } });
      
      for (let i = 0; i < tempImmissionPoints.length; i++) {
        try {
          const detailed = tempCalculator.calculateLatLTForImmissionPointDetailed(i);
          gridPoints[i].value = detailed.total;
          gridPointsDetailed[i].total = detailed.total;
          gridPointsDetailed[i].esq = detailed.esq;
          gridPointsDetailed[i].trassen = detailed.trassen;
        } catch (error) {
          const errorMsg = `Error calculating grid point ${i}: ${error instanceof Error ? error.message : String(error)}`;
          console.error(errorMsg);
          errors.push(errorMsg);
          gridPoints[i].value = 0;
          gridPointsDetailed[i].total = 0;
          gridPointsDetailed[i].esq = 0;
          gridPointsDetailed[i].trassen = 0;
        }
        
        // Update progress every point
        set({ gridCalculationProgress: { current: i + 1, total: tempImmissionPoints.length } });
        
        // Allow UI to update by yielding control periodically
        if (i % 5 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
        
        // Log progress periodically
        if (i % 10 === 0) {
          console.log(`Progress: ${i + 1}/${tempImmissionPoints.length}`);
        }
      }
      
      console.log('Grid calculation complete');
      
      // Log summary of errors if any occurred
      if (errors.length > 0) {
        console.error(`Grid calculation completed with ${errors.length} error(s)`);
        // Keep only unique error messages and limit to reasonable number
        const uniqueErrors = Array.from(new Set(errors)).slice(0, 10);
        if (errors.length > 10) {
          uniqueErrors.push(`...and ${errors.length - 10} more errors`);
        }
        set({ computationErrors: uniqueErrors });
      }
      
      set({ 
        immissionGrid: gridPoints,
        immissionGridDetailed: gridPointsDetailed, 
        isCalculatingGrid: false,
        gridCalculationProgress: null 
      });
      
    } catch (error) {
      console.error('Error generating immission grid:', error);
      const errorMsg = `Failed to generate immission grid: ${error instanceof Error ? error.message : String(error)}`;
      set({ 
        isCalculatingGrid: false,
        gridCalculationProgress: null,
        computationErrors: [errorMsg]
      });
    }
  },
  
  // Clear immission grid
  clearImmissionGrid: () => {
    set({ immissionGrid: [], immissionGridDetailed: [], showImmissionGrid: false, showGridPoints: false });
  },
  
  // Toggle grid visibility
  setShowImmissionGrid: (show: boolean) => {
    set({ showImmissionGrid: show });
  },
  
  // Toggle grid points visibility
  setShowGridPoints: (show: boolean) => {
    set({ showGridPoints: show });
  },
  
  // Toggle marker visibility
  setShowImmissionPoints: (show: boolean) => {
    set({ showImmissionPoints: show });
  },
  
  setShowESQPoints: (show: boolean) => {
    set({ showESQPoints: show });
  },
  
  setShowHoehenpunkte: (show: boolean) => {
    set({ showHoehenpunkte: show });
  },
  
  setShowPoles: (show: boolean) => {
    set({ showPoles: show });
  },
  
  setShowReferencePoints: (show: boolean) => {
    set({ showReferencePoints: show });
  },

  // Set contour display mode
  setContourDisplayMode: (mode: ContourDisplayMode) => {
    set({ contourDisplayMode: mode });
  },
  
  // Update grid settings
  updateImmissionGridSettings: (settings) => {
    set((state) => ({
      immissionGridSettings: {
        ...state.immissionGridSettings,
        ...settings
      }
    }));
    
    // Clear immission grid if computation-affecting settings changed
    const computationAffectingKeys = ['gridSizeX', 'gridSizeY', 'heightOffset'];
    const hasComputationChange = computationAffectingKeys.some(key => key in settings);
    
    if (hasComputationChange) {
      console.log('Clearing immission grid due to computation-affecting setting change');
      get().clearImmissionGrid();
    }
  },
  
  // Get interpolated grid value at a pixel position
  getInterpolatedGridValue: (px: number, py: number, mapWidth: number, mapHeight: number) => {
    const state = get();
    const { immissionGrid, immissionGridSettings } = state;
    
    if (!immissionGrid || immissionGrid.length === 0) {
      return null;
    }
    
    const { gridSizeX, gridSizeY } = immissionGridSettings;
    
    // Calculate grid cell position
    const gx = (px / mapWidth) * (gridSizeX - 1);
    const gy = (py / mapHeight) * (gridSizeY - 1);
    
    // Get integer grid indices
    const x0 = Math.floor(gx);
    const y0 = Math.floor(gy);
    const x1 = Math.min(x0 + 1, gridSizeX - 1);
    const y1 = Math.min(y0 + 1, gridSizeY - 1);
    
    // Get fractional parts for interpolation
    const fx = gx - x0;
    const fy = gy - y0;
    
    // Find grid points (grid is stored as 1D array)
    const getGridValue = (x: number, y: number) => {
      const index = y * gridSizeX + x;
      if (index >= 0 && index < immissionGrid.length) {
        return immissionGrid[index].value;
      }
      return 0;
    };
    
    // Get the four corner values
    const v00 = getGridValue(x0, y0);
    const v10 = getGridValue(x1, y0);
    const v01 = getGridValue(x0, y1);
    const v11 = getGridValue(x1, y1);
    
    // Bilinear interpolation
    const v0 = v00 * (1 - fx) + v10 * fx;
    const v1 = v01 * (1 - fx) + v11 * fx;
    const interpolatedValue = v0 * (1 - fy) + v1 * fy;
    
    return interpolatedValue;
  },

  getInterpolatedDetailedGridValue: (px: number, py: number, mapWidth: number, mapHeight: number, displayMode: ContourDisplayMode) => {
    const state = get();
    const { immissionGridDetailed, immissionGridSettings } = state;
    
    if (!immissionGridDetailed || immissionGridDetailed.length === 0) {
      return null;
    }
    
    const { gridSizeX, gridSizeY } = immissionGridSettings;
    
    // Calculate grid cell position
    const gx = (px / mapWidth) * (gridSizeX - 1);
    const gy = (py / mapHeight) * (gridSizeY - 1);
    
    // Get integer grid indices
    const x0 = Math.floor(gx);
    const y0 = Math.floor(gy);
    const x1 = Math.min(x0 + 1, gridSizeX - 1);
    const y1 = Math.min(y0 + 1, gridSizeY - 1);
    
    // Get fractional parts for interpolation
    const fx = gx - x0;
    const fy = gy - y0;
    
    // Helper function to extract the right value based on display mode
    const getValue = (point: { total: number; esq: number; trassen: number }): number => {
      switch (displayMode) {
        case 'esq': return point.esq || 0;
        case 'trassen': return point.trassen || 0;
        case 'total':
        default: return point.total || 0;
      }
    };
    
    // Find grid points (grid is stored as 1D array)
    const getGridValue = (x: number, y: number) => {
      const index = y * gridSizeX + x;
      if (index >= 0 && index < immissionGridDetailed.length) {
        return getValue(immissionGridDetailed[index]);
      }
      return 0;
    };
    
    // Get the four corner values
    const v00 = getGridValue(x0, y0);
    const v10 = getGridValue(x1, y0);
    const v01 = getGridValue(x0, y1);
    const v11 = getGridValue(x1, y1);
    
    // Bilinear interpolation
    const v0 = v00 * (1 - fx) + v10 * fx;
    const v1 = v01 * (1 - fx) + v11 * fx;
    const interpolatedValue = v0 * (1 - fy) + v1 * fy;
    
    return interpolatedValue;
  },
  
  // Helper method to check if we have a valid transformation
  hasValidTransformation: () => {
    const state = get();
    return state.referencePoints.length >= 2;
  },
  
  // Recompute triangulation when Hoehenpunkte change
  recomputeTriangulation: () => {
    const state = get();
    const hoehenpunkte = Array.from(state.hoehenpunkte.values());
    console.log('recomputeTriangulation called with', hoehenpunkte.length, 'Hoehenpunkte');
    
    if (hoehenpunkte.length >= 3) {
      const { dreiecke, kanten } = computeTriangulation(hoehenpunkte);
      console.log('Computed triangulation:', dreiecke.length, 'triangles,', kanten.length, 'edges');
      
      // Convert hoehenpunkte to the format expected by DTMProcessor
      const hPunkte = hoehenpunkte.map((hp, index) => ({
        LfdNummer: index + 1,
        GK_Vektor: hp.GK_Vektor
      }));
      
      // Always create/update DTM processor when we have triangulation
      const newDtmProcessor = new DTMProcessor(dreiecke, hPunkte);
      newDtmProcessor.setDGMKante(kanten);
      console.log('Created new DTMProcessor');
      
      set({ 
        dgmDreiecke: dreiecke, 
        dgmKanten: kanten, 
        dtmProcessor: newDtmProcessor 
      });
      
      // Update calculator if it exists (or create one if computation is enabled)
      if (state.originalData) {
        // Create updated project data with current GUI state
        const updatedProjectData: UsedProjectData = {
          ...state.originalData,
          DGMDreiecke: dreiecke,
          DGMKanten: kanten,
          Hoehenpunkte: hPunkte,
          // Also include current GUI data
          ImmissionPoints: Array.from(state.immissionPoints.values()),
          ESQSources: Array.from(state.esqSources.values()),
          LeiterTypes: Array.from(state.leiterTypes.values()),
        };
        const newCalculator = new UsedDataCalculator(updatedProjectData, newDtmProcessor);
        set({ calculator: newCalculator });
        console.log('Updated calculator with new terrain data');
        
        // If immission values were previously computed, clear the cache to force recalculation
        if (state.isImmissionPointsComputed) {
          console.log('Clearing immission cache due to terrain change');
          state.cachedImmissionValues.clear();
          set({ cachedImmissionValues: new Map(), isImmissionPointsComputed: false });
        }
      }
    } else {
      console.log('Not enough Hoehenpunkte for triangulation (need at least 3)');
      set({ dgmDreiecke: [], dgmKanten: [], dtmProcessor: null });
    }
  },
  
  // Mast Layout Template actions
  addMastLayoutTemplate: (template) => {
    const id = template.id || uuidv4();
    const fullTemplate = { ...template, id };
    
    set((state) => {
      const newTemplates = new Map(state.mastLayoutTemplates);
      newTemplates.set(id, fullTemplate);
      return { mastLayoutTemplates: newTemplates };
    });
    
    return id;
  },
  
  updateMastLayoutTemplate: (id, template) => {
    set((state) => {
      const newTemplates = new Map(state.mastLayoutTemplates);
      newTemplates.set(id, { ...template, id });
      return { mastLayoutTemplates: newTemplates };
    });
  },
  

  
  loadStandardTemplates: () => {
    const templates = new Map<string, MastLayoutTemplate>();
    
    STANDARD_TEMPLATES.forEach((standardTemplate) => {
      const template = createMastLayoutTemplate(standardTemplate);
      template.id = uuidv4();
      templates.set(template.id, template);
    });
    
    set({ mastLayoutTemplates: templates });
  },
  
  // New UI structure actions
  addTrasseNew: (name, templateId) => {
    console.log('addTrasseNew called with name:', name, 'templateId:', templateId);
    const id = uuidv4();
    const trasseNew: TrasseNew = {
      id,
      name,
      templateId,
      poleIds: []
    };
    console.log('addTrasseNew - created trasse:', trasseNew);
    
    set((state) => {
      const newTrassen = new Map(state.trassenNew);
      newTrassen.set(id, trasseNew);
      console.log('addTrasseNew - newTrassen map size after add:', newTrassen.size);
      console.log('addTrasseNew - newTrassen entries:', Array.from(newTrassen.entries()));
      return { trassenNew: newTrassen };
    });
    
    // Clear immission calculations when new trasse is added
    get().clearImmissionCache();
    get().clearImmissionGrid();
    
    console.log('addTrasseNew - returning id:', id);
    return id;
  },
  
  updateTrasseNew: (id, data) => {
    set((state) => {
      const newTrassen = new Map(state.trassenNew);
      const existing = newTrassen.get(id);
      if (existing) {
        newTrassen.set(id, { ...existing, ...data });
      }
      return { trassenNew: newTrassen };
    });
  },
  
  deleteTrasseNew: (id) => {
    set((state) => {
      const newTrassen = new Map(state.trassenNew);
      const trasse = newTrassen.get(id);
      
      if (trasse) {
        // Delete associated poles and connection lines
        const newPoles = new Map(state.poles);
        const newLines = new Map(state.connectionLines);
        
        // Delete poles
        trasse.poleIds.forEach(poleId => {
          newPoles.delete(poleId);
        });
        
        // Delete connection lines for this trasse
        Array.from(newLines.entries()).forEach(([lineId, line]) => {
          if (line.trasseId === id) {
            newLines.delete(lineId);
          }
        });
        
        newTrassen.delete(id);
        
        return { 
          trassenNew: newTrassen,
          poles: newPoles,
          connectionLines: newLines
        };
      }
      
      return {};
    });
  },
  
  
  updatePole: (id, data) => {
    set((state) => {
      const newPoles = new Map(state.poles);
      const existing = newPoles.get(id);
      if (existing) {
        newPoles.set(id, { ...existing, ...data });
      }
      return { poles: newPoles };
    });
    
    // Clear immission calculations when poles change
    get().clearImmissionCache();
    get().clearImmissionGrid();
  },
  
  deletePole: (id) => {
    set((state) => {
      const newPoles = new Map(state.poles);
      const pole = newPoles.get(id);
      
      if (pole) {
        // Remove from trasse
        const newTrassen = new Map(state.trassenNew);
        const trasse = newTrassen.get(pole.trasseId);
        if (trasse) {
          trasse.poleIds = trasse.poleIds.filter(pId => pId !== id);
          newTrassen.set(pole.trasseId, trasse);
        }
        
        // Delete associated connection lines
        const newLines = new Map(state.connectionLines);
        Array.from(newLines.entries()).forEach(([lineId, line]) => {
          // Check if line is connected to this pole
          const fromConnId = line.fromConnectionId;
          const toConnId = line.toConnectionId;
          if (fromConnId.startsWith(id + '_') || toConnId.startsWith(id + '_')) {
            newLines.delete(lineId);
          }
        });
        
        newPoles.delete(id);
        
        return { 
          poles: newPoles,
          trassenNew: newTrassen,
          connectionLines: newLines
        };
      }
      
      return {};
    });
    
    // Clear immission calculations when poles are deleted
    get().clearImmissionCache();
    get().clearImmissionGrid();
  },
  
  addConnectionLine: (line) => {
    const id = line.id || uuidv4();
    const lineWithId = { ...line, id };
    
    set((state) => {
      const newLines = new Map(state.connectionLines);
      newLines.set(id, lineWithId);
      return { connectionLines: newLines };
    });
    
    return id;
  },
  
  updateConnectionLine: (id, data) => {
    set((state) => {
      const newLines = new Map(state.connectionLines);
      const existing = newLines.get(id);
      if (existing) {
        newLines.set(id, { ...existing, ...data });
      }
      return { connectionLines: newLines };
    });
  },
  
  deleteConnectionLine: (id) => {
    set((state) => {
      const newLines = new Map(state.connectionLines);
      newLines.delete(id);
      return { connectionLines: newLines };
    });
  },

  convertNewFormatToComputation: (trasseId) => {
    const state = get();
    const trasse = state.trassenNew.get(trasseId);
    
    if (!trasse) return null;
    
    // Get all poles for this trasse
    const trassePoles = new Map<string, Pole>();
    trasse.poleIds.forEach(poleId => {
      const pole = state.poles.get(poleId);
      if (pole) {
        trassePoles.set(poleId, pole);
      }
    });
    
    // Get all connection lines for this trasse
    const trasseLines = Array.from(state.connectionLines.values())
      .filter(line => line.trasseId === trasseId);
    
    // Convert to computation format
    const leiterTypesArray = Array.from(state.leiterTypes.values());
    const usedTrasse = uiToComputation(trasse, trassePoles, trasseLines, leiterTypesArray);
    
    return usedTrasse;
  },
  
  // Add corner Hoehenpunkte for proper triangulation
  addCornerHoehenpunkte: () => {
    const state = get();
    const { imageWidth, imageHeight, referencePoints } = state;
    
    // Only proceed if we have at least 2 reference points for transformation
    if (referencePoints.length < 2) {
      console.log('Not enough reference points to create corner Hoehenpunkte');
      return undefined;
    }
    
    // Validate reference points have valid values
    const validReferencePoints = referencePoints.filter(rp => 
      !isNaN(rp.pixelX) && !isNaN(rp.pixelY) && 
      !isNaN(rp.gkRechts) && !isNaN(rp.gkHoch) &&
      rp.pixelX >= 0 && rp.pixelY >= 0
    );
    
    if (validReferencePoints.length < 2) {
      console.log('Not enough valid reference points for transformation');
      return undefined;
    }
    
    try {
      // Create Helmert transform using the same format as LageplanMap
      // The stored pixelY is in image coordinates (0 at top)
      // We need to convert to Leaflet coordinates (0 at bottom) for the transform
      // Use all available reference points for transformation
      const transformPoints = validReferencePoints.map(rp => ({
        gkRechts: rp.gkRechts,
        gkHoch: rp.gkHoch,
        pixelX: rp.pixelX,
        pixelY: imageHeight - rp.pixelY,  // Convert to Leaflet coordinates
      }));
      
      const transform = new HelmertTransform(transformPoints);
      
      // Define corner positions in Leaflet coordinates (0,0 is bottom-left)
      const corners = [
        { x: 0, y: 0, label: 'SW' },                    // Bottom-left (Southwest)
        { x: imageWidth, y: 0, label: 'SE' },           // Bottom-right (Southeast)
        { x: imageWidth, y: imageHeight, label: 'NE' }, // Top-right (Northeast)
        { x: 0, y: imageHeight, label: 'NW' }           // Top-left (Northwest)
      ];
      
      // Convert corners to GK coordinates and check if they exist
      const hoehenpunkte = new Map(state.hoehenpunkte);
      let added = 0;
      
      corners.forEach(corner => {
        // Convert pixel to GK coordinates (already in Leaflet coordinates)
        const [gkRechts, gkHoch] = transform.pixelToGK(corner.x, corner.y);
        
        // Check for NaN values
        if (isNaN(gkRechts) || isNaN(gkHoch)) {
          console.error(`Failed to transform corner ${corner.label}: got NaN values`);
          return;
        }
        
        // Check if a Hoehenpunkt already exists at this location (within tolerance)
        const tolerance = 1.0; // meters
        const exists = Array.from(hoehenpunkte.values()).some(hp => {
          const dx = Math.abs(hp.GK_Vektor.GK.Rechts - gkRechts);
          const dy = Math.abs(hp.GK_Vektor.GK.Hoch - gkHoch);
          return dx < tolerance && dy < tolerance;
        });
        
        if (!exists) {
          // Add corner Hoehenpunkt with default height
          const id = uuidv4();
          const cornerHp: EditableHoehenpunkt = {
            id,
            GK_Vektor: {
              GK: { Rechts: gkRechts, Hoch: gkHoch },
              z: 50 // Default height
            }
          };
          hoehenpunkte.set(id, cornerHp);
          added++;
          console.log(`Added corner Hoehenpunkt at ${corner.label}: (${gkRechts.toFixed(2)}, ${gkHoch.toFixed(2)})`);
        }
      });
      
      if (added > 0) {
        set({ hoehenpunkte });
        get().recomputeTriangulation();
        return added; // Return number of points added
      }
      return 0;
    } catch (error) {
      console.error('Error creating corner Hoehenpunkte:', error);
      return undefined;
    }
  },
  
  // Reset all entity heights to terrain
  resetAllHeightsToTerrain: () => {
    const state = get();
    
    if (!state.dtmProcessor) {
      console.warn('No DTM processor available for terrain height calculation');
      return;
    }
    
    let updated = 0;
    
    // Update all poles
    const newPoles = new Map(state.poles);
    for (const [id, pole] of newPoles) {
      try {
        const terrainHeight = state.dtmProcessor.berechneHoeheDGM(pole.position.GK);
        if (!isNaN(terrainHeight)) {
          newPoles.set(id, {
            ...pole,
            nullpunktHeight: terrainHeight
          });
          updated++;
        }
      } catch (error) {
        console.error(`Error calculating terrain height for pole ${id}:`, error);
      }
    }
    
    // Update all ESQ sources
    const newESQ = new Map(state.esqSources);
    for (const [id, esq] of newESQ) {
      try {
        const terrainHeight = state.dtmProcessor.berechneHoeheDGM(esq.Position.GK);
        if (!isNaN(terrainHeight)) {
          newESQ.set(id, {
            ...esq,
            Position: {
              ...esq.Position,
              z: terrainHeight
            }
          });
          updated++;
        }
      } catch (error) {
        console.error(`Error calculating terrain height for ESQ ${id}:`, error);
      }
    }
    
    // Update all immission points
    const newImmissionPoints = new Map(state.immissionPoints);
    for (const [id, point] of newImmissionPoints) {
      try {
        const terrainHeight = state.dtmProcessor.berechneHoeheDGM(point.Position.GK);
        if (!isNaN(terrainHeight)) {
          newImmissionPoints.set(id, {
            ...point,
            Position: {
              ...point.Position,
              z: terrainHeight
            }
          });
          updated++;
        }
      } catch (error) {
        console.error(`Error calculating terrain height for immission point ${id}:`, error);
      }
    }
    
    // Apply all updates
    set({
      poles: newPoles,
      esqSources: newESQ,
      immissionPoints: newImmissionPoints,
      isImmissionPointsComputed: false
    });
    
    // Clear immission calculations as heights have changed
    get().clearImmissionCache();
    get().clearImmissionGrid();
    
    console.log(`Updated heights for ${updated} entities to match terrain`);
  },
  
  // LeiterType management methods
  addLeiterType: (leiterType: HLeitertypData) => {
    set((state) => {
      const newLeiterTypes = new Map(state.leiterTypes);
      newLeiterTypes.set(leiterType.Name, leiterType);
      return { leiterTypes: newLeiterTypes };
    });
  },
  
  updateLeiterType: (name: string, leiterType: HLeitertypData) => {
    set((state) => {
      const newLeiterTypes = new Map(state.leiterTypes);
      // If the name changed, delete the old entry
      if (name !== leiterType.Name) {
        newLeiterTypes.delete(name);
      }
      newLeiterTypes.set(leiterType.Name, leiterType);
      return { leiterTypes: newLeiterTypes };
    });
  },
  
  deleteLeiterType: (name: string) => {
    set((state) => {
      const newLeiterTypes = new Map(state.leiterTypes);
      newLeiterTypes.delete(name);
      return { leiterTypes: newLeiterTypes };
    });
  },
  
  // Color palette management
  setColorPalette: (type: 'dgm' | 'immissionGrid', palette: string) => {
    set((state) => ({
      colorPalettes: {
        ...state.colorPalettes,
        [type]: palette
      }
    }));
  },
  
  // Computation settings
  setMitFrequenz: (enabled: boolean) => {
    set({ mitFrequenz: enabled });
    // Clear cache when changing computation mode
    get().clearImmissionCache();
  },
  
  setKt: (value: number) => {
    set({ kt: value });
    // Clear cache when changing Kt parameter
    get().clearImmissionCache();
    get().clearImmissionGrid();
  },

  deleteMastLayoutTemplate: (id: string) => {
    set((state) => {
      const newMastLayoutTemplates = new Map(state.mastLayoutTemplates);
      newMastLayoutTemplates.delete(id);
      return { mastLayoutTemplates: newMastLayoutTemplates };
    });
  },
}));