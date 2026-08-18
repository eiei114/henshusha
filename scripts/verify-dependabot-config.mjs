#!/usr/bin/env node
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.join(scriptDir, "..", ".github", "dependabot.yml");
const config = readFileSync(configPath, "utf8");

function stripYamlComment(line) {
  let quote = null;
  let escaped = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (quote === '"') {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (quote === "'") {
      if (char === "'" && line[index + 1] === "'") {
        index += 1;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }

    if (char === "#" && (index === 0 || /\s/.test(line[index - 1]))) {
      return line.slice(0, index).trimEnd();
    }
  }

  assert(!quote, "unterminated quoted scalar in dependabot config");
  return line.trimEnd();
}

function indentation(line) {
  const indent = line.match(/^ */)[0].length;
  assert(!/^\s*\t/.test(line), "tabs are not supported in dependabot config indentation");
  return indent;
}

function parseScalar(rawValue) {
  const value = rawValue.trim();
  assert(value, "expected scalar value in dependabot config");

  if (value.startsWith('"')) {
    assert(value.endsWith('"'), "unterminated double-quoted scalar in dependabot config");
    return JSON.parse(value);
  }

  if (value.startsWith("'")) {
    assert(value.endsWith("'"), "unterminated single-quoted scalar in dependabot config");
    return value.slice(1, -1).replace(/''/g, "'");
  }

  return value;
}

function parseKeyValue(content) {
  const match = content.match(/^([A-Za-z0-9_-]+):(?:\s*(.*))?$/);
  assert(match, `unsupported dependabot YAML line: ${content}`);
  return { key: match[1], rawValue: match[2] ?? "" };
}

const yamlLines = config
  .split(/\r?\n/)
  .map(stripYamlComment)
  .filter((line) => line.trim());

function parseBlock(startIndex, indent) {
  if (startIndex >= yamlLines.length || indentation(yamlLines[startIndex]) < indent) {
    return [{}, startIndex];
  }

  const lineIndent = indentation(yamlLines[startIndex]);
  assert(lineIndent >= indent, "unexpected dependabot YAML indentation");
  const content = yamlLines[startIndex].slice(lineIndent);
  return content.startsWith("- ")
    ? parseSequence(startIndex, lineIndent)
    : parseMapping(startIndex, lineIndent);
}

function parseMapping(startIndex, indent) {
  const mapping = {};
  let index = startIndex;

  while (index < yamlLines.length) {
    const line = yamlLines[index];
    const lineIndent = indentation(line);
    if (lineIndent < indent) break;
    assert(lineIndent === indent, `unexpected dependabot YAML indentation: ${line.trim()}`);

    const content = line.slice(indent);
    assert(!content.startsWith("- "), `unexpected sequence item in dependabot mapping: ${content}`);

    const { key, rawValue } = parseKeyValue(content);
    if (rawValue.trim()) {
      mapping[key] = parseScalar(rawValue);
      index += 1;
      continue;
    }

    const nextLine = yamlLines[index + 1];
    if (!nextLine || indentation(nextLine) <= indent) {
      mapping[key] = {};
      index += 1;
      continue;
    }

    [mapping[key], index] = parseBlock(index + 1, indentation(nextLine));
  }

  return [mapping, index];
}

function parseSequence(startIndex, indent) {
  const sequence = [];
  let index = startIndex;

  while (index < yamlLines.length) {
    const line = yamlLines[index];
    const lineIndent = indentation(line);
    if (lineIndent < indent) break;
    assert(lineIndent === indent, `unexpected dependabot YAML indentation: ${line.trim()}`);

    const content = line.slice(indent);
    if (!content.startsWith("- ")) break;

    const itemText = content.slice(2).trim();
    if (!itemText) {
      const nextLine = yamlLines[index + 1];
      if (!nextLine || indentation(nextLine) <= indent) {
        sequence.push({});
        index += 1;
      } else {
        const [item, nextIndex] = parseBlock(index + 1, indentation(nextLine));
        sequence.push(item);
        index = nextIndex;
      }
      continue;
    }

    if (!/^[A-Za-z0-9_-]+:/.test(itemText)) {
      sequence.push(parseScalar(itemText));
      index += 1;
      continue;
    }

    const item = {};
    const { key, rawValue } = parseKeyValue(itemText);
    const keyIndent = indent + 2;
    if (rawValue.trim()) {
      item[key] = parseScalar(rawValue);
      index += 1;
    } else {
      const nextLine = yamlLines[index + 1];
      if (!nextLine || indentation(nextLine) <= keyIndent) {
        item[key] = {};
        index += 1;
      } else {
        [item[key], index] = parseBlock(index + 1, indentation(nextLine));
      }
    }

    if (index < yamlLines.length) {
      const nextIndent = indentation(yamlLines[index]);
      if (nextIndent > indent) {
        assert(
          nextIndent === keyIndent,
          `unexpected dependabot YAML sequence item indentation: ${yamlLines[index].trim()}`
        );
        const [rest, nextIndex] = parseMapping(index, keyIndent);
        Object.assign(item, rest);
        index = nextIndex;
      }
    }

    sequence.push(item);
  }

  return [sequence, index];
}

function isMapping(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function assertMapping(value, label) {
  assert(isMapping(value), `${label} must be a mapping`);
}

function optionalScalar(mapping, key, label) {
  if (!(key in mapping)) return undefined;
  assert(typeof mapping[key] === "string", `${label} must be a scalar`);
  return mapping[key];
}

function collectCommitMessageBlocks(node, blocks = []) {
  if (Array.isArray(node)) {
    for (const item of node) collectCommitMessageBlocks(item, blocks);
    return blocks;
  }

  if (!isMapping(node)) return blocks;

  if ("commit-message" in node) {
    assertMapping(node["commit-message"], "dependabot commit-message");
    blocks.push(node["commit-message"]);
  }

  for (const [key, value] of Object.entries(node)) {
    if (key !== "commit-message") collectCommitMessageBlocks(value, blocks);
  }

  return blocks;
}

const [dependabotConfig, parsedLineCount] = parseBlock(0, 0);
assert(parsedLineCount === yamlLines.length, "failed to parse complete dependabot config");
assertMapping(dependabotConfig, "dependabot config");
assert(Array.isArray(dependabotConfig.updates), "expected dependabot updates array");

const ecosystems = dependabotConfig.updates.map((update) => {
  assertMapping(update, "dependabot update");
  const ecosystem = optionalScalar(update, "package-ecosystem", "dependabot package-ecosystem");
  assert(ecosystem, "expected dependabot package-ecosystem");
  return ecosystem;
});
assert(ecosystems.includes("npm"), "expected npm dependabot config block");

const commitMessageBlocks = collectCommitMessageBlocks(dependabotConfig);
assert(commitMessageBlocks.length > 0, "expected dependabot commit-message block");

for (const commitMessage of commitMessageBlocks) {
  const include = optionalScalar(commitMessage, "include", "dependabot commit-message include");
  assert(include === undefined || include === "scope", "dependabot commit-message include must be scope when set");
  if (include !== "scope") continue;

  for (const key of ["prefix", "prefix-development"]) {
    const prefix = optionalScalar(commitMessage, key, `dependabot commit-message ${key}`) ?? "";
    assert(
      !/\([^)]*\)/.test(prefix),
      `dependabot commit-message with prefix ${prefix} must not set include: scope; that produces double-scoped titles`
    );
  }
}

console.log("Dependabot config verification passed.");
