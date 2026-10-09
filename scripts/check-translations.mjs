#!/usr/bin/env node

import * as NodeFS from "node:fs";
import * as NodePath from "node:path";
import * as NodeURL from "node:url";

const repoRoot = NodePath.dirname(NodePath.dirname(NodeURL.fileURLToPath(import.meta.url)));
const localeDirectory = NodePath.join(repoRoot, "apps/web/src/i18n/locales");
const englishPath = NodePath.join(localeDirectory, "en.json");
const chinesePath = NodePath.join(localeDirectory, "zh-CN.json");
const chineseSourceTextPath = NodePath.join(localeDirectory, "zh-CN-text.json");
const sourceDirectory = NodePath.join(repoRoot, "apps/web/src");
const errors = [];
const pendingTranslations = [];

function readLocale(path) {
  const source = NodeFS.readFileSync(path, "utf8");
  const seen = new Set();
  for (const [index, line] of source.split(/\r?\n/u).entries()) {
    const match = /^\s*"((?:[^"\\]|\\.)+)"\s*:/u.exec(line);
    if (!match) continue;
    const key = JSON.parse(`"${match[1]}"`);
    if (seen.has(key)) errors.push(`${path}:${index + 1}: duplicate locale key ${key}`);
    seen.add(key);
  }
  return JSON.parse(source);
}

function collectSourceFiles(directory) {
  const files = [];
  for (const entry of NodeFS.readdirSync(directory, { withFileTypes: true })) {
    const path = NodePath.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...collectSourceFiles(path));
    else if (/\.tsx?$/u.test(entry.name)) files.push(path);
  }
  return files;
}

const english = readLocale(englishPath);
const chinese = readLocale(chinesePath);
const chineseSourceText = readLocale(chineseSourceTextPath);
const pendingSourceTranslations = [];
const englishKeys = new Set(Object.keys(english));
const chineseKeys = new Set(Object.keys(chinese));

for (const key of englishKeys) {
  if (!chineseKeys.has(key)) errors.push(`zh-CN.json is missing ${key}`);
}
for (const key of chineseKeys) {
  if (!englishKeys.has(key)) errors.push(`zh-CN.json contains unknown key ${key}`);
}

const placeholders = (message) =>
  [...message.matchAll(/\{([^{}]+)\}/gu)].map((match) => match[1]).sort();
for (const key of englishKeys) {
  const englishValue = english[key];
  const chineseValue = chinese[key];
  if (typeof englishValue !== "string" || typeof chineseValue !== "string") {
    errors.push(`${key} must have string values in both locale files`);
    continue;
  }
  if (englishValue.trim().length === 0 || chineseValue.trim().length === 0) {
    errors.push(`${key} has an empty translation`);
  }
  if (JSON.stringify(placeholders(englishValue)) !== JSON.stringify(placeholders(chineseValue))) {
    errors.push(`${key} has mismatched interpolation placeholders`);
  }
  if (englishValue === chineseValue) pendingTranslations.push(key);
}
for (const [sourceText, chineseValue] of Object.entries(chineseSourceText)) {
  if (
    typeof chineseValue !== "string" ||
    sourceText.trim().length === 0 ||
    chineseValue.trim().length === 0
  ) {
    errors.push(
      `source phrase ${JSON.stringify(sourceText)} must have a non-empty string translation`,
    );
    continue;
  }
  if (JSON.stringify(placeholders(sourceText)) !== JSON.stringify(placeholders(chineseValue))) {
    errors.push(
      `source phrase ${JSON.stringify(sourceText)} has mismatched interpolation placeholders`,
    );
  }
  if (sourceText === chineseValue) pendingSourceTranslations.push(sourceText);
}

const sourceFiles = collectSourceFiles(sourceDirectory);
const sourcePhraseKeys = new Set(Object.keys(chineseSourceText));
const referencedKeys = new Map();
// Technical values and illustrative examples intentionally remain unchanged.
const untranslatedSettingsAttributes = new Set([
  "/path/to/checkout",
  "22",
  "Mac mini",
  "PAIRCODE",
  "VARIABLE_NAME",
  "backend.example.com",
  "https://api.example.com",
  "https://hub.example.ts.net:8318",
  "optionId",
  "root",
  "user@host or SSH alias",
  "you@example.com",
]);
for (const path of sourceFiles) {
  const contents = NodeFS.readFileSync(path, "utf8");
  for (const match of contents.matchAll(
    /<(?:SettingsRow|SettingsSection|SettingsGroup)\b([\s\S]*?)(?:\s*\/?>)/gu,
  )) {
    for (const attribute of match[1].matchAll(/\b(?:title|description)="([^"]+)"/gu)) {
      if (!sourcePhraseKeys.has(attribute[1])) {
        errors.push(
          `untranslated settings label ${JSON.stringify(attribute[1])} (${NodePath.relative(repoRoot, path)})`,
        );
      }
    }
  }
  if (
    NodePath.relative(sourceDirectory, path)
      .replaceAll("\\", "/")
      .startsWith("components/settings/") &&
    !/\.test\.tsx?$/u.test(path)
  ) {
    for (const attribute of contents.matchAll(/\b(?:aria-label|placeholder)="([^"]+)"/gu)) {
      if (
        !sourcePhraseKeys.has(attribute[1]) &&
        !untranslatedSettingsAttributes.has(attribute[1])
      ) {
        errors.push(
          `untranslated settings accessibility label or placeholder ${JSON.stringify(attribute[1])} (${NodePath.relative(repoRoot, path)})`,
        );
      }
    }
  }
  for (const match of contents.matchAll(/\btText\(\s*["']([^"']+)["']/gu)) {
    if (!sourcePhraseKeys.has(match[1])) {
      errors.push(
        `unregistered literal source phrase ${JSON.stringify(match[1])} (${NodePath.relative(repoRoot, path)})`,
      );
    }
  }
  for (const match of contents.matchAll(/\bt\(\s*["']([^"']+)["']/gu)) {
    const key = match[1];
    const locations = referencedKeys.get(key) ?? [];
    locations.push(
      `${NodePath.relative(repoRoot, path)}:${contents.slice(0, match.index).split("\n").length}`,
    );
    referencedKeys.set(key, locations);
  }
}
for (const [key, locations] of referencedKeys) {
  if (!englishKeys.has(key))
    errors.push(`unregistered message key ${key} (used at ${locations.join(", ")})`);
}

const lines = [
  `## Translation status`,
  `- English keys: ${englishKeys.size}`,
  `- Simplified Chinese keys: ${chineseKeys.size}`,
  `- Referenced translation keys: ${referencedKeys.size}`,
  `- Literal source phrases: ${Object.keys(chineseSourceText).length}`,
  `- Pending translations identical to English: ${pendingTranslations.length + pendingSourceTranslations.length}`,
];
if (pendingTranslations.length + pendingSourceTranslations.length > 0) {
  lines.push(
    "",
    "### Pending translations",
    ...pendingTranslations.map((key) => `- \`${key}\``),
    ...pendingSourceTranslations.map((sourceText) => `- ${JSON.stringify(sourceText)}`),
  );
}
if (errors.length > 0) {
  lines.push("", "### Translation checks failed", ...errors.map((error) => `- ${error}`));
}
const report = `${lines.join("\n")}\n`;
console.log(report);
if (process.env.GITHUB_STEP_SUMMARY) {
  NodeFS.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${report}\n`, "utf8");
}

if (errors.length > 0) process.exitCode = 1;
