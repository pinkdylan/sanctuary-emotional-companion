#!/usr/bin/env bash
# Live2D 官方 Cubism Web Samples 资源（Hiyori / Rice / Haru）
# 条款：https://www.live2d.com/en/learn/sample/model-terms/
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BASE="https://raw.githubusercontent.com/Live2D/CubismWebSamples/develop/Samples/Resources"

fetch_file() {
  local url="$1" out="$2"
  mkdir -p "$(dirname "$out")"
  curl -fsSL "$url" -o "$out"
}

# --- Hiyori ---
HI="$ROOT/public/live2d/hiyori_official"
rm -rf "$HI"
mkdir -p "$HI/Hiyori.2048" "$HI/motions"
for f in Hiyori.model3.json Hiyori.moc3 Hiyori.cdi3.json Hiyori.physics3.json Hiyori.pose3.json Hiyori.userdata3.json; do
  fetch_file "$BASE/Hiyori/$f" "$HI/$f"
done
for f in texture_00.png texture_01.png; do
  fetch_file "$BASE/Hiyori/Hiyori.2048/$f" "$HI/Hiyori.2048/$f"
done
for i in $(seq 1 10); do
  printf -v n "%02d" "$i"
  fetch_file "$BASE/Hiyori/motions/Hiyori_m${n}.motion3.json" "$HI/motions/Hiyori_m${n}.motion3.json"
done

# --- Rice ---
RC="$ROOT/public/live2d/rice_official"
rm -rf "$RC"
mkdir -p "$RC/Rice.2048" "$RC/motions"
for f in Rice.model3.json Rice.moc3 Rice.cdi3.json Rice.physics3.json; do
  fetch_file "$BASE/Rice/$f" "$RC/$f"
done
for f in texture_00.png texture_01.png; do
  fetch_file "$BASE/Rice/Rice.2048/$f" "$RC/Rice.2048/$f"
done
for f in idle.motion3.json mtn_01.motion3.json mtn_02.motion3.json mtn_03.motion3.json; do
  fetch_file "$BASE/Rice/motions/$f" "$RC/motions/$f"
done

# --- Haru（完整 motions + 音效，与官方 model3 一致）---
HA="$ROOT/public/live2d/haru_official"
rm -rf "$HA"
mkdir -p "$HA/Haru.2048" "$HA/motions" "$HA/expressions" "$HA/sounds"
for f in Haru.model3.json Haru.moc3 Haru.cdi3.json Haru.physics3.json Haru.pose3.json Haru.userdata3.json; do
  fetch_file "$BASE/Haru/$f" "$HA/$f"
done
for f in texture_00.png texture_01.png; do
  fetch_file "$BASE/Haru/Haru.2048/$f" "$HA/Haru.2048/$f"
done
fetch_file "$BASE/Haru/motions/haru_g_idle.motion3.json" "$HA/motions/haru_g_idle.motion3.json"
for i in $(seq 1 26); do
  printf -v n "%02d" "$i"
  fetch_file "$BASE/Haru/motions/haru_g_m${n}.motion3.json" "$HA/motions/haru_g_m${n}.motion3.json"
done
for f in F01.exp3.json F02.exp3.json F03.exp3.json F04.exp3.json F05.exp3.json F06.exp3.json F07.exp3.json F08.exp3.json; do
  fetch_file "$BASE/Haru/expressions/$f" "$HA/expressions/$f"
done
for f in haru_Info_04.wav haru_Info_14.wav haru_normal_6.wav haru_talk_13.wav; do
  fetch_file "$BASE/Haru/sounds/$f" "$HA/sounds/$f"
done

echo "OK: $HI, $RC, $HA"
