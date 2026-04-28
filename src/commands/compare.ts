import { Command } from "commander";
import * as clack from "@clack/prompts";
import pc from "picocolors";
import { readServers } from "../config/reader.js";
import type { LocatedServer, Scope, Tool } from "../types.js";

export interface CompareTarget {
  tool: Tool;
  scope: Scope;
}

export interface CompareResult {
  name: string;
  configured: LocatedServer[];
  missing: CompareTarget[];
}

export const SUPPORTED_COMPARE_TARGETS: CompareTarget[] = [
  { tool: "claude", scope: "user" },
  { tool: "claude", scope: "project" },
  { tool: "opencode", scope: "user" },
  { tool: "opencode", scope: "project" },
  { tool: "cline", scope: "user" },
];

export const compareCommand = new Command("compare")
  .description("Compare an MCP server across supported tools and scopes")
  .argument("[name]", "Server name")
  .addHelpText(
    "after",
    `
Examples:
  $ mcps compare brave-search
  $ mcps compare                                  # interactive selection in a TTY`
  )
  .action(async (name?: string) => {
    const isInteractiveFlow = !name && process.stdin.isTTY && process.stdout.isTTY;

    if (!name) {
      if (!isInteractiveFlow) {
        clack.log.error("Server name is required when not running interactively.");
        return;
      }

      const selectedName = await promptForServerName();
      if (!selectedName) {
        clack.outro(pc.yellow("Cancelled."));
        return;
      }
      name = selectedName;
    }

    const result = buildCompareResult(name);
    let source = selectPreferredSource(result.configured);
    const needsSourcePrompt = isInteractiveFlow && result.configured.length > 1;

    if (needsSourcePrompt) {
      const selectedSource = await promptForSource(result.configured);
      if (!selectedSource) {
        clack.outro(pc.yellow("Cancelled."));
        return;
      }
      source = selectedSource;
    }

    const hints = source
      ? buildCopyHints(
          result.name,
          result.missing,
          source,
          result.configured.length > 1
        )
      : [];

    renderCompareResult(result, hints, source);
  });

export function buildCompareResult(name: string): CompareResult {
  const allServers = readServers();
  const configured: LocatedServer[] = [];
  const missing: CompareTarget[] = [];

  for (const target of SUPPORTED_COMPARE_TARGETS) {
    const match = allServers.find(
      (server) =>
        server.server.name === name &&
        server.tool === target.tool &&
        server.scope === target.scope
    );

    if (match) {
      configured.push(match);
    } else {
      missing.push(target);
    }
  }

  return { name, configured, missing };
}

export function selectPreferredSource(
  configured: LocatedServer[]
): LocatedServer | undefined {
  for (const target of SUPPORTED_COMPARE_TARGETS) {
    const match = configured.find(
      (server) => server.tool === target.tool && server.scope === target.scope
    );
    if (match) return match;
  }

  return undefined;
}

export function buildCopyHints(
  name: string,
  missing: CompareTarget[],
  source: LocatedServer,
  includeSourceFlags: boolean
): string[] {
  return missing.map((target) => {
    const fromFlags = includeSourceFlags
      ? ` --from-tool ${source.tool} --from-scope ${source.scope}`
      : "";
    return `mcps copy ${name}${fromFlags} --tool ${target.tool} --scope ${target.scope}`;
  });
}

export function formatTarget(target: CompareTarget): string {
  return `${toolLabel(target.tool)} (${target.scope})`;
}

async function promptForServerName(): Promise<string | undefined> {
  const names = [...new Set(readServers().map((server) => server.server.name))].sort();

  if (names.length === 0) {
    clack.log.info("No configured MCP servers found to compare.");
    return undefined;
  }

  const result = await clack.select({
    message: "Which MCP server do you want to compare?",
    options: names.map((serverName) => ({
      value: serverName,
      label: serverName,
    })),
  });

  if (clack.isCancel(result)) return undefined;
  return result as string;
}

async function promptForSource(
  configured: LocatedServer[]
): Promise<LocatedServer | undefined> {
  const result = await clack.select({
    message: "Which configured location should hints copy from?",
    options: configured.map((server) => ({
      value: server,
      label: formatTarget(server),
    })),
  });

  if (clack.isCancel(result)) return undefined;
  return result as LocatedServer;
}

function renderCompareResult(
  result: CompareResult,
  hints: string[],
  source?: LocatedServer
) {
  const configuredLines =
    result.configured.length > 0
      ? result.configured.map((server) => `- ${formatTarget(server)}`).join("\n")
      : "- none";
  const missingLines = result.missing.map((target) => `- ${formatTarget(target)}`).join("\n");
  const hintLines =
    hints.length > 0
      ? hints.map((hint) => `- ${hint}`).join("\n")
      : "- No copy hints available until this server is configured in at least one supported location.";

  const sourceLine = source
    ? `\nHint source: ${formatTarget(source)}`
    : "\nHint source: none available";

  clack.note(
    [
      `Configured:\n${configuredLines}`,
      `Missing:\n${missingLines}`,
      `Copy hints:\n${hintLines}${sourceLine}`,
    ].join("\n\n"),
    `Compare: ${pc.bold(result.name)}`
  );
}

function toolLabel(tool: Tool): string {
  if (tool === "claude") return "Claude Code";
  if (tool === "opencode") return "OpenCode";
  return "Cline";
}
