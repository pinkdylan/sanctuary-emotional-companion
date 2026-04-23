import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __rootDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__rootDir, ".env") });
dotenv.config({ path: path.join(process.cwd(), ".env"), override: false });

if (process.env.NODE_ENV !== "production") {
  const hasKey = Boolean((process.env.AI_API_KEY || process.env.DASHSCOPE_API_KEY || "").trim());
  console.log(`[env] .env loaded from project dir · AI_API_KEY: ${hasKey ? "yes" : "no (chat uses mock)"}`);
}
import { alignTextToVisemes } from "./ttsAlign";
import {
  fetchCosyVoiceInferenceSft,
  pcm16leToWavBuffer,
  pcmDurationSec,
} from "./cosyvoiceTts";
import { handleChatMessage } from "./chatHandler";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/auth/login", (req, res) => {
    const { nickname } = req.body;
    res.json({ token: "mock-token-123", userId: "u_001", user: { id: 1, nickname: nickname || "Guest" } });
  });

  app.post("/api/chat/message", async (req, res) => {
    try {
      const payload = await handleChatMessage(req.body ?? {});
      res.json(payload);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[chat/message]", msg);
      res.status(502).json({ error: msg });
    }
  });

  app.post("/api/asr/recognize", (req, res) => {
    // Mock ASR
    setTimeout(() => {
      res.json({ text: "最近总是睡不好，心里有点焦虑。", confidence: 0.91 });
    }, 1000);
  });

  /**
   * TTS + 口型对齐
   * - 若设置 COSYVOICE_BASE_URL：请求官方 FastAPI /inference_sft，用 PCM 长度换算真实 durationSec，再按拼音音节把 viseme 压到同一时间轴。
   * - 否则：用文本长度估算时长，仍走同一套 alignTextToVisemes（浏览器 speechSynthesis 兜底）。
   * 归一化 JSON 示例见 cosyvoice-response.example.json
   */
  app.post("/api/tts/synthesize", async (req, res) => {
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
  });

  const summaryPayload = {
      duration: "15分钟",
      topic: "睡眠和感受",
      insight: "很高兴听到您的进步。察觉自己的感受是走向平和的第一步。",
      anxietyTrend: [60, 55, 45, 30],
      durationSec: 900,
      turns: 12,
      riskTrend: {
        anxiety: [68, 61, 54],
        depression: [42, 39, 36],
        bipolar: [22, 21, 21],
      },
      suggestions: [
        { id: 1, title: "深呼吸", desc: "感到匆忙时，尝试三次深长的呼吸。", icon: "air" },
        { id: 2, title: "听听轻音乐", desc: "悠扬的旋律能让您的心情恢复平静。", icon: "music_note" },
        { id: 3, title: "寻觅阳光", desc: "每天在窗边或户外阳光下待上五分钟。", icon: "wb_sunny" }
      ]
  };

  app.get("/api/session/summary", (req, res) => {
    res.json(summaryPayload);
  });

  app.post("/api/session/summary", (req, res) => {
    res.json(summaryPayload);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
