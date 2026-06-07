import { describe, it, expect } from "vitest";
import { fromHermes, toHermes } from "./hermes.js";

describe("fromHermes", () => {
  it("parses stdio server", () => {
    expect(
      fromHermes("myserver", {
        command: "node",
        args: ["server.js"],
        env: { KEY: "val" },
      })
    ).toEqual({
      name: "myserver",
      transport: "stdio",
      command: ["node", "server.js"],
      env: { KEY: "val" },
      disabled: undefined,
    });
  });

  it("parses http server and disabled state", () => {
    expect(
      fromHermes("myserver", {
        url: "https://example.com/mcp",
        headers: { Authorization: "Bearer API_KEY" },
        enabled: false,
      })
    ).toEqual({
      name: "myserver",
      transport: "http",
      url: "https://example.com/mcp",
      headers: { Authorization: "Bearer API_KEY" },
      disabled: true,
    });
  });
});

describe("toHermes", () => {
  it("converts stdio server", () => {
    expect(
      toHermes({
        name: "myserver",
        transport: "stdio",
        command: ["npx", "-y", "server"],
        env: { KEY: "val" },
      })
    ).toEqual({
      command: "npx",
      args: ["-y", "server"],
      env: { KEY: "val" },
      enabled: true,
    });
  });

  it("converts http server and omits unsupported Hermes fields", () => {
    const result = toHermes({
      name: "myserver",
      transport: "http",
      url: "https://example.com/mcp",
      headers: { Authorization: "Bearer API_KEY" },
      disabled: true,
    });

    expect(result).toEqual({
      url: "https://example.com/mcp",
      headers: { Authorization: "Bearer API_KEY" },
      enabled: false,
    });
    expect(result).not.toHaveProperty("auth");
    expect(result).not.toHaveProperty("timeout");
    expect(result).not.toHaveProperty("connect_timeout");
  });
});
