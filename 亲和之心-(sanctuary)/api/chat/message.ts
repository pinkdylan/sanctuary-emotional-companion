// @ts-nocheck
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleChatMessage } from './chatHandler';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = await handleChatMessage(req.body ?? {});
    res.json(payload);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[chat/message]", msg);
    res.status(502).json({ error: msg });
  }
}