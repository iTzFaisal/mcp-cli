import type { McpServer } from "../types.js";

export interface OpenCodeServer {
  type: "local" | "remote";
  command?: string[];
  environment?: Record<string, string>;
  url?: string;
  headers?: Record<string, string>;
  enabled?: boolean;
  timeout?: number;
}

export function fromOpenCode(
  name: string,
  raw: OpenCodeServer
): McpServer {
  if (raw.type === "remote") {
    return {
      name,
      transport: "http",
      url: raw.url,
      headers: raw.headers,
      disabled: raw.enabled !== undefined ? !raw.enabled : undefined,
    };
  }

  return {
    name,
    transport: "stdio",
    command: raw.command,
    env: raw.environment,
    disabled: raw.enabled !== undefined ? !raw.enabled : undefined,
  };
}

export function toOpenCode(server: McpServer): OpenCodeServer {
  const enabled = server.disabled !== undefined ? !server.disabled : true;

  if (server.transport === "http") {
    const out: OpenCodeServer = {
      type: "remote",
      url: server.url,
      enabled,
      timeout: 60000,
    };
    if (server.headers && Object.keys(server.headers).length > 0) {
      out.headers = server.headers;
    }
    return out;
  }

  const out: OpenCodeServer = {
    type: "local",
    command: server.command ?? [],
    enabled,
    timeout: 60000,
  };
  if (server.env && Object.keys(server.env).length > 0) {
    out.environment = server.env;
  }
  return out;
}
