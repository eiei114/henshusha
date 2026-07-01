import React from "react";
import { AbsoluteFill, Composition, OffthreadVideo, Sequence, staticFile } from "remotion";
import props from "./timeline-props.json";

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

function textStyle(type: "title" | "caption"): React.CSSProperties {
  const isCaption = type === "caption";
  return {
    position: "absolute",
    left: "8%",
    right: "8%",
    top: isCaption ? undefined : "42%",
    bottom: isCaption ? "14%" : undefined,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    color: "white",
    fontFamily: '"Yu Gothic", "Meiryo", sans-serif',
    fontSize: isCaption ? 54 : 76,
    fontWeight: 800,
    lineHeight: 1.18,
    textShadow: "0 4px 18px rgba(0,0,0,0.75)",
    backgroundColor: isCaption ? "rgba(0,0,0,0.42)" : "rgba(0,0,0,0.52)",
    borderRadius: 28,
    padding: "24px 30px"
  };
}

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
        return (
          <Sequence key={`${track.id}-${index}`} from={toFrame(text.start, fps)} durationInFrames={toFrame(text.end - text.start, fps)}>
            <div style={textStyle(type)}>{text.text}</div>
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
