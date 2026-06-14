# Social-Pipeline — CLINE-gesteuerte Content-Transformation

Aus einem Gedanken, einem Blog-Post oder einer Beobachtung werden plattformgerechte Social-Media-Beiträge. Die Pipeline lebt im CLINE-Chat — du gibst Text ein, CLINE transformiert ihn mit den Prompt-Vorlagen und schreibt Copy-Paste-fertige Dateien.

---

## Projektstruktur

```
social-pipeline/
├── README.md
├── CHANGELOG.md               # Prompt-Änderungslogbuch
├── .gitignore                 # output/ ausgeschlossen
├── posts/                     # Content-Quellen (Markdown)
│   └── 2026-06-14-test-erster-social-post.md
├── prompts/                   # Prompt-Vorlagen (das geistige Eigentum)
│   ├── _shared/
│   │   ├── kunstfigur-kern.md      # System-Prompt: Identität + Anti-Patterns
│   │   ├── stil-beispiele.md       # 3 Few-Shot-Examples mit Analyse
│   │   └── analyse-plattformen.md  # Stufe 1: Plattform-Eignung (7 Plattformen)
│   ├── blog.md                # KERN: YAML-Frontmatter, 3 Content-Typen
│   ├── telegram.md            # Schale 2: Easteregg-CTA
│   ├── youtube-community.md   # Schale 3: PS-CTA
│   ├── linkedin.md            # B2B-Schiene: 5 Content-Typen
│   └── kampagne.md            # Kampagnen-Fahrplan (4-Wochen-Trichter)
├── campaigns/                 # Generierte Kampagnen-Dokumente
└── output/                    # Generierte Texte (pro Tag)
    └── YYYY-MM-DD/
        ├── telegram-slug.txt
        ├── youtube-community-slug.txt
        └── linkedin-slug.txt
```

Es gibt **keine `config.json`**, keine `{{variablen}}`. Jeder Prompt enthält seine Rolle, sein Plattform-Wissen und seine Limits direkt — eingebettet und unveränderlich, bis du den Prompt bewusst editierst.

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

## Plattform-Prompts

Jeder Prompt in `prompts/` ist autark. Er definiert:

- **ROLLE:** Wer spricht? Ein Telegram-Stratege? Ein LinkedIn-Positionierer?
- **PLATTFORM-WISSEN:** Was funktioniert auf dieser Plattform? Was nicht? (Direkt aus dem Werkstatthandbuch)
- **ZIEL:** Welche Conversion? Trichterrichtung? Strategischer Zweck?
- **LIMIT:** Zeichenlimit, Format-Regeln, Output-Format

Die Prompts sind versioniert in Git. Du kannst sie jederzeit verfeinern — das ist das geistige Eigentum des Projekts. Keine `config.json` nötig, keine `{{variablen}}`. Alles Wissen steckt direkt im Prompt.

**Quelle des Plattform-Wissens:** `plattform_use_cases_zwiebelmodell.md` aus dem Werkstatthandbuch. Die Prompts sind die operationalisierte Form dieses Dokuments.

### Kampagnen-System (Stufe 3: Strategie)

Für größere Vorhaben (Show-Reihe, Buch-Launch, Newsletter-Wachstum) gibt es `prompts/kampagne.md`:

```
"Plane eine Kampagne: Ziel: 1.000 Newsletter-Abonnenten. Zeitraum: 4 Wochen."
```

Der Prompt generiert einen vollständigen Fahrplan als Markdown-Datei — mit Wochentabelle, konkreten Content-Ideen pro Tag/Plattform, CTA-Dosierung und Trichter-Logik. Das Ergebnis landet in `campaigns/` und dient als dein Produktions-Leitfaden.

### Aktive Plattformen

| Plattform | Prompt | Strategisches Ziel (Zwiebelmodell) |
|-----------|--------|-----------------------------------|
| **Blog** | `prompts/blog.md` | KERN — Langlebiger Content, RSS-Quelle, SEO/LLMEO |
| **Telegram** | `prompts/telegram.md` | Schale 2 — Kern-Community binden, Newsletter-Trichter |
| **YouTube Community** | `prompts/youtube-community.md` | Schale 3 — Abonnenten mit Substanz füttern, Richtung Kern lenken |
| **LinkedIn** | `prompts/linkedin.md` | Parallele B2B-Schiene — Keynote Speaker positionieren |

---

## Kunstfigur-Kern

`prompts/_shared/kunstfigur-kern.md` definiert die Tobias-Hecht-Identität:

- **Zwei Haltungen:** Der wütende Aufklärer + der amüsierte Anthropologe
- **5 rhetorische Grundfiguren:** Scheinbare Naivität, Absurde Logik, Soziolekt-Kontrast, Pointe als sprachliche Figur, Radikaler Perspektivwechsel
- **3 Archetypen:** Bauer Huber, Opa/Dorfältester, Tante Erna
- **Stil:** Trocken, direkt, keine Moral, kein Lob

---

## Abgrenzung

- **Kein automatisches Posting.** Kein API-Key zu den Plattformen.
- **Kein Scheduler.** Du entscheidest, wann was live geht.
- **Kein Analytics-Tool.** Fokus auf Content-Produktion.
- **Keine eigene LLM-API.** CLINE ist die Engine — kein zweiter API-Key nötig.
- **Kein JavaScript-Framework, keine config.json, keine Variablen.** Das Projekt besteht aus Prompt-Dateien mit eingebettetem Plattform-Wissen und Content-Dateien. Punkt.
