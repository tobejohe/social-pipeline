#!/usr/bin/env node
// ============================================================
// generate.js — Haupt-Orchestrator der Social-Pipeline
// Content-Quelle: --text, --url, --file
// Output:     output/YYYY-MM-DD/plattform-slug.txt
// ============================================================

const fs = require("fs");
const path = require("path");
const { resolveUrl, resolveFile, resolveText } = require("./lib/content-resolver");
const { renderPlatform } = require("./lib/template-engine");
const aiClient = require("./lib/ai-client");

// Konfiguration laden
let _config = null;
function getConfig() {
  if (_config) return _config;
  const configPath = path.resolve(__dirname, "config.json");
  if (!fs.existsSync(configPath)) {
    console.error("❌ config.json nicht gefunden.");
    console.error("   Kopiere config.json.example → config.json und trage deine Einstellungen ein.");
    process.exit(1);
  }
  _config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  return _config;
}

// ============================================================
// CLI-Argumente parsen
// ============================================================

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    input: null,
    url: null,
    file: null,
    platforms: null,
    noAi: false,
    dryRun: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--text":
      case "--input":
        opts.input = args[++i] || "";
        break;
      case "--url":
        opts.url = args[++i] || "";
        break;
      case "--file":
        opts.file = args[++i] || "";
        break;
      case "--platforms":
        opts.platforms = (args[++i] || "").split(",").map((s) => s.trim());
        break;
      case "--no-ai":
        opts.noAi = true;
        break;
      case "--dry-run":
        opts.dryRun = true;
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
      default:
        break;
    }
  }

  if (!opts.input && !opts.url && !opts.file) {
    console.error("❌ Keine Content-Quelle angegeben.");
    console.error("   Nutze --text, --url oder --file.\n");
    printHelp();
    process.exit(1);
  }

  return opts;
}

function printHelp() {
  console.log(`
╔══════════════════════════════════════════════════════╗
║         Social-Pipeline — Content-Maschine           ║
╚══════════════════════════════════════════════════════╝

Verwendung:
  node generate.js [OPTIONEN]

Content-Quellen (genau eine erforderlich):
  --text, --input TEXT    Rohtext direkt eingeben
  --url URL               Content von URL laden
  --file PFAD             Content aus Datei lesen

Optionen:
  --platforms P1,P2       Plattformen (Standard: config.json)
  --no-ai                 Regelbasierten Fallback erzwingen
  --dry-run               Nur Vorschau, keine Dateien schreiben
  --help, -h              Diese Hilfe

Beispiele:
  node generate.js --text "Warum Bio-Siegel der neue Ablasshandel sind"
  node generate.js --file posts/2026-06-14-doenerbude.md
  node generate.js --url https://tobiashecht.de/rss-blog.xml --platforms telegram

Output:
  output/YYYY-MM-DD/plattform-slug.txt
`);
}

// ============================================================
// Output schreiben
// ============================================================

function writeOutput(dateStr, platform, slug, text, dryRun) {
  const dateDir = path.resolve(__dirname, "output", dateStr);

  if (!dryRun) {
    if (!fs.existsSync(dateDir)) {
      fs.mkdirSync(dateDir, { recursive: true });
    }
  }

  const safePlatform = platform.replace(/[^a-z0-9-]/g, "-");
  const safeSlug = slug.replace(/[^a-z0-9-]/g, "-").substring(0, 50);
  const filename = `${safePlatform}-${safeSlug}.txt`;
  const filepath = path.join(dateDir, filename);

  if (dryRun) {
    console.log(`\n📄 [DRY-RUN] ${filename}:`);
    console.log("─".repeat(50));
    console.log(text);
    console.log("─".repeat(50));
  } else {
    fs.writeFileSync(filepath, text, "utf-8");
    console.log(`✅ ${filename} (${text.length} Zeichen)`);
  }
}

// ============================================================
// Content auflösen
// ============================================================

async function resolveContent(opts) {
  if (opts.input) {
    return resolveText(opts.input);
  }
  if (opts.url) {
    return await resolveUrl(opts.url);
  }
  if (opts.file) {
    return resolveFile(opts.file);
  }
  throw new Error("Keine Content-Quelle");
}

// ============================================================
// Haupt-Logik
// ============================================================

async function main() {
  const opts = parseArgs();
  const config = getConfig();

  const platforms = opts.platforms || config.active_platforms || [];
  if (platforms.length === 0) {
    console.error("❌ Keine Plattformen konfiguriert.");
    process.exit(1);
  }

  console.log("🔧 Social-Pipeline\n");

  // Content auflösen
  console.log("📥 Content wird geladen...");
  const content = await resolveContent(opts);
  console.log(`   Quelle: ${content.source_type}`);
  console.log(`   Titel:  ${content.title}`);
  console.log(`   Slug:   ${content.slug}`);
  console.log(`   Länge:  ${content.body.length} Zeichen\n`);

  const today = new Date().toISOString().split("T")[0];

  // Für jede Plattform
  for (const platform of platforms) {
    const platformConfig = config.platforms[platform];
    if (!platformConfig) {
      console.warn(`⚠️  Plattform "${platform}" nicht in config.json — wird übersprungen.`);
      continue;
    }

    console.log(`🔄 ${platform} ...`);

    let outputText;

    try {
      if (opts.noAi) {
        // Regelbasierter Fallback
        console.log("   (regelbasiert — --no-ai)");
        outputText = renderPlatform(platform, {
          title: content.title,
          body: content.body,
          hook: content.hook || "",
          excerpt: content.body.substring(0, 150),
          date: content.date || today,
        });
      } else {
        // KI-generiert
        outputText = await aiClient.generate({
          platform,
          content: content.body,
          meta: {
            title: content.title,
            date: content.date || today,
            hook: content.hook || "",
            slug: content.slug,
            source_type: content.source_type,
          },
        });
      }

      // Prüfen auf Zeichenlimit
      const maxChars = platformConfig.max_chars;
      if (outputText.length > maxChars) {
        console.warn(
          `   ⚠️  ${outputText.length}/${maxChars} Zeichen (Limit überschritten um ${outputText.length - maxChars})`
        );
      } else {
        console.log(`   📏 ${outputText.length}/${maxChars} Zeichen`);
      }

      writeOutput(today, platform, content.slug, outputText, opts.dryRun);
    } catch (err) {
      // Fallback auf Template bei KI-Fehler
      if (!opts.noAi && err.message.includes("API")) {
        console.warn(`   ⚠️  KI-Fehler, verwende regelbasiertes Template: ${err.message}`);
        try {
          outputText = renderPlatform(platform, {
            title: content.title,
            body: content.body,
            hook: content.hook || "",
            excerpt: content.body.substring(0, 150),
            date: content.date || today,
          });
          writeOutput(today, platform, content.slug, outputText, opts.dryRun);
        } catch (fallbackErr) {
          console.error(`   ❌ Fallback fehlgeschlagen: ${fallbackErr.message}`);
        }
      } else {
        console.error(`   ❌ Fehler für ${platform}: ${err.message}`);
      }
    }
  }

  console.log("\n✨ Fertig.");
  if (opts.dryRun) {
    console.log("   (Dry-Run — keine Dateien geschrieben)");
  } else {
    console.log(`   Output: output/${today}/`);
  }
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});