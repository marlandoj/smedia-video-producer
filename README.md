# smedia-video-producer

End-to-end AI video production pipeline. Takes a text brief, generates a storyboard, creates scene images and video clips via [fal.ai](https://fal.ai), adds voiceover (ElevenLabs or OpenAI TTS), burns in captions, mixes background music, and delivers platform-ready video.

Built as an [Agent Skill](https://agentskills.io) for [Zo Computer](https://zocomputer.com).

## Features

- **Full pipeline** — brief → storyboard → image gen → video clips → voiceover → captions → assembly
- **14 commands** — produce, storyboard, generate, voiceover, captions, assemble, optimize, preview, publish, calendar, translate, variants, lipsync, analytics
- **Platform presets** — TikTok, Reels, YouTube Shorts, Facebook, YouTube (auto aspect ratio + resolution)
- **Character integration** — apply consistent visual style, voice, and personality via [zo-ai-character-builder](https://github.com/marlandoj/zo-ai-character-builder)
- **Multi-language** — translate storyboard + voiceover to 6 languages
- **A/B variants** — generate alternate hooks, music, and styles for testing
- **Lip-sync** — talking-head video from a face image + audio
- **~$1.50/video** — pay-per-use via fal.ai, no subscription required

## Quick Start

```bash
# Install bundled fal-ai-media dependency (one-time)
cd scripts/vendor/fal-ai-media && bun install && cd -

# Full pipeline — brief to finished video
bun scripts/video-producer.ts produce \
  --brief "15-second TikTok ad for tallow balm, punchy hook, natural ingredients angle" \
  --platform tiktok \
  --output output.mp4

# With a character identity (from zo-ai-character-builder)
bun scripts/video-producer.ts produce \
  --brief "tallow balm ad" \
  --character path/to/character-identity.json \
  --platform tiktok \
  --output output.mp4
```

## Commands

| Command | Description |
|---------|------------|
| `produce` | Full pipeline: storyboard → generate → voiceover → captions → assemble |
| `storyboard` | Generate storyboard JSON from a text brief |
| `generate` | Generate scene images and video clips from storyboard |
| `voiceover` | Generate voiceover audio from script text |
| `captions` | Generate timed ASS/SRT caption file |
| `assemble` | Compose final video from scenes + audio + captions |
| `optimize` | Re-encode for a specific platform |
| `preview` | Quick low-res preview from scene assets |
| `publish` | Upload and publish to TikTok/Facebook/Instagram via Blotato |
| `calendar` | Batch-produce videos from a content calendar markdown file |
| `translate` | Translate storyboard text/voiceover to another language |
| `variants` | Generate A/B variant storyboards with different hooks/music/styles |
| `lipsync` | Generate lip-synced talking-head video from face image + audio |
| `analytics` | Pull platform metrics and generate improvement recommendations |

Run `bun scripts/video-producer.ts --help` or `bun scripts/video-producer.ts <command> --help` for full options.

## Requirements

- [Bun](https://bun.sh) runtime
- [ffmpeg](https://ffmpeg.org) (pre-installed on Zo Computer)
- API keys in environment variables:

| Variable | Provider | Required |
|----------|----------|----------|
| `FAL_KEY` | [fal.ai](https://fal.ai) — image gen + video gen | Yes |
| `OPENAI_API_KEY` | [OpenAI](https://platform.openai.com) — TTS + translation | Yes (fallback voiceover) |
| `ELEVENLABS_API_KEY` | [ElevenLabs](https://elevenlabs.io) — premium voiceover | Optional |
| `BLOTATO_API_KEY` | [Blotato](https://blotato.com) — social publishing | Optional |

## Platform Presets

| Platform | Aspect | Resolution | Max Duration |
|----------|--------|------------|-------------|
| tiktok | 9:16 | 1080×1920 | 60s |
| reels | 9:16 | 1080×1920 | 90s |
| youtube-shorts | 9:16 | 1080×1920 | 60s |
| facebook | 4:5 | 1080×1350 | 60s |
| youtube | 16:9 | 1920×1080 | unlimited |

## Character Integration

Use with [zo-ai-character-builder](https://github.com/marlandoj/zo-ai-character-builder) to apply a character's visual style, voice, and personality to every video:

```bash
# Create a character
bun generate-identity.ts --name "Flora Belle" --output character.json
bun generate-avatar.ts --identity character.json
bun generate-voice.ts --identity character.json

# Use in video production — auto-applies style, voice, prompt enrichment
bun scripts/video-producer.ts produce --brief "spring skincare ad" --character character.json --platform tiktok
```

The `--character` flag is supported on: `produce`, `generate`, `lipsync`

## Assets

- `assets/music/` — Royalty-free background tracks (upbeat-corporate, chill-lofi, cinematic-epic, acoustic-warm)
- `assets/fonts/` — Montserrat Bold + Regular for text overlays
- `assets/templates/caption-styles/` — ASS subtitle presets (tiktok-bold, minimal-white, brand-ffb)

## Cost Estimate (15s video, 4 scenes)

| Component | Model | Cost |
|-----------|-------|------|
| Scene images | nano-banana-2 | $0.16 |
| Image-to-video | kling-v3-std | ~$1.40 |
| Voiceover | OpenAI TTS / ElevenLabs | ~$0.03 |
| Assembly | ffmpeg (local) | $0.00 |
| **Total** | | **~$1.56** |

## Project Structure

```
├── SKILL.md                          # Agent skill manifest
├── scripts/
│   ├── video-producer.ts             # Main CLI orchestrator (14 commands)
│   ├── storyboard.ts                 # Brief → storyboard JSON generation
│   ├── assemble.ts                   # FFmpeg video composition engine
│   └── captions.ts                   # Caption/subtitle generation
├── assets/
│   ├── fonts/                        # Montserrat typeface for overlays
│   ├── music/                        # Background music presets
│   └── templates/caption-styles/     # ASS subtitle style presets
└── references/
    └── ffmpeg-recipes.md             # FFmpeg filter recipes reference
```

## License

MIT
