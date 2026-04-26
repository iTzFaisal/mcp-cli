import { describe, it, expect } from "vitest";
import { fromOpenCode, toOpenCode } from "./opencode.js";

describe("fromOpenCode", () => {
  it("parses local server with command", () => {
    const result = fromOpenCode("myserver", {
      type: "local",
      command: ["npx", "-y", "my-server"],
    });
    expect(result).toEqual({
      name: "myserver",
      transport: "stdio",
      command: ["npx", "-y", "my-server"],
      env: undefined,
    });
  });

  it("parses local server with environment", () => {
    const result = fromOpenCode("myserver", {
      type: "local",
      command: ["node", "server.js"],
      environment: { KEY: "val" },
    });
    expect(result.env).toEqual({ KEY: "val" });
  });

  it("parses remote server", () => {
    const result = fromOpenCode("myserver", {
      type: "remote",
      url: "https://mcp.example.com",
    });
    expect(result).toEqual({
      name: "myserver",
      transport: "http",
      url: "https://mcp.example.com",
      headers: undefined,
    });
  });

  it("parses remote server with headers", () => {
    const result = fromOpenCode("myserver", {
      type: "remote",
      url: "https://mcp.example.com",
      headers: { Authorization: "Bearer token" },
    });
    expect(result.headers).toEqual({ Authorization: "Bearer token" });
  });
});

describe("toOpenCode", () => {
  it("converts stdio server", () => {
    const result = toOpenCode({
      name: "myserver",
      transport: "stdio",
      command: ["npx", "-y", "my-server"],
    });
    expect(result).toEqual({
      type: "local",
      command: ["npx", "-y", "my-server"],
      enabled: true,
    });
  });

  it("converts stdio server with env", () => {
    const result = toOpenCode({
      name: "myserver",
      transport: "stdio",
      command: ["node"],
      env: { API_KEY: "secret" },
    });
    expect(result.environment).toEqual({ API_KEY: "secret" });
  });

  it("converts stdio server without env when empty", () => {
    const result = toOpenCode({
      name: "myserver",
      transport: "stdio",
      command: ["node"],
    });
    expect(result).not.toHaveProperty("environment");
  });

  it("converts stdio server with empty command array", () => {
    const result = toOpenCode({
      name: "myserver",
      transport: "stdio",
      command: [],
    });
    expect(result.command).toEqual([]);
  });

  it("converts http server", () => {
    const result = toOpenCode({
      name: "myserver",
      transport: "http",
      url: "https://mcp.example.com",
    });
    expect(result).toEqual({
      type: "remote",
      url: "https://mcp.example.com",
      enabled: true,
    });
  });

  it("converts http server with headers", () => {
    const result = toOpenCode({
      name: "myserver",
      transport: "http",
      url: "https://mcp.example.com",
      headers: { Authorization: "Bearer token" },
    });
    expect(result.headers).toEqual({ Authorization: "Bearer token" });
  });

  it("converts http server without headers when empty", () => {
    const result = toOpenCode({
      name: "myserver",
      transport: "http",
      url: "https://mcp.example.com",
      headers: {},
    });
    expect(result).not.toHaveProperty("headers");
  });
});
