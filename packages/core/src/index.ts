export interface HenshushaProjectLayout {
  sourcesDir: string;
  scriptsDir: string;
  transcriptsDir: string;
  timelinesDir: string;
  rendersDir: string;
}

export interface HenshushaFeatureFlags {
  asr: "deferred" | "enabled";
  tts: "deferred" | "enabled";
}

export interface HenshushaConfig {
  schemaVersion: 1;
  projectsDir: string;
  defaultProject?: string;
  defaultLanguage?: string;
  projectLayout: HenshushaProjectLayout;
  features: HenshushaFeatureFlags;
}

export const defaultProjectLayout: HenshushaProjectLayout = {
  sourcesDir: "sources/raw",
  scriptsDir: "scripts",
  transcriptsDir: "transcripts",
  timelinesDir: "timelines",
  rendersDir: "renders"
};

export const defaultConfig: HenshushaConfig = {
  schemaVersion: 1,
  projectsDir: "projects",
  defaultProject: "sample-video",
  defaultLanguage: "ja",
  projectLayout: defaultProjectLayout,
  features: {
    asr: "deferred",
    tts: "deferred"
  }
};
