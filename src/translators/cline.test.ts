import { describe, it, expect } from "vitest";
import { fromCline, toCline } from "./cline.js";

describe("fromCline", () => {
  it("parses stdio server with command and args", () => {
    const result = fromCline("myserver", {
      command: "npx",
      args: ["-y", "server"],
      disabled: false,
    });
    expect(result).toEqual({
      name: "myserver",
      transport: "stdio",
      command: ["npx", "-y", "server"],
      env: undefined,
      disabled: false,
    });
  });

  it("parses stdio server with env", () => {
    const result = fromCline("myserver", {
      command: "node",
      args: ["server.js"],
      env: { KEY: "val" },
      disabled: false,
    });
    expect(result.env).toEqual({ KEY: "val" });
  });

  it("parses stdio server with no command or args", () => {
    const result = fromCline("myserver", { disabled: false });
    expect(result).toEqual({
      name: "myserver",
      transport: "stdio",
      command: [],
      env: undefined,
      disabled: false,
    });
  });

  it("parses streamableHttp server", () => {
    const result = fromCline("myserver", {
      url: "https://mcp.example.com",
      type: "streamableHttp",
      disabled: false,
    });
    expect(result).toEqual({
      name: "myserver",
      transport: "http",
      url: "https://mcp.example.com",
      headers: undefined,
      disabled: false,
    });
  });

  it("parses sse server", () => {
    const result = fromCline("myserver", {
      url: "https://mcp.example.com/sse",
      type: "sse",
      disabled: true,
    });
    expect(result.transport).toBe("http");
    expect(result.url).toBe("https://mcp.example.com/sse");
    expect(result.disabled).toBe(true);
  });

  it("omits autoApprove from universal model", () => {
    const result = fromCline("myserver", {
      command: "node",
      args: [],
      autoApprove: ["tool1"],
    });
    expect(result).not.toHaveProperty("autoApprove");
  });

  it("omits timeout from universal model", () => {
    const result = fromCline("myserver", {
      url: "https://mcp.example.com",
      type: "streamableHttp",
      timeout: 120,
    });
    expect(result).not.toHaveProperty("timeout");
  });
});

describe("toCline", () => {
  it("converts stdio server", () => {
    const result = toCline({
      name: "myserver",
      transport: "stdio",
      command: ["npx", "-y", "server"],
    });
    expect(result).toEqual({
      command: "npx",
      args: ["-y", "server"],
      disabled: false,
    });
  });

  it("converts stdio server with env", () => {
    const result = toCline({
      name: "myserver",
      transport: "stdio",
      command: ["node"],
      env: { KEY: "val" },
    });
    expect(result.env).toEqual({ KEY: "val" });
  });

  it("converts stdio server without env when empty", () => {
    const result = toCline({
      name: "myserver",
      transport: "stdio",
      command: ["node"],
    });
    expect(result).not.toHaveProperty("env");
  });

  it("converts http server", () => {
    const result = toCline({
      name: "myserver",
      transport: "http",
      url: "https://mcp.example.com",
    });
    expect(result).toEqual({
      url: "https://mcp.example.com",
      type: "streamableHttp",
      disabled: false,
      timeout: 60,
    });
  });

  it("converts disabled server", () => {
    const result = toCline({
      name: "myserver",
      transport: "stdio",
      command: ["node"],
      disabled: true,
    });
    expect(result.disabled).toBe(true);
  });

  it("converts stdio server with empty command array", () => {
    const result = toCline({
      name: "myserver",
      transport: "stdio",
      command: [],
    });
    expect(result).toEqual({
      command: "",
      args: [],
      disabled: false,
    });
  });
});
