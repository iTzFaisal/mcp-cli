#!/usr/bin/env node
import { Command } from "commander";
import { listCommand } from "./commands/list.js";
import { addCommand } from "./commands/add.js";
import { removeCommand } from "./commands/remove.js";

const program = new Command();

program
  .name("mcp")
  .description(
    `
  ┌─────────────────────┐
  │  ███╗   ███╗ ███╗   │
  │  ████╗ ████║ ████╗  │
  │  ████╗█╔███║ ████╗  │
  │  ████╔╝████║ ████╗  │
  │  ╚██╔╝ ╚██╔╝ ╚██╔╝ │
  │   ╚═╝   ╚═╝   ╚═╝  │
  └─────────────────────┘
  Unified MCP server manager for Claude Code & OpenCode`
  )
  .version("0.1.0");

program.addCommand(listCommand);
program.addCommand(addCommand);
program.addCommand(removeCommand);

program.parse();
