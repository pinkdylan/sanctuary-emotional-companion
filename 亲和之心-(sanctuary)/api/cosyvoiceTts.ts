/**
 * CosyVoice FastAPI：StreamingResponse 为 int16 PCM mono（与官方 runtime/python/fastapi/server.py 一致）。
 * 采样率以环境变量为准（CosyVoice2 常用 22050，请以你本机推理日志为准）。
 */

export function pcm16leToWavBuffer(pcm: Buffer, sampleRate: number, numChannels = 1): Buffer {
  const bitsPerSample = 16;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = pcm.length;
  const out = Buffer.alloc(44 + dataSize);

  out.write('RIFF', 0);
  out.writeUInt32LE(36 + dataSize, 4);
  out.write('WAVE', 8);
  out.write('fmt ', 12);
  out.writeUInt32LE(16, 16);
  out.writeUInt16LE(1, 20);
  out.writeUInt16LE(numChannels, 22);
  out.writeUInt32LE(sampleRate, 24);
  out.writeUInt32LE(byteRate, 28);
  out.writeUInt16LE(blockAlign, 32);
  out.writeUInt16LE(bitsPerSample, 34);
  out.write('data', 36);
  out.writeUInt32LE(dataSize, 40);
  pcm.copy(out, 44);
  return out;
}

export function pcmDurationSec(pcmByteLength: number, sampleRate: number, numChannels = 1): number {
  const samples = pcmByteLength / 2 / numChannels;
  return samples / sampleRate;
}

export async function fetchCosyVoiceInferenceSft(
  baseUrl: string,
  ttsText: string,
  spkId: string,
): Promise<Buffer> {
  const base = baseUrl.replace(/\/$/, '');
  const url = `${base}/inference_sft`;
  const body = new URLSearchParams();
  body.set('tts_text', ttsText);
  body.set('spk_id', spkId);

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`CosyVoice ${res.status}: ${errText.slice(0, 200)}`);
  }

  return Buffer.from(await res.arrayBuffer());
}
