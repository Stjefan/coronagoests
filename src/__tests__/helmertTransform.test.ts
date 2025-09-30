import { describe, it, expect } from 'vitest';
import { HelmertTransform } from '../utils/helmertTransform';
import type { TransformParams, ReferencePoint } from '../utils/helmertTransform';

describe('HelmertTransform', () => {
  describe('Current 2-point implementation baseline', () => {
    it('should produce known results for test data from trasse4gelaende.json', () => {
      const params: TransformParams = {
        GKR_A: 3529920.0,
        GKH_A: 5385634.0,
        GKR_B: 3525792.0,
        GKH_B: 5385715.0,
        PX_A: 508,
        PY_A: 519,
        PX_B: 320,
        PY_B: 391
      };
      
      const transform = new HelmertTransform(params);
      
      // Test forward transformation (GK to Pixel)
      const [px1, py1] = transform.gkToPixel(params.GKR_A, params.GKH_A);
      expect(px1).toBeCloseTo(params.PX_A, 6);
      expect(py1).toBeCloseTo(params.PY_A, 6);
      
      const [px2, py2] = transform.gkToPixel(params.GKR_B, params.GKH_B);
      expect(px2).toBeCloseTo(params.PX_B, 6);
      expect(py2).toBeCloseTo(params.PY_B, 6);
      
      // Test a point in between
      const midGKR = (params.GKR_A + params.GKR_B) / 2;
      const midGKH = (params.GKH_A + params.GKH_B) / 2;
      const [midPx, midPy] = transform.gkToPixel(midGKR, midGKH);
      
      // Store these values as baseline
      expect(midPx).toBeCloseTo(414, 1);
      expect(midPy).toBeCloseTo(455, 1);
      
      // Test inverse transformation (Pixel to GK)
      const [gkr1, gkh1] = transform.pixelToGK(params.PX_A, params.PY_A);
      expect(gkr1).toBeCloseTo(params.GKR_A, 1);
      expect(gkh1).toBeCloseTo(params.GKH_A, 1);
      
      const [gkr2, gkh2] = transform.pixelToGK(params.PX_B, params.PY_B);
      expect(gkr2).toBeCloseTo(params.GKR_B, 1);
      expect(gkh2).toBeCloseTo(params.GKH_B, 1);
    });
    
    it('should produce known results for test data from simple1.json', () => {
      const params: TransformParams = {
        GKR_A: 3529920.0,
        GKH_A: 5385634.0,
        GKR_B: 3525792.0,
        GKH_B: 5385715.0,
        PX_A: 508,
        PY_A: 519,
        PX_B: 320,
        PY_B: 391
      };
      
      const transform = new HelmertTransform(params);
      
      // Test some arbitrary points to establish baseline
      const testPoints = [
        { gkr: 3527000, gkh: 5385700 },
        { gkr: 3528000, gkh: 5385650 },
        { gkr: 3526500, gkh: 5385680 }
      ];
      
      const results = testPoints.map(point => {
        const [px, py] = transform.gkToPixel(point.gkr, point.gkh);
        return { gkr: point.gkr, gkh: point.gkh, px, py };
      });
      
      // Store baseline results - these are the actual values from current implementation
      expect(results[0].px).toBeCloseTo(374.738, 2);
      expect(results[0].py).toBeCloseTo(428.848, 2);
      
      expect(results[1].px).toBeCloseTo(421.249, 2);
      expect(results[1].py).toBeCloseTo(458.492, 2);
      
      expect(results[2].px).toBeCloseTo(352.917, 2);
      expect(results[2].py).toBeCloseTo(412.005, 2);
    });
    
    it('should produce known results for test data from foo1.json', () => {
      const params: TransformParams = {
        GKR_A: 3525920.0,  // Different from other test files
        GKH_A: 5385634.0,
        GKR_B: 3525792.0,
        GKH_B: 5385715.0,
        PX_A: 509,         // Slightly different pixel coordinates
        PY_A: 518,
        PX_B: 320,
        PY_B: 392         // Slightly different
      };
      
      const transform = new HelmertTransform(params);
      
      // Test forward transformation
      const [px1, py1] = transform.gkToPixel(params.GKR_A, params.GKH_A);
      expect(px1).toBeCloseTo(params.PX_A, 4);
      expect(py1).toBeCloseTo(params.PY_A, 4);
      
      const [px2, py2] = transform.gkToPixel(params.GKR_B, params.GKH_B);
      expect(px2).toBeCloseTo(params.PX_B, 4);
      expect(py2).toBeCloseTo(params.PY_B, 4);
      
      // Test inverse transformation
      const [gkr1, gkh1] = transform.pixelToGK(params.PX_A, params.PY_A);
      expect(gkr1).toBeCloseTo(params.GKR_A, 1);
      expect(gkh1).toBeCloseTo(params.GKH_A, 1);
      
      const [gkr2, gkh2] = transform.pixelToGK(params.PX_B, params.PY_B);
      expect(gkr2).toBeCloseTo(params.GKR_B, 1);
      expect(gkh2).toBeCloseTo(params.GKH_B, 1);
    });
    
    it('should handle reasonable small-scale transformations', () => {
      const params: TransformParams = {
        GKR_A: 3525000.0,
        GKH_A: 5385000.0,
        GKR_B: 3525100.0,  // 100 meter difference
        GKH_B: 5385100.0,
        PX_A: 100,
        PY_A: 100,
        PX_B: 200,
        PY_B: 200
      };
      
      const transform = new HelmertTransform(params);
      
      // Should still work and produce reasonable results
      const [px, py] = transform.gkToPixel(3525050, 5385050);
      expect(px).toBeCloseTo(150, 1);
      expect(py).toBeCloseTo(150, 1);
    });
  });
  
  describe('Transformation properties', () => {
    it('should be reversible', () => {
      const params: TransformParams = {
        GKR_A: 3529920.0,
        GKH_A: 5385634.0,
        GKR_B: 3525792.0,
        GKH_B: 5385715.0,
        PX_A: 508,
        PY_A: 519,
        PX_B: 320,
        PY_B: 391
      };
      
      const transform = new HelmertTransform(params);
      
      // Test multiple arbitrary points
      const testPoints = [
        { gkr: 3527856, gkh: 5385674 },
        { gkr: 3526900, gkh: 5385700 },
        { gkr: 3528500, gkh: 5385650 }
      ];
      
      testPoints.forEach(point => {
        const [px, py] = transform.gkToPixel(point.gkr, point.gkh);
        const [gkr, gkh] = transform.pixelToGK(px, py);
        
        expect(gkr).toBeCloseTo(point.gkr, 6);
        expect(gkh).toBeCloseTo(point.gkh, 6);
      });
    });
    
    it('should preserve distances proportionally', () => {
      const params: TransformParams = {
        GKR_A: 3529920.0,
        GKH_A: 5385634.0,
        GKR_B: 3525792.0,
        GKH_B: 5385715.0,
        PX_A: 508,
        PY_A: 519,
        PX_B: 320,
        PY_B: 391
      };
      
      const transform = new HelmertTransform(params);
      
      // Calculate scale from the transformation
      const gkDist = Math.sqrt(
        Math.pow(params.GKR_B - params.GKR_A, 2) + 
        Math.pow(params.GKH_B - params.GKH_A, 2)
      );
      const pixelDist = Math.sqrt(
        Math.pow(params.PX_B - params.PX_A, 2) + 
        Math.pow(params.PY_B - params.PY_A, 2)
      );
      const expectedScale = pixelDist / gkDist;
      
      // Test that other distances scale proportionally
      const testGKR1 = 3527000, testGKH1 = 5385700;
      const testGKR2 = 3528000, testGKH2 = 5385650;
      
      const gkTestDist = Math.sqrt(
        Math.pow(testGKR2 - testGKR1, 2) + 
        Math.pow(testGKH2 - testGKH1, 2)
      );
      
      const [px1, py1] = transform.gkToPixel(testGKR1, testGKH1);
      const [px2, py2] = transform.gkToPixel(testGKR2, testGKH2);
      
      const pixelTestDist = Math.sqrt(
        Math.pow(px2 - px1, 2) + 
        Math.pow(py2 - py1, 2)
      );
      
      const actualScale = pixelTestDist / gkTestDist;
      
      expect(actualScale).toBeCloseTo(expectedScale, 6);
    });
  });
  
  describe('Multi-point transformations (3+ points)', () => {
    it('should handle 3-point transformation with exact fit', () => {
      // Create 3 points that define a unique transformation
      const points: ReferencePoint[] = [
        { gkRechts: 3525000, gkHoch: 5385000, pixelX: 100, pixelY: 100 },
        { gkRechts: 3525100, gkHoch: 5385000, pixelX: 200, pixelY: 100 },
        { gkRechts: 3525050, gkHoch: 5385100, pixelX: 150, pixelY: 200 }
      ];
      
      const transform = new HelmertTransform(points);
      
      // Check that all input points are mapped correctly
      points.forEach((point) => {
        const [px, py] = transform.gkToPixel(point.gkRechts, point.gkHoch);
        expect(px).toBeCloseTo(point.pixelX, 3);
        expect(py).toBeCloseTo(point.pixelY, 3);
      });
      
      // Check reverse transformation
      points.forEach((point) => {
        const [gkr, gkh] = transform.pixelToGK(point.pixelX, point.pixelY);
        expect(gkr).toBeCloseTo(point.gkRechts, 1);
        expect(gkh).toBeCloseTo(point.gkHoch, 1);
      });
    });
    
    it('should handle 4-point transformation with least squares fit', () => {
      // Create 4 points forming a rectangle
      const points: ReferencePoint[] = [
        { gkRechts: 3525000, gkHoch: 5385000, pixelX: 100, pixelY: 100 },
        { gkRechts: 3525200, gkHoch: 5385000, pixelX: 300, pixelY: 100 },
        { gkRechts: 3525200, gkHoch: 5385200, pixelX: 300, pixelY: 300 },
        { gkRechts: 3525000, gkHoch: 5385200, pixelX: 100, pixelY: 300 }
      ];
      
      const transform = new HelmertTransform(points);
      
      // Check that the transformation preserves the rectangle shape
      // The corners should map approximately to the expected positions
      points.forEach((point) => {
        const [px, py] = transform.gkToPixel(point.gkRechts, point.gkHoch);
        expect(px).toBeCloseTo(point.pixelX, 2);
        expect(py).toBeCloseTo(point.pixelY, 2);
      });
      
      // Check center point
      const [centerPx, centerPy] = transform.gkToPixel(3525100, 5385100);
      expect(centerPx).toBeCloseTo(200, 2);
      expect(centerPy).toBeCloseTo(200, 2);
    });
    
    it('should handle 5-point transformation with overdetermined system', () => {
      // Create 5 points with slight noise to simulate real measurements
      const points: ReferencePoint[] = [
        { gkRechts: 3525000, gkHoch: 5385000, pixelX: 100, pixelY: 100 },
        { gkRechts: 3525100, gkHoch: 5385000, pixelX: 199, pixelY: 101 }, // Slight noise
        { gkRechts: 3525100, gkHoch: 5385100, pixelX: 201, pixelY: 199 }, // Slight noise
        { gkRechts: 3525000, gkHoch: 5385100, pixelX: 101, pixelY: 201 }, // Slight noise
        { gkRechts: 3525050, gkHoch: 5385050, pixelX: 150, pixelY: 150 }  // Center point
      ];
      
      const transform = new HelmertTransform(points);
      
      // The transformation should find a best fit
      // Check that residuals are small
      let totalError = 0;
      points.forEach((point) => {
        const [px, py] = transform.gkToPixel(point.gkRechts, point.gkHoch);
        const errorX = Math.abs(px - point.pixelX);
        const errorY = Math.abs(py - point.pixelY);
        totalError += errorX + errorY;
        
        // Individual errors should be small
        expect(errorX).toBeLessThan(2);
        expect(errorY).toBeLessThan(2);
      });
      
      // Average error should be very small
      const avgError = totalError / (points.length * 2);
      expect(avgError).toBeLessThan(1);
    });
    
    it('should produce same result for 2 points using array interface', () => {
      // Test that the array interface gives same results as legacy interface
      const params: TransformParams = {
        GKR_A: 3529920.0,
        GKH_A: 5385634.0,
        GKR_B: 3525792.0,
        GKH_B: 5385715.0,
        PX_A: 508,
        PY_A: 519,
        PX_B: 320,
        PY_B: 391
      };
      
      const points: ReferencePoint[] = [
        { gkRechts: params.GKR_A, gkHoch: params.GKH_A, pixelX: params.PX_A, pixelY: params.PY_A },
        { gkRechts: params.GKR_B, gkHoch: params.GKH_B, pixelX: params.PX_B, pixelY: params.PY_B }
      ];
      
      const transform1 = new HelmertTransform(params);
      const transform2 = new HelmertTransform(points);
      
      // Test some points and verify they give identical results
      const testGK = [
        { r: 3527000, h: 5385700 },
        { r: 3528000, h: 5385650 },
        { r: 3526500, h: 5385680 }
      ];
      
      testGK.forEach(gk => {
        const [px1, py1] = transform1.gkToPixel(gk.r, gk.h);
        const [px2, py2] = transform2.gkToPixel(gk.r, gk.h);
        
        expect(px2).toBeCloseTo(px1, 10);
        expect(py2).toBeCloseTo(py1, 10);
      });
    });
    
    it('should maintain transformation quality with many points', () => {
      // Create a grid of points
      const points: ReferencePoint[] = [];
      for (let i = 0; i <= 2; i++) {
        for (let j = 0; j <= 2; j++) {
          points.push({
            gkRechts: 3525000 + i * 100,
            gkHoch: 5385000 + j * 100,
            pixelX: 100 + i * 100,
            pixelY: 100 + j * 100
          });
        }
      }
      
      const transform = new HelmertTransform(points);
      
      // All points should map very accurately since they form a perfect grid
      points.forEach((point) => {
        const [px, py] = transform.gkToPixel(point.gkRechts, point.gkHoch);
        expect(px).toBeCloseTo(point.pixelX, 4);
        expect(py).toBeCloseTo(point.pixelY, 4);
      });
      
      // Check interpolation between grid points
      const [px, py] = transform.gkToPixel(3525050, 5385050);
      expect(px).toBeCloseTo(150, 2);
      expect(py).toBeCloseTo(150, 2);
    });
    
    it('should handle non-uniform scaling and rotation', () => {
      // Create points with rotation and different scales in x and y
      // This tests that Helmert (conformal) transformation maintains angles
      const angle = Math.PI / 6; // 30 degrees
      const scale = 2;
      
      const points: ReferencePoint[] = [
        { gkRechts: 3525000, gkHoch: 5385000, pixelX: 200, pixelY: 200 },
        { gkRechts: 3525100, gkHoch: 5385000, pixelX: 200 + scale * 100 * Math.cos(angle), pixelY: 200 + scale * 100 * Math.sin(angle) },
        { gkRechts: 3525000, gkHoch: 5385100, pixelX: 200 + scale * 100 * Math.cos(angle + Math.PI/2), pixelY: 200 + scale * 100 * Math.sin(angle + Math.PI/2) },
        { gkRechts: 3525050, gkHoch: 5385050, pixelX: 200 + scale * 50 * Math.sqrt(2) * Math.cos(angle + Math.PI/4), pixelY: 200 + scale * 50 * Math.sqrt(2) * Math.sin(angle + Math.PI/4) }
      ];
      
      const transform = new HelmertTransform(points);
      const params = transform.getParameters();
      
      // Check that the computed scale is approximately correct
      expect(params.scale).toBeCloseTo(scale, 1);
      
      // Check that the rotation angle is approximately correct (in degrees)
      expect(Math.abs(params.rotation)).toBeCloseTo(30, 1);
    });
  });
});