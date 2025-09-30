export interface GKVector2d {
  Rechts: number;
  Hoch: number;
}

export interface GKVector3d {
  GK: GKVector2d;
  z: number;
 
}

export interface vector2d {
  x: number;
  y: number;
  Length?: number;
}

// Extended vector2d with computed Length property
export interface Vector2dWithLength extends vector2d {
  Length: number;
}

export interface HPunktData {
  lfdNummer: number;               // Sequential number of the height point
  OVektor: Vector2dWithLength;    // Position vector containing x, y coordinates and Length
  GK_Vektor: GKVector3d;          // Gauss-Krüger coordinates
}

export interface HLinieData {
  Nummer: number;                  // Line number
  HP: HPunktData;                 // Height point data for the line
}

// Immission point calculation data
export interface IPunkt_NEU_Data {
  HP: HPunktData;                        // Height point data (position, coordinates)
  
  // Power line (Trasse) noise levels
  Trasse_LatLTPegel: number;             // Without surcharges
  Trasse_ImmiRasterPegel: number;        // Immission/raster value
  Trasse_BeurtPegel: number;             // Assessment level
  Trasse_gefunden: boolean;              // Found during isoline search
  
  // Day period noise levels
  Tag_LatLTPegel: number;
  Tag_ImmiRasterPegel: number;            // Immission/raster value (after calculation)
  Tag_BeurtPegel: number;                 // Assessment level (after deducting surcharges)
  Tag_gefunden: boolean;
  
  // Night period noise levels
  Nacht_LatLTPegel: number;
  Nacht_ImmiRasterPegel: number;
  Nacht_BeurtPegel: number;
  Nacht_gefunden: boolean;
  
  // Loudest hour noise levels
  ltStunde_LatLTPegel: number;
  ltStunde_ImmiRasterPegel: number;
  ltStunde_BeurtPegel: number;
  ltStunde_gefunden: boolean;
  
  // Total day/night noise levels
  Tag_GES_BeurtPegel: number;
  Tag_GES_ImmiRasterPegel: number;
  Tag_GES_gefunden: boolean;
  
  Nacht_GES_BeurtPegel: number;
  Nacht_GES_ImmiRasterPegel: number;
  Nacht_GES_gefunden: boolean;
  
  ltStunde_GES_BeurtPegel: number;
  ltStunde_GES_ImmiRasterPegel: number;
  ltStunde_GES_gefunden: boolean;
}

export interface IOrt_Neu_Data {
  Name: string;                          // Name of the immission point
  Hoehe: number;                         // Height above ground
  G_Bodenfaktor: number;                 // Ground factor for Agr calculation
  bStatusBerechnung: boolean;            // Calculation status
  IPunkt: IPunkt_NEU_Data;               // Point data (coordinates, noise levels)
}

export interface HLeitertypData {
  Name: string;
  SchallLW: number;  // The dB value for this conductor type
}

export interface UsedTrasse {
  Nummer: number;
  Name: string;
  AnzahlMastebenen: number;
  AnzahlMastleitungen: number;
  UsedMasten: UsedMast[];
}

export interface UsedMast {
  Fusspunkt: HPunktData;
  Name: string;
  NullpunktHoehe: number;
  MastHoehe: number;
  Ausrichtung: Vector2dWithLength;
  GKAusrichtung: GKVector2d;
  UsedEbenen: UsedEbene[];
}

export interface UsedEbene {
  NummerEbene: number;
  AbstandNullpunkt: number;
  UsedLeitungenLinks: UsedLeiter[];
  UsedLeitungenRechts: UsedLeiter[];
}

export interface UsedLeiter {
  Durchgangspunkt: GKVector3d;
  ACDC: number;
  NummerLeiter: number;
  AbstandMastachse: number;
  Isolatorlaenge: number;
  NextMastEbene: number;
  NextMastLeiter: number;
  Einbauart: number;
  Durchhang: number;
  ParabelA: number;
  ParabelB: number;
  ParabelC: number;
  SchallLw: string;
  SchallLwDB: number;
  BetrU: number;
  AmSeg: number;
  SegLenU: number;
  LeiterLen: number;
  Mittelpkt: GKVector3d;
  SegmentPunkte: GKVector3d[];
}

export interface UsedHoehenpunkt {
  LfdNummer: number;
  GK_Vektor: GKVector3d;
}

export interface UsedDGMDreieck {
  A: HLinieData;
  B: HLinieData;
  C: HLinieData;
  LfdNummer: number;
}

export interface UsedDGMKante {
  EckeA: HLinieData;
  EckeB: HLinieData;
  DreieckA: number;
  DreieckB: number;
}

export interface UsedImmissionPoint {
  Name: string;
  OriginalData?: IOrt_Neu_Data;
  Position: GKVector3d;
  HeightOffset: number;
  G_Bodenfaktor: number;
}

export interface UsedESQ {
  Bezeichnung: string;
  Position: GKVector3d;
  Hoehe: number;
  Raumwinkelmass: number;
  Beurteilungszeitraum: number;
  Schallleistungspegel: boolean;
  L: number;
  S: number;
  Z_Impulshaltigkeit: number;
  Z_Tonhaltigkeit: number;
  Z_Cmet: number;
  Ruhezeitzuschlag: boolean;
  Einwirkzeit: number;
  Zeiteinheit: number;
}

export interface UsedProjectData {
  ImageData?: string;
  Trassen: UsedTrasse[];
  Hoehenpunkte: UsedHoehenpunkt[];
  DGMDreiecke: UsedDGMDreieck[];
  DGMKanten: UsedDGMKante[];
  ImmissionPoints: UsedImmissionPoint[];
  LeiterTypes: HLeitertypData[];
  ESQSources: UsedESQ[];
  AgrKorrektur: boolean;
  
  // Project metadata from Projekt_Data_nach20170113
  Name?: string;
  Pfad?: string;
  bBerechneCmet?: boolean;
  Ts?: number;  // prozentualer Jahresstunden-Anteil für Schauer
  Tlr?: number; // prozentualer Jahresstunden-Anteil für Landregen
  Tkr?: number; // prozentualer Jahresstunden-Anteil für kein Regen, Nebel
  Ks?: number;  // Pegelabweichungen für Schauer
  Klr?: number; // Pegelabweichungen für Landregen
  Kkr?: number; // Pegelabweichungen für kein Regen, Nebel
  Cmet?: number; // Wert für meteorologische Korrektur
  Kt?: number;   // Ton- und Informationshaltigkeit
  mitFrequenz?: boolean;
  
  // Element counts
  iHPunkt_Element?: number;
  iDGMDreieck_Element?: number;
  iDGMKante_Element?: number;
  iTrasse_Element?: number;
  iES_Element?: number;
  iIOrt_Element?: number;
  
  // Georeferencing coordinates for Lageplan
  GKR_A?: number;  // Gauss-Krüger-Rechts-Koordinate Passpunkt A
  GKH_A?: number;  // Gauss-Krüger-Hoch-Koordinate Passpunkt A
  GKR_B?: number;  // Gauss-Krüger-Rechts-Koordinate Passpunkt B
  GKH_B?: number;  // Gauss-Krüger-Hoch-Koordinate Passpunkt B
  
  PX_A?: number;   // Pixel-X-Koordinate Passpunkt A
  PY_A?: number;   // Pixel-Y-Koordinate Passpunkt A
  PX_B?: number;   // Pixel-X-Koordinate Passpunkt B
  PY_B?: number;   // Pixel-Y-Koordinate Passpunkt B
  
  IM_X_max?: number; // skalierte Breite des Lageplans/Image auf dem Bildschirm
  IM_Y_max?: number; // skalierte Höhe des Lageplans/Image auf dem Bildschirm
  ReferencePoints?: {
    id: string,
    pixelX: number,
    pixelY: number,
    gkRechts: number,
    gkHoch: number,
    name: string,
    label?: string,
  }[]
}