import { useChatStore } from '../store/useChatStore';
import AvatarStage from '../components/chat/AvatarStage';
import ChatMessageList from '../components/chat/ChatMessageList';
import ChatInputBar from '../components/chat/ChatInputBar';
import SessionStatusPanel from '../components/chat/SessionStatusPanel';
import KbScanOverlay from '../components/chat/KbScanOverlay';
import BottomNav from '../components/BottomNav';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CirclePause, RotateCcw, Flag } from 'lucide-react';

export default function Session() {
  const navigate = useNavigate();
  const [confirmEndOpen, setConfirmEndOpen] = useState(false);
  const nickname = useChatStore((state) => state.nickname);
  const setSessionState = useChatStore((state) => state.setSessionState);
  const clearError = useChatStore((state) => state.clearError);

  return (
    <div className="min-h-screen bg-surface flex flex-col overflow-hidden">
      <main className="flex-1 flex flex-col min-h-0 pt-4 pb-36 px-3 sm:px-4 max-w-md mx-auto w-full">
        <header className="shrink-0 flex items-start justify-between gap-3 pb-2">
          <div className="min-w-0 flex-1 space-y-0.5">
            <h2 className="text-xl sm:text-2xl font-bold text-on-surface leading-tight">
              您好，{nickname || '朋友'}
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant leading-snug">
              我会一直在这里陪您慢慢聊。
            </p>
          </div>
          <SessionStatusPanel />
        </header>

        <section className="flex-1 flex flex-col min-h-0 rounded-[1.25rem] overflow-hidden border border-outline-variant/10 bg-surface-container-lowest shadow-sm">
          <div className="shrink-0 h-[min(46vh,440px)] min-h-[260px] sm:min-h-[280px]">
            <AvatarStage />
          </div>
          <div className="flex-1 min-h-0 flex flex-col bg-surface-container-low/50 backdrop-blur-sm border-t border-outline-variant/10">
            <ChatMessageList />
          </div>
        </section>

        <div className="shrink-0 grid grid-cols-3 gap-2 pt-2.5">
          <button
            aria-label="暂停播报"
            onClick={() => setSessionState('idle')}
            className="h-12 rounded-xl bg-surface-container-low text-on-surface flex items-center justify-center"
          >
            <CirclePause size={22} strokeWidth={2.3} />
          </button>
          <button
            aria-label="重试恢复"
            onClick={() => {
              clearError();
              setSessionState('idle');
            }}
            className="h-12 rounded-xl bg-surface-container-low text-on-surface flex items-center justify-center"
          >
            <RotateCcw size={20} strokeWidth={2.3} />
          </button>
          <button
            aria-label="结束会话"
            onClick={() => setConfirmEndOpen(true)}
            className="h-12 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center"
          >
            <Flag size={20} strokeWidth={2.3} />
          </button>
        </div>
      </main>

      <div className="fixed bottom-24 left-0 right-0 px-3 sm:px-4 z-[60]">
        <div className="max-w-md mx-auto">
          <ChatInputBar />
        </div>
      </div>

      <BottomNav />

      <KbScanOverlay />

      {confirmEndOpen && (
        <div className="fixed inset-0 z-[70] bg-black/30 flex items-end">
          <div className="w-full max-w-md mx-auto bg-surface rounded-t-3xl p-5 space-y-4">
            <p className="text-lg font-semibold text-on-surface">确认结束本次会话？</p>
            <p className="text-sm text-on-surface-variant">结束后将生成本次会话总结。</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setConfirmEndOpen(false)}
                className="h-12 rounded-xl bg-surface-container-low text-on-surface"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setConfirmEndOpen(false);
                  setSessionState('idle');
                  navigate('/summary');
                }}
                className="h-12 rounded-xl signature-gradient text-on-primary"
              >
                结束会话
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
