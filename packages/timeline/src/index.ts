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
}

export interface TimelineTrack {
  id: string;
  type: TimelineTrackType;
  items: Array<TimelineVideoItem | TimelineTextItem>;
}

export interface HenshushaTimeline {
  version: "0.1";
  source?: {
    path: string;
    audio?: string;
  };
  transcript?: {
    language: string;
    segments: unknown[];
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
function isString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

export function validateTimeline(value: unknown): TimelineValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!isRecord(value)) return { ok: false, errors: ["timeline must be an object"], warnings };
  if (value.version !== "0.1") errors.push("version must be '0.1'");
  if (value.source !== undefined && (!isRecord(value.source) || !isString(value.source.path))) errors.push("source.path must be a non-empty string when source is set");

  if (!isRecord(value.timeline) || !Array.isArray(value.timeline.tracks)) {
    errors.push("timeline.tracks is required");
  } else {
    const tracks = value.timeline.tracks;
    if (!tracks.some((track) => isRecord(track) && track.type === "video")) errors.push("timeline.tracks must include one video track");
    for (const [trackIndex, track] of tracks.entries()) {
      if (!isRecord(track)) { errors.push(`timeline.tracks[${trackIndex}] must be an object`); continue; }
      if (!isString(track.id)) errors.push(`timeline.tracks[${trackIndex}].id is required`);
      if (!allowedTrackTypes.has(track.type as TimelineTrackType)) errors.push(`timeline.tracks[${trackIndex}].type must be video, title, or caption`);
      if (!Array.isArray(track.items)) { errors.push(`timeline.tracks[${trackIndex}].items must be an array`); continue; }
      for (const [itemIndex, item] of track.items.entries()) {
        if (!isRecord(item)) { errors.push(`timeline.tracks[${trackIndex}].items[${itemIndex}] must be an object`); continue; }
        if (!isNumber(item.start) || !isNumber(item.end) || item.end <= item.start) errors.push(`timeline.tracks[${trackIndex}].items[${itemIndex}] must have valid start/end`);
        if (track.type === "video") {
          if (item.source !== undefined && !isString(item.source)) errors.push(`timeline.tracks[${trackIndex}].items[${itemIndex}].source must be a string`);
          if (item.sourceStart !== undefined && !isNumber(item.sourceStart)) errors.push(`timeline.tracks[${trackIndex}].items[${itemIndex}].sourceStart must be a number`);
        } else if (!isString(item.text)) errors.push(`timeline.tracks[${trackIndex}].items[${itemIndex}].text is required`);
      }
    }
  }

  const variant = isRecord(value.render) && isRecord(value.render.variant) ? value.render.variant : undefined;
  if (!variant) errors.push("render.variant is required");
  else {
    if (!isString(variant.aspect) || !allowedAspects.has(variant.aspect as TimelineAspect)) errors.push("render.variant.aspect must be one of 16:9, 9:16, 1:1");
    if (!isString(variant.resolution)) errors.push("render.variant.resolution is required");
  }
  return { ok: errors.length === 0, errors, warnings };
}

export function assertValidTimeline(value: unknown): asserts value is HenshushaTimeline {
  const result = validateTimeline(value);
  if (!result.ok) throw new Error(`Invalid Henshusha timeline:\n${result.errors.join("\n")}`);
}
