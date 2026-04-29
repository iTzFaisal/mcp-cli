import { describe, it, expect, vi, afterEach } from "vitest";
import * as clack from "@clack/prompts";
import { addCommand } from "./add.js";
import { readServers } from "../config/reader.js";
import { writeServer } from "../config/writer.js";

const CANCEL = Symbol("cancel");

vi.mock("@clack/prompts", () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  select: vi.fn(),
  text: vi.fn(),
  confirm: vi.fn(),
  isCancel: vi.fn((value: unknown) => value === CANCEL),
  log: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("../config/reader.js", () => ({
  readServers: vi.fn(),
}));

vi.mock("../config/writer.js", () => ({
  writeServer: vi.fn(),
}));

const mockedSelect = vi.mocked(clack.select);
const mockedText = vi.mocked(clack.text);
const mockedReadServers = vi.mocked(readServers);
const mockedWriteServer = vi.mocked(writeServer);

describe("add command", () => {
  afterEach(() => {
    mockedSelect.mockReset();
    mockedText.mockReset();
    mockedReadServers.mockReset();
    mockedWriteServer.mockReset();
  });

  it("prompts for env only for stdio servers", async () => {
    mockedReadServers.mockReturnValue([]);
    mockedSelect
      .mockResolvedValueOnce("claude")
      .mockResolvedValueOnce("user")
      .mockResolvedValueOnce("stdio");
    mockedText
      .mockResolvedValueOnce("npx -y my-server")
      .mockResolvedValueOnce("API_KEY=xxx,OTHER=val");

    await runAddAction(["stdio-srv"]);

    expect(mockedText).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        message: "Environment variables (KEY=VALUE, comma-separated, or leave empty):",
        placeholder: "API_KEY=xxx,OTHER=val",
      })
    );
    expect(mockedWriteServer).toHaveBeenCalledWith(
      {
        name: "stdio-srv",
        transport: "stdio",
        command: ["npx", "-y", "my-server"],
        env: { API_KEY: "xxx", OTHER: "val" },
      },
      "claude",
      "user"
    );
  });

  it("prompts for headers only for http servers", async () => {
    mockedReadServers.mockReturnValue([]);
    mockedSelect
      .mockResolvedValueOnce("cline")
      .mockResolvedValueOnce("user")
      .mockResolvedValueOnce("http");
    mockedText
      .mockResolvedValueOnce("https://mcp.notion.com/mcp")
      .mockResolvedValueOnce("Authorization=Bearer API_KEY,OTHER=val");

    await runAddAction(["notion"]);

    expect(mockedText).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        message: "HTTP headers (KEY=VALUE, comma-separated, or leave empty):",
        placeholder: "Authorization=Bearer API_KEY,OTHER=val",
      })
    );
    expect(mockedWriteServer).toHaveBeenCalledWith(
      {
        name: "notion",
        transport: "http",
        url: "https://mcp.notion.com/mcp",
        headers: {
          Authorization: "Bearer API_KEY",
          OTHER: "val",
        },
      },
      "cline",
      "user"
    );
  });
});

async function runAddAction(args: string[]) {
  addCommand.exitOverride();
  await addCommand.parseAsync(["node", "add", ...args], { from: "node" });
}
