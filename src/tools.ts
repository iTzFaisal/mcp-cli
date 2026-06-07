import type { Scope, Tool } from "./types.js";

export const ALL_TOOLS: Tool[] = ["claude", "opencode", "cline", "vscode", "hermes"];

export function isTool(value: string): value is Tool {
  return ALL_TOOLS.includes(value as Tool);
}

export function supportsScope(tool: Tool, scope: Scope): boolean {
  return !((tool === "cline" || tool === "hermes") && scope === "project");
}

export function unsupportedScopeMessage(tool: Tool): string {
  if (tool === "hermes") return "Hermes only supports user scope.";
  return "Cline only supports user scope.";
}

export function toolLabel(tool: Tool): string {
  if (tool === "claude") return "Claude Code";
  if (tool === "opencode") return "OpenCode";
  if (tool === "cline") return "Cline";
  if (tool === "hermes") return "Hermes";
  return "VS Code";
}
