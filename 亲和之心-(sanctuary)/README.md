<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/908ac6cd-2f8a-4430-b91d-2e10c7bb8996

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Live2D + 口型

1. 拉取官方示例资源（**Hiyori / Rice / Haru**，来源 [CubismWebSamples](https://github.com/Live2D/CubismWebSamples)）：`npm run fetch:live2d-official`  
   生成目录：`public/live2d/hiyori_official`、`rice_official`、`haru_official`。
2. 未配置 `VITE_LIVE2D_MODEL_URL` 时默认使用 **Hiyori**（`src/live2d/defaultModelUrl.ts`）。切换模型或动作/表情时，按各目录下 `model3.json` 与 `src/.env.example` 三组注释填写 `VITE_LIVE2D_*`。**Rice** 无口形参数，嘴部几乎不随 TTS 动。
3. `index.html` 已加载 Cubism Core；正式部署建议改为本地脚本并遵守 [Live2D 示例数据条款](https://www.live2d.com/en/learn/sample/model-terms/) 与 [EULA](https://www.live2d.com/eula/)。
4. 口型来自 `POST /api/tts/synthesize` 的 `visemes` + `durationSec`；接入 CosyVoice 时与真实音频时长对齐。
