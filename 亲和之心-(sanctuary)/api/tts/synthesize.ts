import type { VercelRequest, VercelResponse } from '@vercel/node';
import { alignTextToVisemes } from '../../ttsAlign';
import {
  fetchCosyVoiceInferenceSft,
  pcm16leToWavBuffer,
  pcmDurationSec,
} from '../../cosyvoiceTts';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, voiceStyle } = req.body as { text?: string; voiceStyle?: string };
  const t = String(text || "").trim() || "。";
  const base = (process.env.COSYVOICE_BASE_URL || "").trim();
  const spkId = process.env.COSYVOICE_SPK_ID || "中文女";
  const sampleRate = parseInt(process.env.COSYVOICE_SAMPLE_RATE || "22050", 10);

  try {
    let durationSec: number;
    let audioUrl: string | null = null;
    let useBrowserTts = true;
    let cosyMeta: Record<string, unknown> = { connected: false };

    if (base) {
      const pcm = await fetchCosyVoiceInferenceSft(base, t, spkId);
      durationSec = pcmDurationSec(pcm.length, sampleRate, 1);
      const wav = pcm16leToWavBuffer(pcm, sampleRate, 1);
      audioUrl = `data:audio/wav;base64,${wav.toString("base64")}`;
      useBrowserTts = false;
      cosyMeta = {
        connected: true,
        sampleRate,
        spk_id: spkId,
        endpoint: "/inference_sft",
        voiceStyle: voiceStyle ?? null,
      };
    } else {
      durationSec = Math.min(20, Math.max(1.2, t.length * 0.085));
      cosyMeta = { connected: false, hint: "设置 COSYVOICE_BASE_URL 可接入真实 CosyVoice FastAPI" };
    }

    const { visemes, phonemeTimeline } = alignTextToVisemes(t, durationSec);

    res.json({
      durationSec,
      visemes,
      phonemeTimeline,
      audioUrl,
      useBrowserTts,
      cosyvoice: cosyMeta,
    });
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    console.error("[tts/synthesize]", err);
    const durationSec = Math.min(20, Math.max(1.2, t.length * 0.085));
    // 勿再调用 alignTextToVisemes，避免口型对齐失败时二次抛错拖垮进程
    const visemes = [
      { t: 0, v: "sil" },
      { t: durationSec, v: "sil" },
    ];
    res.json({
      durationSec,
      visemes,
      phonemeTimeline: [] as { t: number; phone: string; viseme: string }[],
      audioUrl: null,
      useBrowserTts: true,
      cosyvoice: { connected: !!base, error: err },
    });
  }
}