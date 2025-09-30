/* eslint-disable @typescript-eslint/no-explicit-any */
import type { 
  UsedProjectData, 
  UsedTrasse, 
  UsedMast, 
  UsedEbene, 
  UsedLeiter,
  UsedImmissionPoint,
  UsedESQ,
  UsedHoehenpunkt,
  UsedDGMDreieck,
  UsedDGMKante,
  GKVector2d,
  GKVector3d,
  Vector2dWithLength
} from '../types/usedData';

export class UsedDataLoadError extends Error {
  public readonly details?: any;

  constructor(message: string, details?: any) {
    super(message);
    this.name = 'UsedDataLoadError';
    this.details = details;
  }
}

export class UsedDataLoader {
  
  static async loadFromFile(filePath: string): Promise<UsedProjectData> {
    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new UsedDataLoadError(`Failed to fetch file: ${response.statusText}`);
      }
      const jsonText = await response.text();
      return this.loadFromJson(jsonText);
    } catch (error) {
      if (error instanceof UsedDataLoadError) {
        throw error;
      }
      throw new UsedDataLoadError('Failed to load file', error);
    }
  }

  static loadFromJson(jsonString: string): UsedProjectData {
    try {
      const data = JSON.parse(jsonString);
      return this.validateAndTransform(data);
    } catch (error) {
      if (error instanceof UsedDataLoadError) {
        throw error;
      }
      throw new UsedDataLoadError('Invalid JSON format', error);
    }
  }

  static validateAndTransform(data: any): UsedProjectData {
    if (!data || typeof data !== 'object') {
      throw new UsedDataLoadError('Data must be an object');
    }

    const projectData: UsedProjectData = {
      Trassen: this.validateTrassen(data.Trassen),
      Hoehenpunkte: this.validateHoehenpunkte(data.Hoehenpunkte),
      DGMDreiecke: this.validateDGMDreiecke(data.DGMDreiecke),
      DGMKanten: this.validateDGMKanten(data.DGMKanten),
      ImmissionPoints: this.validateImmissionPoints(data.ImmissionPoints),
      LeiterTypes: data.LeiterTypes || [],
      ESQSources: this.validateESQSources(data.ESQSources),
      AgrKorrektur: Boolean(data.AgrKorrektur),
      mitFrequenz: data.mitFrequenz !== undefined ? Boolean(data.mitFrequenz) : false
    };

    // Preserve additional fields that are not part of the core structure
    // but are needed for reference points and project metadata
    // Support both legacy A/B format and dynamic number of points (A, B, C, D, ...)
    const refPointLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    
    for (const letter of refPointLetters) {
      const gkrKey = `GKR_${letter}`;
      const gkhKey = `GKH_${letter}`;
      const pxKey = `PX_${letter}`;
      const pyKey = `PY_${letter}`;
      
      if (data[gkrKey] !== undefined) (projectData as any)[gkrKey] = data[gkrKey];
      if (data[gkhKey] !== undefined) (projectData as any)[gkhKey] = data[gkhKey];
      if (data[pxKey] !== undefined) (projectData as any)[pxKey] = data[pxKey];
      if (data[pyKey] !== undefined) (projectData as any)[pyKey] = data[pyKey];
    }
    if (data.IM_X_max !== undefined) (projectData as any).IM_X_max = data.IM_X_max;
    if (data.IM_Y_max !== undefined) (projectData as any).IM_Y_max = data.IM_Y_max;
    if (data.Name !== undefined) (projectData as any).Name = data.Name;
    if (data.ReferencePoints !== undefined) (projectData as any).ReferencePoints = data.ReferencePoints;
    if (data.ImageData !== undefined) (projectData as any).ImageData = data.ImageData;

    return projectData;
  }

  private static validateTrassen(trassen: any): UsedTrasse[] {
    if (!Array.isArray(trassen)) {
      return [];
    }

    return trassen.map((trasse, index) => {
      if (!trasse || typeof trasse !== 'object') {
        throw new UsedDataLoadError(`Invalid Trasse at index ${index}`);
      }

      return {
        Nummer: Number(trasse.Nummer) || 0,
        Name: String(trasse.Name || ''),
        AnzahlMastebenen: Number(trasse.AnzahlMastebenen) || 0,
        AnzahlMastleitungen: Number(trasse.AnzahlMastleitungen) || 0,
        UsedMasten: this.validateMasten(trasse.UsedMasten)
      };
    });
  }

  private static validateMasten(masten: any): UsedMast[] {
    if (!Array.isArray(masten)) {
      return [];
    }

    return masten.map((mast, index) => {
      if (!mast || typeof mast !== 'object') {
        throw new UsedDataLoadError(`Invalid Mast at index ${index}`);
      }

      return {
        Fusspunkt: mast.Fusspunkt || {},
        Name: String(mast.Name || ''),
        NullpunktHoehe: Number(mast.NullpunktHoehe) || 0,
        MastHoehe: Number(mast.MastHoehe) || 0,
        Ausrichtung: this.validateVector2d(mast.Ausrichtung),
        GKAusrichtung: this.validateGKVector2d(mast.GKAusrichtung),
        UsedEbenen: this.validateEbenen(mast.UsedEbenen)
      };
    });
  }

  private static validateEbenen(ebenen: any): UsedEbene[] {
    if (!Array.isArray(ebenen)) {
      return [];
    }

    return ebenen.map((ebene, index) => {
      if (!ebene || typeof ebene !== 'object') {
        throw new UsedDataLoadError(`Invalid Ebene at index ${index}`);
      }

      return {
        NummerEbene: Number(ebene.NummerEbene) || 0,
        AbstandNullpunkt: Number(ebene.AbstandNullpunkt) || 0,
        UsedLeitungenLinks: this.validateLeitungen(ebene.UsedLeitungenLinks),
        UsedLeitungenRechts: this.validateLeitungen(ebene.UsedLeitungenRechts)
      };
    });
  }

  private static validateLeitungen(leitungen: any): UsedLeiter[] {
    if (!Array.isArray(leitungen)) {
      return [];
    }

    return leitungen.map((leiter, index) => {
      if (!leiter || typeof leiter !== 'object') {
        throw new UsedDataLoadError(`Invalid Leiter at index ${index}`);
      }

      return {
        Durchgangspunkt: this.validateGKVector3d(leiter.Durchgangspunkt),
        ACDC: Number(leiter.ACDC) || 0,
        NummerLeiter: Number(leiter.NummerLeiter) || 0,
        AbstandMastachse: Number(leiter.AbstandMastachse) || 0,
        Isolatorlaenge: Number(leiter.Isolatorlaenge) || 0,
        NextMastEbene: Number(leiter.NextMastEbene) || 0,
        NextMastLeiter: Number(leiter.NextMastLeiter) || 0,
        Einbauart: Number(leiter.Einbauart) || 0,
        Durchhang: Number(leiter.Durchhang) || 0,
        ParabelA: Number(leiter.ParabelA) || 0,
        ParabelB: Number(leiter.ParabelB) || 0,
        ParabelC: Number(leiter.ParabelC) || 0,
        SchallLw: String(leiter.SchallLw || ''),
        SchallLwDB: Number(leiter.SchallLwDB) || 0,
        BetrU: Number(leiter.BetrU) || 0,
        AmSeg: Number(leiter.AmSeg) || 0,
        SegLenU: Number(leiter.SegLenU) || 0,
        LeiterLen: Number(leiter.LeiterLen) || 0,
        Mittelpkt: this.validateGKVector3d(leiter.Mittelpkt),
        SegmentPunkte: this.validateGKVector3dArray(leiter.SegmentPunkte)
      };
    });
  }

  private static validateImmissionPoints(points: any): UsedImmissionPoint[] {
    if (!Array.isArray(points)) {
      return [];
    }

    return points.map((point, index) => {
      if (!point || typeof point !== 'object') {
        throw new UsedDataLoadError(`Invalid ImmissionPoint at index ${index}`);
      }

      return {
        Name: String(point.Name || ''),
        OriginalData: point.OriginalData || {},
        Position: this.validateGKVector3d(point.Position),
        HeightOffset: Number(point.HeightOffset) || 0,
        G_Bodenfaktor: Number(point.G_Bodenfaktor) || 0
      };
    });
  }

  private static validateESQSources(sources: any): UsedESQ[] {
    if (!Array.isArray(sources)) {
      return [];
    }

    return sources.map((source, index) => {
      if (!source || typeof source !== 'object') {
        throw new UsedDataLoadError(`Invalid ESQ at index ${index}`);
      }

      return {
        Bezeichnung: String(source.Bezeichnung || ''),
        Position: this.validateGKVector3d(source.Position),
        Hoehe: Number(source.Hoehe) || 0,
        Raumwinkelmass: Number(source.Raumwinkelmass) || 0,
        Beurteilungszeitraum: Number(source.Beurteilungszeitraum) || 0,
        Schallleistungspegel: Boolean(source.Schallleistungspegel),
        L: Number(source.L) || 0,
        S: Number(source.S) || 0,
        Z_Impulshaltigkeit: Number(source.Z_Impulshaltigkeit) || 0,
        Z_Tonhaltigkeit: Number(source.Z_Tonhaltigkeit) || 0,
        Z_Cmet: Number(source.Z_Cmet) || 0,
        Ruhezeitzuschlag: Boolean(source.Ruhezeitzuschlag),
        Einwirkzeit: Number(source.Einwirkzeit) || 0,
        Zeiteinheit: Number(source.Zeiteinheit) || 0
      };
    });
  }

  private static validateHoehenpunkte(punkte: any): UsedHoehenpunkt[] {
    if (!Array.isArray(punkte)) {
      return [];
    }

    return punkte.map((punkt, index) => {
      if (!punkt || typeof punkt !== 'object') {
        throw new UsedDataLoadError(`Invalid Hoehenpunkt at index ${index}`);
      }

      return {
        LfdNummer: Number(punkt.LfdNummer) || 0,
        GK_Vektor: this.validateGKVector3d(punkt.GK_Vektor)
      };
    });
  }

  private static validateDGMDreiecke(dreiecke: any): UsedDGMDreieck[] {
    if (!Array.isArray(dreiecke)) {
      return [];
    }

    return dreiecke.map((dreieck, index) => {
      if (!dreieck || typeof dreieck !== 'object') {
        throw new UsedDataLoadError(`Invalid DGMDreieck at index ${index}`);
      }

      return {
        A: dreieck.A || {},
        B: dreieck.B || {},
        C: dreieck.C || {},
        LfdNummer: Number(dreieck.LfdNummer) || 0
      };
    });
  }

  private static validateDGMKanten(kanten: any): UsedDGMKante[] {
    if (!Array.isArray(kanten)) {
      return [];
    }

    return kanten.map((kante, index) => {
      if (!kante || typeof kante !== 'object') {
        throw new UsedDataLoadError(`Invalid DGMKante at index ${index}`);
      }

      return {
        EckeA: kante.EckeA || {},
        EckeB: kante.EckeB || {},
        DreieckA: Number(kante.DreieckA) || 0,
        DreieckB: Number(kante.DreieckB) || 0
      };
    });
  }

  private static validateVector2d(vector: any): Vector2dWithLength {
    if (!vector || typeof vector !== 'object') {
      return { x: 0, y: 0, Length: 0 };
    }
    return {
      x: Number(vector.x) || 0,
      y: Number(vector.y) || 0,
      Length: Number(vector.Length) || 0
    };
  }

  private static validateGKVector2d(vector: any): GKVector2d {
    if (!vector || typeof vector !== 'object') {
      return { Rechts: 0, Hoch: 0 };
    }
    return {
      Rechts: Number(vector.Rechts) || 0,
      Hoch: Number(vector.Hoch) || 0
    };
  }

  private static validateGKVector3d(vector: any): GKVector3d {
    if (!vector || typeof vector !== 'object') {
      return { 
        GK: { Rechts: 0, Hoch: 0 },
        z: 0
      };
    }
    return {
      GK: this.validateGKVector2d(vector.GK),
      z: Number(vector.z) || 0
    };
  }

  private static validateGKVector3dArray(vectors: any): GKVector3d[] {
    if (!Array.isArray(vectors)) {
      return [];
    }
    return vectors.map(v => this.validateGKVector3d(v));
  }
}