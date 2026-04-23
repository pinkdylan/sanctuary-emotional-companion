from __future__ import annotations

import json
import wave
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional


@dataclass
class AsrResult:
    text: str
    segments: List[Dict[str, object]]


def _transcribe_dummy(audio_path: Path) -> AsrResult:
    fake = f"示例转写结果：已接收音频文件 {audio_path.name}。请切换 faster-whisper 或 vosk 获取真实识别内容。"
    return AsrResult(text=fake, segments=[{"start": 0.0, "end": 0.0, "text": fake}])


def _transcribe_faster_whisper(audio_path: Path, model_size: str, language: Optional[str], device: str) -> AsrResult:
    try:
        from faster_whisper import WhisperModel  # type: ignore
    except ImportError as exc:
        raise RuntimeError("faster-whisper 未安装，请先 pip install -r requirements.txt") from exc

    model = WhisperModel(model_size, device=device, compute_type="int8")
    segments, _ = model.transcribe(str(audio_path), language=language, vad_filter=True)
    out_segments: List[Dict[str, object]] = []
    texts: List[str] = []
    for seg in segments:
        text = seg.text.strip()
        texts.append(text)
        out_segments.append({"start": float(seg.start), "end": float(seg.end), "text": text})
    return AsrResult(text="".join(texts).strip(), segments=out_segments)


def _transcribe_vosk(audio_path: Path, model_path: Path) -> AsrResult:
    try:
        from vosk import KaldiRecognizer, Model  # type: ignore
    except ImportError as exc:
        raise RuntimeError("vosk 未安装，请先 pip install -r requirements.txt") from exc

    if not model_path.exists():
        raise RuntimeError(f"vosk model_path 不存在: {model_path}")

    wf = wave.open(str(audio_path), "rb")
    if wf.getnchannels() != 1 or wf.getsampwidth() != 2:
        raise RuntimeError("vosk 需要单声道 PCM16 WAV。请先转换音频格式。")

    model = Model(str(model_path))
    rec = KaldiRecognizer(model, wf.getframerate())
    rec.SetWords(True)

    parts: List[str] = []
    segs: List[Dict[str, object]] = []
    while True:
        data = wf.readframes(4000)
        if len(data) == 0:
            break
        if rec.AcceptWaveform(data):
            j = json.loads(rec.Result())
            text = j.get("text", "").strip()
            if text:
                parts.append(text)
                segs.append({"start": None, "end": None, "text": text})
    final_json = json.loads(rec.FinalResult())
    final_text = final_json.get("text", "").strip()
    if final_text:
        parts.append(final_text)
        segs.append({"start": None, "end": None, "text": final_text})
    return AsrResult(text=" ".join(parts).strip(), segments=segs)


def transcribe_audio(
    audio_path: str,
    backend: str,
    model_size: str = "small",
    model_path: Optional[str] = None,
    language: Optional[str] = "zh",
    device: str = "cpu",
) -> AsrResult:
    ap = Path(audio_path)
    if not ap.exists():
        raise FileNotFoundError(f"audio file not found: {ap}")

    if backend == "dummy":
        return _transcribe_dummy(ap)
    if backend == "faster-whisper":
        return _transcribe_faster_whisper(ap, model_size=model_size, language=language, device=device)
    if backend == "vosk":
        if not model_path:
            raise RuntimeError("vosk backend 需要 --model-path")
        return _transcribe_vosk(ap, Path(model_path))

    raise ValueError(f"unsupported backend: {backend}")
