import * as fs from "fs";
import * as path from "path";
import type { McpServer, Scope, Tool } from "../types.js";
import { configPath, detectProjectRoot } from "./paths.js";
import { toClaudeCode } from "../translators/claude-code.js";
import { toOpenCode } from "../translators/opencode.js";
import { toCline } from "../translators/cline.js";
import { toVsCode } from "../translators/vscode.js";
import { supportsScope } from "../tools.js";

function readOrInit(filePath: string): Record<string, unknown> {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function ensureDir(filePath: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

export function writeServer(
  server: McpServer,
  tool: Tool,
  scope: Scope
): void {
  if (!supportsScope(tool, scope)) return;

  const projectRoot = scope === "project" ? detectProjectRoot() : undefined;
  const filePath = configPath(tool, scope, projectRoot);
  ensureDir(filePath);

  const data = readOrInit(filePath);

  if (tool === "cline") {
    if (!data.mcpServers) data.mcpServers = {};
    (data.mcpServers as Record<string, unknown>)[server.name] = toCline(server);
  } else if (tool === "claude") {
    if (!data.mcpServers) data.mcpServers = {};
    (data.mcpServers as Record<string, unknown>)[server.name] = toClaudeCode(server);
  } else if (tool === "vscode") {
    if (!data.servers) data.servers = {};
    (data.servers as Record<string, unknown>)[server.name] = toVsCode(server);
  } else {
    if (!data.mcp) data.mcp = {};
    (data.mcp as Record<string, unknown>)[server.name] = toOpenCode(server);
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

export function removeServer(
  name: string,
  tool: Tool,
  scope: Scope
): boolean {
  if (!supportsScope(tool, scope)) return false;

  const projectRoot = scope === "project" ? detectProjectRoot() : undefined;
  const filePath = configPath(tool, scope, projectRoot);

  const data = readOrInit(filePath);

  let container: Record<string, unknown> | undefined;
  if (tool === "cline" || tool === "claude") {
    container = data.mcpServers as Record<string, unknown> | undefined;
  } else if (tool === "vscode") {
    container = data.servers as Record<string, unknown> | undefined;
  } else {
    container = data.mcp as Record<string, unknown> | undefined;
  }

  if (!container || !(name in container)) return false;

  delete container[name];

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
  return true;
}
