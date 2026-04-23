import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReactECharts from 'echarts-for-react';
import BottomNav from '../components/BottomNav';
import { useChatStore } from '../store/useChatStore';
import { useHomeStore, formatLocalYmd } from '../store/useHomeStore';
import { MessageSquarePlus, Copy, History, TrendingDown, Wind, Music2, SunMedium } from 'lucide-react';

export default function Summary() {
  const [summary, setSummary] = useState<any>(null);
  const navigate = useNavigate();
  const sessionId = useChatStore((state) => state.sessionId);
  const liveRisk = useChatStore((state) => state.risk);
  const liveRiskTrend = useChatStore((state) => state.riskTrend);

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

  useEffect(() => {
    if (!summary) return;
    useHomeStore.getState().hydrate();
    const ymd = formatLocalYmd(new Date());
    const lines = [
      typeof summary.insight === 'string' ? summary.insight : '',
      summary.topic ? `主要话题：${summary.topic}` : '',
      summary.duration ? `会话时长：${summary.duration}` : '',
    ].filter(Boolean);
    const text = lines.length > 0 ? lines.join('\n') : '已生成本次会话总结';
    useHomeStore.getState().recordDailySummary(ymd, {
      summary: text,
      topic: summary.topic,
      duration: summary.duration,
    });
  }, [summary]);

  if (!summary) return <div className="min-h-screen bg-surface flex items-center justify-center">正在加载总结...</div>;

  const anxietySeries =
    summary?.riskTrend?.anxiety ||
    summary?.anxietyTrend ||
    liveRiskTrend.anxiety;

  const chartOption = {
    grid: { left: 0, right: 0, top: 20, bottom: 0 },
    xAxis: {
      type: 'category',
      show: false,
      data: anxietySeries.map((_: number, i: number) => `${i + 1}`),
    },
    yAxis: { type: 'value', show: false },
    series: [
      {
        data: anxietySeries,
        type: 'bar',
        itemStyle: { color: '#6fafa4', borderRadius: [8, 8, 0, 0] },
        barWidth: '60%',
        label: { show: true, position: 'top', formatter: '{c}', color: '#26695f' }
      }
    ]
  };

  const handleCopy = async () => {
    const content = [
      `会话时长：${summary.duration}`,
      `主要话题：${summary.topic}`,
      `洞察：${summary.insight}`,
      '建议：',
      ...(summary.suggestions || []).map((s: any) => `- ${s.title}：${s.desc}`),
    ].join('\n');
    try {
      await navigator.clipboard.writeText(content);
    } catch (e) {
      console.error(e);
    }
  };

  const getSuggestionIcon = (iconName?: string) => {
    switch (iconName) {
      case 'air':
        return <Wind size={26} strokeWidth={2.3} className="text-primary" />;
      case 'music_note':
        return <Music2 size={26} strokeWidth={2.3} className="text-primary" />;
      case 'wb_sunny':
        return <SunMedium size={26} strokeWidth={2.3} className="text-primary" />;
      default:
        return <SunMedium size={26} strokeWidth={2.3} className="text-primary" />;
    }
  };

  return (
    <div className="text-on-surface antialiased pb-32 bg-surface min-h-screen">
      <main className="max-w-md mx-auto px-4 pt-6 space-y-6">
        <section className="space-y-2">
          <h2 className="text-3xl font-bold leading-tight text-on-surface tracking-tight">会话总结</h2>
          <p className="text-on-surface-variant text-base">对我们近期交谈的一份温和回顾。</p>
        </section>

        <div className="grid grid-cols-1 gap-4">
          {/* Summary Card */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_8px_24px_rgba(47,58,58,0.06)] relative overflow-hidden">
            <div className="relative z-10">
              <div className="text-primary mb-4">
                <History size={34} strokeWidth={2.3} />
              </div>
              <p className="text-xl font-medium leading-relaxed text-on-surface">
                “我们聊了{summary.duration}，关于您的{summary.topic}。”
              </p>
              <p className="mt-6 text-on-surface-variant leading-relaxed">
                {summary.insight}
              </p>
            </div>
            <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-tertiary-container/10 rounded-full blur-3xl"></div>
          </div>

          {/* Well-being Indicator */}
          <div className="bg-surface-container-low rounded-xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-on-surface-variant mb-6">心境状态</h3>
              <div className="h-32 mb-4">
                 <ReactECharts option={chartOption} style={{ height: '100%', width: '100%' }} />
              </div>
            </div>
            <div className="flex items-center gap-3 text-primary">
              <TrendingDown size={28} strokeWidth={2.3} />
              <span className="text-base font-semibold">
                当前综合等级：{liveRisk.level === 'low' ? '低风险' : liveRisk.level === 'medium' ? '中风险' : '高风险'}
              </span>
            </div>
          </div>

          {/* Advice List */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-on-surface px-1">今日暖心建议</h3>
            <div className="grid grid-cols-1 gap-4">
              {summary.suggestions.map((advice: any) => (
                <div key={advice.id} className="bg-surface-container-low p-6 rounded-xl flex flex-col items-start gap-3 hover:bg-surface-container transition-colors group">
                  <div className="w-14 h-14 rounded-full bg-primary-fixed flex items-center justify-center group-hover:scale-110 transition-transform">
                    {getSuggestionIcon(advice.icon)}
                  </div>
                  <p className="text-lg font-bold text-on-surface">{advice.title}</p>
                  <p className="text-on-surface-variant">{advice.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Large Action Buttons */}
        <section className="flex flex-col gap-4 pt-2">
          <button 
            onClick={() => navigate('/session')}
            aria-label="开始新聊天"
            className="flex-1 h-14 rounded-xl signature-gradient text-on-primary flex items-center justify-center hover:opacity-90 active:scale-95 transition-all shadow-lg"
          >
            <MessageSquarePlus size={28} strokeWidth={2.4} />
          </button>
          <button
            onClick={handleCopy}
            aria-label="复制总结"
            className="flex-1 h-14 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center hover:bg-secondary-fixed-dim active:scale-95 transition-all"
          >
            <Copy size={28} strokeWidth={2.4} />
          </button>
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
