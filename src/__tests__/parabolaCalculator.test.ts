import { describe, it, expect } from 'vitest';
import { calculateParabolaParameters, calculateParabolaParametersForAll } from '../utils/parabolaCalculator';
import type { UsedTrasse, UsedMast, UsedEbene, UsedLeiter } from '../types/usedData';

describe('ParabolaCalculator', () => {
  // Helper function to create a test conductor
  function createTestLeiter(
    nummerLeiter: number,
    x: number,
    y: number,
    z: number,
    durchhang: number = 5,
    nextMastEbene: number = 0,
    nextMastLeiter: number = 0
  ): UsedLeiter {
    return {
      Durchgangspunkt: {
        GK: { Rechts: x, Hoch: y },
        z: z
      },
      ACDC: 1,
      NummerLeiter: nummerLeiter,
      AbstandMastachse: 10,
      Isolatorlaenge: 2.5,
      NextMastEbene: nextMastEbene,
      NextMastLeiter: nextMastLeiter,
      Einbauart: 0,
      Durchhang: durchhang,
      ParabelA: 0,
      ParabelB: 0,
      ParabelC: 0,
      SchallLw: '',
      SchallLwDB: 55,
      BetrU: 380,
      AmSeg: 0,
      SegLenU: 0,
      LeiterLen: 0,
      Mittelpkt: { GK: { Rechts: 0, Hoch: 0 }, z: 0 },
      SegmentPunkte: []
    };
  }

  // Helper function to create a test mast
  function createTestMast(name: string, x: number, y: number, z: number): UsedMast {
    return {
      Fusspunkt: {
        lfdNummer: 1,
        OVektor: { x: 0, y: 0, Length: 0 },
        GK_Vektor: { GK: { Rechts: x, Hoch: y }, z: z }
      },
      Name: name,
      NullpunktHoehe: 150,
      MastHoehe: 100,
      Ausrichtung: { x: 0, y: 1, Length: 1 },
      GKAusrichtung: { Rechts: 0, Hoch: 1 },
      UsedEbenen: []
    };
  }

  describe('calculateParabolaParameters', () => {
    it('should calculate parabola parameters for a simple two-mast trasse', () => {
      // Create two masts 100m apart
      const mast1 = createTestMast('M1', 0, 0, 50);
      const mast2 = createTestMast('M2', 100, 0, 50);
      
      // Add a conductor on level 1, left side
      const leiter1 = createTestLeiter(1, -10, 0, 80, 5, 1, -1); // Connects to mast2, level 1, left conductor 1
      const leiter2 = createTestLeiter(1, 90, 0, 80, 5, 0, 0); // End conductor, no connection
      
      const ebene1Mast1: UsedEbene = {
        NummerEbene: 1,
        AbstandNullpunkt: 30,
        UsedLeitungenLinks: [leiter1],
        UsedLeitungenRechts: []
      };
      
      const ebene1Mast2: UsedEbene = {
        NummerEbene: 1,
        AbstandNullpunkt: 30,
        UsedLeitungenLinks: [leiter2],
        UsedLeitungenRechts: []
      };
      
      mast1.UsedEbenen = [ebene1Mast1];
      mast2.UsedEbenen = [ebene1Mast2];
      
      const trasse: UsedTrasse = {
        Nummer: 1,
        Name: 'Test Trasse',
        AnzahlMastebenen: 1,
        AnzahlMastleitungen: 1,
        UsedMasten: [mast1, mast2]
      };
      
      // Calculate parabola parameters
      calculateParabolaParameters(trasse);
      
      // Check that parabola parameters were calculated
      expect(leiter1.ParabelA).toBeGreaterThan(0);
      expect(leiter1.ParabelC).toBe(80); // Should equal the starting z position
      expect(leiter1.BetrU).toBeCloseTo(100, 1); // Horizontal distance
      expect(leiter1.AmSeg).toBeGreaterThan(0); // Should have segments
      expect(leiter1.SegmentPunkte.length).toBe(leiter1.AmSeg);
      expect(leiter1.LeiterLen).toBeGreaterThan(100); // Should be longer than horizontal distance due to sag
    });

    it('should handle conductors with no connections', () => {
      const mast1 = createTestMast('M1', 0, 0, 50);
      const mast2 = createTestMast('M2', 100, 0, 50);
      
      // Conductor with no connection (NextMastEbene = 0)
      const leiter1 = createTestLeiter(1, -10, 0, 80, 5, 0, 0);
      const leiter2 = createTestLeiter(1, 90, 0, 80, 5, 0, 0);
      
      const ebene1Mast1: UsedEbene = {
        NummerEbene: 1,
        AbstandNullpunkt: 30,
        UsedLeitungenLinks: [leiter1],
        UsedLeitungenRechts: []
      };
      
      const ebene1Mast2: UsedEbene = {
        NummerEbene: 1,
        AbstandNullpunkt: 30,
        UsedLeitungenLinks: [leiter2],
        UsedLeitungenRechts: []
      };
      
      mast1.UsedEbenen = [ebene1Mast1];
      mast2.UsedEbenen = [ebene1Mast2];
      
      const trasse: UsedTrasse = {
        Nummer: 1,
        Name: 'Test Trasse',
        AnzahlMastebenen: 1,
        AnzahlMastleitungen: 1,
        UsedMasten: [mast1, mast2]
      };
      
      calculateParabolaParameters(trasse);
      
      // Parabola parameters should remain at 0
      expect(leiter1.ParabelA).toBe(0);
      expect(leiter1.ParabelB).toBe(0);
      expect(leiter1.ParabelC).toBe(0);
      expect(leiter1.AmSeg).toBe(0);
    });

    it('should calculate correct parabola shape with sag', () => {
      const mast1 = createTestMast('M1', 0, 0, 0);
      const mast2 = createTestMast('M2', 100, 0, 0);
      
      const durchhang = 10; // 10m sag
      const leiter1 = createTestLeiter(1, 0, 0, 100, durchhang, 1, 1); // Height 100m
      const leiter2 = createTestLeiter(1, 100, 0, 100, durchhang, 0, 0); // Same height
      
      const ebene1Mast1: UsedEbene = {
        NummerEbene: 1,
        AbstandNullpunkt: 100,
        UsedLeitungenLinks: [],
        UsedLeitungenRechts: [leiter1]
      };
      
      const ebene1Mast2: UsedEbene = {
        NummerEbene: 1,
        AbstandNullpunkt: 100,
        UsedLeitungenLinks: [],
        UsedLeitungenRechts: [leiter2]
      };
      
      mast1.UsedEbenen = [ebene1Mast1];
      mast2.UsedEbenen = [ebene1Mast2];
      
      const trasse: UsedTrasse = {
        Nummer: 1,
        Name: 'Test Trasse',
        AnzahlMastebenen: 1,
        AnzahlMastleitungen: 1,
        UsedMasten: [mast1, mast2]
      };
      
      calculateParabolaParameters(trasse);
      
      // Check parabola equation parameters
      // ParabelA = 4 * d / L^2 where L is horizontal distance
      const expectedParabelA = (4 * durchhang) / (100 * 100);
      expect(leiter1.ParabelA).toBeCloseTo(expectedParabelA, 5);
      
      // Since both points are at same height, ParabelB should account for the sag
      // ParabelB = (zB - zA - 4*d) / L = (100 - 100 - 4*10) / 100 = -40/100 = -0.4
      const expectedParabelB = -0.4;
      expect(leiter1.ParabelB).toBeCloseTo(expectedParabelB, 5);
      
      // ParabelC should equal starting z position
      expect(leiter1.ParabelC).toBe(100);
      
      // Midpoint should be lower than endpoints due to sag
      expect(leiter1.Mittelpkt.z).toBeLessThan(100);
      
      // For the parabola equation z(s) = a*s*(L-s) + b*s + c (positive a term)
      // At midpoint (s = L/2 = 50):
      // z = a * 50 * 50 + b * 50 + c
      // z = 0.004 * 2500 + (-0.4) * 50 + 100
      // z = 10 - 20 + 100 = 90
      // So the midpoint should be at z = 90 (which matches the VB.NET behavior)
      expect(leiter1.Mittelpkt.z).toBeCloseTo(90, 1);
    });

    it('should handle cross-connections between left and right conductors', () => {
      const mast1 = createTestMast('M1', 0, 0, 0);
      const mast2 = createTestMast('M2', 100, 0, 0);
      
      // Left conductor on mast1 connects to right conductor on mast2
      const leiter1Left = createTestLeiter(1, -10, 0, 80, 5, 1, 1); // Connects to right side
      const leiter2Right = createTestLeiter(1, 110, 0, 80, 5, 0, 0);
      
      const ebene1Mast1: UsedEbene = {
        NummerEbene: 1,
        AbstandNullpunkt: 80,
        UsedLeitungenLinks: [leiter1Left],
        UsedLeitungenRechts: []
      };
      
      const ebene1Mast2: UsedEbene = {
        NummerEbene: 1,
        AbstandNullpunkt: 80,
        UsedLeitungenLinks: [],
        UsedLeitungenRechts: [leiter2Right]
      };
      
      mast1.UsedEbenen = [ebene1Mast1];
      mast2.UsedEbenen = [ebene1Mast2];
      
      const trasse: UsedTrasse = {
        Nummer: 1,
        Name: 'Test Trasse',
        AnzahlMastebenen: 1,
        AnzahlMastleitungen: 1,
        UsedMasten: [mast1, mast2]
      };
      
      calculateParabolaParameters(trasse);
      
      // Should calculate parameters for the cross-connection
      expect(leiter1Left.ParabelA).toBeGreaterThan(0);
      expect(leiter1Left.BetrU).toBeCloseTo(Math.sqrt(120 * 120), 1); // Distance from -10 to 110
    });

    it('should calculate segments correctly', () => {
      const mast1 = createTestMast('M1', 0, 0, 0);
      const mast2 = createTestMast('M2', 50, 0, 0); // 50m apart
      
      const leiter1 = createTestLeiter(1, 0, 0, 100, 5, 1, 1);
      const leiter2 = createTestLeiter(1, 50, 0, 100, 5, 0, 0);
      
      const ebene1Mast1: UsedEbene = {
        NummerEbene: 1,
        AbstandNullpunkt: 100,
        UsedLeitungenLinks: [],
        UsedLeitungenRechts: [leiter1]
      };
      
      const ebene1Mast2: UsedEbene = {
        NummerEbene: 1,
        AbstandNullpunkt: 100,
        UsedLeitungenLinks: [],
        UsedLeitungenRechts: [leiter2]
      };
      
      mast1.UsedEbenen = [ebene1Mast1];
      mast2.UsedEbenen = [ebene1Mast2];
      
      const trasse: UsedTrasse = {
        Nummer: 1,
        Name: 'Test Trasse',
        AnzahlMastebenen: 1,
        AnzahlMastleitungen: 1,
        UsedMasten: [mast1, mast2]
      };
      
      calculateParabolaParameters(trasse);
      
      // Should have segments every 5 meters
      const expectedSegments = Math.floor(50 / 5); // 10 segments
      expect(leiter1.AmSeg).toBe(expectedSegments);
      expect(leiter1.SegLenU).toBeCloseTo(5, 1);
      expect(leiter1.SegmentPunkte.length).toBe(expectedSegments);
      
      // Check that segment points are spaced correctly
      for (let i = 0; i < leiter1.SegmentPunkte.length - 1; i++) {
        const p1 = leiter1.SegmentPunkte[i];
        const p2 = leiter1.SegmentPunkte[i + 1];
        const horizontalDist = Math.sqrt(
          Math.pow(p2.GK.Rechts - p1.GK.Rechts, 2) + 
          Math.pow(p2.GK.Hoch - p1.GK.Hoch, 2)
        );
        expect(horizontalDist).toBeCloseTo(5, 1);
      }
    });
  });

  describe('calculateParabolaParametersForAll', () => {
    it('should process multiple trassen', () => {
      const trassen: UsedTrasse[] = [];
      
      // Create two trassen
      for (let t = 0; t < 2; t++) {
        const mast1 = createTestMast(`M${t}-1`, t * 200, 0, 0);
        const mast2 = createTestMast(`M${t}-2`, t * 200 + 100, 0, 0);
        
        const leiter1 = createTestLeiter(1, t * 200, 0, 100, 5, 1, 1);
        const leiter2 = createTestLeiter(1, t * 200 + 100, 0, 100, 5, 0, 0);
        
        const ebene1Mast1: UsedEbene = {
          NummerEbene: 1,
          AbstandNullpunkt: 100,
          UsedLeitungenLinks: [],
          UsedLeitungenRechts: [leiter1]
        };
        
        const ebene1Mast2: UsedEbene = {
          NummerEbene: 1,
          AbstandNullpunkt: 100,
          UsedLeitungenLinks: [],
          UsedLeitungenRechts: [leiter2]
        };
        
        mast1.UsedEbenen = [ebene1Mast1];
        mast2.UsedEbenen = [ebene1Mast2];
        
        trassen.push({
          Nummer: t + 1,
          Name: `Trasse ${t + 1}`,
          AnzahlMastebenen: 1,
          AnzahlMastleitungen: 1,
          UsedMasten: [mast1, mast2]
        });
      }
      
      calculateParabolaParametersForAll(trassen);
      
      // Check that both trassen have calculated parameters
      for (const trasse of trassen) {
        const leiter = trasse.UsedMasten[0].UsedEbenen[0].UsedLeitungenRechts[0];
        expect(leiter.ParabelA).toBeGreaterThan(0);
        expect(leiter.AmSeg).toBeGreaterThan(0);
      }
    });
  });
});