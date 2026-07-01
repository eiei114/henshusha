export type TimelineAspect = "16:9" | "9:16" | "1:1";

export interface TimelineWord {
  text: string;
  start: number;
  end: number;
  confidence?: number;
}

export interface TimelineSegment {
  id: string;
  start: number;
  end: number;
  text: string;
  words?: TimelineWord[];
}

export interface HenshushaTimeline {
  version: "0.1";
  source: {
    path: string;
    audio?: string;
  };
  transcript: {
    language: string;
    segments: TimelineSegment[];
  };
  render: {
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
}

const allowedAspects = new Set<TimelineAspect>(["16:9", "9:16", "1:1"]);

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

  if (!isRecord(value)) {
    return { ok: false, errors: ["timeline must be an object"] };
  }

  if (value.version !== "0.1") {
    errors.push("version must be '0.1'");
  }

  if (!isRecord(value.source) || !isString(value.source.path)) {
    errors.push("source.path is required");
  }

  if (!isRecord(value.transcript)) {
    errors.push("transcript is required");
  } else {
    if (!isString(value.transcript.language)) {
      errors.push("transcript.language is required");
    }
    if (!Array.isArray(value.transcript.segments)) {
      errors.push("transcript.segments must be an array");
    } else {
      value.transcript.segments.forEach((segment, index) => {
        if (!isRecord(segment)) {
          errors.push(`transcript.segments[${index}] must be an object`);
          return;
        }
        if (!isString(segment.id)) {
          errors.push(`transcript.segments[${index}].id is required`);
        }
        if (!isNumber(segment.start) || !isNumber(segment.end) || segment.end < segment.start) {
          errors.push(`transcript.segments[${index}] must have valid start/end`);
        }
        if (!isString(segment.text)) {
          errors.push(`transcript.segments[${index}].text is required`);
        }
      });
    }
  }

  const variant = isRecord(value.render) && isRecord(value.render.variant) ? value.render.variant : undefined;
  if (!variant) {
    errors.push("render.variant is required");
  } else {
    if (!isString(variant.aspect) || !allowedAspects.has(variant.aspect as TimelineAspect)) {
      errors.push("render.variant.aspect must be one of 16:9, 9:16, 1:1");
    }
    if (!isString(variant.resolution)) {
      errors.push("render.variant.resolution is required");
    }
  }

  return { ok: errors.length === 0, errors };
}

export function assertValidTimeline(value: unknown): asserts value is HenshushaTimeline {
  const result = validateTimeline(value);
  if (!result.ok) {
    throw new Error(`Invalid Henshusha timeline:\n${result.errors.join("\n")}`);
  }
}
