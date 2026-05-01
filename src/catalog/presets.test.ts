import { afterEach, describe, expect, it, vi } from "vitest";
import { toClaudeCode } from "../translators/claude-code.js";
import { toCline } from "../translators/cline.js";
import { toOpenCode } from "../translators/opencode.js";
import {
  findBundledPreset,
  resetBundledPresetCache,
  setBundledPresetCatalogUrlForTest,
} from "./presets.js";

const defaultCatalogUrl = new URL("./mcp-presets.json", import.meta.url);

describe("findBundledPreset", () => {
  afterEach(() => {
    resetBundledPresetCache();
    setBundledPresetCatalogUrlForTest(defaultCatalogUrl);
    vi.restoreAllMocks();
  });

  it("loads and normalizes a bundled Claude-shaped preset", () => {
    const preset = findBundledPreset("github");

    expect(preset).toEqual({
      name: "github",
      transport: "http",
      url: "https://api.githubcopilot.com/mcp/",
      headers: {
        Authorization: "Bearer YOUR_GITHUB_PAT",
      },
      disabled: undefined,
    });
  });

  it("matches preset names case-insensitively", () => {
    const preset = findBundledPreset("GitHub");

    expect(preset).toEqual({
      name: "GitHub",
      transport: "http",
      url: "https://api.githubcopilot.com/mcp/",
      headers: {
        Authorization: "Bearer YOUR_GITHUB_PAT",
      },
      disabled: undefined,
    });
  });

  it("falls back safely when the bundled catalog is missing", () => {
    setBundledPresetCatalogUrlForTest(
      new URL("file:///tmp/does-not-exist-mcp-presets.json"),
    );

    expect(findBundledPreset("github")).toBeUndefined();
  });

  it("still translates preset-derived servers for all supported tools", () => {
    const preset = findBundledPreset("github");

    expect(preset).toBeDefined();
    expect(toClaudeCode(preset!)).toEqual({
      type: "http",
      url: "https://api.githubcopilot.com/mcp/",
      headers: {
        Authorization: "Bearer YOUR_GITHUB_PAT",
      },
    });
    expect(toOpenCode(preset!)).toEqual({
      type: "remote",
      url: "https://api.githubcopilot.com/mcp/",
      headers: {
        Authorization: "Bearer YOUR_GITHUB_PAT",
      },
      enabled: true,
      timeout: 60000,
    });
    expect(toCline(preset!)).toEqual({
      type: "streamableHttp",
      url: "https://api.githubcopilot.com/mcp/",
      headers: {
        Authorization: "Bearer YOUR_GITHUB_PAT",
      },
      disabled: false,
      timeout: 60,
    });
  });
});
