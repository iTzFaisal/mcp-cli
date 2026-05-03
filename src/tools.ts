import type { Scope, Tool } from "./types.js";

export const ALL_TOOLS: Tool[] = ["claude", "opencode", "cline", "vscode"];

export function supportsScope(tool: Tool, scope: Scope): boolean {
  return !(tool === "cline" && scope === "project");
}

export function toolLabel(tool: Tool): string {
  if (tool === "claude") return "Claude Code";
  if (tool === "opencode") return "OpenCode";
  if (tool === "cline") return "Cline";
  return "VS Code";
}
