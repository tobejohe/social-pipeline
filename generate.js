#!/usr/bin/env node
// ============================================================
// generate.js — Social-Pipeline Orchestrator (CLINE-gesteuert)
// Bereitet Content + Prompts vor. CLINE führt die KI-
// Transformation mit seinem eigenen LLM-Key aus und schreibt
// die Output-Dateien.
// ============================================================

const fs = require("fs");
const path = require("path");
const { resolveUrl, resolveFile, resolveText } = require("./lib/content-resolver");

const ROOT = path.resolve(__dirname);

// ============================================================
// Konfiguration laden
// ============================================================

let _config = null;
function getConfig() {
  if (_config) return _config;
  const configPath = path.join(ROOT, "config.json");
  if (!fs.existsSync(configPath)) {
    console.error("❌ config.json nicht gefunden.");
    console.error("   Kopiere config.json.example → config.json.");
    process.exit(1);
  }
  _config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  return _config;
}

// ============================================================
// Prompt-Dateien laden
// ============================================================

function loadPrompt(name) {
  const promptPath = path.join(ROOT, "prompts", name);
  if (!fs.existsSync(promptPath)) {
    console.error(`❌ Prompt nicht gefunden: prompts/${name}`);
    process.exit(1);
  }
  return fs.readFileSync(promptPath, "utf-8").trim();
}

// ============================================================
// CLI
// ============================================================

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { input: null, url: null, file: null, platforms: null };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--text": case "--input":
        opts.input = args[++i] || ""; break;
      case "--url":
        opts.url = args[++i] || ""; break;
      case "--file":
        opts.file = args[++i] || ""; break;
      case "--platforms":
        opts.platforms = (args[++i] || "").split(",").map(s => s.trim()); break;
      case "--help": case "-h":
        console.log(`Social-Pipeline — CLINE-gesteuerte Content-Transformation

  node generate.js --file posts/2026-06-14-slug.md
  node generate.js --text "Mein Text" --platforms telegram,linkedin
  node generate.js --url https://...

Output: output/YYYY-MM-DD/plattform-slug.txt`);
        process.exit(0);
    }
  }
  return opts;
}

// ============================================================
// Haupt-Logik: Content laden + Arbeitsanweisung für CLINE bauen
// ============================================================

async function main() {
  const opts = parseArgs();
  const config = getConfig();
  const platforms = opts.platforms || config.active_platforms || [];

  // Content auflösen
  let content;
  if (opts.input) content = resolveText(opts.input);
  else if (opts.url) content = await resolveUrl(opts.url);
  else if (opts.file) content = resolveFile(opts.file);
  else {
    console.error("❌ Keine Content-Quelle. Nutze --text, --url oder --file.");
    process.exit(1);
  }

  // Kunstfigur-Kern laden
  const kunstfigurKern = loadPrompt("_shared/kunstfigur-kern.md");

  // Für jede Plattform: Prompt bauen und ausgeben
  console.log("══════════════════════════════════════════════════════");
  console.log("  CLINE-ARBEITSAUFTRAG: Social-Pipeline");
  console.log("══════════════════════════════════════════════════════\n");

  console.log(`📥 Content: "${content.title}"`);
  console.log(`   Slug:    ${content.slug}`);
  console.log(`   Länge:   ${content.body.length} Zeichen`);
  console.log(`   Quelle:  ${content.source_type}\n`);

  const today = new Date().toISOString().split("T")[0];

  for (const platform of platforms) {
    const platformConfig = config.platforms[platform];
    if (!platformConfig) {
      console.warn(`⚠️  Plattform "${platform}" nicht in config.json — übersprungen.\n`);
      continue;
    }

    let platformPrompt = loadPrompt(`${platform}.md`);
    platformPrompt = platformPrompt
      .replace(/\{\{title\}\}/g, content.title)
      .replace(/\{\{body\}\}/g, content.body)
      .replace(/\{\{hook\}\}/g, content.hook || "")
      .replace(/\{\{max_chars\}\}/g, String(platformConfig.max_chars))
      .replace(/\{\{tone\}\}/g, platformConfig.tone)
      .replace(/\{\{date\}\}/g, content.date || today);

    console.log(`┌─────────────────────────────────────────────────────`);
    console.log(`│ PLATTFORM: ${platform} (max. ${platformConfig.max_chars} Zeichen)`);
    console.log(`│ Tonalität: ${platformConfig.tone}`);
    console.log(`│ Output:    output/${today}/${platform}-${content.slug}.txt`);
    console.log(`├─────────────────────────────────────────────────────`);
    console.log(`│ SYSTEM-PROMPT (Kunstfigur-Kern):`);
    console.log(`│   ${kunstfigurKern.replace(/\n/g, "\n│   ")}`);
    console.log(`├─────────────────────────────────────────────────────`);
    console.log(`│ USER-PROMPT (Plattform-Aufgabe):`);
    console.log(`│   ${platformPrompt.replace(/\n/g, "\n│   ")}`);
    console.log(`├─────────────────────────────────────────────────────`);
    console.log(`│ CONTENT (Body):`);
    console.log(`│   ${content.body.replace(/\n/g, "\n│   ")}`);
    console.log(`└─────────────────────────────────────────────────────\n`);
  }

  console.log("══════════════════════════════════════════════════════");
  console.log("  ANWEISUNG AN CLINE:");
  console.log("══════════════════════════════════════════════════════");
  console.log("");
  console.log("1. Nimm für jede Plattform den SYSTEM-PROMPT + USER-PROMPT + CONTENT");
  console.log("2. Führe die Transformation mit deinem LLM aus");
  console.log("3. Schreibe das Ergebnis in die angegebene Output-Datei");
  console.log("4. Halte das Zeichenlimit strikt ein");
  console.log("5. Kein Fallback — wenn das Modell versagt, zeige die Fehlermeldung");
  console.log("");
  console.log(`Output-Verzeichnis: output/${today}/`);
}

main().catch(err => {
  console.error("❌", err.message);
  process.exit(1);
});