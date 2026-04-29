## Context

`mcps add` currently branches on transport for the command or URL prompt, but always falls through to an environment-variable prompt afterward. That behavior is correct for `stdio` servers and incorrect for remote `http` servers, which should write remote headers instead of `env`. The codebase already supports `headers` in the universal model and in Claude Code/OpenCode translators, but Cline remote translation currently drops headers on both read and write. Because `copy` and `move` operate through the universal model, fixing Cline translation is required to preserve authenticated remote servers across tools.

## Goals / Non-Goals

**Goals:**
- Make interactive remote add flows ask for headers instead of environment variables, using the same comma-separated `KEY=VALUE` style as current `env` entry.
- Add a non-interactive way to provide remote authorization when `--transport http` is used.
- Preserve remote authorization headers when reading from and writing to Cline so `copy` and `move` keep authenticated remote servers intact.
- Cover the behavior with command-level and translator-level tests.

**Non-Goals:**
- Changing list or compare output formatting.
- Introducing header-specific validation beyond parsing `KEY=VALUE` pairs and storing them as entered.

## Decisions

### Use transport-specific input paths in `add`
`stdio` and `http` inputs will be separated completely after transport selection. `stdio` keeps the existing command and optional `env` collection. `http` will collect URL plus optional headers using the same comma-separated `KEY=VALUE` input style, with the placeholder `Authorization=Bearer API_KEY,OTHER=val`, and write the parsed pairs into `server.headers`.

Alternative considered: keep one shared post-transport prompt and reinterpret the result based on transport. Rejected because it preserves the current ambiguity and makes validation harder.

### Accept explicit remote headers in non-interactive mode
Non-interactive remote adds will use a header-oriented flag rather than reusing `--env`. This keeps the CLI contract aligned with the config shape and avoids treating remote auth as a local process environment concern.

Alternative considered: overload `--env` for remote auth. Rejected because it encodes remote HTTP auth in the wrong field and keeps the current bug hidden behind different syntax.

### Fix cross-tool preservation in the translator layer
The Cline translator will be updated to round-trip remote `headers` for `streamableHttp` and `sse` entries. `copy` and `move` can then continue to rely on the existing universal-model flow without command-specific header logic.

Alternative considered: patch `copy` and `move` directly with special handling for Cline. Rejected because it duplicates translation rules outside the translator boundary.

### Reuse the existing comma-separated pair entry pattern for remote headers
Interactive remote setup will mirror the current `env` UX: one text prompt that accepts comma-separated `KEY=VALUE` pairs. The prompt will use `Authorization=Bearer API_KEY,OTHER=val` as its placeholder so bearer auth remains the primary example, while still allowing additional headers in the same entry.

Alternative considered: prompt only for a single authorization value. Rejected because the user expects the same multi-entry behavior as the existing `env` flow and remote servers may require additional headers.

## Risks / Trade-offs

- Prompt/flag mismatch risk -> Mitigate by documenting that remote headers are stored under `headers` and by adding tests for both interactive and flagged flows.
- Existing Cline remote entries without headers remain valid -> Mitigate by keeping header handling optional during reads and writes.
- CLI surface grows slightly with a remote-header flag -> Mitigate by limiting the change to `add` and leaving copy/move semantics unchanged.

## Migration Plan

No data migration is required. New remote servers created through `add` will start writing authorization headers correctly. Existing remote Cline entries will continue to parse, and copy/move operations will preserve headers once they are present.

## Open Questions

None.
