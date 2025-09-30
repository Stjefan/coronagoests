/* eslint-disable @typescript-eslint/no-unused-vars */
import type {
  UsedProjectData,
  UsedMast,
  UsedLeiter,
  UsedImmissionPoint,
  GKVector2d,
  GKVector3d,
} from '../types/usedData.ts';

import type { DGMKante } from './dtmProcessor';

const LOG_ENABLED = import.meta.env.VITE_DEBUG_LOGS === 'true';
export interface DTMProcessor {
  berechneHoeheDGM(position: GKVector2d): number;
  DGMKante?: DGMKante[];
}

export interface ImmissionContribution {
  total: number;
  esq: number;
  trassen: number;
}

export class UsedDataCalculator {
  usedData: UsedProjectData;
  private dtmProcessor: DTMProcessor | null;
  private readonly absorpKoeff = 1.0; // Atmospheric absorption coefficient

  private readonly logEnabled: boolean;
  constructor(projectData: UsedProjectData, dtmProcessor: DTMProcessor | null = null, opts?: { enableLogging?: boolean }) {
    this.usedData = projectData;
    this.dtmProcessor = dtmProcessor;
    const envFlag = import.meta.env?.VITE_DEBUG_LOGS as string | undefined;
    const envEnabled = envFlag ? ['1', 'true', 'on', 'yes'].includes(envFlag.toLowerCase()) : false;
    const isDev = import.meta.env.DEV;
    console.log("Opts", opts);
    console.log("logEnabled", opts?.enableLogging, envEnabled, isDev);
    this.logEnabled = opts?.enableLogging ?? envEnabled ?? isDev ?? false;

  }

  public getDtmProcessor(): DTMProcessor | null {
    return this.dtmProcessor;
  }


  public calculateLatLTForImmissionPointDetailed(immissionPointIndex: number): ImmissionContribution {
    if (immissionPointIndex >= this.usedData.ImmissionPoints.length) {
      if (LOG_ENABLED) {
        console.log(`Invalid immission point index: ${immissionPointIndex}`);
      }
      return { total: 0, esq: 0, trassen: 0 };
    }

    const immissionPoint = this.usedData.ImmissionPoints[immissionPointIndex];
    const immiPkt: GKVector3d = {
      GK: {
        Rechts: immissionPoint.Position.GK.Rechts,
        Hoch: immissionPoint.Position.GK.Hoch
      },
      z: immissionPoint.Position.z + immissionPoint.HeightOffset
    };

    if (LOG_ENABLED) {
      console.log(`    UsedDataCalculator - Processing: ${immissionPoint.Name}`);
    }
    if (LOG_ENABLED) {
      console.log(`    Using ImmiPkt: Rechts=${immiPkt.GK.Rechts}, Hoch=${immiPkt.GK.Hoch}, Z=${immiPkt.z}`);
    }
    if (LOG_ENABLED) {
      console.log(`    mitFrequenz: ${this.usedData.mitFrequenz}`);
    }


    // Calculate ESQ contributions with screening
    const esqContribution = this.calculateESQContribution(immiPkt, immissionPoint);
    if (LOG_ENABLED) {
      console.log(`    ESQ total contribution: ${10 * Math.log10(esqContribution)} dB`);
    }

    // Calculate Trassen (transmission lines) contributions
    let trassenContribution = 0;
    if (LOG_ENABLED) {
      console.log(`    Total transmission lines in UsedData: ${this.usedData.Trassen.length}`);
    }
    for (const trasse of this.usedData.Trassen) {
      if (LOG_ENABLED) {
        console.log(`    Processing transmission line: ${trasse.Name} (Nummer=${trasse.Nummer}, Masts=${trasse.UsedMasten.length})`);
      }

      // Process mast spans (pairs of consecutive masts)
      for (let mastIndex = 0; mastIndex < trasse.UsedMasten.length - 1; mastIndex++) {
        const currentMast = trasse.UsedMasten[mastIndex];
        const nextMast = trasse.UsedMasten[mastIndex + 1];

        if (LOG_ENABLED) {
          console.log(`      Processing mast span ${mastIndex} to ${mastIndex + 1}`);
        }

        // Process each level
        for (const ebene of currentMast.UsedEbenen) {
          if (LOG_ENABLED) {
            console.log(`        Processing level: NummerEbene=${ebene.NummerEbene}`);
          }

          // Process left conductors
          for (const leiter of ebene.UsedLeitungenLinks) {
            if (LOG_ENABLED) {
              console.log(`          Processing left conductor: NummerLeiter=${leiter.NummerLeiter}, NextMastEbene=${leiter.NextMastEbene}, NextMastLeiter=${leiter.NextMastLeiter}`);
            }

            const nextLeiter = this.findNextConductor(nextMast, leiter.NextMastEbene, leiter.NextMastLeiter);
            if (nextLeiter) {
              if (LOG_ENABLED) {
                console.log(`            Found next conductor: NummerLeiter=${nextLeiter.NummerLeiter}`);
              }
              const lft = this.calcLeiter(leiter, nextLeiter, immiPkt, immissionPoint.G_Bodenfaktor);
              if (lft > 0) {
                if (LOG_ENABLED) {
                  console.log(`            Contribution: ${lft}`);
                }
                trassenContribution += lft;
              }
            } else {
              if (LOG_ENABLED) {
                console.log(`            WARNING: Could not find next conductor!`);
              }
            }
          }

          // Process right conductors
          for (const leiter of ebene.UsedLeitungenRechts) {
            if (LOG_ENABLED) {
              console.log(`          Processing right conductor: NummerLeiter=${leiter.NummerLeiter}, NextMastEbene=${leiter.NextMastEbene}, NextMastLeiter=${leiter.NextMastLeiter}`);
            }

            const nextLeiter = this.findNextConductor(nextMast, leiter.NextMastEbene, leiter.NextMastLeiter);
            if (nextLeiter) {
              if (LOG_ENABLED) {
                console.log(`            Found next conductor: NummerLeiter=${nextLeiter.NummerLeiter}`);
              }
              const lft = this.calcLeiter(leiter, nextLeiter, immiPkt, immissionPoint.G_Bodenfaktor);
              if (lft > 0) {
                if (LOG_ENABLED) {
                  console.log(`            Contribution: ${lft}`);
                }
                trassenContribution += lft;
              }
            } else {
              if (LOG_ENABLED) {
                console.log(`            WARNING: Could not find next conductor!`);
              }
            }
          }
        }
      }
    }

    // Calculate combined total
    const totalLatDW = esqContribution + trassenContribution;
    
    // Calculate long-term average levels
    let totalLatLT = 0;
    if (totalLatDW >= 1) {
      totalLatLT = 10 * Math.log10(totalLatDW);
    }

    let esqLatLT = 0;
    if (esqContribution >= 1) {
      esqLatLT = 10 * Math.log10(esqContribution);
    }

    let trassenLatLT = 0;
    if (trassenContribution >= 1) {
      trassenLatLT = 10 * Math.log10(trassenContribution);
    }
    if (LOG_ENABLED) {
      console.log(`[UsedDataCalculator] Total LatLT for immission point ${immissionPointIndex}: ${totalLatLT.toFixed(2)} dB`);
    }
    if (LOG_ENABLED) {
      console.log(`[UsedDataCalculator] ESQ LatLT: ${esqLatLT.toFixed(2)} dB`);
    }
    if (LOG_ENABLED) {
      console.log(`[UsedDataCalculator] Trassen LatLT: ${trassenLatLT.toFixed(2)} dB`);
    }

    // Apply corrections to all values
    const corrections = this.usedData.Kt ?? 0;
    
    return {
      total: totalLatLT + corrections,
      esq: esqLatLT + corrections,
      trassen: trassenLatLT + corrections
    };
  }

  public calculateLatLTForImmissionPoint(immissionPointIndex: number): number {
    const detailed = this.calculateLatLTForImmissionPointDetailed(immissionPointIndex);
    return detailed.total;
  }

  private findNextConductor(nextMast: UsedMast, nextMastEbene: number, nextMastLeiter: number): UsedLeiter | null {
    if (nextMastEbene <= 0 || nextMastEbene > nextMast.UsedEbenen.length) {
      if (LOG_ENABLED) {
        console.log(`DEBUG: findNextConductor: nextMastEbene=${nextMastEbene} is out of range`);
      }
      throw new Error(`findNextConductor: nextMastEbene=${nextMastEbene} is out of range`);
      return null;
    }

    const targetEbene = nextMast.UsedEbenen.find(e => e.NummerEbene === nextMastEbene);
    if (!targetEbene) {
      if (LOG_ENABLED) {
        console.log(`DEBUG: findNextConductor: targetEbene=${nextMastEbene} not found`);
      }
      throw new Error(`findNextConductor: targetEbene=${nextMastEbene} not found`);
      // return null;
    }

    if (nextMastLeiter < 0) {
      // Left conductor
      const index = -nextMastLeiter - 1;

      if (LOG_ENABLED) {
        console.log(`DEBUG: findNextConductor: index=${index} targetEbene.UsedLeitungenLinks.length=${targetEbene.UsedLeitungenLinks.length}`);
      }
      if (index >= 0 && index < targetEbene.UsedLeitungenLinks.length) {
        return targetEbene.UsedLeitungenLinks[index];
      }
    } else if (nextMastLeiter > 0) {
      // Right conductor
      const index = nextMastLeiter - 1;
      if (index >= 0 && index < targetEbene.UsedLeitungenRechts.length) {
        return targetEbene.UsedLeitungenRechts[index];
      }
    }
    if (LOG_ENABLED) {
      console.log(`DEBUG: findNextConductor: nextMastLeiter=${nextMastLeiter} not found`);
    }
    throw new Error(`findNextConductor: nextMastLeiter=${nextMastLeiter} not found`);

    return null;
  }

  private calcLeiter(thisLeiter: UsedLeiter, nextLeiter: UsedLeiter, immiPkt: GKVector3d, gBodenfaktor: number): number {
    // Get sound power level from conductor type
    let lwFehler = 0;
    const sLw = thisLeiter.SchallLw?.trim() || '';

    if (LOG_ENABLED) {
      console.log(`            Looking up sound power for conductor type: '${sLw}'`);
    }
    if (LOG_ENABLED) {
      console.log(`            Available conductor types: ${this.usedData.LeiterTypes.length}`);
    }

    // Look up sound power level from LeiterTypes
    for (const leiterType of this.usedData.LeiterTypes) {
      const typeName = leiterType.Name?.trim() || '';
      const schallLW = leiterType.SchallLW || 0;
      if (LOG_ENABLED) {
        console.log(`              Checking: '${typeName}' vs '${sLw}', SchallLW=${schallLW}`);
      }
      if (typeName === sLw) {
        lwFehler = schallLW;
        if (LOG_ENABLED) {
          console.log("schallLW", schallLW);
        }
        if (LOG_ENABLED) {
          console.log(`            FOUND: lwFehler=${lwFehler} dB for type '${sLw}'`);
        }
        break;
      }
    }

    if (lwFehler === 0) {
      if (LOG_ENABLED) {
        console.log(`            WARNING: No sound power level found for conductor type '${sLw}'`);
      }
      throw new Error(`No sound power level found for conductor type '${sLw}'`);
    }

    if (LOG_ENABLED) {
      console.log(`            Conductor parameters: BetrU=${thisLeiter.BetrU}, ParabelA=${thisLeiter.ParabelA}, ParabelB=${thisLeiter.ParabelB}, ParabelC=${thisLeiter.ParabelC}`);
    }

    // Call the full Iteration_Leiter method
    const result = this.iterationLeiter(
      lwFehler,
      0, // UBeginn
      thisLeiter.BetrU, // UEnd
      thisLeiter,
      nextLeiter,
      immiPkt,
      false, // bIsESQ
      gBodenfaktor
    );

    if (LOG_ENABLED) {
      console.log(`DEBUG: Total Iteration_Leiter result = ${result}`);
    }
    return result;
  }

  private iterationLeiter(
    lwFehler: number,
    UBeginn: number,
    UEnd: number,
    thisLeiter: UsedLeiter,
    nextLeiter: UsedLeiter,
    cIOrt: GKVector3d,
    bIsESQ: boolean,
    G_Bodenfaktor: number
  ): number {
    // Calculate midpoint on parabolic conductor path
    const midU = UBeginn + (UEnd - UBeginn) / 2;
    const mtlPkt = this.parabelpunkt(
      thisLeiter.BetrU,
      thisLeiter.Durchgangspunkt.GK,
      nextLeiter.Durchgangspunkt.GK,
      thisLeiter.ParabelA,
      thisLeiter.ParabelB,
      thisLeiter.ParabelC,
      thisLeiter.Durchhang,
      midU
    );

    const dEntfernung = UsedDataCalculator.GKVector3d_Abstand(mtlPkt, cIOrt);

    // Calculate segment length using parabolic arc formula
    const zI = 2 * thisLeiter.ParabelA * UBeginn + thisLeiter.ParabelB;
    const zII = 2 * thisLeiter.ParabelA * UEnd + thisLeiter.ParabelB;
    const SQRTzI = Math.sqrt(1 + zI * zI);
    const SQRTzII = Math.sqrt(1 + zII * zII);
    const SegLen = (zII * SQRTzII + Math.log(zII + SQRTzII) - 
                    (zI * SQRTzI + Math.log(zI + SQRTzI))) / (4 * thisLeiter.ParabelA);

    if (LOG_ENABLED) {
      console.log(`DEBUG: dEntfernung=${dEntfernung}, SegLen=${SegLen}`);
    }
    if (LOG_ENABLED) {
      console.log(`DEBUG: mtlPunkt at hoch=${mtlPkt.GK.Hoch}, rechts=${mtlPkt.GK.Rechts}, hoehe=${mtlPkt.z}`);
    }
    if (LOG_ENABLED) {
      console.log(`DEBUG: Branching check: dEntfernung(${dEntfernung}) > 2*SegLen(${2 * SegLen}) = ${dEntfernung > 2 * SegLen}, SegLen < 5 = ${SegLen < 5}`);
    }

    if (Number.isNaN(SegLen)) {
      if (LOG_ENABLED) {
        console.error('🚨 ERROR: SegLen is NaN!')
      }
      throw new Error('SegLen is NaN!');
    }

    // Check if we should calculate this segment or subdivide further
    if (dEntfernung > 2 * SegLen || SegLen < 5) {
      const Lw = lwFehler + 10 * Math.log10(SegLen);
      if (dEntfernung <= 0.28 * Math.sqrt(Math.pow(10, 0.1 * Lw))) {
        return this.segTrasse(Lw, mtlPkt, cIOrt, dEntfernung, bIsESQ, thisLeiter.ACDC, G_Bodenfaktor);
      }
    } else {
      // Subdivide and recurse
      if (LOG_ENABLED) {
        console.log(`DEBUG: SUBDIVIDING segment from ${UBeginn} to ${UEnd}`);
      }
      return this.iterationLeiter(lwFehler, UBeginn, midU, thisLeiter, nextLeiter, cIOrt, bIsESQ, G_Bodenfaktor) +
             this.iterationLeiter(lwFehler, midU, UEnd, thisLeiter, nextLeiter, cIOrt, bIsESQ, G_Bodenfaktor);
    }

    return 0;
  }

  private parabelpunkt(
    BetrU: number,
    PktA: GKVector2d,
    PktB: GKVector2d,
    a: number,
    b: number,
    c: number,
    d: number,
    r: number
  ): GKVector3d {
    // Calculate point on parabolic conductor path
    if (a === 0 && b === 0 && c === 0) {
      if (LOG_ENABLED) {
        console.error('🚨 ERROR: Parabelpunkt: a, b, c are all 0!')
      }
      throw new Error('Parabelpunkt: a, b, c are all 0!');
    }

    console.log("Used d", d)
    const tmp: GKVector3d = {
      GK: {
        Hoch: PktA.Hoch + r * (PktB.Hoch - PktA.Hoch) / BetrU,
        Rechts: PktA.Rechts + r * (PktB.Rechts - PktA.Rechts) / BetrU
      },
      z: a * r * r + b * r + c
    };
    return tmp;
  }

  private segTrasse(
    Lw: number,
    Sender: GKVector3d,
    Empfaenger: GKVector3d,
    dEntfernung: number,
    bIsESQ: boolean,
    btACDC: number,
    G_Bodenfaktor: number
  ): number {
    // Check if frequency-dependent calculation is enabled
    if (this.usedData.mitFrequenz === false || this.usedData.mitFrequenz === undefined) {
      // Non-frequency dependent calculation (existing behavior)
      const Adiv = this.calculateAdiv(dEntfernung);
      const Aatm = this.calculateAatm(dEntfernung);
      if (LOG_ENABLED) {
        console.log(`Running in non-frequency-dependent mode`);
      }

      // Ground and barrier effects
      const Agrbar = this.berechneAgr(Sender, Empfaenger, G_Bodenfaktor, bIsESQ);

      // Correction factors
      const DOmega = this.getDOmega(Sender, Empfaenger);
      let AgrKorrektur = 0;
      if (this.usedData.AgrKorrektur) {
        AgrKorrektur = this.getAgrKorrektur(dEntfernung, Sender, Empfaenger);
      }

      const Amisc = 0;
      const A = Adiv + Aatm + Amisc + Agrbar;

      if (LOG_ENABLED) {
        console.log(`DEBUG: Adiv=${Adiv}, Aatm=${Aatm}, Amisc=${Amisc}, Agrbar=${Agrbar}, Total A=${A}`);
      }
      if (LOG_ENABLED) {
        console.log(`DEBUG: DOmega=${DOmega.toFixed(4)}, AgrKorrektur=${AgrKorrektur.toFixed(4)}`);
      }
      if (LOG_ENABLED) {
        console.log(`DEBUG: Checking condition: Lw(${Lw.toFixed(2)}) + DOmega(${DOmega.toFixed(2)}) = ${(Lw + DOmega).toFixed(2)} > A(${A.toFixed(2)}) + AgrKorrektur(${AgrKorrektur.toFixed(2)}) = ${(A + AgrKorrektur).toFixed(2)}`);
      }

      if (Lw + DOmega > A + AgrKorrektur) {
        const Seg_i = Math.pow(10, 0.1 * (Lw + DOmega - A - AgrKorrektur));
        if (LOG_ENABLED) {
          console.log(`DEBUG: Calculation: 10^(0.1 * (${Lw.toFixed(2)} + ${DOmega.toFixed(2)} - ${A.toFixed(2)} - ${AgrKorrektur.toFixed(2)})) = 10^(0.1 * ${(Lw + DOmega - A - AgrKorrektur).toFixed(2)}) = ${Seg_i.toExponential(4)}`);
        }
        return Seg_i;
      }

      return 0;
    } else {
      // Frequency-dependent calculation
      if (LOG_ENABLED) {
        console.log(`DEBUG: Using frequency-dependent calculation, btACDC=${btACDC}, Lw=${Lw.toFixed(2)}`);
      }
      let Seg_i_f_sum = 0;

      for (let f = 0; f <= 32; f++) { // über alle Frequenzen von 12.5 bis 20k
        // Berechnung des Dämpfungsterms A über seine Komponenten Adiv, Aatm, Agrbar, Amisc
        const Adiv_f = 20 * Math.log10(dEntfernung) + 11;
        const Aatm_f = this.getAlphaAtm(f) * dEntfernung / 1000;
        const Amisc_f = 0;

        const Abar_mtlHoehe = this.berechneAbschirmungMtlHoeheDpFreq(Sender, Empfaenger, dEntfernung, f, bIsESQ);
        const Agrbar_f_original = Abar_mtlHoehe[0];
        const mtlHoehe = Abar_mtlHoehe[1];
        const dP = Abar_mtlHoehe[2];

        if (LOG_ENABLED) {
          console.log(`Agrbar_f: ${Agrbar_f_original}, mtlHoehe: ${mtlHoehe}, dP: ${dP}`);
        }

        let Agrbar_f = Agrbar_f_original;
        if (Agrbar_f <= 0) {
          Agrbar_f = this.berechneAgrF0124(mtlHoehe, dP, f, G_Bodenfaktor);
        }

        if (LOG_ENABLED) {
          console.log(`Adjusted Agrbar_f: ${Agrbar_f}`);
        }

        const A_f = Adiv_f + Aatm_f + Amisc_f + Agrbar_f;
        if (LOG_ENABLED) {
          console.log(`A_f: ${A_f}`);
        }

        const Frequenzanpassung = this.getLwAF(f, btACDC);
        if (LOG_ENABLED) {
          console.log(`Frequenzanpassung ${Frequenzanpassung}`);
        }

        const exponent = 0.1 * (Lw + Frequenzanpassung - A_f);
        const contribution = Math.pow(10, exponent);
        Seg_i_f_sum = Seg_i_f_sum + contribution;

        if (LOG_ENABLED) {
          console.log(`DEBUG: f=${f}(${this.getStrF(f)}Hz): Adiv_f=${Adiv_f.toFixed(2)}, Aatm_f=${Aatm_f.toFixed(2)}, Agrbar_f=${Agrbar_f.toFixed(2)}, A_f=${A_f.toFixed(2)}, Freq_adj=${Frequenzanpassung.toFixed(2)}`);
        }
        if (LOG_ENABLED) {
          console.log(`Addition: ${contribution}`);
        }
      }

      if (LOG_ENABLED) {
        console.log(`DEBUG: Frequency-dependent total Seg_i_f_sum = ${Seg_i_f_sum.toExponential(4)}`);
      }
      return Seg_i_f_sum;
    }
  }

  private calculateAdiv(distance: number): number {
    return 20 * Math.log10(distance) + 11;
  }

  private calculateAatm(distance: number): number {
    return this.absorpKoeff * distance / 1000;
  }

  private berechneAgr(Sender: GKVector3d, Empfaenger: GKVector3d, G_Bodenfaktor: number, bIsESQ: boolean = true): number {
    // Calculate ground attenuation using path integration
    if (LOG_ENABLED) {
      console.log("Using bodenfaktor", G_Bodenfaktor);
    }
    const dEntfernung = UsedDataCalculator.GKVector3d_Abstand(Sender, Empfaenger);
    const result = this.berechneAbschirmungMtlHoeheDp(Sender, Empfaenger, dEntfernung, bIsESQ);

    const Agrbar = result[0];
    const mtlHoehe = result[1];
    const dP = result[2];

    if (LOG_ENABLED) {
      console.log(`DEBUG: mtlHoehe=${mtlHoehe}, dP=${dP}`);
    }
    if (LOG_ENABLED) {
      console.log("Agrbar_before", Agrbar);
    }

    // If no screening, calculate ground attenuation
    if (Agrbar <= 0) {
      let agr = 4.8 - (2 * mtlHoehe / dP) * (17 + 300 / dP);
      if (agr < 0) agr = 0;
      if (LOG_ENABLED) {
        console.log(`DEBUG Agr: 4.8 - (${2 * mtlHoehe} / ${dP}) * (17 + 300 / ${dP})`);
      }
      if (LOG_ENABLED) {
        console.log(`DEBUG Agr: 4.8 - ${2 * mtlHoehe / dP} * ${17 + 300 / dP} = ${agr}`);
      }
      return agr;
    } else {
      if (LOG_ENABLED) {
        console.log(`DEBUG: Using screening attenuation Dz = ${Agrbar} dB`);
      }
      return Agrbar;
    }
  }

  private berechneAbschirmungMtlHoeheDpFreq(
    Sender: GKVector3d,
    Empfaenger: GKVector3d,
    dEntfernung: number,
    f: number,
    bIsESQ: boolean = true
  ): number[] {
    // Frequency-dependent version that includes wavelength-based screening calculation
    const xA = Sender.GK.Rechts;
    const yA = Sender.GK.Hoch;
    // const xB = Empfaenger.GK.Rechts;
    // const yB = Empfaenger.GK.Hoch;
    console.log("bIsESQ", bIsESQ);
    if (LOG_ENABLED) {
      console.log("dEntfernung", dEntfernung);
    }
    if (LOG_ENABLED) {
      console.log("f", f);
    }

    const rv = UsedDataCalculator.GKVector3d_Richtungsvektor(Sender, Empfaenger);
    const xS = rv.GK.Rechts;
    const yS = rv.GK.Hoch;

    let bAbschirm = false;
    const intersectionPoints: Array<{ index: number; point: GKVector3d; distance: number }> = [];

    // Check for screening for both ESQ sources and transmission lines
    if (this.dtmProcessor && this.dtmProcessor.DGMKante) {
      for (let iKante = 0; iKante < this.dtmProcessor.DGMKante.length; iKante++) {
        const kante = this.dtmProcessor.DGMKante[iKante];
        if (!kante || !kante.EckeA) break;
        
        const eckeAPoint = this.getHeightPointByLfdNummer(kante.EckeA.HP.lfdNummer);
        const eckeBPoint = this.getHeightPointByLfdNummer(kante.EckeB.HP.lfdNummer);
        
        if (!eckeAPoint || !eckeBPoint) continue;
        
        const xC = eckeAPoint.GK.Rechts;
        const yC = eckeAPoint.GK.Hoch;
        
        const rvKante = UsedDataCalculator.GKVector3d_Richtungsvektor(eckeAPoint, eckeBPoint);
        const xK = rvKante.GK.Rechts;
        const yK = rvKante.GK.Hoch;
        
        // Check if lines are not parallel
        const denominator = yK * xS - xK * yS;
        if (Math.abs(denominator) > 0.0001) {
          const t = (-xA * yS + yA * xS + xC * yS - yC * xS) / denominator;
          const r = (-xA * yK + yA * xK + xC * yK - yC * xK) / denominator;
          
          // Check if intersection point is within both line segments
          if (t >= 0 && t <= 1 && r >= 0 && r <= 1) {
            // Calculate intersection point
            const scaledRv: GKVector3d = {
              GK: {
                Rechts: rvKante.GK.Rechts * t,
                Hoch: rvKante.GK.Hoch * t
              },
              z: rvKante.z * t
            };
            
            const intersectionPoint = UsedDataCalculator.GKVector3d_Add(eckeAPoint, scaledRv);
            
            // Check if the terrain point is above the sender-receiver line
            const distToIntersection = UsedDataCalculator.GKVector2d_Abstand(Sender.GK, intersectionPoint.GK);
            const lineHeightAtIntersection = Sender.z + distToIntersection * (Empfaenger.z - Sender.z) / 
                                            UsedDataCalculator.GKVector2d_Abstand(Sender.GK, Empfaenger.GK);
            
            if (intersectionPoint.z > lineHeightAtIntersection) {
              bAbschirm = true;
            }
            
            intersectionPoints.push({ 
              index: iKante, 
              point: intersectionPoint, 
              distance: distToIntersection 
            });
          }
        }
      }
    }

    let screeningAttenuation = -1;
    // console.log("bAbschirm", bAbschirm);

    if (bAbschirm && intersectionPoints.length > 0) {
      // Find the highest obstruction point
      let highestPoint = intersectionPoints[0];
      for (const point of intersectionPoints) {
        if (point.point.z > highestPoint.point.z) {
          highestPoint = point;
        }
      }

      // Calculate screening attenuation using diffraction formula with frequency-dependent wavelength
      const SA = UsedDataCalculator.GKVector3d_Abstand(Sender, highestPoint.point);
      const AE = UsedDataCalculator.GKVector3d_Abstand(highestPoint.point, Empfaenger);
      const SE = UsedDataCalculator.GKVector3d_Abstand(Sender, Empfaenger);
      const z = SA + AE - SE; // Path length difference

      if (z > 0) {
        const Kmet = Math.exp(-Math.sqrt(SA * AE * SE / (2 * z)) / 2000);
        
        // Use frequency-dependent wavelength for screening calculation
        if (f === -1) {
          // Non-frequency case, use fixed lambda of 0.7
          screeningAttenuation = 10 * Math.log10(3 + z * Kmet * 20 / 0.7);
        } else {
          // Frequency-dependent case, use wavelength lambda = 340 / frequency
          const lambdaAbsch = this.getLambdaAbsch(f);
          screeningAttenuation = 10 * Math.log10(3 + z * Kmet * 20 / lambdaAbsch);
        }
        if (LOG_ENABLED) {
          console.log(`DEBUG: Frequency screening - f=${f}, lambda=${f === -1 ? 0.7 : this.getLambdaAbsch(f).toFixed(4)}, z=${z.toFixed(4)}, Kmet=${Kmet.toFixed(4)}, Attenuation=${screeningAttenuation.toFixed(2)} dB`);
        }
      } else {
        screeningAttenuation = 0;
      }
    }

    // Calculate average height and projected distance
    const result = this.getMittlereHoeheDpWithEdges(intersectionPoints, Sender, Empfaenger);
    const mittlHoehe = result[0];
    const dP = result[1];

    return [screeningAttenuation, mittlHoehe, dP];
  }

  private berechneAbschirmungMtlHoeheDp(
    Sender: GKVector3d,
    Empfaenger: GKVector3d,
    dEntfernung: number,
    bIsESQ: boolean = true
  ): number[] {
    // Non-frequency version, delegate to frequency version with f = -1
    return this.berechneAbschirmungMtlHoeheDpFreq(Sender, Empfaenger, dEntfernung, -1, bIsESQ);
  }

  private getHeightPointByLfdNummer(lfdNummer: number): GKVector3d | null {
    if (!this.usedData.Hoehenpunkte || lfdNummer === 0) return null;
    
    const punkt = this.usedData.Hoehenpunkte.find(p => p.LfdNummer === lfdNummer);
    if (!punkt) return null;
    
    return punkt.GK_Vektor;
  }

  private getMittlereHoeheDpWithEdges(
    intersectionPoints: Array<{ index: number; point: GKVector3d; distance: number }>,
    Sender: GKVector3d,
    Empfaenger: GKVector3d
  ): number[] {
    // Simplified version without actual terrain data
    const totalDistance = UsedDataCalculator.GKVector2d_Abstand(Sender.GK, Empfaenger.GK);
    
    // Add sender and receiver ground points
    const allPoints: Array<{ distance: number; height: number }> = [];
    
    // Add sender ground point
    const senderGroundHeight = this.dtmProcessor?.berechneHoeheDGM(Sender.GK) || 0;
    allPoints.push({ distance: 0, height: senderGroundHeight });
    
    // Add all intersection points
    for (const intersection of intersectionPoints) {
      allPoints.push({ distance: intersection.distance, height: intersection.point.z });
    }
    
    // Add receiver ground point
    const receiverGroundHeight = this.dtmProcessor?.berechneHoeheDGM(Empfaenger.GK) || 0;
    allPoints.push({ distance: totalDistance, height: receiverGroundHeight });
    
    // Sort by distance
    allPoints.sort((a, b) => a.distance - b.distance);
    
    // Calculate area using trapezoidal rule
    let mittlHoehe = 0;
    let dP = 0;
    
    let eAlt = 0;
    let zAlt = Sender.z;
    
    for (const point of allPoints) {
      const eNeu = point.distance;
      const zNeu = point.height;
      
      mittlHoehe += (zAlt + zNeu) * (eAlt - eNeu);
      
      if (eNeu > eAlt) {
        dP += Math.sqrt(Math.pow(eNeu - eAlt, 2) + Math.pow(zNeu - zAlt, 2));
      }
      
      eAlt = eNeu;
      zAlt = zNeu;
    }
    
    // Add final segment
    const eNeuFinal = totalDistance;
    const zNeuFinal = Empfaenger.z;
    mittlHoehe += (zAlt + zNeuFinal) * (eAlt - eNeuFinal);
    
    // Complete the loop back to sender
    mittlHoehe += (zNeuFinal + Sender.z) * (eNeuFinal - 0);
    
    mittlHoehe = mittlHoehe / 2; // Complete the trapezoid formula
    mittlHoehe = mittlHoehe / totalDistance; // Normalize by distance
    
    // If dP is 0 (no terrain variation), use direct distance
    if (dP === 0) {
      dP = totalDistance;
    }
    
    return [mittlHoehe, dP];
  }

  private getDOmega(Sender: GKVector3d, Empfaenger: GKVector3d): number {
    // Calculate solid angle correction factor
    const terrainAtSender = this.dtmProcessor?.berechneHoeheDGM(Sender.GK) || 0;
    const terrainAtReceiver = this.dtmProcessor?.berechneHoeheDGM(Empfaenger.GK) || 0;

    const hS = Sender.z - terrainAtSender;
    const hR = Empfaenger.z - terrainAtReceiver;
    const dP = UsedDataCalculator.GKVector2d_Abstand(Sender.GK, Empfaenger.GK);

    // Correct DOmega calculation
    const DOmega = 10 * Math.log10(1 + (dP * dP + Math.pow(hS - hR, 2)) / (dP * dP + Math.pow(hS + hR, 2)));

    if (LOG_ENABLED) {
      console.log(`DEBUG: DOmega=${DOmega}, hS=${hS}, hR=${hR}, dP=${dP}`);
    }

    return DOmega;
  }

  private getAgrKorrektur(distance: number, Sender: GKVector3d, Empfaenger: GKVector3d): number {
    // Calculate ground effect correction using polynomial approximation
    const terrainAtSender = this.dtmProcessor?.berechneHoeheDGM(Sender.GK) || 0;
    const terrainAtReceiver = this.dtmProcessor?.berechneHoeheDGM(Empfaenger.GK) || 0;

    const hS = Sender.z - terrainAtSender;
    const hR = Empfaenger.z - terrainAtReceiver;
    const mtlHoehe = (hS + hR) / 2;

    if (mtlHoehe <= 0) return 0;

    const x = 10 * Math.log10(distance / mtlHoehe);
    let tmp_AgrKorrektur = 0;

    if (x <= 9 && x >= -5) {
      const Q6 = x - 3;
      tmp_AgrKorrektur = -0.00002 * Math.pow(Q6, 6) - 0.00003 * Math.pow(Q6, 5) +
                         0.0017 * Math.pow(Q6, 4) - 0.0019 * Math.pow(Q6, 3) -
                         0.0491 * Math.pow(Q6, 2) + 0.3146 * Q6 + 2.0716;
    } else if (x <= 19 && x > 9) {
      const R6 = x - 13;
      tmp_AgrKorrektur = 0.00001 * Math.pow(R6, 6) - 0.0001 * Math.pow(R6, 5) +
                         0.00006 * Math.pow(R6, 4) - 0.0028 * Math.pow(R6, 3) +
                         0.0525 * Math.pow(R6, 2) - 0.4149 * R6 - 0.0884 - 1;
    } else {
      tmp_AgrKorrektur = 0;
    }

    return tmp_AgrKorrektur;
  }

  private berechneCmet(
    Sender: GKVector3d,
    Empfaenger: GKVector3d,
    HoeheSender: number,
    HoeheEmpfaenger: number,
    c0: number
  ): number {
    // Meteorological correction calculation
    // As of January 2024, this always returns 0
    const hs = HoeheSender;
    const hr = HoeheEmpfaenger;
    const dp = UsedDataCalculator.GKVector2d_Abstand(Sender.GK, Empfaenger.GK);

    console.log("Provided c0", c0);
    if (dp <= 10 * (hs + hr)) {
      return 0;
    } else {
      // Always returns 0 as per January 2024 update
      return 0;
    }
  }

  private calculateESQContribution(immiPkt: GKVector3d, immissionPoint: UsedImmissionPoint): number {
    let totalESQContribution = 0;

    for (const esq of this.usedData.ESQSources) {
      if (LOG_ENABLED) {
        console.log(`    Processing ESQ: ${esq.Bezeichnung}`);
      }
      if (LOG_ENABLED) {
        console.log("Current ESQ", esq);
      }

      // Original:
      // const senderPos = esq.Position;
      const senderPos = {
        GK: {
          Rechts: esq.Position.GK.Rechts,
          Hoch: esq.Position.GK.Hoch
        },
        z: esq.Position.z + esq.Hoehe
      }
      const dEntfernung = UsedDataCalculator.GKVector3d_Abstand(senderPos, immiPkt);
      if (LOG_ENABLED) {
        console.log(`      Distance to ESQ: ${dEntfernung.toFixed(2)} m`);
      }

      // Calculate sound power level
      let lw = 0;
      if (esq.Schallleistungspegel) {
        lw = esq.L;
        if (LOG_ENABLED) {
         console.log(`      Using direct Lw: ${lw} dB`);
        }
      } else {
        lw = esq.L + 10 * Math.log10(4 * Math.PI * esq.S * esq.S);
        if (LOG_ENABLED) {
          console.log(`      Calculated Lw from L=${esq.L} and S=${esq.S}: ${lw} dB`);
        }
      }

      if (lw > 0) {
        // Calculate attenuation components
        const Adiv = 20 * Math.log10(dEntfernung) + 11;
        const Aatm = this.absorpKoeff * dEntfernung / 1000;

        // Calculate ground and barrier effects WITH screening
        const Agrbar = this.berechneAgr(senderPos, immiPkt, immissionPoint.G_Bodenfaktor, true);

        // Correction factors
        const DOmega = esq.Raumwinkelmass;
        let AgrKorrektur = 0;
        if (this.usedData.AgrKorrektur) {
          AgrKorrektur = this.getAgrKorrektur(dEntfernung, senderPos, immiPkt);
        }

        // Calculate meteorological correction
        const immissionHeightAboveGround = immissionPoint.HeightOffset;
        const Cmet = this.berechneCmet(senderPos, immiPkt, esq.Hoehe, immissionHeightAboveGround, esq.Z_Cmet);

        const Amisc = 0;
        const A = Adiv + Aatm + Amisc + Agrbar;
        let BZ = 0

        let EWZ = 0
        // Apply time corrections and penalties
        if (esq.Beurteilungszeitraum === 0 /*Tagstunde*/) {
          BZ = 16;
        } else if (esq.Beurteilungszeitraum === 1) {
          BZ = 8;
        } else if (esq.Beurteilungszeitraum === 2) {
          BZ = 1;
        }
        if (esq.Zeiteinheit === 0) {
          EWZ = esq.Einwirkzeit / 3600;
        } else if (esq.Zeiteinheit === 1) {
          EWZ = esq.Einwirkzeit / 60;
        } else if (esq.Zeiteinheit === 2) {
          EWZ = esq.Einwirkzeit;
        } else {
          // fallback: treat as hours if unknown
          console.log("WARNING: Unknown time unit for ESQ", esq);
          EWZ = esq.Einwirkzeit;
        }
        const DZeit = EWZ > 0 ? 10 * Math.log10(EWZ / BZ) : 0;
        if (LOG_ENABLED) {
          console.log("DZeit", DZeit, EWZ, BZ);
        }
        const ZRuhe = esq.Ruhezeitzuschlag ? 1.9 : 0;
        const Z_Tonhaltigkeit = esq.Z_Tonhaltigkeit;
        const Z_Impulshaltigkeit = esq.Z_Impulshaltigkeit;
        if (LOG_ENABLED) {
          console.log("DZeit", DZeit, EWZ, BZ);
          console.log(`      Attenuation: Adiv=${Adiv.toFixed(2)}, Aatm=${Aatm.toFixed(2)}, Agrbar=${Agrbar.toFixed(2)}, Cmet=${Cmet.toFixed(2)}`);
          console.log(`      Lw=${lw.toFixed(2)}, DOmega=${DOmega.toFixed(2)}, Total A=${A.toFixed(2)}`);
          console.log(`      Penalties: ZRuhe=${ZRuhe.toFixed(1)}, Z_Ton=${Z_Tonhaltigkeit.toFixed(1)}, Z_Impuls=${Z_Impulshaltigkeit.toFixed(1)}`);
   
        }


        const effectiveLevel = lw + DOmega - A - AgrKorrektur - Cmet + DZeit + ZRuhe + Z_Tonhaltigkeit + Z_Impulshaltigkeit;
        if (LOG_ENABLED) {
          console.log("effectiveLevel", effectiveLevel);
        }
        if (effectiveLevel > 0) {
          const contribution = Math.pow(10, 0.1 * effectiveLevel);
          if (LOG_ENABLED) {
            console.log(`      ESQ contribution: ${10 * Math.log10(contribution)} dB`);
          }
          totalESQContribution += contribution;
        }
      }
    }

    return totalESQContribution;
  }

  // Frequency Helper Functions
  private getAlphaAtm(f: number): number {
    // Get atmospheric absorption coefficient by frequency
    if (f >= 0 && f <= 8) return 0.1;      // 12.5 - 80 Hz
    if (f >= 9 && f <= 11) return 0.4;     // 100 - 160 Hz
    if (f >= 12 && f <= 14) return 1;      // 200 - 315 Hz
    if (f >= 15 && f <= 17) return 1.9;    // 400 - 630 Hz
    if (f >= 18 && f <= 20) return 3.7;    // 800 - 1250 Hz
    if (f >= 21 && f <= 23) return 9.7;    // 1600 - 2500 Hz
    if (f >= 24 && f <= 26) return 32.8;   // 3150 - 5000 Hz
    if (f >= 27 && f <= 32) return 117;    // 6300 - 20000 Hz
    return 0;
  }

  private getAC(f: number): number {
    const values: { [key: number]: number } = {
      0: -1000000, 1: -1000000, 2: -1000000, 3: -1000000, 4: -1000000, 5: -1000000,
      6: -38.1, 7: -37.6, 8: -34.9, 9: -20.7, 10: -28.9, 11: -28.9,
      12: -22.9, 13: -26, 14: -22.7, 15: -21.3, 16: -20, 17: -17.6,
      18: -15.9, 19: -13.6, 20: -11.9, 21: -10.7, 22: -9.8, 23: -9.4,
      24: -9.8, 25: -10.4, 26: -10.3, 27: -10.7, 28: -11.5, 29: -12.5,
      30: -14.8, 31: -19.5, 32: -22.2
    };
    return values[f] || 0;
  }

  private getDCpos(f: number): number {
    if (f >= 0 && f <= 5) return -1000000;
    if (f >= 6 && f <= 8) return -44.1 + 4.77;
    if (f >= 9 && f <= 11) return -33 + 4.77;
    if (f >= 12 && f <= 14) return -20.5 + 4.77;
    if (f >= 15 && f <= 17) return -13.1 + 4.77;
    if (f >= 18 && f <= 20) return -8 + 4.77;
    if (f >= 21 && f <= 23) return -5.7 + 4.77;
    if (f >= 24 && f <= 26) return -5.9 + 4.77;
    if (f >= 27 && f <= 29) return -6 + 4.77;
    if (f >= 30 && f <= 32) return -14.5 + 4.77;
    return 0;
  }

  private getDCneg(f: number): number {
    if (f >= 0 && f <= 14) return -1000000;
    if (f >= 15 && f <= 17) return -25.4 + 4.77;
    if (f >= 18 && f <= 20) return -21.2 + 4.77;
    if (f >= 21 && f <= 23) return -17 + 4.77;
    if (f >= 24 && f <= 26) return -7.2 + 4.77;
    if (f >= 27 && f <= 29) return -4.3 + 4.77;
    if (f >= 30 && f <= 32) return -3.8 + 4.77;
    return 0;
  }

  private getLwAF(f: number, ACDC: number): number {
    // Get frequency adjustment for AC/DC type
    switch (ACDC) {
      case 1: return this.getAC(f);        // AC
      case 2: return this.getDCpos(f);     // DC positive
      case 3: return this.getDCneg(f);     // DC negative
      default: return this.getAC(f);
    }
  }

  private getStrF(f: number): string {
    // Get frequency string for debug output
    const frequencies = [
      '12.5', '16', '20', '25', '31.5', '40', '50', '63', '80',
      '100', '125', '160', '200', '250', '315', '400', '500', '630',
      '800', '1000', '1250', '1600', '2000', '2500', '3150', '4000', '5000',
      '6300', '8000', '10000', '12500', '16000', '20000'
    ];
    return frequencies[f] || 'unknown';
  }

  private getLambdaAbsch(f: number): number {
    // Get wavelength for frequency-dependent screening calculation
    const frequencies = [
      12.5, 16, 20, 25, 31.5, 40, 50, 63, 80,
      100, 125, 160, 200, 250, 315, 400, 500, 630,
      800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000,
      6300, 8000, 10000, 12500, 16000, 20000
    ];
    const freq = frequencies[f];
    return freq ? 340.0 / freq : 340.0 / 1000; // Default to 1000 Hz
  }

  private berechneAgrF0124(mittlHoehe: number, dP: number, f: number, G_Bodenfaktor: number): number {
    // Calculate frequency-dependent ground attenuation
    if (LOG_ENABLED) {
      console.log("f", f);
      console.log("G_Bodenfaktor", G_Bodenfaktor);
    }
    let tmp = 4.8 - (2 * mittlHoehe / dP) * (17 + 300 / dP);
    if (tmp < 0) tmp = 0;
    return tmp;
  }

  // Static vector utility methods
  public static GKVector3d_Abstand(p1: GKVector3d, p2: GKVector3d): number {
    const dx = p2.GK.Rechts - p1.GK.Rechts;
    const dy = p2.GK.Hoch - p1.GK.Hoch;
    const dz = p2.z - p1.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  public static GKVector2d_Abstand(p1: GKVector2d, p2: GKVector2d): number {
    const dx = p2.Rechts - p1.Rechts;
    const dy = p2.Hoch - p1.Hoch;
    return Math.sqrt(dx * dx + dy * dy);
  }

  public static GKVector3d_Richtungsvektor(from: GKVector3d, to: GKVector3d): GKVector3d {
    return {
      GK: {
        Rechts: to.GK.Rechts - from.GK.Rechts,
        Hoch: to.GK.Hoch - from.GK.Hoch
      },
      z: to.z - from.z
    };
  }

  public static GKVector3d_Add(p1: GKVector3d, p2: GKVector3d): GKVector3d {
    return {
      GK: {
        Rechts: p1.GK.Rechts + p2.GK.Rechts,
        Hoch: p1.GK.Hoch + p2.GK.Hoch
      },
      z: p1.z + p2.z
    };
  }
}