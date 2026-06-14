#!/usr/bin/env node
// ============================================================
// content-resolver.js
// Löst Content-Quellen auf: Rohtext, URL (fetch), Dateipfad.
// Normalisiert zu { title, body, source_type, raw }
// ============================================================

const fs = require("fs");
const path = require("path");
const { parseFrontmatter, extractExcerpt, slugFromFilename } = require("./frontmatter");

/**
 * Liest Content von einer URL (fetch HTML/Markdown).
 * Versucht Markdown zu erkennen, sonst wird der Body-Text extrahiert.
 *
 * @param {string} url - URL zum Content
 * @returns {Promise<{ title: string, body: string, source_type: string, raw: string }>}
 */
async function resolveUrl(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`URL konnte nicht geladen werden (${response.status}): ${url}`);
  }

  const contentType = response.headers.get("content-type") || "";
  const raw = await response.text();

  let title = "";
  let body = raw;

  if (contentType.includes("text/html") || raw.includes("<html")) {
    // Einfache HTML-Title-Extraktion
    const titleMatch = raw.match(/<title>([^<]+)<\/title>/i);
    title = titleMatch ? titleMatch[1].trim() : "";
    // Body: grob Text extrahieren (kein vollwertiger HTML-Parser)
    body = raw
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Falls Markdown: Frontmatter parsen
  const { meta, content } = parseFrontmatter(body);
  if (meta.title) title = meta.title;
  body = content;

  return { title, body, source_type: "url", raw };
}

/**
 * Liest Content aus einer lokalen Datei.
 *
 * @param {string} filePath - Absoluter oder relativer Pfad zur Datei
 * @returns {{ title: string, body: string, source_type: string, raw: string }}
 */
function resolveFile(filePath) {
  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(process.cwd(), filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Datei nicht gefunden: ${absolutePath}`);
  }

  const raw = fs.readFileSync(absolutePath, "utf-8");
  const { meta, content } = parseFrontmatter(raw);

  const title =
    meta.title ||
    // Versuche erste #-Überschrift zu finden
    (() => {
      const h1Match = content.match(/^#\s+(.+)$/m);
      return h1Match ? h1Match[1].trim() : slugFromFilename(path.basename(filePath));
    })();

  const filename = path.basename(filePath);

  return {
    title,
    body: content,
    hook: meta.hook || extractExcerpt(content, 100),
    source_type: "file",
    source_path: absolutePath,
    filename,
    slug: meta.slug || slugFromFilename(filename),
    date: meta.date || null,
    raw,
    meta, // Gesamtes Frontmatter mitgeben
  };
}

/**
 * Verarbeitet Rohtext (z.B. direkt aus Cline-Chat).
 *
 * @param {string} text - Roher Text (kann Frontmatter enthalten)
 * @returns {{ title: string, body: string, source_type: string, raw: string }}
 */
function resolveText(text) {
  const { meta, content } = parseFrontmatter(text);

  // Titel: Frontmatter > erste #-Überschrift > erste Zeile > "Ohne Titel"
  let title = meta.title || "";
  if (!title) {
    const h1Match = content.match(/^#\s+(.+)$/m);
    title = h1Match
      ? h1Match[1].trim()
      : content.split("\n")[0].trim().substring(0, 80) || "Ohne Titel";
  }

  return {
    title,
    body: content,
    hook: meta.hook || extractExcerpt(content, 100),
    source_type: "text",
    slug: meta.slug || slugify(title),
    date: meta.date || null,
    raw: text,
    meta,
  };
}

/**
 * Einfache Slug-Erzeugung aus Text.
 * @param {string} text
 * @returns {string}
 */
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[ä]/g, "ae")
    .replace(/[ö]/g, "oe")
    .replace(/[ü]/g, "ue")
    .replace(/[ß]/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 60);
}

module.exports = { resolveUrl, resolveFile, resolveText };