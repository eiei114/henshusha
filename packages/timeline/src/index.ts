export type TimelineAspect = "16:9" | "9:16" | "1:1";
export type TimelineTrackType = "video" | "title" | "caption";

export interface TimelineVideoItem {
  id?: string;
  source?: string;
  start: number;
  end: number;
  sourceStart?: number;
}

export interface TimelineTextItem {
  id?: string;
  start: number;
  end: number;
  text: string;
  preset?: string;
  accent?: string;
  label?: string;
  speaker?: string;
}

export interface TimelineTrack {
  id: string;
  type: TimelineTrackType;
  items: Array<TimelineVideoItem | TimelineTextItem>;
}

/** Future ASR adapters may populate this block; manual timelines omit it. */
export interface TimelineTranscriptSegment {
  start: number;
  end: number;
  text: string;
  speaker?: string;
}

export interface HenshushaTimeline {
  version: "0.1";
  source?: {
    path: string;
    audio?: string;
  };
  /** Optional provenance from a future ASR pass. Caption items remain the render source of truth. */
  transcript?: {
    language: string;
    segments: TimelineTranscriptSegment[];
  };
  timeline: {
    duration?: number;
    tracks: TimelineTrack[];
  };
  render: {
    output?: string;
    variant: {
      aspect: TimelineAspect;
      resolution: string;
      safeArea?: string;
    };
    artDirection?: {
      preset?: string;
      captionStyle?: string;
    };
  };
}

export interface TimelineValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

const allowedAspects = new Set<TimelineAspect>(["16:9", "9:16", "1:1"]);
const allowedTrackTypes = new Set<TimelineTrackType>(["video", "title", "caption"]);
const textItemKeys = ["preset", "accent", "label", "speaker"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function path(prefix: string, ...parts: Array<string | number>): string {
  return [prefix, ...parts].join(".");
}

export function parseResolution(resolution: string): { width: number; height: number } {
  const match = /^(\d+)x(\d+)$/.exec(resolution);
  if (!match) throw new Error(`render.variant.resolution must match WIDTHxHEIGHT (e.g. "1080x1920"); got "${resolution}"`);
  return { width: Number(match[1]), height: Number(match[2]) };
}

function validateTranscript(value: unknown, errors: string[]): void {
  if (value === undefined) return;
  if (!isRecord(value)) {
    errors.push("transcript must be an object when set — omit the field for manual-only timelines");
    return;
  }
  if (!isString(value.language)) {
    errors.push('transcript.language must be a non-empty BCP-47 code (e.g. "ja") when transcript is set');
  }
  if (!Array.isArray(value.segments)) {
    errors.push("transcript.segments must be an array when transcript is set");
    return;
  }
  for (const [index, segment] of value.segments.entries()) {
    const segmentPath = path("transcript", "segments", index);
    if (!isRecord(segment)) {
      errors.push(`${segmentPath} must be an object`);
      continue;
    }
    if (!isNumber(segment.start) || !isNumber(segment.end) || segment.end <= segment.start) {
      errors.push(`${segmentPath} must have numeric start/end with end > start (seconds)`);
    }
    if (!isString(segment.text)) {
      errors.push(`${segmentPath}.text must be a non-empty string — map ASR output into caption items separately for rendering`);
    }
    if (segment.speaker !== undefined && !isString(segment.speaker)) {
      errors.push(`${segmentPath}.speaker must be a non-empty string when set`);
    }
  }
}

function validateVideoGapsAndOverlaps(
  trackIndex: number,
  items: unknown[],
  warnings: string[]
): void {
  const sorted = items
    .map((item, itemIndex) => ({ item, itemIndex }))
    .filter((entry): entry is { item: Record<string, unknown>; itemIndex: number } => isRecord(entry.item))
    .sort((a, b) => Number(a.item.start) - Number(b.item.start));

  for (let index = 0; index < sorted.length; index += 1) {
    const current = sorted[index];
    if (!current) continue;
    const currentStart = Number(current.item.start);
    const currentEnd = Number(current.item.end);
    const expectedStart = index === 0 ? 0 : Number(sorted[index - 1]?.item.end);
    const itemPath = path("timeline", "tracks", trackIndex, "items", current.itemIndex);

    if (currentStart > expectedStart) {
      warnings.push(
        `${itemPath}: gap from ${expectedStart}s to ${currentStart}s — FFmpeg concat ignores gaps; set start to ${expectedStart} or insert a video segment`
      );
    } else if (currentStart < expectedStart) {
      warnings.push(
        `${itemPath}: overlap with previous item ending at ${expectedStart}s — FFmpeg concat plays segments back-to-back; trim start/end so items are contiguous`
      );
    }

    if (index > 0 && currentEnd <= currentStart) {
      warnings.push(`${itemPath}: zero-length segment — end must be greater than start`);
    }
  }
}

export function validateTimeline(value: unknown): TimelineValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isRecord(value)) {
    return {
      ok: false,
      errors: ["root value must be a JSON object — wrap fields in { ... }"],
      warnings
    };
  }

  if (value.version !== "0.1") {
    errors.push('version must be "0.1" — set "version": "0.1" at the top level');
  }

  if (value.source !== undefined) {
    if (!isRecord(value.source)) {
      errors.push("source must be an object when set");
    } else {
      if (!isString(value.source.path)) {
        errors.push('source.path must be a non-empty project-relative path (e.g. "sources/raw/input.mp4")');
      }
      if (value.source.audio !== undefined && !isString(value.source.audio)) {
        errors.push('source.audio must be a non-empty project-relative path when set');
      }
    }
  }

  validateTranscript(value.transcript, errors);

  if (!isRecord(value.timeline) || !Array.isArray(value.timeline.tracks)) {
    errors.push("timeline.tracks is required — add a timeline object with a tracks array");
  } else {
    const tracks = value.timeline.tracks;
    if (tracks.length === 0) {
      errors.push("timeline.tracks must include at least one track — add a video track for manual cuts");
    }

    const videoTrackIndexes = tracks
      .map((track, index) => (isRecord(track) && track.type === "video" ? index : -1))
      .filter((index) => index >= 0);

    if (videoTrackIndexes.length === 0) {
      errors.push('timeline.tracks must include one video track — add { "id": "video", "type": "video", "items": [...] }');
    }

    for (const [trackIndex, track] of tracks.entries()) {
      const trackPath = path("timeline", "tracks", trackIndex);
      if (!isRecord(track)) {
        errors.push(`${trackPath} must be an object`);
        continue;
      }
      if (!isString(track.id)) {
        errors.push(`${trackPath}.id is required — use a stable id such as "video", "titles", or "captions"`);
      }
      if (!allowedTrackTypes.has(track.type as TimelineTrackType)) {
        errors.push(`${trackPath}.type must be video, title, or caption — manual caption tracks stay first-class without ASR`);
      }
      if (!Array.isArray(track.items)) {
        errors.push(`${trackPath}.items must be an array (use [] for an empty overlay track)`);
        continue;
      }

      for (const [itemIndex, item] of track.items.entries()) {
        const itemPath = path(trackPath, "items", itemIndex);
        if (!isRecord(item)) {
          errors.push(`${itemPath} must be an object`);
          continue;
        }
        if (!isNumber(item.start) || !isNumber(item.end) || item.end <= item.start) {
          errors.push(
            `${itemPath} must have numeric start/end in seconds with end > start (e.g. "start": 0, "end": 2)`
          );
        }

        if (track.type === "video") {
          if (item.source !== undefined && !isString(item.source)) {
            errors.push(`${itemPath}.source must be a non-empty project-relative path when set`);
          }
          if (item.sourceStart !== undefined && !isNumber(item.sourceStart)) {
            errors.push(`${itemPath}.sourceStart must be a number (seconds into the source file) when set`);
          }
        } else {
          if (!isString(item.text)) {
            errors.push(
              `${itemPath}.text is required for ${String(track.type)} items — set overlay text (manual or transcript-derived)`
            );
          }
          for (const key of textItemKeys) {
            if (item[key] !== undefined && !isString(item[key])) {
              errors.push(`${itemPath}.${key} must be a non-empty string when set`);
            }
          }
        }
      }

      if (track.type === "video" && Array.isArray(track.items) && track.items.length > 0) {
        validateVideoGapsAndOverlaps(trackIndex, track.items, warnings);
      }
    }

    if (isNumber(value.timeline.duration)) {
      const videoTrack = tracks.find((track) => isRecord(track) && track.type === "video");
      if (isRecord(videoTrack) && Array.isArray(videoTrack.items) && videoTrack.items.length > 0) {
        const lastItem = [...videoTrack.items].reverse().find(isRecord);
        const lastEnd = lastItem ? Number(lastItem.end) : undefined;
        if (lastEnd !== undefined && Math.abs(Number(value.timeline.duration) - lastEnd) > 0.001) {
          warnings.push(
            `timeline.duration (${value.timeline.duration}) differs from last video item end (${lastEnd}) — duration is informational; FFmpeg uses concatenated segment lengths`
          );
        }
      }
    }
  }

  if (!isRecord(value.render) || !isRecord(value.render.variant)) {
    errors.push('render.variant is required — add render.variant.aspect and render.variant.resolution');
  } else {
    const variant = value.render.variant;
    if (!isString(variant.aspect) || !allowedAspects.has(variant.aspect as TimelineAspect)) {
      errors.push('render.variant.aspect must be one of "16:9", "9:16", or "1:1"');
    }
    if (!isString(variant.resolution)) {
      errors.push('render.variant.resolution is required (e.g. "1080x1920" for 9:16)');
    } else {
      try {
        parseResolution(variant.resolution);
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
      }
    }
    if (variant.safeArea !== undefined && !isString(variant.safeArea)) {
      errors.push("render.variant.safeArea must be a non-empty string when set");
    }
  }

  if (isRecord(value.render) && value.render.output !== undefined && !isString(value.render.output)) {
    errors.push('render.output must be a non-empty project-relative path when set (e.g. "renders/output.mp4")');
  }

  return { ok: errors.length === 0, errors, warnings };
}

export function formatValidationReport(result: TimelineValidationResult): string {
  const lines: string[] = [];
  if (result.errors.length > 0) {
    lines.push("Errors:");
    for (const error of result.errors) lines.push(`- ${error}`);
  }
  if (result.warnings.length > 0) {
    if (lines.length > 0) lines.push("");
    lines.push("Warnings:");
    for (const warning of result.warnings) lines.push(`- ${warning}`);
  }
  return lines.join("\n");
}

export function assertValidTimeline(value: unknown): asserts value is HenshushaTimeline {
  const result = validateTimeline(value);
  if (!result.ok) throw new Error(`Invalid Henshusha timeline:\n${formatValidationReport(result)}`);
}
