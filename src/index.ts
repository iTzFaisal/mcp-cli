#!/usr/bin/env node
import { Command } from "commander";
import { listCommand } from "./commands/list.js";
import { addCommand } from "./commands/add.js";
import { removeCommand } from "./commands/remove.js";
import { copyCommand } from "./commands/copy.js";
import { moveCommand } from "./commands/move.js";
import { compareCommand } from "./commands/compare.js";

const program = new Command();

program
  .name("mcps")
  .description(
    `
  ┌───────────────────────────────────┐
  │  ███╗   ███╗ ██████╗ ██████╗     │
  │  ████╗ ████║██╔════╝ ██╔══██╗    │
  │  ██╔████╔██║██║      ██║  ██║    │
  │  ██║╚██╔╝██║██║      ██╔═══╝     │
  │  ██║ ╚═╝ ██║╚██████╗ ██║         │
  │  ╚═╝     ╚═╝ ╚═════╝ ╚═╝         │
  └───────────────────────────────────┘
  Unified MCP server manager for Claude Code, OpenCode & Cline`
  )
  .version("0.1.0");

program.addCommand(listCommand);
program.addCommand(addCommand);
program.addCommand(removeCommand);
program.addCommand(copyCommand);
program.addCommand(moveCommand);
program.addCommand(compareCommand);

program.parse();
