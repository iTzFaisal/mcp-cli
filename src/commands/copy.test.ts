import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { execSync } from "child_process";

const BIN = path.resolve(import.meta.dirname, "..", "..", "dist", "index.js");

describe("copy command", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mcp-copy-test-"));
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
    fs.mkdirSync(path.join(projectDir, ".git"), { recursive: true });

    fs.writeFileSync(claudeFile, JSON.stringify({ mcpServers: {} }));
    fs.writeFileSync(opencodeFile, JSON.stringify({ mcp: {} }));
    fs.writeFileSync(claudeProjectFile, JSON.stringify({ mcpServers: {} }));
    fs.writeFileSync(opencodeProjectFile, JSON.stringify({ mcp: {} }));
    fs.writeFileSync(clineFile, JSON.stringify({ mcpServers: {} }));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe("help output", () => {
    it("shows copy command in help", () => {
      const output = execSync(`node ${BIN} --help`, { encoding: "utf-8" });
      expect(output).toContain("copy");
    });

    it("shows copy help with examples", () => {
      const output = execSync(`node ${BIN} copy --help`, {
        encoding: "utf-8",
      });
      expect(output).toContain("--tool");
      expect(output).toContain("--scope");
      expect(output).toContain("--from-tool");
      expect(output).toContain("--force");
    });
  });

  describe("error cases", () => {
    it("errors when server not found", () => {
      const output = runCli("copy nonexistent --tool claude --scope user");
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

      const output = runCli("copy my-server --tool claude --scope user");
      expect(output).toContain("multiple locations");
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
        "copy my-server --from-tool opencode --tool claude --scope user"
      );
      expect(output).toContain("not found");
    });
  });

  describe("non-interactive copy", () => {
    it("copies from claude user to opencode user", () => {
      fs.writeFileSync(
        claudeFile,
        JSON.stringify({
          mcpServers: {
            "brave-search": { command: "npx", args: ["-y", "brave-search"] },
          },
        })
      );

      runCli("copy brave-search --tool opencode --scope user");

      const data = JSON.parse(fs.readFileSync(opencodeFile, "utf-8"));
      expect(data.mcp["brave-search"]).toEqual({
        type: "local",
        command: ["npx", "-y", "brave-search"],
        enabled: true,
        timeout: 60000,
      });
    });

    it("copies from opencode user to claude user", () => {
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

      runCli("copy notion --tool claude --scope user");

      const data = JSON.parse(fs.readFileSync(claudeFile, "utf-8"));
      expect(data.mcpServers["notion"]).toEqual({
        type: "http",
        url: "https://mcp.notion.com/mcp",
      });
    });

    it("copies from opencode project to claude project", () => {
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
        "copy proj-srv --from-tool opencode --from-scope project --tool claude --scope project"
      );

      const data = JSON.parse(fs.readFileSync(claudeProjectFile, "utf-8"));
      expect(data.mcpServers["proj-srv"]).toEqual({
        command: "node",
        args: ["server.js"],
      });
    });

    it("copies to all tools", () => {
      fs.writeFileSync(
        claudeFile,
        JSON.stringify({
          mcpServers: {
            "my-server": { command: "npx", args: ["-y", "server"] },
          },
        })
      );

      runCli("copy my-server --tool all --scope user --force");

      const claudeData = JSON.parse(fs.readFileSync(claudeFile, "utf-8"));
      const opencodeData = JSON.parse(
        fs.readFileSync(opencodeFile, "utf-8")
      );
      expect(claudeData.mcpServers["my-server"]).toBeDefined();
      expect(opencodeData.mcp["my-server"]).toBeDefined();
    });

    it("copies with --from-tool and --from-scope", () => {
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
        "copy my-server --from-tool claude --from-scope user --tool opencode --scope user --force"
      );

      const data = JSON.parse(fs.readFileSync(opencodeFile, "utf-8"));
      expect(data.mcp["my-server"].command).toEqual(["npx", "-y", "server"]);
    });

    it("copies authenticated remote server from cline to claude", () => {
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
        "copy api-server --from-tool cline --from-scope user --tool claude --scope user"
      );

      const data = JSON.parse(fs.readFileSync(claudeFile, "utf-8"));
      expect(data.mcpServers["api-server"]).toEqual({
        type: "http",
        url: "https://mcp.example.com",
        headers: { Authorization: "Bearer API_KEY" },
      });
    });

    it("copies authenticated remote server from opencode to cline", () => {
      fs.writeFileSync(
        opencodeFile,
        JSON.stringify({
          mcp: {
            "api-server": {
              type: "remote",
              url: "https://mcp.example.com",
              headers: { Authorization: "Bearer API_KEY" },
              enabled: true,
            },
          },
        })
      );

      runCli(
        "copy api-server --from-tool opencode --from-scope user --tool cline --scope user"
      );

      const data = JSON.parse(fs.readFileSync(clineFile, "utf-8"));
      expect(data.mcpServers["api-server"]).toEqual({
        type: "streamableHttp",
        url: "https://mcp.example.com",
        headers: { Authorization: "Bearer API_KEY" },
        disabled: false,
        timeout: 60,
      });
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
        "copy brave-search --from-tool claude --tool opencode --scope user"
      );
      expect(output).toContain("--force");

      const data = JSON.parse(fs.readFileSync(opencodeFile, "utf-8"));
      expect(data.mcp["brave-search"].command).toEqual(["old"]);
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
        "copy brave-search --from-tool claude --tool opencode --scope user --force"
      );

      const data = JSON.parse(fs.readFileSync(opencodeFile, "utf-8"));
      expect(data.mcp["brave-search"].command).toEqual(["npx", "-y", "new-server"]);
    });
  });

  describe("alias", () => {
    it("cp alias works", () => {
      fs.writeFileSync(
        claudeFile,
        JSON.stringify({
          mcpServers: {
            "my-server": { command: "npx", args: ["-y", "server"] },
          },
        })
      );

      runCli("cp my-server --tool opencode --scope user");

      const data = JSON.parse(fs.readFileSync(opencodeFile, "utf-8"));
      expect(data.mcp["my-server"]).toBeDefined();
    });
  });
});
