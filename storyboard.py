"""Storyboard first: approve a one-line-per-scene outline BEFORE spending tokens on narration and code.
  python3 storyboard.py new [storyboard.md]   -> script.json skeleton (narration "TODO", word targets) + brief.md (motion-brief rows with component suggestions)
  python3 storyboard.py check                 -> after narration is written: warns about TODO, missing ids, words far from target
storyboard.md format:   # Video title
                        ## Chapter name            (optional, applies to the scenes below it)
                        1 | Heading line one / line two | what moves, in one line | 20s      (seconds optional, default 20)"""
import sys, re, json
RULES = [("molecule", r"molecule|atom|bond|glucose|sugar|amino|water|ring|carbon|chemical"), ("helix", r"dna|helix|strand|gene|rung"), ("membrane", r"membrane|bilayer|lipid|channel|pore"),
         ("enzyme", r"enzyme|substrate|lock|active site"), ("cycle", r"cycle|loop|circuit|round"), ("compare", r"\bvs\b|versus|compare|difference|contrast"),
         ("steps", r"steps?|process|stages?|sequence|first"), ("bars", r"how much|bars?|amount|percent|ratio|count"), ("equation", r"equation|formula|law|=|rule"),
         ("recap", r"recap|summary|remember|review"), ("flow", r"flow|pathway|chain|transfer|from .* to"), ("simTable/livePlot", r"fall|swing|orbit|wave|speed|motion|spread|diffus|random|grow")]
def suggest(text):
    t = text.lower(); out = [n for n, rx in RULES if re.search(rx, t)]
    return ", ".join(out[:3]) or "custom (simTable or keyframes)"
def parse(p):
    title, chap, rows = "Video", "", []
    for ln in open(p).read().splitlines():
        ln = ln.strip()
        if not ln: continue
        if ln.startswith("## "): chap = ln[3:].strip(); continue
        if ln.startswith("# "): title = ln[2:].strip(); continue
        m = re.match(r"(\d+)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*(?:\|\s*(\d+)\s*s?)?\s*$", ln)
        if m: rows.append({"id": int(m[1]), "chapter": chap, "heading": [x.strip() for x in m[2].split("/")][:2], "visual": m[3], "sec": int(m[4] or 20)})
    return title, rows
def words(sec): return max(20, round(2.4 * (sec - 1.4 - 1.1)))   # 0.3 s lead is inside the 1.4; 1.1 s end pad
def cmd_new(a):
    p = a[0] if a else "storyboard.md"; title, rows = parse(p)
    if [r["id"] for r in rows] != list(range(1, len(rows) + 1)): sys.exit("scene ids must be 1..N in order")
    sc = [{"id": r["id"], "chapter": r["chapter"], "heading": r["heading"], "visual": r["visual"], "narration": "TODO (about %d words)" % words(r["sec"])} for r in rows]
    json.dump({"title": title, "scenes": sc}, open("script.json", "w"), indent=1)
    b = "| id | heading | what moves | words | components to try |\n|---|---|---|---|---|\n" + "".join("| %d | %s | %s | %d | %s |\n" % (r["id"], " / ".join(r["heading"]), r["visual"], words(r["sec"]), suggest(r["visual"] + " " + " ".join(r["heading"]))) for r in rows)
    open("brief.md", "w").write(b); print(b); print("wrote script.json (narration TODO) and brief.md; total about %d s" % sum(r["sec"] for r in rows))
def cmd_check(a):
    sc = json.load(open("script.json"))["scenes"]; bad = 0
    for s in sc:
        n = len(s["narration"].split()); m = re.search(r"about (\d+) words", s["narration"])
        if "TODO" in s["narration"]: print("scene", s["id"], "narration still TODO"); bad += 1
    if [s["id"] for s in sc] != list(range(1, len(sc) + 1)): print("ids are not 1..N"); bad += 1
    print("storyboard check:", "ok" if not bad else "%d problem(s)" % bad)
if __name__ == "__main__":
    {"new": cmd_new, "check": cmd_check}.get(sys.argv[1] if len(sys.argv) > 1 else "", lambda a: print(__doc__))(sys.argv[2:])
