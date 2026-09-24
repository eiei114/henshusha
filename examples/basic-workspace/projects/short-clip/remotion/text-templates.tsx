import React from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export type TextOverlayType = "title" | "caption";

export type TextOverlayItem = {
  start: number;
  end: number;
  text: string;
  preset?: string;
  accent?: string;
  label?: string;
  speaker?: string;
};

type TextTemplateProps = {
  type: TextOverlayType;
  item: TextOverlayItem;
  durationInFrames: number;
};

const theme = {
  fontFamily: '"Yu Gothic", "Hiragino Sans", "Meiryo", sans-serif',
  white: "#fffaf0",
  ink: "#121318",
  accent: "#ffcf33",
  pink: "#ff4f9a",
  cyan: "#45d7ff",
  shadow: "0 12px 36px rgba(0,0,0,0.48)",
  deepShadow: "0 10px 26px rgba(0,0,0,0.78)"
};

function splitLines(text: string): string[] {
  return text.split("\n").map((line) => line.trim()).filter(Boolean);
}

function useIntro() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 16, stiffness: 150, mass: 0.7 } });
  const fade = interpolate(frame, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const slide = interpolate(frame, [0, 12], [34, 0], { easing: Easing.out(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return { pop, fade, slide };
}

function Shell(props: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        fontFamily: theme.fontFamily,
        pointerEvents: "none",
        ...props.style
      }}
    >
      {props.children}
    </div>
  );
}

function HeadlinePop({ item }: TextTemplateProps) {
  const { pop, fade } = useIntro();
  const accent = item.accent ?? theme.accent;
  return (
    <Shell
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 8%",
        background: "radial-gradient(circle at 50% 42%, rgba(0,0,0,0.34), rgba(0,0,0,0.06) 50%, rgba(0,0,0,0.28))"
      }}
    >
      <div style={{ transform: `scale(${0.88 + pop * 0.12})`, opacity: fade, textAlign: "center" }}>
        <div
          style={{
            display: "inline-block",
            marginBottom: 22,
            padding: "9px 18px",
            borderRadius: 999,
            background: accent,
            color: theme.ink,
            fontSize: 26,
            fontWeight: 900,
            letterSpacing: "0.12em",
            boxShadow: theme.shadow
          }}
        >
          {item.label ?? "HOOK"}
        </div>
        <div
          style={{
            color: theme.white,
            fontSize: 92,
            lineHeight: 1.03,
            fontWeight: 1000,
            letterSpacing: "-0.04em",
            textShadow: theme.deepShadow
          }}
        >
          {splitLines(item.text).map((line, index) => <div key={`${index}-${line}`}>{line}</div>)}
        </div>
      </div>
    </Shell>
  );
}

function CaptionBubble({ item }: TextTemplateProps) {
  const { fade, slide } = useIntro();
  return (
    <Shell style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0 7% 11%" }}>
      <div
        style={{
          opacity: fade,
          transform: `translateY(${slide}px)`,
          maxWidth: "92%",
          padding: "24px 32px",
          borderRadius: 30,
          color: theme.white,
          background: "linear-gradient(180deg, rgba(18,19,24,0.90), rgba(18,19,24,0.72))",
          border: "2px solid rgba(255,255,255,0.18)",
          boxShadow: theme.shadow,
          textAlign: "center",
          fontSize: 58,
          lineHeight: 1.12,
          fontWeight: 900,
          textShadow: "0 3px 10px rgba(0,0,0,0.7)"
        }}
      >
        {item.text}
      </div>
    </Shell>
  );
}

function KaraokeCaption({ item, durationInFrames }: TextTemplateProps) {
  const frame = useCurrentFrame();
  const { fade, slide } = useIntro();
  const progress = interpolate(frame, [0, Math.max(1, durationInFrames - 5)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
  const accent = item.accent ?? theme.cyan;
  return (
    <Shell style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0 6% 12%" }}>
      <div style={{ opacity: fade, transform: `translateY(${slide}px)`, textAlign: "center", width: "100%" }}>
        <div
          style={{
            display: "inline-block",
            maxWidth: "94%",
            padding: "18px 28px 26px",
            borderRadius: 26,
            color: "white",
            background: "rgba(0,0,0,0.58)",
            boxShadow: theme.shadow,
            fontSize: 58,
            lineHeight: 1.12,
            fontWeight: 950,
            textShadow: theme.deepShadow
          }}
        >
          <div>{item.text}</div>
          <div style={{ height: 8, marginTop: 13, borderRadius: 99, background: "rgba(255,255,255,0.18)", overflow: "hidden" }}>
            <div style={{ width: `${progress * 100}%`, height: "100%", borderRadius: 99, background: accent }} />
          </div>
        </div>
      </div>
    </Shell>
  );
}

function LowerThird({ item }: TextTemplateProps) {
  const { fade, slide } = useIntro();
  const accent = item.accent ?? theme.pink;
  return (
    <Shell style={{ display: "flex", alignItems: "flex-end", justifyContent: "flex-start", padding: "0 7% 13%" }}>
      <div style={{ opacity: fade, transform: `translateX(${-slide}px)`, width: "82%" }}>
        <div style={{ width: 110, height: 8, borderRadius: 99, background: accent, marginBottom: 14 }} />
        <div
          style={{
            padding: "22px 28px",
            borderRadius: 24,
            background: "rgba(10,12,18,0.76)",
            color: theme.white,
            boxShadow: theme.shadow,
            borderLeft: `8px solid ${accent}`
          }}
        >
          {item.speaker ? <div style={{ color: accent, fontSize: 26, fontWeight: 900, letterSpacing: "0.08em", marginBottom: 8 }}>{item.speaker}</div> : null}
          <div style={{ fontSize: 55, lineHeight: 1.12, fontWeight: 950 }}>{item.text}</div>
        </div>
      </div>
    </Shell>
  );
}

function QuoteCard({ item }: TextTemplateProps) {
  const { pop, fade } = useIntro();
  const accent = item.accent ?? theme.accent;
  return (
    <Shell style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0 8%" }}>
      <div
        style={{
          opacity: fade,
          transform: `scale(${0.94 + pop * 0.06})`,
          width: "100%",
          padding: "38px 40px",
          borderRadius: 36,
          background: "rgba(255,250,240,0.92)",
          color: theme.ink,
          boxShadow: theme.shadow,
          border: `5px solid ${accent}`
        }}
      >
        <div style={{ color: accent, fontSize: 76, fontWeight: 1000, lineHeight: 0.75 }}>“</div>
        <div style={{ fontSize: 62, lineHeight: 1.12, fontWeight: 950 }}>{item.text}</div>
      </div>
    </Shell>
  );
}

export function TextTemplate(props: TextTemplateProps) {
  const preset = props.item.preset ?? (props.type === "title" ? "headline-pop" : "bottom-caption");
  if (preset === "headline-pop" || preset === "bold-center") return <HeadlinePop {...props} />;
  if (preset === "karaoke-caption") return <KaraokeCaption {...props} />;
  if (preset === "lower-third") return <LowerThird {...props} />;
  if (preset === "quote-card") return <QuoteCard {...props} />;
  return <CaptionBubble {...props} />;
}
