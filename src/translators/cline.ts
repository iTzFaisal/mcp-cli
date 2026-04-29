import type { McpServer } from "../types.js";

export interface ClineServer {
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  type?: string;
  url?: string;
  headers?: Record<string, string>;
  disabled?: boolean;
  timeout?: number;
  autoApprove?: string[];
}

export function fromCline(name: string, raw: ClineServer): McpServer {
  if (raw.type === "streamableHttp" || raw.type === "sse") {
    return {
      name,
      transport: "http",
      url: raw.url,
      headers: raw.headers,
      disabled: raw.disabled,
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
    disabled: raw.disabled,
  };
}

export function toCline(server: McpServer): ClineServer {
  if (server.transport === "http") {
    const out: ClineServer = {
      url: server.url,
      type: "streamableHttp",
      disabled: server.disabled ?? false,
      timeout: 60,
    };
    if (server.headers && Object.keys(server.headers).length > 0) {
      out.headers = server.headers;
    }
    return out;
  }

  const cmd = server.command ?? [];
  const out: ClineServer = {
    command: cmd[0] ?? "",
    args: cmd.slice(1),
    disabled: server.disabled ?? false,
  };
  if (server.env && Object.keys(server.env).length > 0) {
    out.env = server.env;
  }
  return out;
}
