/* ===== PHYSICS / MATH COMPONENTS (use with scn). Closed forms only, so every frame is deterministic. Times `at` are seconds or narration phrases. ===== */
function niceStep(r){ r=r/4; const p=Math.pow(10,Math.floor(Math.log10(r))), f=r/p; return (f<1.5?1:f<3.5?2:f<7.5?5:10)*p; }
const fmtN=v=>String(Number(v.toFixed(2)));
/* graph: axes + curves drawn left to right. o:{x,y,w,h,xmin,xmax,ymin,ymax,xlabel,ylabel,at,xstep,ystep,curves:[{fn,at,dur,accent,dash,label,lx,ly}],pts:[{x,y,at,label,accent}]} (x,y = top-left of the plot box) */
function graph(s,o){ const a=tm(o.at), e=outCubic(ramp(s,a,a+0.8)); if(e<=0.01) return ''; const X=v=>o.x+o.w*(v-o.xmin)/(o.xmax-o.xmin), Y=v=>o.y+o.h*(o.ymax-v)/(o.ymax-o.ymin);
  const ay=(o.ymin<=0&&o.ymax>=0)?Y(0):o.y+o.h, ax=(o.xmin<=0&&o.xmax>=0)?X(0):o.x; let g=seg(o.x,ay,o.x+o.w,ay,e,INK,3)+seg(ax,o.y+o.h,ax,o.y,e,INK,3);
  const sx=o.xstep||niceStep(o.xmax-o.xmin), sy=o.ystep||niceStep(o.ymax-o.ymin), F={font:'nr',w:400,size:30,fill:SUB,op:e};
  for(let v=Math.ceil(o.xmin/sx)*sx;v<=o.xmax+1e-9;v+=sx){ if(Math.abs(v)<1e-9) continue; g+=seg(X(v),ay-8,X(v),ay+8,e,INK,2.5)+T(X(v),ay+42,fmtN(v),Object.assign({},F,{anchor:'middle'})); }
  for(let v=Math.ceil(o.ymin/sy)*sy;v<=o.ymax+1e-9;v+=sy){ if(Math.abs(v)<1e-9) continue; g+=seg(ax-8,Y(v),ax+8,Y(v),e,INK,2.5)+T(ax-18,Y(v)+10,fmtN(v),Object.assign({},F,{anchor:'end'})); }
  if(o.xlabel) g+=T(o.x+o.w,ay-16,o.xlabel,Object.assign({},F,{it:true,anchor:'end'})); if(o.ylabel) g+=T(ax+16,o.y-12,o.ylabel,Object.assign({},F,{it:true}));
  (o.curves||[]).forEach(c=>{ const ca=tm(c.at), p=ramp(s,ca,ca+(c.dur||2)); if(p<=0.01) return; const N=240, col=c.accent?ACC:INK; let d='', pen=false, lx=0, ly=0;
    for(let i=0;i<=N*p;i++){ const x=o.xmin+(o.xmax-o.xmin)*i/N, v=c.fn(x); if(!isFinite(v)||v<o.ymin-1e-9||v>o.ymax+1e-9){ pen=false; continue; } d+=(pen?'L':'M')+X(x).toFixed(1)+' '+Y(v).toFixed(1); pen=true; lx=X(x); ly=Y(v); }
    if(!d) return; g+=`<path d="${d}" fill="none" stroke="${col}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"${c.dash?' stroke-dasharray="14 12"':''}/>`+(p<1?`<circle cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="9" fill="${col}"/>`:'');
    if(c.label) g+=T(lx+(c.lx||16),ly+(c.ly||-16),c.label,{font:'nr',it:true,w:400,size:34,fill:col,op:ramp(s,ca+0.6,ca+1.2)}); });
  (o.pts||[]).forEach(q=>{ const pa=tm(q.at), pe=outCubic(ramp(s,pa,pa+0.5)); if(pe<=0.01) return; g+=`<circle cx="${X(q.x)}" cy="${Y(q.y)}" r="${11*pe}" fill="${q.accent?ACC:INK}"/>`+(q.label?T(X(q.x)+18,Y(q.y)-18,q.label,{font:'nr',it:true,w:400,size:34,fill:SUB,op:pe}):''); });
  return g; }
/* unitCircle: radius turning, with sin/cos shown as projections and a live readout; trace:true draws sin(theta) unrolled to the right. o:{cx,cy,r,at,speed(rad/s),angle(fixed radians),trace,tw,rx,ry} */
function unitCircle(s,o){ const a=tm(o.at), e=outCubic(ramp(s,a,a+0.8)); if(e<=0.01) return ''; const r=o.r||220, cx=o.cx, cy=o.cy, th=(typeof o.angle==='number')?o.angle:(o.speed===undefined?0.8:o.speed)*Math.max(0,s-a-0.6), c=Math.cos(th), sn=Math.sin(th), px=cx+r*c, py=cy-r*sn;
  let g=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${INK}" stroke-width="3" opacity="${e}"/>`+seg(cx-r-30,cy,cx+r+30,cy,e,RULE,2)+seg(cx,cy+r+30,cx,cy-r-30,e,RULE,2);
  if(th>0.05){ const ar=48, n=24; let d=''; for(let i=0;i<=n;i++){ const t=th%(2*Math.PI)*i/n; d+=(i?'L':'M')+(cx+ar*Math.cos(t)).toFixed(1)+' '+(cy-ar*Math.sin(t)).toFixed(1); } g+=`<path d="${d}" fill="none" stroke="${ACC}" stroke-width="4"/>`; }
  g+=seg(cx,cy,px,py,1,ACC,6)+dashLine(px,py,px,cy,INK,2.5,'8 8')+dashLine(px,py,cx,py,INK,2.5,'8 8')+seg(cx,cy,px,cy,1,INK,8,0.9)+seg(cx,cy,cx,py,1,INK,8,0.9)+`<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="13" fill="${ACC}"/>`;
  const deg=((th*180/Math.PI)%360+360)%360;
  g+=T(o.rx!==undefined?o.rx:cx-r,o.ry!==undefined?o.ry:cy-r-34,`angle ${deg.toFixed(0)}°   sin ${sn.toFixed(2)}   cos ${c.toFixed(2)}`,{w:700,size:34,op:e});
  if(o.trace){ const x0=cx+r+150, W=o.tw||680, per=W/(3*Math.PI), lim=Math.min(th,3*Math.PI); g+=seg(x0,cy,x0+W,cy,e,RULE,2); let d=''; const n=Math.max(2,Math.ceil(lim*20)); for(let i=0;i<=n;i++){ const t=lim*i/n; d+=(i?'L':'M')+(x0+t*per).toFixed(1)+' '+(cy-r*Math.sin(t)).toFixed(1); }
    if(lim>0.02) g+=`<path d="${d}" fill="none" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round"/>`+dashLine(px,py,x0+lim*per,cy-r*Math.sin(lim),RULE,2,'6 8')+`<circle cx="${(x0+lim*per).toFixed(1)}" cy="${(cy-r*Math.sin(lim)).toFixed(1)}" r="9" fill="${INK}"/>`; }
  return g; }
/* vecAdd: vectors placed tip to tail from (ox,oy), then the resultant in accent. vecs:[{x,y,label,at}] in math units (y up), scale px per unit, sumAt, sumLabel */
function vecAdd(s,o){ const sc=o.scale||100; let g='', x=o.ox, y=o.oy; const nrm=(dx,dy,k)=>{ const L=Math.hypot(dx,dy)||1; return [dy/L*k,-dx/L*k]; };
  o.vecs.forEach(v=>{ const a=tm(v.at), p=outCubic(ramp(s,a,a+0.8)), x2=x+v.x*sc, y2=y-v.y*sc; if(p>0.02){ g+=arrow(x,y,lerp(x,x2,p),lerp(y,y2,p),INK,5,1); if(v.label){ const n=nrm(x2-x,y2-y,38); g+=T((x+x2)/2+n[0],(y+y2)/2+n[1]+10,v.label,{font:'nr',it:true,w:400,size:34,fill:SUB,anchor:'middle',op:ramp(s,a+0.5,a+1.0)}); } } x=x2; y=y2; });
  const sa=tm(o.sumAt), sp=outCubic(ramp(s,sa,sa+1.0)); if(sp>0.02){ g+=arrow(o.ox,o.oy,lerp(o.ox,x,sp),lerp(o.oy,y,sp),ACC,7,1); if(o.sumLabel){ const n=nrm(x-o.ox,y-o.oy,-44); g+=T((o.ox+x)/2+n[0],(o.oy+y)/2+n[1]+10,o.sumLabel,{w:700,size:36,fill:ACC,anchor:'middle',op:ramp(s,sa+0.6,sa+1.2)}); } }
  return g; }
/* projectile: ball with dashed path, stroboscopic ghosts and velocity vectors (sideways ink, vertical accent). o:{x,y(ground),v0,angle,g,w,h,at,dur,ghosts,vectors} play time = dur seconds */
function projectile(s,o){ const a=tm(o.at), g0=o.g||9.81, v0=o.v0||20, th=(o.angle||45)*Math.PI/180, Tf=2*v0*Math.sin(th)/g0, R=v0*v0*Math.sin(2*th)/g0, H=v0*v0*Math.pow(Math.sin(th),2)/(2*g0), sc=Math.min((o.w||1300)/R,(o.h||340)/H), dur=o.dur||4, t=Math.min(Tf,Math.max(0,s-a)*Tf/dur), e=outCubic(ramp(s,a-0.5,a+0.3));
  if(e<=0.01) return ''; const P=tt=>[o.x+sc*v0*Math.cos(th)*tt,o.y-sc*(v0*Math.sin(th)*tt-0.5*g0*tt*tt)]; let d='';
  for(let i=0;i<=50;i++){ const p=P(Tf*i/50); d+=(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1); }
  let g=seg(o.x-40,o.y,o.x+R*sc+60,o.y,e,INK,4)+`<path d="${d}" fill="none" stroke="${RULE}" stroke-width="3" stroke-dasharray="10 12" opacity="${e}"/>`;
  const n=o.ghosts===undefined?8:o.ghosts; for(let k=1;k<=n;k++){ const tt=k*Tf/n; if(tt<t-0.001){ const p=P(tt); g+=`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="12" fill="${INK}" opacity="0.3"/>`; } }
  const b=P(t); g+=`<circle cx="${b[0].toFixed(1)}" cy="${b[1].toFixed(1)}" r="21" fill="${INK}"/>`;
  if(o.vectors!==false){ const vs=(o.vs||130/v0), fade=1-ramp(t,Tf*0.9,Tf), vx=v0*Math.cos(th), vy=v0*Math.sin(th)-g0*t; g+=arrow(b[0],b[1],b[0]+vx*vs,b[1],INK,5,fade)+arrow(b[0],b[1],b[0],b[1]-vy*vs,ACC,5,fade); }
  return g; }
/* spring: mass on a spring, damped closed form, with a live displacement graph. o:{x,y,len,amp,omega(rad/s),damp,at,plot,px,pw,win} (wall at x, rest position x+len) */
function spring(s,o){ const a=tm(o.at), e=outCubic(ramp(s,a-0.4,a+0.4)); if(e<=0.01) return ''; const len=o.len||520, A=o.amp||120, w0=o.omega||3.2, gam=o.damp===undefined?0.25:o.damp, wd=Math.sqrt(Math.max(0.01,w0*w0-gam*gam)), D=t=>A*Math.exp(-gam*t)*Math.cos(wd*t), t=Math.max(0,s-a), bx=o.x+len+D(t), y=o.y;
  let g=`<g opacity="${e}">`+seg(o.x,y-100,o.x,y+100,1,INK,8)+dashLine(o.x+len,y-110,o.x+len,y+110,RULE,2.5,'8 8'); const nz=14; let pth=`M ${o.x} ${y}`; for(let i=1;i<=nz;i++){ const xx=o.x+(bx-60-o.x)*i/nz; pth+=` L ${xx.toFixed(1)} ${(i===nz?y:y+(i%2?-30:30))}`; }
  g+=`<path d="${pth}" fill="none" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><rect x="${(bx-60).toFixed(1)}" y="${y-55}" width="120" height="110" fill="${PAPER}" stroke="${ACC}" stroke-width="5"/></g>`;
  if(o.plot!==false){ const pw=o.pw||700, px=o.px||o.x+len+A+200, win=o.win||9; g+=livePlot(px,y-130,pw,260,D,Math.min(t,win),0,win,-A*1.1,A*1.1,ACC,e); }
  return g; }
/* wave: travelling sine with one tracked particle that only moves up and down. o:{x,y,w,h,waves,freq(Hz),at,px(0..1),lambdaAt,lambdaLabel} */
function wave(s,o){ const a=tm(o.at), e=outCubic(ramp(s,a,a+0.8)); if(e<=0.01) return ''; const k=o.waves||3, f=o.freq===undefined?0.5:o.freq, t=Math.max(0,s-a), Y=x=>o.y-(o.h/2)*Math.sin(2*Math.PI*(k*(x-o.x)/o.w-f*t)); let d='';
  for(let i=0;i<=180;i++){ const x=o.x+o.w*i/180; d+=(i?'L':'M')+x.toFixed(1)+' '+Y(x).toFixed(1); }
  const px=o.x+o.w*(o.px===undefined?0.3:o.px), py=Y(px); let g=seg(o.x,o.y,o.x+o.w,o.y,e,RULE,2)+`<path d="${d}" fill="none" stroke="${INK}" stroke-width="5" stroke-linejoin="round" opacity="${e}"/>`+dashLine(px,o.y,px,py,ACC,3,'6 6',e)+`<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="14" fill="${ACC}" opacity="${e}"/>`;
  if(o.lambdaAt!==undefined){ const la=tm(o.lambdaAt), lo=ramp(s,la,la+0.6); g+=dim(o.x+20,o.y-o.h/2-46,o.x+20+o.w/k,o.y-o.h/2-46,o.lambdaLabel||'wavelength',{op:lo,ly:-22}); }
  return g; }
/* orbit: Kepler ellipse (exact, via Kepler's equation) with the Sun at the focus (cx,cy), a moving swept-area wedge. The ellipse spans cx-a(1+e) .. cx+a(1-e). o:{cx,cy,a,e,period,at,sweep(true),sweepT} */
function orbit(s,o){ const a=tm(o.at), e=outCubic(ramp(s,a-0.4,a+0.4)); if(e<=0.01) return ''; const A=o.a||420, ec=o.e===undefined?0.5:o.e, b=A*Math.sqrt(1-ec*ec), T0=o.period||8, t=Math.max(0,s-a);
  const pos=tt=>{ const M=((tt/T0)%1)*2*Math.PI; let E=M; for(let i=0;i<8;i++) E-=(E-ec*Math.sin(E)-M)/(1-ec*Math.cos(E)); return [o.cx+A*(Math.cos(E)-ec),o.cy-b*Math.sin(E)]; };
  let d=''; for(let i=0;i<=90;i++){ const E=2*Math.PI*i/90; d+=(i?'L':'M')+(o.cx+A*(Math.cos(E)-ec)).toFixed(1)+' '+(o.cy-b*Math.sin(E)).toFixed(1); }
  let g=`<path d="${d}" fill="none" stroke="${RULE}" stroke-width="3" stroke-dasharray="10 12" opacity="${e}"/>`;
  if(o.sweep!==false){ const w=o.sweepT||0.9; let pts=`${o.cx},${o.cy}`; for(let i=0;i<=12;i++){ const p=pos(Math.max(0,t-w)+(Math.min(t,w))*i/12); pts+=` ${p[0].toFixed(1)},${p[1].toFixed(1)}`; } g+=`<polygon points="${pts}" fill="${ACC}" opacity="0.28"/>`; }
  const p=pos(t); return g+`<circle cx="${o.cx}" cy="${o.cy}" r="26" fill="${INK}" opacity="${e}"/><circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="16" fill="${ACC}" opacity="${e}"/>`; }
