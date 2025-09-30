# Druckfunktionalität - Benutzeranleitung

## Überblick
Die CoronaGoests-Anwendung bietet eine umfassende Druckfunktion, mit der Sie Ihre Lagepläne und Immissionskarten professionell ausdrucken können.

## Zugriff auf die Druckfunktion

### Druckschaltfläche
- **Position**: Oben links in der Kartenansicht
- **Symbol**: Drucker-Icon 🖨️
- **Sichtbarkeit**: Die Schaltfläche erscheint automatisch, sobald ein Lageplan geladen ist

## Druckdialog-Optionen

### 1. Überschrift
- **Standardwert**: "Lageplan Karte"
- **Anpassung**: Sie können eine eigene Überschrift eingeben
- **Verwendung**: Erscheint als Haupttitel im Ausdruck

### 2. Zusätzlicher Text
- **Optional**: Fügen Sie beschreibende Informationen hinzu
- **Mehrzeilig**: Unterstützt mehrere Zeilen Text
- **Verwendung**: Für Projektbeschreibungen, Notizen oder Erläuterungen

### 3. Ausrichtung
- **Querformat** (Standard): Optimal für breite Kartenansichten
- **Hochformat**: Geeignet für vertikale Kartenausschnitte

## Was wird gedruckt?

### Enthaltene Elemente
✅ **Karteninhalt**
- Lageplan-Hintergrundbild
- Alle sichtbaren Marker (Höhenpunkte, Immissionspunkte, ESQ, Masten)
- Verbindungslinien und Trassen
- Immissions-Konturplots (wenn aktiviert)

✅ **Legenden**
- Kontur-Legende (bei aktiviertem Immissionsgrid)
- Farbskala mit Wertebereich
- Automatische Beschriftung des Anzeigemodus:
  - "Immissions-Konturplot: Gesamt"
  - "Immissions-Konturplot: ESQ-Quellen"
  - "Immissions-Konturplot: Übertragungsleitungen"

✅ **Formatierung**
- Überschrift
- Zusatztext (wenn angegeben)
- Aktuelle Kartenansicht und Zoomstufe

### Ausgeschlossene Elemente
❌ **Steuerelemente**
- Zoom-Schaltflächen
- Navigation
- Marker-Auswahl-Toolbar
- Andere UI-Elemente mit der Klasse `print-hide`

## Schritt-für-Schritt-Anleitung

### Vorbereitung
1. **Kartenansicht anpassen**
   - Zoomen Sie auf den gewünschten Kartenbereich
   - Aktivieren/Deaktivieren Sie die gewünschten Marker-Typen über die Checkboxen
   - Schalten Sie ggf. das Immissionsgrid ein/aus

2. **Immissionsdarstellung wählen** (falls zutreffend)
   - Wählen Sie den Anzeigemodus (Gesamt/ESQ/Trassen)
   - Passen Sie die Legendeneinstellungen an
   - Stellen Sie die gewünschte Transparenz ein

### Druckvorgang
1. **Druckdialog öffnen**
   - Klicken Sie auf die Drucker-Schaltfläche (oben links)

2. **Einstellungen vornehmen**
   - Geben Sie eine aussagekräftige Überschrift ein
   - Fügen Sie optional zusätzlichen Text hinzu
   - Wählen Sie die Ausrichtung (Quer-/Hochformat)

3. **Drucken starten**
   - Klicken Sie auf "Drucken"
   - Die App erstellt eine hochauflösende Bildaufnahme
   - Ein neues Browserfenster öffnet sich mit der Druckvorschau

4. **Druckoptionen im Browser**
   - Das Druckdialog des Browsers öffnet sich automatisch
   - **Wichtig**: Aktivieren Sie "Hintergrundgrafiken drucken"
   - Wählen Sie Ihren Drucker oder "Als PDF speichern"
   - Bestätigen Sie mit "Drucken"

## Technische Details

### Bildqualität
- **Auflösung**: Hochauflösende PNG-Erfassung (Qualität 1.0)
- **Hintergrund**: Weißer Hintergrund für optimale Druckqualität
- **Farbgenauigkeit**: CSS-Eigenschaft `print-color-adjust: exact` gewährleistet korrekte Farben

### Unterstützte Browser
- ✅ Chrome/Edge (empfohlen)
- ✅ Firefox
- ✅ Safari
- ⚠️ Ältere Browser: Popup-Blocker deaktivieren

### Styling-Klassen
- `.print-hide`: Elemente mit dieser Klasse werden beim Druck ausgeblendet
- `.contour-legend-container`: Kontur-Legende wird immer mitgedruckt
- `.immission-legend-container`: Immissions-Legende wird immer mitgedruckt

## Tipps für optimale Ergebnisse

### Vor dem Druck
1. **Browsereinstellungen prüfen**
   - Popups für die Anwendung erlauben
   - JavaScript aktiviert lassen

2. **Kartenoptimierung**
   - Wählen Sie einen aussagekräftigen Kartenausschnitt
   - Deaktivieren Sie nicht benötigte Marker für Übersichtlichkeit
   - Prüfen Sie die Lesbarkeit der Legenden

3. **Immissionsgrid-Einstellungen**
   - Passen Sie die Transparenz für optimale Sichtbarkeit an
   - Wählen Sie passende Legendenwerte (Auto/Manuell)
   - Stellen Sie sicher, dass die Farbskala gut lesbar ist

### Druckereinstellungen
1. **Papierformat**: A4 oder A3 für beste Ergebnisse
2. **Farbdruck**: Für Immissionskarten erforderlich
3. **Qualität**: "Hoch" oder "Beste" für klare Darstellung
4. **Skalierung**: "An Seite anpassen" für vollständige Ansicht

## Fehlerbehebung

### Problem: Druckfenster öffnet sich nicht
**Lösung**: 
- Popup-Blocker deaktivieren
- Browser-Einstellungen → Popups für diese Seite erlauben

### Problem: Legenden werden nicht gedruckt
**Lösung**:
- "Hintergrundgrafiken drucken" im Druckdialog aktivieren
- Browser-Druckeinstellungen prüfen

### Problem: Schlechte Druckqualität
**Lösung**:
- Höhere Druckqualität in den Druckereinstellungen wählen
- Vor dem Druck hineinzoomen für mehr Details
- Als PDF speichern und dann drucken für beste Qualität

### Problem: Farben werden nicht korrekt gedruckt
**Lösung**:
- Farbdruck in den Druckereinstellungen aktivieren
- "Hintergrundgrafiken" muss aktiviert sein
- Druckertreiber aktualisieren

## Export-Alternativen

### Als PDF speichern
1. Im Druckdialog "Als PDF speichern" wählen
2. Speicherort auswählen
3. PDF kann später gedruckt oder geteilt werden

### Screenshot-Alternative
Für schnelle Aufnahmen ohne Druckdialog:
1. Browser-Screenshot-Funktion nutzen
2. Windows: Win + Shift + S
3. Mac: Cmd + Shift + 4

## Hinweise zur Barrierefreiheit
- Die Druckfunktion unterstützt Screenreader
- Alle Dialogfelder sind per Tastatur navigierbar
- Tab-Taste für Navigation zwischen Feldern
- Enter-Taste zum Bestätigen

## Datenschutz
- Alle Druckvorgänge erfolgen lokal im Browser
- Keine Daten werden an externe Server gesendet
- Die generierten Bilder werden nur temporär im Browser-Speicher gehalten