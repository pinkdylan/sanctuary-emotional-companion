import { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { History } from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';

export default function SummaryCard() {
  const [summary, setSummary] = useState<any>(null);
  const sessionId = useChatStore((state) => state.sessionId);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await axios.post('/api/session/summary', { sessionId });
        setSummary(res.data);
      } catch (e1) {
        try {
          const fallback = await axios.get('/api/session/summary');
          setSummary(fallback.data);
        } catch (e2) {
          console.error(e1, e2);
        }
      }
    };
    fetchSummary();
  }, [sessionId]);

  if (!summary) return <div className="p-6 bg-surface-container-low rounded-[2rem] shadow-sm animate-pulse h-48"></div>;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface-container-lowest rounded-xl p-8 shadow-[0_8px_24px_rgba(47,58,58,0.06)] relative overflow-hidden"
    >
      <div className="relative z-10">
        <div className="text-primary mb-4">
          <History size={34} strokeWidth={2.3} />
        </div>
        <p className="text-2xl font-medium leading-relaxed text-on-surface">
          “我们聊了{summary.duration}，关于您的{summary.topic}。”
        </p>
        <p className="mt-6 text-on-surface-variant leading-relaxed">
          {summary.insight}
        </p>
      </div>
      <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-tertiary-container/10 rounded-full blur-3xl"></div>
    </motion.div>
  );
}
