import { Command } from "commander";
import pc from "picocolors";
import * as clack from "@clack/prompts";
import { readServers } from "../config/reader.js";
import type { Tool, Scope } from "../types.js";

export const listCommand = new Command("list")
  .alias("ls")
  .description("List all configured MCP servers across tools")
  .option("-t, --tool <tool>", "Filter by tool (claude | opencode | cline)")
  .option("-s, --scope <scope>", "Filter by scope (user | project)")
  .addHelpText(
    "after",
    `
Examples:
$ mcps list

  $ mcps list --tool claude

  $ mcps list --scope project
  $ mcp ls -t opencode -s user`
  )
  .action((opts: { tool?: string; scope?: string }) => {
    const tool = opts.tool as Tool | undefined;
    const scope = opts.scope as Scope | undefined;

    if (tool && tool !== "claude" && tool !== "opencode" && tool !== "cline") {
      clack.log.error(`Invalid tool "${tool}". Use "claude", "opencode", or "cline".`);
      return;
    }

    if (scope && scope !== "user" && scope !== "project") {
      clack.log.error(`Invalid scope "${scope}". Use "user" or "project".`);
      return;
    }

    if (tool === "cline" && scope === "project") {
      clack.log.warn("Cline only supports user scope.");
      return;
    }

    const servers = readServers(tool, scope);

    if (servers.length === 0) {
      clack.log.info("No MCP servers configured.");
      return;
    }

    clack.note(
      servers
        .map((s) => {
          const toolLabel = s.tool === "claude"
            ? pc.cyan("claude")
            : s.tool === "opencode"
              ? pc.magenta("opencode")
              : pc.blue("cline");
          const scopeLabel = s.scope === "user"
            ? pc.green("user")
            : pc.yellow("project");
          const transport = s.server.transport === "stdio"
            ? pc.dim("stdio")
            : pc.dim("http");
          const detail =
            s.server.transport === "stdio"
              ? (s.server.command ?? []).join(" ")
              : s.server.url ?? "";
          return `${pc.bold(s.server.name)}  ${toolLabel}  ${scopeLabel}  ${transport}  ${pc.dim(detail)}`;
        })
        .join("\n"),
      `MCP Servers (${servers.length})`
    );
  });
