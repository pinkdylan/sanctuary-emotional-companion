/**
 * 为「心聆」助手挑选相对自然、偏温柔的中文系统语音（Web Speech API）。
 * 不同系统内置音色不同：macOS 常见 Meijia / Ting-Ting；Windows 常见 Yaoyao / Huihui 等。
 */

function scoreZhVoice(v: SpeechSynthesisVoice): number {
  const blob = `${v.name} ${v.lang} ${v.voiceURI}`.toLowerCase();
  let s = 0;

  // 更柔和、偏「陪伴感」的音色（名称因系统而异）
  const cutePreferred =
    /meijia|sin-ji|sinji|ting-ting|tingting|yaoyao|huihui|xiaoxiao|xiaoyi|li-mu|limu|shanshan|yushu|yu-shu|meir|siri.*zh|samantha/;
  const okFemale = /female|女|girl|woman/;
  const kidSoft = /kid|儿童|童声|xiaoxuan|小宣/;

  if (cutePreferred.test(blob)) s += 120;
  if (kidSoft.test(blob)) s += 80;
  if (okFemale.test(blob)) s += 35;

  // 略优先台湾/香港部分女声，常更软一点（主观偏好，可再调）
  if (/zh-tw|zh_hk|zh-hk/.test(blob)) s += 15;

  // 常见「增强/紧凑」版有时更自然
  if (/premium|enhanced|neural|natural/.test(blob)) s += 25;

  // 降低明显男声默认权重（仍可作为兜底）
  if (/\b(male|男|kangkang|liang|yunjian)\b/.test(blob)) s -= 40;

  return s;
}

/**
 * 部分浏览器需异步加载语音列表
 */
export function ensureSpeechVoicesLoaded(): Promise<void> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return Promise.resolve();
  }
  const syn = window.speechSynthesis;
  if (syn.getVoices().length > 0) return Promise.resolve();

  return new Promise((resolve) => {
    const done = () => {
      syn.removeEventListener('voiceschanged', onChange);
      resolve();
    };
    const onChange = () => {
      if (syn.getVoices().length > 0) done();
    };
    syn.addEventListener('voiceschanged', onChange);
    syn.getVoices();
    window.setTimeout(done, 600);
  });
}

export function pickZhAssistantVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices().filter((v) => /^zh/i.test(v.lang));
  if (voices.length === 0) return null;

  const ranked = [...voices].sort((a, b) => scoreZhVoice(b) - scoreZhVoice(a));
  return ranked[0] ?? null;
}

/** 略提高音高、略放慢语速，减轻「机器朗读」感（数值可按反馈再调） */
export const ASSISTANT_UTTERANCE_TUNING = {
  /** 1.0 为默认；略升更「轻快、可爱」 */
  pitch: 1.12,
  /** 1.0 为默认；略降更从容 */
  rate: 0.94,
  volume: 1,
} as const;
