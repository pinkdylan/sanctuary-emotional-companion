import type { VercelRequest, VercelResponse } from '@vercel/node';

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

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.json(summaryPayload);
}