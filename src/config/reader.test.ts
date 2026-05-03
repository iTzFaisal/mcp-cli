import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { readServers } from "./reader.js";
import * as pathsModule from "./paths.js";

describe("readServers", () => {
  const tmpDir = fs.mkdtempSync("/tmp/mcp-reader-test-");
  const claudeUserFile = path.join(tmpDir, "claude.json");
  const opencodeDir = path.join(tmpDir, "config", "opencode");
  const opencodeUserFile = path.join(opencodeDir, "opencode.json");
  const projectDir = path.join(tmpDir, "project");
  const claudeProjectFile = path.join(projectDir, ".mcp.json");
  const opencodeProjectFile = path.join(projectDir, "opencode.json");
  const vscodeUserDir = path.join(tmpDir, "Library", "Application Support", "Code", "User");
  const vscodeUserFile = path.join(vscodeUserDir, "mcp.json");
  const vscodeProjectDir = path.join(projectDir, ".vscode");
  const vscodeProjectFile = path.join(vscodeProjectDir, "mcp.json");

  let configPathSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fs.mkdirSync(opencodeDir, { recursive: true });
    fs.mkdirSync(projectDir, { recursive: true });
    fs.mkdirSync(vscodeUserDir, { recursive: true });
    fs.mkdirSync(vscodeProjectDir, { recursive: true });

    configPathSpy = vi.spyOn(pathsModule, "configPath");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function setupMocks() {
    configPathSpy.mockImplementation(
      (tool: string, scope: string) => {
        if (tool === "claude" && scope === "user") return claudeUserFile;
        if (tool === "opencode" && scope === "user") return opencodeUserFile;
        if (tool === "vscode" && scope === "user") return vscodeUserFile;
        if (tool === "claude" && scope === "project") return claudeProjectFile;
        if (tool === "vscode" && scope === "project") return vscodeProjectFile;
        return opencodeProjectFile;
      }
    );
  }

  it("reads all servers from all tools and scopes", () => {
    setupMocks();

    fs.writeFileSync(
      claudeUserFile,
      JSON.stringify({
        mcpServers: {
          "test-server": { command: "npx", args: ["-y", "server"] },
        },
      })
    );
    fs.writeFileSync(
      opencodeUserFile,
      JSON.stringify({
        mcp: {
          "test-server": {
            type: "local",
            command: ["npx", "-y", "server"],
            enabled: true,
          },
        },
      })
    );
    fs.writeFileSync(
      vscodeUserFile,
      JSON.stringify({
        servers: {
          "vscode-user": {
            type: "http",
            url: "https://mcp.example.com/user",
          },
        },
      })
    );
    fs.writeFileSync(
      claudeProjectFile,
      JSON.stringify({
        mcpServers: {
          "project-server": { command: "node", args: ["server.js"] },
        },
      })
    );
    fs.writeFileSync(
      opencodeProjectFile,
      JSON.stringify({
        mcp: {
          "project-server": {
            type: "local",
            command: ["node", "server.js"],
            enabled: true,
          },
        },
      })
    );
    fs.writeFileSync(
      vscodeProjectFile,
      JSON.stringify({
        servers: {
          "vscode-project": {
            command: "node",
            args: ["server.js"],
            env: { TOKEN: "${input:token}" },
          },
        },
      })
    );

    const servers = readServers();
    expect(servers.length).toBe(6);

    const names = servers.map((s) => s.server.name);
    expect(names).toContain("test-server");
    expect(names).toContain("project-server");
    expect(names).toContain("vscode-user");
    expect(names).toContain("vscode-project");
  });

  it("filters by tool", () => {
    setupMocks();

    fs.writeFileSync(
      claudeUserFile,
      JSON.stringify({
        mcpServers: { "claude-srv": { command: "npx" } },
      })
    );

    const servers = readServers("claude");
    expect(servers.every((s) => s.tool === "claude")).toBe(true);
  });

  it("filters by scope", () => {
    setupMocks();

    fs.writeFileSync(
      claudeUserFile,
      JSON.stringify({
        mcpServers: { "user-srv": { command: "npx" } },
      })
    );

    const servers = readServers(undefined, "user");
    expect(servers.every((s) => s.scope === "user")).toBe(true);
  });

  it("filters by tool and scope", () => {
    setupMocks();

    fs.writeFileSync(
      claudeUserFile,
      JSON.stringify({
        mcpServers: {
          "test-server": { command: "npx", args: ["-y", "server"] },
        },
      })
    );

    const servers = readServers("claude", "user");
    expect(servers.length).toBe(1);
    expect(servers[0].server.name).toBe("test-server");
    expect(servers[0].tool).toBe("claude");
    expect(servers[0].scope).toBe("user");
  });

  it("returns empty array when no servers exist", () => {
    setupMocks();
    const servers = readServers();
    expect(servers).toEqual([]);
  });

  it("returns empty when file has no mcpServers key", () => {
    setupMocks();
    fs.writeFileSync(claudeUserFile, JSON.stringify({ other: "data" }));
    const servers = readServers("claude", "user");
    expect(servers).toEqual([]);
  });

  it("handles missing config file gracefully", () => {
    setupMocks();
    const servers = readServers("claude", "user");
    expect(servers).toEqual([]);
  });

  it("reads http servers from claude config", () => {
    setupMocks();
    fs.writeFileSync(
      claudeUserFile,
      JSON.stringify({
        mcpServers: {
          "http-server": {
            type: "http",
            url: "https://mcp.example.com",
          },
        },
      })
    );
    const servers = readServers("claude", "user");
    expect(servers[0].server.transport).toBe("http");
    expect(servers[0].server.url).toBe("https://mcp.example.com");
  });

  it("reads remote servers from opencode config", () => {
    setupMocks();
    fs.writeFileSync(
      opencodeUserFile,
      JSON.stringify({
        mcp: {
          "remote-server": {
            type: "remote",
            url: "https://mcp.example.com",
          },
        },
      })
    );
    const servers = readServers("opencode", "user");
    expect(servers[0].server.transport).toBe("http");
    expect(servers[0].server.url).toBe("https://mcp.example.com");
  });

  it("reads vscode servers from the servers key", () => {
    setupMocks();
    fs.writeFileSync(
      vscodeUserFile,
      JSON.stringify({
        inputs: [{ id: "token" }],
        servers: {
          github: {
            command: "npx",
            args: ["-y", "server"],
            env: { API_KEY: "${input:token}" },
          },
        },
      })
    );

    const servers = readServers("vscode", "user");
    expect(servers).toHaveLength(1);
    expect(servers[0].server).toEqual({
      name: "github",
      transport: "stdio",
      command: ["npx", "-y", "server"],
      env: { API_KEY: "${input:token}" },
      disabled: undefined,
    });
  });

  it("returns empty for missing vscode project config", () => {
    setupMocks();
    const servers = readServers("vscode", "project");
    expect(servers).toEqual([]);
  });
});
