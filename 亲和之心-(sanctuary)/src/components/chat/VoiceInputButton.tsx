import { useState, useRef } from 'react';
import axios from 'axios';
import { useChatStore } from '../../store/useChatStore';
import { Mic, Square } from 'lucide-react';
import { sendChatMessage } from '../../lib/sendChatMessage';

export default function VoiceInputButton({ disabled = false }: { disabled?: boolean }) {
  const { setSessionState, setError } = useChatStore();
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const toggleRecording = async () => {
    if (disabled) return;

    if (isRecording) {
      setIsRecording(false);
      setSessionState('processing');
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }

      try {
        useChatStore.getState().clearError();
        const asrRes = await axios.post('/api/asr/recognize', {
          sessionId: useChatStore.getState().sessionId,
        });
        const text = asrRes.data.text as string;
        await sendChatMessage(text, 'voice');
      } catch {
        setSessionState('error');
        setError('语音处理失败，请重试或改用文字输入。');
        setTimeout(() => setSessionState('idle'), 2000);
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        mediaRecorderRef.current.start();
        setIsRecording(true);
        setSessionState('listening');
      } catch (err) {
        console.error('Microphone access denied', err);
        setSessionState('error');
        setError('麦克风权限未开启，已切换为文字输入。');
        setTimeout(() => setSessionState('idle'), 1200);
      }
    }
  };

  return (
    <div className="relative flex items-center justify-center">
      {isRecording && (
        <div className="absolute inset-0 bg-primary/20 rounded-full breath-animation" />
      )}
      <button
        type="button"
        onClick={toggleRecording}
        disabled={disabled}
        aria-label={isRecording ? '结束语音输入' : '开始语音输入'}
        className={`relative z-10 w-14 h-14 sm:w-[4.25rem] sm:h-[4.25rem] rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform duration-150 ${
          disabled
            ? 'bg-surface-container-highest text-outline opacity-50 cursor-not-allowed'
            : isRecording
              ? 'bg-error text-on-error'
              : 'bg-gradient-to-br from-primary to-primary-container text-on-primary'
        }`}
      >
        {isRecording ? <Square size={26} strokeWidth={2.4} /> : <Mic size={26} strokeWidth={2.4} />}
      </button>
    </div>
  );
}
