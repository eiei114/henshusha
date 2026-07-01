export interface AsrInput {
  path: string;
  language?: string;
}

export interface AsrOptions {
  wordTimestamps?: boolean;
  diarization?: boolean;
}

export interface AsrWord {
  text: string;
  start: number;
  end: number;
  confidence?: number;
}

export interface AsrSegment {
  start: number;
  end: number;
  text: string;
  words?: AsrWord[];
}

export interface AsrResult {
  language: string;
  text: string;
  segments: AsrSegment[];
  providerMetadata?: Record<string, unknown>;
}

export interface AsrProvider {
  id: string;
  transcribe(input: AsrInput, options?: AsrOptions): Promise<AsrResult>;
}
