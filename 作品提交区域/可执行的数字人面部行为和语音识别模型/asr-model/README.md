# 语音识别模型工程（可执行）

## 工程目标
提供可直接运行的语音识别推理工程，并支持多个后端，便于根据电脑性能和环境选择：

- `faster-whisper`：识别精度较高，适合正式提交演示；
- `vosk`：离线轻量方案；
- `dummy`：无模型环境下的可执行演示后端（快速验证工程结构）。

## 安装依赖

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## 运行示例

### 1) 快速验证（无需下载模型）
```bash
python3 src/asr_engine/cli.py \
  --audio examples/demo.wav \
  --backend dummy \
  --output outputs/asr_result_demo.json
```

### 2) faster-whisper（推荐提交）
```bash
python3 src/asr_engine/cli.py \
  --audio examples/demo.wav \
  --backend faster-whisper \
  --model-size small \
  --language zh \
  --output outputs/asr_result_fw.json
```

### 3) vosk（需本地模型目录）
```bash
python3 src/asr_engine/cli.py \
  --audio examples/demo.wav \
  --backend vosk \
  --model-path /path/to/vosk-model-small-cn \
  --output outputs/asr_result_vosk.json
```

## 输出格式
输出为 JSON，包含：
- `backend`
- `text`
- `segments`（可选，分段时间戳）
- `audio_path`

## 提交建议
建议你提交时主用 `faster-whisper` 结果，附 `vosk` 作为离线备选，体现工程可迁移性与可替换性。
