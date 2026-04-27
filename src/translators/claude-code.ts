import type { McpServer } from "../types.js";

export interface ClaudeCodeServer {
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  type?: string;
  url?: string;
  headers?: Record<string, string>;
}

export function fromClaudeCode(
  name: string,
  raw: ClaudeCodeServer
): McpServer {
  if (raw.type === "http" || raw.type === "sse") {
    return {
      name,
      transport: "http",
      url: raw.url,
      headers: raw.headers,
      disabled: undefined,
    };
  }

  const cmd: string[] = [];
  if (raw.command) cmd.push(raw.command);
  if (raw.args) cmd.push(...raw.args);

    return {
      name,
      transport: "stdio",
      command: cmd,
      env: raw.env,
      disabled: undefined,
    };
}

export function toClaudeCode(server: McpServer): ClaudeCodeServer {
  if (server.transport === "http") {
    const out: ClaudeCodeServer = { type: "http", url: server.url };
    if (server.headers && Object.keys(server.headers).length > 0) {
      out.headers = server.headers;
    }
    return out;
  }

  const cmd = server.command ?? [];
  const out: ClaudeCodeServer = {
    command: cmd[0] ?? "",
    args: cmd.slice(1),
  };
  if (server.env && Object.keys(server.env).length > 0) {
    out.env = server.env;
  }
  return out;
}
