import { describe, it, expect, vi, afterEach } from "vitest";
import type { LocatedServer } from "../types.js";
import * as clack from "@clack/prompts";
import {
  SUPPORTED_COMPARE_TARGETS,
  buildCompareResult,
  buildCopyHints,
  compareCommand,
  selectPreferredSource,
} from "./compare.js";
import { readServers } from "../config/reader.js";

const CANCEL = Symbol("cancel");

vi.mock("@clack/prompts", () => ({
  select: vi.fn(),
  note: vi.fn(),
  outro: vi.fn(),
  isCancel: vi.fn((value: unknown) => value === CANCEL),
  log: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../config/reader.js", () => ({
  readServers: vi.fn(),
}));

const mockedReadServers = vi.mocked(readServers);
const mockedSelect = vi.mocked(clack.select);
const mockedNote = vi.mocked(clack.note);
const mockedOutro = vi.mocked(clack.outro);
const mockedInfo = vi.mocked(clack.log.info);

describe("compare command helpers", () => {
  afterEach(() => {
    mockedReadServers.mockReset();
    mockedSelect.mockReset();
    mockedNote.mockReset();
    mockedOutro.mockReset();
    mockedInfo.mockReset();
  });

  it("covers only supported comparison targets", () => {
    mockedReadServers.mockReturnValue([
      locatedServer("shared", "claude", "user"),
      locatedServer("shared", "opencode", "project"),
    ]);

    const result = buildCompareResult("shared");

    expect(result.configured.map((server) => [server.tool, server.scope])).toEqual([
      ["claude", "user"],
      ["opencode", "project"],
    ]);
    expect(result.missing).toEqual([
      { tool: "claude", scope: "project" },
      { tool: "opencode", scope: "user" },
      { tool: "cline", scope: "user" },
    ]);
    expect(SUPPORTED_COMPARE_TARGETS).not.toContainEqual({
      tool: "cline",
      scope: "project",
    });
  });

  it("reports every supported location missing when server is absent", () => {
    mockedReadServers.mockReturnValue([locatedServer("other", "claude", "user")]);

    const result = buildCompareResult("missing");

    expect(result.configured).toEqual([]);
    expect(result.missing).toEqual(SUPPORTED_COMPARE_TARGETS);
  });

  it("generates hints from a single configured source without source flags", () => {
    const source = locatedServer("brave-search", "claude", "user");

    const hints = buildCopyHints(
      "brave-search",
      [{ tool: "opencode", scope: "user" }],
      source,
      false
    );

    expect(hints).toEqual([
      "mcps copy brave-search --tool opencode --scope user",
    ]);
  });

  it("uses stable preferred source ordering and includes source flags when needed", () => {
    const sources = [
      locatedServer("brave-search", "opencode", "project"),
      locatedServer("brave-search", "claude", "project"),
    ];

    const preferredSource = selectPreferredSource(sources);

    expect(preferredSource).toMatchObject({ tool: "claude", scope: "project" });
    expect(
      buildCopyHints(
        "brave-search",
        [{ tool: "cline", scope: "user" }],
        preferredSource!,
        true
      )
    ).toEqual([
      "mcps copy brave-search --from-tool claude --from-scope project --tool cline --scope user",
    ]);
  });

  it("supports interactive server selection", async () => {
    mockedReadServers.mockReturnValue([locatedServer("alpha", "claude", "user")]);
    mockedSelect.mockResolvedValueOnce("alpha");

    await withInteractiveTty(async () => {
      await runCompareAction();
    });

    expect(mockedSelect).toHaveBeenCalledTimes(1);
    expect(mockedNote).toHaveBeenCalledWith(
      expect.stringContaining("Claude Code (user)"),
      expect.stringContaining("Compare: alpha")
    );
  });

  it("supports interactive source selection when multiple configured locations exist", async () => {
    const claudeSource = locatedServer("alpha", "claude", "user");
    const opencodeSource = locatedServer("alpha", "opencode", "user");
    mockedReadServers.mockReturnValue([claudeSource, opencodeSource]);
    mockedSelect.mockResolvedValueOnce("alpha");
    mockedSelect.mockResolvedValueOnce(opencodeSource);

    await withInteractiveTty(async () => {
      await runCompareAction();
    });

    expect(mockedSelect).toHaveBeenCalledTimes(2);
    expect(mockedNote).toHaveBeenCalledWith(
      expect.stringContaining(
        "mcps copy alpha --from-tool opencode --from-scope user --tool claude --scope project"
      ),
      expect.stringContaining("Compare: alpha")
    );
    expect(mockedNote).toHaveBeenCalledWith(
      expect.stringContaining("Hint source: OpenCode (user)"),
      expect.any(String)
    );
  });

  it("cancels safely during interactive selection", async () => {
    mockedReadServers.mockReturnValue([locatedServer("alpha", "claude", "user")]);
    mockedSelect.mockResolvedValueOnce(CANCEL as never);

    await withInteractiveTty(async () => {
      await runCompareAction();
    });

    expect(mockedNote).not.toHaveBeenCalled();
    expect(mockedOutro).toHaveBeenCalledWith(expect.stringContaining("Cancelled"));
  });
});

function locatedServer(name: string, tool: LocatedServer["tool"], scope: LocatedServer["scope"]): LocatedServer {
  return {
    tool,
    scope,
    server: {
      name,
      transport: "stdio",
      command: ["node", "server.js"],
    },
  };
}

async function runCompareAction(name?: string) {
  compareCommand.exitOverride();
  await compareCommand.parseAsync(
    ["node", "compare", ...(name ? [name] : [])],
    { from: "node" }
  );
}

async function withInteractiveTty<T>(run: () => Promise<T>) {
  const stdinDescriptor = Object.getOwnPropertyDescriptor(process.stdin, "isTTY");
  const stdoutDescriptor = Object.getOwnPropertyDescriptor(process.stdout, "isTTY");

  Object.defineProperty(process.stdin, "isTTY", { value: true, configurable: true });
  Object.defineProperty(process.stdout, "isTTY", { value: true, configurable: true });

  try {
    return await run();
  } finally {
    restoreDescriptor(process.stdin, "isTTY", stdinDescriptor);
    restoreDescriptor(process.stdout, "isTTY", stdoutDescriptor);
  }
}

function restoreDescriptor(
  target: object,
  key: string,
  descriptor: PropertyDescriptor | undefined
) {
  if (descriptor) {
    Object.defineProperty(target, key, descriptor);
    return;
  }

  delete (target as Record<string, unknown>)[key];
}
