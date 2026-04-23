from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import List

from model import VisemeEvent, generate_face_params


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Face driver model CLI")
    parser.add_argument("--input", required=True, help="Path to viseme input json")
    parser.add_argument("--output", required=True, help="Path to generated face params json")
    parser.add_argument("--fps", type=int, default=30, help="Frames per second")
    parser.add_argument("--smoothing", type=float, default=0.65, help="Smoothing factor [0,1]")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    in_path = Path(args.input)
    out_path = Path(args.output)

    payload = json.loads(in_path.read_text(encoding="utf-8"))
    duration_sec = float(payload["duration_sec"])
    events: List[VisemeEvent] = []
    for item in payload["visemes"]:
        events.append(
            VisemeEvent(
                start=float(item["start"]),
                end=float(item["end"]),
                viseme=str(item["viseme"]),
                strength=float(item.get("strength", 1.0)),
            )
        )

    frames = generate_face_params(
        visemes=events,
        duration_sec=duration_sec,
        fps=args.fps,
        smoothing=args.smoothing,
    )

    out_path.parent.mkdir(parents=True, exist_ok=True)
    output = {
        "duration_sec": duration_sec,
        "fps": args.fps,
        "frame_count": len(frames),
        "frames": frames,
    }
    out_path.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[ok] generated {len(frames)} frames -> {out_path}")


if __name__ == "__main__":
    main()
