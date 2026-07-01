export interface HenshushaProjectLayout {
  sourcesDir: string;
  transcriptsDir: string;
  timelinesDir: string;
  rendersDir: string;
  voicesDir?: string;
  scriptsDir?: string;
}

export interface HenshushaNarrationConfig {
  defaultVoiceProvider?: string;
  defaultSpeaker?: string;
}

export interface HenshushaConfig {
  schemaVersion: 1;
  projectsDir: string;
  defaultProject?: string;
  defaultLanguage?: string;
  defaultAsrProvider?: string;
  narration?: HenshushaNarrationConfig;
  projectLayout: HenshushaProjectLayout;
}

export const defaultProjectLayout: HenshushaProjectLayout = {
  sourcesDir: "sources/raw",
  transcriptsDir: "transcripts",
  timelinesDir: "timelines",
  rendersDir: "renders",
  voicesDir: "voices",
  scriptsDir: "scripts"
};

export const defaultConfig: HenshushaConfig = {
  schemaVersion: 1,
  projectsDir: "projects",
  defaultLanguage: "ja",
  defaultAsrProvider: "mock",
  narration: {
    defaultVoiceProvider: "voicevox-compatible",
    defaultSpeaker: "zundamon"
  },
  projectLayout: defaultProjectLayout
};
