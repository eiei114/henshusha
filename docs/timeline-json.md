# Timeline JSON

Draft canonical editing format.

```json
{
  "version": "0.1",
  "source": {
    "path": "sources/raw/test.mp4",
    "audio": "assets/cache/test.wav"
  },
  "narration": {
    "provider": "voicevox-compatible",
    "speaker": "zundamon",
    "scriptPath": "scripts/sample-script.md",
    "audio": "assets/zundamon.wav"
  },
  "transcript": {
    "language": "ja",
    "segments": [
      {
        "id": "seg_001",
        "start": 0.42,
        "end": 3.1,
        "text": "今日は動画編集パッケージを作ります",
        "words": [
          {
            "text": "今日は",
            "start": 0.42,
            "end": 0.9,
            "confidence": 0.96
          }
        ]
      }
    ]
  },
  "timeline": {
    "tracks": [
      {
        "id": "captions",
        "type": "subtitle",
        "items": [
          {
            "id": "cap_001",
            "start": 0.42,
            "end": 3.1,
            "text": "今日は動画編集パッケージを作ります",
            "style": "primary"
          }
        ]
      }
    ]
  },
  "render": {
    "variant": {
      "aspect": "9:16",
      "resolution": "1080x1920",
      "safeArea": "short-video"
    },
    "artDirection": {
      "preset": "yukkuri-zundamon-lite",
      "captionStyle": "large-ja-subtitles"
    }
  }
}
```

## Project-relative paths

Timeline files usually live at `projects/<project-name>/timelines/*.timeline.json`. Relative media paths such as `sources/raw/sample.mp4`, `scripts/sample-script.md`, and `assets/zundamon-sample.wav` are relative to that video project folder.

## Narration

`narration` is optional and supports script-first videos. The initial starter uses `provider: "voicevox-compatible"` and `speaker: "zundamon"` for a lightweight Zundamon / Yukkuri-style path without hardcoding engine-specific speaker IDs.
