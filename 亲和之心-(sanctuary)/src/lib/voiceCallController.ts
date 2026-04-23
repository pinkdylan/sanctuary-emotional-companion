import { sendChatMessage } from './sendChatMessage';
import { useChatStore } from '../store/useChatStore';

function getRecognitionCtor(): (new () => SpeechRecognition) | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isVoiceCallSupported(): boolean {
  return typeof window !== 'undefined' && getRecognitionCtor() !== null;
}

export interface VoiceCallControllerOptions {
  onUnsupported?: () => void;
  onError?: (message: string) => void;
}

/**
 * 电话模式：Web Speech API 连续识别，停顿后出现 isFinal 即入队；
 * Promise 链串行「发消息 + 等 TTS 结束」后再开麦，避免助手声音被识别进去。
 */
export function createVoiceCallController(options: VoiceCallControllerOptions = {}) {
  const Ctor = getRecognitionCtor();
  if (!Ctor) {
    options.onUnsupported?.();
    return {
      start: () => {},
      stop: () => {},
      isRunning: () => false,
    };
  }

  let recognition: SpeechRecognition | null = null;
  let callActive = false;
  let busy = false;
  let chain: Promise<void> = Promise.resolve();

  const ensureRecognition = () => {
    if (recognition) return recognition;
    const r = new Ctor();
    r.lang = 'zh-CN';
    r.continuous = true;
    r.interimResults = true;
    recognition = r;
    return r;
  };

  const startListening = () => {
    if (!callActive || busy) return;
    const r = ensureRecognition();
    try {
      r.start();
    } catch {
      /* already started */
    }
  };

  const stopListening = () => {
    const r = recognition;
    if (!r) return;
    try {
      r.stop();
    } catch {
      try {
        r.abort();
      } catch {
        /* ignore */
      }
    }
  };

  const enqueueUtterance = (raw: string) => {
    const t = raw.trim();
    if (!t || !callActive) return;
    useChatStore.getState().setSessionState('listening');

    chain = chain.then(async () => {
      if (!callActive) return;
      busy = true;
      stopListening();
      try {
        await sendChatMessage(t, 'call');
      } finally {
        busy = false;
        if (callActive) {
          startListening();
          await new Promise((r) => setTimeout(r, 100));
        }
      }
    });
  };

  const setupHandlers = () => {
    const r = ensureRecognition();

    r.onresult = (event: SpeechRecognitionEvent) => {
      if (!callActive) return;

      let chunk = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          chunk += event.results[i][0].transcript;
        }
      }
      const merged = chunk.trim();
      if (merged) enqueueUtterance(merged);
    };

    r.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (!callActive) return;
      if (event.error === 'aborted') return;
      if (event.error === 'no-speech') return;
      const msg =
        event.error === 'not-allowed'
          ? '麦克风或语音识别权限被拒绝。'
          : `语音识别：${event.error}`;
      options.onError?.(msg);
    };

    r.onend = () => {
      if (callActive && !busy) {
        startListening();
      }
    };
  };

  return {
    start: () => {
      callActive = true;
      busy = false;
      chain = Promise.resolve();
      setupHandlers();
      useChatStore.getState().setSessionState('listening');
      startListening();
    },

    stop: () => {
      callActive = false;
      busy = false;
      chain = Promise.resolve();
      stopListening();
      if (recognition) {
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
        try {
          recognition.abort();
        } catch {
          /* ignore */
        }
        recognition = null;
      }
      useChatStore.getState().setSessionState('idle');
    },

    isRunning: () => callActive,
  };
}
