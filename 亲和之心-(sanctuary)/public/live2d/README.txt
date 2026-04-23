Live2D Cubism 3/4 模型放置说明
================================

0. 官方 Hiyori / Rice / Haru：在项目根执行 npm run fetch:live2d-official 后得到 hiyori_official、rice_official、haru_official。
   默认不配置 VITE_LIVE2D_MODEL_URL 时使用 Hiyori。三组 env 示例见 src/.env.example。

1. 从 Live2D 官方 Cubism SDK 或素材库取得 .model3.json 及同目录资源（moc3、贴图等）。
2. 将整个模型文件夹复制到本目录下，例如：public/live2d/MyModel/MyModel.model3.json
3. 在项目根目录创建 .env.local，设置：

   VITE_LIVE2D_MODEL_URL=/live2d/MyModel/MyModel.model3.json

4. 口型参数名与模型不一致时，可额外设置：

   VITE_LIVE2D_PARAM_OPEN=ParamMouthOpenY
   VITE_LIVE2D_PARAM_FORM=ParamMouthForm

5. index.html 已引用 Cubism Core；正式环境建议将 live2dcubismcore.min.js 放到本地并遵守 Live2D 许可协议。

6. 打开 model3.json 查看 Motions 下的分组名（如 Idle、TapBody）。可在 .env / .env.local 中设置：
   VITE_LIVE2D_IDLE_MOTION_GROUP — 待机随机动作所在组（与模型一致）
   VITE_LIVE2D_TALK_MOTION_GROUP / VITE_LIVE2D_TALK_MOTION_INDEX — 进入「说话」状态时播放的动作（可选）
   VITE_LIVE2D_EXPRESSION_TALK / VITE_LIVE2D_EXPRESSION_IDLE — 说话/恢复空闲时的表情名（可选，依模型 exp 而定）

CosyVoice：在项目根 .env 设置 COSYVOICE_BASE_URL 等，由 server.ts 拉流并返回 data:audio/wav + 与时长对齐的 visemes。
