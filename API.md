# Scene API (engine/helpers.js, engine/sim.js). Scene functions are plain JS: `function scene<id>(s){ ... return svgString; }`, s = seconds since scene start.
Start every scene with `let o=headline(["Line one","line two"],s,0.05);` (max 2 lines, auto-fits; `headline(lines,s,0.05,84)` for dense scenes). Build the diagram as a string `d`, finish with `return o+d;`.
Colours: PAPER INK SUB MUTED RULE ACC. The accent has ONE meaning per video.
| Call | Does |
|---|---|
| `T(x,y,str,{font:'sg'/'nr',w,size,fill,it,op,anchor,ls})` | text. Newsreader italic 34 for labels: `{font:'nr',it:true,w:400,size:34,fill:SUB}` |
| `note(x,y,str,s,t,{size,fill,anchor,op})` | italic label that fades in at time t |
| `cue("exact words")` | seconds into the scene when those words are spoken (exact sentence times, position inside the sentence). Use it for every label: `note(x,y,"...",s,cue("moves fastest"))`. Accurate to about 0.5 s inside a long sentence. Call it only inside the scene function. A phrase not in the narration is reported by lint |
| `END()` | last moment anything may still be changing (scene end - 1.2 s) |
| `typed(x,y,str,s,a,b,opts)` | typewriter text with caret |
| `seg(x1,y1,x2,y2,p,stroke,w,op)` | line drawn to progress p (returns '' when p<=0.01: never draw a zero-length line) |
| `rule(x1,x2,y,p)` | hairline drawing across |
| `arrow(x1,y1,x2,y2,color,w,op)` `dim(x1,y1,x2,y2,"label",{color,op,lx,ly})` `dashLine(x1,y1,x2,y2,color,w,pat,op)` | vector, bracket with label, dashed guide |
| `livePlot(x,y,w,h,fn,s,t0,t1,ymin,ymax,color,op)` | axes + trace up to now + moving dot, `fn(t)` from the same state as the motion |
| `cam(inner,cx,cy,z)` | zoom a diagram (never the headline) about a point; use `z=1+0.05*ramp(s,0.5,END())` as a slow push-in on still diagrams |
| `simTable(init,stepFn,dt,T)` `simState(tab,s)` `mulberry(seed)` `gauss(rng)` | precompute stepped or random motion once (T must exceed the scene length, e.g. 20: motion freezes after T) (deterministic, order-independent). Never use Math.random or mutable state inside a scene |
| `ramp(s,a,b)` `clamp` `lerp(a,b,p)` `outCubic` `outExpo` `inOutCubic` `tw(str,opts)` | progress 0..1 between times, easing, text width |
**Components (engine/extra_comp.js): use these before writing raw SVG.** Every `at` is seconds or a narration phrase (`"valve"` = when it is spoken). Wrap in `scn(s,["Headline"],body,{push:0.04})` (headline + slow push-in so nothing sits dead). See examples/ex_components.js.
| Call | Does |
|---|---|
| `flow(s,{nodes:[{id,x,y,text,at,accent}],links:[{from,to,at,label,flow,accent,lx,ly}]})` | rectangular boxes (x,y = centre, keep y<=880) joined by arrows that draw in; `flow:true` adds dots moving along the link |
| `pathParticles(s,{pts:[[x,y],...],closed,n,speed,r,fill,at,line,w,stroke})` | a path with dots travelling along it (cycles, circuits, blood flow); `polyAt(pts,u,closed)` gives a point on it |
| `bars(s,{x,y,w,items:[{label,value,at,accent,dec}],max,unit,gap,labelW})` | horizontal bars that grow with a counting number |
| `steps(s,{x,y,gap,items:[{title,note,at}]})` | accent digits, bold titles, italic notes, a hairline down the side |
| `compare(s,{x,y,w,cols:[a,b],rows:[[left,right,at]],gap (height of a one-line row, default 88),colAt,accentCol})` | two columns revealed row by row (headers ink; accentCol = 0 or 1 only if the accent means that column) |
| `equation(s,{x,y,size,gap,parts:[{t,at,accent,sub}]})` | formula built token by token |
| `recap(s,{x,y,gap,points:[...],at:[phrases or seconds]})` | check marks draw beside each point (at omitted = spread evenly) |
| `cycle(s,{cx,cy,rx,ry,items:[{text,at,accent,maxW}],closeAt})` | boxes round an ellipse (rx about 420-560, ry about 200-240) with arrows and dots going round |
| `molecule(s,{x,y,scale,at,stagger,jig,atoms:[{x,y,el,accent,at}],bonds:[[a,b,order,at]]})` | atoms (x,y in bond lengths, `el` the label, '' = bare vertex) appear one by one, bonds draw between them, `jig` px of thermal wobble. Presets: `Object.assign({x,y,scale},MOL.water())`, `MOL.glucose()`, `MOL.aminoAcid()`, `MOL.chain(n,'COOH')`; scale about 150-200 |
| `helix(s,{x,y,w,h,turns,rungs,at,speed,mark})` | double helix turning in pseudo-3D; `mark` = index of the rung drawn in accent (can move with s) |
| `membrane(s,{x,y,w,n,at,tail,r,pore:[i0,i1]})` | phospholipid bilayer (y = top row of heads, about 250 px tall); `pore` leaves a channel with accent protein walls |
| `enzyme(s,{x,y,at,bindAt,splitAt})` | lock-and-key: substrate drops into the pocket at bindAt and splits in two at splitAt (about 440 px wide, put it right of other content) |
| `graph(s,{x,y,w,h,xmin,xmax,ymin,ymax,xlabel,ylabel,at,curves:[{fn,at,dur,accent,dash,label,lx,ly}],pts:[{x,y,at,label,accent}]})` | axes with ticks and curves drawn left to right (x,y = top-left of the plot box; points outside the y range are skipped, so asymptotes break cleanly) |
| `unitCircle(s,{cx,cy,r,at,speed,angle,trace,tw,rx,ry})` | radius turning with sin/cos projections and a live readout; `trace:true` unrolls sin to the right (keep cx+r+150+tw <= 1780) |
| `vecAdd(s,{ox,oy,scale,vecs:[{x,y,label,at}],sumAt,sumLabel})` | vectors tip to tail (math units, y up), then the resultant in accent |
| `projectile(s,{x,y,v0,angle,g,w,h,at,dur,ghosts,vectors})` | ball with dashed path, stroboscopic ghosts and velocity vectors (sideways ink, vertical accent) fading before landing; y = ground line, scaled to fit w x h; plays in `dur` s |
| `spring(s,{x,y,len,amp,omega,damp,at,plot,px,pw,win})` | damped mass on a spring (closed form) with a live displacement graph; wall at x |
| `wave(s,{x,y,w,h,waves,freq,at,px,lambdaAt,lambdaLabel})` | travelling sine, one tracked particle moving only up and down, optional wavelength bracket |
| `orbit(s,{cx,cy,a,e,period,at,sweep,sweepT})` | exact Kepler ellipse with the Sun at the focus (cx,cy) and a moving swept-area wedge; spans cx-a(1+e)..cx+a(1-e), height 2a*sqrt(1-e*e) (keep it under about 560) |
| `wrap(str,maxW,opts)` `TW(x,y,str,maxW,opts,lineHeight)` `nl(str,maxW,opts)` | auto-layout: lines that fit a width, wrapped text as svg, line count |
Component limits (text now wraps: flow box text up to `maxW` 380 px, bar labels to 520 px, steps notes, compare cells, recap points; spacing adjusts and shrinks to fit above y=900, but a very long scene still needs shorter text, and lint flags labels over 14 words): keep bars <=6, steps <=5, compare <=6 rows, recap <=5 points, labels short; if lint says "outside safe area", shorten the text or lower `size`/`gap` before dropping to raw SVG. Inside `scn` keep x<=1780 and y<=930 (equation sub labels sit at y+70). `scn` zooms about (120,950); its push-in counts as motion for lint's static check. Never name your own functions flow, steps, bars, compare, equation, recap, cycle, molecule, helix, membrane, enzyme, graph, unitCircle, vecAdd, projectile, spring, wave, orbit, niceStep, fmtN, wrap, TW, nl, MOL, tm, polyAt, scn. Shared helper functions go in `scenes/00_helpers.js` (a file with no scene function); define scenes only as `function scene<id>(s)`, never `window.scene<id>=`.
Unique ids: every clipPath/gradient id inside a scene must be unique (`hc0` and `hc1` are taken by headline). Helper functions you add must carry a prefix (`cb_`, `lp_`) so scene files never collide.
Layout: left margin x=120; headline up to y=336 (one line: free down to y=300); diagram zone x 120-1800, y 420-950 (300-950 with a one-line headline); nothing but subtitles below y=950. Minimum text size 30 px.
