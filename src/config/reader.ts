import * as fs from "fs";
import type { McpServer, Scope, Tool, LocatedServer } from "../types.js";
import { configPath, detectProjectRoot } from "./paths.js";
import { fromClaudeCode } from "../translators/claude-code.js";
import { fromOpenCode } from "../translators/opencode.js";
import { fromCline } from "../translators/cline.js";
import { fromVsCode } from "../translators/vscode.js";
import { ALL_TOOLS, supportsScope } from "../tools.js";

function readJsonFile(filePath: string): Record<string, unknown> | null {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function readClaudeServers(scope: Scope): McpServer[] {
  const projectRoot = scope === "project" ? detectProjectRoot() : undefined;
  const filePath = configPath("claude", scope, projectRoot);
  const data = readJsonFile(filePath);
  if (!data) return [];

  const raw = data.mcpServers as Record<string, unknown> | undefined;
  if (!raw) return [];

  return Object.entries(raw).map(([name, val]) =>
    fromClaudeCode(name, val as Parameters<typeof fromClaudeCode>[1])
  );
}

function readOpenCodeServers(scope: Scope): McpServer[] {
  const projectRoot = scope === "project" ? detectProjectRoot() : undefined;
  const filePath = configPath("opencode", scope, projectRoot);
  const data = readJsonFile(filePath);
  if (!data) return [];

  const raw = data.mcp as Record<string, unknown> | undefined;
  if (!raw) return [];

  return Object.entries(raw).map(([name, val]) =>
    fromOpenCode(name, val as Parameters<typeof fromOpenCode>[1])
  );
}

function readClineServers(): McpServer[] {
  const filePath = configPath("cline", "user");
  const data = readJsonFile(filePath);
  if (!data) return [];

  const raw = data.mcpServers as Record<string, unknown> | undefined;
  if (!raw) return [];

  return Object.entries(raw).map(([name, val]) =>
    fromCline(name, val as Parameters<typeof fromCline>[1])
  );
}

function readVsCodeServers(scope: Scope): McpServer[] {
  const projectRoot = scope === "project" ? detectProjectRoot() : undefined;
  const filePath = configPath("vscode", scope, projectRoot);
  const data = readJsonFile(filePath);
  if (!data) return [];

  const raw = data.servers as Record<string, unknown> | undefined;
  if (!raw) return [];

  return Object.entries(raw).map(([name, val]) =>
    fromVsCode(name, val as Parameters<typeof fromVsCode>[1])
  );
}

export function readServers(
  tool?: Tool,
  scope?: Scope
): LocatedServer[] {
  const tools: Tool[] = tool ? [tool] : ALL_TOOLS;
  const scopes: Scope[] = scope ? [scope] : ["user", "project"];
  const results: LocatedServer[] = [];

  for (const t of tools) {
    for (const s of scopes) {
      if (!supportsScope(t, s)) continue;

      let servers: McpServer[];
      if (t === "cline") {
        servers = readClineServers();
      } else if (t === "claude") {
        servers = readClaudeServers(s);
      } else if (t === "vscode") {
        servers = readVsCodeServers(s);
      } else {
        servers = readOpenCodeServers(s);
      }
      for (const server of servers) {
        results.push({ server, tool: t, scope: s });
      }
    }
  }

  return results;
}
