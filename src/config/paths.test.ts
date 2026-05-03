import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import {
  claudeUserPath,
  opencodeUserPath,
  vscodeUserPath,
  claudeProjectPath,
  opencodeProjectPath,
  vscodeProjectPath,
  configPath,
  detectProjectRoot,
} from "./paths.js";

describe("claudeUserPath", () => {
  it("returns ~/.claude.json", () => {
    const result = claudeUserPath();
    expect(result).toBe(path.join(os.homedir(), ".claude.json"));
  });
});

describe("opencodeUserPath", () => {
  it("returns ~/.config/opencode/opencode.json", () => {
    const result = opencodeUserPath();
    expect(result).toBe(
      path.join(os.homedir(), ".config", "opencode", "opencode.json")
    );
  });
});

describe("vscodeUserPath", () => {
  const platformDescriptor = Object.getOwnPropertyDescriptor(process, "platform");

  afterEach(() => {
    if (platformDescriptor) {
      Object.defineProperty(process, "platform", platformDescriptor);
    }
  });

  it("returns macOS VS Code MCP path", () => {
    Object.defineProperty(process, "platform", { value: "darwin" });
    expect(vscodeUserPath()).toBe(
      path.join(os.homedir(), "Library", "Application Support", "Code", "User", "mcp.json")
    );
  });

  it("returns Linux VS Code MCP path", () => {
    Object.defineProperty(process, "platform", { value: "linux" });
    expect(vscodeUserPath()).toBe(
      path.join(os.homedir(), ".config", "Code", "User", "mcp.json")
    );
  });

  it("returns Windows VS Code MCP path", () => {
    Object.defineProperty(process, "platform", { value: "win32" });
    vi.stubEnv("APPDATA", "C:\\Users\\test\\AppData\\Roaming");
    expect(vscodeUserPath()).toBe(
      path.join("C:\\Users\\test\\AppData\\Roaming", "Code", "User", "mcp.json")
    );
    vi.unstubAllEnvs();
  });
});

describe("claudeProjectPath", () => {
  it("returns .mcp.json in project root", () => {
    const result = claudeProjectPath("/tmp/myproject");
    expect(result).toBe(path.join("/tmp/myproject", ".mcp.json"));
  });
});

describe("opencodeProjectPath", () => {
  it("returns opencode.json in project root", () => {
    const result = opencodeProjectPath("/tmp/myproject");
    expect(result).toBe(path.join("/tmp/myproject", "opencode.json"));
  });
});

describe("vscodeProjectPath", () => {
  it("returns .vscode/mcp.json in project root", () => {
    const result = vscodeProjectPath("/tmp/myproject");
    expect(result).toBe(path.join("/tmp/myproject", ".vscode", "mcp.json"));
  });
});

describe("configPath", () => {
  it("returns claude user path for claude/user", () => {
    expect(configPath("claude", "user")).toBe(claudeUserPath());
  });

  it("returns opencode user path for opencode/user", () => {
    expect(configPath("opencode", "user")).toBe(opencodeUserPath());
  });

  it("returns vscode user path for vscode/user", () => {
    expect(configPath("vscode", "user")).toBe(vscodeUserPath());
  });

  it("returns claude project path for claude/project with explicit root", () => {
    expect(configPath("claude", "project", "/my/project")).toBe(
      claudeProjectPath("/my/project")
    );
  });

  it("returns opencode project path for opencode/project with explicit root", () => {
    expect(configPath("opencode", "project", "/my/project")).toBe(
      opencodeProjectPath("/my/project")
    );
  });

  it("returns vscode project path for vscode/project with explicit root", () => {
    expect(configPath("vscode", "project", "/my/project")).toBe(
      vscodeProjectPath("/my/project")
    );
  });
});

describe("detectProjectRoot", () => {
  const originalCwd = process.cwd;

  afterEach(() => {
    process.cwd = originalCwd;
  });

  it("finds project root with .git directory", () => {
    const tmpDir = fs.mkdtempSync("/tmp/mcp-test-");
    const subDir = path.join(tmpDir, "sub", "dir");
    fs.mkdirSync(subDir, { recursive: true });
    fs.mkdirSync(path.join(tmpDir, ".git"), { recursive: true });

    process.cwd = () => subDir;
    const result = detectProjectRoot();
    expect(result).toBe(tmpDir);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns cwd when no .git directory found", () => {
    const tmpDir = fs.mkdtempSync("/tmp/mcp-test-");
    process.cwd = () => tmpDir;

    const result = detectProjectRoot();
    expect(result).toBe(tmpDir);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("stops at filesystem root and returns cwd", () => {
    const tmpDir = fs.mkdtempSync("/tmp/mcp-test-");
    const subDir = path.join(tmpDir, "deep", "nested", "dir");
    fs.mkdirSync(subDir, { recursive: true });
    process.cwd = () => subDir;

    const result = detectProjectRoot();
    expect(result).toBe(subDir);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
