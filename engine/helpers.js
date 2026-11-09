/* ---------- part_helpers.js ---------- */
const PAPER="#EDEBE4", INK="#16171B", MUTED="#5C5D64", SUB="#34353B", RULE="#BDBAB0", ACC="#2536E6";
const clamp=x=>Math.max(0,Math.min(1,x));
const ramp=(s,a,b)=>clamp((s-a)/(b-a));               // 0..1 progress between times a and b
const outCubic=x=>1-Math.pow(1-x,3);
const outExpo=x=>x>=1?1:1-Math.pow(2,-10*x);
const inOutCubic=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
const lerp=(a,b,p)=>a+(b-a)*p;
const cvs=document.createElement('canvas').getContext('2d');
function norm(o){return Object.assign({font:'sg',w:700,size:40,fill:INK,it:false,op:1,anchor:'start',ls:0},o||{});}
function fstr(o){o=norm(o);return `${o.it?'italic ':''}${o.w} ${o.size}px ${o.font==='sg'?'SG':'NR'}`;}
function tw(str,o){cvs.font=fstr(o);return cvs.measureText(str).width;}   // measure text width
function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function T(x,y,str,o){o=norm(o); if(o.op<=0.005) return '';
  return `<text x="${x}" y="${y}" font-family="${o.font==='sg'?'SG':'NR'}" font-weight="${o.w}" font-size="${o.size}" font-style="${o.it?'italic':'normal'}" fill="${o.fill}" fill-opacity="${o.op}" text-anchor="${o.anchor}" letter-spacing="${o.ls}">${esc(str)}</text>`;}
// IMPORTANT: p<=0.01 returns nothing, otherwise a zero-length line draws a stray dot (round caps)
function seg(x1,y1,x2,y2,p,stroke,w,op){ if(p<=0.01) return ''; const x=x1+(x2-x1)*p, y=y1+(y2-y1)*p;
  return `<line x1="${x1}" y1="${y1}" x2="${x}" y2="${y}" stroke="${stroke||INK}" stroke-width="${w||3}" stroke-linecap="round"${op===undefined?'':` opacity="${op}"`}/>`;}
function headR(x,y,color,op){return `<path d="M${x-17} ${y-11} L${x} ${y} L${x-17} ${y+11}" fill="none" stroke="${color}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" opacity="${op}"/>`;}
function headD(x,y,color,op){return `<path d="M${x-11} ${y-17} L${x} ${y} L${x+11} ${y-17}" fill="none" stroke="${color}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" opacity="${op}"/>`;}
// typewriter text between times a and b, optional caret
function typed(x,y,str,s,a,b,o,caret){ o=norm(o); const p=ramp(s,a,b); const n=Math.floor(str.length*p+1e-6);
  const shown=str.slice(0,n); let out=T(x,y,shown,o);
  if(caret!==false && p>0 && p<1){ const w=tw(shown,o); out+=`<rect x="${x+w+4}" y="${y-o.size*0.74}" width="4" height="${o.size*0.86}" fill="${INK}"/>`; }
  return out; }
function rule(x1,x2,y,p,color,w){return seg(x1,y,x2,y,p,color||RULE,w||2);}   // hairline that draws across
// masked slide-up headline, max 2 lines, starts at t0. Default 112 px; shrinks by itself so the widest line fits 1680 px.
// dense scenes: headline(lines,s,t0,84)
function headline(lines,s,t0,size){ size=size||112; let o='';
  const wmax=Math.max(...lines.map(l=>tw(l,{font:'sg',w:800,size:size,ls:0})-2.5*l.length)); if(wmax>1680) size=Math.floor(size*1680/wmax);
  lines.forEach((ln,i)=>{ const e=outExpo(ramp(s,t0+i*0.13,t0+i*0.13+0.85)); const by=220+i*Math.round(size*1.04);
    o+=`<clipPath id="hc${i}"><rect x="100" y="${by-size*0.92}" width="1780" height="${size*1.25}"/></clipPath>`;
    o+=`<g clip-path="url(#hc${i})">${T(120,by+(1-e)*size*1.15,ln,{size:size,w:800,ls:-2.5})}</g>`; });
  return o; }
// timing from the real narration: seconds into this scene when a phrase is spoken (exact sentence times + position inside the sentence)
let CUR=0, SD=10; window.ERR=window.ERR||[];
function cue(ph){ const S=SENT[CUR], p=ph.toLowerCase();
  for(const r of S){ const i=r[2].toLowerCase().indexOf(p); if(i>=0) return r[0]+(r[1]-r[0])*i/Math.max(1,r[2].length); }
  if(window.ERR.indexOf('cue:'+ph)<0) window.ERR.push('cue:'+ph); return 0; }
function END(){ return SD-1.2; }                      // everything must be finished by here
// italic note that fades in at time t (a cue). o: {x anchor, fill, size}
function note(x,y,str,s,t,o){ o=o||{}; return T(x,y,str,{font:'nr',it:true,w:400,size:o.size||34,fill:o.fill||SUB,anchor:o.anchor||'start',op:ramp(s,t,t+0.6)*(o.op===undefined?1:o.op)}); }
