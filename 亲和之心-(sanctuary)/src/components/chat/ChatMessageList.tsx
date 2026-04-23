import { useChatStore } from '../../store/useChatStore';
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export default function ChatMessageList() {
  const messages = useChatStore((state) => state.messages);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div 
      ref={scrollRef}
      className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 scroll-smooth"
    >
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-on-surface-variant/50 italic">
          开始与我聊天吧...
        </div>
      ) : (
        messages.map((msg) => (
          <motion.div 
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${
              msg.role === 'user'
                ? 'justify-end'
                : msg.role === 'system'
                  ? 'justify-center'
                  : 'justify-start'
            }`}
          >
            <div 
              className={`${
                msg.role === 'system' ? 'max-w-[96%]' : 'max-w-[92%]'
              } p-3.5 sm:p-4 rounded-2xl ${
                msg.role === 'user'
                  ? 'bg-primary-container text-on-primary-container rounded-tr-sm'
                  : msg.role === 'assistant'
                    ? 'bg-surface-container-high text-on-surface rounded-tl-sm'
                    : 'bg-secondary-container/60 text-on-secondary-container text-center'
              } shadow-sm`}
            >
              <p className={`${msg.role === 'system' ? 'text-xs' : 'text-sm'} leading-relaxed`}>
                {msg.content}
              </p>
              <p className="text-[11px] mt-2 opacity-60">
                {new Date(msg.timestamp).toLocaleTimeString('zh-CN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </motion.div>
        ))
      )}
    </div>
  );
}
