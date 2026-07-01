# Timeline JSON

Draft canonical editing format.

```json
{
  "version": "0.1",
  "source": {
    "path": "sources/raw/test.mp4",
    "audio": "assets/cache/test.wav"
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
      "preset": "clean-bold-captions",
      "captionStyle": "karaoke-highlight"
    }
  }
}
```
