import { useEffect, useMemo, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { useHomeStore, formatLocalYmd, type DailySummaryEntry } from '../../store/useHomeStore';
import { WEEK_LABELS_MON_FIRST, daysInMonth, startWeekdayMon0 } from './homeCalendarUtils';

export default function HomeCalendarModule({ className = '' }: { className?: string }) {
  const hydrate = useHomeStore((s) => s.hydrate);
  const dailySummaries = useHomeStore((s) => s.dailySummaries);

  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());
  const [pickedYmd, setPickedYmd] = useState(() => formatLocalYmd(new Date()));

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const grid = useMemo(() => {
    const total = daysInMonth(viewYear, viewMonth);
    const pad = startWeekdayMon0(viewYear, viewMonth);
    const cells: ({ day: number } | null)[] = [];
    for (let i = 0; i < pad; i++) cells.push(null);
    for (let d = 1; d <= total; d++) cells.push({ day: d });
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewYear, viewMonth]);

  const ymdAt = (day: number) =>
    `${viewYear}-${`${viewMonth + 1}`.padStart(2, '0')}-${`${day}`.padStart(2, '0')}`;

  const pickedEntry: DailySummaryEntry | null = pickedYmd
    ? dailySummaries[pickedYmd] ?? null
    : null;

  return (
    <section
      className={`rounded-[1.25rem] border border-outline-variant/10 bg-surface-container-lowest shadow-sm overflow-hidden ${className}`}
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-outline-variant/10 bg-surface-container-low/40">
        <CalendarDays size={22} strokeWidth={2.2} className="text-primary shrink-0" />
        <h2 className="text-base font-bold text-on-surface">聊天日历</h2>
        <p className="text-xs text-on-surface-variant ml-auto hidden sm:block">有圆点表示当日已记小结</p>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            className="px-3 py-2 rounded-xl bg-surface-container-low text-on-surface text-lg font-medium"
            aria-label="上一月"
            onClick={() => {
              if (viewMonth === 0) {
                setViewMonth(11);
                setViewYear((y) => y - 1);
              } else setViewMonth((m) => m - 1);
            }}
          >
            ‹
          </button>
          <p className="font-bold text-on-surface">
            {viewYear} 年 {viewMonth + 1} 月
          </p>
          <button
            type="button"
            className="px-3 py-2 rounded-xl bg-surface-container-low text-on-surface text-lg font-medium"
            aria-label="下一月"
            onClick={() => {
              if (viewMonth === 11) {
                setViewMonth(0);
                setViewYear((y) => y + 1);
              } else setViewMonth((m) => m + 1);
            }}
          >
            ›
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-on-surface-variant font-semibold">
          {WEEK_LABELS_MON_FIRST.map((w) => (
            <div key={w} className="py-1">
              {w}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {grid.map((cell, i) => {
            if (!cell) {
              return <div key={`e-${i}`} className="aspect-square" />;
            }
            const ymd = ymdAt(cell.day);
            const has = !!dailySummaries[ymd];
            const isToday = ymd === formatLocalYmd(new Date());
            const selected = pickedYmd === ymd;
            return (
              <button
                key={ymd}
                type="button"
                onClick={() => setPickedYmd(ymd)}
                className={`aspect-square rounded-xl text-sm font-semibold relative flex items-center justify-center transition-colors min-h-[2.5rem] ${
                  selected
                    ? 'bg-primary-container text-on-primary-container ring-2 ring-primary/35'
                    : isToday
                      ? 'bg-primary-container/30 text-on-surface'
                      : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high'
                }`}
              >
                {cell.day}
                {has && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border border-outline-variant/12 bg-surface-container-low/60 p-4 space-y-2 min-h-[108px]">
          <p className="text-xs text-on-surface-variant font-medium">
            {pickedYmd} 的聊天小结
          </p>
          {pickedEntry ? (
            <>
              {pickedEntry.topic && (
                <p className="text-sm font-semibold text-on-surface">话题：{pickedEntry.topic}</p>
              )}
              {pickedEntry.duration && (
                <p className="text-xs text-on-surface-variant">时长：{pickedEntry.duration}</p>
              )}
              <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">
                {pickedEntry.summary}
              </p>
              <p className="text-[11px] text-on-surface-variant">
                记录时间：{new Date(pickedEntry.recordedAt).toLocaleString('zh-CN')}
              </p>
            </>
          ) : (
            <p className="text-sm text-on-surface-variant leading-relaxed">
              当日暂无记录。通过底部「总结」查看会话总结后，会自动记在这里。
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
