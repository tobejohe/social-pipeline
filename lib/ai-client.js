#!/usr/bin/env node
// ============================================================
// ai-client.js
// Abstraktionsschicht für LLM-APIs.
// Provider-Interface: generate(prompt, options) → Text
// Aktuell implementiert: Deepseek
// Vorbereitet für: Claude, OpenAI
// ============================================================

const fs = require("fs");
const path = require("path");

// Lazy-Load der Konfiguration
let _config = null;
function getConfig() {
  if (_config) return _config;
  const configPath = path.resolve(__dirname, "..", "config.json");
  if (!fs.existsSync(configPath)) {
    throw new Error(
      "config.json nicht gefunden. Kopiere config.json.example und trage deine Einstellungen ein."
    );
  }
  _config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  return _config;
}

/**
 * Lädt den API-Key aus der in config.json referenzierten Umgebungsvariable.
 * @returns {string}
 */
function getApiKey() {
  const config = getConfig();
  const envVar = config.ai.api_key_env;
  const key = process.env[envVar];
  if (!key) {
    throw new Error(
      `API-Key nicht gefunden. Setze die Umgebungsvariable ${envVar} oder lege eine .env-Datei an.`
    );
  }
  return key;
}

/**
 * Lädt den System-Prompt (Kunstfigur-Kern) aus prompts/_shared/kunstfigur-kern.md
 * @returns {string}
 */
function loadKunstfigurKern() {
  const kernPath = path.resolve(
    __dirname,
    "..",
    "prompts",
    "_shared",
    "kunstfigur-kern.md"
  );
  if (!fs.existsSync(kernPath)) {
    console.warn(
      "⚠️  kunstfigur-kern.md nicht gefunden — Kunstfigur-Prompt wird weggelassen."
    );
    return "";
  }
  return fs.readFileSync(kernPath, "utf-8").trim();
}

/**
 * Lädt ein plattformspezifisches Prompt-Template.
 * @param {string} platform - Plattform-Key
 * @returns {string}
 */
function loadPlatformPrompt(platform) {
  const promptPath = path.resolve(
    __dirname,
    "..",
    "prompts",
    `${platform}.md`
  );
  if (!fs.existsSync(promptPath)) {
    throw new Error(
      `Prompt-Template für Plattform "${platform}" nicht gefunden: ${promptPath}`
    );
  }
  return fs.readFileSync(promptPath, "utf-8").trim();
}

// ============================================================
// Deepseek Client
// ============================================================

/**
 * Sendet einen Chat-Completion-Request an die Deepseek-API.
 *
 * @param {object} params
 * @param {string} params.systemPrompt - System-Nachricht
 * @param {string} params.userPrompt - User-Nachricht
 * @param {object} [params.options] - Overrides für config.json (temperature, max_tokens)
 * @returns {Promise<string>} Antwort-Text
 */
async function deepseekGenerate({ systemPrompt, userPrompt, options = {} }) {
  const config = getConfig();
  const apiKey = getApiKey();
  const model = options.model || config.ai.model || "deepseek-chat";
  const temperature = options.temperature ?? config.ai.temperature ?? 0.8;
  const maxTokens = options.max_tokens ?? config.ai.max_tokens ?? 2000;

  const messages = [];
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: userPrompt });

  const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(
      `Deepseek API-Fehler (${response.status}): ${errBody}`
    );
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

// ============================================================
// Provider-Dispatcher
// ============================================================

/**
 * Generiert Text über den konfigurierten KI-Provider.
 *
 * @param {object} params
 * @param {string} params.platform - Plattform-Key (für Prompt-Auswahl)
 * @param {string} params.content - Der zu transformierende Content
 * @param {object} [params.meta] - Metadaten (title, date, etc.)
 * @param {object} [params.options] - Overrides für Temperatur etc.
 * @returns {Promise<string>} Transformierter Text
 */
async function generate({ platform, content, meta = {}, options = {} }) {
  const config = getConfig();
  const provider = config.ai.provider || "deepseek";

  // System-Prompt aus Kunstfigur-Kern
  const kunstfigurKern = loadKunstfigurKern();

  // Plattform-Prompt laden und mit Content befüllen
  let platformPrompt = loadPlatformPrompt(platform);

  // Platzhalter im Prompt ersetzen
  platformPrompt = platformPrompt
    .replace(/\{\{title\}\}/g, meta.title || "")
    .replace(/\{\{date\}\}/g, meta.date || new Date().toISOString().split("T")[0])
    .replace(/\{\{body\}\}/g, content)
    .replace(/\{\{hook\}\}/g, meta.hook || "")
    .replace(/\{\{max_chars\}\}/g, String(config.platforms[platform]?.max_chars || 1000))
    .replace(/\{\{tone\}\}/g, config.platforms[platform]?.tone || "");

  if (provider === "deepseek") {
    return deepseekGenerate({
      systemPrompt: kunstfigurKern,
      userPrompt: platformPrompt,
      options,
    });
  }

  // Für zukünftige Provider (Claude, OpenAI) hier erweiterbar:
  // if (provider === "claude") return claudeGenerate(...);
  // if (provider === "openai") return openaiGenerate(...);

  throw new Error(`Unbekannter KI-Provider: ${provider}`);
}

module.exports = { generate, getConfig };