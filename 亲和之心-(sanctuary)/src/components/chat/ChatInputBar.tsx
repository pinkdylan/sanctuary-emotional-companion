import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../../store/useChatStore';
import VoiceInputButton from './VoiceInputButton';
import { SendHorizontal, Phone, PhoneOff, Sparkles } from 'lucide-react';
import { sendChatMessage } from '../../lib/sendChatMessage';
import { createVoiceCallController, isVoiceCallSupported } from '../../lib/voiceCallController';

export default function ChatInputBar() {
  const [text, setText] = useState('');
  const [callOn, setCallOn] = useState(false);
  const callRef = useRef<ReturnType<typeof createVoiceCallController> | null>(null);
  const setError = useChatStore((s) => s.setError);
  const clearError = useChatStore((s) => s.clearError);
  const sessionState = useChatStore((s) => s.sessionState);
  const mentorBusy =
    sessionState === 'processing' || sessionState === 'reassessing' || sessionState === 'speaking';

  useEffect(() => {
    return () => {
      callRef.current?.stop();
      callRef.current = null;
    };
  }, []);

  const handleSend = async () => {
    if (!text.trim()) return;
    const t = text.trim();
    setText('');
    if (callOn) {
      callRef.current?.stop();
      callRef.current = null;
      setCallOn(false);
    }
    await sendChatMessage(t, 'text');
  };

  const handleMentorSend = async () => {
    if (callOn || mentorBusy) return;
    const typed = text.trim();
    if (typed) {
      setText('');
      await sendChatMessage(typed, 'text', { psychologyMentor: true });
      return;
    }
    await sendChatMessage('', 'text', { psychologyMentor: true, mentorFollowUp: true });
  };

  const toggleCall = () => {
    if (callOn) {
      callRef.current?.stop();
      callRef.current = null;
      setCallOn(false);
      return;
    }
    if (!isVoiceCallSupported()) {
      setError('电话模式需要浏览器语音识别（建议 Chrome / Edge 桌面端，HTTPS 或 localhost）。');
      setTimeout(() => useChatStore.getState().clearError(), 4000);
      return;
    }
    const c = createVoiceCallController({
      onError: (msg) => {
        setError(msg);
        setTimeout(() => useChatStore.getState().clearError(), 4000);
      },
    });
    c.start();
    callRef.current = c;
    setCallOn(true);
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <button
        type="button"
        onClick={() => void handleMentorSend()}
        disabled={callOn || mentorBusy}
        aria-disabled={callOn || mentorBusy}
        title={
          mentorBusy
            ? '助手正在处理或播报，请稍候'
            : '有字时：一并发送并走心理导师；无字时：基于您上一轮发言再分析'
        }
        className={`w-full min-h-11 py-2.5 px-2 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-sm font-semibold shadow-sm border transition-all active:scale-[0.99] ${
          callOn || mentorBusy
            ? 'opacity-40 border-outline-variant/20 bg-surface-container-high text-on-surface-variant cursor-not-allowed'
            : 'bg-secondary-container/90 text-on-secondary-container border-secondary/15 hover:opacity-95'
        }`}
      >
        <span className="flex items-center gap-2">
          <Sparkles size={18} strokeWidth={2.3} className="shrink-0" />
          心理导师
        </span>
        <span className="text-[11px] sm:text-xs font-medium opacity-90 text-center leading-tight">
          输入完可发；发完后空框再点 = 基于上一轮深入分析
        </span>
      </button>
      {callOn && (
        <p className="text-center text-[11px] sm:text-xs text-on-surface-variant px-1 leading-snug">
          电话模式：说完一句后<strong className="text-on-surface">稍停</strong>
          ，会自动识别并回复；助手播报时会暂时不听，避免打断。
        </p>
      )}
      <div className="flex items-center gap-2 sm:gap-3 w-full p-3 sm:p-4 bg-surface-container-lowest/90 backdrop-blur-md rounded-2xl shadow-[0_8px_24px_rgba(47,58,58,0.06)] border border-outline-variant/10">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={callOn ? '打字发送会先结束电话，避免与播报串音…' : '输入您想说的话…'}
          className="flex-1 min-w-0 h-12 sm:h-14 px-4 sm:px-6 bg-surface-container-low border-none rounded-xl text-on-surface text-sm sm:text-base placeholder:text-outline/50 focus:ring-2 focus:ring-primary-container transition-all duration-300 outline-none"
        />

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={toggleCall}
            aria-label={callOn ? '结束电话' : '开始电话'}
            aria-pressed={callOn}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-all ${
              callOn
                ? 'bg-error text-on-error ring-2 ring-error/30'
                : 'bg-tertiary-container text-on-tertiary-container hover:opacity-90'
            }`}
          >
            {callOn ? <PhoneOff size={22} strokeWidth={2.3} /> : <Phone size={22} strokeWidth={2.3} />}
          </button>
          <VoiceInputButton disabled={callOn} />
          <button
            type="button"
            onClick={() => void handleSend()}
            aria-label="发送消息"
            disabled={!text.trim()}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-all duration-300 disabled:opacity-40"
          >
            <SendHorizontal size={20} strokeWidth={2.4} />
          </button>
        </div>
      </div>
    </div>
  );
}
