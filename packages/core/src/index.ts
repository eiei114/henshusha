export interface HenshushaConfig {
  sourcesDir: string;
  transcriptsDir: string;
  timelinesDir: string;
  rendersDir: string;
  defaultAsrProvider?: string;
}

export const defaultConfig: HenshushaConfig = {
  sourcesDir: "sources/raw",
  transcriptsDir: "transcripts",
  timelinesDir: "timelines",
  rendersDir: "renders"
};
