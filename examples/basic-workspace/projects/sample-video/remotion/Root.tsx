import React from "react";
import { AbsoluteFill, Composition, OffthreadVideo, Sequence, staticFile } from "remotion";
import props from "./timeline-props.json";
import { TextTemplate } from "./text-templates";

type TrackType = "video" | "title" | "caption";

type VideoItem = {
  source?: string;
  start: number;
  end: number;
  sourceStart?: number;
};

type TextItem = {
  start: number;
  end: number;
  text: string;
  preset?: string;
  accent?: string;
  label?: string;
  speaker?: string;
};

type Track = {
  id: string;
  type: TrackType;
  items: Array<VideoItem | TextItem>;
};

type Timeline = {
  source?: { path: string };
  timeline?: { duration?: number; tracks: Track[] };
  render: { variant: { resolution: string } };
};

type RemotionTimelineProps = {
  fps: number;
  width: number;
  height: number;
  durationInFrames: number;
  timeline: Timeline;
};

const defaultProps = props as RemotionTimelineProps;

const toFrame = (seconds: number, fps: number) => Math.round(seconds * fps);

const videoTrack = (timeline: Timeline) => timeline.timeline?.tracks.find((track) => track.type === "video");
const textTracks = (timeline: Timeline) => timeline.timeline?.tracks.filter((track) => track.type === "title" || track.type === "caption") ?? [];

function HenshushaTimeline(inputProps: RemotionTimelineProps) {
  const timeline = inputProps.timeline;
  const fps = inputProps.fps;
  const sourceFallback = timeline.source?.path;
  return (
    <AbsoluteFill style={{ backgroundColor: "black", overflow: "hidden" }}>
      {videoTrack(timeline)?.items.map((item, index) => {
        const video = item as VideoItem;
        const source = video.source ?? sourceFallback;
        if (!source) return null;
        const from = toFrame(video.start, fps);
        const durationInFrames = toFrame(video.end - video.start, fps);
        return (
          <Sequence key={`video-${index}`} from={from} durationInFrames={durationInFrames}>
            <OffthreadVideo
              src={staticFile(source)}
              startFrom={toFrame(video.sourceStart ?? 0, fps)}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </Sequence>
        );
      })}
      {textTracks(timeline).flatMap((track) => track.items.map((item, index) => {
        const text = item as TextItem;
        const type = track.type as "title" | "caption";
        const durationInFrames = toFrame(text.end - text.start, fps);
        return (
          <Sequence key={`${track.id}-${index}`} from={toFrame(text.start, fps)} durationInFrames={durationInFrames}>
            <TextTemplate type={type} item={text} durationInFrames={durationInFrames} />
          </Sequence>
        );
      }))}
    </AbsoluteFill>
  );
}

export function RemotionRoot() {
  return (
    <Composition
      id="HenshushaTimeline"
      component={HenshushaTimeline}
      durationInFrames={defaultProps.durationInFrames}
      fps={defaultProps.fps}
      width={defaultProps.width}
      height={defaultProps.height}
      defaultProps={defaultProps}
    />
  );
}
