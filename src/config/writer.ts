import * as fs from "fs";
import * as path from "path";
import type { McpServer, Scope, Tool } from "../types.js";
import { configPath, detectProjectRoot } from "./paths.js";
import { toClaudeCode } from "../translators/claude-code.js";
import { toOpenCode } from "../translators/opencode.js";

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
  const projectRoot = scope === "project" ? detectProjectRoot() : undefined;
  const filePath = configPath(tool, scope, projectRoot);
  ensureDir(filePath);

  const data = readOrInit(filePath);

  if (tool === "claude") {
    if (!data.mcpServers) data.mcpServers = {};
    (data.mcpServers as Record<string, unknown>)[server.name] = toClaudeCode(server);
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
  const projectRoot = scope === "project" ? detectProjectRoot() : undefined;
  const filePath = configPath(tool, scope, projectRoot);

  const data = readOrInit(filePath);

  let container: Record<string, unknown> | undefined;
  if (tool === "claude") {
    container = data.mcpServers as Record<string, unknown> | undefined;
  } else {
    container = data.mcp as Record<string, unknown> | undefined;
  }

  if (!container || !(name in container)) return false;

  delete container[name];

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
  return true;
}
