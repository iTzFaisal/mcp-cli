## 1. Tool and path support

- [x] 1.1 Add `hermes` to tool enums, labels, and scope-support checks used by CLI commands
- [x] 1.2 Implement Hermes user config path resolution for macOS, Linux, and Windows
- [x] 1.3 Add tests covering Hermes path resolution and user-only scope rejection

## 2. YAML config and translation

- [x] 2.1 Add a YAML dependency and implement Hermes translator functions for stdio/http servers and enabled/disabled mapping
- [x] 2.2 Extend config readers to parse Hermes `mcp_servers` entries into the universal model
- [x] 2.3 Extend config writers to read-modify-write Hermes YAML while preserving unrelated data fields
- [x] 2.4 Add unit tests for Hermes translation, missing-file handling, file creation, and YAML rewrite behavior

## 3. Command integration

- [x] 3.1 Update `mcps add` interactive and flag-driven flows to support Hermes and user-only scope handling
- [x] 3.2 Update `mcps list` to include Hermes in unified output and `--tool hermes` filtering
- [x] 3.3 Update `mcps copy` to support Hermes as source and destination and drop Hermes-only metadata through universal translation
- [x] 3.4 Update `mcps compare` to include Hermes user scope in presence reporting and copy hints

## 4. Verification

- [x] 4.1 Add or update CLI integration tests covering Hermes add/list/copy/compare behavior
- [x] 4.2 Run `npm run build && npm test` and fix any Hermes-related failures
