import * as fs from "node:fs";
import * as path from "node:path";

const source = path.resolve("src", "catalog", "mcp-presets.json");
const destination = path.resolve("dist", "catalog", "mcp-presets.json");

fs.mkdirSync(path.dirname(destination), { recursive: true });
fs.copyFileSync(source, destination);
