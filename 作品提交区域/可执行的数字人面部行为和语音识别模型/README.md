# 可执行工程提交说明

本目录包含可直接提交的两个可执行工程：

1. `face-driver-model`：数字人面部行为驱动模型工程（输入 viseme 序列，输出可执行的面部参数时间序列）。
2. `asr-model`：语音识别模型工程（支持 `faster-whisper` 和 `vosk` 两种后端，便于按设备环境选择）。

## 快速使用

### 1) 数字人面部行为驱动模型

```bash
cd face-driver-model
python3 src/face_driver/cli.py \
  --input examples/visemes_demo.json \
  --output outputs/face_params_demo.json
```

### 2) 语音识别模型

```bash
cd asr-model
python3 src/asr_engine/cli.py \
  --audio examples/demo.wav \
  --backend dummy \
  --output outputs/asr_result_demo.json
```

> `dummy` 后端用于无模型环境下快速验证工程可执行；正式提交时建议使用 `faster-whisper` 或 `vosk` 后端。
