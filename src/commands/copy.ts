import { Command } from "commander";
import * as clack from "@clack/prompts";
import pc from "picocolors";
import { readServers } from "../config/reader.js";
import { writeServer } from "../config/writer.js";
import type { LocatedServer, Scope, Tool } from "../types.js";

export const copyCommand = new Command("copy")
  .alias("cp")
  .description("Copy an MCP server to another tool or scope")
  .argument("<name>", "Server name")
  .option("-t, --tool <tool>", "Target tool: claude | opencode | cline | all")
  .option("-s, --scope <scope>", "Target scope: user | project")
  .option("--from-tool <tool>", "Source tool: claude | opencode | cline")
  .option("--from-scope <scope>", "Source scope: user | project")
  .option("-f, --force", "Overwrite if server exists at destination")
  .addHelpText(
    "after",
    `
Examples:
  $ mcps copy brave-search                            # interactive wizard
  $ mcps cp brave-search --tool opencode --scope user
  $ mcps copy notion --tool claude --scope project --from-tool opencode --from-scope user
  $ mcps cp myserver --tool all --scope user --force`
  )
  .action(async (name: string, opts: CopyOpts) => {
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
  opts: CopyOpts,
  matches: LocatedServer[]
) {
  const targetTool = opts.tool as Tool | "all";
  const targetScope = opts.scope as Scope;

  if (opts.tool === "both") {
    clack.log.error(`"both" is not supported. Use "all" for all tools, or specify claude, opencode, or cline.`);
    return;
  }
  if (
    targetTool !== "claude" &&
    targetTool !== "opencode" &&
    targetTool !== "cline" &&
    targetTool !== "all"
  ) {
    clack.log.error(
      `Invalid tool "${opts.tool}". Use claude, opencode, cline, or all.`
    );
    return;
  }
  if (targetScope !== "user" && targetScope !== "project") {
    clack.log.error(`Invalid scope "${opts.scope}". Use user or project.`);
    return;
  }

  let source = matches;

  if (opts.fromTool) {
    if (opts.fromTool !== "claude" && opts.fromTool !== "opencode" && opts.fromTool !== "cline") {
      clack.log.error(
        `Invalid --from-tool "${opts.fromTool}". Use claude, opencode, or cline.`
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
    targetTool === "all"
      ? ["claude", "opencode", "cline"]
      : [targetTool as Tool];

  for (const t of targets) {
    if (t === "cline" && targetScope === "project") {
      clack.log.warn("Cline only supports user scope. Skipping.");
      continue;
    }
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
      `Copied "${name}" from ${located.tool} (${located.scope}) to ${t} (${targetScope})`
    );
  }
}

async function runInteractive(
  name: string,
  opts: CopyOpts,
  matches: LocatedServer[]
) {
  clack.intro(pc.bgCyan(pc.black(` Copy MCP Server: ${name} `)));

  let source: LocatedServer;

  if (matches.length === 1) {
    source = matches[0];
    clack.log.info(
      `Found in ${source.tool} (${source.scope})`
    );
  } else {
    const sourceResult = await clack.select({
      message: "Which source to copy from?",
      options: matches.map((ls) => ({
        value: ls,
        label: `${ls.tool} (${ls.scope})`,
      })),
    });
    if (clack.isCancel(sourceResult)) return;
    source = sourceResult as LocatedServer;
  }

  const toolResult = await clack.select({
    message: "Copy to which tool?",
    options: [
      { value: "claude", label: "Claude Code" },
      { value: "opencode", label: "OpenCode" },
      { value: "cline", label: "Cline" },
      { value: "all", label: "All" },
    ],
  });
  if (clack.isCancel(toolResult)) return;
  const targetTool = toolResult as Tool | "all";

  const scopeResult = await clack.select({
    message: "Copy to which scope?",
    options: [
      { value: "user", label: "User (global)" },
      { value: "project", label: "Project" },
    ],
  });
  if (clack.isCancel(scopeResult)) return;
  const targetScope = scopeResult as Scope;

  const targets: Tool[] =
    targetTool === "all"
      ? ["claude", "opencode", "cline"]
      : [targetTool as Tool];

  for (const t of targets) {
    if (t === "cline" && targetScope === "project") {
      clack.log.warn("Cline only supports user scope. Skipping.");
      continue;
    }
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
    clack.log.success(
      `Copied "${name}" from ${source.tool} (${source.scope}) to ${t} (${targetScope})`
    );
  }

  clack.outro(pc.green("Done!"));
}

interface CopyOpts {
  tool?: string;
  scope?: string;
  fromTool?: string;
  fromScope?: string;
  force?: boolean;
}
