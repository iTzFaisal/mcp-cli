import { Command } from "commander";
import * as clack from "@clack/prompts";
import pc from "picocolors";
import { findBundledPreset } from "../catalog/presets.js";
import { readServers } from "../config/reader.js";
import { writeServer } from "../config/writer.js";
import type { McpServer, Scope, Tool, Transport } from "../types.js";
import { ALL_TOOLS, supportsScope } from "../tools.js";

export const addCommand = new Command("add")
  .description("Add an MCP server to one or more tools")
  .argument("<name>", "Server name")
  .option("-t, --tool <tool>", "Tool: claude | opencode | cline | vscode | all")
  .option("-s, --scope <scope>", "Scope: user | project")
  .option("--transport <type>", "Transport: stdio | http")
  .option(
    "--command <cmd>",
    'Command (stdio transport), e.g. "npx -y my-server"',
  )
  .option("--url <url>", "URL (http transport)")
  .option("-e, --env <pairs...>", "Environment variables (KEY=VALUE)")
  .option(
    "--header <pair>",
    "HTTP header (KEY=VALUE)",
    collectOption,
    [] as string[],
  )
  .addHelpText(
    "after",
    `
Examples:
  $ mcps add brave-search                         # interactive wizard
  $ mcps add myserver -t claude -s user --transport stdio --command "npx -y my-server"
  $ mcps add notion -t all -s user --transport http --url "https://mcp.notion.com/mcp" --header "Authorization=Bearer API_KEY" --header "OTHER=val"
  $ mcps add notion                               # interactive http headers placeholder: Authorization=Bearer API_KEY,OTHER=val
  $ mcps add myserver -t opencode -s project --transport stdio --command "node server.js" -e KEY=val`,
  )
  .action(async (name: string, opts: AddOpts) => {
    const isNonInteractive = opts.tool && opts.scope && opts.transport;

    let tools: Tool[];
    let scope: Scope;
    let transport: Transport | undefined;
    let command: string[] | undefined;
    let url: string | undefined;
    let env: Record<string, string> | undefined;
    let headers: Record<string, string> | undefined;
    let server: McpServer | undefined;

    if (isNonInteractive) {
      const tool = opts.tool as Tool | "all";
      scope = opts.scope as Scope;
      transport = opts.transport as Transport;

      if (opts.tool === "both") {
        clack.log.error(
          `"both" is not supported. Use "all" for all tools, or specify claude, opencode, cline, or vscode.`,
        );
        return;
      }
      if (
        tool !== "claude" &&
        tool !== "opencode" &&
        tool !== "cline" &&
        tool !== "vscode" &&
        tool !== "all"
      ) {
        clack.log.error(
          `Invalid tool "${opts.tool}". Use claude, opencode, cline, vscode, or all.`,
        );
        return;
      }
      tools = tool === "all" ? ALL_TOOLS : [tool];
      if (scope !== "user" && scope !== "project") {
        clack.log.error(`Invalid scope "${opts.scope}". Use user or project.`);
        return;
      }
      if (transport !== "stdio" && transport !== "http") {
        clack.log.error(
          `Invalid transport "${opts.transport}". Use stdio or http.`,
        );
        return;
      }

      if (transport === "stdio") {
        if (opts.header?.length) {
          clack.log.error("--header can only be used with http transport.");
          return;
        }
        if (!opts.command) {
          clack.log.error("--command is required for stdio transport.");
          return;
        }
        command = splitCommand(opts.command);
        if (opts.env) {
          env = parsePairs(opts.env);
        }
      } else {
        if (opts.env) {
          clack.log.error("--env can only be used with stdio transport.");
          return;
        }
        if (!opts.url) {
          clack.log.error("--url is required for http transport.");
          return;
        }
        url = opts.url;
        if (opts.header?.length) {
          headers = parsePairs(opts.header);
        }
      }

      server = {
        name,
        transport,
        ...(command && { command }),
        ...(url && { url }),
        ...(env && { env }),
        ...(headers && { headers }),
      };
    } else {
      clack.intro(pc.bgCyan(pc.black(` Add MCP Server: ${name} `)));

      const toolResult = await promptForTools();
      if (clack.isCancel(toolResult)) return;
      tools = toolResult as Tool[];

      const scopeResult = await clack.select({
        message: "Which scope?",
        options: [
          { value: "user", label: "User (global)" },
          { value: "project", label: "Project" },
        ],
      });
      if (clack.isCancel(scopeResult)) return;
      scope = scopeResult as Scope;

      const preset = findBundledPreset(name);
      if (preset) {
        clack.log.info(formatPresetSummary(preset));
        const presetAction = await promptForPresetAction(name);
        if (!presetAction) return;

        if (presetAction === "use") {
          server = preset;
        } else if (presetAction === "edit") {
          const editedServer = await promptForPresetEdits(preset);
          if (!editedServer) return;
          server = editedServer;
        } else {
          const manualServer = await promptForManualServer(name);
          if (!manualServer) return;
          server = manualServer;
        }
      } else {
        const manualServer = await promptForManualServer(name);
        if (!manualServer) return;
        server = manualServer;
      }
    }

    if (!server) return;

    for (const target of tools) {
      if (!supportsScope(target, scope)) {
        clack.log.warn("Cline only supports user scope. Skipping.");
        continue;
      }
      const existing = readServers(target, scope).find(
        (s) => s.server.name === name,
      );
      if (existing) {
        const overwrite = await confirmOverwrite(name, target, scope);
        if (!overwrite) {
          clack.log.info(
            `Skipped ${target}/${scope} — server "${name}" already exists.`,
          );
          continue;
        }
      }
      writeServer(server, target, scope);
      clack.log.success(`Added "${name}" to ${target} (${scope})`);
    }

    clack.outro(pc.green("Done!"));
  });

async function confirmOverwrite(
  name: string,
  tool: Tool,
  scope: Scope,
): Promise<boolean> {
  const result = await clack.confirm({
    message: `Server "${name}" already exists in ${tool} (${scope}). Overwrite?`,
  });
  if (clack.isCancel(result)) return false;
  return result as boolean;
}

async function promptForPresetAction(
  name: string,
): Promise<"use" | "edit" | "manual" | undefined> {
  const result = await clack.select({
    message:
      `Found an MCP configuration for "${name}". How would you like to continue?`,
    options: [
      { value: "use", label: "Use preset" },
      { value: "edit", label: "Edit preset" },
      { value: "manual", label: "Enter manually" },
    ],
  });
  if (clack.isCancel(result)) return undefined;
  return result as "use" | "edit" | "manual";
}

async function promptForManualServer(name: string): Promise<McpServer | undefined> {
  const transportResult = await clack.select({
    message: "Transport type?",
    options: [
      { value: "stdio", label: "stdio (local command)" },
      { value: "http", label: "http (remote URL)" },
    ],
  });
  if (clack.isCancel(transportResult)) return undefined;

  const transport = transportResult as Transport;
  if (transport === "stdio") {
    const cmdResult = await clack.text({
      message: "Command to run the server:",
      placeholder: "npx -y @example/mcp-server",
    });
    if (clack.isCancel(cmdResult)) return undefined;

    const envResult = await clack.text({
      message:
        "Environment variables (KEY=VALUE, comma-separated, or leave empty):",
      placeholder: "API_KEY=xxx,OTHER=val",
    });
    if (clack.isCancel(envResult)) return undefined;

    const envStr = (envResult as string).trim();
    return {
      name,
      transport,
      command: splitCommand(cmdResult as string),
      ...(envStr && { env: parsePairs(envStr.split(/\s*,\s*/)) }),
    };
  }

  const urlResult = await clack.text({
    message: "Server URL:",
    placeholder: "https://mcp.example.com/mcp",
  });
  if (clack.isCancel(urlResult)) return undefined;

  const headersResult = await clack.text({
    message: "HTTP headers (KEY=VALUE, comma-separated, or leave empty):",
    placeholder: "Authorization=Bearer API_KEY,OTHER=val",
  });
  if (clack.isCancel(headersResult)) return undefined;

  const headersStr = (headersResult as string).trim();
  return {
    name,
    transport,
    url: urlResult as string,
    ...(headersStr && { headers: parsePairs(headersStr.split(/\s*,\s*/)) }),
  };
}

async function promptForPresetEdits(
  preset: McpServer,
): Promise<McpServer | undefined> {
  if (preset.transport === "stdio") {
    const cmdResult = await clack.text({
      message: "Command to run the server:",
      placeholder: "npx -y @example/mcp-server",
      defaultValue: (preset.command ?? []).join(" "),
    });
    if (clack.isCancel(cmdResult)) return undefined;

    const envResult = await clack.text({
      message:
        "Environment variables (KEY=VALUE, comma-separated, or leave empty):",
      placeholder: "API_KEY=xxx,OTHER=val",
      defaultValue: formatKeyValuePairs(preset.env, ",") ?? "",
    });
    if (clack.isCancel(envResult)) return undefined;

    const envStr = (envResult as string).trim();
    return {
      name: preset.name,
      transport: preset.transport,
      command: splitCommand(cmdResult as string),
      ...(envStr && { env: parsePairs(envStr.split(/\s*,\s*/)) }),
    };
  }

  const urlResult = await clack.text({
    message: "Server URL:",
    placeholder: "https://mcp.example.com/mcp",
    defaultValue: preset.url ?? "",
  });
  if (clack.isCancel(urlResult)) return undefined;

  const headersResult = await clack.text({
    message: "HTTP headers (KEY=VALUE, comma-separated, or leave empty):",
    placeholder: "Authorization=Bearer API_KEY,OTHER=val",
    defaultValue: formatKeyValuePairs(preset.headers, ",") ?? "",
  });
  if (clack.isCancel(headersResult)) return undefined;

  const headersStr = (headersResult as string).trim();
  return {
    name: preset.name,
    transport: preset.transport,
    url: urlResult as string,
    ...(headersStr && { headers: parsePairs(headersStr.split(/\s*,\s*/)) }),
  };
}

function formatPresetSummary(server: McpServer): string {
  if (server.transport === "http") {
    const headerSummary = formatKeyValuePairs(server.headers);
    return headerSummary
      ? `Found preset for "${server.name}": http ${server.url} (${headerSummary})`
      : `Found preset for "${server.name}": http ${server.url}`;
  }

  const command = (server.command ?? []).join(" ");
  const envSummary = formatKeyValuePairs(server.env);
  return envSummary
    ? `Found preset for "${server.name}": stdio ${command} (${envSummary})`
    : `Found preset for "${server.name}": stdio ${command}`;
}

function formatKeyValuePairs(
  values: Record<string, string> | undefined,
  separator = ", ",
): string | undefined {
  if (!values || Object.keys(values).length === 0) return undefined;
  return Object.entries(values)
    .map(([key, value]) => `${key}=${value}`)
    .join(separator);
}

function splitCommand(input: string): string[] {
  const tokens: string[] = [];
  const regex = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(input)) !== null) {
    tokens.push(match[1] ?? match[2] ?? match[3]);
  }
  return tokens;
}

function parsePairs(pairs: string[]): Record<string, string> {
  const values: Record<string, string> = {};
  for (const pair of pairs) {
    const eq = pair.indexOf("=");
    if (eq === -1) continue;
    const key = pair.slice(0, eq).trim();
    const val = pair.slice(eq + 1).trim();
    if (key) values[key] = val;
  }
  return values;
}

function collectOption(value: string, previous: string[]): string[] {
  return [...previous, value];
}

async function promptForTools(): Promise<Tool[] | symbol> {
  return clack.multiselect({
    message:
      "Which tool(s)? Press Space to toggle, A to select or deselect all, Enter to submit.",
    required: true,
    cursorAt: ALL_TOOLS[0],
    options: [
      { value: "claude", label: "Claude Code" },
      { value: "opencode", label: "OpenCode" },
      { value: "cline", label: "Cline" },
      { value: "vscode", label: "VS Code" },
    ],
  }) as Promise<Tool[] | symbol>;
}

interface AddOpts {
  tool?: string;
  scope?: string;
  transport?: string;
  command?: string;
  url?: string;
  env?: string[];
  header?: string[];
}
