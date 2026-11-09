"""One tool for build / render / lint / sheet / assemble / verify.   python3 tool.py <cmd> [args]
  build                      concatenate engine + scenes into scene.html
  lint [ids|all] [--force]   automatic layout checks: text overlaps, text outside the safe area, dots painted over text,
                             static stretches, bad cue() phrases, JS errors. Read its output instead of looking at every frame.
  sheet <id> [t ...]         contact sheet sheets/sNN.jpg (default: 1 s after each sentence starts). Look only at flagged scenes.
  render [ids|all] [-j N] [--draft]   scene -> video segment via a pipe (no PNG files); unchanged scenes are skipped (hash cache).
                             --draft: 1280x720, fast encode, into segs_draft/ (about 1.4x faster and far less CPU; use it while iterating)
  assemble [out.mp4] [--draft]   join segments, build the audio exactly, loudness-normalise, add chapters
  verify [out.mp4]           ffprobe + loudness + a contact sheet of the finished file
ids: 3 | 3,5 | 4-9 | all"""
import os, sys, json, glob, re, math, hashlib, subprocess, time
B = os.path.dirname(os.path.abspath(__file__)); os.chdir(B); FPS = 30
if "--draft" in sys.argv: sys.argv.remove("--draft"); os.environ["EXPL_DRAFT"] = "1"
DRAFT = os.environ.get("EXPL_DRAFT") == "1"; SEGS = "segs_draft" if DRAFT else "segs"
os.environ.setdefault("PLAYWRIGHT_BROWSERS_PATH", "/opt/pw-browsers")
def read(p): return open(p, "rb").read()
def ids_of(a, n):
    if not a or a[0] == "all": return list(range(1, n + 1))
    out = []
    for part in a[0].split(","):
        if "-" in part: x, y = part.split("-"); out += range(int(x), int(y) + 1)
        else: out.append(int(part))
    return out
def build():
    os.makedirs("scenes", exist_ok=True)
    parts = ["engine/head.html", "engine/helpers.js", "engine/sim.js"] + sorted(glob.glob("engine/extra*.js")) + sorted(glob.glob("scenes/*.js")) + ["engine/tail.js"]
    open("scene.html", "w").write("".join(open(p).read() + "\n" for p in parts)); return parts
def scene_file(i):
    for f in sorted(glob.glob("scenes/*.js")):
        if re.search(r"function\s+scene%d\s*\(" % i, open(f).read()): return f
def split_scenes(txt):   # -> (shared text, {id: scene text}); a column-0 statement between scenes counts as shared (safe: it invalidates every scene)
    shared, chunks, cur = [], {}, None
    for ln in txt.split("\n"):
        m = re.match(r"function\s+scene(\d+)\s*\(", ln)
        if m: cur = int(m[1]); chunks[cur] = [ln]; continue
        if cur is not None and (ln[:1] in (" ", "\t") or ln.startswith("}") or ln == ""): chunks[cur].append(ln)
        else: cur = None; shared.append(ln)
    return "\n".join(shared), {k: "\n".join(v) for k, v in chunks.items()}
def scene_parts(i):   # everything that can change scene i: shared code of all scene files + its own function
    shared, own = "", ""
    for f in sorted(glob.glob("scenes/*.js")):
        sh, ch = split_scenes(open(f).read()); shared += f + "\n" + sh + "\n"; own += ch.get(i, "")
    return (shared + "\x00" + own).encode()
def key(i, sc, tim):
    h = hashlib.sha1()
    for f in ["engine/head.html", "engine/helpers.js", "engine/sim.js", "engine/tail.js", "paper.png"] + sorted(glob.glob("engine/extra*.js")): h.update(read(f))
    h.update(scene_parts(i) if scene_file(i) else b"none"); h.update(read(f"audio_{i}.wav")); h.update(json.dumps(sc, sort_keys=True).encode())
    h.update(str(len(tim)).encode()); h.update(str(i == 1).encode())
    S = json.load(open("script.json"))["scenes"]; h.update(json.dumps([S[i - 2].get("chapter") if i > 1 else None, S[i].get("chapter") if i < len(S) else None]).encode())
    return h.hexdigest()[:12]
def page(p):
    b = p.chromium.launch(args=["--no-sandbox", "--disable-gpu", "--font-render-hinting=none"])
    pg = b.new_page(viewport={"width": 1920, "height": 1080}, device_scale_factor=(2 / 3 if DRAFT else 1)); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)[:160])); pg.goto("file://" + B + "/scene.html"); pg.evaluate("window.ready"); return b, pg, errs
def render_one(i):
    from playwright.sync_api import sync_playwright
    script = json.load(open("script.json"))["scenes"]; tim = json.load(open("timing.json")); N = len(script)
    k = key(i, script[i - 1], tim); out = f"{SEGS}/seg_{i:02d}_{k}.mp4"
    if os.path.exists(out): return f"scene {i}: cached"
    for old in glob.glob(f"{SEGS}/seg_{i:02d}_*.mp4"): os.remove(old)
    D = tim[str(i)]["dur"]; n = math.ceil(D * FPS); L = n / FPS; t0 = sum(tim[str(j)]["dur"] for j in range(1, i)); s0 = time.time()
    vf = "format=yuv420p" + (",fade=t=in:st=0:d=0.5" if i == 1 else "") + (f",fade=t=out:st={L-0.7:.3f}:d=0.7" if i == N else "")
    ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", str(FPS), "-c:v", "mjpeg", "-i", "-", "-vf", vf, "-an",
                           "-c:v", "libx264", "-preset", ("ultrafast" if DRAFT else "fast"), "-crf", ("30" if DRAFT else "17"), "-pix_fmt", "yuv420p", "-r", str(FPS), "-t", f"{L:.5f}", out + ".tmp.mp4"], stdin=subprocess.PIPE)
    shots = 0; last = None; buf = None
    with sync_playwright() as p:
        b, pg, errs = page(p)
        if not pg.evaluate(f"window.BUILT[{i-1}]"): sys.exit(f"scene {i} is not built (placeholder)")
        for f in range(n):
            sg = pg.evaluate("t => window.sig(t)", t0 + f / FPS)
            if sg != last: buf = pg.screenshot(type="jpeg", quality=95, clip={"x": 0, "y": 0, "width": 1920, "height": 1080}); last = sg; shots += 1
            ff.stdin.write(buf)
        err = pg.evaluate("window.ERR"); b.close()
    ff.stdin.close(); ff.wait()
    if ff.returncode: sys.exit(f"ffmpeg failed on scene {i}")
    os.replace(out + ".tmp.mp4", out)
    return f"scene {i}: {n} frames, {shots} captured ({100-100*shots//n}% duplicates), {time.time()-s0:.0f}s" + (f"  ERR {err} {errs}" if err or errs else "")
def cmd_render(a):
    from concurrent.futures import ProcessPoolExecutor
    n = len(json.load(open("script.json"))["scenes"]); jobs = os.cpu_count() or 2
    if "-j" in a: jobs = int(a[a.index("-j") + 1]); del a[a.index("-j"):a.index("-j") + 2]
    ids = ids_of(a, n); os.makedirs(SEGS, exist_ok=True); build(); t = time.time(); done = 0
    with ProcessPoolExecutor(jobs) as ex:
        for r in ex.map(render_one, ids): done += 1; print(f"[{done}/{len(ids)}] {r}  elapsed {time.time()-t:.0f}s", flush=True)
LINT_JS = r"""t => { renderFrame(t); const svg=document.getElementById('svg'); const eff=e=>{let o=1; for(let n=e;n&&n!==svg;n=n.parentNode){ const v=n.getAttribute&&n.getAttribute('opacity'); if(v!==null&&v!==undefined) o*=parseFloat(v);} return o;};
 const all=[...svg.querySelectorAll('text,circle')]; const tx=[], ci=[], out0=[];
 all.forEach((e,k)=>{ if(e.closest('#subs')||e.closest('.nolint')) return; const o=eff(e)*parseFloat(e.getAttribute(e.tagName==='text'?'fill-opacity':'fill-opacity')||1); if(o<0.6) return; const r=e.getBoundingClientRect();
   if(e.tagName==='text'){ if(r.width>2){ if(parseFloat(e.getAttribute('font-size'))<30) out0.push('text under 30 px: "'+e.textContent.slice(0,25)+'"'); if(e.textContent.split(' ').length>14) out0.push('label over 14 words: "'+e.textContent.slice(0,25)+'"'); } if(r.width>2) tx.push({s:e.textContent,x:r.left,y:r.top+r.height*0.12,r:r.right,b:r.bottom-r.height*0.18,k}); } else if(r.width>=12 && e.getAttribute('fill')!=='none') ci.push({cx:(r.left+r.right)/2,cy:(r.top+r.bottom)/2,k}); });
 const out=out0; const ov=(a,b)=>Math.max(0,Math.min(a.r,b.r)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.b,b.b)-Math.max(a.y,b.y));
 for(let i=0;i<tx.length;i++){ const a=tx[i]; if(a.b>952||a.x<60||a.r>1870) out.push('outside safe area: "'+a.s.slice(0,30)+'"');
   for(let j=i+1;j<tx.length;j++){ const b=tx[j]; const m=Math.min((a.r-a.x)*(a.b-a.y),(b.r-b.x)*(b.b-b.y)); if(m>0&&ov(a,b)/m>0.12) out.push('overlap: "'+a.s.slice(0,28)+'" x "'+b.s.slice(0,28)+'"'); }
   for(const c of ci) if(c.k>a.k&&c.cx>a.x&&c.cx<a.r&&c.cy>a.y&&c.cy<a.b) out.push('dot drawn over label "'+a.s.slice(0,28)+'"'); }
 const hh=svg.innerHTML.replace(/<g id="subs">[\s\S]*$/,''); if(/NaN|undefined|Infinity/.test(hh)) out.push('NaN/undefined in the SVG (bad component input)'); svg.querySelectorAll('rect,line,path').forEach(e=>{ if(e.closest('clipPath')||e.closest('#subs')||e.closest('.nolint')) return; const r=e.getBoundingClientRect(); if(r.width>0&&r.bottom>965&&eff(e)>0.5) out.push('shape below the safe area (y '+Math.round(r.bottom)+')'); });
 const sub=[...svg.querySelectorAll('#subs text')]; sub.forEach(e=>{ if(e.getBoundingClientRect().width>1730) out.push('subtitle too wide'); });
 return out; }"""
def cmd_lint(a):
    from playwright.sync_api import sync_playwright
    script = json.load(open("script.json"))["scenes"]; tim = json.load(open("timing.json")); force = "--force" in a; a = [x for x in a if x != "--force"]; ids = ids_of(a, len(script)); build(); bad = 0
    try: lc = json.load(open("lint_cache.json"))
    except Exception: lc = {}
    lh = hashlib.sha1(LINT_JS.encode()).hexdigest()[:6]
    with sync_playwright() as p:
        b, pg, errs = page(p)
        for i in ids:
            ck = key(i, script[i - 1], tim) + lh
            if not force and lc.get(str(i)) == ck: print(f"scene {i}: ok (cached)"); continue
            lc.pop(str(i), None)
            if not pg.evaluate(f"window.BUILT[{i-1}]"): print(f"scene {i}: NOT BUILT"); bad += 1; continue
            D = tim[str(i)]["dur"]; t0 = sum(tim[str(j)]["dur"] for j in range(1, i)); msgs = {}; pg.evaluate("window.ERR.length=0"); errs.clear()
            s = 1.6
            try:
                while s < D - 1.3:
                    for m in pg.evaluate(LINT_JS, t0 + s): msgs.setdefault(m, []).append(round(s, 1))
                    s += 0.7
            except Exception as e: print(f"scene {i}: JS ERROR {str(e)[:200]}"); bad += 1; continue
            runs = []; last = None; start = 0.5; s = 0.5
            while s < D - 1.3:
                g = pg.evaluate("t => window.sig(t)", t0 + s)
                if g != last:
                    if last is not None and s - start > 3.5: runs.append((start, s))
                    last = g; start = s
                s += 0.1
            if last is not None and (D - 1.3) - start > 3.5: runs.append((start, D - 1.3))
            res = [f"{m} (t={ts[0]}..{ts[-1]})" for m, ts in msgs.items()][:8] + [f"static {x:.1f}-{y:.1f}s: add motion or a timed event" for x, y in runs]
            res += [f"{e} not found in narration" for e in pg.evaluate("window.ERR")] + errs; bad += bool(res)
            if not res: lc[str(i)] = ck
            print(f"scene {i}: " + ("ok" if not res else "")); [print("   ", r) for r in res]
        b.close()
    json.dump(lc, open("lint_cache.json", "w"))
    print("lint:", "all clear" if not bad else f"{bad} scene(s) to fix")
def cmd_sheet(a):
    from playwright.sync_api import sync_playwright
    from PIL import Image, ImageDraw
    tim = json.load(open("timing.json")); i = int(a[0]); D = tim[str(i)]["dur"]; t0 = sum(tim[str(j)]["dur"] for j in range(1, i)); build()
    ts = [float(x) for x in a[1:]] or sorted({min(D - 1.4, max(0.8, r[0] + 1.0)) for r in tim[str(i)]["sents"]} | {D - 1.6})[:6]
    os.makedirs("sheets", exist_ok=True); W, H = 640, 360; sheet = Image.new("RGB", (W * 3, H * ((len(ts) + 2) // 3)), "white")
    with sync_playwright() as p:
        b, pg, errs = page(p)
        for k, s in enumerate(ts):
            pg.evaluate("t => window.renderFrame(t)", t0 + s); import io
            im = Image.open(io.BytesIO(pg.screenshot(type="jpeg", quality=88))).resize((W, H)); ImageDraw.Draw(im).text((8, 6), f"{s:.1f}s", fill=(200, 0, 0)); sheet.paste(im, ((k % 3) * W, (k // 3) * H))
        b.close()
    sheet.save(f"sheets/s{i:02d}.jpg", quality=80); print(f"sheets/s{i:02d}.jpg  times {[round(x,1) for x in ts]}")
def cmd_assemble(a):
    import soundfile as sf, numpy as np
    script = json.load(open("script.json")); sc = script["scenes"]; tim = json.load(open("timing.json")); out = a[0] if a else ("draft.mp4" if DRAFT else "final.mp4"); segs = []
    if DRAFT and "draft" not in out: sys.exit("--draft output name must contain the word draft")
    for i in range(1, len(sc) + 1):
        g = glob.glob(f"{SEGS}/seg_{i:02d}_{key(i, sc[i-1], tim)}.mp4")
        if not g: sys.exit(f"scene {i} has no up-to-date segment: run  render {i}")
        segs.append(g[0])
    open(f"{SEGS}/list.txt", "w").write("".join(f"file '{B}/{s}'\n" for s in segs))
    with sf.SoundFile("full.wav", "w", 24000, 1, "PCM_16") as w:
        for i in range(1, len(sc) + 1):
            x, sr = sf.read(f"audio_{i}.wav", dtype="float32"); n = math.ceil(tim[str(i)]["dur"] * FPS) * sr // FPS
            w.write(np.concatenate([x, np.zeros(max(0, n - len(x)), dtype=np.float32)])[:n])
    meta = ";FFMETADATA1\ntitle=%s\n" % script.get("title", ""); t = 0.0; chap = []
    for i, s in enumerate(sc):
        d = math.ceil(tim[str(s["id"])]["dur"] * FPS) / FPS
        if chap and chap[-1][2] == s.get("chapter", ""): chap[-1][1] = t + d
        else: chap.append([t, t + d, s.get("chapter", "")])
        t += d
    if any(c[2] for c in chap):
        for c in chap: meta += "[CHAPTER]\nTIMEBASE=1/1000\nSTART=%d\nEND=%d\ntitle=%s\n" % (c[0] * 1000, c[1] * 1000 - 1, c[2])
    open(f"{SEGS}/meta.txt", "w").write(meta); total = t
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", f"{SEGS}/list.txt", "-i", "full.wav", "-i", f"{SEGS}/meta.txt", "-map", "0:v", "-map", "1:a", "-map_metadata", "2",
                    "-c:v", "copy", "-af", f"loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=in:st=0:d=0.3,afade=t=out:st={total-0.7:.2f}:d=0.7", "-ar", "48000", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", out], check=True)
    os.remove("full.wav"); print("wrote", out, f"{total:.1f}s")
    if any(c[2] for c in chap): print("chapters:"); [print(f"  {int(c[0]//60)}:{int(c[0]%60):02d}  {c[2]}") for c in chap]
def cmd_verify(a):
    f = a[0] if a else "final.mp4"; r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=codec_name,width,height,r_frame_rate,duration", "-of", "compact", f], capture_output=True, text=True).stdout; print(r.strip())
    v = subprocess.run(["ffmpeg", "-i", f, "-af", "volumedetect", "-vn", "-f", "null", "-"], capture_output=True, text=True).stderr
    print([l.split("] ")[1] for l in v.splitlines() if "mean_volume" in l or "max_volume" in l])
    from PIL import Image; d = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f], capture_output=True, text=True).stdout)
    W, H = 480, 270; n = 12; sh = Image.new("RGB", (W * 4, H * 3)); os.makedirs("sheets", exist_ok=True)
    for k in range(n):
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", f"{d*(k+0.5)/n:.2f}", "-i", f, "-frames:v", "1", "-vf", f"scale={W}:{H}", "sheets/_v.png"], check=True)
        sh.paste(Image.open("sheets/_v.png"), ((k % 4) * W, (k // 4) * H))
    nm = "sheets/" + os.path.splitext(os.path.basename(f))[0] + ".jpg"; sh.save(nm, quality=80); os.remove("sheets/_v.png"); print(nm, "(12 frames from the finished file)")
if __name__ == "__main__":
    c = sys.argv[1] if len(sys.argv) > 1 else ""
    {"build": lambda a: print("built from", len(build()), "files"), "lint": cmd_lint, "sheet": cmd_sheet, "render": cmd_render, "assemble": cmd_assemble, "verify": cmd_verify}.get(c, lambda a: print(__doc__))(sys.argv[2:])
