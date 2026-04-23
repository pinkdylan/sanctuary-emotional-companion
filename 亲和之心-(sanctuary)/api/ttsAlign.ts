/**
 * 将中文拼音/英文片段映射到 Live2D 使用的 viseme，并按权重把总时长 durationSec 切成时间轴。
 * CosyVoice 不返回音素时，用「文本 → 拼音音节 → viseme」做与音频时长对齐的口型驱动。
 */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
// pinyin@4 为 CJS：default import 在 tsx 下常得到模块对象而非函数，用 require 取 .pinyin
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pinyinPkg = require("pinyin") as {
  pinyin: ((str: string, options?: { style?: number; heteronym?: boolean }) => string[][]) & {
    STYLE_NORMAL: number;
  };
  default?: typeof pinyinPkg.pinyin;
};
const pinyin = pinyinPkg.pinyin ?? pinyinPkg.default;
if (typeof pinyin !== "function") {
  throw new Error("pinyin: 无法加载可调用导出，请检查依赖安装");
}
const STYLE = pinyin.STYLE_NORMAL;

function stripDigits(s: string): string {
  return s.replace(/[1-5]/g, '');
}

/** 拼音音节（无声调）→ Oculus 风格 viseme 近似 */
export function syllableToViseme(syl: string): string {
  const s = stripDigits(syl).toLowerCase();
  if (!s) return 'sil';

  if (s.length === 1 && /[a-z]/.test(s)) {
    const v: Record<string, string> = { a: 'aa', e: 'E', i: 'I', o: 'O', u: 'U' };
    return v[s] ?? 'DD';
  }

  const initials = [
    'zh',
    'ch',
    'sh',
    'b',
    'p',
    'm',
    'f',
    'd',
    't',
    'n',
    'l',
    'g',
    'k',
    'h',
    'j',
    'q',
    'x',
    'r',
    'z',
    'c',
    's',
    'y',
    'w',
  ].sort((a, b) => b.length - a.length);

  let rest = s;
  for (const init of initials) {
    if (rest.startsWith(init)) {
      rest = rest.slice(init.length);
      break;
    }
  }

  if (!rest) return 'DD';

  if (/^(a|ai|ao|an|ang)/.test(rest)) return 'aa';
  if (/^(e|ei|en|eng|er)/.test(rest)) return 'E';
  if (/^(i|ia|ie|iu|in|ing|iong)/.test(rest)) return 'I';
  if (/^(o|ou)/.test(rest)) return 'O';
  if (/^(u|ü|v|un|vn|uan|ui)/.test(rest)) return 'U';
  return 'E';
}

export type AlignUnit = { syl: string; weight: number };

export function extractUnits(text: string): AlignUnit[] {
  const units: AlignUnit[] = [];
  for (const ch of text) {
    if (/[\u4e00-\u9fff]/.test(ch)) {
      const py = pinyin(ch, { style: STYLE, heteronym: false }) as string[][];
      const raw = py[0]?.[0];
      const syl = raw ? stripDigits(String(raw)) : '';
      if (syl) units.push({ syl, weight: 1 });
      else units.push({ syl: 'sil', weight: 0.35 });
    } else if (/[a-zA-Z]/.test(ch)) {
      units.push({ syl: ch.toLowerCase(), weight: 0.38 });
    } else if (/\s/.test(ch)) {
      units.push({ syl: 'sil', weight: 0.12 });
    }
  }
  if (units.length === 0) units.push({ syl: 'sil', weight: 1 });
  return units;
}

function unitToViseme(syl: string): string {
  if (syl === 'sil') return 'sil';
  if (syl.length === 1 && /[a-z]/.test(syl)) {
    const map: Record<string, string> = { a: 'aa', e: 'E', i: 'I', o: 'O', u: 'U' };
    return map[syl] ?? 'DD';
  }
  return syllableToViseme(syl);
}

export interface AlignResult {
  visemes: { t: number; v: string }[];
  phonemeTimeline: { t: number; phone: string; viseme: string }[];
}

export function alignTextToVisemes(text: string, durationSec: number): AlignResult {
  const safeDur = Math.max(0.25, durationSec);
  const units = extractUnits(text);
  const totalW = units.reduce((s, u) => s + u.weight, 0);

  const visemes: { t: number; v: string }[] = [{ t: 0, v: 'sil' }];
  const phonemeTimeline: { t: number; phone: string; viseme: string }[] = [];

  let t = 0;
  for (const u of units) {
    const v = unitToViseme(u.syl);
    const dt = (u.weight / totalW) * safeDur;
    t = Math.min(safeDur, t + dt);
    phonemeTimeline.push({ t, phone: u.syl, viseme: v });
    const last = visemes[visemes.length - 1];
    if (last.v !== v) visemes.push({ t, v });
    else last.t = t;
  }

  if (visemes[visemes.length - 1].t < safeDur || visemes[visemes.length - 1].v !== 'sil') {
    visemes.push({ t: safeDur, v: 'sil' });
  }

  return { visemes, phonemeTimeline };
}
