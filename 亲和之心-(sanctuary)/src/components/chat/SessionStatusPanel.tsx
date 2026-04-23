import { useChatStore } from '../../store/useChatStore';
import { useState, useEffect } from 'react';
import { Activity, X } from 'lucide-react';

function statusColor(sessionState: string) {
  switch (sessionState) {
    case 'idle':
      return 'bg-surface-container-high text-on-surface-variant';
    case 'listening':
      return 'bg-primary-container text-on-primary-container';
    case 'processing':
      return 'bg-secondary-container text-on-secondary-container';
    case 'speaking':
      return 'bg-tertiary-container text-on-tertiary-container';
    case 'reassessing':
      return 'bg-error-container text-on-error-container';
    case 'error':
      return 'bg-error text-on-error';
    default:
      return 'bg-surface-container-high text-on-surface-variant';
  }
}

function statusText(sessionState: string, kbScan: boolean) {
  if (sessionState === 'processing' && kbScan) return '检索知识库';
  switch (sessionState) {
    case 'idle':
      return '等待中';
    case 'listening':
      return '倾听中';
    case 'processing':
      return '思考中';
    case 'speaking':
      return '说话中';
    case 'reassessing':
      return '复评中';
    case 'error':
      return '出错';
    default:
      return '未知';
  }
}

function statusDetail(sessionState: string, kbScan: boolean) {
  if (sessionState === 'processing' && kbScan) {
    return '心理导师模式：正在匹配心理学知识库条目并生成回答。';
  }
  switch (sessionState) {
    case 'idle':
      return '等待您输入或语音。';
    case 'listening':
      return '正在采集语音，请说话。';
    case 'processing':
      return '正在理解您的内容并生成回复。';
    case 'speaking':
      return '正在语音播报并同步口型。';
    case 'reassessing':
      return '根据对话正在重新评估风险与策略。';
    case 'error':
      return '上一步出现问题，可尝试重试或检查网络。';
    default:
      return '';
  }
}

export default function SessionStatusPanel() {
  const [open, setOpen] = useState(false);
  const sessionState = useChatStore((state) => state.sessionState);
  const kbScanActive = useChatStore((state) => state.kbScanActive);
  const risk = useChatStore((state) => state.risk);
  const lastError = useChatStore((state) => state.lastError);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const pulse =
    sessionState === 'listening' || sessionState === 'processing' ? 'animate-pulse' : '';

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="查看会话状态与风险评估"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 pl-3 pr-3 py-2 rounded-full border border-outline-variant/20 shadow-sm text-sm font-semibold transition-transform active:scale-[0.98] ${statusColor(sessionState)} ${pulse}`}
      >
        <Activity size={18} strokeWidth={2.2} className="shrink-0 opacity-90" />
        <span className="max-w-[7rem] truncate">{statusText(sessionState, kbScanActive)}</span>
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${sessionState === 'error' ? 'bg-current' : 'bg-current opacity-80'}`}
        />
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[60] bg-black/25"
            aria-label="关闭"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="session-status-title"
            className="fixed z-[70] right-4 top-[max(5.5rem,env(safe-area-inset-top,0px)+4.5rem)] w-[min(22rem,calc(100vw-2rem))] max-h-[min(78vh,32rem)] overflow-y-auto rounded-2xl border border-outline-variant/15 bg-surface-container-lowest shadow-xl"
          >
            <div className="sticky top-0 flex items-center justify-between gap-2 px-4 py-3 border-b border-outline-variant/10 bg-surface-container-lowest/95 backdrop-blur-md">
              <h3 id="session-status-title" className="text-base font-bold text-on-surface">
                会话状态
              </h3>
              <button
                type="button"
                aria-label="关闭"
                onClick={() => setOpen(false)}
                className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-low"
              >
                <X size={20} strokeWidth={2.2} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div
                className={`flex flex-col gap-2 px-4 py-3 rounded-xl transition-colors duration-300 ${statusColor(sessionState)}`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-current opacity-80 shrink-0" />
                  <span className="font-semibold">{statusText(sessionState, kbScanActive)}</span>
                </div>
                <p className="text-sm opacity-90 leading-snug pl-4 border-l-2 border-current/30">
                  {statusDetail(sessionState, kbScanActive)}
                </p>
              </div>

              {lastError && (
                <div className="px-3 py-2 rounded-xl bg-error-container text-on-error-container text-sm">
                  {lastError}
                </div>
              )}

              <div className="space-y-3 pt-1">
                <p className="text-sm font-medium text-on-surface-variant">风险评估</p>
                {[
                  { label: '焦虑', value: risk.anxiety },
                  { label: '抑郁', value: risk.depression },
                  { label: '双相', value: risk.bipolar },
                ].map((item) => (
                  <div key={item.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-on-surface-variant">
                      <span>{item.label}</span>
                      <span>{item.value}</span>
                    </div>
                    <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-outline/80">综合等级</span>
                  <span className="font-semibold text-on-surface">
                    {risk.level === 'low' ? '低风险' : risk.level === 'medium' ? '中风险' : '高风险'}
                  </span>
                </div>
                {risk.reassessTriggered && (
                  <p className="text-xs text-primary">已触发复评，干预策略已更新。</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
