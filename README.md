# Social-Pipeline — Content-Maschine für plattformspezifische Ausspielungen

Lokales Werkzeug zur Vorbereitung von Social-Media-Beiträgen. Aus einem Gedanken, einem Bild, einem Blog-Post oder einer Podcast-Episode werden plattformgerechte Text-Bild-Kombinationen für Telegram, Instagram, YouTube, LinkedIn, TikTok, Mastodon und andere Kanäle generiert. Ziel: Copy & Paste in die jeweiligen Plattformen — kein automatisches Posting, keine API-Abhängigkeit.

---

## Inhaltsverzeichnis

- [Das Problem](#das-problem)
- [Architektur-Entscheidung](#architektur-entscheidung)
- [Schwesterprojekte](#schwesterprojekte)
- [Technischer Ansatz](#technischer-ansatz)
- [Plattform-Matrix](#plattform-matrix)
- [Ordnerstruktur (geplant)](#ordnerstruktur-geplant)
- [Workflow](#workflow)
- [KI-Integration](#ki-integration)
- [Abgrenzung: Was dieses Projekt NICHT ist](#abgrenzung-was-dieses-projekt-nicht-ist)

---

## Das Problem

Tobias Hecht produziert Content in verschiedenen Formen:

- **Strukturiert & langlebig:** Blog-Posts, Podcast-Episoden (→ Website tobiashecht.de)
- **Spontan & kurzlebig:** Plumpsklo-Fotos, Dönerbuden-Rants, tagespolitische Reaktionen (→ Social Media only)
- **Taktisch & promotend:** Teaser für neue Episoden, Veranstaltungsankündigungen, Buchhinweise

Jeder dieser Inhalte muss auf 5–7 Plattformen in jeweils anderer Form erscheinen:
- Telegram (Text, ggf. mit Bild)
- Instagram (Bild + Caption + Hashtags)
- YouTube Community / Video-Tab (Text, Thumbnail)
- LinkedIn (professionellerer Ton, Thought Leadership)
- TikTok (kurzes Video-Skript, Text-Overlay)
- Mastodon / Fediverse (Text mit Content-Warnings)
- Newsletter (als Teil einer kuratierten Ausgabe)

**Die manuelle Lösung** (jedes Dashboard einzeln öffnen und befüllen) kostet Stunden und kognitive Energie, die für kreative Arbeit fehlt.

**Die SaaS-Lösung** (Buffer, Hootsuite, Later) kostet 100 €/Monat, löst aber nur das Scheduling — nicht die Transformation eines Gedankens in sechs plattformgerechte Textfassungen.

**Die Lösung der Social-Pipeline:** Ein Gedanke wird einmal in Markdown formuliert. Ein lokales Script generiert daraus die plattformspezifischen Textdateien. Der Mensch macht Copy & Paste in die Plattformen. Kein API-Key zu den Plattformen nötig. Volle Kontrolle über den Content.

---

## Architektur-Entscheidung

### Warum ein eigenständiges Projekt — nicht Teil der Website?

Die Website (`website-tobiashecht-de`) hostet **langlebige Inhalte**: Blog-Posts, Podcast-Episoden, statische Seiten. Diese sind versioniert in Git, gebaut von `sync-to-cloudflare.js`, deployed auf Cloudflare Pages. Ihr Lebenszyklus ist Jahre.

Social-Media-Content ist **kurzlebig**. Ein Dönerbuden-Foto existiert 48 Stunden. Es braucht keinen KV-Speicher, kein HTML-Template, kein `git push`. Diese Inhalte in das Website-Projekt zu mischen würde:

1. Die Codebasis überfrachten (zwei komplett verschiedene Content-Pipelines im selben Repo)
2. Die Deployment-Infrastruktur unnötig belasten (jeder Social-Post triggert einen Cloudflare-Build)
3. Die mentale Trennung zwischen "ewigem" und "flüchtigem" Content verwischen

**Die Social-Pipeline ist ein eigenständiges Werkzeug** — wie das Newsletter-System oder die Snippet-Verwaltung.

### Verbindung zur Website — über RSS als neutrale Schnittstelle

Wenn ein Blog-Post oder eine Podcast-Episode auf der Website erscheint, will man auch Social-Media-Teaser dafür. Die Pipeline kann die RSS-Feeds der Website einlesen (`tobiashecht.de/rss-blog.xml`, `tobiashecht.de/podcast-<slug>.xml`) und bei neuen Einträgen automatisch Teaser generieren. Kein Eingriff in die Website nötig — RSS ist die Brücke.

---

## Schwesterprojekte

Die Social-Pipeline ist ein Baustein in einer Werkzeug-Familie:

| Projekt | Pfad | Zweck |
|---------|------|-------|
| **Website** | `~/Desktop/website-tobiashecht-de` | Langlebiger Content: Blog, Podcast, Booking, Shop, Rechtliches |
| **Newsletter-System** | `~/newsletter-system/` | mailto:-basierte Anmeldung, lokale Listenverwaltung |
| **Werkstatthandbuch** | `~/Desktop/Recherchesammlung/werkstatthandbuch_kabarett_und_buehne` | Methoden, Strategien, Prompt-Templates, Bühnen-Handwerk |
| **Snippet-Verwaltung** | `~/Desktop/snippets/` | Kabarett-Snippets, Material-Datenbank |
| **Social-Pipeline** | `~/Desktop/social-pipeline/` | **Dieses Projekt** — Plattform-Transformation für Social Media |

**Datenfluss zwischen den Projekten:**

```
Gehirn/Idee
  │
  ├──► Website (Blog-Post, Podcast-Episode)
  │       │
  │       ▼
  │     RSS-Feeds ────► Social-Pipeline (liest RSS, generiert Teaser)
  │
  ├──► Social-Pipeline (spontaner Social-Post)
  │
  ├──► Newsletter-System (kuratierte Ausgabe)
  │
  └──► Snippet-Verwaltung (Material-Archiv)
```

---

## Technischer Ansatz

**Prinzip:** MD → Script → Output-Dateien. Strukturgleich zum `sync-to-cloudflare.js` des Website-Projekts, aber mit anderem Ziel:

| Website-Projekt | Social-Pipeline |
|----------------|-----------------|
| Scannt `posts/`, `pages/`, `podcasts/` | Scannt `posts/`, liest zusätzlich externe RSS-Feeds |
| Rendert HTML via `marked` | Rendert Plattform-Texte via String-Templates |
| Schreibt in Cloudflare KV | Schreibt in lokalen `output/`-Ordner |
| Generiert RSS | Konsumiert RSS |
| Deployed auf Cloudflare | Läuft nur lokal — kein Deploy |

**Warum kein Open-Source-Fremdprojekt?**

Existierende Lösungen (Buffer-Alternativen, Static-Site-Plugins, KI-Text-Tools) sind entweder:
- Auf automatisches API-Posting ausgelegt (was dieses Projekt bewusst vermeidet)
- An bestimmte CMS-Ökosysteme gekoppelt (WordPress, Ghost, 11ty)
- Kommerziell mit wiederkehrenden Kosten

Eine selbst gebaute Pipeline ist ~150 Zeilen Node.js, hat keine Abhängigkeiten außer `marked`, und tut exakt das Nötige. Das Rad ist klein genug, dass es sich lohnt, es selbst zu bauen.

---

## Plattform-Matrix

Welcher Content-Typ wird auf welcher Plattform ausgespielt?

| Content-Typ | Telegram | Instagram | YouTube | LinkedIn | TikTok | Mastodon |
|-------------|:--------:|:---------:|:-------:|:--------:|:------:|:--------:|
| Blog-Post-Teaser | ✅ Text | ✅ Bild+Text | ✅ Community | ✅ Post | ❌ | ✅ Text |
| Podcast-Episode-Teaser | ✅ Text+Link | ✅ Bild+Text | ✅ Community | ✅ Post | ✅ Skript | ✅ Text |
| Kurzer Rant | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Foto (Plumpsklo, Döner) | ✅ Bild | ✅ Bild | ❌ | ❌ | ❌ | ✅ Bild |
| Veranstaltungshinweis | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Buch-/Merch-Hinweis | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |

---

## Ordnerstruktur (geplant)

```
social-pipeline/
├── README.md                  # Diese Datei
├── package.json               # Node.js-Abhängigkeiten (marked, ggf. KI-Client)
├── generate.js                # Haupt-Script: MD + Templates → Output
├── config.json                # Plattform-Einstellungen, aktive RSS-Feeds
├── posts/                     # Spontane Social-MDs
│   └── 2026-06-14-doenerbude.md
├── templates/                 # Plattform-Templates
│   ├── telegram.txt
│   ├── instagram.txt
│   ├── youtube-community.txt
│   ├── linkedin.txt
│   ├── tiktok.txt
│   ├── mastodon.txt
│   └── newsletter.txt
├── output/                    # Fertige Copy-Paste-Texte (pro Tag)
│   └── 2026-06-14/
│       ├── telegram-doenerbude.txt
│       ├── instagram-doenerbude.txt
│       ├── linkedin-doenerbude.txt
│       └── ...
└── media/                     # Bilder für Social-Posts (optional)
```

---

## Workflow

### Spontaner Social-Post

1. In `posts/` eine neue Datei anlegen: `YYYY-MM-DD-slug.md`
2. Frontmatter ausfüllen: `title`, `date`, `category`, `platforms`, Bildpfad
3. Body: Der Kern-Gedanke, eine Pointe, ein Bildbeschreibungstext
4. `node generate.js` ausführen
5. Im `output/YYYY-MM-DD/` liegen die fertigen Texte für jede Plattform
6. Copy & Paste in die jeweiligen Plattform-Dashboards

### Blog-Post promoten

1. In `generate.js` die Website-URL des Blog-Posts angeben (oder das Script liest den RSS-Feed automatisch)
2. Die Pipeline extrahiert Titel, Exzerpt, Bild aus dem RSS
3. Plattform-Texte werden generiert
4. Optional: Manuelle Nachbearbeitung möglich (die Textdateien sind editierbar)

### Podcast-Episode promoten

1. Die Pipeline liest den Podcast-RSS (`/podcast-<slug>.xml`)
2. Bei neuen Episoden werden Teaser generiert (inkl. Audio-Link, Shownotes-Verweis, Dauer)
3. Zusätzlich: Ein kurzes Video-Skript für TikTok/Reels, das die Episode bewirbt

---

## KI-Integration

Die Pipeline unterstützt optionale KI-gestützte Texttransformation:
- **API:** Deepseek (oder OpenAI/Claude-kompatibel)
- **Nutzung:** Aus einem Rohgedanken im Body generiert die KI plattformspezifische Varianten unter Beachtung von:
  - Zeichenlimits (z.B. 500 für Telegram, 2200 für Instagram, 3000 für LinkedIn)
  - Tonalität (Telegram: direkt, Instagram: visuell-beschreibend, LinkedIn: professionell-analytisch)
  - Hashtag-Vorschlägen
  - Rhetorischen Figuren aus dem Werkstatthandbuch (Scheinbare Naivität, absurde Logik, Soziolekt-Kontrast)

**Die KI ist optional.** Die Pipeline funktioniert auch rein regelbasiert mit Templates — dann schreibt der Mensch den Kern-Text selbst und die Templates formatieren ihn nur um.

---

## Abgrenzung: Was dieses Projekt NICHT ist

- **Kein Social-Media-Scheduler.** Es postet nicht automatisch. Es bereitet Texte vor. Der Mensch entscheidet, wann und ob sie live gehen.
- **Kein Analytics-Tool.** Keine Follower-Zahlen, keine Engagement-Metriken. Das ist bewusst ausgeklammert (DSGVO, Minimalismus, Fokus auf Content-Produktion).
- **Kein API-Client für Plattformen.** Kein Instagram-Token, kein YouTube-API-Key. Keine Abhängigkeit von Plattform-Schnittstellen, die sich ändern oder entzogen werden können.
- **Kein Website-Teil.** Die Social-Pipeline lebt getrennt von tobiashecht.de. Sie hat ihren eigenen Git-Repo, ihr eigenes Node.js-Projekt, ihren eigenen Lebenszyklus.

---

*Dieses Projekt startet als README. Die Implementierung folgt in einem nächsten Schritt — basierend auf dem bewährten Muster des Website-Sync-Scripts.*