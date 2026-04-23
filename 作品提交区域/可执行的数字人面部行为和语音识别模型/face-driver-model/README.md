# 数字人面部行为驱动模型工程

## 工程目标
将 TTS/语音系统输出的 viseme 时间轴转换为数字人可执行的面部参数曲线（口型、嘴角展开、圆唇、下颌开合），用于驱动 2D/3D 数字人。

## 输入/输出
- 输入：`visemes` JSON 文件（包含每个音素片段的开始时间、结束时间、类别和强度）
- 输出：逐帧面部参数 JSON，可直接用于渲染层或中间桥接层

## 运行方式

```bash
python3 src/face_driver/cli.py \
  --input examples/visemes_demo.json \
  --fps 30 \
  --output outputs/face_params_demo.json
```

## 字段说明
- `mouth_open`：嘴部张开度（0~1）
- `mouth_wide`：嘴角横向展开（0~1）
- `mouth_round`：圆唇程度（0~1）
- `jaw_open`：下颌开合（0~1）

## 可提交性说明
该工程提供了：
1. 可执行模型脚本；
2. 标准化输入输出格式；
3. 可复现实例；
4. 可直接集成到你现有 Web 数字人（Live2D / Three.js）链路的参数层。
