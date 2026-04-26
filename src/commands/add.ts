import { Command } from "commander";
import * as clack from "@clack/prompts";
import pc from "picocolors";
import { readServers } from "../config/reader.js";
import { writeServer } from "../config/writer.js";
import type { McpServer, Scope, Tool, Transport } from "../types.js";

export const addCommand = new Command("add")
  .description("Add an MCP server to one or more tools")
  .argument("<name>", "Server name")
  .option("-t, --tool <tool>", "Tool: claude | opencode | both")
  .option("-s, --scope <scope>", "Scope: user | project")
  .option("--transport <type>", "Transport: stdio | http")
  .option("--command <cmd>", 'Command (stdio transport), e.g. "npx -y my-server"')
  .option("--url <url>", "URL (http transport)")
  .option("-e, --env <pairs...>", "Environment variables (KEY=VALUE)")
  .addHelpText(
    "after",
    `
Examples:
  $ mcp add brave-search                         # interactive wizard
  $ mcp add myserver -t claude -s user --transport stdio --command "npx -y my-server"
  $ mcp add notion -t both -s user --transport http --url "https://mcp.notion.com/mcp"
  $ mcp add myserver -t opencode -s project --transport stdio --command "node server.js" -e KEY=val`
  )
  .action(async (name: string, opts: AddOpts) => {
    const isNonInteractive = opts.tool && opts.scope && opts.transport;

    let tool: Tool | "both";
    let scope: Scope;
    let transport: Transport;
    let command: string[] | undefined;
    let url: string | undefined;
    let env: Record<string, string> | undefined;

    if (isNonInteractive) {
      tool = opts.tool as Tool | "both";
      scope = opts.scope as Scope;
      transport = opts.transport as Transport;

      if (tool !== "claude" && tool !== "opencode" && tool !== "both") {
        clack.log.error(`Invalid tool "${opts.tool}". Use claude, opencode, or both.`);
        return;
      }
      if (scope !== "user" && scope !== "project") {
        clack.log.error(`Invalid scope "${opts.scope}". Use user or project.`);
        return;
      }
      if (transport !== "stdio" && transport !== "http") {
        clack.log.error(`Invalid transport "${opts.transport}". Use stdio or http.`);
        return;
      }

      if (transport === "stdio") {
        if (!opts.command) {
          clack.log.error("--command is required for stdio transport.");
          return;
        }
        command = splitCommand(opts.command);
      } else {
        if (!opts.url) {
          clack.log.error("--url is required for http transport.");
          return;
        }
        url = opts.url;
      }

      if (opts.env) {
        env = parseEnv(opts.env);
      }
    } else {
      clack.intro(pc.bgCyan(pc.black(` Add MCP Server: ${name} `)));

      const toolResult = await clack.select({
        message: "Which tool(s)?",
        options: [
          { value: "claude", label: "Claude Code" },
          { value: "opencode", label: "OpenCode" },
          { value: "both", label: "Both" },
        ],
      });
      if (clack.isCancel(toolResult)) return;
      tool = toolResult as Tool | "both";

      const scopeResult = await clack.select({
        message: "Which scope?",
        options: [
          { value: "user", label: "User (global)" },
          { value: "project", label: "Project" },
        ],
      });
      if (clack.isCancel(scopeResult)) return;
      scope = scopeResult as Scope;

      const transportResult = await clack.select({
        message: "Transport type?",
        options: [
          { value: "stdio", label: "stdio (local command)" },
          { value: "http", label: "http (remote URL)" },
        ],
      });
      if (clack.isCancel(transportResult)) return;
      transport = transportResult as Transport;

      if (transport === "stdio") {
        const cmdResult = await clack.text({
          message: "Command to run the server:",
          placeholder: "npx -y @example/mcp-server",
        });
        if (clack.isCancel(cmdResult)) return;
        command = splitCommand(cmdResult as string);
      } else {
        const urlResult = await clack.text({
          message: "Server URL:",
          placeholder: "https://mcp.example.com/mcp",
        });
        if (clack.isCancel(urlResult)) return;
        url = urlResult as string;
      }

      const envResult = await clack.text({
        message: "Environment variables (KEY=VALUE, comma-separated, or leave empty):",
        placeholder: "API_KEY=xxx,OTHER=val",
      });
      if (clack.isCancel(envResult)) return;
      const envStr = (envResult as string).trim();
      if (envStr) {
        env = parseEnv(envStr.split(/\s*,\s*/));
      }
    }

    const server: McpServer = {
      name,
      transport,
      ...(command && { command }),
      ...(url && { url }),
      ...(env && { env }),
    };

    const tools: (Tool | "both")[] = [tool];

    for (const t of tools) {
      const targets: Tool[] = t === "both" ? ["claude", "opencode"] : [t as Tool];
      for (const target of targets) {
        const existing = readServers(target, scope).find(
          (s) => s.server.name === name
        );
        if (existing) {
          const overwrite = await confirmOverwrite(name, target, scope);
          if (!overwrite) {
            clack.log.info(`Skipped ${target}/${scope} — server "${name}" already exists.`);
            continue;
          }
        }
        writeServer(server, target, scope);
        clack.log.success(`Added "${name}" to ${target} (${scope})`);
      }
    }

    clack.outro(pc.green("Done!"));
  });

async function confirmOverwrite(
  name: string,
  tool: Tool,
  scope: Scope
): Promise<boolean> {
  const result = await clack.confirm({
    message: `Server "${name}" already exists in ${tool} (${scope}). Overwrite?`,
  });
  if (clack.isCancel(result)) return false;
  return result as boolean;
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

function parseEnv(pairs: string[]): Record<string, string> {
  const env: Record<string, string> = {};
  for (const pair of pairs) {
    const eq = pair.indexOf("=");
    if (eq === -1) continue;
    const key = pair.slice(0, eq).trim();
    const val = pair.slice(eq + 1).trim();
    if (key) env[key] = val;
  }
  return env;
}

interface AddOpts {
  tool?: string;
  scope?: string;
  transport?: string;
  command?: string;
  url?: string;
  env?: string[];
}
