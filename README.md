# Social-Pipeline — CLINE-gesteuerte Content-Transformation

Aus einem Gedanken, einem Blog-Post oder einer Beobachtung werden plattformgerechte Social-Media-Beiträge. Die Pipeline lebt im CLINE-Chat — du gibst Text ein, CLINE transformiert ihn mit den Prompt-Vorlagen und schreibt Copy-Paste-fertige Dateien.

---

## Projektstruktur

```
social-pipeline/
├── README.md                  # Diese Datei
├── .gitignore                 # output/ ausgeschlossen
├── config.json                # Plattform-Einstellungen
├── posts/                     # Content-Quellen (Markdown)
│   └── 2026-06-14-test-erster-social-post.md
├── prompts/                   # Prompt-Vorlagen (das geistige Eigentum)
│   ├── _shared/
│   │   └── kunstfigur-kern.md     # System-Prompt: Tobias-Hecht-Identität
│   ├── telegram.md            # 500 Zeichen, direkt, Push-tauglich
│   ├── youtube-community.md   # 1.500 Zeichen, Polls, Community-Fragen
│   └── linkedin.md            # 3.000 Zeichen, Thought Leadership
└── output/                    # Generierte Texte (pro Tag)
    └── YYYY-MM-DD/
        ├── telegram-slug.txt
        ├── youtube-community-slug.txt
        └── linkedin-slug.txt
```

---

## Workflow (zweistufig — empfohlen)

Nicht jeder Content gehört auf jede Plattform. Der zweistufige Workflow stellt sicher, dass jeder Post da landet, wo er hinpasst — mit voller Prompt-Fokussierung.

### Stufe 1: Plattform-Analyse

```
"Analysiere posts/2026-06-14-mein-post.md: Für welche Plattformen eignet er sich?"
```

CLINE lädt `prompts/_shared/analyse-plattformen.md` + Content und gibt eine Tabelle aus:

| Plattform | Geeignet? | Begründung |
|-----------|:---------:|-----------|
| Telegram | ✅ | Kurzer Rant perfekt für Push-Kanal |
| LinkedIn | ✅ | Ablasshandel-Analogie = Thought Leadership |
| YouTube | ✅ | Poll-Idee vorhanden |
| Instagram | ⚠️ | Braucht starkes Bild |
| TikTok | ❌ | Setup zu lang für 45 Sek. |

**Vorteil:** Du triffst eine bewusste Entscheidung, statt alles überall hinzuklatschen.

### Stufe 2: Plattform-spezifische Transformation

Für jede empfohlene Plattform einzeln:

```
"Erzeuge den Telegram-Post für den Content"
"Erzeuge den LinkedIn-Post"
"Erzeuge den YouTube-Community-Post"
```

Jeder Prompt läuft isoliert. Das LLM konzentriert sich auf **eine** Plattform, **ein** Zeichenlimit, **eine** Tonalität — volle Prompt-Fokussierung.

Der Content ist bereits aus Stufe 1 im Kontext und muss nicht neu geladen werden.

### Stufe 3: Ergebnis

CLINE schreibt die transformierten Texte nach `output/YYYY-MM-DD/`. Du kopierst sie in die jeweilige Plattform.

---

### Schnellvariante: All-in-One

Wenn du den Content bereits kennst und weißt, welche Plattformen passen:

```
"Erzeuge Telegram, LinkedIn und YouTube-Community für posts/mein-post.md"
```

⚠️ **Achtung:** Bei dieser Variante konkurrieren mehrere Prompts um Aufmerksamkeit — die Qualität pro Plattform kann sinken, besonders bei den ersten Plattformen im Prompt. Nur nutzen, wenn du bewusst auf Präzision zugunsten von Geschwindigkeit verzichtest.

---

## Plattform-Matrix

| Plattform | Zeichenlimit | Tonalität | Prompt-Datei |
|-----------|-------------|-----------|-------------|
| Telegram | 500 | direkt, plaudernd, Push-fähig | `prompts/telegram.md` |
| YouTube Community | 1.500 | Community-nah, frage-getrieben | `prompts/youtube-community.md` |
| LinkedIn | 3.000 | Thought Leadership mit Humor | `prompts/linkedin.md` |

---

## Kunstfigur-Kern

Der System-Prompt in `prompts/_shared/kunstfigur-kern.md` definiert die Tobias-Hecht-Identität:

- **Zwei Haltungen:** Der wütende Aufklärer + der amüsierte Anthropologe
- **5 rhetorische Grundfiguren:** Scheinbare Naivität, Absurde Logik, Soziolekt-Kontrast, Pointe als sprachliche Figur, Radikaler Perspektivwechsel
- **3 Archetypen:** Bauer Huber, Opa/Dorfältester, Tante Erna
- **Stil:** Trocken, direkt, keine Moral, kein Lob

---

## Plattform-Prompts anpassen

Die `.md`-Dateien in `prompts/` sind das Herzstück. Sie enthalten die Transformationsanweisungen für jede Plattform. Sie nutzen `{{platzhalter}}` für dynamische Werte:

- `{{title}}` — Titel aus dem Content
- `{{body}}` — Body-Text
- `{{hook}}` — Hook-Zeile
- `{{max_chars}}` — Zeichenlimit aus `config.json`
- `{{tone}}` — Tonalität aus `config.json`

Prompts können jederzeit verfeinert werden — sie sind versioniert in Git und überleben Plattform-Änderungen.

---

## config.json

```json
{
  "active_platforms": ["telegram", "youtube-community", "linkedin"],
  "platforms": {
    "telegram": { "max_chars": 500, "tone": "direkt, plaudernd, Push-fähig", "hashtags": false },
    "youtube-community": { "max_chars": 1500, "tone": "Community-nah, frage-getrieben", "hashtags": false },
    "linkedin": { "max_chars": 3000, "tone": "Thought Leadership mit Humor", "hashtags": true }
  }
}
```

---

## Abgrenzung

- **Kein automatisches Posting.** Kein API-Key zu den Plattformen.
- **Kein Scheduler.** Du entscheidest, wann was live geht.
- **Kein Analytics-Tool.** Fokus auf Content-Produktion.
- **Keine eigene LLM-API.** CLINE ist die Engine — kein zweiter API-Key nötig.
- **Kein JavaScript-Framework.** Das Projekt besteht aus Prompt-Dateien und Content. Punkt.