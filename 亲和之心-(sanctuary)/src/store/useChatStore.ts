import { create } from 'zustand';

export type SessionState = 'idle' | 'listening' | 'processing' | 'speaking' | 'reassessing' | 'error';

export interface RiskState {
  anxiety: number;
  depression: number;
  bipolar: number;
  level: 'low' | 'medium' | 'high';
  reassessTriggered: boolean;
}

export interface RiskTrend {
  anxiety: number[];
  depression: number[];
  bipolar: number[];
}

export interface LipSyncState {
  active: boolean;
  startPerfMs: number;
  durationSec: number;
  visemes: { t: number; v: string }[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

interface ChatStore {
  sessionId: string;
  sessionState: SessionState;
  messages: Message[];
  nickname: string;
  risk: RiskState;
  riskTrend: RiskTrend;
  turnCount: number;
  lastError: string;
  /** 心理导师模式：请求进行中，用于知识库扫描动效 */
  kbScanActive: boolean;
  lipSync: LipSyncState | null;
  setSessionState: (state: SessionState) => void;
  setKbScanActive: (active: boolean) => void;
  addMessage: (message: Message) => void;
  setNickname: (nickname: string) => void;
  setRisk: (risk: RiskState) => void;
  clearError: () => void;
  setError: (message: string) => void;
  resetSession: () => void;
  startLipSync: (payload: { visemes: { t: number; v: string }[]; durationSec: number }) => void;
  clearLipSync: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  sessionId: `s_${Date.now()}`,
  sessionState: 'idle',
  messages: [],
  nickname: '',
  risk: {
    anxiety: 25,
    depression: 20,
    bipolar: 15,
    level: 'low',
    reassessTriggered: false,
  },
  riskTrend: {
    anxiety: [25],
    depression: [20],
    bipolar: [15],
  },
  turnCount: 0,
  lastError: '',
  kbScanActive: false,
  lipSync: null,
  setSessionState: (state) => set({ sessionState: state }),
  setKbScanActive: (active) => set({ kbScanActive: active }),
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
      turnCount: message.role === 'user' ? state.turnCount + 1 : state.turnCount,
    })),
  setNickname: (nickname) => set({ nickname }),
  setRisk: (risk) =>
    set((state) => ({
      risk,
      riskTrend: {
        anxiety: [...state.riskTrend.anxiety, risk.anxiety].slice(-8),
        depression: [...state.riskTrend.depression, risk.depression].slice(-8),
        bipolar: [...state.riskTrend.bipolar, risk.bipolar].slice(-8),
      },
    })),
  clearError: () => set({ lastError: '' }),
  setError: (message) => set({ lastError: message }),
  startLipSync: ({ visemes, durationSec }) =>
    set({
      lipSync: {
        active: true,
        startPerfMs: typeof performance !== 'undefined' ? performance.now() : 0,
        durationSec,
        visemes,
      },
    }),
  clearLipSync: () => set({ lipSync: null }),
  resetSession: () =>
    set({
      sessionId: `s_${Date.now()}`,
      sessionState: 'idle',
      messages: [],
      risk: {
        anxiety: 25,
        depression: 20,
        bipolar: 15,
        level: 'low',
        reassessTriggered: false,
      },
      riskTrend: {
        anxiety: [25],
        depression: [20],
        bipolar: [15],
      },
      turnCount: 0,
      lastError: '',
      kbScanActive: false,
      lipSync: null,
    }),
}));
