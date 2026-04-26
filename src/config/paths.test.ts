import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import {
  claudeUserPath,
  opencodeUserPath,
  claudeProjectPath,
  opencodeProjectPath,
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

describe("configPath", () => {
  it("returns claude user path for claude/user", () => {
    expect(configPath("claude", "user")).toBe(claudeUserPath());
  });

  it("returns opencode user path for opencode/user", () => {
    expect(configPath("opencode", "user")).toBe(opencodeUserPath());
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
