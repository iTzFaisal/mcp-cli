import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { writeServer, removeServer } from "./writer.js";
import * as pathsModule from "./paths.js";
import type { McpServer } from "../types.js";

describe("writeServer and removeServer", () => {
  const tmpDir = fs.mkdtempSync("/tmp/mcp-writer-test-");
  const claudeFile = path.join(tmpDir, "claude.json");
  const opencodeDir = path.join(tmpDir, "config", "opencode");
  const opencodeFile = path.join(opencodeDir, "opencode.json");

  const stdioServer: McpServer = {
    name: "test-server",
    transport: "stdio",
    command: ["npx", "-y", "my-server"],
    env: { API_KEY: "secret" },
  };

  const httpServer: McpServer = {
    name: "http-server",
    transport: "http",
    url: "https://mcp.example.com",
    headers: { Authorization: "Bearer token" },
  };

  let configPathSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.mkdirSync(opencodeDir, { recursive: true });

    configPathSpy = vi.spyOn(pathsModule, "configPath");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function mockClaudePath() {
    configPathSpy.mockReturnValue(claudeFile);
  }

  function mockOpencodePath() {
    configPathSpy.mockReturnValue(opencodeFile);
  }

  function mockCustomPath(p: string) {
    configPathSpy.mockReturnValue(p);
  }

  describe("writeServer", () => {
    it("writes stdio server to claude user config", () => {
      mockClaudePath();
      writeServer(stdioServer, "claude", "user");

      const data = JSON.parse(fs.readFileSync(claudeFile, "utf-8"));
      expect(data.mcpServers["test-server"]).toEqual({
        command: "npx",
        args: ["-y", "my-server"],
        env: { API_KEY: "secret" },
      });
    });

    it("writes http server to opencode user config", () => {
      mockOpencodePath();
      writeServer(httpServer, "opencode", "user");

      const data = JSON.parse(fs.readFileSync(opencodeFile, "utf-8"));
      expect(data.mcp["http-server"]).toEqual({
        type: "remote",
        url: "https://mcp.example.com",
        headers: { Authorization: "Bearer token" },
        enabled: true,
        timeout: 60000,
      });
    });

    it("creates file if it does not exist", () => {
      const newFile = path.join(tmpDir, "new-dir", "config.json");
      mockCustomPath(newFile);

      writeServer(stdioServer, "claude", "user");

      expect(fs.existsSync(newFile)).toBe(true);
      const data = JSON.parse(fs.readFileSync(newFile, "utf-8"));
      expect(data.mcpServers["test-server"]).toBeDefined();
    });

    it("preserves existing fields in config file", () => {
      fs.writeFileSync(
        claudeFile,
        JSON.stringify({ existingField: "preserve-me", mcpServers: {} })
      );
      mockClaudePath();

      writeServer(stdioServer, "claude", "user");

      const data = JSON.parse(fs.readFileSync(claudeFile, "utf-8"));
      expect(data.existingField).toBe("preserve-me");
      expect(data.mcpServers["test-server"]).toBeDefined();
    });

    it("overwrites existing server", () => {
      fs.writeFileSync(
        claudeFile,
        JSON.stringify({
          mcpServers: {
            "test-server": { command: "old", args: [] },
          },
        })
      );
      mockClaudePath();

      writeServer(stdioServer, "claude", "user");

      const data = JSON.parse(fs.readFileSync(claudeFile, "utf-8"));
      expect(data.mcpServers["test-server"].command).toBe("npx");
    });
  });

  describe("removeServer", () => {
    it("removes server from claude config", () => {
      fs.writeFileSync(
        claudeFile,
        JSON.stringify({
          mcpServers: {
            "test-server": { command: "npx", args: ["-y", "server"] },
            "other-server": { command: "node" },
          },
        })
      );
      mockClaudePath();

      const result = removeServer("test-server", "claude", "user");

      expect(result).toBe(true);
      const data = JSON.parse(fs.readFileSync(claudeFile, "utf-8"));
      expect(data.mcpServers["test-server"]).toBeUndefined();
      expect(data.mcpServers["other-server"]).toBeDefined();
    });

    it("removes server from opencode config", () => {
      fs.writeFileSync(
        opencodeFile,
        JSON.stringify({
          mcp: {
            "test-server": { type: "local", command: ["node"], enabled: true },
          },
        })
      );
      mockOpencodePath();

      const result = removeServer("test-server", "opencode", "user");

      expect(result).toBe(true);
      const data = JSON.parse(fs.readFileSync(opencodeFile, "utf-8"));
      expect(data.mcp["test-server"]).toBeUndefined();
    });

    it("returns false when server not found", () => {
      fs.writeFileSync(claudeFile, JSON.stringify({ mcpServers: {} }));
      mockClaudePath();

      const result = removeServer("nonexistent", "claude", "user");
      expect(result).toBe(false);
    });

    it("returns false when container key is missing", () => {
      fs.writeFileSync(claudeFile, JSON.stringify({ otherField: true }));
      mockClaudePath();

      const result = removeServer("test", "claude", "user");
      expect(result).toBe(false);
    });

    it("returns false when file does not exist", () => {
      const noFile = path.join(tmpDir, "nonexistent.json");
      mockCustomPath(noFile);

      const result = removeServer("test", "claude", "user");
      expect(result).toBe(false);
    });
  });
});
