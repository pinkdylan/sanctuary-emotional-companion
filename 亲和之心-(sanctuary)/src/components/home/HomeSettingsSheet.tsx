import { useEffect, useRef, useState } from 'react';
import { X, User, IdCard, ImagePlus, RotateCcw } from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';
import { useHomeStore } from '../../store/useHomeStore';

type Tab = 'profile' | 'account';

export default function HomeSettingsSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>('profile');
  const fileRef = useRef<HTMLInputElement>(null);

  const hydrate = useHomeStore((s) => s.hydrate);
  const moodImageSrc = useHomeStore((s) => s.moodImageSrc);
  const setMoodFromFile = useHomeStore((s) => s.setMoodImageFromFile);
  const resetMoodImage = useHomeStore((s) => s.resetMoodImage);
  const deviceUserId = useHomeStore((s) => s.deviceUserId);

  const storeNickname = useChatStore((s) => s.nickname);
  const setNickname = useChatStore((s) => s.setNickname);
  const sessionId = useChatStore((s) => s.sessionId);
  const [nickInput, setNickInput] = useState(storeNickname || '王奶奶');

  useEffect(() => {
    if (open) hydrate();
  }, [open, hydrate]);

  useEffect(() => {
    setNickInput(storeNickname || '王奶奶');
  }, [storeNickname, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) setTab('profile');
  }, [open]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[80] bg-black/40"
        aria-label="关闭设置"
        onClick={onClose}
      />
      <div
        className="fixed inset-0 z-[90] flex items-center justify-center p-4 pointer-events-none"
        role="presentation"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="home-settings-title"
          className="pointer-events-auto w-full max-w-md max-h-[min(85vh,640px)] flex flex-col rounded-3xl bg-surface border border-outline-variant/15 shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
            <h2 id="home-settings-title" className="text-lg font-bold text-on-surface">
              设置
            </h2>
            <button
              type="button"
              aria-label="关闭"
              onClick={onClose}
              className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-low"
            >
              <X size={22} strokeWidth={2.2} />
            </button>
          </div>

          <div className="flex px-3 pb-2 gap-2 shrink-0 border-b border-outline-variant/10">
            {(
              [
                { id: 'profile' as const, label: '个人信息', Icon: User },
                { id: 'account' as const, label: '账号信息', Icon: IdCard },
              ] as const
            ).map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  tab === id
                    ? 'bg-primary-container/45 text-on-surface'
                    : 'text-on-surface-variant hover:bg-surface-container-low'
                }`}
              >
                <Icon size={18} strokeWidth={2.2} />
                {label}
              </button>
            ))}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
            {tab === 'profile' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm text-on-surface-variant">昵称（怎么称呼您）</label>
                  <input
                    value={nickInput}
                    onChange={(e) => setNickInput(e.target.value)}
                    onBlur={() => setNickname(nickInput.trim() || '王奶奶')}
                    className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant/25 outline-none focus:ring-2 focus:ring-primary-container"
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-on-surface-variant">今日心情配图</p>
                  <p className="text-xs text-on-surface-variant/80 leading-relaxed">
                    可更换为自己喜欢的照片；默认为「喝奶茶、玩电脑游戏」温馨日常图。
                  </p>
                  <div className="flex gap-3 items-center">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden border border-outline-variant/20 shrink-0 shadow-sm">
                      <img
                        src={moodImageSrc}
                        alt="今日心情配图预览"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col gap-2 flex-1">
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) setMoodFromFile(f);
                          e.target.value = '';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="h-11 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center gap-2 text-sm font-semibold"
                      >
                        <ImagePlus size={18} strokeWidth={2.2} />
                        从相册选择
                      </button>
                      <button
                        type="button"
                        onClick={() => resetMoodImage()}
                        className="h-10 rounded-xl bg-surface-container-low text-on-surface-variant text-sm flex items-center justify-center gap-2"
                      >
                        <RotateCcw size={16} strokeWidth={2.2} />
                        恢复默认配图
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {tab === 'account' && (
              <div className="space-y-4 text-sm">
                <div className="p-4 rounded-2xl bg-surface-container-low space-y-2">
                  <p className="text-xs text-on-surface-variant uppercase tracking-wide">本机用户标识</p>
                  <p className="font-mono text-xs break-all text-on-surface">{deviceUserId}</p>
                </div>
                <div className="p-4 rounded-2xl bg-surface-container-low space-y-2">
                  <p className="text-xs text-on-surface-variant">当前会话 ID</p>
                  <p className="font-mono text-xs break-all text-on-surface">{sessionId}</p>
                </div>
                <div className="p-4 rounded-2xl bg-surface-container-low space-y-1">
                  <p className="text-xs text-on-surface-variant">登录方式</p>
                  <p className="text-on-surface font-medium">本地体验模式</p>
                  <p className="text-xs text-on-surface-variant leading-relaxed pt-1">
                    昵称与心情图保存在本机浏览器；更换设备或清除站点数据后需重新设置。
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-surface-container-low space-y-1">
                  <p className="text-xs text-on-surface-variant">安全令牌</p>
                  <p className="font-mono tracking-widest text-on-surface">••••••••（演示环境未启用）</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
