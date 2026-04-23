import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { nickname } = req.body;
  res.json({ token: "mock-token-123", userId: "u_001", user: { id: 1, nickname: nickname || "Guest" } });
}