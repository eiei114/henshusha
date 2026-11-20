#!/usr/bin/env node
import assert from "node:assert/strict";
import { PassThrough } from "node:stream";
import { promptAgentCheckboxSelection } from "../packages/henshusha/dist/agent-prompt.js";

function createTerminal() {
  const input = new PassThrough();
  input.isTTY = true;
  const rawModeCalls = [];
  input.setRawMode = (enabled) => {
    rawModeCalls.push(enabled);
    return input;
  };

  const output = new PassThrough();
  output.isTTY = true;
  let rendered = "";
  output.write = (chunk) => {
    rendered += String(chunk);
    return true;
  };

  return {
    input,
    output,
    rawModeCalls,
    get rendered() {
      return rendered;
    }
  };
}

function press(input, name, ctrl = false) {
  input.emit("keypress", name === "space" ? " " : undefined, { name, ctrl });
}

function assertCleanedUp(terminal) {
  assert.deepEqual(terminal.rawModeCalls, [true, false], "raw mode should be enabled and restored");
  assert.equal(terminal.input.listenerCount("keypress"), 0, "keypress listener should be removed");
}

const defaultTerminal = createTerminal();
const defaults = ["codex", "claude"];
const defaultSelection = promptAgentCheckboxSelection(defaults, defaultTerminal);
assert.match(defaultTerminal.rendered, /> \[x\] Claude Code/, "the cursor option should show as selected");
assert.match(defaultTerminal.rendered, /  \[x\] Codex/, "the other supplied default should show as selected");
press(defaultTerminal.input, "return");
assert.deepEqual(await defaultSelection, defaults, "confirm should preserve supplied defaults and their order");
assertCleanedUp(defaultTerminal);

const navigationTerminal = createTerminal();
const navigationSelection = promptAgentCheckboxSelection(["claude"], navigationTerminal);
press(navigationTerminal.input, "down");
press(navigationTerminal.input, "space");
press(navigationTerminal.input, "up");
press(navigationTerminal.input, "space");
assert.match(navigationTerminal.rendered, /> \[ \] Claude Code/, "up and Space should deselect Claude");
assert.match(navigationTerminal.rendered, /  \[x\] Codex/, "down and Space should select Codex");
press(navigationTerminal.input, "enter");
assert.deepEqual(await navigationSelection, ["codex"], "Enter should return the toggled selection");
assertCleanedUp(navigationTerminal);

const emptyTerminal = createTerminal();
const emptySelection = promptAgentCheckboxSelection(["claude"], emptyTerminal);
press(emptyTerminal.input, "space");
press(emptyTerminal.input, "return");
await assert.rejects(emptySelection, /Select at least one agent runtime/);
assertCleanedUp(emptyTerminal);

const cancelledTerminal = createTerminal();
const cancelledSelection = promptAgentCheckboxSelection(["claude"], cancelledTerminal);
press(cancelledTerminal.input, "c", true);
await assert.rejects(cancelledSelection, /Agent selection cancelled/);
assertCleanedUp(cancelledTerminal);

const nonTtyTerminal = createTerminal();
nonTtyTerminal.input.isTTY = false;
const nonTtySelection = await promptAgentCheckboxSelection(["pi", "pi"], nonTtyTerminal);
assert.deepEqual(nonTtySelection, ["pi"], "non-TTY selection should retain its existing de-duplicated defaults");
assert.deepEqual(nonTtyTerminal.rawModeCalls, [], "non-TTY input must not enter raw mode");
assert.equal(nonTtyTerminal.input.listenerCount("keypress"), 0, "non-TTY input must not install a listener");

console.log("Agent selection prompt tests passed (defaults, navigation, toggling, empty selection, Ctrl-C, non-TTY).");
