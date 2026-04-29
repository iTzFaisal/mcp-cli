import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { execSync } from "child_process";
import * as os from "os";
import * as fs from "fs";
import * as path from "path";

const BIN = path.resolve(import.meta.dirname, "..", "dist", "index.js");

describe("CLI integration tests", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mcp-cli-test-"));
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

  const cliWithHome = (args: string, expectError = false) => {
    return execSync(`node ${BIN} ${args}`, {
      encoding: "utf-8",
      env: { ...process.env, HOME: tmpDir, FORCE_COLOR: "0" },
      cwd: projectDir,
      timeout: 5000,
      stdio: expectError ? "pipe" : "pipe",
    });
  };

  const cliExpectError = (args: string) => {
    try {
      return cliWithHome(args);
    } catch (e: unknown) {
      const err = e as { stdout?: string; stderr?: string; status?: number };
      return err.stdout ?? err.stderr ?? null;
    }
  };

  const compact = (value: string) =>
    value
      .replace(/\x1B\[[0-9;?]*[ -/]*[@-~]/g, "")
      .replace(/[│◇◆●└┌┐┘├┤╭╮╯╰─]/g, "")
      .replace(/\s+/g, "")
      .trim();

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
    it("shows help with --help", () => {
      const output = execSync(`node ${BIN} --help`, { encoding: "utf-8" });
      expect(output).toContain("Unified MCP server manager");
      expect(output).toContain("list");
      expect(output).toContain("add");
      expect(output).toContain("rm");
      expect(output).toContain("compare");
    });

    it("shows version with --version", () => {
      const output = execSync(`node ${BIN} --version`, { encoding: "utf-8" });
      expect(output.trim()).toBe("0.1.0");
    });

    it("list command shows help examples", () => {
      const output = execSync(`node ${BIN} list --help`, {
        encoding: "utf-8",
      });
      expect(output).toContain("Examples:");
      expect(output).toContain("mcps list --tool claude");
    });

    it("add command shows help examples", () => {
      const output = execSync(`node ${BIN} add --help`, {
        encoding: "utf-8",
      });
      expect(output).toContain("--transport");
      expect(output).toContain("--command");
      expect(output).toContain("--header");
      expect(output).toContain("Authorization=Bearer API_KEY,OTHER=val");
    });

    it("rm command shows help examples", () => {
      const output = execSync(`node ${BIN} rm --help`, {
        encoding: "utf-8",
      });
      expect(output).toContain("--yes");
      expect(output).toContain("Examples:");
    });
  });

  describe("list command", () => {
    it("shows no servers message when empty", () => {
      const output = cliWithHome("list");
      expect(output).toContain("No MCP servers configured");
    });

    it("lists servers from both tools", () => {
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

      const output = cliWithHome("list");
      expect(output).toContain("my-server");
      expect(output).toContain("claude");
      expect(output).toContain("opencode");
    });

    it("filters by --tool claude", () => {
      fs.writeFileSync(
        claudeFile,
        JSON.stringify({
          mcpServers: {
            "claude-only": { command: "node" },
          },
        })
      );

      const output = cliWithHome("list --tool claude");
      expect(output).toContain("claude-only");
    });

    it("filters by --scope user", () => {
      const output = cliWithHome("list --scope user");
      expect(output).toBeDefined();
    });

    it("shows error for invalid --tool", () => {
      const output = cliWithHome("list --tool invalid");
      expect(output).toContain("Invalid tool");
    });

    it("shows error for invalid --scope", () => {
      const output = cliWithHome("list --scope invalid");
      expect(output).toContain("Invalid scope");
    });

    it("shows http transport details", () => {
      fs.writeFileSync(
        claudeFile,
        JSON.stringify({
          mcpServers: {
            "http-srv": { type: "http", url: "https://mcp.example.com" },
          },
        })
      );

      const output = cliWithHome("list --tool claude");
      expect(output).toContain("http-srv");
      expect(output).toContain("https://mcp.example.com");
    });

    it("shows project-scoped servers", () => {
      fs.writeFileSync(
        claudeProjectFile,
        JSON.stringify({
          mcpServers: {
            "proj-srv": { command: "node", args: ["server.js"] },
          },
        })
      );

      const output = cliWithHome("list --scope project --tool claude");
      expect(output).toContain("proj-srv");
    });
  });

  describe("add command (non-interactive)", () => {
    it("adds stdio server to claude user config", () => {
      cliWithHome(
        'add test-srv -t claude -s user --transport stdio --command "npx -y server"'
      );

      const data = JSON.parse(fs.readFileSync(claudeFile, "utf-8"));
      expect(data.mcpServers["test-srv"]).toEqual({
        command: "npx",
        args: ["-y", "server"],
      });
    });

    it("adds http server to opencode user config", () => {
      cliWithHome(
        'add http-srv -t opencode -s user --transport http --url "https://mcp.example.com"'
      );

      const data = JSON.parse(fs.readFileSync(opencodeFile, "utf-8"));
      expect(data.mcp["http-srv"]).toEqual({
        type: "remote",
        url: "https://mcp.example.com",
        enabled: true,
        timeout: 60000,
      });
    });

    it("adds authenticated http server to all tools and preserves unrelated fields", () => {
      fs.writeFileSync(
        claudeFile,
        JSON.stringify({ existingField: "keep-claude", mcpServers: {} })
      );
      fs.writeFileSync(
        opencodeFile,
        JSON.stringify({ existingField: "keep-opencode", mcp: {} })
      );
      fs.writeFileSync(
        clineFile,
        JSON.stringify({ existingField: "keep-cline", mcpServers: {} })
      );

      cliWithHome(
        'add notion -t all -s user --transport http --url "https://mcp.notion.com/mcp" --header "Authorization=Bearer API_KEY" --header "OTHER=val"'
      );

      const claudeData = JSON.parse(fs.readFileSync(claudeFile, "utf-8"));
      const opencodeData = JSON.parse(fs.readFileSync(opencodeFile, "utf-8"));
      const clineData = JSON.parse(fs.readFileSync(clineFile, "utf-8"));

      expect(claudeData.existingField).toBe("keep-claude");
      expect(claudeData.mcpServers.notion).toEqual({
        type: "http",
        url: "https://mcp.notion.com/mcp",
        headers: {
          Authorization: "Bearer API_KEY",
          OTHER: "val",
        },
      });

      expect(opencodeData.existingField).toBe("keep-opencode");
      expect(opencodeData.mcp.notion).toEqual({
        type: "remote",
        url: "https://mcp.notion.com/mcp",
        headers: {
          Authorization: "Bearer API_KEY",
          OTHER: "val",
        },
        enabled: true,
        timeout: 60000,
      });

      expect(clineData.existingField).toBe("keep-cline");
      expect(clineData.mcpServers.notion).toEqual({
        type: "streamableHttp",
        url: "https://mcp.notion.com/mcp",
        headers: {
          Authorization: "Bearer API_KEY",
          OTHER: "val",
        },
        disabled: false,
        timeout: 60,
      });
    });

    it("adds server with env vars", () => {
      cliWithHome(
        'add env-srv -t claude -s user --transport stdio --command "node server.js" -e KEY=value OTHER=test'
      );

      const data = JSON.parse(fs.readFileSync(claudeFile, "utf-8"));
      expect(data.mcpServers["env-srv"].env).toEqual({
        KEY: "value",
        OTHER: "test",
      });
    });

    it("adds server to all tools", () => {
      cliWithHome(
        'add dual-srv -t all -s user --transport stdio --command "node s.js"'
      );

      const claudeData = JSON.parse(fs.readFileSync(claudeFile, "utf-8"));
      const opencodeData = JSON.parse(
        fs.readFileSync(opencodeFile, "utf-8")
      );
      expect(claudeData.mcpServers["dual-srv"]).toBeDefined();
      expect(opencodeData.mcp["dual-srv"]).toBeDefined();
    });

    it("errors without --command for stdio", () => {
      const output = cliExpectError(
        "add nope -t claude -s user --transport stdio"
      );
      expect(output).toContain("--command is required");
    });

    it("errors without --url for http", () => {
      const output = cliExpectError(
        "add nope -t claude -s user --transport http"
      );
      expect(output).toContain("--url is required");
    });

    it("errors when --env is used with http", () => {
      const output = cliExpectError(
        'add nope -t claude -s user --transport http --url "https://mcp.example.com" -e KEY=value'
      );
      expect(output).toContain("--env can only be used with stdio transport");
    });

    it("errors when --header is used with stdio", () => {
      const output = cliExpectError(
        'add nope -t claude -s user --transport stdio --command "node server.js" --header "Authorization=Bearer API_KEY"'
      );
      expect(output).toContain("--header can only be used with http transport");
    });

    it("errors for invalid tool", () => {
      const output = cliExpectError(
        'add nope -t invalid -s user --transport stdio --command "x"'
      );
      expect(output).toContain("Invalid tool");
    });

    it("errors for invalid scope", () => {
      const output = cliExpectError(
        'add nope -t claude -s invalid --transport stdio --command "x"'
      );
      expect(output).toContain("Invalid scope");
    });

    it("errors for invalid transport", () => {
      const output = cliExpectError(
        'add nope -t claude -s user --transport bad --command "x"'
      );
      expect(output).toContain("Invalid transport");
    });
  });

  describe("rm command (non-interactive with --yes)", () => {
    it("removes server from claude config", () => {
      fs.writeFileSync(
        claudeFile,
        JSON.stringify({
          mcpServers: {
            "to-remove": { command: "npx", args: ["-y", "server"] },
          },
        })
      );

      cliWithHome("rm to-remove -t claude -s user -y");

      const data = JSON.parse(fs.readFileSync(claudeFile, "utf-8"));
      expect(data.mcpServers["to-remove"]).toBeUndefined();
    });

    it("removes server from opencode config", () => {
      fs.writeFileSync(
        opencodeFile,
        JSON.stringify({
          mcp: {
            "to-remove": { type: "local", command: ["node"], enabled: true },
          },
        })
      );

      cliWithHome("rm to-remove -t opencode -s user -y");

      const data = JSON.parse(fs.readFileSync(opencodeFile, "utf-8"));
      expect(data.mcp["to-remove"]).toBeUndefined();
    });

    it("warns when server not found", () => {
      const output = cliExpectError("rm nonexistent -t claude -s user -y");
      expect(output).toContain("not found");
    });
  });

  describe("compare command", () => {
    it("shows configured and missing locations for direct usage", () => {
      fs.writeFileSync(
        claudeFile,
        JSON.stringify({
          mcpServers: {
            "brave-search": { command: "npx", args: ["-y", "brave-search"] },
          },
        })
      );
      fs.writeFileSync(
        opencodeProjectFile,
        JSON.stringify({
          mcp: {
            "brave-search": {
              type: "local",
              command: ["npx", "-y", "brave-search"],
              enabled: true,
            },
          },
        })
      );

      const output = cliWithHome("compare brave-search");
      expect(compact(output)).toContain(compact("Claude Code (user)"));
      expect(compact(output)).toContain(compact("OpenCode (project)"));
      expect(compact(output)).toContain(compact("OpenCode (user)"));
      expect(compact(output)).toContain(compact("Cline (user)"));
      expect(compact(output)).not.toContain(compact("Cline (project)"));
      expect(compact(output)).toContain(
        compact(
          "mcps copy brave-search --from-tool claude --from-scope user --tool opencode --scope user"
        )
      );
    });

    it("reports missing-everywhere without copy hints", () => {
      const output = cliWithHome("compare nonexistent-server");
      expect(compact(output)).toContain(compact("Claude Code (user)"));
      expect(compact(output)).toContain(compact("OpenCode (project)"));
      expect(compact(output)).toContain(
        compact(
          "No copy hints available until this server is configured in at least one supported location"
        )
      );
    });

  });
});
