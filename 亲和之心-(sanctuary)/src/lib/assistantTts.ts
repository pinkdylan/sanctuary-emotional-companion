import axios from 'axios';
import { useChatStore } from '../store/useChatStore';
import {
  ASSISTANT_UTTERANCE_TUNING,
  ensureSpeechVoicesLoaded,
  pickZhAssistantVoice,
} from './zhAssistantVoice';
export function startAssistantTts(replyText: string): Promise<void> {
  const { startLipSync, clearLipSync, setSessionState } = useChatStore.getState();

  return new Promise((resolve) => {
    let ended = false;
    const finish = () => {
      if (ended) return;
      ended = true;
      clearLipSync();
      setSessionState('idle');
      resolve();
    };

    (async () => {
      try {
        const res = await axios.post('/api/tts/synthesize', { text: replyText, voiceStyle: 'warm' });
        const data = res.data as {
          durationSec: number;
          visemes: { t: number; v: string }[];
          audioUrl?: string | null;
          useBrowserTts?: boolean;
        };

        const durationSec = Math.max(0.5, data.durationSec ?? 2);
        const visemes = Array.isArray(data.visemes) && data.visemes.length ? data.visemes : [{ t: 0, v: 'sil' }];

        if (data.useBrowserTts && typeof window !== 'undefined' && 'speechSynthesis' in window) {
          await ensureSpeechVoicesLoaded();
          const u = new SpeechSynthesisUtterance(replyText);
          const voice = pickZhAssistantVoice();
          if (voice) {
            u.voice = voice;
            u.lang = voice.lang || 'zh-CN';
          } else {
            u.lang = 'zh-CN';
          }
          u.pitch = ASSISTANT_UTTERANCE_TUNING.pitch;
          u.rate = ASSISTANT_UTTERANCE_TUNING.rate;
          u.volume = ASSISTANT_UTTERANCE_TUNING.volume;
          window.speechSynthesis.cancel();
          u.onend = () => finish();
          u.onerror = () => finish();
          window.speechSynthesis.speak(u);
        }

        startLipSync({ visemes, durationSec });

        if (data.audioUrl) {
          const audio = new Audio(data.audioUrl);
          audio.play().catch(() => {});
          audio.onended = () => finish();
          window.setTimeout(() => finish(), durationSec * 1000 + 800);
        } else {
          window.setTimeout(() => finish(), durationSec * 1000 + 150);
        }
      } catch {
        finish();
      }
    })();
  });
}
