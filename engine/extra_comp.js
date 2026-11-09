/* ===== COMPONENTS: ready-made editorial elements. Times `at` are seconds OR a narration phrase (resolved with cue()). All draw with ink + one accent. ===== */
const tm=a=>{ if(a===undefined&&window.ERR.indexOf('at missing')<0) window.ERR.push('at missing'); return typeof a==='string'?cue(a):(a||0); };
const NOTE={font:'nr',it:true,w:400,size:34,fill:SUB};
/* auto-layout: wrap(str,maxW,o) -> lines that fit maxW px; TW(x,y,str,maxW,o,lh) -> wrapped multi-line text (returns svg); nl(str,maxW,o) -> line count */
function wrap(str,maxW,o){ const L=[]; let c=''; String(str).split(' ').forEach(w=>{ const t=c?c+' '+w:w; if(c&&tw(t,o)>maxW){ L.push(c); c=w; } else c=t; }); if(c) L.push(c); return L; }
function TW(x,y,str,maxW,o,lh){ o=norm(o); lh=lh||Math.round(o.size*1.25); return wrap(str,maxW,o).map((l,i)=>T(x,y+i*lh,l,o)).join(''); }
function nl(str,maxW,o){ return wrap(str,maxW,norm(o)).length; }
/* point at fraction u (0..1) along a polyline; closed=true wraps back to the first point */
function polyAt(pts,u,closed){ const P=closed?pts.concat([pts[0]]):pts; let L=0; const ls=[]; for(let i=1;i<P.length;i++){ const l=Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1]); ls.push(l); L+=l; }
  if(L<=0) return P[0]; let d=((u%1)+1)%1*L; for(let i=0;i<ls.length;i++){ if(d<=ls[i]&&ls[i]>0){ const f=d/ls[i]; return [P[i][0]+(P[i+1][0]-P[i][0])*f,P[i][1]+(P[i+1][1]-P[i][1])*f]; } d-=ls[i]; } return P[P.length-1]; }
/* dots travelling along a path. o:{pts,closed,n,speed(laps/s),r,fill,at,line(bool, draw the path),w} */
function pathParticles(s,o){ if(!o.pts||o.pts.length<2) return ''; const a=tm(o.at), e=ramp(s,a,a+0.8); if(e<=0.01) return ''; const n=o.n===undefined?8:o.n, r=o.r===undefined?9:o.r, spd=o.speed===undefined?0.08:o.speed; let g='';
  if(o.line!==false){ const P=o.closed?o.pts.concat([o.pts[0]]):o.pts; g+=`<path d="${P.map((p,i)=>(i?'L':'M')+p[0]+' '+p[1]).join('')}" fill="none" stroke="${o.stroke||RULE}" stroke-width="${o.w||4}" stroke-linejoin="round" opacity="${e}"/>`; }
  for(let k=0;k<n;k++){ const p=polyAt(o.pts,k/n+spd*Math.max(0,s-a),o.closed); g+=`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${r}" fill="${o.fill||ACC}" opacity="${e*0.95}"/>`; } return g; }
/* labelled boxes joined by arrows. nodes:[{id,x,y,text,at,accent}] (x,y = centre) links:[{from,to,at,label,flow,accent,lx,ly}] */
function nodeBox(nd){ const o={font:'sg',w:700,size:34}, L=wrap(nd.text,nd.maxW||380,o), w=Math.max(...L.map(l=>tw(l,o)))+56; return {w:w,h:76+(L.length-1)*42,x:nd.x,y:nd.y,L:L}; }
function edgePt(b,tx,ty){ const dx=tx-b.x, dy=ty-b.y; const k=Math.min(Math.abs(dx)>1e-6?(b.w/2+6)/Math.abs(dx):1e9,Math.abs(dy)>1e-6?(b.h/2+6)/Math.abs(dy):1e9); return [b.x+dx*k,b.y+dy*k]; }
function flow(s,o){ let g=''; const B={}; o.nodes.forEach(nd=>{ B[nd.id]=nodeBox(nd); });
  (o.links||[]).forEach(l=>{ const a=tm(l.at), p=outCubic(ramp(s,a,a+0.9)); if(p<=0.02) return; const A=B[l.from], C=B[l.to]; if(!A||!C) throw new Error('flow: unknown node '+(A?l.to:l.from)); const vert=Math.abs(C.x-A.x)<Math.abs(C.y-A.y); const p1=edgePt(A,C.x,C.y), p2=edgePt(C,A.x,A.y), col=l.accent?ACC:INK;
    g+=arrow(p1[0],p1[1],lerp(p1[0],p2[0],p),lerp(p1[1],p2[1],p),col,4,1);
    if(l.label) g+=T((p1[0]+p2[0])/2+(l.lx!==undefined?l.lx:(vert?24:0)),(p1[1]+p2[1])/2+(l.ly!==undefined?l.ly:(vert?8:-18)),l.label,Object.assign({},NOTE,{anchor:vert&&l.lx===undefined?'start':'middle',op:ramp(s,a+0.4,a+1.0)}));
    if(l.flow&&p>=1){ for(let k=0;k<3;k++){ const u=((s-a)*0.35+k/3)%1; g+=`<circle cx="${lerp(p1[0],p2[0],u)}" cy="${lerp(p1[1],p2[1],u)}" r="8" fill="${ACC}" opacity="${ramp(s,a+0.9,a+1.3)}"/>`; } } });
  o.nodes.forEach(nd=>{ const a=tm(nd.at), e=outCubic(ramp(s,a,a+0.7)); if(e<=0.01) return; const b=B[nd.id], col=nd.accent?ACC:INK;
    g+=`<g opacity="${e}"><rect x="${b.x-b.w/2}" y="${b.y-b.h/2+(1-e)*14}" width="${b.w}" height="${b.h}" fill="${PAPER}" stroke="${col}" stroke-width="3.5"/>`+b.L.map((l,i)=>T(b.x,b.y+12-(b.L.length-1)*21+i*42+(1-e)*14,l,{w:700,size:34,fill:col,anchor:'middle'})).join('')+`</g>`; });
  return g; }
/* horizontal bars that grow. o:{x,y,w,items:[{label,value,at,accent}],max,gap,unit} */
function bars(s,o){ let g=''; const n=o.items.length, gap=o.gap||Math.min(84,Math.floor((900-o.y)/Math.max(1,n-1))), mx=(o.max||Math.max(...o.items.map(i=>i.value)))||1, lw=o.labelW||Math.min(520,Math.max(330,Math.ceil(Math.max(...o.items.map(i=>tw(i.label,NOTE)))+40))), bw=(o.w||1100)-lw;
  o.items.forEach((it,i)=>{ const a=tm(it.at), p=outCubic(ramp(s,a,a+1.0)); if(p<=0.01) return; const y=o.y+i*gap, col=it.accent?ACC:INK, L=wrap(it.label,lw-30,NOTE);
    g+=L.map((l,k)=>T(o.x,y+12-(L.length-1)*19+k*38,l,Object.assign({},NOTE,{op:ramp(s,a,a+0.5)}))).join('')+`<rect x="${o.x+lw}" y="${y-18}" width="${Math.max(0,bw*it.value/mx*p)}" height="36" fill="${col}"/>`
      +T(o.x+lw+bw*it.value/mx*p+16,y+12,(it.value*p).toFixed(it.dec||0)+(o.unit||''),{w:700,size:36,fill:col,op:ramp(s,a,a+0.5)}); }); return g; }
/* numbered steps. o:{x,y,gap,items:[{title,note,at}]} */
function steps(s,o){ let g=''; if(!o.items.length) return ''; const nw=o.noteW||1500-90, H=o.items.map(it=>(o.gap||100)+(it.note?(nl(it.note,nw,NOTE)-1)*42:0)); let tot=H.reduce((a,b)=>a+b,0)-H[H.length-1], k=tot>900-o.y?(900-o.y)/tot:1; let y=o.y, ys=[];
  H.forEach(h=>{ ys.push(y); y+=h*k; });
  o.items.forEach((it,i)=>{ const a=tm(it.at), e=outCubic(ramp(s,a,a+0.7)); if(e<=0.01) return; const yy=ys[i];
    g+=T(o.x,yy+(1-e)*12,String(i+1),{w:800,size:64,fill:ACC,op:e})+T(o.x+90,yy-12+(1-e)*12,it.title,{w:700,size:44,op:e})+(it.note?TW(o.x+90,yy+34+(1-e)*12,it.note,nw,Object.assign({},NOTE,{op:e}),42):''); });
  const ts=o.items.map(i=>tm(i.at)), pr=ramp(s,Math.min(...ts),Math.max(...ts)+0.7), L=Math.max(0,ys[ys.length-1]-o.y);
  return (L>0?seg(o.x+30,o.y+40,o.x+30,o.y+40+L,pr,RULE,2):'')+g; }
/* two columns revealed row by row. o:{x,y,w,cols:[a,b],rows:[[left,right,at]],gap} */
function compare(s,o){ const w=o.w||1500, cw=w/2-70, cx=[o.x,o.x+w/2], F={font:'nr',w:400,size:40}; let g='';
  const H=o.rows.map(r=>Math.max(nl(r[0],cw,F),nl(r[1],cw,F))*48+(o.gap?o.gap-48:40)); let tot=H.reduce((a,b)=>a+b,0), k=tot>880-o.y-90?(880-o.y-90)/tot:1, y=o.y+90;
  o.cols.forEach((c,i)=>{ const e=outExpo(ramp(s,tm(o.colAt||0.4)+i*0.15,tm(o.colAt||0.4)+i*0.15+0.8)); g+=T(cx[i],o.y+(1-e)*18,c,{w:800,size:60,op:e,fill:(o.accentCol===i)?ACC:INK})+seg(cx[i],o.y+22,cx[i]+w/2-60,o.y+22,e,RULE,3); });
  o.rows.forEach((r,n)=>{ const a=tm(r[2]), e=outCubic(ramp(s,a,a+0.7)); if(e>0.01) [0,1].forEach(i=>{ g+=TW(cx[i],y+(1-e)*12,r[i],cw,{font:'nr',w:400,size:40,fill:i?INK:SUB,op:e},48); }); y+=H[n]*k; }); return g; }
/* formula built token by token. o:{x,y,size,parts:[{t,at,accent,sub}],gap} */
function equation(s,o){ let g='', x=o.x; const sz=o.size||96, gp=o.gap||28;
  o.parts.forEach(p=>{ const w=tw(p.t,{w:700,size:sz}), a=tm(p.at), e=outCubic(ramp(s,a,a+0.7));
    if(e>0.01){ g+=T(x,o.y+(1-e)*24,p.t,{w:700,size:sz,fill:p.accent?ACC:INK,op:e}); if(p.sub) g+=T(x,o.y+70,p.sub,Object.assign({},NOTE,{size:32,op:e})); } x+=w+gp; }); return g; }
/* end-of-chapter recap. o:{x,y,points:[text],at:[times] (optional, default spread over the scene),gap} */
function recap(s,o){ let g=''; const n=o.points.length, t0=0.9, span=Math.max(1,END()-t0-1.5), F={font:'nr',w:400,size:50}, mw=1500-90, H=o.points.map(t=>(o.gap||110)+(nl(t,mw,F)-1)*58); let tot=H.reduce((a,b)=>a+b,0)-H[n-1], k=tot>900-o.y?(900-o.y)/tot:1, y=o.y;
  o.points.forEach((t,i)=>{ const a=o.at?tm(o.at[i]):t0+span*i/n, e=outCubic(ramp(s,a,a+0.6)), c=ramp(s,a+0.2,a+0.7);
    if(e>0.01) g+=(c>0.02?`<path d="M ${o.x} ${y-14} L ${o.x+18} ${y+4} L ${o.x+52} ${y-34}" fill="none" stroke="${ACC}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="${1-c}"/>`:'')+TW(o.x+90,y+(1-e)*12,t,mw,{font:'nr',w:400,size:50,fill:INK,op:e},58); y+=H[i]*k; }); return g; }
/* scene wrapper: headline + body, with a slow push-in about the bottom-left safe corner (120,950) so the margin and the y=950 limit hold. Keep body content x<=1780, y<=930. scn(s,["Head"],body,{push:0.04,cx,cy,size}); push:0 turns it off */
function scn(s,lines,body,o){ o=o||{}; const z=1+(o.push===undefined?0.04:o.push)*ramp(s,0.5,END()); return headline(lines,s,0.05,o.size)+cam(body,o.cx===undefined?120:o.cx,o.cy===undefined?950:o.cy,z); }
