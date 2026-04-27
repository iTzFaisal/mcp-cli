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
    };
  }

  return {
    name,
    transport: "stdio",
    command: raw.command,
    env: raw.environment,
  };
}

export function toOpenCode(server: McpServer): OpenCodeServer {
  if (server.transport === "http") {
    const out: OpenCodeServer = {
      type: "remote",
      url: server.url,
      enabled: true,
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
    enabled: true,
    timeout: 60000,
  };
  if (server.env && Object.keys(server.env).length > 0) {
    out.environment = server.env;
  }
  return out;
}
