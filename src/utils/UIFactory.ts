import { getConnectionId, type Connection } from "../types/trasseUINew";

export function createConnection(poleId: string, levelNumber: number, side: "left" | "right", connectionNumber: number,
    horizontalDistance2Pole: number,
    isolatorLength: number,
    einbauart: number
): Connection {
  return {
    id: getConnectionId(poleId, levelNumber, side, connectionNumber),
    poleId: poleId,
    levelNumber: levelNumber,
    side: side,
    connectionNumber: connectionNumber,
    horizontalDistance2Pole: horizontalDistance2Pole,
    isolatorLength: isolatorLength,
    einbauart: einbauart,
  };
}