/* ===== SIM LIBRARY ===== */
const cl=(x,a,b)=>Math.max(a,Math.min(b,x));
function mulberry(seed){ let a=seed>>>0; return function(){ a=(a+0x6D2B79F5)>>>0; let t=a; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; }; }
function gauss(r){ let u=0; while(u===0) u=r(); const v=r(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); }
function simTable(init,step,dt,T){ const out=[init]; let st=init; const n=Math.ceil(T/dt); for(let i=0;i<n;i++){ st=step(st,dt); out.push(st); } return {dt:dt,out:out}; }
function simAt(tab,s){ const x=cl(s/tab.dt,0,tab.out.length-1.001); const i=Math.floor(x); return {a:tab.out[i],b:tab.out[i+1],f:x-i}; }
function mixArr(a,b,f){ return a.map((v,i)=>v+(b[i]-v)*f); }
function simState(tab,s){ const r=simAt(tab,s); return mixArr(r.a,r.b,r.f); }

/* arrow with a filled head, pointing along (x1,y1)->(x2,y2) */
function arrow(x1,y1,x2,y2,color,w,op){ const dx=x2-x1, dy=y2-y1, L=Math.hypot(dx,dy); if(L<6) return '';
  const ux=dx/L, uy=dy/L, hl=Math.min(24,L*0.5), hw=hl*0.52, bx=x2-ux*hl, by=y2-uy*hl; w=w||4; op=op===undefined?1:op; if(op<=0.01) return '';
  return `<g opacity="${op}"><line x1="${x1}" y1="${y1}" x2="${bx}" y2="${by}" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/><polygon points="${x2},${y2} ${bx-uy*hw},${by+ux*hw} ${bx+uy*hw},${by-ux*hw}" fill="${color}"/></g>`; }
/* dimension bracket with end ticks and an italic label (lx, ly nudge the label) */
function dim(x1,y1,x2,y2,label,o){ o=o||{}; const col=o.color||INK, op=o.op===undefined?1:o.op; if(op<=0.01) return '';
  const dx=x2-x1, dy=y2-y1, L=Math.hypot(dx,dy)||1, nx=-dy/L, ny=dx/L, t=12;
  let g=`<g opacity="${op}" stroke="${col}" stroke-width="2.5" stroke-linecap="round"><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/><line x1="${x1-nx*t}" y1="${y1-ny*t}" x2="${x1+nx*t}" y2="${y1+ny*t}"/><line x1="${x2-nx*t}" y1="${y2-ny*t}" x2="${x2+nx*t}" y2="${y2+ny*t}"/></g>`;
  if(label) g+=T((x1+x2)/2+(o.lx||0),(y1+y2)/2+(o.ly||0),label,{font:'nr',it:true,w:400,size:o.size||34,fill:o.labelFill||col,anchor:o.anchor||'middle',op:op});
  return g; }
function dashLine(x1,y1,x2,y2,color,w,pat,op){ if(op!==undefined&&op<=0.01) return ''; return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${w||2}" stroke-dasharray="${pat||'8 10'}" opacity="${op===undefined?1:op}"/>`; }
/* live graph: axes plus a trace drawn from t0 up to the current time, with a moving dot */
function livePlot(x,y,w,h,fn,s,t0,t1,ymin,ymax,color,op){ op=op===undefined?1:op; if(op<=0.01) return '';
  let o=`<g opacity="${op}"><line x1="${x}" y1="${y+h}" x2="${x+w}" y2="${y+h}" stroke="${INK}" stroke-width="2.5"/><line x1="${x}" y1="${y}" x2="${x}" y2="${y+h}" stroke="${INK}" stroke-width="2.5"/>`;
  if(ymin<0&&ymax>0){ const zy=y+h*(ymax/(ymax-ymin)); o+=dashLine(x,zy,x+w,zy,RULE,2,'6 8'); }
  const tEnd=Math.min(s,t1);
  if(tEnd>t0+0.02){ const n=260; let d='', px=0, py=0;
    for(let i=0;i<=n;i++){ const t=t0+(tEnd-t0)*i/n; px=x+w*(t-t0)/(t1-t0); py=y+h*(ymax-fn(t))/(ymax-ymin); d+=(i?'L':'M')+px.toFixed(1)+' '+py.toFixed(1); }
    o+=`<path d="${d}" fill="none" stroke="${color||INK}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${px}" cy="${py}" r="9" fill="${color||INK}"/>`; }
  return o+'</g>'; }
/* camera: wrap a diagram (NOT the headline) to zoom about (cx,cy) */
function cam(inner,cx,cy,z){ return `<g transform="translate(${cx} ${cy}) scale(${z}) translate(${-cx} ${-cy})">${inner}</g>`; }
