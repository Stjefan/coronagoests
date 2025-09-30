// New UI Data Structure for Trassen
// Provides a clean separation between UI representation and computational data

import type { GKVector2d, GKVector3d, vector2d } from './usedData';

// Extended vector2d with optional Length property
export interface Vector2dWithLength extends vector2d {
  Length?: number;
}

// Main Trasse (Powerline) structure
export interface TrasseNew {
  id: string;
  name: string;
  templateId: string;  // Reference to the pole template
  poleIds: string[];   // Ordered list of pole IDs
}

// Template describing the pole structure
export interface PoleTemplate {
  id: string;
  name: string;
  description?: string;
  
  // Structural configuration
  levels: LevelTemplate[];
}

// Template for a level (Ebene)
export interface LevelTemplate {
  levelNumber: number;
  defaultHeight: number;  // Default height relative to pole base
  
  // Connection points
  leftConnections: number;   // Number of connections on left side
  rightConnections: number;  // Number of connections on right side
}

// Individual Pole instance
export interface Pole {
  id: string;
  trasseId: string;
  name: string;         // Pole name
  
  // Position and dimensions
  position: GKVector3d;  // Ground position (Fusspunkt)
  poleHeight: number;    // Total height of the pole
  nullpunktHeight: number; // Nullpunkt height
  orientation: Vector2dWithLength; // Direction vector
  gkOrientation?: GKVector2d; // GK orientation if different
  
  // Levels with actual heights
  levels: Level[];
}

// Level instance on a specific pole
export interface Level {
  levelNumber: number;
  levelHeight: number;  // Actual height above pole base (can override template)
  
  // Connections at this level
  leftConnections: Connection[];
  rightConnections: Connection[];
}

// Connection point on a pole
export interface Connection {
  id: string;
  poleId: string;
  levelNumber: number;
  side: 'left' | 'right';
  connectionNumber: number;  // 1-based index on this side
  
  // Physical properties
  horizontalDistance2Pole: number;  // Distance from pole centerline
  isolatorLength?: number;          // Length of insulator
  einbauart: number;               // Installation type (0=T-380KV, 1=T-220KV, 2=Abspann)
  
  // Link to paired connection on next pole
  connected2Connection?: string;  // ID of the connection on the next pole
  
  // Store original Durchgangspunkt if it differs from calculated
  durchgangspunktGK?: { Rechts: number; Hoch: number };
  durchgangspunktZ?: number;
  
  // Store original conductor properties when no connectionLine exists
  acdc?: number;
  schallLw?: string;
  schallLwDB?: number;
}

// ConnectionLine representing a conductor between two connections
export interface ConnectionLine {
  id: string;
  trasseId: string;
  
  // The two connections this line connects
  fromConnectionId: string;
  toConnectionId: string;
  
  // Line properties
  connectionLineType: string;  // Reference to conductor type (e.g., "L1", "L2")
  maxSag: number;             // Maximum sag of the line
  
  // Electrical properties
  operatingVoltage?: number;   // Operating voltage (kV)
  soundPowerLevel?: number;    // Sound power level (dB)
  acdc?: number;               // AC/DC type (0=DC, 1=AC, 2=AC3Phase)
}

// Helper type for connection reference
export interface ConnectionRef {
  poleId: string;
  levelNumber: number;
  side: 'left' | 'right';
  connectionNumber: number;
}

// Utility functions for working with the new structures

/**
 * Generate a unique connection ID
 */
export function getConnectionId(
  poleId: string,
  levelNumber: number,
  side: 'left' | 'right',
  connectionNumber: number
): string {
  return `${poleId}_L${levelNumber}_${side[0].toUpperCase()}${connectionNumber}`;
}

/**
 * Parse a connection ID to get its components
 */
export function parseConnectionId(connectionId: string): ConnectionRef | null {
  const match = connectionId.match(/^(.+)_L(\d+)_([LR])(\d+)$/);
  if (!match) {
    return null;
  }
  
  return {
    poleId: match[1],
    levelNumber: parseInt(match[2]),
    side: match[3] === 'L' ? 'left' : 'right',
    connectionNumber: parseInt(match[4])
  };
}

/**
 * Create a connection line between two connections
 */
export function createConnectionLine(
  trasseId: string,
  fromConnection: Connection,
  toConnection: Connection,
  lineType: string,
  maxSag: number = 5.0
): ConnectionLine {
  return {
    id: `${fromConnection.id}_to_${toConnection.id}`,
    trasseId,
    fromConnectionId: fromConnection.id,
    toConnectionId: toConnection.id,
    connectionLineType: lineType,
    maxSag
  };
}

/**
 * Find all connection lines for a specific pole
 */
export function getConnectionLinesForPole(
  poleId: string,
  connections: Map<string, Connection>,
  connectionLines: ConnectionLine[]
): ConnectionLine[] {
  const poleConnectionIds = new Set<string>();
  
  // Get all connection IDs for this pole
  for (const [id, conn] of connections) {
    if (conn.poleId === poleId) {
      poleConnectionIds.add(id);
    }
  }
  
  // Find all lines that start from this pole's connections
  return connectionLines.filter(line => 
    poleConnectionIds.has(line.fromConnectionId)
  );
}

/**
 * Create default pole from template
 */
export function createPoleFromTemplate(
  trasseId: string,
  template: PoleTemplate,
  position: GKVector3d,
  poleHeight: number = 60
): Pole {
  const pole: Pole = {
    id: `pole_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    trasseId,
    name: 'No Name',
    position,
    poleHeight,
    nullpunktHeight: 0,
    orientation: { x: 0, y: 1, Length: 1 } as Vector2dWithLength,
    levels: []
  };
  
  // Create levels from template
  for (const levelTemplate of template.levels) {
    const level: Level = {
      levelNumber: levelTemplate.levelNumber,
      levelHeight: levelTemplate.defaultHeight,
      leftConnections: [],
      rightConnections: []
    };
    
    // Create left connections
    for (let i = 0; i < levelTemplate.leftConnections; i++) {
      const connection: Connection = {
        id: getConnectionId(pole.id, levelTemplate.levelNumber, 'left', i + 1),
        poleId: pole.id,
        levelNumber: levelTemplate.levelNumber,
        side: 'left',
        connectionNumber: i + 1,
        horizontalDistance2Pole: 5 + i * 2,  // Default spacing
        einbauart: 0,
      };
      level.leftConnections.push(connection);
    }
    
    // Create right connections
    for (let i = 0; i < levelTemplate.rightConnections; i++) {
      const connection: Connection = {
        id: getConnectionId(pole.id, levelTemplate.levelNumber, 'right', i + 1),
        poleId: pole.id,
        levelNumber: levelTemplate.levelNumber,
        side: 'right',
        connectionNumber: i + 1,
        horizontalDistance2Pole: 5 + i * 2,  // Default spacing,
        einbauart: 0,
      };
      level.rightConnections.push(connection);
    }
    
    pole.levels.push(level);
  }
  
  return pole;
}

/**
 * Connect two poles by creating connection lines between matching connections
 */
export function connectPoles(
  fromPole: Pole,
  toPole: Pole,
  trasseId: string,
  defaultLineType: string = "L1"
): ConnectionLine[] {
  const connectionLines: ConnectionLine[] = [];
  
  // Connect matching levels and connections
  for (const fromLevel of fromPole.levels) {
    const toLevel = toPole.levels.find(l => l.levelNumber === fromLevel.levelNumber);
    if (!toLevel) continue;
    
    // Connect left connections
    const leftCount = Math.min(fromLevel.leftConnections.length, toLevel.leftConnections.length);
    for (let i = 0; i < leftCount; i++) {
      const fromConn = fromLevel.leftConnections[i];
      const toConn = toLevel.leftConnections[i];
      
      // Update connection references
      fromConn.connected2Connection = toConn.id;
      
      // Create connection line
      connectionLines.push(createConnectionLine(
        trasseId,
        fromConn,
        toConn,
        defaultLineType
      ));
    }
    
    // Connect right connections
    const rightCount = Math.min(fromLevel.rightConnections.length, toLevel.rightConnections.length);
    for (let i = 0; i < rightCount; i++) {
      const fromConn = fromLevel.rightConnections[i];
      const toConn = toLevel.rightConnections[i];
      
      // Update connection references
      fromConn.connected2Connection = toConn.id;
      
      // Create connection line
      connectionLines.push(createConnectionLine(
        trasseId,
        fromConn,
        toConn,
        defaultLineType
      ));
    }
  }
  
  return connectionLines;
}