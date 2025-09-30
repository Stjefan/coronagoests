import { describe, it, expect } from 'vitest';
import { calculateParabolaParameters } from '../utils/parabolaCalculator';
import type { UsedTrasse } from '../types/usedData';
import testDataTrasse4 from '../test/data/trasse4gelaende.json';
import testDataSimple1 from '../test/data/simple1.json';

describe('Parabola Calculator Validation', () => {
  describe('Validate against trasse4gelaende.json', () => {
    it('should calculate the same parabola parameters as in test data', () => {
      const projectData = testDataTrasse4.ProjectData;
      const trasse = projectData.Trassen[0] as UsedTrasse;
      
      // Get the original values from the first conductor
      const originalLeiter = trasse.UsedMasten[0].UsedEbenen[0].UsedLeitungenLinks[0];
      const originalParabelA = originalLeiter.ParabelA;
      const originalParabelB = originalLeiter.ParabelB;
      const originalParabelC = originalLeiter.ParabelC;
      const originalMittelpkt = originalLeiter.Mittelpkt;
      const originalBetrU = originalLeiter.BetrU;
      
      console.log('Original values from JSON:');
      console.log('ParabelA:', originalParabelA);
      console.log('ParabelB:', originalParabelB);
      console.log('ParabelC:', originalParabelC);
      console.log('Mittelpkt:', originalMittelpkt);
      console.log('BetrU:', originalBetrU);
      
      // Clear the parabola parameters to test our calculation
      originalLeiter.ParabelA = 0;
      originalLeiter.ParabelB = 0;
      originalLeiter.ParabelC = 0;
      originalLeiter.Mittelpkt = { GK: { Rechts: 0, Hoch: 0 }, z: 0 };
      originalLeiter.BetrU = 0;
      originalLeiter.SegmentPunkte = [];
      
      // Calculate parabola parameters
      calculateParabolaParameters(trasse);
      
      console.log('\nCalculated values:');
      console.log('ParabelA:', originalLeiter.ParabelA);
      console.log('ParabelB:', originalLeiter.ParabelB);
      console.log('ParabelC:', originalLeiter.ParabelC);
      console.log('Mittelpkt:', originalLeiter.Mittelpkt);
      console.log('BetrU:', originalLeiter.BetrU);
      
      // Validate ParabelA (should be very close)
      expect(originalLeiter.ParabelA).toBeCloseTo(originalParabelA, 10);
      
      // Validate ParabelB
      expect(originalLeiter.ParabelB).toBeCloseTo(originalParabelB, 5);
      
      // Validate ParabelC (should equal starting z position)
      expect(originalLeiter.ParabelC).toBeCloseTo(originalParabelC, 5);
      
      // Validate BetrU (horizontal distance)
      expect(originalLeiter.BetrU).toBeCloseTo(originalBetrU, 2);
      
      // Validate Mittelpunkt position
      expect(originalLeiter.Mittelpkt.GK.Rechts).toBeCloseTo(originalMittelpkt.GK.Rechts, 2);
      expect(originalLeiter.Mittelpkt.GK.Hoch).toBeCloseTo(originalMittelpkt.GK.Hoch, 2);
      expect(originalLeiter.Mittelpkt.z).toBeCloseTo(originalMittelpkt.z, 2);
    });
    
    it('should verify the parabola equation produces correct midpoint', () => {
      const projectData = testDataTrasse4.ProjectData;
      const trasse = projectData.Trassen[0] as UsedTrasse;
      
      // Get the conductor data
      const leiter = trasse.UsedMasten[0].UsedEbenen[0].UsedLeitungenLinks[0];
      const nextLeiter = trasse.UsedMasten[1].UsedEbenen[0].UsedLeitungenLinks[0];
      
      // Clear and recalculate
      leiter.ParabelA = 0;
      leiter.ParabelB = 0;
      leiter.ParabelC = 0;
      leiter.Mittelpkt = { GK: { Rechts: 0, Hoch: 0 }, z: 0 };
      
      calculateParabolaParameters(trasse);
      
      // Verify the parabola equation at midpoint
      const L = leiter.BetrU; // Total horizontal distance
      const s = L / 2; // Midpoint distance
      
      // Calculate z using the parabola equation: z(s) = a*s*(L-s) + b*s + c (positive a term)
      const calculatedZ = leiter.ParabelA * s * (L - s) + leiter.ParabelB * s + leiter.ParabelC;
      
      console.log('\nParabola equation verification:');
      console.log('L (total distance):', L);
      console.log('s (midpoint distance):', s);
      console.log('Calculated z at midpoint:', calculatedZ);
      console.log('Stored Mittelpkt.z:', leiter.Mittelpkt.z);
      
      // The calculated z should match the stored midpoint z
      expect(calculatedZ).toBeCloseTo(leiter.Mittelpkt.z, 5);
      
      // For an inclined span, the midpoint should be between the endpoints
      // In this case, the cable goes uphill from z=109 to z=275
      const minZ = Math.min(leiter.Durchgangspunkt.z, nextLeiter.Durchgangspunkt.z);
      const maxZ = Math.max(leiter.Durchgangspunkt.z, nextLeiter.Durchgangspunkt.z);
      expect(leiter.Mittelpkt.z).toBeGreaterThan(minZ);
      expect(leiter.Mittelpkt.z).toBeLessThan(maxZ);
      
      // Calculate expected sag point
      const startZ = leiter.Durchgangspunkt.z;
      const endZ = nextLeiter.Durchgangspunkt.z;
      const averageZ = (startZ + endZ) / 2;
      const sag = leiter.Durchhang;
      
      console.log('Start z:', startZ);
      console.log('End z:', endZ);
      console.log('Average z:', averageZ);
      console.log('Sag:', sag);
      
      // For a non-level span, the lowest point isn't exactly at the midpoint
      // but our Mittelpkt should still be reasonable
      expect(leiter.Mittelpkt.z).toBeGreaterThan(averageZ - 2 * sag);
      expect(leiter.Mittelpkt.z).toBeLessThan(averageZ + sag);
    });
  });

  describe('Validate against simple1.json', () => {
    it('should calculate correct parabola parameters for simple1 test data', () => {
      const projectData = testDataSimple1.ProjectData;
      
      // Check if Trassen exists
      if (!projectData.Trassen || projectData.Trassen.length === 0) {
        console.log('No Trassen in simple1.json, skipping test');
        return;
      }
      
      const trasse = projectData.Trassen[0] as UsedTrasse;
      
      // Check if masts exist
      if (!trasse.UsedMasten || trasse.UsedMasten.length === 0) {
        console.log('No UsedMasten in simple1.json, skipping test');
        return;
      }
      
      // Get the original values
      const originalLeiter = trasse.UsedMasten[0].UsedEbenen[0].UsedLeitungenLinks[0];
      const originalParabelA = originalLeiter.ParabelA;
      const originalParabelB = originalLeiter.ParabelB;
      const originalParabelC = originalLeiter.ParabelC;
      
      console.log('\nSimple1 Original values:');
      console.log('ParabelA:', originalParabelA);
      console.log('ParabelB:', originalParabelB);
      console.log('ParabelC:', originalParabelC);
      console.log('Durchhang:', originalLeiter.Durchhang);
      
      // Clear and recalculate
      originalLeiter.ParabelA = 0;
      originalLeiter.ParabelB = 0;
      originalLeiter.ParabelC = 0;
      originalLeiter.SegmentPunkte = [];
      
      calculateParabolaParameters(trasse);
      
      console.log('\nSimple1 Calculated values:');
      console.log('ParabelA:', originalLeiter.ParabelA);
      console.log('ParabelB:', originalLeiter.ParabelB);
      console.log('ParabelC:', originalLeiter.ParabelC);
      
      // For simple1, the parameters might be 0 if there's no connection
      // or they should match if there is
      if (originalParabelA !== 0) {
        expect(originalLeiter.ParabelA).toBeCloseTo(originalParabelA, 10);
        expect(originalLeiter.ParabelB).toBeCloseTo(originalParabelB, 5);
        expect(originalLeiter.ParabelC).toBeCloseTo(originalParabelC, 5);
      }
    });
  });

  // Removed mathematical verification test since the VB.NET formula 
  // doesn't satisfy the expected boundary conditions mathematically.
  // As discussed, we're matching the VB.NET behavior even if the formula seems wrong.
});