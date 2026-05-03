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
  const clineDir = path.join(tmpDir, "config", "cline");
  const clineFile = path.join(clineDir, "cline_mcp_settings.json");
  const vscodeDir = path.join(tmpDir, ".vscode");
  const vscodeFile = path.join(vscodeDir, "mcp.json");

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
    fs.mkdirSync(clineDir, { recursive: true });
    fs.mkdirSync(vscodeDir, { recursive: true });

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

  function mockClinePath() {
    configPathSpy.mockReturnValue(clineFile);
  }

  function mockVsCodePath() {
    configPathSpy.mockReturnValue(vscodeFile);
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

    it("preserves existing fields when writing http server to claude", () => {
      fs.writeFileSync(
        claudeFile,
        JSON.stringify({ existingField: "preserve-me", mcpServers: {} })
      );
      mockClaudePath();

      writeServer(httpServer, "claude", "user");

      const data = JSON.parse(fs.readFileSync(claudeFile, "utf-8"));
      expect(data.existingField).toBe("preserve-me");
      expect(data.mcpServers["http-server"]).toEqual({
        type: "http",
        url: "https://mcp.example.com",
        headers: { Authorization: "Bearer token" },
      });
    });

    it("preserves existing fields when writing http server to opencode", () => {
      fs.writeFileSync(
        opencodeFile,
        JSON.stringify({ existingField: "preserve-me", mcp: {} })
      );
      mockOpencodePath();

      writeServer(httpServer, "opencode", "user");

      const data = JSON.parse(fs.readFileSync(opencodeFile, "utf-8"));
      expect(data.existingField).toBe("preserve-me");
      expect(data.mcp["http-server"]).toEqual({
        type: "remote",
        url: "https://mcp.example.com",
        headers: { Authorization: "Bearer token" },
        enabled: true,
        timeout: 60000,
      });
    });

    it("preserves existing fields when writing http server to cline", () => {
      fs.writeFileSync(
        clineFile,
        JSON.stringify({ existingField: "preserve-me", mcpServers: {} })
      );
      mockClinePath();

      writeServer(httpServer, "cline", "user");

      const data = JSON.parse(fs.readFileSync(clineFile, "utf-8"));
      expect(data.existingField).toBe("preserve-me");
      expect(data.mcpServers["http-server"]).toEqual({
        type: "streamableHttp",
        url: "https://mcp.example.com",
        headers: { Authorization: "Bearer token" },
        disabled: false,
        timeout: 60,
      });
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

    it("writes VS Code servers under the servers key", () => {
      mockVsCodePath();
      writeServer(httpServer, "vscode", "project");

      const data = JSON.parse(fs.readFileSync(vscodeFile, "utf-8"));
      expect(data.servers["http-server"]).toEqual({
        type: "http",
        url: "https://mcp.example.com",
        headers: { Authorization: "Bearer token" },
      });
    });

    it("preserves unrelated VS Code fields when writing", () => {
      fs.writeFileSync(
        vscodeFile,
        JSON.stringify({ inputs: [{ id: "token" }], servers: {} })
      );
      mockVsCodePath();

      writeServer(stdioServer, "vscode", "project");

      const data = JSON.parse(fs.readFileSync(vscodeFile, "utf-8"));
      expect(data.inputs).toEqual([{ id: "token" }]);
      expect(data.servers["test-server"]).toEqual({
        command: "npx",
        args: ["-y", "my-server"],
        env: { API_KEY: "secret" },
      });
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

    it("removes server from VS Code config", () => {
      fs.writeFileSync(
        vscodeFile,
        JSON.stringify({
          inputs: [{ id: "token" }],
          servers: {
            "test-server": { command: "npx", args: ["-y", "server"] },
          },
        })
      );
      mockVsCodePath();

      const result = removeServer("test-server", "vscode", "project");

      expect(result).toBe(true);
      const data = JSON.parse(fs.readFileSync(vscodeFile, "utf-8"));
      expect(data.inputs).toEqual([{ id: "token" }]);
      expect(data.servers["test-server"]).toBeUndefined();
    });
  });
});
