# SNA Angle Analyzer - Project TODO

## Phase 1: Projektinitialisierung und Architektur
- [x] Projekt mit webdev_init_project initialisieren
- [x] Datenbank-Schema für Messhistorie definieren
- [x] Abhängigkeiten für Computer Vision installieren (MediaPipe)
- [x] Projektstruktur und Komponentenarchitektur planen

## Phase 2: Computer-Vision-Modell
- [x] MediaPipe Face Detector integrieren
- [x] Landmarken-Erkennung für S (Sella), N (Nasion), A (Subspinale) implementieren
- [x] Automatische Landmark-Detektion testen und kalibrieren

## Phase 3: Canvas-Editor und Landmarken-Korrektur
- [x] Bild-Upload-Interface mit Drag-and-Drop implementieren
- [x] Canvas-Komponente für Bildanzeige und Landmarken-Bearbeitung
- [x] Interaktive Landmarken-Platzierung (verschiebbare Punkte)
- [x] Zoom- und Pan-Funktionen für präzise Anpassung
- [x] Manuelle Landmarken-Korrektur-UI

## Phase 4: Winkelberechnung und Visualisierung
- [x] Vektormathe für Winkelberechnung (SN und NA Linien)
- [x] Echtzeit-Winkelberechnung implementieren
- [x] Visuelle Überlagerung: farbcodierte Punkte, Linien, Winkelbogen
- [x] Medizinische Einordnung: retrognath (<80°), normal (80-84°), prognath (>84°)
- [x] Klassifikations-UI mit Farbcodierung

## Phase 5: Export und Messhistorie
- [x] PDF-Export für annotierte Bilder und Messergebnisse
- [x] Bild-Export (PNG mit Annotationen)
- [x] Messhistorie-Datenbank-Schema
- [x] Messhistorie-Speicherung für eingeloggte Benutzer
- [x] Messhistorie-Anzeige mit Datum

## Phase 6: Testing und Optimierung
- [x] Unit-Tests für Winkelberechnung (Vitest) - 19 Tests bestanden
- [ ] Integration-Tests für Canvas-Interaktionen
- [ ] Performance-Optimierung für große Bilder
- [ ] Browser-Kompatibilität testen
- [x] DSGVO-Konformität überprüfen (keine Server-Uploads)

## Phase 7: Deployment
- [ ] Finale UI-Überprüfung und Polishing
- [ ] Responsive Design testen (Mobile, Tablet, Desktop)
- [ ] Checkpoint erstellen und Deployment vorbereiten

## Abgeschlossene Implementierungen
- [x] Datenbankschema mit Measurements-Tabelle
- [x] tRPC-Routen für Messungen (list, create, delete)
- [x] Winkelberechnungs-Utility-Funktionen
- [x] MediaPipe Face Mesh Integration
- [x] Canvas-Editor-Komponente mit Zoom/Pan
- [x] Image-Upload-Komponente mit Drag-and-Drop
- [x] Result-Display-Komponente mit Export
- [x] Measurement-History-Komponente
- [x] Hauptseite mit Tab-Navigation
- [x] Unit-Tests für Winkelberechnung


## Fehlerbehebenungen (Priorität: Hoch)
- [x] MediaPipe FilesetResolver.forVisionOnWeb API-Fehler beheben
- [x] FaceDetector Initialisierung korrigieren
- [x] Fehlerbehandlung für fehlende MediaPipe-Unterstützung
- [x] Fallback-Mechanismus für automatische Landmarken-Erkennung
- [x] Manueller Modus als Standard implementieren
- [x] Benutzer-Anleitung für Landmarken-Platzierung hinzugefügt
- [x] Alle Tests bestanden (19/19)


## Automatische Landmarken-Erkennung (MediaPipe Face Mesh)
- [x] MediaPipe Face Mesh Modell integrieren
- [x] Landmarken-Mapping für S, N, A implementieren
- [x] Automatische Erkennung in Home-Komponente aktivieren
- [x] Fehlerbehandlung und Fallback
- [x] Unit-Tests für Face Mesh-Integration (7 Tests bestanden)
