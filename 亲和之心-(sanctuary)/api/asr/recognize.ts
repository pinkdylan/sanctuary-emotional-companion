import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Mock ASR
  setTimeout(() => {
    res.json({ text: "最近总是睡不好，心里有点焦虑。", confidence: 0.91 });
  }, 1000);
}