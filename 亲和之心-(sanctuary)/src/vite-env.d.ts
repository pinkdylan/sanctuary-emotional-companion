/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LIVE2D_MODEL_URL?: string;
  readonly VITE_LIVE2D_PARAM_OPEN?: string;
  readonly VITE_LIVE2D_PARAM_FORM?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
