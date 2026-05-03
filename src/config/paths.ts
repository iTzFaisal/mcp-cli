import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import type { Scope, Tool } from "../types.js";

function home(): string {
  return os.homedir();
}

export function claudeUserPath(): string {
  return path.join(home(), ".claude.json");
}

export function opencodeUserPath(): string {
  return path.join(home(), ".config", "opencode", "opencode.json");
}

export function vscodeUserPath(): string {
  const platform = process.platform;
  if (platform === "win32") {
    return path.join(
      process.env.APPDATA ?? path.join(home(), "AppData", "Roaming"),
      "Code",
      "User",
      "mcp.json"
    );
  }
  if (platform === "linux") {
    return path.join(home(), ".config", "Code", "User", "mcp.json");
  }
  return path.join(home(), "Library", "Application Support", "Code", "User", "mcp.json");
}

export function claudeProjectPath(projectRoot: string): string {
  return path.join(projectRoot, ".mcp.json");
}

export function opencodeProjectPath(projectRoot: string): string {
  return path.join(projectRoot, "opencode.json");
}

export function vscodeProjectPath(projectRoot: string): string {
  return path.join(projectRoot, ".vscode", "mcp.json");
}

export function clineUserPath(): string {
  const platform = process.platform;
  if (platform === "win32") {
    return path.join(
      process.env.APPDATA ?? path.join(home(), "AppData", "Roaming"),
      "Code",
      "User",
      "globalStorage",
      "saoudrizwan.claude-dev",
      "settings",
      "cline_mcp_settings.json"
    );
  }
  if (platform === "linux") {
    return path.join(
      home(),
      ".config",
      "Code",
      "User",
      "globalStorage",
      "saoudrizwan.claude-dev",
      "settings",
      "cline_mcp_settings.json"
    );
  }
  return path.join(
    home(),
    "Library",
    "Application Support",
    "Code",
    "User",
    "globalStorage",
    "saoudrizwan.claude-dev",
    "settings",
    "cline_mcp_settings.json"
  );
}

export function configPath(tool: Tool, scope: Scope, projectRoot?: string): string {
  if (tool === "cline") {
    return clineUserPath();
  }
  if (tool === "claude") {
    return scope === "user" ? claudeUserPath() : claudeProjectPath(projectRoot ?? detectProjectRoot());
  }
  if (tool === "vscode") {
    return scope === "user" ? vscodeUserPath() : vscodeProjectPath(projectRoot ?? detectProjectRoot());
  }
  return scope === "user" ? opencodeUserPath() : opencodeProjectPath(projectRoot ?? detectProjectRoot());
}

export function detectProjectRoot(): string {
  let dir = process.cwd();
  const root = path.parse(dir).root;

  while (dir !== root) {
    if (fs.existsSync(path.join(dir, ".git"))) {
      return dir;
    }
    dir = path.dirname(dir);
  }

  return process.cwd();
}
