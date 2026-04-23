from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List


@dataclass
class VisemeEvent:
    start: float
    end: float
    viseme: str
    strength: float = 1.0


VISEME_TO_FACE: Dict[str, Dict[str, float]] = {
    "a": {"mouth_open": 0.85, "mouth_wide": 0.30, "mouth_round": 0.10, "jaw_open": 0.60},
    "i": {"mouth_open": 0.45, "mouth_wide": 0.80, "mouth_round": 0.05, "jaw_open": 0.35},
    "u": {"mouth_open": 0.35, "mouth_wide": 0.20, "mouth_round": 0.90, "jaw_open": 0.30},
    "e": {"mouth_open": 0.50, "mouth_wide": 0.65, "mouth_round": 0.15, "jaw_open": 0.40},
    "o": {"mouth_open": 0.70, "mouth_wide": 0.25, "mouth_round": 0.85, "jaw_open": 0.50},
    "mbp": {"mouth_open": 0.05, "mouth_wide": 0.25, "mouth_round": 0.05, "jaw_open": 0.05},
    "sil": {"mouth_open": 0.02, "mouth_wide": 0.10, "mouth_round": 0.02, "jaw_open": 0.02},
}


def _clamp(v: float) -> float:
    return max(0.0, min(1.0, v))


def _active_value(events: List[VisemeEvent], t: float) -> Dict[str, float]:
    active = [e for e in events if e.start <= t < e.end]
    if not active:
        return VISEME_TO_FACE["sil"].copy()

    accum = {"mouth_open": 0.0, "mouth_wide": 0.0, "mouth_round": 0.0, "jaw_open": 0.0}
    total = 0.0

    for evt in active:
        key = evt.viseme.lower()
        base = VISEME_TO_FACE.get(key, VISEME_TO_FACE["sil"])
        w = _clamp(evt.strength)
        total += w
        for k in accum:
            accum[k] += base[k] * w

    if total <= 0.0:
        return VISEME_TO_FACE["sil"].copy()

    for k in accum:
        accum[k] = _clamp(accum[k] / total)
    return accum


def generate_face_params(
    visemes: List[VisemeEvent],
    duration_sec: float,
    fps: int = 30,
    smoothing: float = 0.65,
) -> List[Dict[str, float]]:
    if fps <= 0:
        raise ValueError("fps must be > 0")
    if duration_sec <= 0:
        raise ValueError("duration_sec must be > 0")

    frame_count = int(duration_sec * fps) + 1
    result: List[Dict[str, float]] = []
    prev = VISEME_TO_FACE["sil"].copy()

    for i in range(frame_count):
        t = i / fps
        target = _active_value(visemes, t)
        smoothed = {}
        for k in prev:
            smoothed[k] = _clamp(prev[k] * smoothing + target[k] * (1.0 - smoothing))
        prev = smoothed
        result.append({"t": round(t, 4), **{k: round(v, 4) for k, v in smoothed.items()}})
    return result
