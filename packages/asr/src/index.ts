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

export class MockAsrProvider implements AsrProvider {
  id = "mock";

  async transcribe(input: AsrInput, _options: AsrOptions = {}): Promise<AsrResult> {
    const language = input.language ?? "ja";
    return {
      language,
      text: "これは編集者のサンプルです",
      segments: [
        {
          start: 0,
          end: 2.4,
          text: "これは編集者のサンプルです",
          words: [
            { text: "これは", start: 0, end: 0.5, confidence: 0.99 },
            { text: "編集者", start: 0.5, end: 1.2, confidence: 0.99 },
            { text: "の", start: 1.2, end: 1.35, confidence: 0.99 },
            { text: "サンプルです", start: 1.35, end: 2.4, confidence: 0.99 }
          ]
        }
      ],
      providerMetadata: {
        inputPath: input.path,
        mock: true
      }
    };
  }
}

export function createMockAsrProvider(): AsrProvider {
  return new MockAsrProvider();
}
