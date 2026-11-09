"""Writes paper.png (grain) and data.js (timeline) and checks the script. usage: python3 data.py"""
import json, sys, numpy as np
from PIL import Image, ImageFilter
from tts import sentences
rng = np.random.default_rng(7); base = np.array([0xED, 0xEB, 0xE4], dtype=np.float32)
noise = rng.normal(0, 2.2, (1080, 1920, 1)).astype(np.float32)
blob = Image.fromarray((rng.random((54, 96)) * 255).astype(np.uint8)).resize((1920, 1080), Image.BICUBIC).filter(ImageFilter.GaussianBlur(30))
blob = (np.array(blob, dtype=np.float32)[..., None] - 128) / 128 * 2.0
Image.fromarray(np.clip(base + noise + blob, 0, 255).astype(np.uint8)).save("paper.png")
tim = json.load(open("timing.json")); sc = json.load(open("script.json"))["scenes"]
for s in sc:
    h = s["heading"]
    if not (1 <= len(h) <= 2): print("WARN scene", s["id"], "heading must be 1-2 lines")
    for x in sentences(s["narration"]):
        if len(x.split()) > 28: print("WARN scene", s["id"], "sentence over 28 words:", x[:50])
    if str(s["id"]) not in tim: sys.exit(f"no audio for scene {s['id']}: run tts.py")
D = [tim[str(s["id"])]["dur"] for s in sc]
open("data.js", "w").write("window.DUR=%s;window.NARR=%s;window.HEAD=%s;window.CHAP=%s;window.SENT=%s;window.PAD=1.1;" % (
    json.dumps(D), json.dumps([s["narration"] for s in sc]), json.dumps([s["heading"] for s in sc]),
    json.dumps([s.get("chapter", "") for s in sc]), json.dumps([tim[str(s["id"])]["sents"] for s in sc])))
print("scenes", len(sc), "total s", round(sum(D), 1))
