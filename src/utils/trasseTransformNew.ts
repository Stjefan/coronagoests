// Transformation functions between new UI format and UsedData computation format

import type {
  UsedTrasse,
  UsedMast,
  UsedEbene,
  UsedLeiter,
  GKVector3d,
  HPunktData,
  HLeitertypData,
  vector2d,
  GKVector2d
} from '../types/usedData';

import type {
  TrasseNew,
  Pole,
  Level,
  Connection,
  ConnectionLine,
  Vector2dWithLength
} from '../types/trasseUINew';

import {
  getConnectionId,
  parseConnectionId
} from '../types/trasseUINew';

import {
  calculateMastOrientations
} from './vectorMath';

/**
 * Transform UI format to computation format (UsedTrasse)
 */
export function uiToComputation(
  trasse: TrasseNew,
  poles: Map<string, Pole>,
  connectionLines: ConnectionLine[],
  leiterTypes: HLeitertypData[]
): UsedTrasse {
  const usedMasten: UsedMast[] = [];
  
  // Create a map of connection lines by fromConnectionId for quick lookup
  const linesByFromConnection = new Map<string, ConnectionLine>();
  for (const line of connectionLines) {
    linesByFromConnection.set(line.fromConnectionId, line);
  }
  
  // Convert each pole to UsedMast
  const poleArray = Array.from(poles.values())
    .filter(p => p.trasseId === trasse.id)
    .sort((a, b) => {
      // Sort poles by their order in the trasse
      const indexA = trasse.poleIds.indexOf(a.id);
      const indexB = trasse.poleIds.indexOf(b.id);
      return indexA - indexB;
    });
  
  // Calculate orientations for all masts based on their positions
  const mastPositions = poleArray.map(p => ({
    x: p.position.GK.Rechts,
    y: p.position.GK.Hoch,
    Length: Math.sqrt(p.position.GK.Rechts * p.position.GK.Rechts + p.position.GK.Hoch * p.position.GK.Hoch)
  }));
  const mastPositionsGK = poleArray.map(p => p.position.GK);
  const orientations = calculateMastOrientations(mastPositions, mastPositionsGK);
  
  for (let poleIndex = 0; poleIndex < poleArray.length; poleIndex++) {
    const pole = poleArray[poleIndex];
    const nextPole = poleIndex < poleArray.length - 1 ? poleArray[poleIndex + 1] : null;
    const orientation = orientations[poleIndex];
    
    const usedMast = poleToUsedMast(
      pole,
      nextPole,
      linesByFromConnection,
      leiterTypes,
      poleIndex + 1,
      orientation
    );
    
    usedMasten.push(usedMast);
  }
  
  // Calculate total number of levels and conductors
  const anzahlMastebenen = Math.max(...usedMasten.map(m => m.UsedEbenen.length), 1);
  const anzahlMastleitungen = usedMasten.reduce((sum, mast) => {
    return Math.max(sum, mast.UsedEbenen.reduce((ebenenSum, ebene) => {
      return ebenenSum + ebene.UsedLeitungenLinks.length + ebene.UsedLeitungenRechts.length;
    }, 0));
  }, 0);
  
  return {
    Nummer: parseInt(trasse.id.replace(/\D/g, '').substr(0, 5)) || 1,
    Name: trasse.name,
    AnzahlMastebenen: anzahlMastebenen,
    AnzahlMastleitungen: anzahlMastleitungen,
    UsedMasten: usedMasten
  };
}

/**
 * Get the Isolatorlaenge
 */
function getIsolatorlaenge(connection: Connection): number {
  console.log("connection", connection);
  if (connection.einbauart === 0) {
    return 5;
  } else if (connection.einbauart === 1) {
    return 4;
  } else if (connection.einbauart === 2) {
    return 0;
  } else {
    throw new Error("Invalid einbauart: " + connection.einbauart);
  }
}

/**
 * Convert a Pole to UsedMast
 */
function poleToUsedMast(
  pole: Pole,
  nextPole: Pole | null,
  linesByFromConnection: Map<string, ConnectionLine>,
  leiterTypes: HLeitertypData[],
  lfdNummer: number,
  orientation?: { ausrichtung: vector2d, gkAusrichtung: GKVector2d }
): UsedMast {
  // Create Fusspunkt
  const fusspunkt: HPunktData = {
    lfdNummer: lfdNummer,
    OVektor: {
      x: pole.position.GK.Rechts,
      y: pole.position.GK.Hoch,
      Length: Math.sqrt(
        pole.position.GK.Rechts * pole.position.GK.Rechts +
        pole.position.GK.Hoch * pole.position.GK.Hoch
      )
    },
    GK_Vektor: pole.position
  };
  
  // Update pole with calculated orientation if provided
  const poleWithOrientation = {
    ...pole,
    orientation: orientation?.ausrichtung || pole.orientation,
    gkOrientation: orientation?.gkAusrichtung || pole.gkOrientation || {
      Rechts: pole.orientation.x,
      Hoch: pole.orientation.y
    }
  };
  
  // Convert levels to UsedEbenen
  const usedEbenen: UsedEbene[] = [];
  
  for (const level of pole.levels) {
    const usedEbene = levelToUsedEbene(
      level,
      poleWithOrientation,
      nextPole,
      linesByFromConnection,
      leiterTypes
    );
    usedEbenen.push(usedEbene);
  }
  
  // Calculate NullpunktHoehe (ground level + pole height)
  const nullpunktHoehe = pole.position.z + pole.poleHeight;
  
  return {
    Fusspunkt: fusspunkt,
    Name: pole.name || `Mast ${lfdNummer}`,
    NullpunktHoehe: nullpunktHoehe,
    MastHoehe: pole.poleHeight,
    Ausrichtung: poleWithOrientation.orientation as Required<Vector2dWithLength>,
    GKAusrichtung: poleWithOrientation.gkOrientation,
    UsedEbenen: usedEbenen
  };
}

/**
 * Convert a Level to UsedEbene
 */
function levelToUsedEbene(
  level: Level,
  pole: Pole,
  nextPole: Pole | null,
  linesByFromConnection: Map<string, ConnectionLine>,
  leiterTypes: HLeitertypData[]
): UsedEbene {
  const usedLeitungenLinks: UsedLeiter[] = [];
  const usedLeitungenRechts: UsedLeiter[] = [];
  
  // Convert left connections
  for (const connection of level.leftConnections) {
    const connectionLine = linesByFromConnection.get(connection.id);
    if (!connectionLine && connection.connected2Connection) {
      console.log(`WARNING: No connection line found for ${connection.id}`);
    }
    const usedLeiter = connectionToUsedLeiter(
      connection,
      pole,
      level,
      connectionLine,
      nextPole,
      leiterTypes,
      true
    );
    usedLeitungenLinks.push(usedLeiter);
  }
  
  // Convert right connections
  for (const connection of level.rightConnections) {
    const connectionLine = linesByFromConnection.get(connection.id);
    const usedLeiter = connectionToUsedLeiter(
      connection,
      pole,
      level,
      connectionLine,
      nextPole,
      leiterTypes,
      false
    );
    usedLeitungenRechts.push(usedLeiter);
  }
  
  // AbstandNullpunkt is negative (height above ground - total pole height)
  const abstandNullpunkt = level.levelHeight
  //  - pole.poleHeight;
  
  return {
    NummerEbene: level.levelNumber,
    AbstandNullpunkt: abstandNullpunkt,
    UsedLeitungenLinks: usedLeitungenLinks,
    UsedLeitungenRechts: usedLeitungenRechts
  };
}

/**
 * Convert a Connection to UsedLeiter
 */
function connectionToUsedLeiter(
  connection: Connection,
  pole: Pole,
  level: Level,
  connectionLine: ConnectionLine | undefined,
  nextPole: Pole | null,
  leiterTypes: HLeitertypData[],
  isLeft: boolean,
  useStoredDurchgangspunktZ: boolean = true
): UsedLeiter {
  // Calculate durchgangspunkt (passage point) using the GKAusrichtung
  // Based on VB.NET code: scale GKAusrichtung by distance/1000 and add to mast base
  // For left: positive scaling, for right: negative scaling
  const gkAusrichtung = pole.gkOrientation || {
    Rechts: pole.orientation.x,
    Hoch: pole.orientation.y
  };
  
  // Normalize the GKAusrichtung vector
  const gkLength = Math.sqrt(gkAusrichtung.Rechts * gkAusrichtung.Rechts + gkAusrichtung.Hoch * gkAusrichtung.Hoch);
  let normalizedGKRechts = gkAusrichtung.Rechts;
  let normalizedGKHoch = gkAusrichtung.Hoch;
  
  if (gkLength > 0) {
    normalizedGKRechts /= gkLength;
    normalizedGKHoch /= gkLength;
  }
  
  // Scale by distance (converting to km by dividing by 1000 in original, but our distances are in meters)
  // For left conductors: use positive scaling
  // For right conductors: use negative scaling
  const scaleFactor = isLeft ? connection.horizontalDistance2Pole : -connection.horizontalDistance2Pole;
  
  // Use stored durchgangspunktZ if available, otherwise calculate from level height
  const durchgangspunktZ = connection.durchgangspunktZ !== undefined 
    ? connection.durchgangspunktZ 
    : pole.position.z + level.levelHeight;
  
    console.log("connection", connection);
    console.log("pole", pole);
    console.log("level", level);
    console.log("Legacy DurchgangspunktZ", connection.durchgangspunktZ);
    console.log("Expected Isolatorlaenge", getIsolatorlaenge(connection));
    const computedDurchgangspunktZ = pole.nullpunktHeight + level.levelHeight - getIsolatorlaenge(connection);
    console.log("Computed DurchgangspunktZ", computedDurchgangspunktZ);
    const durchgangspunkt: GKVector3d = {
    GK: {
      Rechts: pole.position.GK.Rechts + normalizedGKRechts * scaleFactor,
      Hoch: pole.position.GK.Hoch + normalizedGKHoch * scaleFactor
    },
    z: !useStoredDurchgangspunktZ ? durchgangspunktZ : computedDurchgangspunktZ
  };
  
  // Determine next mast connection
  let nextMastEbene = 0;
  let nextMastLeiter = 0;
  
  // Check connected2Connection directly, not requiring connectionLine
  if (connection.connected2Connection && nextPole) {
    const targetRef = parseConnectionId(connection.connected2Connection);
    if (targetRef) {
      nextMastEbene = targetRef.levelNumber;
      // Negative for left, positive for right
      nextMastLeiter = targetRef.side === 'left' 
        ? -targetRef.connectionNumber 
        : targetRef.connectionNumber;
    }
  }
  
  // Get conductor type properties
  let schallLw = connectionLine?.connectionLineType || '';
  let schallLwDB = connectionLine?.soundPowerLevel !== undefined ? connectionLine.soundPowerLevel : 0;
  
  // Only look up in leiterTypes if we have a type name but NO stored dB value
  // This preserves the original 0 value if it was intentionally 0
  if (schallLw && connectionLine?.soundPowerLevel === undefined) {
    const leiterType = leiterTypes.find(lt => lt.Name === schallLw);
    if (leiterType) {
      schallLwDB = leiterType.SchallLW;
    }
  }
  
  // Calculate mittelpunkt (midpoint) - will be recalculated by parabola calculator
  const mittelpkt = durchgangspunkt;
  
  // Use connectionLine values if available, otherwise fall back to connection stored values
  const acdcValue = connectionLine?.acdc !== undefined 
    ? connectionLine.acdc 
    : (connection.acdc !== undefined ? connection.acdc : 1);
  
  // For SchallLw and SchallLwDB, prefer connectionLine but fall back to connection
  if (!connectionLine && connection.schallLw !== undefined) {
    schallLw = connection.schallLw;
  }
  if (!connectionLine && connection.schallLwDB !== undefined) {
    schallLwDB = connection.schallLwDB;
  }
  
  console.log("Provided to computation: ", durchgangspunkt);
  return {
    Durchgangspunkt: durchgangspunkt,
    ACDC: acdcValue,
    NummerLeiter: isLeft ? -connection.connectionNumber : connection.connectionNumber,
    AbstandMastachse: connection.horizontalDistance2Pole,
    Isolatorlaenge: connection.isolatorLength || 2.5,
    NextMastEbene: nextMastEbene,
    NextMastLeiter: nextMastLeiter,
    Einbauart: 0,
    Durchhang: connectionLine?.maxSag || 5,
    ParabelA: 0,  // Will be calculated
    ParabelB: 0,  // Will be calculated
    ParabelC: 0,  // Will be calculated
    SchallLw: schallLw,
    SchallLwDB: schallLwDB,
    BetrU: connectionLine?.operatingVoltage || 0,
    AmSeg: 0,
    SegLenU: 0,
    LeiterLen: 0,  // Will be calculated
    Mittelpkt: mittelpkt,
    SegmentPunkte: []
  };
}

/**
 * Transform computation format back to UI format
 */
export function computationToUI(
  usedTrasse: UsedTrasse,
  templateId: string,
  trasseId?: string
): {
  trasse: TrasseNew,
  poles: Map<string, Pole>,
  connectionLines: ConnectionLine[]
} {
  const poles = new Map<string, Pole>();
  const connectionLines: ConnectionLine[] = [];
  const poleIds: string[] = [];
  
  // Track connections for creating ConnectionLines
  const allConnections = new Map<string, Connection>();
  
  // Use trasseId for consistency across pole IDs
  const effectiveTrasseId = trasseId || usedTrasse.Nummer.toString();
  
  // Convert each UsedMast to Pole
  for (let mastIndex = 0; mastIndex < usedTrasse.UsedMasten.length; mastIndex++) {
    const usedMast = usedTrasse.UsedMasten[mastIndex];
    const poleId = `pole_${effectiveTrasseId}_${mastIndex + 1}`;
    poleIds.push(poleId);
    
    const pole = usedMastToPole(usedMast, poleId, effectiveTrasseId);
    poles.set(poleId, pole);
    
    // Collect all connections
    for (const level of pole.levels) {
      for (const conn of level.leftConnections) {
        allConnections.set(conn.id, conn);
      }
      for (const conn of level.rightConnections) {
        allConnections.set(conn.id, conn);
      }
    }
  }
  
  // Create ConnectionLines based on NextMastEbene/NextMastLeiter references
  for (let mastIndex = 0; mastIndex < usedTrasse.UsedMasten.length - 1; mastIndex++) {
    const fromPoleId = poleIds[mastIndex];
    const toPoleId = poleIds[mastIndex + 1];
    const toPole = poles.get(toPoleId)!;
    const usedMast = usedTrasse.UsedMasten[mastIndex];
    
    for (const usedEbene of usedMast.UsedEbenen) {
      // Process left conductors
      for (let i = 0; i < usedEbene.UsedLeitungenLinks.length; i++) {
        const usedLeiter = usedEbene.UsedLeitungenLinks[i];
        if (usedLeiter.NextMastEbene > 0) {
          const fromConnId = getConnectionId(fromPoleId, usedEbene.NummerEbene, 'left', i + 1);
          const toLevel = toPole.levels.find(l => l.levelNumber === usedLeiter.NextMastEbene);
          
          if (toLevel) {
            let toConn: Connection | undefined;
            if (usedLeiter.NextMastLeiter < 0) {
              // Connect to left side
              const targetIndex = Math.abs(usedLeiter.NextMastLeiter) - 1;
              toConn = toLevel.leftConnections[targetIndex];
            } else if (usedLeiter.NextMastLeiter > 0) {
              // Connect to right side
              const targetIndex = usedLeiter.NextMastLeiter - 1;
              toConn = toLevel.rightConnections[targetIndex];
            }
            
            if (toConn) {
              // Update connection reference
              const fromConn = allConnections.get(fromConnId);
              if (fromConn) {
                fromConn.connected2Connection = toConn.id;
              }
              
              // Create ConnectionLine
              connectionLines.push({
                id: `line_${mastIndex}_${usedEbene.NummerEbene}_L${i + 1}`,
                trasseId: effectiveTrasseId,
                fromConnectionId: fromConnId,
                toConnectionId: toConn.id,
                connectionLineType: usedLeiter.SchallLw || `Type_${usedLeiter.SchallLwDB}dB`,
                maxSag: usedLeiter.Durchhang > 0 ? usedLeiter.Durchhang : 5,  // Use default if 0
                operatingVoltage: usedLeiter.BetrU,
                soundPowerLevel: usedLeiter.SchallLwDB,
                acdc: usedLeiter.ACDC
              });
            }
          }
        }
      }
      
      // Process right conductors
      for (let i = 0; i < usedEbene.UsedLeitungenRechts.length; i++) {
        const usedLeiter = usedEbene.UsedLeitungenRechts[i];
        if (usedLeiter.NextMastEbene > 0) {
          const fromConnId = getConnectionId(fromPoleId, usedEbene.NummerEbene, 'right', i + 1);
          const toLevel = toPole.levels.find(l => l.levelNumber === usedLeiter.NextMastEbene);
          
          if (toLevel) {
            let toConn: Connection | undefined;
            if (usedLeiter.NextMastLeiter < 0) {
              // Connect to left side
              const targetIndex = Math.abs(usedLeiter.NextMastLeiter) - 1;
              toConn = toLevel.leftConnections[targetIndex];
            } else if (usedLeiter.NextMastLeiter > 0) {
              // Connect to right side
              const targetIndex = usedLeiter.NextMastLeiter - 1;
              toConn = toLevel.rightConnections[targetIndex];
            }
            
            if (toConn) {
              // Update connection reference
              const fromConn = allConnections.get(fromConnId);
              if (fromConn) {
                fromConn.connected2Connection = toConn.id;
              }
              
              // Create ConnectionLine
              connectionLines.push({
                id: `line_${mastIndex}_${usedEbene.NummerEbene}_R${i + 1}`,
                trasseId: effectiveTrasseId,
                fromConnectionId: fromConnId,
                toConnectionId: toConn.id,
                connectionLineType: usedLeiter.SchallLw || `Type_${usedLeiter.SchallLwDB}dB`,
                maxSag: usedLeiter.Durchhang > 0 ? usedLeiter.Durchhang : 5,  // Use default if 0
                operatingVoltage: usedLeiter.BetrU,
                soundPowerLevel: usedLeiter.SchallLwDB,
                acdc: usedLeiter.ACDC
              });
            }
          }
        }
      }
    }
  }
  
  // Use provided trasseId (UUID) or fall back to numeric ID
  const trasse: TrasseNew = {
    id: trasseId || usedTrasse.Nummer.toString(),
    name: usedTrasse.Name,
    templateId: templateId,
    poleIds: poleIds
  };
  
  return {
    trasse,
    poles,
    connectionLines
  };
}

/**
 * Convert UsedMast to Pole
 */
function usedMastToPole(
  usedMast: UsedMast,
  poleId: string,
  trasseId: string
): Pole {
  const levels: Level[] = [];
  
  console.log("Using this mast: ", usedMast);
  for (const usedEbene of usedMast.UsedEbenen) {
    const level: Level = {
      levelNumber: usedEbene.NummerEbene,
      // Convert back from negative offset to actual height
      levelHeight: /*usedMast.MastHoehe + */usedEbene.AbstandNullpunkt,
      leftConnections: [],
      rightConnections: []
    };
    
    // Convert left conductors
    for (let i = 0; i < usedEbene.UsedLeitungenLinks.length; i++) {
      const usedLeiter = usedEbene.UsedLeitungenLinks[i];
      const connection: Connection = {
        id: getConnectionId(poleId, usedEbene.NummerEbene, 'left', i + 1),
        poleId: poleId,
        levelNumber: usedEbene.NummerEbene,
        side: 'left',
        connectionNumber: i + 1,
        horizontalDistance2Pole: usedLeiter.AbstandMastachse,
        isolatorLength: usedLeiter.Isolatorlaenge,
        einbauart: usedLeiter.Einbauart,
        // Store original Durchgangspunkt values
        durchgangspunktGK: {
          Rechts: usedLeiter.Durchgangspunkt.GK.Rechts,
          Hoch: usedLeiter.Durchgangspunkt.GK.Hoch
        },
        durchgangspunktZ: usedLeiter.Durchgangspunkt.z,
        // Store conductor properties for preservation
        acdc: usedLeiter.ACDC,
        schallLw: usedLeiter.SchallLw,
        schallLwDB: usedLeiter.SchallLwDB
      };
      level.leftConnections.push(connection);
    }
    
    // Convert right conductors
    for (let i = 0; i < usedEbene.UsedLeitungenRechts.length; i++) {
      const usedLeiter = usedEbene.UsedLeitungenRechts[i];
      const connection: Connection = {
        id: getConnectionId(poleId, usedEbene.NummerEbene, 'right', i + 1),
        poleId: poleId,
        levelNumber: usedEbene.NummerEbene,
        side: 'right',
        connectionNumber: i + 1,
        horizontalDistance2Pole: usedLeiter.AbstandMastachse,
        isolatorLength: usedLeiter.Isolatorlaenge,
        einbauart: usedLeiter.Einbauart,
        // Store original Durchgangspunkt values
        durchgangspunktGK: {
          Rechts: usedLeiter.Durchgangspunkt.GK.Rechts,
          Hoch: usedLeiter.Durchgangspunkt.GK.Hoch
        },
        durchgangspunktZ: usedLeiter.Durchgangspunkt.z,
        // Store conductor properties for preservation
        acdc: usedLeiter.ACDC,
        schallLw: usedLeiter.SchallLw,
        schallLwDB: usedLeiter.SchallLwDB
      };
      level.rightConnections.push(connection);
    }
    
    levels.push(level);
  }
  
  console.log("Return this levels: ", levels);
  return {
    id: poleId,
    trasseId: trasseId,
    name: usedMast.Name || 'No Name',
    position: usedMast.Fusspunkt.GK_Vektor,
    poleHeight: usedMast.MastHoehe,
    nullpunktHeight: usedMast.NullpunktHoehe || 0,
    orientation: usedMast.Ausrichtung as Vector2dWithLength,
    gkOrientation: usedMast.GKAusrichtung,
    levels: levels
  };
}

