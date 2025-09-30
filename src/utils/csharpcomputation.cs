using System;
using System.Collections.Generic;
using System.Linq;
using CoronaCalculationEngine;

namespace CoronaCalculationTests
{
    public class UsedDataCalculator
    {
        private UsedAgain usedData;
        private DTMProcessor dtmProcessor;
        private const double absorpKoeff = 1.0; // Atmospheric absorption coefficient from Constants
        
        public UsedDataCalculator(UsedAgain projectData, DTMProcessor dtmProc)
        {
            this.usedData = projectData;
            this.dtmProcessor = dtmProc;
        }
        
        public double CalculateLatLTForImmissionPoint(int immissionPointIndex)
        {
            if (immissionPointIndex >= usedData.ImmissionPoints.Count)
            {
                Console.WriteLine($"Invalid immission point index: {immissionPointIndex}");
                return 0;
            }
            
            var immissionPoint = usedData.ImmissionPoints[immissionPointIndex];
            // For transmission line calculations, use base Z without height offset (matching OriginalCalculator)
            var immiPkt = new GKVector3d
            {
                GK = new GKVector2d 
                { 
                    Rechts = immissionPoint.Position.GK.Rechts,
                    Hoch = immissionPoint.Position.GK.Hoch
                },
                z = immissionPoint.Position.z  // Use base Z without height offset for transmission lines
            };
            
            Console.WriteLine($"    UsedDataCalculator - Processing: {immissionPoint.Name}");
            Console.WriteLine($"    Using ImmiPkt: Rechts={immiPkt.GK.Rechts}, Hoch={immiPkt.GK.Hoch}, Z={immiPkt.z}");
            
            double totalLatDW = 0;
            
            // Calculate ESQ contributions with screening
            // Note: ESQ calculations use the base immission point height, not with offset
            double esqContribution = CalculateESQContribution(immiPkt, immissionPoint);
            if (esqContribution > 0)
            {
                Console.WriteLine($"    ESQ total contribution: {10 * Math.Log10(esqContribution):F2} dB");
                totalLatDW += esqContribution;
            }
            
            // Process each transmission line
            Console.WriteLine($"    Total transmission lines in UsedData: {usedData.Trassen.Count}");
            foreach (var trasse in usedData.Trassen)
            {
                Console.WriteLine($"    Processing transmission line: {trasse.Name} (Nummer={trasse.Nummer}, Masts={trasse.UsedMasten.Count})");
                
                // Process mast spans (pairs of consecutive masts)
                for (int mastIndex = 0; mastIndex < trasse.UsedMasten.Count - 1; mastIndex++)
                {
                    var currentMast = trasse.UsedMasten[mastIndex];
                    var nextMast = trasse.UsedMasten[mastIndex + 1];
                    
                    Console.WriteLine($"      Processing mast span {mastIndex} to {mastIndex + 1}");
                    
                    // Process each level
                    foreach (var ebene in currentMast.UsedEbenen)
                    {
                        Console.WriteLine($"        Processing level: NummerEbene={ebene.NummerEbene}");
                        
                        // Process left conductors
                        foreach (var leiter in ebene.UsedLeitungenLinks)
                        {
                            Console.WriteLine($"          Processing left conductor: NummerLeiter={leiter.NummerLeiter}, NextMastEbene={leiter.NextMastEbene}, NextMastLeiter={leiter.NextMastLeiter}");
                            
                            // Find corresponding conductor on next mast
                            var nextLeiter = FindNextConductor(nextMast, leiter.NextMastEbene, leiter.NextMastLeiter);
                            if (nextLeiter != null)
                            {
                                Console.WriteLine($"            Found next conductor: NummerLeiter={nextLeiter.NummerLeiter}");
                                double lft = CalcLeiter(leiter, nextLeiter, immiPkt, immissionPoint.G_Bodenfaktor);
                                if (lft > 0)
                                {
                                    Console.WriteLine($"            Contribution: {lft}");
                                    totalLatDW += lft;
                                }
                            }
                            else
                            {
                                Console.WriteLine($"            WARNING: Could not find next conductor!");
                            }
                        }
                        
                        // Process right conductors
                        foreach (var leiter in ebene.UsedLeitungenRechts)
                        {
                            Console.WriteLine($"          Processing right conductor: NummerLeiter={leiter.NummerLeiter}, NextMastEbene={leiter.NextMastEbene}, NextMastLeiter={leiter.NextMastLeiter}");
                            
                            // Find corresponding conductor on next mast
                            var nextLeiter = FindNextConductor(nextMast, leiter.NextMastEbene, leiter.NextMastLeiter);
                            if (nextLeiter != null)
                            {
                                Console.WriteLine($"            Found next conductor: NummerLeiter={nextLeiter.NummerLeiter}");
                                double lft = CalcLeiter(leiter, nextLeiter, immiPkt, immissionPoint.G_Bodenfaktor);
                                if (lft > 0)
                                {
                                    Console.WriteLine($"            Contribution: {lft}");
                                    totalLatDW += lft;
                                }
                            }
                            else
                            {
                                Console.WriteLine($"            WARNING: Could not find next conductor!");
                            }
                        }
                    }
                }
            }
            
            // Calculate long-term average level
            double latLT = 0;
            if (totalLatDW >= 1)
            {
                latLT = 10 * Math.Log10(totalLatDW);
            }
            
            Console.WriteLine($"[UsedDataCalculator] Total LatLT for immission point {immissionPointIndex}: {latLT:F2} dB");
            Console.WriteLine($"DEBUG: Total Iteration_Leiter result = {totalLatDW}");
            
            return latLT;
        }
        
        private UsedLeiter FindNextConductor(UsedMast nextMast, short nextMastEbene, short nextMastLeiter)
        {
            if (nextMastEbene <= 0 || nextMastEbene > nextMast.UsedEbenen.Count)
                return null;
                
            var targetEbene = nextMast.UsedEbenen.FirstOrDefault(e => e.NummerEbene == nextMastEbene);
            if (targetEbene == null)
                return null;
            
            if (nextMastLeiter < 0)
            {
                // Left conductor
                int index = -nextMastLeiter - 1;
                if (index >= 0 && index < targetEbene.UsedLeitungenLinks.Count)
                    return targetEbene.UsedLeitungenLinks[index];
            }
            else if (nextMastLeiter > 0)
            {
                // Right conductor
                int index = nextMastLeiter - 1;
                if (index >= 0 && index < targetEbene.UsedLeitungenRechts.Count)
                    return targetEbene.UsedLeitungenRechts[index];
            }
            
            return null;
        }
        
        private double CalcLeiter(UsedLeiter thisLeiter, UsedLeiter nextLeiter, GKVector3d immiPkt, double gBodenfaktor)
        {
            // Get sound power level from conductor type
            double lwFehler = 0;
            string sLw = thisLeiter.SchallLw?.Trim() ?? "";
            
            Console.WriteLine($"            Looking up sound power for conductor type: '{sLw}'");
            Console.WriteLine($"            Available conductor types: {usedData.LeiterTypes.Count}");
            
            // Look up sound power level from LeiterTypes
            foreach (var leiterType in usedData.LeiterTypes)
            {
                string typeName = leiterType.Name?.Trim() ?? "";
                Console.WriteLine($"              Checking: '{typeName}' vs '{sLw}', SchallLW={leiterType.SchallLW}");
                if (typeName == sLw)
                {
                    lwFehler = leiterType.SchallLW;
                    Console.WriteLine($"            FOUND: lwFehler={lwFehler} dB for type '{sLw}'");
                    break;
                }
            }
            
            if (lwFehler == 0)
            {
                Console.WriteLine($"            WARNING: No sound power level found for conductor type '{sLw}'");
            }
            
            // Log conductor parameters
            Console.WriteLine($"            Conductor parameters: BetrU={thisLeiter.BetrU}, ParabelA={thisLeiter.ParabelA}, ParabelB={thisLeiter.ParabelB}, ParabelC={thisLeiter.ParabelC}");
            
            // Call the full Iteration_Leiter method with proper parameters
            double result = Iteration_Leiter(
                lwFehler,
                0, // UBeginn
                thisLeiter.BetrU, // UEnd
                thisLeiter,
                nextLeiter,
                immiPkt,
                false, // bIsESQ
                gBodenfaktor
            );
            
            Console.WriteLine($"DEBUG: Total Iteration_Leiter result = {result}");
            return result;
        }
        
        private double Iteration_Leiter(double lwFehler, double UBeginn, double UEnd, 
            UsedLeiter thisLeiter, UsedLeiter nextLeiter, GKVector3d cIOrt, 
            bool bIsESQ, double G_Bodenfaktor)
        {
            // Calculate midpoint on parabolic conductor path
            double midU = UBeginn + (UEnd - UBeginn) / 2;
            GKVector3d mtlPkt = Parabelpunkt(
                thisLeiter.BetrU, 
                thisLeiter.Durchgangspunkt.GK, 
                nextLeiter.Durchgangspunkt.GK,
                thisLeiter.ParabelA, 
                thisLeiter.ParabelB, 
                thisLeiter.ParabelC,
                thisLeiter.Durchhang, 
                midU
            );
            
            double dEntfernung = GKVector3d.Abstand(mtlPkt, cIOrt);
            
            // Calculate segment length using parabolic arc formula
            double zI = 2 * (double)thisLeiter.ParabelA * UBeginn + (double)thisLeiter.ParabelB;
            double zII = 2 * (double)thisLeiter.ParabelA * UEnd + (double)thisLeiter.ParabelB;
            double SQRTzI = Math.Sqrt(1 + zI * zI);
            double SQRTzII = Math.Sqrt(1 + zII * zII);
            double SegLen = (float)((zII * SQRTzII + Math.Log(zII + SQRTzII) - 
                                    (zI * SQRTzI + Math.Log(zI + SQRTzI))) / (4 * (double)thisLeiter.ParabelA));
            
            // Debug output
            Console.WriteLine($"DEBUG: dEntfernung={dEntfernung}, SegLen={SegLen}");
            Console.WriteLine($"DEBUG: mtlPunkt at hoch={mtlPkt.GK.Hoch}, rechts={mtlPkt.GK.Rechts}, hoehe={mtlPkt.z}");
            Console.WriteLine($"DEBUG: Branching check: dEntfernung({dEntfernung}) > 2*SegLen({2 * SegLen}) = {dEntfernung > 2 * SegLen}, SegLen < 5 = {SegLen < 5}");
            
            // Check if we should calculate this segment or subdivide further
            if (dEntfernung > 2 * SegLen || SegLen < 5)
            {
                double Lw = lwFehler + (float)(10 * Math.Log10(SegLen));
                if (dEntfernung <= 0.28 * Math.Sqrt(Math.Pow(10, 0.1 * Lw)))
                {
                    return Seg_Trasse(Lw, mtlPkt, cIOrt, dEntfernung, bIsESQ, thisLeiter.ACDC, G_Bodenfaktor);
                }
            }
            else
            {
                // Subdivide and recurse
                Console.WriteLine($"DEBUG: SUBDIVIDING segment from {UBeginn} to {UEnd}");
                return Iteration_Leiter(lwFehler, UBeginn, midU, thisLeiter, nextLeiter, cIOrt, bIsESQ, G_Bodenfaktor) +
                       Iteration_Leiter(lwFehler, midU, UEnd, thisLeiter, nextLeiter, cIOrt, bIsESQ, G_Bodenfaktor);
            }
            
            return 0;
        }
        
        private GKVector3d Parabelpunkt(double BetrU, GKVector2d PktA, GKVector2d PktB, 
            decimal a, decimal b, decimal c, float d, double r)
        {
            // Calculate point on parabolic conductor path
            // a,b,c are parabola parameters, r is the position parameter
            var tmp = new GKVector3d();
            tmp.GK.Hoch = PktA.Hoch + r * (PktB.Hoch - PktA.Hoch) / BetrU;
            tmp.GK.Rechts = PktA.Rechts + r * (PktB.Rechts - PktA.Rechts) / BetrU;
            tmp.z = (float)((double)a * r * r + (double)b * r + (double)c);
            return tmp;
        }
        
        private double Seg_Trasse(double Lw, GKVector3d Sender, GKVector3d Empfaenger, 
            double dEntfernung, bool bIsESQ, byte btACDC, double G_Bodenfaktor)
        {
            // Check if frequency-dependent calculation is enabled
            if (usedData.mitFrequenz == false)
            {
                // Non-frequency dependent calculation (existing behavior)
                double Adiv = (float)(20 * Math.Log10(dEntfernung) + 11);
                double Aatm = absorpKoeff * dEntfernung / 1000;
                
                // Ground and barrier effects
                double Agrbar = Berechne_Agr(Sender, Empfaenger, G_Bodenfaktor, bIsESQ);
                
                // Correction factors
                double DOmega = Get_DOmega(Sender, Empfaenger);
                double AgrKorrektur = 0;
                if (usedData.AgrKorrektur)
                {
                    AgrKorrektur = Get_AgrKorrektur(dEntfernung, Sender, Empfaenger);
                }
                
                double Amisc = 0;
                double A = Adiv + Aatm + Amisc + Agrbar;
                
                // Debug output
                Console.WriteLine($"DEBUG: Adiv={Adiv:F2}, Aatm={Aatm:F2}, Amisc={Amisc:F2}, Agrbar={Agrbar:F2}, Total A={A:F2}");
                Console.WriteLine($"DEBUG: DOmega={DOmega:F4}, AgrKorrektur={AgrKorrektur:F4}");
                Console.WriteLine($"DEBUG: Checking condition: Lw({Lw:F2}) + DOmega({DOmega:F2}) = {Lw + DOmega:F2} > A({A:F2}) + AgrKorrektur({AgrKorrektur:F2}) = {A + AgrKorrektur:F2}");
                
                if (Lw + DOmega > A + AgrKorrektur)
                {
                    double Seg_i = Math.Pow(10, 0.1 * (Lw + DOmega - A - AgrKorrektur));
                    Console.WriteLine($"DEBUG: Calculation: 10^(0.1 * ({Lw:F2} + {DOmega:F2} - {A:F2} - {AgrKorrektur:F2})) = 10^(0.1 * {Lw + DOmega - A - AgrKorrektur:F2}) = {Seg_i:E4}");
                    return Seg_i;
                }
                
                return 0;
            }
            else
            {
                // Frequency-dependent calculation
                Console.WriteLine($"DEBUG: Using frequency-dependent calculation, btACDC={btACDC}, Lw={Lw:F2}");
                double Seg_i_f_sum = 0;

                for (int f = 0; f <= 32; f++) // über alle Frequenzen von 12,5 bis 20k
                {
                    // Berechnung des Dämpfungsterms A über seine Komponenten Adiv, Aatm, Agrbar, Amisc
                    double Adiv_f = 20 * Math.Log10(dEntfernung) + 11;
                    double Aatm_f = Get_alphaAtm(f) * dEntfernung / 1000;
                    double Amisc_f = 0;

                    var Abar_mtlHoehe = Berechne_Abschirmung_mtlHoehe_dP(Sender, Empfaenger, dEntfernung, f, bIsESQ);
                    double Agrbar_f_original = Abar_mtlHoehe[0];
                    double mtlHoehe = Abar_mtlHoehe[1];
                    double dP = Abar_mtlHoehe[2];

                    Console.WriteLine($"Agrbar_f: {Agrbar_f_original}, mtlHoehe: {mtlHoehe}, dP: {dP}");

                    double Agrbar_f = Agrbar_f_original;
                    if (Agrbar_f <= 0)
                    {
                        Agrbar_f = Berechne_Agr_f_0124(mtlHoehe, dP, f, G_Bodenfaktor);
                    }

                    Console.WriteLine($"Adjusted Agrabar_f: {Agrbar_f}");

                    double A_f = Adiv_f + Aatm_f + Amisc_f + Agrbar_f;
                    Console.WriteLine($"A_f: {A_f}");

                    double Frequenzanpassung = Get_LwA_f(f, btACDC);
                    Console.WriteLine($"Frequenzanpassung ${Frequenzanpassung}");

                    double exponent = 0.1 * (Lw + Frequenzanpassung - A_f);
                    double contribution = Math.Pow(10, exponent);
                    Seg_i_f_sum = Seg_i_f_sum + contribution;

                    Console.WriteLine($"DEBUG: f={f}({Get_str_f(f)}Hz): Adiv_f={Adiv_f:F2}, Aatm_f={Aatm_f:F2}, Agrbar_f={Agrbar_f:F2}, A_f={A_f:F2}, Freq_adj={Frequenzanpassung:F2}");
                    Console.WriteLine($"Addtion: {contribution}");
                }

                Console.WriteLine($"DEBUG: Frequency-dependent total Seg_i_f_sum = {Seg_i_f_sum:E4}");
                return Seg_i_f_sum;
            }
        }
        
        private double Berechne_Agr(GKVector3d Sender, GKVector3d Empfaenger, double G_Bodenfaktor, bool bIsESQ = true)
        {
            // Calculate ground attenuation using path integration
            double dEntfernung = GKVector3d.Abstand(Sender, Empfaenger);
            var result = Berechne_Abschirmung_mtlHoehe_dP(Sender, Empfaenger, dEntfernung, bIsESQ);
            
            double Agrbar = result[0];
            double mtlHoehe = result[1];
            double dP = result[2];
            
            Console.WriteLine($"DEBUG: mtlHoehe={mtlHoehe}, dP={dP}");
            
            // If no screening, calculate ground attenuation
            if (Agrbar <= 0)
            {
                Agrbar = 4.8 - (2 * mtlHoehe / dP) * (17 + 300 / dP);
                if (Agrbar < 0) Agrbar = 0;
                Console.WriteLine($"DEBUG Agr: 4.8 - ({2 * mtlHoehe:F4} / {dP:F4}) * (17 + 300 / {dP:F4})");
                Console.WriteLine($"DEBUG Agr: 4.8 - {2 * mtlHoehe / dP:F6} * {17 + 300 / dP:F4} = {Agrbar:F4}");
            }
            else
            {
                Console.WriteLine($"DEBUG: Using screening attenuation Dz = {Agrbar:F4} dB");
            }
            
            Console.WriteLine($"DEBUG: screeningOrAgr={Agrbar:F4}, mtlHoehe={mtlHoehe:F4}, dP={dP:F4}");
            
            return Agrbar;
        }
        
        // Frequency-dependent version that includes wavelength-based screening calculation
        private double[] Berechne_Abschirmung_mtlHoehe_dP(GKVector3d Sender, GKVector3d Empfaenger, double dEntfernung, int f, bool bIsESQ = true)
        {
            // This function calculates screening effects from DGM edges and average height above terrain
            // NOTE: Screening is applied to both transmission lines and ESQ sources (matching OriginalCalculator)
            double xA = Sender.GK.Rechts;
            double yA = Sender.GK.Hoch;
            double xB = Empfaenger.GK.Rechts;
            double yB = Empfaenger.GK.Hoch;
            
            var rv = GKVector3d.Richtungsvektor(Sender, Empfaenger);
            double xS = rv.GK.Rechts;
            double yS = rv.GK.Hoch;
            
            bool bAbschirm = false;
            var intersectionPoints = new List<(int index, GKVector3d point, double distance)>();
            
            // Check for screening for both ESQ sources and transmission lines
            // The OriginalCalculator applies screening to both types
            if (dtmProcessor != null && dtmProcessor.DGMKante != null)
            {
                for (int iKante = 0; iKante < dtmProcessor.DGMKante.Length; iKante++)
                {
                    var kante = dtmProcessor.DGMKante[iKante];
                    if (kante.EckeA.Nummer == 0) break;
                    
                    double xC = kante.EckeA.HP.GK_Vektor.GK.Rechts;
                    double yC = kante.EckeA.HP.GK_Vektor.GK.Hoch;
                    
                    var rvKante = GKVector3d.Richtungsvektor(kante.EckeA.HP.GK_Vektor, kante.EckeB.HP.GK_Vektor);
                    double xK = rvKante.GK.Rechts;
                    double yK = rvKante.GK.Hoch;
                    
                    // Check if lines are not parallel
                    double denominator = yK * xS - xK * yS;
                    if (Math.Abs(denominator) > 0.0001)
                    {
                        double t = (-xA * yS + yA * xS + xC * yS - yC * xS) / denominator;
                        double r = (-xA * yK + yA * xK + xC * yK - yC * xK) / denominator;
                        
                        // Check if intersection point is within both line segments
                        if (t >= 0 && t <= 1 && r >= 0 && r <= 1)
                        {
                            // Calculate intersection point
                            var scaledRv = new GKVector3d();
                            scaledRv.GK.Rechts = rvKante.GK.Rechts * t;
                            scaledRv.GK.Hoch = rvKante.GK.Hoch * t;
                            scaledRv.z = rvKante.z * (float)t;
                            
                            var intersectionPoint = GKVector3d.Add(kante.EckeA.HP.GK_Vektor, scaledRv);
                            
                            // Check if the terrain point is above the sender-receiver line
                            double distToIntersection = GKVector2d.Abstand(Sender.GK, intersectionPoint.GK);
                            double lineHeightAtIntersection = Sender.z + distToIntersection * (Empfaenger.z - Sender.z) / 
                                                            GKVector2d.Abstand(Sender.GK, Empfaenger.GK);
                            
                            if (intersectionPoint.z > lineHeightAtIntersection)
                            {
                                bAbschirm = true;
                            }
                            
                            intersectionPoints.Add((iKante, intersectionPoint, distToIntersection));
                        }
                    }
                }
            }
            
            double screeningAttenuation = -1;
            
            if (bAbschirm && intersectionPoints.Count > 0)
            {
                // Find the highest obstruction point
                var highestPoint = intersectionPoints[0];
                foreach (var point in intersectionPoints)
                {
                    if (point.point.z > highestPoint.point.z)
                    {
                        highestPoint = point;
                    }
                }
                
                // Calculate screening attenuation using diffraction formula with frequency-dependent wavelength
                double SA = GKVector3d.Abstand(Sender, highestPoint.point);
                double AE = GKVector3d.Abstand(highestPoint.point, Empfaenger);
                double SE = GKVector3d.Abstand(Sender, Empfaenger);
                double z = SA + AE - SE; // Path length difference
                
                if (z > 0)
                {
                    double Kmet = Math.Exp(-Math.Sqrt(SA * AE * SE / (2 * z)) / 2000);
                    
                    // Use frequency-dependent wavelength for screening calculation
                    if (f == -1)
                    {
                        // Non-frequency case, use fixed lambda of 0.7
                        screeningAttenuation = (float)(10 * Math.Log10(3 + z * Kmet * 20 / 0.7));
                    }
                    else
                    {
                        // Frequency-dependent case, use wavelength lambda = 340 / frequency
                        double lambdaAbsch = Get_lambdaAbsch(f);
                        screeningAttenuation = (float)(10 * Math.Log10(3 + z * Kmet * 20 / lambdaAbsch));
                    }
                    Console.WriteLine($"DEBUG: Frequency screening - f={f}, lambda={Get_lambdaAbsch(f):F4}, z={z:F4}, Kmet={Kmet:F4}, Attenuation={screeningAttenuation:F2} dB");
                }
                else
                {
                    screeningAttenuation = 0;
                }
            }
            
            // Calculate average height and projected distance using the intersection points
            double mittlHoehe, dP;
            var result = Get_mittlereHoehe_dP_WithEdges(intersectionPoints, Sender, Empfaenger);
            mittlHoehe = result[0];
            dP = result[1];
            
            return new double[] { screeningAttenuation, mittlHoehe, dP };
        }

        private double[] Berechne_Abschirmung_mtlHoehe_dP(GKVector3d Sender, GKVector3d Empfaenger, double dEntfernung, bool bIsESQ = true)
        {
            // Non-frequency version, delegate to frequency version with f = -1
            return Berechne_Abschirmung_mtlHoehe_dP(Sender, Empfaenger, dEntfernung, -1, bIsESQ);
        }
        
        private double[] Get_mittlereHoehe_dP_WithEdges(List<(int index, GKVector3d point, double distance)> intersectionPoints,
                                                        GKVector3d Sender, GKVector3d Empfaenger)
        {
            // Add sender and receiver ground points to the list
            var allPoints = new List<(double distance, double height)>();
            
            // Add sender ground point
            double senderGroundHeight = dtmProcessor?.BerechneHoeheDGM(Sender.GK) ?? 0;
            allPoints.Add((0, senderGroundHeight));
            
            // Add all intersection points (projected to ground)
            foreach (var intersection in intersectionPoints)
            {
                allPoints.Add((intersection.distance, intersection.point.z));
            }
            
            // Add receiver ground point
            double receiverGroundHeight = dtmProcessor?.BerechneHoeheDGM(Empfaenger.GK) ?? 0;
            double totalDistance = GKVector2d.Abstand(Sender.GK, Empfaenger.GK);
            allPoints.Add((totalDistance, receiverGroundHeight));
            
            // Sort by distance
            allPoints.Sort((a, b) => a.distance.CompareTo(b.distance));
            
            // Calculate area using trapezoidal rule (Gaussian trapezoid formula)
            double mittlHoehe = 0;
            double dP = 0;
            
            double eAlt = 0; // Start at sender position (0)
            double zAlt = Sender.z;
            
            foreach (var point in allPoints)
            {
                double eNeu = point.distance;
                double zNeu = point.height;
                
                mittlHoehe += (zAlt + zNeu) * (eAlt - eNeu);
                
                if (eNeu > eAlt)
                {
                    dP += Math.Sqrt(Math.Pow(eNeu - eAlt, 2) + Math.Pow(zNeu - zAlt, 2));
                }
                
                eAlt = eNeu;
                zAlt = zNeu;
            }
            
            // Add final segment from last point to receiver
            double eNeuFinal = totalDistance;
            double zNeuFinal = Empfaenger.z;
            mittlHoehe += (zAlt + zNeuFinal) * (eAlt - eNeuFinal);
            
            // Complete the loop back to sender
            mittlHoehe += (zNeuFinal + Sender.z) * (eNeuFinal - 0);
            
            mittlHoehe = mittlHoehe / 2; // Complete the trapezoid formula
            mittlHoehe = mittlHoehe / totalDistance; // Normalize by distance
            
            return new double[] { mittlHoehe, dP };
        }
        
        private double Get_mittlereHoehe(GKVector3d Sender, GKVector3d Empfaenger)
        {
            // Calculate average height of ray path above terrain
            double totalDistance = GKVector2d.Abstand(Sender.GK, Empfaenger.GK);
            if (totalDistance == 0) return 0;
            
            // Path integration for ray height
            double mittlHoehe = 0;
            double eAlt = totalDistance;
            double zAlt = Empfaenger.z;
            
            int numSamples = 50;
            for (int i = 1; i <= numSamples; i++)
            {
                double fraction = (double)i / numSamples;
                double eNeu = totalDistance * (1 - fraction);
                double zNeu = Empfaenger.z + fraction * (Sender.z - Empfaenger.z);
                
                // Trapezoidal integration
                mittlHoehe += (zAlt + zNeu) * (eAlt - eNeu);
                
                eAlt = eNeu;
                zAlt = zNeu;
            }
            
            // Final segment
            mittlHoehe += (zAlt + Sender.z) * eAlt;
            mittlHoehe = mittlHoehe / (2 * totalDistance);
            
            // Calculate average terrain height along path
            double avgTerrainHeight = 0;
            int terrainSamples = 20;
            
            for (int i = 0; i <= terrainSamples; i++)
            {
                double fraction = (double)i / terrainSamples;
                var samplePos = new GKVector2d
                {
                    Rechts = Sender.GK.Rechts + fraction * (Empfaenger.GK.Rechts - Sender.GK.Rechts),
                    Hoch = Sender.GK.Hoch + fraction * (Empfaenger.GK.Hoch - Sender.GK.Hoch)
                };
                
                double terrainAtPoint = dtmProcessor?.BerechneHoeheDGM(samplePos) ?? 0;
                
                // Trapezoidal weights
                double weight = 1.0;
                if (i == 0 || i == terrainSamples)
                {
                    weight = 0.5;
                }
                
                avgTerrainHeight += terrainAtPoint * weight;
            }
            
            avgTerrainHeight = avgTerrainHeight / terrainSamples;
            mittlHoehe = mittlHoehe - avgTerrainHeight;
            
            Console.WriteLine($"DEBUG: Get_mittlereHoehe path integration: ray avg height={mittlHoehe + avgTerrainHeight}, terrain avg={avgTerrainHeight}, mittlHoehe={mittlHoehe}");
            
            return mittlHoehe;
        }
        
        private double Get_DOmega(GKVector3d Sender, GKVector3d Empfaenger)
        {
            // Calculate solid angle correction factor using the correct formula
            double terrainAtSender = dtmProcessor?.BerechneHoeheDGM(Sender.GK) ?? 0;
            double terrainAtReceiver = dtmProcessor?.BerechneHoeheDGM(Empfaenger.GK) ?? 0;
            
            double hS = Sender.z - terrainAtSender;
            double hR = Empfaenger.z - terrainAtReceiver;
            double dP = GKVector2d.Abstand(Sender.GK, Empfaenger.GK);
            
            // Correct DOmega calculation from original
            double DOmega = (float)(10 * Math.Log10(1 + (dP * dP + Math.Pow(hS - hR, 2)) / (dP * dP + Math.Pow(hS + hR, 2))));
            
            Console.WriteLine($"DEBUG: DOmega={DOmega}, hS={hS}, hR={hR}, dP={dP}");
            
            return DOmega;
        }
        
        private double Get_AgrKorrektur(double distance, GKVector3d Sender, GKVector3d Empfaenger)
        {
            // Calculate ground effect correction using polynomial approximation
            double terrainAtSender = dtmProcessor?.BerechneHoeheDGM(Sender.GK) ?? 0;
            double terrainAtReceiver = dtmProcessor?.BerechneHoeheDGM(Empfaenger.GK) ?? 0;
            
            double hS = Sender.z - terrainAtSender;
            double hR = Empfaenger.z - terrainAtReceiver;
            double mtlHoehe = (hS + hR) / 2;
            
            if (mtlHoehe <= 0) return 0;
            
            double x = (float)(10 * Math.Log10(distance / mtlHoehe));
            double tmp_AgrKorrektur = 0;
            
            if (x <= 9 && x >= -5)
            {
                double Q6 = x - 3;
                tmp_AgrKorrektur = (float)(-0.00002 * Math.Pow(Q6, 6) - 0.00003 * Math.Pow(Q6, 5) + 
                                          0.0017 * Math.Pow(Q6, 4) - 0.0019 * Math.Pow(Q6, 3) - 
                                          0.0491 * Math.Pow(Q6, 2) + 0.3146 * Q6 + 2.0716);
            }
            else if (x <= 19 && x > 9)
            {
                double R6 = x - 13;
                tmp_AgrKorrektur = (float)(0.00001 * Math.Pow(R6, 6) - 0.0001 * Math.Pow(R6, 5) + 
                                          0.00006 * Math.Pow(R6, 4) - 0.0028 * Math.Pow(R6, 3) + 
                                          0.0525 * Math.Pow(R6, 2) - 0.4149 * R6 - 0.0884 - 1);
            }
            else
            {
                tmp_AgrKorrektur = 0;
            }
            
            return tmp_AgrKorrektur;
        }
        
        private double BerechneCmet(GKVector3d Sender, GKVector3d Empfaenger, double HoeheSender, double HoeheEmpfaenger, double c0)
        {
            // Meteorological correction calculation
            // As of January 2024, this always returns 0 in the original implementation
            double hs = HoeheSender; // Height of sender above ground
            double hr = HoeheEmpfaenger; // Height of receiver above ground
            double dp = GKVector2d.Abstand(Sender.GK, Empfaenger.GK);
            
            if (dp <= 10 * (hs + hr))
            {
                return 0;
            }
            else
            {
                // Always returns 0 as per January 2024 update
                return 0; // Would be: c0 * (1 - 10 * (hs + hr) / dp)
            }
        }
        
        private double CalculateESQContribution(GKVector3d immiPkt, UsedImmissionPoint immissionPoint)
        {
            double totalESQContribution = 0;
            
            foreach (var esq in usedData.ESQSources)
            {
                Console.WriteLine($"    Processing ESQ: {esq.Bezeichnung}");
                
                // Use base position for sender (height offset handled in Cmet calculation)
                var senderPos = esq.Position;
                
                double dEntfernung = GKVector3d.Abstand(senderPos, immiPkt);
                Console.WriteLine($"      Distance to ESQ: {dEntfernung:F2} m");
                
                // Calculate sound power level based on Schallleistungspegel flag
                double lw = 0;
                if (esq.Schallleistungspegel)
                {
                    // Use L directly as sound power level
                    lw = esq.L;
                    Console.WriteLine($"      Using direct Lw: {lw} dB");
                }
                else
                {
                    // Calculate from L and surface S
                    lw = (float)(esq.L + 10 * Math.Log10(4 * Math.PI * esq.S * esq.S));
                    Console.WriteLine($"      Calculated Lw from L={esq.L} and S={esq.S}: {lw} dB");
                }
                
                if (lw > 0)
                {
                    // Calculate attenuation components
                    double Adiv = (float)(20 * Math.Log10(dEntfernung) + 11);
                    double Aatm = absorpKoeff * dEntfernung / 1000;
                    
                    // Calculate ground and barrier effects WITH screening for ESQ sources
                    // ESQ sources should have screening calculation enabled
                    double Agrbar = Berechne_Agr(senderPos, immiPkt, immissionPoint.G_Bodenfaktor, true);
                    
                    // Correction factors
                    // For ESQ sources, DOmega is the Raumwinkelmass value from the ESQ data directly
                    double DOmega = esq.Raumwinkelmass; // Use the spatial angle measure directly from ESQ data
                    double AgrKorrektur = 0;
                    if (usedData.AgrKorrektur)
                    {
                        AgrKorrektur = Get_AgrKorrektur(dEntfernung, senderPos, immiPkt);
                    }
                    
                    // Calculate meteorological correction
                    // Get receiver height above ground for Cmet calculation
                    double immissionHeightAboveGround = immissionPoint.HeightOffset;
                    double Cmet = BerechneCmet(senderPos, immiPkt, esq.Hoehe, immissionHeightAboveGround, esq.Z_Cmet);
                    
                    double Amisc = 0;
                    double A = Adiv + Aatm + Amisc + Agrbar;
                    
                    // Apply time corrections and penalties
                    double DZeit = 0; // Time correction (for limited operation hours)
                    double ZRuhe = esq.Ruhezeitzuschlag ? 1.9 : 0; // Quiet time penalty
                    double Z_Tonhaltigkeit = esq.Z_Tonhaltigkeit; // Tonality penalty
                    double Z_Impulshaltigkeit = esq.Z_Impulshaltigkeit; // Impulse penalty
                    
                    Console.WriteLine($"      Attenuation: Adiv={Adiv:F2}, Aatm={Aatm:F2}, Agrbar={Agrbar:F2}, Cmet={Cmet:F2}");
                    Console.WriteLine($"      Lw={lw:F2}, DOmega={DOmega:F2}, Total A={A:F2}");
                    Console.WriteLine($"      Penalties: ZRuhe={ZRuhe:F1}, Z_Ton={Z_Tonhaltigkeit:F1}, Z_Impuls={Z_Impulshaltigkeit:F1}");
                    
                    double effectiveLevel = lw + DOmega - A - AgrKorrektur - Cmet + DZeit + ZRuhe + Z_Tonhaltigkeit + Z_Impulshaltigkeit;
                    if (effectiveLevel > 0)
                    {
                        double contribution = Math.Pow(10, 0.1 * effectiveLevel);
                        Console.WriteLine($"      ESQ contribution: {10 * Math.Log10(contribution):F2} dB");
                        totalESQContribution += contribution;
                    }
                }
            }
            
            return totalESQContribution;
        }

        #region "Frequency Helper Functions"
        // Get atmospheric absorption coefficient by frequency
        private double Get_alphaAtm(int f)
        {
            switch (f)
            {
                case 0:  // 12.5
                case 1:  // 16
                case 2:  // 20
                case 3:  // 25
                case 4:  // 31.5
                case 5:  // 40
                case 6:  // 50
                case 7:  // 63
                case 8:  // 80
                    return 0.1;

                case 9:  // 100
                case 10: // 125
                case 11: // 160
                    return 0.4;

                case 12: // 200
                case 13: // 250
                case 14: // 315
                    return 1;

                case 15: // 400
                case 16: // 500
                case 17: // 630
                    return 1.9;

                case 18: // 800
                case 19: // 1000
                case 20: // 1250
                    return 3.7;

                case 21: // 1600
                case 22: // 2000
                case 23: // 2500
                    return 9.7;

                case 24: // 3150
                case 25: // 4000
                case 26: // 5000
                    return 32.8;

                case 27: // 6300
                case 28: // 8000
                case 29: // 10000
                case 30: // 12500
                case 31: // 16000
                case 32: // 20000
                    return 117;
            }

            return 0; // default if f is not in range
        }


        private double Get_AC(int f)
        {
            switch (f)
            {
                case 0:  // 12.5
                case 1:  // 16
                case 2:  // 20
                case 3:  // 25
                case 4:  // 31.5
                case 5:  // 40
                    return -1000000;
                case 6: return -38.1;
                case 7: return -37.6;
                case 8: return -34.9;
                case 9: return -20.7;
                case 10: return -28.9;
                case 11: return -28.9;
                case 12: return -22.9;
                case 13: return -26;
                case 14: return -22.7;
                case 15: return -21.3;
                case 16: return -20;
                case 17: return -17.6;
                case 18: return -15.9;
                case 19: return -13.6;
                case 20: return -11.9;
                case 21: return -10.7;
                case 22: return -9.8;
                case 23: return -9.4;
                case 24: return -9.8;
                case 25: return -10.4;
                case 26: return -10.3;
                case 27: return -10.7;
                case 28: return -11.5;
                case 29: return -12.5;
                case 30: return -14.8;
                case 31: return -19.5;
                case 32: return -22.2;
                default: return 0;
            }
        }

        private double Get_DCpos(int f)
        {
            switch (f)
            {
                case 0:
                case 1:
                case 2:
                case 3:
                case 4:
                case 5:
                    return -1000000;
                case 6:
                case 7:
                case 8:
                    return -44.1 + 4.77;
                case 9:
                case 10:
                case 11:
                    return -33 + 4.77;
                case 12:
                case 13:
                case 14:
                    return -20.5 + 4.77;
                case 15:
                case 16:
                case 17:
                    return -13.1 + 4.77;
                case 18:
                case 19:
                case 20:
                    return -8 + 4.77;
                case 21:
                case 22:
                case 23:
                    return -5.7 + 4.77;
                case 24:
                case 25:
                case 26:
                    return -5.9 + 4.77;
                case 27:
                case 28:
                case 29:
                    return -6 + 4.77;
                case 30:
                case 31:
                case 32:
                    return -14.5 + 4.77;
                default: return 0;
            }
        }

        private double Get_DCneg(int f)
        {
            switch (f)
            {
                case 0:
                case 1:
                case 2:
                case 3:
                case 4:
                case 5:
                case 6:
                case 7:
                case 8:
                case 9:
                case 10:
                case 11:
                case 12:
                case 13:
                case 14:
                    return -1000000;
                case 15:
                case 16:
                case 17:
                    return -25.4 + 4.77;
                case 18:
                case 19:
                case 20:
                    return -21.2 + 4.77;
                case 21:
                case 22:
                case 23:
                    return -17 + 4.77;
                case 24:
                case 25:
                case 26:
                    return -7.2 + 4.77;
                case 27:
                case 28:
                case 29:
                    return -4.3 + 4.77;
                case 30:
                case 31:
                case 32:
                    return -3.8 + 4.77;
                default: return 0;
            }
        }

        // Get frequency adjustment for AC/DC type
        private double Get_LwA_f(int f, byte ACDC)
        {
            switch (ACDC)
            {
                case 1: // AC
                    return Get_AC(f);
                case 2: // DC positive
                    return Get_DCpos(f);
                case 3: // DC negative  
                    return Get_DCneg(f);
                default:
                    return Get_AC(f);
            }
        }

        // Get frequency string for debug output
        private string Get_str_f(int f)
        {
            switch (f)
            {
                case 0: return "12,5";
                case 1: return "16";
                case 2: return "20";
                case 3: return "25";
                case 4: return "31,5";
                case 5: return "40";
                case 6: return "50";
                case 7: return "63";
                case 8: return "80";
                case 9: return "100";
                case 10: return "125";
                case 11: return "160";
                case 12: return "200";
                case 13: return "250";
                case 14: return "315";
                case 15: return "400";
                case 16: return "500";
                case 17: return "630";
                case 18: return "800";
                case 19: return "1000";
                case 20: return "1250";
                case 21: return "1600";
                case 22: return "2000";
                case 23: return "2500";
                case 24: return "3150";
                case 25: return "4000";
                case 26: return "5000";
                case 27: return "6300";
                case 28: return "8000";
                case 29: return "10000";
                case 30: return "12500";
                case 31: return "16000";
                case 32: return "20000";
                default: return "unknown";
            }
        }

        // Calculate frequency-dependent ground attenuation
        private double Berechne_Agr_f_0124(double mittlHoehe, double dP, int f, double G_Bodenfaktor)
        {
            double tmp;
            tmp = 4.8 - (2 * mittlHoehe / dP) * (17 + (300 / dP));
            if (tmp < 0) tmp = 0;
            return tmp;
        }

        // Get wavelength for frequency-dependent screening calculation
        private double Get_lambdaAbsch(int f)
        {
            switch (f)
            {
                case 0: return 340.0 / 12.5;   // 12.5 Hz
                case 1: return 340.0 / 16;     // 16 Hz
                case 2: return 340.0 / 20;     // 20 Hz
                case 3: return 340.0 / 25;     // 25 Hz
                case 4: return 340.0 / 31.5;   // 31.5 Hz
                case 5: return 340.0 / 40;     // 40 Hz
                case 6: return 340.0 / 50;     // 50 Hz
                case 7: return 340.0 / 63;     // 63 Hz
                case 8: return 340.0 / 80;     // 80 Hz
                case 9: return 340.0 / 100;    // 100 Hz
                case 10: return 340.0 / 125;   // 125 Hz
                case 11: return 340.0 / 160;   // 160 Hz
                case 12: return 340.0 / 200;   // 200 Hz
                case 13: return 340.0 / 250;   // 250 Hz
                case 14: return 340.0 / 315;   // 315 Hz
                case 15: return 340.0 / 400;   // 400 Hz
                case 16: return 340.0 / 500;   // 500 Hz
                case 17: return 340.0 / 630;   // 630 Hz
                case 18: return 340.0 / 800;   // 800 Hz
                case 19: return 340.0 / 1000;  // 1000 Hz
                case 20: return 340.0 / 1250;  // 1250 Hz
                case 21: return 340.0 / 1600;  // 1600 Hz
                case 22: return 340.0 / 2000;  // 2000 Hz
                case 23: return 340.0 / 2500;  // 2500 Hz
                case 24: return 340.0 / 3150;  // 3150 Hz
                case 25: return 340.0 / 4000;  // 4000 Hz
                case 26: return 340.0 / 5000;  // 5000 Hz
                case 27: return 340.0 / 6300;  // 6300 Hz
                case 28: return 340.0 / 8000;  // 8000 Hz
                case 29: return 340.0 / 10000; // 10000 Hz
                case 30: return 340.0 / 12500; // 12500 Hz
                case 31: return 340.0 / 16000; // 16000 Hz
                case 32: return 340.0 / 20000; // 20000 Hz
                default: return 340.0 / 1000;  // Default to 1000 Hz
            }
        }
        #endregion
    }
}