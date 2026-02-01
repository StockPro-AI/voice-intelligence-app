# Voice Intelligence Desktop App - TODO

## Phase 1: Projektarchitektur & Setup
- [x] Tauri-Integration in Next.js Setup durchführen
- [x] Tauri-Konfiguration (tauri.conf.json) für Desktop-App
- [x] Rust-Backend für Tauri Commands vorbereiten
- [x] Build-Pipeline für Desktop-App konfigurieren

## Phase 2: Audio-Recording & Transkription
- [x] Web Audio API Integration für Audio-Aufnahme
- [x] Audio-Buffer Management und WAV-Konvertierung
- [x] Whisper API Integration im Backend
- [x] Transkriptions-Pipeline mit Error-Handling
- [x] Audio-Upload zu S3 vor Transkription

## Phase 3: LLM-Integration & Enrichment
- [x] LLM-Enrichment-Strategien definieren (Formatierung, Zusammenfassung, Strukturierung)
- [x] Prompt-Engineering für verschiedene Enrichment-Modi
- [x] Streaming-Response-Handling für LLM
- [x] Enrichment-Cache zur Performance-Optimierung

## Phase 4: Hotkey & Desktop-Integration
- [x] Tauri Global Hotkey Plugin Integration
- [x] Hotkey-Listener für Alt+Shift+V (oder konfigurierbar)
- [ ] Window-Management (Show/Hide, Always-on-Top)
- [ ] System-Tray Integration für Background-Betrieb
- [x] Keyboard-Shortcuts für Recording-Kontrolle

## Phase 5: UI/UX Design & Frontend
- [x] Elegantes Design-System mit Tailwind CSS 4
- [x] Recording-Interface mit visuellen Feedback
- [x] Transkriptions-Anzeige mit Live-Updates
- [x] Enrichment-Ergebnis-Anzeige
- [x] Responsive Layout für Desktop
- [x] Dark-Mode Theme (elegant & perfekt)
- [x] Animationen & Micro-Interactions

## Phase 6: Export & Ergebnis-Verwaltung
- [x] Copy-to-Clipboard Funktionalität
- [x] Export als Markdown/TXT/PDF
- [x] Verlauf/History der Aufnahmen speichern
- [ ] Favoriten-System für häufig verwendete Enrichment-Modi
- [x] Einstellungen-Panel (Hotkey-Konfiguration, Sprache, etc.)

## Phase 7: Testing & Dokumentation
- [x] Vitest Unit-Tests für Backend-Logik
- [x] Integration-Tests für Transkriptions-Pipeline
- [x] README mit Architektur-Überblick
- [x] Setup-Anleitung für Entwicklung & Distribution
- [x] Design-Entscheidungen dokumentieren
- [x] API-Dokumentation für Tauri Commands

## Phase 8: Finalisierung & Deployment
- [x] Performance-Optimierung (Enrichment-Cache)
- [x] Error-Handling & Logging (Centralized Error Handler)
- [ ] Build für macOS/Windows/Linux
- [ ] Installer-Erstellung
- [ ] GitHub Release vorbereiten

---

## Architektur-Überblick

```
Frontend (React/Next.js)
├── Recording UI (Audio Input)
├── Transcription Display
├── Enrichment Results
└── Settings & History

↓ (tRPC + Tauri Commands)

Backend (Express + Tauri)
├── Audio Processing (WAV Conversion)
├── Whisper API Integration
├── LLM Enrichment Pipeline
└── System Integration (Hotkeys, Tray)

↓ (External APIs)

External Services
├── Whisper API (Speech-to-Text)
├── LLM API (Claude/GPT for Enrichment)
└── S3 Storage (Audio Files)
```

## Design-Entscheidungen

- **Framework**: Tauri + Next.js (Desktop + Modern UI)
- **Audio**: Web Audio API (Browser-native)
- **Speech-to-Text**: Whisper API (Accuracy & Reliability)
- **LLM**: Manus Built-in LLM (Integration ready)
- **Styling**: Tailwind CSS 4 + shadcn/ui (Elegant & Professional)
- **State Management**: React Query + tRPC (Type-safe)
- **Desktop Integration**: Tauri Global Hotkeys + System Tray


## Phase 9: Settings-Panel Entwicklung
- [x] Datenbankschema für Benutzer-Einstellungen erweitern
- [x] Backend-Procedures für Settings-Verwaltung (Get/Update)
- [x] Hotkey-Validierung und Konflikt-Erkennung
- [x] Settings-UI-Komponente mit eleganter Gestaltung
- [x] Hotkey-Recorder/Editor-Interface
- [x] Sprach-Auswahl mit Vorschau
- [x] Settings in App-Navigation integrieren
- [x] Persistierung von Settings in Datenbank
- [ ] Real-time Hotkey-Update ohne Neustart
- [x] Unit-Tests für Settings-Router


## Phase 10: Dark Mode & Internationalisierung (i18n)
- [x] i18n Setup mit react-i18next
- [x] Übersetzungsdateien für Deutsch und Englisch
- [x] Theme-Switcher Komponente
- [x] Dark Mode CSS und Tailwind-Integration
- [x] Sprach-Umschalter in Settings
- [x] Alle UI-Komponenten mit i18n aktualisieren
- [x] Persistierung von Theme und Sprache
- [x] Dark Mode als Standard
- [x] Deutsch als Standard-Sprache


## Phase 11: Export-Funktionen für Notizen
- [x] Export-Utility Funktionen (Markdown, Clipboard)
- [x] Export-Komponente mit eleganter UI
- [x] Zwischenablage-Kopieren mit Toast-Feedback
- [x] Markdown-Download-Funktionalität
- [x] Export-Buttons in VoiceRecorder integrieren
- [x] i18n für Export-Texte
- [x] Metadaten in Export (Datum, Sprache, Modus)
- [x] Dateiname-Generierung mit Zeitstempel


## Phase 12: Recording-History & Verlaufsliste
- [x] Datenbankschema für Recording-History erweitern
- [x] Backend-Procedures für History-Verwaltung (Create, Read, Update, Delete)
- [x] History-Speicherung nach jeder Aufnahme
- [x] History-UI-Komponente mit Tabelle/Liste
- [x] Suchfunktion für Transkripte
- [x] Filter nach Datum, Sprache, Enrichment-Modus
- [x] Favoriten-Markierung für Aufnahmen
- [x] Löschen einzelner oder mehrerer Einträge
- [x] Export von History-Einträgen
- [x] i18n für History-Texte
- [x] Pagination für große History-Listen
- [x] Unit-Tests für History-Router


## Bug Fixes
- [x] Audio-File-Download-Fehler in Transkriptions-Pipeline beheben
- [x] Fehlerbehandlung für fehlgeschlagene Audio-Downloads verbessern
- [x] Detailliertes Logging für Debugging hinzufügen
- [x] Neue transcribeAudioDirect Procedure für direkten Base64-Upload


## Phase 13: Frontend-Integration von transcribeAudioDirect
- [x] VoiceRecorder mit transcribeAudioDirect aktualisieren
- [x] Fallback-Logik (Direct → URL-basiert) implementieren
- [x] Error-Handling und Retry-Logik verbessern
- [x] Logging für Debugging hinzufügen
- [x] Auto-Speicherung in Recording-History
- [ ] Testing durchführen


## Phase 14: Zusätzliche Features & Optimierungen
- [x] Keyboard-Shortcuts Hook (useKeyboardShortcuts) für In-App Navigation
- [x] PDF-Export Utility mit HTML-zu-PDF Konvertierung
- [x] Pagination Hook und Komponente für History-Listen
- [x] Enrichment-Cache Service mit TTL und Cleanup
- [x] Vitest Unit-Tests für Enrichment-Cache
- [x] Integration-Tests für Transkriptions-Pipeline
- [x] Centralized Error Handler mit Retry-Logik
- [x] Logging Utilities (logError, logInfo, logWarn, logDebug)


## Phase 15: System-Tray Integration
- [x] Tauri System-Tray Plugin konfigurieren
- [x] Tray-Icon mit App-Logo erstellen
- [x] Tauri Commands für Tray-Verwaltung (show, hide, minimize, quit)
- [x] Tray-Menü mit Quick-Access-Optionen
- [x] Window-Management für Show/Hide/Minimize
- [x] Hotkey-Integration mit Tray
- [x] Frontend-Integration mit Tray-Events
- [x] Hintergrundbetrieb ermöglichen (minimize to tray)
- [x] Tray-Icon-Kontextmenü mit Aktionen
- [x] Benachrichtigungen vom Tray
- [x] i18n für Tray-Texte (Deutsch/Englisch)


## Phase 16: Seitenleiste & Navigation
- [x] Seitenleisten-Komponente mit Toggle-Button
- [x] Responsive Seitenleisten-Layout
- [x] Navigation Items in Seitenleiste
- [x] Seitenleisten-State Management
- [x] Smooth Animations für Toggle

## Phase 17: Desktop-Benachrichtigungen
- [x] Tauri Notification Plugin Integration
- [x] Benachrichtigungen für Transkriptions-Abschluss
- [x] Benachrichtigungen für Enrichment-Abschluss
- [x] Benachrichtigungen auch bei minimierter App
- [x] Notification-Sounds optional
- [x] Notification-Click Handler

## Phase 18: API-Manager
- [x] API-Manager Komponente mit eleganter UI
- [x] API-Key Input und Validierung
- [x] Verbindungs-Test Funktionalität
- [x] KI-Modell-Erkennung und Listing
- [x] Modell-Auswahl und Speicherung
- [x] Fehlerbehandlung und Feedback
- [x] Backend-Procedures für API-Verwaltung
- [x] Verschlüsselte API-Key Speicherung
- [x] i18n für API-Manager Texte


## Phase 19: API-Provider Erweiterung
- [x] LMStudio Integration (lokale Modelle)
- [x] Ollama Integration (lokale Modelle)
- [x] OpenRouter API Integration
- [x] API-Manager für lokale Modelle erweitern
- [x] Konfigurierbare Endpoints für lokale Services
- [x] Modell-Erkennung für lokale Anbieter
- [x] Fallback-Logik zwischen Anbietern

## Phase 20: Error-Handling Optimierung
- [ ] Umfassendes Error-Handling in allen Procedures
- [ ] Fehlerprävention durch Validierung
- [ ] Aussagekräftige Fehlermeldungen
- [ ] Error-Logging und Monitoring
- [ ] Graceful Degradation
- [ ] User-freundliche Error-UI

## Phase 21: Code-Audit & Optimierung
- [ ] Sicherheits-Audit (XSS, CSRF, Injection)
- [ ] Best-Practices Review
- [ ] Performance-Optimierung
- [ ] Redundanzen entfernen
- [ ] Stabilitätsrisiken beheben
- [ ] Type-Safety überprüfen
- [ ] Memory Leaks prüfen
