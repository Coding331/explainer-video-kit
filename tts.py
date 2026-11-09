"""Narration: one clip per sentence (cached by text), joined per scene with exact timings.
usage: python3 tts.py [scene ids]      re-running only synthesizes sentences that changed
writes audio_<id>.wav, timing.json {id: {dur, sents:[[start,end,text],...]}}"""
import json, sys, re, os, hashlib, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
B = os.path.dirname(os.path.abspath(__file__))
VOICE, SPEED, LEAD, GAP, PAD = "af_heart", 0.92, 0.30, 0.22, 1.10   # PAD = silence after the last sentence
FIX = {}   # pronunciation fixes, only for words heard wrongly, e.g. {"chitin": "kite-in"}  (spoken text only, subtitles keep the original)
def sentences(t): return [s.strip() for s in re.split(r'(?:(?<=[.?!])|(?<=[.?!]["\')]))\s+(?=[A-Z"\'(])', t.strip()) if s.strip()]   # splits only before a capital: 3.5 and -5 degrees are safe, 'e.g.' is not (avoid it)
def say(t):
    for a, b in FIX.items(): t = re.sub(r'\b' + re.escape(a) + r'\b', b, t, flags=re.I)
    return t
K = None
def init():
    global K; K = Kokoro(f"{B}/models/kokoro-v1.0.onnx", f"{B}/models/voices-v1.0.bin")
def work(sc):
    i = sc["id"]; sr = 24000; parts = [np.zeros(int(sr * LEAD), dtype=np.float32)]; t = LEAD; rows = []
    for si, s in enumerate(sentences(sc["narration"])):
        f = f"{B}/cache/{hashlib.sha1((VOICE + str(SPEED) + say(s)).encode()).hexdigest()[:16]}.npy"
        if os.path.exists(f): x = np.load(f)
        else:
            x, sr = K.create(say(s), voice=VOICE, speed=SPEED, lang="en-us"); x = x.astype(np.float32); np.save(f, x)
        if si: parts.append(np.zeros(int(sr * GAP), dtype=np.float32)); t += GAP
        parts.append(x); rows.append([round(t, 2), round(t + len(x) / sr, 2), s]); t += len(x) / sr
    parts.append(np.zeros(int(sr * PAD), dtype=np.float32)); a = np.concatenate(parts)
    sf.write(f"{B}/audio_{i}.wav", a, sr); return i, {"dur": round(len(a) / sr, 2), "sents": rows}
if __name__ == "__main__":
    script = json.load(open(f"{B}/script.json")); only = {int(x) for x in sys.argv[1:]}; os.makedirs(f"{B}/cache", exist_ok=True)
    try: tim = json.load(open(f"{B}/timing.json"))
    except Exception: tim = {}
    todo = [sc for sc in script["scenes"] if not only or sc["id"] in only or str(sc["id"]) not in tim]
    init()   # one process is enough: onnxruntime already uses every CPU (tested: 2 processes gave no speed-up)
    for sc in todo: i, row = work(sc); tim[str(i)] = row; print(i, row["dur"], flush=True)
    tim = {k: v for k, v in tim.items() if int(k) in {s["id"] for s in script["scenes"]}}; json.dump(tim, open(f"{B}/timing.json", "w"))
    print("total s", round(sum(v["dur"] for v in tim.values()), 1), "| words", sum(len(s["narration"].split()) for s in script["scenes"]))
