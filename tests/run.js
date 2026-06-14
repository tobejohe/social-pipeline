#!/usr/bin/env node
// ============================================================
// tests/run.js — Basis-Tests für die Social-Pipeline
// ============================================================

const fs = require("fs");
const path = require("path");
const {
  parseFrontmatter,
  extractExcerpt,
  slugFromFilename,
} = require("../lib/frontmatter");
const { render } = require("../lib/template-engine");
const { resolveFile, resolveText } = require("../lib/content-resolver");

let passed = 0;
let failed = 0;

function assert(description, condition) {
  if (condition) {
    console.log(`✅ ${description}`);
    passed++;
  } else {
    console.log(`❌ ${description}`);
    failed++;
  }
}

// ============================================================
// Frontmatter
// ============================================================

console.log("\n📋 Frontmatter-Parser");

const mdWithFM = `---
title: Test-Titel
date: 2026-06-14
---
# Content`;

const { meta, content } = parseFrontmatter(mdWithFM);
assert("title wird geparst", meta.title === "Test-Titel");
assert("date wird geparst", meta.date === "2026-06-14");
assert("content enthält # Überschrift", content.includes("# Content"));
assert("content enthält kein Frontmatter", !content.includes("---"));

const mdWithoutFM = `# Nur Content`;
const noFm = parseFrontmatter(mdWithoutFM);
assert("kein Frontmatter → leerer meta", Object.keys(noFm.meta).length === 0);
assert("kein Frontmatter → content bleibt", noFm.content === mdWithoutFM);

// ============================================================
// Excerpt
// ============================================================

console.log("\n📋 Excerpt");

const longText =
  "Das ist ein sehr langer Text mit vielen Wörtern der einfach zu lang ist für einen Auszug.";
const excerpt = extractExcerpt(longText, 30);
assert("Excerpt ist kürzer als Original", excerpt.length <= 30 + 3); // +3 für …
assert("Excerpt endet mit …", excerpt.endsWith("…"));

// ============================================================
// Slug
// ============================================================

console.log("\n📋 Slug-Extraktion");

assert("Entfernt YYYY-MM-DD-", slugFromFilename("2026-06-14-doenerbude.md") === "doenerbude");
assert("Behält Slug ohne Datum", slugFromFilename("doenerbude.md") === "doenerbude");
assert("Mehrere Bindestriche", slugFromFilename("2026-01-01-ein-langer-slug.md") === "ein-langer-slug");

// ============================================================
// Template-Engine
// ============================================================

console.log("\n📋 Template-Engine");

const tmpl = "{{title}}: {{body}}. {{unknown}}";
const result = render(tmpl, { title: "Hallo", body: "Welt" });
assert("Platzhalter werden ersetzt", result === "Hallo: Welt. {{unknown}}");
assert("Unbekannte Platzhalter bleiben", result.includes("{{unknown}}"));

// ============================================================
// Content-Resolver
// ============================================================

console.log("\n📋 Content-Resolver");

const resolved = resolveText("---\ntitle: Test\n---\n# Inhalt");
assert("Text mit Frontmatter: title", resolved.title === "Test");
assert("Text mit Frontmatter: body", resolved.body.includes("# Inhalt"));
assert("Text source_type", resolved.source_type === "text");
assert("Slug erzeugt", resolved.slug.length > 0);

// Datei-Resolver testen
const testPostPath = path.resolve(
  __dirname,
  "..",
  "posts",
  "2026-06-14-test-erster-social-post.md"
);
if (fs.existsSync(testPostPath)) {
  const fileResolved = resolveFile(testPostPath);
  assert("File-Resolver: title", fileResolved.title === "Die Bio-Lüge");
  assert("File-Resolver: source_type", fileResolved.source_type === "file");
  assert("File-Resolver: slug", fileResolved.slug === "die-bio-luege");
  assert("File-Resolver: body enthält Inhalt", fileResolved.body.length > 0);
} else {
  console.log("⚠️  Test-Post nicht gefunden, File-Resolver-Tests übersprungen.");
}

// ============================================================
// AI-Client-Konfigurationsprüfung (ohne API-Key)
// ============================================================

console.log("\n📋 AI-Client-Konfiguration");

const configPath = path.resolve(__dirname, "..", "config.json");
const configExamplePath = path.resolve(__dirname, "..", "config.json.example");

assert("config.json.example existiert", fs.existsSync(configExamplePath));

if (!fs.existsSync(configPath)) {
  console.log("⚠️  config.json nicht vorhanden (wird für KI-Modus benötigt)");
} else {
  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  assert("config hat active_platforms", Array.isArray(config.active_platforms));
  assert("config hat ai-Config", config.ai && config.ai.provider);
  assert("config hat platforms", config.platforms && Object.keys(config.platforms).length > 0);
}

// ============================================================
// Prompt-Dateien-Prüfung
// ============================================================

console.log("\n📋 Prompt-Dateien");

const promptsDir = path.resolve(__dirname, "..", "prompts");
assert("prompts/_shared/kunstfigur-kern.md", fs.existsSync(path.join(promptsDir, "_shared", "kunstfigur-kern.md")));
assert("prompts/telegram.md", fs.existsSync(path.join(promptsDir, "telegram.md")));
assert("prompts/youtube-community.md", fs.existsSync(path.join(promptsDir, "youtube-community.md")));

// ============================================================
// Template-Dateien-Prüfung
// ============================================================

console.log("\n📋 Fallback-Templates");

const tmplDir = path.resolve(__dirname, "..", "templates");
assert("templates/telegram.txt", fs.existsSync(path.join(tmplDir, "telegram.txt")));
assert("templates/youtube-community.txt", fs.existsSync(path.join(tmplDir, "youtube-community.txt")));

// ============================================================
// Ergebnis
// ============================================================

console.log(`\n${"═".repeat(40)}`);
console.log(`Ergebnis: ${passed} bestanden, ${failed} fehlgeschlagen`);
if (failed > 0) {
  process.exit(1);
}