import { create } from 'zustand';

const LS_MOOD = 'sanctuary_mood_image_src';
const LS_DAILY = 'sanctuary_daily_summaries';
const LS_DEVICE = 'sanctuary_device_user_id';

export const DEFAULT_MOOD_IMAGE = '/assets/mood-daily.png';

export interface DailySummaryEntry {
  summary: string;
  topic?: string;
  duration?: string;
  recordedAt: string;
}

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function formatLocalYmd(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function stableDeviceId(): string {
  let id = localStorage.getItem(LS_DEVICE);
  if (!id) {
    id = `local_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem(LS_DEVICE, id);
  }
  return id;
}

interface HomeStore {
  moodImageSrc: string;
  dailySummaries: Record<string, DailySummaryEntry>;
  deviceUserId: string;
  hydrated: boolean;
  hydrate: () => void;
  setMoodImageSrc: (src: string) => void;
  setMoodImageFromFile: (file: File) => void;
  resetMoodImage: () => void;
  recordDailySummary: (ymd: string, partial: Omit<DailySummaryEntry, 'recordedAt'> & { recordedAt?: string }) => void;
}

export const useHomeStore = create<HomeStore>((set, get) => ({
  moodImageSrc: DEFAULT_MOOD_IMAGE,
  dailySummaries: {},
  deviceUserId: 'local_pending',
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return;
    const mood = localStorage.getItem(LS_MOOD) || DEFAULT_MOOD_IMAGE;
    const daily = loadJson<Record<string, DailySummaryEntry>>(LS_DAILY, {});
    set({
      moodImageSrc: mood,
      dailySummaries: daily,
      deviceUserId: typeof localStorage !== 'undefined' ? stableDeviceId() : 'local_pending',
      hydrated: true,
    });
  },

  setMoodImageSrc: (src) => {
    localStorage.setItem(LS_MOOD, src);
    set({ moodImageSrc: src });
  },

  setMoodImageFromFile: (file) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const data = reader.result;
      if (typeof data === 'string') {
        get().setMoodImageSrc(data);
      }
    };
    reader.readAsDataURL(file);
  },

  resetMoodImage: () => {
    localStorage.removeItem(LS_MOOD);
    set({ moodImageSrc: DEFAULT_MOOD_IMAGE });
  },

  recordDailySummary: (ymd, partial) => {
    const entry: DailySummaryEntry = {
      summary: partial.summary,
      topic: partial.topic,
      duration: partial.duration,
      recordedAt: partial.recordedAt ?? new Date().toISOString(),
    };
    const next = { ...get().dailySummaries, [ymd]: entry };
    localStorage.setItem(LS_DAILY, JSON.stringify(next));
    set({ dailySummaries: next });
  },
}));
