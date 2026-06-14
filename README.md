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

## Workflow

### 1. Content bereitstellen

Entweder:
- Eine `.md`-Datei in `posts/` ablegen
- Text direkt im CLINE-Chat eingeben
- Auf eine URL oder Datei verweisen

### 2. Im CLINE-Chat transformieren

```
"Transformiere posts/2026-06-14-mein-post.md für Telegram und YouTube-Community"
```

CLINE lädt automatisch:
- Den Content aus `posts/`
- Den `kunstfigur-kern.md` als System-Prompt
- Die plattformspezifischen Prompts aus `prompts/`
- Die `config.json` für Limits und Tonalität

### 3. Ergebnis

CLINE schreibt die transformierten Texte nach `output/YYYY-MM-DD/`. Du kopierst sie in die jeweilige Plattform.

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