#!/usr/bin/env node
// ============================================================
// template-engine.js
// Einfaches String-Template-System mit {{placeholder}}-Syntax.
// Regelbasierter Fallback, wenn KI deaktiviert oder nicht verfügbar.
// ============================================================

const fs = require("fs");
const path = require("path");

const TEMPLATES_DIR = path.resolve(__dirname, "..", "templates");

/**
 * Rendert ein Template, indem {{placeholder}} durch Werte aus dem
 * data-Objekt ersetzt werden.
 *
 * @param {string} template - Template-String mit {{placeholders}}
 * @param {Record<string, string>} data - Key-Value-Map für Platzhalter
 * @returns {string} Gerenderter Text
 */
function render(template, data) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return data[key] !== undefined ? data[key] : `{{${key}}}`;
  });
}

/**
 * Lädt eine Template-Datei für eine gegebene Plattform und rendert sie.
 *
 * @param {string} platform - Plattform-Key (z.B. "telegram", "youtube-community")
 * @param {Record<string, string>} data - Daten für Platzhalter
 * @returns {string} Gerenderter Text
 */
function renderPlatform(platform, data) {
  const templatePath = path.join(TEMPLATES_DIR, `${platform}.txt`);

  if (!fs.existsSync(templatePath)) {
    throw new Error(
      `Template für Plattform "${platform}" nicht gefunden: ${templatePath}`
    );
  }

  const template = fs.readFileSync(templatePath, "utf-8");
  return render(template, data);
}

module.exports = { render, renderPlatform };