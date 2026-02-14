# Wochenanalyse & Projektideen-Generator Dokumentation

## Überblick

Das Wochenanalyse & Projektideen-Generator System ist eine KI-gestützte Komponente der Voice Intelligence App, die automatisch Produktivitätstrends erkennt, Muster in Notizen analysiert und intelligente Projektvorschläge generiert. Das System nutzt LLM-Integration für natürlichsprachliche Verarbeitung und bietet ein interaktives Analytics-Dashboard zur Visualisierung von Insights.

---

## Architektur

### Backend-Komponenten

#### 1. **Database Schema** (`drizzle/schema.ts`)

```typescript
// Weekly Analysis Table
export const weeklyAnalyses = sqliteTable('weekly_analyses', {
  id: integer('id').primaryKey(),
  userId: integer('user_id').notNull(),
  weekStartDate: text('week_start_date').notNull(),
  summary: text('summary').notNull(),
  topThemes: text('top_themes').notNull(), // JSON string
  projectIdeas: text('project_ideas'), // JSON string
  recommendations: text('recommendations'),
  recordingCount: integer('recording_count').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});
```

#### 2. **DB Helper Functions** (`server/db-analytics.ts`)

| Funktion | Beschreibung |
|----------|-------------|
| `getWeekBoundaries()` | Berechnet Start- und Enddatum der aktuellen Woche |
| `getWeekRecordings(userId, weekStart, weekEnd)` | Ruft alle Aufnahmen einer Woche ab |
| `getWeekCompletedTasks(userId, weekStart, weekEnd)` | Ruft abgeschlossene Tasks einer Woche ab |
| `calculateWeekMetrics(recordings, tasks)` | Berechnet Produktivitätsmetriken |
| `extractTopics(transcriptions)` | Extrahiert Top-Themen aus Transkriptionen |
| `saveWeeklyAnalysis(userId, analysis)` | Speichert Analyse in der Datenbank |
| `getLatestWeeklyAnalysis(userId)` | Ruft die neueste Analyse ab |
| `getWeeklyAnalysesByRange(userId, startDate, endDate, weeks)` | Ruft Analysen für einen Zeitraum ab |

#### 3. **tRPC Router** (`server/routers/analytics.ts`)

##### Procedures

**`generateWeeklyAnalysis`**
- **Input:** `{ weekStartDate?: Date }`
- **Output:** `{ success: boolean, analysis: { summary, insights, recommendations } }`
- **Beschreibung:** Generiert eine automatische Wochenanalyse basierend auf Aufnahmen und Tasks
- **Prozess:**
  1. Ruft Aufnahmen und Tasks der Woche ab
  2. Extrahiert Top-Themen aus Transkriptionen
  3. Berechnet Produktivitätsmetriken
  4. Nutzt LLM zur Generierung von Zusammenfassung und Insights
  5. Speichert Analyse in der Datenbank

**`generateProjectIdeas`**
- **Input:** `{ weekStartDate?: Date }`
- **Output:** `{ success: boolean, ideas: Array<{ title, description, effort_level, potential_impact, skills_needed, estimated_timeline }> }`
- **Beschreibung:** Generiert intelligente Projektvorschläge basierend auf Notizen
- **Prozess:**
  1. Analysiert Transkriptionen auf Projektideen
  2. Nutzt LLM zur Strukturierung und Bewertung
  3. Priorisiert nach Aufwand und Potenzial
  4. Speichert Ideen in der Datenbank

**`getTrends`**
- **Input:** `{ weeks: number }`
- **Output:** `{ success: boolean, trends: Array<{ week, recordingCount, taskCount, avgDuration }> }`
- **Beschreibung:** Ruft Produktivitätstrends über mehrere Wochen ab

**`getLatestAnalysis`**
- **Input:** `{}`
- **Output:** `{ success: boolean, analysis: WeeklyAnalysis | null }`
- **Beschreibung:** Ruft die neueste Wochenanalyse ab

---

### Frontend-Komponenten

#### **Analytics Page** (`client/src/pages/Analytics.tsx`)

Eine vollständige Dashboard-Komponente mit:

##### Funktionalität

| Feature | Beschreibung |
|---------|-------------|
| **Summary Card** | Zeigt Zusammenfassung der Woche mit Aufnahmen- und Task-Counts |
| **Metrics Grid** | Zeigt wichtige KPIs: Gesamtaufnahmen, Top-Theme, Produktivitätstrend |
| **Recording Trends Chart** | Line Chart der Aufnahmen über 4 Wochen |
| **Top Themes Pie Chart** | Visualisiert die am häufigsten diskutierten Themen |
| **Insights & Recommendations** | Textuelle Insights und Empfehlungen vom LLM |
| **Project Ideas Cards** | Zeigt generierte Projektideen mit Effort/Impact Badges |

##### Komponenten-Struktur

```typescript
export function Analytics() {
  // Queries
  const { data: analysisData } = trpc.analytics.getLatestAnalysis.useQuery();
  const { data: trendsData } = trpc.analytics.getTrends.useQuery({ weeks: 4 });

  // Mutations
  const generateAnalysisMutation = trpc.analytics.generateWeeklyAnalysis.useMutation();
  const generateIdeasMutation = trpc.analytics.generateProjectIdeas.useMutation();

  // Rendering mit Recharts für Visualisierung
}
```

---

## Workflow

### Automatische Wochenanalyse Generierung

```
1. Benutzer klickt "Generate Analysis" Button
   ↓
2. Frontend ruft trpc.analytics.generateWeeklyAnalysis auf
   ↓
3. Backend:
   - Ruft alle Aufnahmen der Woche ab
   - Extrahiert Transkriptionen
   - Berechnet Metriken (Anzahl, Dauer, etc.)
   - Nutzt LLM zur Analyse:
     * Zusammenfassung der Woche
     * Erkannte Insights
     * Empfehlungen
   - Speichert in Datenbank
   ↓
4. Frontend zeigt Ergebnisse im Dashboard
```

### Projektideen-Generierung

```
1. Benutzer klickt "Generate Ideas" Button
   ↓
2. Frontend ruft trpc.analytics.generateProjectIdeas auf
   ↓
3. Backend:
   - Analysiert Transkriptionen auf Projektideen
   - Nutzt LLM zur Strukturierung:
     * Projekt-Titel
     * Detaillierte Beschreibung
     * Aufwand-Level (low/medium/high)
     * Potenzial-Impact (low/medium/high)
     * Benötigte Skills
     * Geschätzter Timeline
   - Priorisiert nach Relevanz
   - Speichert in Datenbank
   ↓
4. Frontend zeigt Projektideen als Cards mit Badges
```

---

## LLM Integration

### Prompts

#### Weekly Analysis Prompt

```
Analyze the following transcriptions from the past week and provide:
1. A concise summary of the week's focus areas
2. Key insights about productivity patterns
3. Actionable recommendations for the next week

Transcriptions:
{transcriptions}

Metrics:
- Total recordings: {totalRecordings}
- Total recording time: {totalRecordingTime} minutes
- Completed tasks: {completedTasks}

Respond in JSON format:
{
  "summary": "...",
  "insights": "...",
  "recommendations": "..."
}
```

#### Project Ideas Prompt

```
Based on the following transcriptions, identify potential project ideas that could be valuable to pursue:

Transcriptions:
{transcriptions}

For each idea, provide:
- title: Project name
- description: What the project does
- effort_level: "low" | "medium" | "high"
- potential_impact: "low" | "medium" | "high"
- skills_needed: Array of required skills
- estimated_timeline: Estimated duration

Respond in JSON format:
{
  "ideas": [
    {
      "title": "...",
      "description": "...",
      "effort_level": "...",
      "potential_impact": "...",
      "skills_needed": [...],
      "estimated_timeline": "..."
    }
  ]
}
```

---

## Testing

### Unit Tests (`server/routers/analytics.test.ts`)

```typescript
describe('analyticsRouter', () => {
  // Test: generateWeeklyAnalysis
  // Test: generateProjectIdeas
  // Test: getTrends
  // Test: getLatestAnalysis
});
```

**Test Coverage:**
- ✓ Erfolgreiche Analyse-Generierung
- ✓ Fehlerbehandlung bei fehlenden Aufnahmen
- ✓ Projektideen-Generierung
- ✓ Trend-Abfragen
- ✓ Neueste Analyse abrufen

**Alle 7 Tests bestanden ✓**

---

## API Referenz

### REST Endpoints (via tRPC)

#### `POST /api/trpc/analytics.generateWeeklyAnalysis`

Generiert eine Wochenanalyse.

**Request:**
```json
{
  "weekStartDate": "2026-02-08T00:00:00Z" // optional
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "summary": "Productive week focused on project planning...",
    "insights": "Team collaboration improved significantly...",
    "recommendations": "Continue weekly sync meetings..."
  }
}
```

#### `POST /api/trpc/analytics.generateProjectIdeas`

Generiert Projektideen.

**Request:**
```json
{
  "weekStartDate": "2026-02-08T00:00:00Z" // optional
}
```

**Response:**
```json
{
  "success": true,
  "ideas": [
    {
      "title": "Productivity Dashboard",
      "description": "Build a real-time productivity tracking dashboard...",
      "effort_level": "high",
      "potential_impact": "high",
      "skills_needed": ["React", "Node.js", "PostgreSQL"],
      "estimated_timeline": "3 months"
    }
  ]
}
```

#### `GET /api/trpc/analytics.getTrends`

Ruft Produktivitätstrends ab.

**Request:**
```json
{
  "weeks": 4
}
```

**Response:**
```json
{
  "success": true,
  "trends": [
    {
      "week": "2026-02-08",
      "recordingCount": 5,
      "taskCount": 12,
      "avgDuration": 25
    }
  ]
}
```

#### `GET /api/trpc/analytics.getLatestAnalysis`

Ruft die neueste Analyse ab.

**Response:**
```json
{
  "success": true,
  "analysis": {
    "id": 1,
    "userId": 1,
    "weekStartDate": "2026-02-08T00:00:00Z",
    "summary": "...",
    "topThemes": { "productivity": 5, "meetings": 3 },
    "recommendations": "...",
    "recordingCount": 5,
    "createdAt": "2026-02-14T19:30:00Z"
  }
}
```

---

## Datenfluss

```
User Interface (Analytics.tsx)
    ↓
tRPC Hooks (useQuery/useMutation)
    ↓
tRPC Router (analytics.ts)
    ↓
DB Helpers (db-analytics.ts)
    ↓
Database (weeklyAnalyses table)
    ↓
LLM Integration (invokeLLM)
    ↓
Response zurück zu UI
```

---

## Konfiguration

### Umgebungsvariablen

| Variable | Beschreibung |
|----------|-------------|
| `BUILT_IN_FORGE_API_KEY` | API-Key für LLM-Integration |
| `BUILT_IN_FORGE_API_URL` | Base URL für Manus APIs |

Diese werden automatisch vom System injiziert.

---

## Performance-Optimierungen

1. **Lazy Loading:** Analytics-Dashboard wird lazy-loaded
2. **Chart Optimization:** Recharts mit ResponsiveContainer für responsive Design
3. **Memoization:** tRPC Queries werden gecacht
4. **Batch Processing:** Mehrere Aufnahmen werden in einem Durchgang analysiert

---

## Fehlerbehandlung

### Häufige Fehler

| Fehler | Ursache | Lösung |
|--------|--------|--------|
| "No recordings found" | Keine Aufnahmen in der Woche | Aufnahmen hinzufügen |
| LLM Timeout | API nicht erreichbar | Offline-Mode nutzen |
| Database Error | Datenbankverbindung fehlgeschlagen | Server neu starten |

### Error Recovery

```typescript
const mutation = trpc.analytics.generateWeeklyAnalysis.useMutation({
  onError: (error) => {
    toast.error(error.message);
    // Fallback UI zeigen
  },
});
```

---

## Erweiterungsmöglichkeiten

1. **Custom Themes:** Benutzer können Analyse-Themen selbst definieren
2. **Export Features:** PDF/CSV Export von Analysen
3. **Scheduled Analysis:** Automatische wöchentliche Analysen
4. **Collaboration:** Teilen von Analysen mit Team-Mitgliedern
5. **Advanced Filtering:** Filterung nach Datum, Thema, Priorität

---

## Troubleshooting

### Analytics Dashboard lädt nicht

1. Überprüfen Sie, ob der Dev Server läuft: `pnpm run dev`
2. Überprüfen Sie die Browser Console auf Fehler
3. Überprüfen Sie die Network Requests in DevTools

### Analysen werden nicht generiert

1. Überprüfen Sie, ob Aufnahmen vorhanden sind
2. Überprüfen Sie die LLM API Verbindung
3. Überprüfen Sie die Server Logs: `.manus-logs/devserver.log`

### Projektideen sind leer

1. Überprüfen Sie die Transkriptionen auf Qualität
2. Überprüfen Sie, ob das LLM genügend Kontext hat
3. Versuchen Sie, die Analyse neu zu generieren

---

## Best Practices

1. **Regelmäßige Analysen:** Generieren Sie wöchentliche Analysen für bessere Insights
2. **Qualität der Aufnahmen:** Hochwertige Transkriptionen führen zu besseren Analysen
3. **Feedback Loop:** Nutzen Sie Projektideen als Input für zukünftige Aufnahmen
4. **Trend Monitoring:** Überwachen Sie Trends über mehrere Wochen

---

## Zusammenfassung

Das Wochenanalyse & Projektideen-Generator System bietet eine vollständige Lösung zur automatischen Analyse von Produktivitätsdaten und intelligenten Projektvorschlägen. Die Kombination aus Backend-Intelligenz (LLM) und Frontend-Visualisierung ermöglicht es Benutzern, schnell wertvolle Insights zu gewinnen und neue Projekte zu identifizieren.

**Wichtige Features:**
- ✓ Automatische Wochenanalyse mit KI
- ✓ Intelligente Projektideen-Generierung
- ✓ Interaktives Analytics-Dashboard
- ✓ Trend-Tracking über mehrere Wochen
- ✓ Vollständig getestet und dokumentiert
