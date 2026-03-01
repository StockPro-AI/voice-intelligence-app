# Voice Intelligence Assistant

Eine elegante Desktop-Anwendung, die Spracheingaben aufnimmt, transkribiert und durch KI-gestützte Verarbeitung intelligent anreichert. Mit intelligenter Notiz-Orchestrierung, automatischer Task-Extraction und wöchentlicher Analyse.

## Problem & Motivation

In modernen Workflows entsteht häufig die Herausforderung, schnell Gedanken zu erfassen, strukturiert festzuhalten und automatisch in verwertbare Tasks und Projekte umzuwandeln. Voice Intelligence löst diesen Use-Case durch:

1. **Schnelle Erfassung**: Globale Hotkey-Aktivierung (Alt+Shift+V) ermöglicht sofortige Sprachaufnahme ohne Kontextwechsel
2. **Intelligente Verarbeitung**: Automatische Transkription, KI-basierte Anreicherung und strukturierte Notiz-Speicherung
3. **Automatische Kategorisierung**: KI extrahiert automatisch Tasks, Projektideen und strukturiert Notizen
4. **Wöchentliche Analyse**: Intelligente Wochenanalyse mit Produktivitätstrends und proaktiven Projektvorschlägen
5. **Offline-Unterstützung**: Fallback zu lokalen Modellen (Ollama/LMStudio) bei API-Ausfällen

## Architektur-Überblick

```
┌─────────────────────────────────────────────────────────────────┐
│                     Voice Intelligence Desktop                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Frontend (React 19 + Tailwind CSS 4)                           │
│  ├── Voice Recorder Component (Web Audio API)                   │
│  ├── Transcription Display                                      │
│  ├── Orchestration Dashboard (Notes, Tasks, Projects)           │
│  ├── Analytics & Weekly Insights                                │
│  └── Settings & History                                         │
│                                                                   │
│  ↓ (tRPC Type-Safe RPC)                                         │
│                                                                   │
│  Backend (Express + Tauri + Node.js)                            │
│  ├── Audio Upload (S3 Storage)                                  │
│  ├── Whisper API Integration                                    │
│  ├── LLM Enrichment & Categorization Pipeline                   │
│  ├── Orchestration Engine (Notes → Tasks/Projects)              │
│  ├── Scheduler (Automatic Categorization & Deep Analysis)       │
│  ├── Analytics Engine (Weekly Insights & Trends)                │
│  └── Tauri Commands (Hotkeys, System Integration)               │
│                                                                   │
│  ↓ (External APIs)                                              │
│                                                                   │
│  External Services                                              │
│  ├── Whisper API (OpenAI Speech-to-Text)                        │
│  ├── LLM API (Claude/GPT for Enrichment & Categorization)       │
│  ├── S3 Storage (Audio & File Persistence)                      │
│  ├── Ollama/LMStudio (Offline Fallback)                         │
│  └── System Hotkeys (Tauri Global Shortcut)                     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Technologie-Stack

| Bereich | Technologie | Grund |
|---------|-------------|-------|
| **Desktop Runtime** | Tauri 2.x | Leichtgewichtig, Rust-basiert, Cross-Platform |
| **Frontend Framework** | React 19 + TypeScript | Modern, Type-Safe, Component-basiert |
| **Styling** | Tailwind CSS 4 + shadcn/ui | Elegant, Responsive, Accessible |
| **Backend** | Express + tRPC | Type-Safe RPC, Minimal Boilerplate |
| **Database** | MySQL/TiDB | Persistent Storage für History, Notes, Tasks, Projects |
| **Speech-to-Text** | Whisper API | Hochgenaue Transkription |
| **LLM Integration** | Manus Built-in LLM | Enrichment, Categorization, Analysis |
| **File Storage** | S3 (AWS) | Audio-Datei Persistierung |
| **State Management** | React Query + tRPC | Optimistic Updates, Caching |
| **Offline Support** | Ollama/LMStudio | Fallback zu lokalen Modellen |

## Voice-Processing Pipeline

```
Audio Input (Web Audio API)
    ↓
WAV/WebM Encoding
    ↓
S3 Upload
    ↓
Whisper API Transcription
    ↓
Transcription Text → Note Storage
    ↓
Automatic Categorization (KI)
    ├── Task Extraction
    ├── Project Idea Generation
    └── Confidence Scoring
    ↓
Extracted Tasks & Projects
    ↓
Weekly Deep Analysis
    ├── Trend Detection
    ├── Pattern Recognition
    └── Actionable Insights
    ↓
Display & Export (Dashboard, Clipboard, File, History)
```

## Core Features

### 1. **Intelligente Notiz-Orchestrierung**
- Strukturierte Notiz-Speicherung mit Status-Tracking (unprocessed, processing, processed, review)
- Automatische Kategorisierung in Notizen, Aufgaben und Projekte
- Confidence-Scoring für KI-Extraktion
- Benutzer-Feedback für KI-Verbesserung

### 2. **Task-Management**
- Automatische Task-Extraction aus Transkriptionen
- Priorisierung (low, medium, high, critical)
- Status-Tracking (todo, in_progress, done, cancelled)
- Fälligkeitsdaten und Tags
- Magic Sort für intelligente Priorisierung

### 3. **Projekt-Ideen-Generator**
- Automatische Projektideen-Generierung aus Notizen
- Effort-Level und Potential-Impact Rating
- Status-Management (idea, planning, active, paused, completed)
- Skill-Requirements und Zeitleisten

### 4. **Wochenanalyse & Insights**
- Automatische wöchentliche Analyse aller Notizen
- Top-Themes Erkennung
- Produktivitäts-Trends über 4 Wochen
- Intelligente Projektvorschläge mit Priorisierung
- Actionable Recommendations

### 5. **Offline-Mode & Fallback-Mechanismen**
- Automatische API-Availability Checking
- Graceful Degradation zu lokalen Modellen
- Lokales Caching mit IndexedDB
- Automatische Synchronisierung bei Wiederverbindung
- Benutzer-Benachrichtigungen für Offline-Status

### 6. **Dynamische Hotkey-Registrierung**
- Update von Tastenkürzel ohne App-Neustart
- Deregistrierung alter und Registrierung neuer Hotkeys
- Persistierung in Settings

## Enrichment-Modi

Die Anwendung bietet vier Enrichment-Modi zur intelligenten Verarbeitung von Transkripten:

### 1. **Summary** (Zusammenfassung)
Erstellt eine prägnante 2-3 Satz-Zusammenfassung des Transkripts.

### 2. **Structure** (Strukturierung)
Gliedert den Text mit Überschriften und Aufzählungspunkten.

### 3. **Format** (Formatierung)
Erstellt eine strukturierte Notiz mit klaren Abschnitten.

### 4. **Context** (Kontext-Anpassung)
Analysiert den Text im Kontext eines spezifizierten Themas.

## Scheduler-Konfiguration

Die automatische Kategorisierung ist vollständig konfigurierbar:

```typescript
{
  categorizationInterval: 3600000,  // ms (default: 1 hour)
  deepAnalysisDay: 5,               // 0-6 (0=Sunday, default=Friday)
  deepAnalysisTime: "09:00",        // HH:MM format
  autoTranscribe: true,             // Automatische Transkription
  isEnabled: true                   // Scheduler aktiviert/deaktiviert
}
```

## Setup & Installation

### Voraussetzungen

- Node.js 22+ und pnpm
- Rust (für Tauri Desktop-Build)
- Git
- MySQL/TiDB Datenbank

### Entwicklungs-Setup

```bash
# Repository klonen
git clone <repo-url>
cd voice-intelligence-app

# Dependencies installieren
pnpm install

# Datenbankmigrationen durchführen
pnpm db:push

# Development Server starten (Web)
pnpm dev

# Desktop App starten (Tauri)
pnpm tauri dev
```

### Production-Build

```bash
# Desktop-Builds für macOS, Windows, Linux
pnpm tauri build

# Builds sind verfügbar in:
# - src-tauri/target/release/bundle/
```

## Datenbankschema

### Core Tables

- **users**: Benutzer und Authentifizierung
- **user_settings**: Benutzer-Einstellungen (Hotkey, Sprache, etc.)
- **recording_history**: Aufnahmen und Transkriptionen
- **notes**: Strukturierte Notizen mit Status-Tracking
- **tasks**: Extrahierte Aufgaben mit Priorität
- **projects**: Projektideen mit Effort/Impact Rating
- **scheduler_config**: Konfigurierbare Scheduler-Einstellungen
- **categorization_feedback**: Benutzer-Feedback für KI-Verbesserung
- **weekly_analysis**: Wöchentliche Analyse-Ergebnisse
- **chat_history**: Chat-Verlauf für "Ask your Note"

## API Endpoints

### Orchestration Router (`/api/trpc/orchestration`)

- `createNote`: Neue Notiz erstellen
- `getNotes`: Notizen abrufen
- `getProjects`: Projekte abrufen
- `getSchedulerConfig`: Scheduler-Konfiguration abrufen
- `submitCategorizationFeedback`: Feedback für KI-Verbesserung

### Tasks Router (`/api/trpc/tasks`)

- `createTask`: Task erstellen
- `getTasks`: Tasks abrufen
- `updateTask`: Task aktualisieren
- `deleteTask`: Task löschen

### Analytics Router (`/api/trpc/analytics`)

- `getWeeklyAnalysis`: Wochenanalyse abrufen
- `generateProjectIdeas`: Projektideen generieren

## Performance-Optimierungen

- **Code-Splitting**: Vendor-Chunks für React, UI, Utils, tRPC
- **Lazy Loading**: Dynamische Imports für große Komponenten
- **Caching**: React Query mit optimistic updates
- **Database Indexing**: Optimierte Queries für häufige Zugriffe
- **Offline-First**: IndexedDB für lokales Caching

## Testing

```bash
# Unit-Tests ausführen
pnpm test

# Mit Coverage
pnpm test:coverage

# Watch-Mode
pnpm test:watch
```

## Deployment

Das Projekt ist bereit für Production-Deployment:

1. **Desktop**: Automatisierte Builds via GitHub Actions für macOS, Windows, Linux
2. **Web**: Manus Built-in Hosting mit Custom Domain Support
3. **Database**: MySQL/TiDB mit automatischen Backups

## Dokumentation

- [ANALYTICS_DOCUMENTATION.md](./ANALYTICS_DOCUMENTATION.md) - Wochenanalyse & Projektideen-Generator
- [ANALYTICS_QUICKSTART.md](./ANALYTICS_QUICKSTART.md) - Quick Start Guide
- [DESKTOP_BUILD_GUIDE.md](./DESKTOP_BUILD_GUIDE.md) - Desktop-Build Anleitung

## Lizenz

Proprietary - Alle Rechte vorbehalten

## Support

Für Fragen und Support: [support@voiceintelligence.app](mailto:support@voiceintelligence.app)
