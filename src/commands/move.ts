import { Command } from "commander";
import * as clack from "@clack/prompts";
import pc from "picocolors";
import { readServers } from "../config/reader.js";
import { writeServer, removeServer } from "../config/writer.js";
import type { LocatedServer, Scope, Tool } from "../types.js";

export const moveCommand = new Command("move")
  .alias("mv")
  .description("Move an MCP server to another tool or scope")
  .argument("<name>", "Server name")
  .option("-t, --tool <tool>", "Target tool: claude | opencode | both")
  .option("-s, --scope <scope>", "Target scope: user | project")
  .option("--from-tool <tool>", "Source tool: claude | opencode")
  .option("--from-scope <scope>", "Source scope: user | project")
  .option("-f, --force", "Overwrite if server exists at destination")
  .addHelpText(
    "after",
    `
Examples:
  $ mcps move brave-search                            # interactive wizard
  $ mcps mv brave-search --tool opencode --scope user
  $ mcps move notion --tool claude --scope project --from-tool opencode --from-scope user
  $ mcps mv myserver --tool both --scope user --force`
  )
  .action(async (name: string, opts: MoveOpts) => {
    const allServers = readServers();
    const matches = allServers.filter((ls) => ls.server.name === name);

    if (matches.length === 0) {
      clack.log.error(pc.red(`Server "${name}" not found.`));
      process.exit(1);
    }

    const isNonInteractive = opts.tool && opts.scope;

    if (isNonInteractive) {
      await runNonInteractive(name, opts, matches);
    } else {
      await runInteractive(name, opts, matches);
    }
  });

async function runNonInteractive(
  name: string,
  opts: MoveOpts,
  matches: LocatedServer[]
) {
  const targetTool = opts.tool as Tool | "both";
  const targetScope = opts.scope as Scope;

  if (
    targetTool !== "claude" &&
    targetTool !== "opencode" &&
    targetTool !== "both"
  ) {
    clack.log.error(
      `Invalid tool "${opts.tool}". Use claude, opencode, or both.`
    );
    return;
  }
  if (targetScope !== "user" && targetScope !== "project") {
    clack.log.error(`Invalid scope "${opts.scope}". Use user or project.`);
    return;
  }

  let source = matches;

  if (opts.fromTool) {
    if (opts.fromTool !== "claude" && opts.fromTool !== "opencode") {
      clack.log.error(
        `Invalid --from-tool "${opts.fromTool}". Use claude or opencode.`
      );
      return;
    }
    source = source.filter((ls) => ls.tool === opts.fromTool);
  }
  if (opts.fromScope) {
    if (opts.fromScope !== "user" && opts.fromScope !== "project") {
      clack.log.error(
        `Invalid --from-scope "${opts.fromScope}". Use user or project.`
      );
      return;
    }
    source = source.filter((ls) => ls.scope === opts.fromScope);
  }

  if (source.length === 0) {
    clack.log.error(
      pc.red(`Server "${name}" not found in specified source.`)
    );
    process.exit(1);
  }

  if (source.length > 1) {
    clack.log.error(
      pc.red(
        `Server "${name}" found in multiple locations. Use --from-tool and --from-scope to specify the source:`
      )
    );
    for (const ls of source) {
      clack.log.info(`  ${ls.tool} (${ls.scope})`);
    }
    process.exit(1);
  }

  const located = source[0];
  const targets: Tool[] =
    targetTool === "both"
      ? ["claude", "opencode"]
      : [targetTool as Tool];

  const nonSourceTargets = targets.filter(
    (t) => !(t === located.tool && targetScope === located.scope)
  );

  if (nonSourceTargets.length === 0) {
    clack.log.error(
      pc.red(
        `Source and destination are the same: ${located.tool} (${targetScope}). Nothing to move.`
      )
    );
    process.exit(1);
  }

  for (const t of nonSourceTargets) {
    if (!opts.force) {
      const existing = readServers(t, targetScope).find(
        (s) => s.server.name === name
      );
      if (existing) {
        clack.log.error(
          pc.red(
            `Server "${name}" already exists in ${t} (${targetScope}). Use --force to overwrite.`
          )
        );
        process.exit(1);
      }
    }

    writeServer(located.server, t, targetScope);
    clack.log.success(
      `Wrote "${name}" to ${t} (${targetScope})`
    );
  }

  const removed = removeServer(name, located.tool, located.scope);
  if (removed) {
    clack.log.success(
      pc.green(
        `Moved "${name}" from ${located.tool} (${located.scope}) to ${nonSourceTargets.map((t) => `${t} (${targetScope})`).join(", ")}`
      )
    );
  }
}

async function runInteractive(
  name: string,
  _opts: MoveOpts,
  matches: LocatedServer[]
) {
  clack.intro(pc.bgCyan(pc.black(` Move MCP Server: ${name} `)));

  let source: LocatedServer;

  if (matches.length === 1) {
    source = matches[0];
    clack.log.info(`Found in ${source.tool} (${source.scope})`);
  } else {
    const sourceResult = await clack.select({
      message: "Which source to move from?",
      options: matches.map((ls) => ({
        value: ls,
        label: `${ls.tool} (${ls.scope})`,
      })),
    });
    if (clack.isCancel(sourceResult)) {
      clack.outro(pc.yellow("Cancelled."));
      return;
    }
    source = sourceResult as LocatedServer;
  }

  const toolResult = await clack.select({
    message: "Move to which tool?",
    options: [
      { value: "claude", label: "Claude Code" },
      { value: "opencode", label: "OpenCode" },
      { value: "both", label: "Both" },
    ],
  });
  if (clack.isCancel(toolResult)) {
    clack.outro(pc.yellow("Cancelled."));
    return;
  }
  const targetTool = toolResult as Tool | "both";

  const scopeResult = await clack.select({
    message: "Move to which scope?",
    options: [
      { value: "user", label: "User (global)" },
      { value: "project", label: "Project" },
    ],
  });
  if (clack.isCancel(scopeResult)) {
    clack.outro(pc.yellow("Cancelled."));
    return;
  }
  const targetScope = scopeResult as Scope;

  const targets: Tool[] =
    targetTool === "both"
      ? ["claude", "opencode"]
      : [targetTool as Tool];

  const isSameSource = targets.some(
    (t) => t === source.tool && targetScope === source.scope
  );
  if (targets.length === 1 && isSameSource) {
    clack.log.error(
      pc.red(
        `Source and destination are the same: ${source.tool} (${targetScope}). Nothing to move.`
      )
    );
    clack.outro(pc.yellow("No changes made."));
    return;
  }

  for (const t of targets) {
    if (t === source.tool && targetScope === source.scope) continue;

    const existing = readServers(t, targetScope).find(
      (s) => s.server.name === name
    );
    if (existing) {
      const overwrite = await clack.confirm({
        message: `Server "${name}" already exists in ${t} (${targetScope}). Overwrite?`,
      });
      if (clack.isCancel(overwrite) || !overwrite) {
        clack.log.info(
          `Skipped ${t} (${targetScope}) — server "${name}" already exists.`
        );
        continue;
      }
    }

    writeServer(source.server, t, targetScope);
    clack.log.success(`Wrote "${name}" to ${t} (${targetScope})`);
  }

  const removed = removeServer(name, source.tool, source.scope);
  if (removed) {
    clack.log.success(
      pc.green(
        `Moved "${name}" from ${source.tool} (${source.scope}) to ${targets.map((t) => `${t} (${targetScope})`).join(", ")}`
      )
    );
  }

  clack.outro(pc.green("Done!"));
}

interface MoveOpts {
  tool?: string;
  scope?: string;
  fromTool?: string;
  fromScope?: string;
  force?: boolean;
}
