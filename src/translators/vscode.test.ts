import { describe, it, expect } from "vitest";
import { fromVsCode, toVsCode } from "./vscode.js";

describe("fromVsCode", () => {
  it("parses stdio server with command and args", () => {
    expect(
      fromVsCode("myserver", {
        command: "npx",
        args: ["-y", "my-server"],
        env: { API_KEY: "${input:api-key}" },
      })
    ).toEqual({
      name: "myserver",
      transport: "stdio",
      command: ["npx", "-y", "my-server"],
      env: { API_KEY: "${input:api-key}" },
      disabled: undefined,
    });
  });

  it("parses http server", () => {
    expect(
      fromVsCode("myserver", {
        type: "http",
        url: "https://mcp.example.com",
        headers: { Authorization: "Bearer ${input:token}" },
      })
    ).toEqual({
      name: "myserver",
      transport: "http",
      url: "https://mcp.example.com",
      headers: { Authorization: "Bearer ${input:token}" },
      disabled: undefined,
    });
  });

  it("parses sse server as http", () => {
    const result = fromVsCode("myserver", {
      type: "sse",
      url: "https://mcp.example.com/sse",
    });
    expect(result.transport).toBe("http");
    expect(result.url).toBe("https://mcp.example.com/sse");
  });
});

describe("toVsCode", () => {
  it("converts stdio server", () => {
    expect(
      toVsCode({
        name: "myserver",
        transport: "stdio",
        command: ["npx", "-y", "my-server"],
        env: { API_KEY: "${input:api-key}" },
        disabled: true,
      })
    ).toEqual({
      command: "npx",
      args: ["-y", "my-server"],
      env: { API_KEY: "${input:api-key}" },
    });
  });

  it("converts http server and omits disabled state", () => {
    const result = toVsCode({
      name: "myserver",
      transport: "http",
      url: "https://mcp.example.com",
      headers: { Authorization: "Bearer ${input:token}" },
      disabled: true,
    });
    expect(result).toEqual({
      type: "http",
      url: "https://mcp.example.com",
      headers: { Authorization: "Bearer ${input:token}" },
    });
    expect(result).not.toHaveProperty("disabled");
  });
});
