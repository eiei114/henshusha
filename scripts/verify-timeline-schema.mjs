#!/usr/bin/env node
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { formatValidationReport, validateTimeline } from "../packages/timeline/dist/index.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const starterTimelinePath = path.join(
  repoRoot,
  "packages",
  "henshusha",
  "templates",
  "basic",
  "projects",
  "sample-video",
  "timelines",
  "main.timeline.json"
);

const starter = JSON.parse(readFileSync(starterTimelinePath, "utf8"));
const starterResult = validateTimeline(starter);
assert(starterResult.ok, `starter timeline should validate:\n${formatValidationReport(starterResult)}`);
assert(starterResult.warnings.length === 0, `starter timeline should have no gap warnings:\n${starterResult.warnings.join("\n")}`);

const gapTimeline = {
  version: "0.1",
  timeline: {
    tracks: [
      {
        id: "video",
        type: "video",
        items: [
          { start: 0, end: 4, sourceStart: 0 },
          { start: 6, end: 10, sourceStart: 6 }
        ]
      }
    ]
  },
  render: {
    variant: { aspect: "9:16", resolution: "1080x1920" }
  }
};
const gapResult = validateTimeline(gapTimeline);
assert(gapResult.ok, "gap timeline should still validate structurally");
assert(
  gapResult.warnings.some((warning) => warning.includes("gap")),
  `expected gap warning, got:\n${gapResult.warnings.join("\n")}`
);

const missingText = {
  version: "0.1",
  timeline: {
    tracks: [
      { id: "video", type: "video", items: [{ start: 0, end: 2, sourceStart: 0 }] },
      { id: "captions", type: "caption", items: [{ start: 0, end: 2 }] }
    ]
  },
  render: {
    variant: { aspect: "16:9", resolution: "1920x1080" }
  }
};
const missingTextResult = validateTimeline(missingText);
assert(!missingTextResult.ok, "caption item without text should fail");
assert(
  missingTextResult.errors.some((error) => error.includes("text is required")),
  `expected actionable text error, got:\n${missingTextResult.errors.join("\n")}`
);

const transcriptTimeline = {
  version: "0.1",
  transcript: {
    language: "ja",
    segments: [{ start: 0, end: 2, text: "こんにちは", speaker: "host" }]
  },
  timeline: {
    tracks: [
      { id: "video", type: "video", items: [{ start: 0, end: 2, sourceStart: 0 }] },
      {
        id: "captions",
        type: "caption",
        items: [{ start: 0, end: 2, text: "こんにちは", preset: "bottom-caption" }]
      }
    ]
  },
  render: {
    variant: { aspect: "9:16", resolution: "1080x1920" }
  }
};
const transcriptResult = validateTimeline(transcriptTimeline);
assert(transcriptResult.ok, `transcript + manual caption should validate:\n${formatValidationReport(transcriptResult)}`);

console.log("Timeline schema verification passed.");
