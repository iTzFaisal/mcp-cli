import { describe, it, expect, vi, afterEach } from "vitest";
import * as clack from "@clack/prompts";
import { addCommand } from "./add.js";
import { findBundledPreset } from "../catalog/presets.js";
import { readServers } from "../config/reader.js";
import { writeServer } from "../config/writer.js";

const CANCEL = Symbol("cancel");

vi.mock("@clack/prompts", () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  multiselect: vi.fn(),
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

vi.mock("../catalog/presets.js", () => ({
  findBundledPreset: vi.fn(),
}));

vi.mock("../config/writer.js", () => ({
  writeServer: vi.fn(),
}));

const mockedSelect = vi.mocked(clack.select);
const mockedMultiselect = vi.mocked(clack.multiselect);
const mockedText = vi.mocked(clack.text);
const mockedConfirm = vi.mocked(clack.confirm);
const mockedFindBundledPreset = vi.mocked(findBundledPreset);
const mockedReadServers = vi.mocked(readServers);
const mockedWriteServer = vi.mocked(writeServer);

describe("add command", () => {
  afterEach(() => {
    mockedMultiselect.mockReset();
    mockedSelect.mockReset();
    mockedText.mockReset();
    mockedConfirm.mockReset();
    mockedFindBundledPreset.mockReset();
    mockedReadServers.mockReset();
    mockedWriteServer.mockReset();
    vi.mocked(clack.log.info).mockReset();
    vi.mocked(clack.log.warn).mockReset();
    vi.mocked(clack.log.error).mockReset();
    vi.mocked(clack.log.success).mockReset();
  });

  it("uses a discovered preset when the user accepts it", async () => {
    mockedReadServers.mockReturnValue([]);
    mockedFindBundledPreset.mockReturnValue({
      name: "github",
      transport: "http",
      url: "https://api.githubcopilot.com/mcp/",
      headers: { Authorization: "Bearer YOUR_GITHUB_PAT" },
    });
    mockedMultiselect.mockResolvedValueOnce(["claude", "opencode", "cline"]);
    mockedSelect.mockResolvedValueOnce("user").mockResolvedValueOnce("use");

    await runAddAction(["github"]);

    expect(clack.log.info).toHaveBeenCalledWith(
      'Found preset for "github": http https://api.githubcopilot.com/mcp/ (Authorization=Bearer YOUR_GITHUB_PAT)',
    );
    expect(mockedSelect).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        message:
          'Found an MCP configuration for "github". How would you like to continue?',
      }),
    );
    expect(mockedConfirm).not.toHaveBeenCalled();
    expect(mockedText).not.toHaveBeenCalled();
    expect(mockedWriteServer).toHaveBeenCalledTimes(3);
    expect(mockedWriteServer).toHaveBeenNthCalledWith(
      1,
      {
        name: "github",
        transport: "http",
        url: "https://api.githubcopilot.com/mcp/",
        headers: { Authorization: "Bearer YOUR_GITHUB_PAT" },
      },
      "claude",
      "user",
    );
    expect(mockedWriteServer).toHaveBeenNthCalledWith(
      2,
      {
        name: "github",
        transport: "http",
        url: "https://api.githubcopilot.com/mcp/",
        headers: { Authorization: "Bearer YOUR_GITHUB_PAT" },
      },
      "opencode",
      "user",
    );
    expect(mockedWriteServer).toHaveBeenNthCalledWith(
      3,
      {
        name: "github",
        transport: "http",
        url: "https://api.githubcopilot.com/mcp/",
        headers: { Authorization: "Bearer YOUR_GITHUB_PAT" },
      },
      "cline",
      "user",
    );
  });

  it("falls back to manual prompts when the user declines a discovered preset", async () => {
    mockedReadServers.mockReturnValue([]);
    mockedFindBundledPreset.mockReturnValue({
      name: "github",
      transport: "http",
      url: "https://api.githubcopilot.com/mcp/",
      headers: { Authorization: "Bearer YOUR_GITHUB_PAT" },
    });
    mockedMultiselect.mockResolvedValueOnce(["claude"]);
    mockedSelect
      .mockResolvedValueOnce("user")
      .mockResolvedValueOnce("manual")
      .mockResolvedValueOnce("http");
    mockedText
      .mockResolvedValueOnce("https://example.com/custom")
      .mockResolvedValueOnce("Authorization=Bearer custom");

    await runAddAction(["github"]);

    expect(mockedText).toHaveBeenCalledTimes(2);
    expect(mockedWriteServer).toHaveBeenCalledWith(
      {
        name: "github",
        transport: "http",
        url: "https://example.com/custom",
        headers: { Authorization: "Bearer custom" },
      },
      "claude",
      "user",
    );
  });

  it("lets the user edit a discovered preset before adding", async () => {
    mockedReadServers.mockReturnValue([]);
    mockedFindBundledPreset.mockReturnValue({
      name: "consensus",
      transport: "http",
      url: "https://mcp.consensus.app/mcp",
      headers: { Authorization: "Bearer YOUR_API_KEY" },
    });
    mockedMultiselect.mockResolvedValueOnce(["claude"]);
    mockedSelect.mockResolvedValueOnce("user").mockResolvedValueOnce("edit");
    mockedText
      .mockResolvedValueOnce("https://mcp.consensus.app/custom")
      .mockResolvedValueOnce("Authorization=Bearer real-key");

    await runAddAction(["consensus"]);

    expect(mockedText).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        message: "Server URL:",
        defaultValue: "https://mcp.consensus.app/mcp",
      }),
    );
    expect(mockedText).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        message: "HTTP headers (KEY=VALUE, comma-separated, or leave empty):",
        defaultValue: "Authorization=Bearer YOUR_API_KEY",
      }),
    );
    expect(mockedWriteServer).toHaveBeenCalledWith(
      {
        name: "consensus",
        transport: "http",
        url: "https://mcp.consensus.app/custom",
        headers: { Authorization: "Bearer real-key" },
      },
      "claude",
      "user",
    );
  });

  it("skips preset confirmation when no preset matches", async () => {
    mockedReadServers.mockReturnValue([]);
    mockedFindBundledPreset.mockReturnValue(undefined);
    mockedMultiselect.mockResolvedValueOnce(["claude"]);
    mockedSelect.mockResolvedValueOnce("user").mockResolvedValueOnce("stdio");
    mockedText
      .mockResolvedValueOnce("npx -y custom-server")
      .mockResolvedValueOnce("");

    await runAddAction(["custom-server"]);

    expect(mockedConfirm).not.toHaveBeenCalled();
    expect(mockedWriteServer).toHaveBeenCalledWith(
      {
        name: "custom-server",
        transport: "stdio",
        command: ["npx", "-y", "custom-server"],
      },
      "claude",
      "user",
    );
  });

  it("keeps explicit non-interactive flags authoritative", async () => {
    mockedReadServers.mockReturnValue([]);

    await runAddAction([
      "github",
      "-t",
      "claude",
      "-s",
      "user",
      "--transport",
      "http",
      "--url",
      "https://example.com/custom",
    ]);

    expect(mockedFindBundledPreset).not.toHaveBeenCalled();
    expect(mockedConfirm).not.toHaveBeenCalled();
    expect(mockedWriteServer).toHaveBeenCalledWith(
      {
        name: "github",
        transport: "http",
        url: "https://example.com/custom",
      },
      "claude",
      "user",
    );
  });

  it("prompts for env only for stdio servers", async () => {
    mockedReadServers.mockReturnValue([]);
    mockedMultiselect.mockResolvedValueOnce(["claude"]);
    mockedSelect
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
    mockedMultiselect.mockResolvedValueOnce(["cline"]);
    mockedSelect
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

  it("writes the same interactive server to multiple selected tools", async () => {
    mockedReadServers.mockReturnValue([]);
    mockedMultiselect.mockResolvedValueOnce(["claude", "opencode"]);
    mockedSelect.mockResolvedValueOnce("user").mockResolvedValueOnce("stdio");
    mockedText
      .mockResolvedValueOnce("npx -y my-server")
      .mockResolvedValueOnce("API_KEY=xxx");

    await runAddAction(["shared-srv"]);

    expect(mockedWriteServer).toHaveBeenCalledTimes(2);
    expect(mockedWriteServer).toHaveBeenNthCalledWith(
      1,
      {
        name: "shared-srv",
        transport: "stdio",
        command: ["npx", "-y", "my-server"],
        env: { API_KEY: "xxx" },
      },
      "claude",
      "user"
    );
    expect(mockedWriteServer).toHaveBeenNthCalledWith(
      2,
      {
        name: "shared-srv",
        transport: "stdio",
        command: ["npx", "-y", "my-server"],
        env: { API_KEY: "xxx" },
      },
      "opencode",
      "user"
    );
  });

  it("skips Cline at project scope in a mixed interactive selection", async () => {
    mockedReadServers.mockReturnValue([]);
    mockedMultiselect.mockResolvedValueOnce(["claude", "cline"]);
    mockedSelect.mockResolvedValueOnce("project").mockResolvedValueOnce("http");
    mockedText
      .mockResolvedValueOnce("https://mcp.example.com/mcp")
      .mockResolvedValueOnce("");

    await runAddAction(["project-srv"]);

    expect(mockedWriteServer).toHaveBeenCalledTimes(1);
    expect(mockedWriteServer).toHaveBeenCalledWith(
      {
        name: "project-srv",
        transport: "http",
        url: "https://mcp.example.com/mcp",
      },
      "claude",
      "project"
    );
    expect(clack.log.warn).toHaveBeenCalledWith(
      "Cline only supports user scope. Skipping."
    );
  });

  it("opens with no tools selected and shows the shortcut hint", async () => {
    mockedReadServers.mockReturnValue([]);
    mockedMultiselect.mockResolvedValueOnce(["claude", "opencode", "cline"]);
    mockedSelect.mockResolvedValueOnce("user").mockResolvedValueOnce("http");
    mockedText
      .mockResolvedValueOnce("https://mcp.example.com/mcp")
      .mockResolvedValueOnce("");

    await runAddAction(["hint-srv"]);

    expect(mockedMultiselect).toHaveBeenCalledWith(
      expect.objectContaining({
        message:
          "Which tool(s)? Press Space to toggle, A to select or deselect all, Enter to submit.",
        cursorAt: "claude",
      })
    );
    expect(mockedWriteServer).toHaveBeenCalledTimes(3);
    expect(mockedWriteServer).toHaveBeenNthCalledWith(
      1,
      {
        name: "hint-srv",
        transport: "http",
        url: "https://mcp.example.com/mcp",
      },
      "claude",
      "user"
    );
    expect(mockedWriteServer).toHaveBeenNthCalledWith(
      2,
      {
        name: "hint-srv",
        transport: "http",
        url: "https://mcp.example.com/mcp",
      },
      "opencode",
      "user"
    );
    expect(mockedWriteServer).toHaveBeenNthCalledWith(
      3,
      {
        name: "hint-srv",
        transport: "http",
        url: "https://mcp.example.com/mcp",
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
