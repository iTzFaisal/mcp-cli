import * as fs from "fs";
import { fromClaudeCode, type ClaudeCodeServer } from "../translators/claude-code.js";
import type { McpServer } from "../types.js";

interface BundledCatalog {
  mcpServers?: Record<string, ClaudeCodeServer>;
}

let cachedPresets: Map<string, McpServer> | undefined;
let bundledPresetCatalogUrl = new URL("./mcp-presets.json", import.meta.url);

export function findBundledPreset(name: string): McpServer | undefined {
  const preset = loadBundledPresets().get(normalizePresetName(name));
  if (!preset) return undefined;

  return {
    ...preset,
    name,
    ...(preset.command && { command: [...preset.command] }),
    ...(preset.env && { env: { ...preset.env } }),
    ...(preset.headers && { headers: { ...preset.headers } }),
  };
}

export function resetBundledPresetCache(): void {
  cachedPresets = undefined;
}

export function setBundledPresetCatalogUrlForTest(url: URL): void {
  bundledPresetCatalogUrl = url;
  cachedPresets = undefined;
}

function loadBundledPresets(): Map<string, McpServer> {
  if (cachedPresets) return cachedPresets;

  try {
    const content = fs.readFileSync(bundledPresetCatalogUrl, "utf-8");
    const parsed = JSON.parse(content) as BundledCatalog;
    const rawServers = parsed.mcpServers;

    if (!rawServers || typeof rawServers !== "object") {
      cachedPresets = new Map();
      return cachedPresets;
    }

    cachedPresets = new Map(
      Object.entries(rawServers).map(([name, raw]) => [
        normalizePresetName(name),
        fromClaudeCode(name, raw),
      ]),
    );
  } catch {
    cachedPresets = new Map();
  }

  return cachedPresets;
}

function normalizePresetName(name: string): string {
  return name.trim().toLowerCase();
}
