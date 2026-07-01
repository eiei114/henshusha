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
