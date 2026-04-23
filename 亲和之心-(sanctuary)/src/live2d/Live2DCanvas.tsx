import { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { Live2DModel, cubism4Ready, MotionPriority } from 'pixi-live2d-display/cubism4';
import { useChatStore } from '../store/useChatStore';
import { pickVisemeAtTime, visemeToMouth } from './visemeToMouth';
import { DEFAULT_LIVE2D_MODEL_URL } from './defaultModelUrl';

type Live2DModelInstance = InstanceType<typeof Live2DModel>;

const OPEN_ID = import.meta.env.VITE_LIVE2D_PARAM_OPEN ?? 'ParamMouthOpenY';
const FORM_ID = import.meta.env.VITE_LIVE2D_PARAM_FORM ?? 'ParamMouthForm';
const MODEL_URL = import.meta.env.VITE_LIVE2D_MODEL_URL?.trim() || DEFAULT_LIVE2D_MODEL_URL;
const IDLE_MOTION_GROUP = import.meta.env.VITE_LIVE2D_IDLE_MOTION_GROUP?.trim() || undefined;
/** 官方 Hiyori/Rice/Haru 均为 TapBody；设为 none 关闭；自研模型请在 .env 覆盖 */
const TALK_MOTION_RAW = import.meta.env.VITE_LIVE2D_TALK_MOTION_GROUP?.trim();
const TALK_MOTION_GROUP = TALK_MOTION_RAW === 'none' ? 'none' : TALK_MOTION_RAW || 'TapBody';
const TALK_MOTION_INDEX_RAW = Number.parseInt(import.meta.env.VITE_LIVE2D_TALK_MOTION_INDEX ?? '0', 10);
const TALK_MOTION_INDEX = Number.isFinite(TALK_MOTION_INDEX_RAW) ? TALK_MOTION_INDEX_RAW : 0;
const EXPR_TALK = import.meta.env.VITE_LIVE2D_EXPRESSION_TALK?.trim() || '';
const EXPR_IDLE = import.meta.env.VITE_LIVE2D_EXPRESSION_IDLE?.trim() || '';

function mountMouthSync(model: Live2DModelInstance) {
  const internal = model.internalModel as unknown as {
    on: (ev: string, fn: () => void) => void;
    coreModel: {
      setParameterValueById: (id: string, value: number, weight: number) => void;
      getParameterIndex: (id: string) => number;
      getParameterMaximumValue: (index: number) => number;
      getParameterMinimumValue: (index: number) => number;
    };
  };

  const map01 = (id: string, t: number) => {
    const idx = internal.coreModel.getParameterIndex(id);
    if (idx < 0) return null;
    const min = internal.coreModel.getParameterMinimumValue(idx);
    const max = internal.coreModel.getParameterMaximumValue(idx);
    return min + (max - min) * Math.min(1, Math.max(0, t));
  };

  const mapSigned = (id: string, t: number) => {
    const idx = internal.coreModel.getParameterIndex(id);
    if (idx < 0) return null;
    const min = internal.coreModel.getParameterMinimumValue(idx);
    const max = internal.coreModel.getParameterMaximumValue(idx);
    const mid = (min + max) / 2;
    const half = (max - min) / 2;
    return mid + half * Math.min(1, Math.max(-1, t));
  };

  internal.on('beforeModelUpdate', () => {
    const lip = useChatStore.getState().lipSync;
    if (!lip?.active) return;

    const elapsed = (performance.now() - lip.startPerfMs) / 1000;
    if (elapsed >= lip.durationSec) {
      useChatStore.getState().clearLipSync();
      return;
    }

    const v = pickVisemeAtTime(lip.visemes, elapsed);
    const { open, form } = visemeToMouth(v);
    try {
      const openV = map01(OPEN_ID, open);
      const formV = mapSigned(FORM_ID, form);
      if (openV !== null) internal.coreModel.setParameterValueById(OPEN_ID, openV, 1);
      if (formV !== null) internal.coreModel.setParameterValueById(FORM_ID, formV, 1);
    } catch {
      // 模型无对应参数时忽略
    }
  });
}

export default function Live2DCanvas({ className }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const modelRef = useRef<Live2DModelInstance | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!MODEL_URL || !hostRef.current) return;

    let cancelled = false;
    const host = hostRef.current;

    (async () => {
      try {
        if (typeof window !== 'undefined' && !(window as unknown as { Live2DCubismCore?: unknown }).Live2DCubismCore) {
          setError('未加载 Cubism Core，请检查 index.html 中的 live2dcubismcore 脚本');
          return;
        }

        (window as unknown as { PIXI: typeof PIXI }).PIXI = PIXI;

        await cubism4Ready();
        if (cancelled || !host) return;

        const w = host.clientWidth || 320;
        const h = host.clientHeight || 256;

        const app = new PIXI.Application({
          width: w,
          height: h,
          backgroundAlpha: 0,
          antialias: true,
          resolution: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
          autoDensity: true,
        });

        host.innerHTML = '';
        host.appendChild(app.view as HTMLCanvasElement);
        appRef.current = app;

        const model = await Live2DModel.from(MODEL_URL, {
          autoHitTest: false,
          autoFocus: false,
          ...(IDLE_MOTION_GROUP ? { idleMotionGroup: IDLE_MOTION_GROUP } : {}),
        });
        if (cancelled) {
          model.destroy();
          app.destroy(true);
          return;
        }

        modelRef.current = model;

        const internal = model.internalModel as { lipSync?: boolean };
        if (internal.lipSync !== undefined) {
          internal.lipSync = false;
        }

        const [mw, mh] = (model.internalModel as unknown as { getSize: () => [number, number] }).getSize();
        const scale = Math.min(w / mw, h / mh) * 1;
        model.scale.set(scale);
        model.anchor.set(0.5, 1);
        model.x = w / 2;
        model.y = h;

        app.stage.addChild(model);
        mountMouthSync(model);
        setReady(true);
        setError(null);
      } catch (e) {
        console.error(e);
        setError('模型加载失败，请检查 VITE_LIVE2D_MODEL_URL 与跨域资源');
      }
    })();

    return () => {
      cancelled = true;
      modelRef.current?.destroy();
      modelRef.current = null;
      appRef.current?.destroy(true);
      appRef.current = null;
    };
  }, [MODEL_URL]);

  useEffect(() => {
    const el = hostRef.current;
    if (!el || !appRef.current || !ready) return;

    const ro = new ResizeObserver(() => {
      const app = appRef.current;
      const model = modelRef.current;
      if (!app || !model) return;
      const w = el.clientWidth || 320;
      const h = el.clientHeight || 256;
      app.renderer.resize(w, h);
      const internal = model.internalModel as unknown as { getSize: () => [number, number] };
      const [mw, mh] = internal.getSize();
      const scale = Math.min(w / mw, h / mh) * 1;
      model.scale.set(scale);
      model.x = w / 2;
      model.y = h;
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, [ready]);

  /** 与聊天状态联动：可选「说话」动作/表情（名称随模型 model3.json 而定） */
  useEffect(() => {
    if (!ready) return;
    const unsub = useChatStore.subscribe((state, prev) => {
      const m = modelRef.current;
      if (!m) return;

      if (state.sessionState === 'speaking' && prev.sessionState !== 'speaking') {
        if (TALK_MOTION_GROUP !== 'none') {
          void m.motion(TALK_MOTION_GROUP, TALK_MOTION_INDEX, MotionPriority.NORMAL);
        }
        if (EXPR_TALK) {
          void m.expression(EXPR_TALK);
        }
      }

      if (state.sessionState === 'idle' && prev.sessionState === 'speaking') {
        if (EXPR_IDLE) {
          void m.expression(EXPR_IDLE);
        }
      }
    });
    return unsub;
  }, [ready]);

  return (
    <div className={className}>
      <div ref={hostRef} className="h-full w-full min-h-[240px]" />
      {error && (
        <p className="text-xs text-error px-2 py-1 text-center">{error}</p>
      )}
    </div>
  );
}
