import type { McpServer } from "../types.js";

export interface VsCodeServer {
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  type?: string;
  url?: string;
  headers?: Record<string, string>;
}

export function fromVsCode(name: string, raw: VsCodeServer): McpServer {
  if (raw.type === "http" || raw.type === "sse") {
    return {
      name,
      transport: "http",
      url: raw.url,
      headers: raw.headers,
      disabled: undefined,
    };
  }

  const command: string[] = [];
  if (raw.command) command.push(raw.command);
  if (raw.args) command.push(...raw.args);

  return {
    name,
    transport: "stdio",
    command,
    env: raw.env,
    disabled: undefined,
  };
}

export function toVsCode(server: McpServer): VsCodeServer {
  if (server.transport === "http") {
    const out: VsCodeServer = { type: "http", url: server.url };
    if (server.headers && Object.keys(server.headers).length > 0) {
      out.headers = server.headers;
    }
    return out;
  }

  const command = server.command ?? [];
  const out: VsCodeServer = {
    command: command[0] ?? "",
    args: command.slice(1),
  };
  if (server.env && Object.keys(server.env).length > 0) {
    out.env = server.env;
  }
  return out;
}
