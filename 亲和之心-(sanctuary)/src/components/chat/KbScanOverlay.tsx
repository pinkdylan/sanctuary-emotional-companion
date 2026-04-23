import { AnimatePresence, motion } from 'framer-motion';
import { useChatStore } from '../../store/useChatStore';
import { BookOpen, Sparkles } from 'lucide-react';

/**
 * 心理导师：弹窗式「知识库扫描」动效（网格 + 双向扫描线 + 入场弹簧动画）
 */
export default function KbScanOverlay() {
  const kbScanActive = useChatStore((s) => s.kbScanActive);

  return (
    <AnimatePresence>
      {kbScanActive && (
        <motion.div
          key="kb-scan-root"
          role="dialog"
          aria-modal="true"
          aria-labelledby="kb-scan-title"
          aria-describedby="kb-scan-desc"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[68] flex items-center justify-center px-4 sm:px-6 bg-black/45 backdrop-blur-[3px]"
        >
          {/* 弹窗主体 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 28 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16, transition: { duration: 0.18 } }}
            transition={{
              type: 'spring',
              damping: 26,
              stiffness: 320,
              mass: 0.85,
            }}
            className="w-full max-w-[min(22rem,calc(100vw-2rem))] rounded-[1.35rem] border border-primary/25 bg-surface-container-lowest shadow-[0_24px_48px_rgba(15,23,42,0.18),0_0_0_1px_rgba(255,255,255,0.06)_inset] overflow-hidden"
          >
            {/* 顶部装饰条 */}
            <div className="h-1 w-full bg-gradient-to-r from-transparent via-primary to-transparent opacity-80" />

            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex items-start gap-3">
                <motion.div
                  className="shrink-0 w-12 h-12 rounded-2xl bg-primary-container flex items-center justify-center text-on-primary-container shadow-md"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <BookOpen size={24} strokeWidth={2.2} />
                </motion.div>
                <div className="min-w-0 pt-0.5">
                  <p
                    id="kb-scan-title"
                    className="text-lg font-bold text-on-surface flex items-center gap-2 flex-wrap"
                  >
                    心理导师
                    <Sparkles className="text-primary shrink-0" size={18} strokeWidth={2.4} />
                  </p>
                  <p id="kb-scan-desc" className="text-sm text-on-surface-variant mt-1 leading-snug">
                    正在扫描心理学知识库并匹配条目…
                  </p>
                </div>
              </div>

              {/* 扫描视窗：网格 + 横线扫描 + 竖向光带 */}
              <div className="relative h-[7.5rem] sm:h-[8.25rem] rounded-xl overflow-hidden border border-outline-variant/20 bg-surface-container-high/90 shadow-inner">
                {/* 底图网格 */}
                <div
                  className="absolute inset-0 opacity-[0.45] pointer-events-none"
                  style={{
                    backgroundImage: `
                      linear-gradient(rgba(47, 99, 115, 0.12) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(47, 99, 115, 0.12) 1px, transparent 1px)
                    `,
                    backgroundSize: '18px 18px',
                  }}
                />
                {/* 微弱脉冲底光 */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 pointer-events-none"
                  animate={{ opacity: [0.5, 0.85, 0.5] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                />

                {/* 四角「取景框」 */}
                <div className="absolute inset-2 pointer-events-none">
                  <span className="absolute left-0 top-0 w-5 h-5 border-l-2 border-t-2 border-primary/55 rounded-tl-md" />
                  <span className="absolute right-0 top-0 w-5 h-5 border-r-2 border-t-2 border-primary/55 rounded-tr-md" />
                  <span className="absolute left-0 bottom-0 w-5 h-5 border-l-2 border-b-2 border-primary/55 rounded-bl-md" />
                  <span className="absolute right-0 bottom-0 w-5 h-5 border-r-2 border-b-2 border-primary/55 rounded-br-md" />
                </div>

                {/* 横向扫描线（激光条上下扫） */}
                <motion.div
                  className="absolute left-3 right-3 h-[3px] rounded-full pointer-events-none"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent 0%, rgba(38,105,95,0.2) 22%, rgba(38,105,95,0.95) 50%, rgba(38,105,95,0.2) 78%, transparent 100%)',
                    boxShadow: '0 0 14px 2px rgba(38, 105, 95, 0.35)',
                  }}
                  initial={{ top: '12%' }}
                  animate={{ top: ['12%', '88%', '12%'] }}
                  transition={{ duration: 2.35, repeat: Infinity, ease: 'linear' }}
                />

                {/* 竖向光带左右扫 */}
                <motion.div
                  className="absolute top-2 bottom-2 w-[28%] max-w-[7rem] pointer-events-none rounded-md opacity-70"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent, rgba(38,105,95,0.28), transparent)',
                  }}
                  initial={{ left: '-5%' }}
                  animate={{ left: ['-5%', '85%', '-5%'] }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: 'linear' }}
                />

                {/* 中心状态文案 */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none">
                  <motion.div
                    className="flex gap-1"
                    aria-hidden
                  >
                    {[0, 1, 2, 3, 4].map((i) => (
                      <motion.span
                        key={i}
                        className="w-1.5 rounded-full bg-primary"
                        animate={{ height: [5, 16, 5], opacity: [0.35, 1, 0.35] }}
                        transition={{
                          duration: 0.85,
                          repeat: Infinity,
                          delay: i * 0.1,
                          ease: 'easeInOut',
                        }}
                        style={{ height: 8 }}
                      />
                    ))}
                  </motion.div>
                  <p className="text-[11px] sm:text-xs font-medium text-on-surface-variant tracking-wide">
                    SCANNING KNOWLEDGE BASE
                  </p>
                </div>
              </div>

              <p className="text-xs text-center text-on-surface-variant/90 leading-relaxed px-1">
                匹配关键词与条目后，将结合大模型生成回复，请稍候
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
