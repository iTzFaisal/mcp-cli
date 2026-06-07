import type { McpServer } from "../types.js";

export interface HermesServer {
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  headers?: Record<string, string>;
  enabled?: boolean;
}

export function fromHermes(name: string, raw: HermesServer): McpServer {
  if (raw.url) {
    return {
      name,
      transport: "http",
      url: raw.url,
      headers: raw.headers,
      disabled: raw.enabled !== undefined ? !raw.enabled : undefined,
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
    disabled: raw.enabled !== undefined ? !raw.enabled : undefined,
  };
}

export function toHermes(server: McpServer): HermesServer {
  const enabled = server.disabled !== undefined ? !server.disabled : true;

  if (server.transport === "http") {
    const out: HermesServer = {
      url: server.url,
      enabled,
    };
    if (server.headers && Object.keys(server.headers).length > 0) {
      out.headers = server.headers;
    }
    return out;
  }

  const command = server.command ?? [];
  const out: HermesServer = {
    command: command[0] ?? "",
    args: command.slice(1),
    enabled,
  };
  if (server.env && Object.keys(server.env).length > 0) {
    out.env = server.env;
  }
  return out;
}
