/**
 * 将 TTS / CosyVoice 等返回的 viseme 或音素标签映射到 Live2D 常用口型参数。
 * 口型强度为 0~1，再由调用方按模型最大开合换算（默认乘 1.2 并 clamp）。
 */
export type VisemeKey =
  | 'sil'
  | 'PP'
  | 'FF'
  | 'TH'
  | 'DD'
  | 'kk'
  | 'CH'
  | 'SS'
  | 'nn'
  | 'RR'
  | 'aa'
  | 'E'
  | 'I'
  | 'O'
  | 'U'
  | string;

export interface MouthShape {
  /** 嘴张开程度 0~1 */
  open: number;
  /** 嘴形横向形态 -1~1，略影响圆唇/扁唇 */
  form: number;
}

const TABLE: Record<string, MouthShape> = {
  sil: { open: 0, form: 0 },
  PP: { open: 0.08, form: 0.2 },
  FF: { open: 0.12, form: -0.3 },
  TH: { open: 0.15, form: 0 },
  DD: { open: 0.35, form: 0.1 },
  kk: { open: 0.2, form: 0.15 },
  CH: { open: 0.28, form: -0.1 },
  SS: { open: 0.18, form: -0.35 },
  nn: { open: 0.22, form: 0.05 },
  RR: { open: 0.25, form: 0.2 },
  aa: { open: 0.95, form: 0.1 },
  E: { open: 0.55, form: -0.45 },
  I: { open: 0.35, form: -0.6 },
  O: { open: 0.7, form: 0.55 },
  U: { open: 0.45, form: 0.65 },
};

export function visemeToMouth(v: string): MouthShape {
  const key = (v || 'sil').trim();
  return TABLE[key] ?? { open: 0.25, form: 0 };
}

export function pickVisemeAtTime(
  visemes: { t: number; v: string }[],
  elapsedSec: number,
): string {
  if (!visemes.length) return 'sil';
  let current = visemes[0].v;
  for (let i = 0; i < visemes.length; i++) {
    if (visemes[i].t <= elapsedSec) current = visemes[i].v;
    else break;
  }
  return current;
}
