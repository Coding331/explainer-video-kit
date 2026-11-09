#!/bin/bash
# one-time setup, safe to re-run. usage: bash setup.sh   (run inside the video folder)
set -e
mkdir -p models fonts engine scenes cache
pip install --break-system-packages -q kokoro-onnx soundfile numpy pillow 2>&1 | grep -i error || true
[ -s models/kokoro-v1.0.onnx ] || { curl -fsSL -o models/k.tmp https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx && mv models/k.tmp models/kokoro-v1.0.onnx; }
[ -s models/voices-v1.0.bin ]  || { curl -fsSL -o models/v.tmp   https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin && mv models/v.tmp models/voices-v1.0.bin; }
if [ ! -s fonts/sg-800.woff2 ]; then
  mkdir -p npm && (cd npm && npm init -y >/dev/null && npm install --silent @fontsource/schibsted-grotesk @fontsource/newsreader)
  S=npm/node_modules/@fontsource; G=$S/schibsted-grotesk/files/schibsted-grotesk-latin; N=$S/newsreader/files/newsreader-latin
  cp $G-500-normal.woff2 fonts/sg-500.woff2; cp $G-700-normal.woff2 fonts/sg-700.woff2; cp $G-800-normal.woff2 fonts/sg-800.woff2
  cp $N-400-normal.woff2 fonts/nr-400.woff2; cp $N-400-italic.woff2 fonts/nr-400i.woff2; cp $N-500-normal.woff2 fonts/nr-500.woff2
  rm -rf npm
fi
python3 -c "import kokoro_onnx,playwright,soundfile" && ffmpeg -version | head -1 || { echo "MISSING TOOL: tell the user"; exit 1; }
ls fonts models | tr '\n' ' '; echo; nproc; df -h . | tail -1
