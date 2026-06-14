#!/usr/bin/env node
// ============================================================
// frontmatter.js
// Parst YAML-Frontmatter aus Markdown-Dateien.
// Basiert auf dem Pattern aus website-tobiashecht-de/sync-to-cloudflare.js
// ============================================================

/**
 * Parst YAML-artiges Frontmatter (--- Blöcke) aus einem Markdown-String.
 * Unterstützt einfache Key: Value-Paare (kein volles YAML).
 *
 * @param {string} md - Roher Markdown-String
 * @returns {{ meta: Record<string, string>, content: string }}
 */
function parseFrontmatter(md) {
  const match = md.match(/^---\n([\s\S]*?)\n---\n*([\s\S]*)$/);
  if (!match) return { meta: {}, content: md };

  const yamlBlock = match[1];
  const content = match[2];
  const meta = {};

  yamlBlock.split("\n").forEach((line) => {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) return;
    const key = line.substring(0, colonIdx).trim();
    let value = line.substring(colonIdx + 1).trim();

    // Strip surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    meta[key] = value;
  });

  return { meta, content };
}

/**
 * Extrahiert einen kurzen Excerpt aus Markdown-Content.
 *
 * @param {string} md - Markdown-String (ohne Frontmatter)
 * @param {number} maxLen - Maximale Länge des Excerpts
 * @returns {string}
 */
function extractExcerpt(md, maxLen = 200) {
  let text = md.replace(/^---[\s\S]*?---\n*/, "");
  text = text
    .replace(/[#*`>\[\]!()]/g, "")
    .replace(/\n+/g, " ")
    .trim();
  if (text.length > maxLen) {
    text = text.substring(0, maxLen).replace(/\s+\S*$/, "") + "…";
  }
  return text;
}

/**
 * Extrahiert einen Slug aus einem Dateinamen.
 * Entfernt das Datums-Präfix (YYYY-MM-DD-) falls vorhanden.
 *
 * @param {string} filename - Dateiname (z.B. "2026-06-14-doenerbude.md")
 * @returns {string}
 */
function slugFromFilename(filename) {
  const basename = filename.replace(/\.md$/, "");
  return basename.replace(/^\d{4}-\d{2}-\d{2}-/, "");
}

module.exports = { parseFrontmatter, extractExcerpt, slugFromFilename };