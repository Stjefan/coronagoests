import * as math from 'mathjs';

export interface TransformParams {
  GKR_A: number;
  GKH_A: number;
  GKR_B: number;
  GKH_B: number;
  PX_A: number;
  PY_A: number;
  PX_B: number;
  PY_B: number;
}

export interface ReferencePoint {
  gkRechts: number;
  gkHoch: number;
  pixelX: number;
  pixelY: number;
}

export class HelmertTransform {
  private a!: number;
  private b!: number;
  private c!: number;
  private d!: number;

  constructor(params: TransformParams | ReferencePoint[]) {
    // Convert old format to new format if necessary
    let points: ReferencePoint[];
    console.log("params", params)
    if (Array.isArray(params)) {
      points = params;
    } else {
      // Convert legacy format to point array
      points = [
        {
          gkRechts: params.GKR_A,
          gkHoch: params.GKH_A,
          pixelX: params.PX_A,
          pixelY: params.PY_A
        },
        {
          gkRechts: params.GKR_B,
          gkHoch: params.GKH_B,
          pixelX: params.PX_B,
          pixelY: params.PY_B
        }
      ];
    }

    if (points.length < 2) {
      throw new Error('At least 2 reference points are required for Helmert transformation');
    }

    // Use least squares method for any number of points
    this.computeLeastSquares(points);
  }

  private computeLeastSquares(points: ReferencePoint[]): void {
    // const n = points.length;
    
    // Build the system of equations: A * x = b
    // where x = [a, b, c, d]
    // For each point we have:
    // px = a * gkr + b * gkh + c
    // py = -b * gkr + a * gkh + d
    
    // This gives us 2n equations for 4 unknowns
    // We'll use the normal equation: A^T * A * x = A^T * b
    
    // Build matrix A (2n x 4) and vector b (2n x 1)
    const A: number[][] = [];
    const b: number[] = [];
    
    for (const point of points) {
      // Equation for px
      A.push([point.gkRechts, point.gkHoch, 1, 0]);
      b.push(point.pixelX);
      
      // Equation for py
      A.push([point.gkHoch, -point.gkRechts, 0, 1]);
      b.push(point.pixelY);
    }
    
    // Convert to mathjs matrices
    const matrixA = math.matrix(A);
    const vectorB = math.matrix(b);
    
    // Compute A^T * A
    const AtA = math.multiply(math.transpose(matrixA), matrixA);
    
    // Compute A^T * b
    const Atb = math.multiply(math.transpose(matrixA), vectorB);
    
    // Solve the system AtA * x = Atb using mathjs
    try {
      const solution = math.lusolve(AtA, Atb) as math.Matrix;
      const solutionArray = math.flatten(solution).toArray() as number[];
      
      this.a = solutionArray[0];
      this.b = solutionArray[1];
      this.c = solutionArray[2];
      this.d = solutionArray[3];
    } catch (error) {
      // If the system is singular, try using pseudoinverse (Moore-Penrose)
      console.warn('Standard solver failed, using pseudoinverse:', error);
      const pinvAtA = math.pinv(AtA as math.Matrix);
      const solution = math.multiply(pinvAtA, Atb);
      const solutionArray = math.flatten(solution).toArray() as number[];
      
      this.a = solutionArray[0];
      this.b = solutionArray[1];
      this.c = solutionArray[2];
      this.d = solutionArray[3];
    }
  }

  gkToPixel(gkRechts: number, gkHoch: number): [number, number] {
    const px = this.a * gkRechts + this.b * gkHoch + this.c;
    const py = -this.b * gkRechts + this.a * gkHoch + this.d;
    return [px, py];
  }

  pixelToGK(px: number, py: number): [number, number] {
    const dx = px - this.c;
    const dy = py - this.d;
    const det = this.a * this.a + this.b * this.b;
    
    const gkRechts = (this.a * dx - this.b * dy) / det;
    const gkHoch = (this.b * dx + this.a * dy) / det;
    
    return [gkRechts, gkHoch];
  }
  
  // Helper method to get transformation parameters (useful for debugging)
  getParameters(): { a: number; b: number; c: number; d: number; scale: number; rotation: number } {
    const scale = Math.sqrt(this.a * this.a + this.b * this.b);
    const rotation = Math.atan2(-this.b, this.a);
    return {
      a: this.a,
      b: this.b,
      c: this.c,
      d: this.d,
      scale,
      rotation: rotation * 180 / Math.PI // Convert to degrees
    };
  }
}