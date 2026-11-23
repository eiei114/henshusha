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

function validateWithResolution(resolution) {
  return validateTimeline({
    ...starter,
    render: { ...starter.render, variant: { ...starter.render.variant, resolution } }
  });
}

const maxSafe = Number.MAX_SAFE_INTEGER;
const unsafe = "9007199254740993";
for (const resolution of ["0x1920", "1080x0", `${unsafe}x1080`, `1080x${unsafe}`]) {
  const result = validateWithResolution(resolution);
  assert(!result.ok, `invalid resolution ${resolution} should fail validation`);
  assert(
    result.errors.some((error) => error.startsWith("render.variant.resolution")),
    `expected resolution error for ${resolution}, got:\n${formatValidationReport(result)}`
  );
}

for (const resolution of ["1080x1920", "1920x1080", "1080x1080", `${maxSafe}x${maxSafe}`]) {
  const result = validateWithResolution(resolution);
  assert(result.ok, `resolution ${resolution} should validate:\n${formatValidationReport(result)}`);
}

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

const overlapTimeline = {
  version: "0.1",
  timeline: {
    tracks: [
      {
        id: "video",
        type: "video",
        items: [
          { start: 0, end: 5, sourceStart: 0 },
          { start: 4, end: 8, sourceStart: 4 }
        ]
      }
    ]
  },
  render: {
    variant: { aspect: "9:16", resolution: "1080x1920" }
  }
};
const overlapResult = validateTimeline(overlapTimeline);
assert(overlapResult.ok, "overlap timeline should still validate structurally");
assert(
  overlapResult.warnings.some((warning) => warning.includes("overlap")),
  `expected overlap warning, got:\n${overlapResult.warnings.join("\n")}`
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

const singleSourceTimeline = {
  version: "0.1",
  source: { path: "sources/raw/input.mp4" },
  timeline: {
    tracks: [
      {
        id: "video",
        type: "video",
        items: [
          { source: "sources/raw/input.mp4", start: 0, end: 2, sourceStart: 0 },
          { source: "sources/raw/input.mp4", start: 2, end: 4, sourceStart: 2 }
        ]
      }
    ]
  },
  render: {
    variant: { aspect: "9:16", resolution: "1080x1920" }
  }
};
const singleSourceResult = validateTimeline(singleSourceTimeline);
assert(singleSourceResult.ok, `single-source timeline should validate:\n${formatValidationReport(singleSourceResult)}`);
assert(
  singleSourceResult.warnings.length === 0,
  `single-source timeline should have no warnings, got:\n${singleSourceResult.warnings.join("\n")}`
);

const mixedSourceTimeline = {
  version: "0.1",
  source: { path: "sources/raw/first.mp4" },
  timeline: {
    tracks: [
      {
        id: "video",
        type: "video",
        items: [
          { source: "sources/raw/first.mp4", start: 0, end: 2, sourceStart: 0 },
          { source: "sources/raw/second.mp4", start: 2, end: 4, sourceStart: 2 }
        ]
      }
    ]
  },
  render: {
    variant: { aspect: "9:16", resolution: "1080x1920" }
  }
};
const mixedSourceResult = validateTimeline(mixedSourceTimeline);
assert(mixedSourceResult.ok, `mixed-source timeline should stay valid (warning only):\n${formatValidationReport(mixedSourceResult)}`);
const mixedWarning = mixedSourceResult.warnings.find((warning) => warning.includes("sources/raw/second.mp4"));
assert(mixedWarning, `expected mixed-source warning, got:\n${mixedSourceResult.warnings.join("\n")}`);
assert(
  mixedWarning.includes("timeline.tracks.0.items.1"),
  `mixed-source warning should name the item path, got: ${mixedWarning}`
);
assert(
  mixedWarning.includes("sources/raw/first.mp4"),
  `mixed-source warning should name the first source, got: ${mixedWarning}`
);
assert(
  mixedWarning.includes("only the first source"),
  `mixed-source warning should state the single-source limitation, got: ${mixedWarning}`
);
assert(
  !mixedSourceResult.warnings.some((warning) => warning.includes("gap") || warning.includes("overlap")),
  `mixed-source timeline should not gain gap/overlap warnings, got:\n${mixedSourceResult.warnings.join("\n")}`
);

const fallbackSourceTimeline = {
  version: "0.1",
  source: { path: "sources/raw/input.mp4" },
  timeline: {
    tracks: [
      {
        id: "video",
        type: "video",
        items: [
          { start: 0, end: 2, sourceStart: 0 },
          { start: 2, end: 4, sourceStart: 2 }
        ]
      }
    ]
  },
  render: {
    variant: { aspect: "9:16", resolution: "1080x1920" }
  }
};
const fallbackSourceResult = validateTimeline(fallbackSourceTimeline);
assert(fallbackSourceResult.ok, `fallback-to-source.path timeline should validate:\n${formatValidationReport(fallbackSourceResult)}`);
assert(
  fallbackSourceResult.warnings.length === 0,
  `fallback-to-source.path timeline should have no warnings, got:\n${fallbackSourceResult.warnings.join("\n")}`
);

const mixedSourceFallbackTimeline = {
  version: "0.1",
  source: { path: "sources/raw/fallback.mp4" },
  timeline: {
    tracks: [
      {
        id: "video",
        type: "video",
        items: [
          { start: 0, end: 2, sourceStart: 0 },
          { source: "sources/raw/override.mp4", start: 2, end: 4, sourceStart: 2 }
        ]
      }
    ]
  },
  render: {
    variant: { aspect: "9:16", resolution: "1080x1920" }
  }
};
const mixedSourceFallbackResult = validateTimeline(mixedSourceFallbackTimeline);
assert(
  mixedSourceFallbackResult.ok,
  `source.path fallback with a per-item override should stay valid:\n${formatValidationReport(mixedSourceFallbackResult)}`
);
assert(
  mixedSourceFallbackResult.warnings.some((warning) => warning.includes("sources/raw/override.mp4")),
  `per-item source override should warn against the source.path fallback, got:\n${mixedSourceFallbackResult.warnings.join("\n")}`
);

const multipleVideoTracksTimeline = {
  version: "0.1",
  timeline: {
    tracks: [
      {
        id: "primary-video",
        type: "video",
        items: [{ source: "sources/raw/a.mp4", start: 0, end: 2, sourceStart: 0 }]
      },
      {
        id: "secondary-video",
        type: "video",
        items: [{ source: "sources/raw/b.mp4", start: 0, end: 2, sourceStart: 0 }]
      }
    ]
  },
  render: {
    variant: { aspect: "9:16", resolution: "1080x1920" }
  }
};
const multipleVideoTracksResult = validateTimeline(multipleVideoTracksTimeline);
assert(
  multipleVideoTracksResult.ok,
  `multiple video tracks should stay valid with a warning:\n${formatValidationReport(multipleVideoTracksResult)}`
);
assert(
  multipleVideoTracksResult.warnings.length === 1 &&
    multipleVideoTracksResult.warnings[0].includes("timeline.tracks.1") &&
    multipleVideoTracksResult.warnings[0].includes("first video track") &&
    multipleVideoTracksResult.warnings[0].includes("ignored"),
  `later video track should be reported as ignored, got:\n${multipleVideoTracksResult.warnings.join("\n")}`
);

console.log("Timeline schema verification passed.");
