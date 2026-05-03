import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { execSync } from "child_process";

const BIN = path.resolve(import.meta.dirname, "..", "..", "dist", "index.js");

describe("move command", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mcp-move-test-"));
  const claudeFile = path.join(tmpDir, ".claude.json");
  const opencodeDir = path.join(tmpDir, ".config", "opencode");
  const opencodeFile = path.join(opencodeDir, "opencode.json");
  const projectDir = path.join(tmpDir, "project");
  const claudeProjectFile = path.join(projectDir, ".mcp.json");
  const opencodeProjectFile = path.join(projectDir, "opencode.json");
  const clineDir = path.join(
    tmpDir,
    "Library",
    "Application Support",
    "Code",
    "User",
    "globalStorage",
    "saoudrizwan.claude-dev",
    "settings"
  );
  const clineFile = path.join(clineDir, "cline_mcp_settings.json");
  const vscodeUserDir = path.join(
    tmpDir,
    "Library",
    "Application Support",
    "Code",
    "User"
  );
  const vscodeUserFile = path.join(vscodeUserDir, "mcp.json");
  const vscodeProjectDir = path.join(projectDir, ".vscode");
  const vscodeProjectFile = path.join(vscodeProjectDir, "mcp.json");

  const runCli = (args: string) => {
    try {
      return execSync(`node ${BIN} ${args}`, {
        encoding: "utf-8",
        env: { ...process.env, HOME: tmpDir, FORCE_COLOR: "0" },
        cwd: projectDir,
        timeout: 5000,
        stdio: "pipe",
      });
    } catch (e: unknown) {
      const err = e as { stdout?: string; stderr?: string; status?: number };
      return err.stdout ?? err.stderr ?? "";
    }
  };

  beforeEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.mkdirSync(opencodeDir, { recursive: true });
    fs.mkdirSync(clineDir, { recursive: true });
    fs.mkdirSync(projectDir, { recursive: true });
    fs.mkdirSync(vscodeUserDir, { recursive: true });
    fs.mkdirSync(vscodeProjectDir, { recursive: true });
    fs.mkdirSync(path.join(projectDir, ".git"), { recursive: true });

    fs.writeFileSync(claudeFile, JSON.stringify({ mcpServers: {} }));
    fs.writeFileSync(opencodeFile, JSON.stringify({ mcp: {} }));
    fs.writeFileSync(claudeProjectFile, JSON.stringify({ mcpServers: {} }));
    fs.writeFileSync(opencodeProjectFile, JSON.stringify({ mcp: {} }));
    fs.writeFileSync(clineFile, JSON.stringify({ mcpServers: {} }));
    fs.writeFileSync(vscodeUserFile, JSON.stringify({ servers: {} }));
    fs.writeFileSync(vscodeProjectFile, JSON.stringify({ servers: {} }));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe("help output", () => {
    it("shows move command in help", () => {
      const output = execSync(`node ${BIN} --help`, { encoding: "utf-8" });
      expect(output).toContain("move");
    });

    it("shows move help with examples", () => {
      const output = execSync(`node ${BIN} move --help`, {
        encoding: "utf-8",
      });
      expect(output).toContain("--tool");
      expect(output).toContain("--scope");
      expect(output).toContain("--from-tool");
      expect(output).toContain("--force");
      expect(output).toContain("interactive");
    });
  });

  describe("alias", () => {
    it("mv alias works", () => {
      fs.writeFileSync(
        claudeFile,
        JSON.stringify({
          mcpServers: {
            "my-server": { command: "npx", args: ["-y", "server"] },
          },
        })
      );

      runCli("mv my-server --tool opencode --scope user");

      const opencodeData = JSON.parse(fs.readFileSync(opencodeFile, "utf-8"));
      expect(opencodeData.mcp["my-server"]).toBeDefined();

      const claudeData = JSON.parse(fs.readFileSync(claudeFile, "utf-8"));
      expect(claudeData.mcpServers["my-server"]).toBeUndefined();
    });
  });

  describe("non-interactive mode", () => {
    it("moves server from claude user to opencode user", () => {
      fs.writeFileSync(
        claudeFile,
        JSON.stringify({
          mcpServers: {
            "brave-search": { command: "npx", args: ["-y", "brave-search"] },
          },
        })
      );

      runCli("move brave-search --tool opencode --scope user");

      const opencodeData = JSON.parse(fs.readFileSync(opencodeFile, "utf-8"));
      expect(opencodeData.mcp["brave-search"]).toEqual({
        type: "local",
        command: ["npx", "-y", "brave-search"],
        enabled: true,
        timeout: 60000,
      });

      const claudeData = JSON.parse(fs.readFileSync(claudeFile, "utf-8"));
      expect(claudeData.mcpServers["brave-search"]).toBeUndefined();
    });

    it("moves server from opencode user to claude user", () => {
      fs.writeFileSync(
        opencodeFile,
        JSON.stringify({
          mcp: {
            notion: {
              type: "remote",
              url: "https://mcp.notion.com/mcp",
              enabled: true,
            },
          },
        })
      );

      runCli("move notion --tool claude --scope user");

      const claudeData = JSON.parse(fs.readFileSync(claudeFile, "utf-8"));
      expect(claudeData.mcpServers["notion"]).toEqual({
        type: "http",
        url: "https://mcp.notion.com/mcp",
      });

      const opencodeData = JSON.parse(fs.readFileSync(opencodeFile, "utf-8"));
      expect(opencodeData.mcp["notion"]).toBeUndefined();
    });

    it("moves with --from-tool and --from-scope", () => {
      fs.writeFileSync(
        claudeFile,
        JSON.stringify({
          mcpServers: {
            "my-server": { command: "npx", args: ["-y", "server"] },
          },
        })
      );
      fs.writeFileSync(
        opencodeFile,
        JSON.stringify({
          mcp: {
            "my-server": {
              type: "local",
              command: ["npx", "-y", "other"],
              enabled: true,
            },
          },
        })
      );

      runCli(
        "move my-server --from-tool claude --from-scope user --tool opencode --scope user --force"
      );

      const opencodeData = JSON.parse(fs.readFileSync(opencodeFile, "utf-8"));
      expect(opencodeData.mcp["my-server"].command).toEqual(["npx", "-y", "server"]);

      const claudeData = JSON.parse(fs.readFileSync(claudeFile, "utf-8"));
      expect(claudeData.mcpServers["my-server"]).toBeUndefined();
    });

    it("moves from project scope", () => {
      fs.writeFileSync(
        opencodeProjectFile,
        JSON.stringify({
          mcp: {
            "proj-srv": {
              type: "local",
              command: ["node", "server.js"],
              enabled: true,
            },
          },
        })
      );

      runCli(
        "move proj-srv --from-tool opencode --from-scope project --tool claude --scope project"
      );

      const claudeData = JSON.parse(fs.readFileSync(claudeProjectFile, "utf-8"));
      expect(claudeData.mcpServers["proj-srv"]).toEqual({
        command: "node",
        args: ["server.js"],
      });

      const opencodeData = JSON.parse(fs.readFileSync(opencodeProjectFile, "utf-8"));
      expect(opencodeData.mcp["proj-srv"]).toBeUndefined();
    });

    it("moves authenticated remote server from cline to claude", () => {
      fs.writeFileSync(
        clineFile,
        JSON.stringify({
          mcpServers: {
            "api-server": {
              type: "streamableHttp",
              url: "https://mcp.example.com",
              headers: { Authorization: "Bearer API_KEY" },
              disabled: false,
            },
          },
        })
      );

      runCli(
        "move api-server --from-tool cline --from-scope user --tool claude --scope user"
      );

      const claudeData = JSON.parse(fs.readFileSync(claudeFile, "utf-8"));
      expect(claudeData.mcpServers["api-server"]).toEqual({
        type: "http",
        url: "https://mcp.example.com",
        headers: { Authorization: "Bearer API_KEY" },
      });

      const clineData = JSON.parse(fs.readFileSync(clineFile, "utf-8"));
      expect(clineData.mcpServers["api-server"]).toBeUndefined();
    });

    it("moves authenticated remote server from claude to cline", () => {
      fs.writeFileSync(
        claudeFile,
        JSON.stringify({
          mcpServers: {
            "api-server": {
              type: "http",
              url: "https://mcp.example.com",
              headers: { Authorization: "Bearer API_KEY" },
            },
          },
        })
      );

      runCli(
        "move api-server --from-tool claude --from-scope user --tool cline --scope user"
      );

      const clineData = JSON.parse(fs.readFileSync(clineFile, "utf-8"));
      expect(clineData.mcpServers["api-server"]).toEqual({
        type: "streamableHttp",
        url: "https://mcp.example.com",
        headers: { Authorization: "Bearer API_KEY" },
        disabled: false,
        timeout: 60,
      });

      const claudeData = JSON.parse(fs.readFileSync(claudeFile, "utf-8"));
      expect(claudeData.mcpServers["api-server"]).toBeUndefined();
    });

    it("moves from VS Code project to Claude user", () => {
      fs.writeFileSync(
        vscodeProjectFile,
        JSON.stringify({
          servers: {
            github: {
              type: "http",
              url: "https://mcp.example.com/project",
            },
          },
        })
      );

      runCli(
        "move github --from-tool vscode --from-scope project --tool claude --scope user"
      );

      const claudeData = JSON.parse(fs.readFileSync(claudeFile, "utf-8"));
      expect(claudeData.mcpServers.github).toEqual({
        type: "http",
        url: "https://mcp.example.com/project",
      });

      const vscodeData = JSON.parse(fs.readFileSync(vscodeProjectFile, "utf-8"));
      expect(vscodeData.servers.github).toBeUndefined();
    });

    it("moves to VS Code project", () => {
      fs.writeFileSync(
        claudeFile,
        JSON.stringify({
          mcpServers: {
            playwright: { command: "npx", args: ["-y", "@microsoft/mcp-server-playwright"] },
          },
        })
      );

      runCli("move playwright --tool vscode --scope project");

      const vscodeData = JSON.parse(fs.readFileSync(vscodeProjectFile, "utf-8"));
      expect(vscodeData.servers.playwright).toEqual({
        command: "npx",
        args: ["-y", "@microsoft/mcp-server-playwright"],
      });

      const claudeData = JSON.parse(fs.readFileSync(claudeFile, "utf-8"));
      expect(claudeData.mcpServers.playwright).toBeUndefined();
    });
  });

  describe("same source and destination guard", () => {
    it("errors when source and destination are the same", () => {
      fs.writeFileSync(
        claudeFile,
        JSON.stringify({
          mcpServers: {
            "my-server": { command: "npx", args: ["-y", "server"] },
          },
        })
      );

      const output = runCli(
        "move my-server --tool claude --scope user --from-tool claude --from-scope user"
      );
      expect(output).toContain("same");

      const claudeData = JSON.parse(fs.readFileSync(claudeFile, "utf-8"));
      expect(claudeData.mcpServers["my-server"]).toBeDefined();
    });
  });

  describe("overwrite protection", () => {
    it("blocks overwrite without --force", () => {
      fs.writeFileSync(
        claudeFile,
        JSON.stringify({
          mcpServers: {
            "brave-search": { command: "npx", args: ["-y", "server"] },
          },
        })
      );
      fs.writeFileSync(
        opencodeFile,
        JSON.stringify({
          mcp: {
            "brave-search": {
              type: "local",
              command: ["old"],
              enabled: true,
            },
          },
        })
      );

      const output = runCli(
        "move brave-search --from-tool claude --tool opencode --scope user"
      );
      expect(output).toContain("--force");

      const opencodeData = JSON.parse(fs.readFileSync(opencodeFile, "utf-8"));
      expect(opencodeData.mcp["brave-search"].command).toEqual(["old"]);

      const claudeData = JSON.parse(fs.readFileSync(claudeFile, "utf-8"));
      expect(claudeData.mcpServers["brave-search"]).toBeDefined();
    });

    it("overwrites with --force", () => {
      fs.writeFileSync(
        claudeFile,
        JSON.stringify({
          mcpServers: {
            "brave-search": { command: "npx", args: ["-y", "new-server"] },
          },
        })
      );
      fs.writeFileSync(
        opencodeFile,
        JSON.stringify({
          mcp: {
            "brave-search": {
              type: "local",
              command: ["old"],
              enabled: true,
            },
          },
        })
      );

      runCli(
        "move brave-search --from-tool claude --tool opencode --scope user --force"
      );

      const opencodeData = JSON.parse(fs.readFileSync(opencodeFile, "utf-8"));
      expect(opencodeData.mcp["brave-search"].command).toEqual(["npx", "-y", "new-server"]);

      const claudeData = JSON.parse(fs.readFileSync(claudeFile, "utf-8"));
      expect(claudeData.mcpServers["brave-search"]).toBeUndefined();
    });
  });

  describe("error cases", () => {
    it("errors when server not found", () => {
      const output = runCli("move nonexistent --tool claude --scope user");
      expect(output).toContain("not found");
    });

    it("errors when server not in specified --from-tool", () => {
      fs.writeFileSync(
        claudeFile,
        JSON.stringify({
          mcpServers: {
            "my-server": { command: "npx", args: ["-y", "server"] },
          },
        })
      );

      const output = runCli(
        "move my-server --from-tool opencode --tool claude --scope user"
      );
      expect(output).toContain("not found");
    });

    it("errors when ambiguous source without --from-tool/--from-scope", () => {
      fs.writeFileSync(
        claudeFile,
        JSON.stringify({
          mcpServers: {
            "my-server": { command: "npx", args: ["-y", "server"] },
          },
        })
      );
      fs.writeFileSync(
        opencodeFile,
        JSON.stringify({
          mcp: {
            "my-server": {
              type: "local",
              command: ["npx", "-y", "server"],
              enabled: true,
            },
          },
        })
      );

      const output = runCli("move my-server --tool claude --scope user");
      expect(output).toContain("multiple locations");
    });
  });

  describe("--tool all", () => {
    it("moves to all tools and removes from source", () => {
      fs.writeFileSync(
        claudeProjectFile,
        JSON.stringify({
          mcpServers: {
            "my-server": { command: "npx", args: ["-y", "server"] },
          },
        })
      );

      runCli(
        "move my-server --from-tool claude --from-scope project --tool all --scope user"
      );

      const claudeData = JSON.parse(fs.readFileSync(claudeFile, "utf-8"));
      const opencodeData = JSON.parse(fs.readFileSync(opencodeFile, "utf-8"));

      expect(claudeData.mcpServers["my-server"]).toBeDefined();
      expect(opencodeData.mcp["my-server"]).toBeDefined();

      const claudeProjectData = JSON.parse(
        fs.readFileSync(claudeProjectFile, "utf-8")
      );
      expect(claudeProjectData.mcpServers["my-server"]).toBeUndefined();
    });

    it("moves to all tools with --force overwriting existing", () => {
      fs.writeFileSync(
        claudeProjectFile,
        JSON.stringify({
          mcpServers: {
            "my-server": { command: "npx", args: ["-y", "new"] },
          },
        })
      );
      fs.writeFileSync(
        opencodeFile,
        JSON.stringify({
          mcp: {
            "my-server": {
              type: "local",
              command: ["old"],
              enabled: true,
            },
          },
        })
      );

      runCli(
        "move my-server --from-tool claude --from-scope project --tool all --scope user --force"
      );

      const claudeData = JSON.parse(fs.readFileSync(claudeFile, "utf-8"));
      const opencodeData = JSON.parse(fs.readFileSync(opencodeFile, "utf-8"));

      expect(claudeData.mcpServers["my-server"].args).toEqual(["-y", "new"]);
      expect(opencodeData.mcp["my-server"].command).toEqual(["npx", "-y", "new"]);
    });
  });
});
