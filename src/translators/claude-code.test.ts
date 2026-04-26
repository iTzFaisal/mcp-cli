import { describe, it, expect } from "vitest";
import { fromClaudeCode, toClaudeCode } from "./claude-code.js";

describe("fromClaudeCode", () => {
  it("parses stdio server with command and args", () => {
    const result = fromClaudeCode("myserver", {
      command: "npx",
      args: ["-y", "my-server"],
    });
    expect(result).toEqual({
      name: "myserver",
      transport: "stdio",
      command: ["npx", "-y", "my-server"],
      env: undefined,
    });
  });

  it("parses stdio server with command only (no args)", () => {
    const result = fromClaudeCode("myserver", { command: "node" });
    expect(result).toEqual({
      name: "myserver",
      transport: "stdio",
      command: ["node"],
      env: undefined,
    });
  });

  it("parses stdio server with env", () => {
    const result = fromClaudeCode("myserver", {
      command: "npx",
      args: ["-y", "server"],
      env: { KEY: "val" },
    });
    expect(result.env).toEqual({ KEY: "val" });
  });

  it("parses stdio server with no command or args", () => {
    const result = fromClaudeCode("myserver", {});
    expect(result).toEqual({
      name: "myserver",
      transport: "stdio",
      command: [],
      env: undefined,
    });
  });

  it("parses http server", () => {
    const result = fromClaudeCode("myserver", {
      type: "http",
      url: "https://mcp.example.com",
    });
    expect(result).toEqual({
      name: "myserver",
      transport: "http",
      url: "https://mcp.example.com",
      headers: undefined,
    });
  });

  it("parses http server with headers", () => {
    const result = fromClaudeCode("myserver", {
      type: "http",
      url: "https://mcp.example.com",
      headers: { Authorization: "Bearer token" },
    });
    expect(result.headers).toEqual({ Authorization: "Bearer token" });
  });

  it("parses sse server as http", () => {
    const result = fromClaudeCode("myserver", {
      type: "sse",
      url: "https://mcp.example.com/sse",
    });
    expect(result.transport).toBe("http");
    expect(result.url).toBe("https://mcp.example.com/sse");
  });
});

describe("toClaudeCode", () => {
  it("converts stdio server", () => {
    const result = toClaudeCode({
      name: "myserver",
      transport: "stdio",
      command: ["npx", "-y", "my-server"],
    });
    expect(result).toEqual({
      command: "npx",
      args: ["-y", "my-server"],
    });
  });

  it("converts stdio server with env", () => {
    const result = toClaudeCode({
      name: "myserver",
      transport: "stdio",
      command: ["npx", "-y", "server"],
      env: { API_KEY: "secret" },
    });
    expect(result.env).toEqual({ API_KEY: "secret" });
  });

  it("converts stdio server without env when empty", () => {
    const result = toClaudeCode({
      name: "myserver",
      transport: "stdio",
      command: ["node"],
    });
    expect(result).not.toHaveProperty("env");
  });

  it("converts stdio server with empty command array", () => {
    const result = toClaudeCode({
      name: "myserver",
      transport: "stdio",
      command: [],
    });
    expect(result).toEqual({
      command: "",
      args: [],
    });
  });

  it("converts http server", () => {
    const result = toClaudeCode({
      name: "myserver",
      transport: "http",
      url: "https://mcp.example.com",
    });
    expect(result).toEqual({
      type: "http",
      url: "https://mcp.example.com",
    });
  });

  it("converts http server with headers", () => {
    const result = toClaudeCode({
      name: "myserver",
      transport: "http",
      url: "https://mcp.example.com",
      headers: { Authorization: "Bearer token" },
    });
    expect(result.headers).toEqual({ Authorization: "Bearer token" });
  });

  it("converts http server without headers when empty", () => {
    const result = toClaudeCode({
      name: "myserver",
      transport: "http",
      url: "https://mcp.example.com",
      headers: {},
    });
    expect(result).not.toHaveProperty("headers");
  });
});
