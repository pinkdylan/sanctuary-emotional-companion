from __future__ import annotations

import argparse
import json
from pathlib import Path

from transcribe import transcribe_audio


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="ASR executable model CLI")
    parser.add_argument("--audio", required=True, help="Audio file path")
    parser.add_argument(
        "--backend",
        default="faster-whisper",
        choices=["faster-whisper", "vosk", "dummy"],
        help="ASR backend",
    )
    parser.add_argument("--model-size", default="small", help="faster-whisper model size")
    parser.add_argument("--model-path", default="", help="vosk model directory path")
    parser.add_argument("--language", default="zh", help="language code")
    parser.add_argument("--device", default="cpu", help="cpu/cuda")
    parser.add_argument("--output", required=True, help="Output json path")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    res = transcribe_audio(
        audio_path=args.audio,
        backend=args.backend,
        model_size=args.model_size,
        model_path=args.model_path or None,
        language=args.language,
        device=args.device,
    )

    out = {
        "backend": args.backend,
        "audio_path": str(Path(args.audio)),
        "text": res.text,
        "segments": res.segments,
    }
    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[ok] backend={args.backend}, output={out_path}")


if __name__ == "__main__":
    main()
