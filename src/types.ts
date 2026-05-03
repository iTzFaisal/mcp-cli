export type Transport = "stdio" | "http";

export type Scope = "user" | "project";

export type Tool = "claude" | "opencode" | "cline" | "vscode";

export interface McpServer {
  name: string;
  transport: Transport;
  command?: string[];
  url?: string;
  env?: Record<string, string>;
  headers?: Record<string, string>;
  disabled?: boolean;
}

export interface LocatedServer {
  server: McpServer;
  tool: Tool;
  scope: Scope;
}
