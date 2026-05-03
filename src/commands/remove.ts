import { Command } from "commander";
import * as clack from "@clack/prompts";
import pc from "picocolors";
import { readServers } from "../config/reader.js";
import { removeServer } from "../config/writer.js";
import type { Scope, Tool } from "../types.js";
import { ALL_TOOLS, supportsScope } from "../tools.js";

export const removeCommand = new Command("rm")
  .alias("remove")
  .description("Remove an MCP server from one or more tools")
  .argument("<name>", "Server name")
  .option("-t, --tool <tool>", "Tool: claude | opencode | cline | vscode | all (default: all)")
  .option("-s, --scope <scope>", "Scope: user | project (default: user)")
  .option("-y, --yes", "Skip confirmation prompt")
  .addHelpText(
    "after",
    `
Examples:
  $ mcps rm brave-search                          # interactive confirmation
  $ mcps rm brave-search -y                       # skip confirmation
  $ mcps rm notion -t claude -s project
  $ mcps rm myserver --tool all --scope user -y`
  )
  .action(async (name: string, opts: RmOpts) => {
    const tool = (opts.tool ?? "all") as Tool | "all";
    const scope = (opts.scope ?? "user") as Scope;

    if (opts.tool === "both") {
      clack.log.error(`"both" is not supported. Use "all" for all tools, or specify claude, opencode, cline, or vscode.`);
      return;
    }
    if (tool !== "claude" && tool !== "opencode" && tool !== "cline" && tool !== "vscode" && tool !== "all") {
      clack.log.error(`Invalid tool "${opts.tool}". Use claude, opencode, cline, vscode, or all.`);
      return;
    }
    if (scope !== "user" && scope !== "project") {
      clack.log.error(`Invalid scope "${opts.scope}". Use user or project.`);
      return;
    }

    const targets: Tool[] =
      tool === "all" ? ALL_TOOLS : [tool as Tool];

    const scopes: Scope[] = opts.scope ? [scope] : ["user", "project"];
    let found = false;

    for (const t of targets) {
      for (const s of scopes) {
        if (!supportsScope(t, s)) {
          clack.log.warn("Cline only supports user scope. Skipping.");
          continue;
        }
        const existing = readServers(t, s).find(
          (srv) => srv.server.name === name
        );
        if (!existing) {
          clack.log.warn(
            `Server "${name}" not found in ${t} (${s}).`
          );
          continue;
        }
        found = true;

        if (!opts.yes) {
          const confirm = await clack.confirm({
            message: `Remove "${name}" from ${t} (${s})?`,
          });
          if (clack.isCancel(confirm) || !confirm) {
            clack.log.info(`Skipped ${t} (${s}).`);
            continue;
          }
        }

        const removed = removeServer(name, t, s);
        if (removed) {
          clack.log.success(`Removed "${name}" from ${t} (${s}).`);
        } else {
          clack.log.error(
            `Server "${name}" not found in ${t} (${s}).`
          );
        }
      }
    }

    if (!found) {
      clack.log.error(
        pc.red(`Server "${name}" not found in any matching tool/scope.`)
      );
      process.exit(1);
    }
  });

interface RmOpts {
  tool?: string;
  scope?: string;
  yes?: boolean;
}
