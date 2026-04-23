import { useChatStore } from '../store/useChatStore';
import { useHomeStore } from '../store/useHomeStore';
import BottomNav from '../components/BottomNav';
import HomeSettingsSheet from '../components/home/HomeSettingsSheet';
import HomeCalendarModule from '../components/home/HomeCalendarModule';
import { useEffect, useState, useCallback } from 'react';
import { Loader2, MapPin, RefreshCw, Settings } from 'lucide-react';
import {
  fetchLocalWeatherAndAddress,
  type LocalWeatherSnapshot,
} from '../lib/localWeather';

function TodayWeatherDisplay({
  weather,
  loading,
}: {
  weather: LocalWeatherSnapshot;
  loading: boolean;
}) {
  const WeatherGlyph = weather.Icon;
  return (
    <>
      <div className="flex items-center gap-4 sm:gap-5">
        <div
          className={`shrink-0 w-[4.5rem] h-[4.5rem] sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center ${
            weather.isDay ? 'bg-amber-400/20 text-amber-700' : 'bg-indigo-500/15 text-indigo-700'
          }`}
          aria-hidden
        >
          <WeatherGlyph className="w-11 h-11 sm:w-12 sm:h-12" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="flex items-start gap-1.5 text-xs text-on-surface-variant leading-snug">
            <MapPin size={14} strokeWidth={2.4} className="shrink-0 mt-0.5 opacity-80" />
            <span>{weather.address}</span>
          </p>
          <p className="text-3xl sm:text-4xl font-bold text-on-surface tabular-nums tracking-tight">
            {Math.round(weather.temperature)}°C
            <span className="text-lg sm:text-xl font-semibold text-on-surface-variant ml-2">
              {weather.description}
            </span>
          </p>
        </div>
      </div>
      {loading && (
        <div className="flex items-center gap-2 pt-3 text-xs text-on-surface-variant">
          <Loader2 className="animate-spin shrink-0" size={14} strokeWidth={2.4} />
          正在更新天气…
        </div>
      )}
    </>
  );
}

export default function Welcome() {
  const storeNickname = useChatStore((state) => state.nickname) || '王奶奶';
  const [settingsOpen, setSettingsOpen] = useState(false);
  const hydrateHome = useHomeStore((s) => s.hydrate);
  const moodImageSrc = useHomeStore((s) => s.moodImageSrc);

  const [weather, setWeather] = useState<LocalWeatherSnapshot | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  const loadWeather = useCallback(async () => {
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      const data = await fetchLocalWeatherAndAddress();
      setWeather(data);
    } catch (e: unknown) {
      const geo = e as { code?: number };
      const msg =
        e && typeof e === 'object' && 'code' in e && typeof geo.code === 'number'
          ? geo.code === 1
            ? '需要您允许浏览器获取位置，才能显示当地天气。'
            : geo.code === 2
              ? '暂时无法获取位置，请稍后再试。'
              : '定位超时，请检查网络后重试。'
          : e instanceof Error
            ? e.message
            : '加载天气失败';
      setWeatherError(msg);
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  useEffect(() => {
    hydrateHome();
  }, [hydrateHome]);

  useEffect(() => {
    void loadWeather();
  }, [loadWeather]);

  return (
    <div className="text-on-surface antialiased pb-32 bg-surface min-h-screen">
      <main className="pt-4 px-4 max-w-md mx-auto space-y-5">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2 pt-1">
            <h1 className="text-3xl sm:text-4xl font-bold text-on-surface leading-tight tracking-tight">
              早安，{storeNickname}
            </h1>
            <p className="text-base sm:text-lg text-on-surface-variant font-medium">
              很高兴见到您，今天也要开心哦。
            </p>
          </div>
          <button
            type="button"
            aria-label="打开设置"
            onClick={() => setSettingsOpen(true)}
            className="shrink-0 p-3 rounded-2xl bg-surface-container-low border border-outline-variant/15 text-on-surface shadow-sm active:scale-[0.98] transition-transform"
          >
            <Settings size={24} strokeWidth={2.2} />
          </button>
        </header>

        <section className="bg-surface-container-low rounded-[1.25rem] p-4 sm:p-5 border border-outline-variant/10 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="text-sm font-semibold text-on-surface-variant tracking-wide">
              今日天气
            </h2>
            <button
              type="button"
              onClick={() => void loadWeather()}
              disabled={weatherLoading}
              aria-label="刷新天气"
              className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container-highest/80 disabled:opacity-50 transition-colors"
            >
              <RefreshCw
                size={18}
                strokeWidth={2.2}
                className={weatherLoading ? 'animate-spin' : ''}
              />
            </button>
          </div>

          {weatherLoading && !weather && (
            <div className="flex items-center gap-3 py-6 text-on-surface-variant">
              <Loader2 className="animate-spin shrink-0" size={28} strokeWidth={2.2} />
              <p className="text-sm leading-relaxed">正在获取位置与天气…</p>
            </div>
          )}

          {weatherError && !weather && (
            <div className="space-y-3 py-2">
              <p className="text-sm text-on-error-container leading-relaxed">{weatherError}</p>
              <button
                type="button"
                onClick={() => void loadWeather()}
                className="h-10 px-4 rounded-xl bg-primary-container text-on-primary-container text-sm font-semibold"
              >
                重试
              </button>
            </div>
          )}

          {weatherError && weather && (
            <p className="text-xs text-on-error-container mb-2 leading-relaxed">{weatherError}</p>
          )}

          {weather && <TodayWeatherDisplay weather={weather} loading={weatherLoading} />}
        </section>

        <section className="relative overflow-hidden rounded-[1.25rem] bg-surface-container-low p-5 shadow-sm">
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="flex-1 space-y-4">
              <span className="inline-block px-4 py-1 bg-primary-fixed text-on-primary-fixed-variant rounded-full text-sm font-bold">
                今日心情
              </span>
              <h2 className="text-2xl font-bold text-on-surface">阳光明媚的一天</h2>
              <p className="text-base text-on-surface-variant leading-relaxed">
                现在的您看起来就像清晨的露水，充满了生机。记得开窗透透气，感受一下微风的抚摸。
              </p>
            </div>
            <div className="w-44 h-44 sm:w-48 sm:h-48 rounded-3xl overflow-hidden shadow-lg rotate-3 flex-shrink-0 ring-2 ring-white/40">
              <img
                src={moodImageSrc}
                alt="喝奶茶、玩电脑消消乐的温馨日常"
                className="w-full h-full object-cover object-center"
              />
            </div>
          </div>
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-tertiary-container/10 rounded-full blur-3xl" />
        </section>

        <HomeCalendarModule />
      </main>
      <HomeSettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <BottomNav />
    </div>
  );
}
