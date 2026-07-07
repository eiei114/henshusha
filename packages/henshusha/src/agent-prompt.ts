import readline from "node:readline";
import { stdin as input, stdout as output } from "node:process";
import type { AgentRuntime } from "./manifest.js";

export interface AgentPromptOption {
  runtime: AgentRuntime;
  label: string;
  targetDir: string;
}

const DEFAULT_OPTIONS: AgentPromptOption[] = [
  { runtime: "claude", label: "Claude Code", targetDir: ".claude/skills" },
  { runtime: "codex", label: "Codex", targetDir: ".codex/skills" },
  { runtime: "pi", label: "Pi", targetDir: ".pi/skills" }
];

export function isInteractiveTerminal(): boolean {
  return Boolean(input.isTTY && output.isTTY);
}

function renderCheckboxPrompt(options: AgentPromptOption[], selected: Set<AgentRuntime>, cursor: number): string {
  const lines = ["Select agent skill targets (Space toggle, Enter confirm):", ""];
  for (const [index, option] of options.entries()) {
    const checked = selected.has(option.runtime) ? "x" : " ";
    const pointer = index === cursor ? ">" : " ";
    lines.push(`${pointer} [${checked}] ${option.label.padEnd(12)} → ${option.targetDir}`);
  }
  lines.push("");
  return lines.join("\n");
}

export async function promptAgentCheckboxSelection(defaults: AgentRuntime[]): Promise<AgentRuntime[]> {
  if (!isInteractiveTerminal()) return [...new Set(defaults)];

  const options = DEFAULT_OPTIONS;
  const selected = new Set<AgentRuntime>(defaults);
  let cursor = 0;

  readline.emitKeypressEvents(input);
  if (input.isTTY) input.setRawMode(true);

  const render = () => {
    output.write(`\u001b[2J\u001b[H${renderCheckboxPrompt(options, selected, cursor)}`);
  };

  render();

  return await new Promise((resolve, reject) => {
    const onKeypress = (str: string | undefined, key: readline.Key) => {
      if (key.name === "up" && cursor > 0) cursor -= 1;
      else if (key.name === "down" && cursor < options.length - 1) cursor += 1;
      else if (key.name === "space") {
        const runtime = options[cursor]?.runtime;
        if (!runtime) return;
        if (selected.has(runtime)) selected.delete(runtime);
        else selected.add(runtime);
      } else if (key.name === "return" || key.name === "enter") {
        cleanup();
        if (selected.size === 0) {
          reject(new Error("Select at least one agent runtime, or rerun with --no-skills."));
          return;
        }
        resolve([...selected]);
        return;
      } else if (key.ctrl && key.name === "c") {
        cleanup();
        reject(new Error("Agent selection cancelled."));
        return;
      }
      render();
    };

    const cleanup = () => {
      input.off("keypress", onKeypress);
      if (input.isTTY) input.setRawMode(false);
      output.write("\n");
    };

    input.on("keypress", onKeypress);
  });
}
