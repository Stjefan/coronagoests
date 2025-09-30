# CoronaPlus2 Benutzerhandbuch

## Inhaltsverzeichnis

1. [Einführung](#einführung)
2. [Erste Schritte](#erste-schritte)
3. [Hauptfunktionen](#hauptfunktionen)
4. [Projektmanagement](#projektmanagement)
5. [Kartenansicht](#kartenansicht)
6. [Trassenbearbeitung](#trassenbearbeitung)
7. [Maste und Verbindungen](#maste-und-verbindungen)
8. [Immissionsberechnung](#immissionsberechnung)
9. [Referenzpunkte](#referenzpunkte)
10. [Datenexport und -import](#datenexport-und--import)
11. [Tastenkürzel](#tastenkürzel)
12. [Fehlerbehebung](#fehlerbehebung)

## Einführung

CoronaPlus2 ist eine spezialisierte Anwendung zur Planung und Berechnung von Hochspannungsleitungen und deren Immissionsauswirkungen. Das Programm unterstützt Sie bei der:

- Visualisierung von Stromtrassen auf Lageplänen
- Positionierung und Konfiguration von Masten
- Erstellung von Immissionsberichten
- Export von Projektdaten für weitere Analysen

## Erste Schritte

### Systemvoraussetzungen

- Moderner Webbrowser (Chrome, Firefox, Edge empfohlen)
- Mindestens 4GB RAM
- Bildschirmauflösung mindestens 1280x720 Pixel

### Programmstart

1. Öffnen Sie die Anwendung im Browser
2. Das Hauptfenster zeigt die Kartenansicht mit der Menüleiste oben
3. Beim ersten Start ist ein leeres Projekt geladen

### Neues Projekt erstellen

1. Klicken Sie auf **Datei** → **Neues Projekt**
2. Geben Sie einen Projektnamen ein
3. Bestätigen Sie mit **OK**

## Hauptfunktionen

### Die Benutzeroberfläche

Die Anwendung besteht aus mehreren Hauptbereichen:

- **Menüleiste**: Zugriff auf alle Hauptfunktionen
- **Kartenansicht**: Zentrale Arbeitsfläche für die Trassenplanung
- **Kontextmenüs**: Rechtsklick für elementspezifische Optionen
- **Dialoge**: Detaillierte Konfiguration von Elementen

## Projektmanagement

### Projekt speichern

1. **Datei** → **Projekt speichern**
2. Die Projektdatei wird als ZIP-Archiv heruntergeladen
3. Enthält alle Projektdaten inkl. Bilder und Konfigurationen

### Projekt laden

1. **Datei** → **Projekt öffnen**
2. Wählen Sie eine zuvor gespeicherte ZIP-Datei
3. Das Projekt wird mit allen Einstellungen wiederhergestellt

### Lageplan importieren

1. **Datei** → **Lageplan importieren**
2. Unterstützte Formate: JPG, PNG, GIF
3. Das Bild dient als Hintergrund für die Trassenplanung

## Kartenansicht

### Navigation

- **Zoomen**: Mausrad oder +/- Tasten
- **Verschieben**: Linke Maustaste gedrückt halten und ziehen
- **Elemente auswählen**: Einfacher Linksklick
- **Kontextmenü**: Rechtsklick auf Elemente

### Ebenen verwalten

Über **Ansicht** → **Kartenebenen** können Sie verschiedene Ebenen ein-/ausblenden:

- **Trassen**: Stromleitungen zwischen Masten
- **DGM**: Digitales Geländemodell
- **Höhenlinien**: Konturlinien des Geländes
- **Immissionspunkte**: Berechnete Feldstärken

## Trassenbearbeitung

### Neue Trasse anlegen

1. **Bearbeiten** → **Trassen verwalten**
2. Klicken Sie auf **Neue Trasse**
3. Geben Sie einen Namen ein
4. Wählen Sie eine Mastvorlage

### Trassen-Eigenschaften

Jede Trasse besitzt folgende konfigurierbare Eigenschaften:

- **Name**: Bezeichnung der Trasse
- **Mastvorlage**: Definiert die Struktur der Maste
- **Farbe**: Visuelle Darstellung in der Karte

### Maste hinzufügen

1. Wählen Sie eine Trasse aus
2. Rechtsklick auf die Karte → **Mast hinzufügen**
3. Der Mast wird an der Klickposition eingefügt
4. Automatische Verbindung zum vorherigen Mast

## Maste und Verbindungen

### Mast bearbeiten

1. Doppelklick auf einen Mast öffnet den Bearbeitungsdialog
2. Konfigurierbare Parameter:
   - **Name**: Mastbezeichnung
   - **Höhe**: Gesamthöhe des Mastes
   - **Position**: Koordinaten (automatisch oder manuell)
   - **Ausrichtung**: Drehung des Mastes

### Ebenen und Anschlüsse

Jeder Mast kann mehrere Ebenen haben:

- **Ebene**: Höhe über Grund
- **Anschlüsse links/rechts**: Anzahl der Leiterseile
- **Horizontaler Abstand**: Ausladung der Traversen
- **Isolatorlänge**: Länge der Isolatoren

### Verbindungen konfigurieren

1. Wählen Sie einen Anschluss aus
2. Konfigurieren Sie:
   - **Leitungstyp**: Art des Leiterseils
   - **Durchhang**: Maximaler Durchhang der Leitung
   - **Spannung**: Betriebsspannung in kV
   - **AC/DC**: Stromart


### Berechnungsgitter erstellen

1. **Berechnung** → **Immissionsgitter**
2. Definieren Sie den Berechnungsbereich:
   - **Startpunkt**: Linke untere Ecke des Untersuchungsgebiets
   - **Breite/Höhe**: Größe des zu berechnenden Bereichs
   - **Auflösung**: Abstand der Messpunkte (typisch 1-10m)
   
#### Auflösung wählen
- **Grob (10-20m)**: Übersichtsberechnungen
- **Mittel (5-10m)**: Standardanalysen
- **Fein (1-5m)**: Detailuntersuchungen
- **Sehr fein (<1m)**: Kritische Bereiche

### Berechnung starten

1. **Berechnung** → **Immissionen berechnen**
2. Wählen Sie Berechnungsparameter:
   - **Mit Frequenz**: Ein/Aus für frequenzabhängige Berechnung
   - **KT-Wert**: Kopplungsfaktor einstellen
   - **Berechnungshöhe**: Standard 1m über Grund
3. Die Berechnung kann je nach Größe und Auflösung einige Minuten dauern

#### Berechnungsoptionen
- **Worst-Case**: Maximale Auslastung aller Leitungen
- **Normalbetrieb**: Typische Betriebsbedingungen
- **Minimallast**: Geringste Belastung

### Ergebnisse interpretieren

#### Farbcodierung
Die Feldstärken werden nach folgendem Schema dargestellt:
- **Blau**: Sehr geringe Werte (<10% Grenzwert)
- **Grün**: Geringe Werte (10-25% Grenzwert)
- **Gelb**: Mittlere Werte (25-50% Grenzwert)
- **Orange**: Erhöhte Werte (50-80% Grenzwert)
- **Rot**: Hohe Werte (80-100% Grenzwert)
- **Violett**: Grenzwertüberschreitung (>100% Grenzwert)

#### Isolinien
- Linien gleicher Feldstärke
- Ähnlich wie Höhenlinien auf topografischen Karten
- Dichter Verlauf = starker Gradient

#### Hotspots identifizieren
Achten Sie besonders auf:
- Bereiche unter den Leitungen (maximale Durchhangstelle)
- Mastnähe (Leiterannäherung an den Boden)
- Kreuzungspunkte mehrerer Leitungen
- Wohngebiete und sensible Bereiche

### Validierung der Ergebnisse

#### Plausibilitätsprüfung
- Vergleich mit Referenzwerten ähnlicher Anlagen
- Symmetrie bei symmetrischen Anordnungen
- Abnahme mit der Entfernung (1/r² für E-Feld, 1/r für B-Feld)

#### Messvergleich
- Export der Berechnungspunkte für Messpunktvergleich
- Typische Abweichung: ±10-20% bei korrekter Modellierung
- Ursachen für Abweichungen:
  - Bodenbeschaffenheit
  - Vegetation
  - Gebäude und metallische Strukturen
  - Tatsächliche vs. angenommene Strombelastung

## Referenzpunkte

### Koordinatensystem kalibrieren

1. **Extras** → **Referenzpunkte**
2. Fügen Sie mindestens 3 Referenzpunkte hinzu:
   - Klicken Sie auf bekannte Positionen im Plan
   - Geben Sie die realen Koordinaten ein
3. **Transformation berechnen** erstellt die Umrechnung

### Helmert-Transformation

Die Software verwendet eine Helmert-Transformation für:
- Umrechnung zwischen Pixel- und Realkoordinaten
- Georeferenzierung des Lageplans
- Präzise Positionierung der Elemente

## Datenexport und -import

### Projektexport

**Datei** → **Projekt exportieren** erstellt eine ZIP-Datei mit:
- Projekteinstellungen (JSON)
- Lageplan-Bild
- Mastdaten
- Berechnungsergebnisse

### Legacy-Import

**Datei** → **Legacy-Projekt importieren** für ältere Projekte:
- Unterstützt Corona+ Altformat
- Automatische Konvertierung der Datenstrukturen
- Prüfung auf Kompatibilität

### CSV-Export

Berechnungsergebnisse können als CSV exportiert werden:
1. Nach erfolgreicher Berechnung
2. **Export** → **Ergebnisse als CSV**
3. Für Weiterverarbeitung in Excel/anderen Programmen

## Tastenkürzel

| Tastenkombination | Funktion |
|-------------------|----------|
| Strg + N | Neues Projekt |
| Strg + O | Projekt öffnen |
| Strg + S | Projekt speichern |
| Strg + Z | Rückgängig |
| Strg + Y | Wiederherstellen |
| Entf | Ausgewähltes Element löschen |
| ESC | Dialog/Aktion abbrechen |
| + / - | Zoom erhöhen/verringern |
| Leertaste + Ziehen | Karte verschieben |

## Fehlerbehebung

### Häufige Probleme

#### Berechnung startet nicht
- Prüfen Sie, ob alle Maste korrekt verbunden sind
- Stellen Sie sicher, dass Leitungsdaten vollständig sind
- Kontrollieren Sie die Referenzpunkte

#### Darstellungsfehler
- Browser-Cache leeren (Strg + F5)
- Zoom zurücksetzen
- Fenster neu laden

#### Import schlägt fehl
- Überprüfen Sie das Dateiformat
- Stellen Sie sicher, dass die ZIP-Datei nicht beschädigt ist
- Bei Legacy-Import: Prüfen Sie die Quelldatei-Struktur

### Fehlermeldungen

| Meldung | Bedeutung | Lösung |
|---------|-----------|---------|
| "Ungültige Koordinaten" | Referenzpunkte fehlerhaft | Referenzpunkte neu setzen |
| "Berechnung fehlgeschlagen" | Fehler in Mastdaten | Mastverbindungen prüfen |
| "Datei nicht lesbar" | Beschädigte Importdatei | Datei erneut exportieren |

### Support

Bei weiteren Fragen oder Problemen:
- Überprüfen Sie die Projekteinstellungen
- Exportieren Sie das Projekt zur Fehleranalyse
- Dokumentieren Sie die Schritte, die zum Problem führten

## Tipps und Best Practices

### Effizientes Arbeiten

1. **Vorlagen nutzen**: Erstellen Sie Mastvorlagen für wiederkehrende Konfigurationen
2. **Regelmäßig speichern**: Exportieren Sie Ihr Projekt in regelmäßigen Abständen
3. **Sinnvolle Benennung**: Verwenden Sie eindeutige Namen für Maste und Trassen
4. **Gruppierung**: Organisieren Sie zusammengehörige Trassen

### Qualitätssicherung

- Überprüfen Sie Mastabstände auf Plausibilität
- Kontrollieren Sie Durchhangwerte
- Validieren Sie Berechnungsergebnisse mit Referenzwerten
- Dokumentieren Sie Änderungen im Projektverlauf

### Performance-Optimierung

- Bei großen Projekten: Nicht benötigte Ebenen ausblenden
- Berechnungsgitter nur so fein wie nötig wählen
- Regelmäßig Browser-Cache leeren
- Moderne Browser-Version verwenden

---

*Version 2.0 - Stand: 2025*