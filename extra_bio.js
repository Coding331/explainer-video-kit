/* ===== BIOLOGY / CHEMISTRY COMPONENTS (use with scn). Times `at` are seconds or narration phrases. ===== */
/* molecule: atoms [{x,y,el,accent,at}] (x,y in bond lengths, el = label like 'O','H2N','OH'; el '' = bare vertex), bonds [[a,b,order,at]] (indices). o:{x,y,scale(px per bond, 110),at,stagger,jig}. Presets: MOL.water() MOL.glucose() MOL.aminoAcid() MOL.chain(n,'COOH') */
function molecule(s,o){ const sc=o.scale||110, a0=tm(o.at), st=o.stagger===undefined?0.12:o.stagger, A=o.atoms, B=o.bonds||[];
  const P=A.map((a,i)=>{ const j=o.jig?o.jig*Math.sin(s*1.7+i*2.1):0, k=o.jig?o.jig*Math.cos(s*1.3+i*1.7):0; const r=a.el?Math.max(30,tw(a.el,{w:700,size:32})/2+14):0; return {x:o.x+a.x*sc+j,y:o.y+a.y*sc+k,r:r,t:a.at!==undefined?tm(a.at):a0+i*st}; });
  let g='';
  B.forEach((b,n)=>{ const p=P[b[0]], q=P[b[1]], t=b[3]!==undefined?tm(b[3]):Math.max(p.t,q.t)+0.2, e=outCubic(ramp(s,t,t+0.5)); if(e<=0.01) return; const dx=q.x-p.x, dy=q.y-p.y, L=Math.hypot(dx,dy)||1, ux=dx/L, uy=dy/L, x1=p.x+ux*(p.r?p.r+4:0), y1=p.y+uy*(p.r?p.r+4:0), x2=q.x-ux*(q.r?q.r+4:0), y2=q.y-uy*(q.r?q.r+4:0), ord=b[2]||1;
    for(let k=0;k<ord;k++){ const off=(k-(ord-1)/2)*13; g+=seg(x1-uy*off,y1+ux*off,x2-uy*off,y2+ux*off,e,INK,4); } });
  A.forEach((a,i)=>{ const p=P[i]; if(!a.el) return; const e=outCubic(ramp(s,p.t,p.t+0.5)); if(e<=0.01) return; const col=a.accent?ACC:INK;
    g+=`<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${(p.r*(0.6+0.4*e)).toFixed(1)}" fill="${a.accent?ACC:PAPER}" stroke="${col}" stroke-width="3.5" opacity="${e}"/>`+T(p.x,p.y+11,a.el,{w:700,size:32,fill:a.accent?PAPER:INK,anchor:'middle',op:e}); });
  return g; }
const MOL={
  water:()=>({atoms:[{x:0,y:0,el:'O',accent:true},{x:-0.78,y:0.62,el:'H'},{x:0.78,y:0.62,el:'H'}],bonds:[[0,1],[0,2]]}),
  aminoAcid:()=>({atoms:[{x:-1.3,y:0,el:'H2N'},{x:0,y:0,el:'C',accent:true},{x:1.3,y:0,el:'C'},{x:1.3,y:-1.1,el:'O'},{x:2.6,y:0,el:'OH'},{x:0,y:-1.1,el:'H'},{x:0,y:1.1,el:'R'}],bonds:[[0,1],[1,2],[2,3,2],[2,4],[1,5],[1,6]]}),
  glucose:()=>{ const at=[], bo=[], ring=[[30,'C'],[90,'O'],[150,'C'],[-150,'C'],[-90,'C'],[-30,'C']]; ring.forEach(r=>{ const a=r[0]*Math.PI/180; at.push({x:Math.cos(a),y:-Math.sin(a),el:r[1]==='O'?'O':''}); }); for(let i=0;i<6;i++) bo.push([i,(i+1)%6]);
    const sub=(i,ang,len,lab,next)=>{ const a=ang*Math.PI/180, v=at[i]; at.push({x:v.x+len*Math.cos(a),y:v.y-len*Math.sin(a),el:lab}); bo.push([i,at.length-1]); return at.length-1; };
    sub(0,30,0.9,'OH'); sub(5,-30,0.9,'OH'); sub(4,-90,0.9,'OH'); sub(3,-150,0.9,'OH'); const c=sub(2,150,0.9,''); sub(c,90,0.9,'OH'); return {atoms:at,bonds:bo}; },
  chain:(n,head)=>{ const at=[], bo=[]; for(let i=0;i<n;i++){ at.push({x:i*0.87,y:i%2?0.5:0,el:''}); if(i) bo.push([i-1,i]); } if(head){ at.push({x:-0.87,y:0.5,el:head}); bo.push([n,0]); } return {atoms:at,bonds:bo}; } };
/* helix: DNA-style double helix turning in pseudo-3D. o:{x,y,w,h,turns,rungs,at,speed,mark} (mark = rung index drawn in accent) */
function helix(s,o){ const a=tm(o.at), e=ramp(s,a,a+1.2); if(e<=0.01) return ''; const N=140, turns=o.turns||2.5, R=o.rungs||20, cy=o.y, h=o.h/2, ph=(o.speed===undefined?0.9:o.speed)*Math.max(0,s-a), items=[];
  const pt=(u,k)=>{ const th=u*turns*2*Math.PI+ph+k*Math.PI; return [o.x+o.w*u,cy+h*Math.sin(th),Math.cos(th)]; };
  for(let k=0;k<2;k++) for(let i=0;i<N;i++){ const u0=i/N*e, u1=(i+1)/N*e, p=pt(u0,k), q=pt(u1,k); items.push({z:(p[2]+q[2])/2,s:`<line x1="${p[0].toFixed(1)}" y1="${p[1].toFixed(1)}" x2="${q[0].toFixed(1)}" y2="${q[1].toFixed(1)}" stroke="${INK}" stroke-width="${(3+4*(p[2]+1)/2).toFixed(1)}" stroke-linecap="round" opacity="${(0.45+0.55*(p[2]+1)/2).toFixed(2)}"/>`}); }
  for(let r=0;r<R;r++){ const u=(r+0.5)/R; if(u>e) continue; const p=pt(u,0), q=pt(u,1), m=o.mark===r; items.push({z:0,s:`<line x1="${p[0].toFixed(1)}" y1="${p[1].toFixed(1)}" x2="${q[0].toFixed(1)}" y2="${q[1].toFixed(1)}" stroke="${m?ACC:RULE}" stroke-width="${m?6:3}" opacity="${0.35+0.65*Math.abs(Math.sin(u*turns*2*Math.PI+ph))}"/>`}); }
  return items.sort((x,y)=>x.z-y.z).map(i=>i.s).join(''); }
/* membrane: phospholipid bilayer. o:{x,y,w,n,at,tail,r,pore:[i0,i1]} y = top of the upper head row; pore leaves a channel gap (lipid index range) with protein walls in accent */
function membrane(s,o){ const a=tm(o.at), n=o.n||24, tail=o.tail||70, r=o.r||16, gap=o.w/n, mid=(n-1)/2, y0=o.y, y1=o.y+2*tail+2*r+14; let g='';
  for(let i=0;i<n;i++){ if(o.pore&&i>=o.pore[0]&&i<=o.pore[1]) continue; const e=outCubic(ramp(s,a+Math.abs(i-mid)/n*1.6,a+Math.abs(i-mid)/n*1.6+0.6)); if(e<=0.01) continue; const x=o.x+gap*(i+0.5), w=3*Math.sin(s*1.4+i*1.9);
    for(const [hy,dir] of [[y0,1],[y1,-1]]){ const hx=x+w*dir, ty=hy+dir*(r+tail)*e;
      g+=`<line x1="${(hx-6).toFixed(1)}" y1="${hy+dir*r}" x2="${(x-6+w).toFixed(1)}" y2="${ty.toFixed(1)}" stroke="${INK}" stroke-width="3" stroke-linecap="round" opacity="${e}"/><line x1="${(hx+6).toFixed(1)}" y1="${hy+dir*r}" x2="${(x+6+w).toFixed(1)}" y2="${ty.toFixed(1)}" stroke="${INK}" stroke-width="3" stroke-linecap="round" opacity="${e}"/><circle cx="${hx.toFixed(1)}" cy="${hy}" r="${r}" fill="${INK}" opacity="${e}"/>`; } }
  if(o.pore){ const e=outCubic(ramp(s,a+0.8,a+1.5)); if(e>0.01){ const xa=o.x+gap*o.pore[0], xb=o.x+gap*(o.pore[1]+1), top=y0-r, bot=y1+r; g+=`<g opacity="${e}"><rect x="${xa}" y="${top}" width="${gap*0.35}" height="${bot-top}" fill="${ACC}"/><rect x="${xb-gap*0.35}" y="${top}" width="${gap*0.35}" height="${bot-top}" fill="${ACC}"/></g>`; } }
  return g; }
/* cycle: boxes round an ellipse joined by arrows with dots moving round. o:{cx,cy,rx,ry,items:[{text,at,accent,maxW}],closeAt} */
function cycle(s,o){ const n=o.items.length; if(n<2) return '';
  const nodes=o.items.map((it,i)=>{ const an=-Math.PI/2+2*Math.PI*i/n; return {id:'c'+i,x:o.cx+o.rx*Math.cos(an),y:o.cy+o.ry*Math.sin(an),text:it.text,at:it.at,accent:it.accent,maxW:it.maxW||300}; });
  const links=o.items.map((it,i)=>({from:'c'+i,to:'c'+((i+1)%n),at:(i<n-1?tm(o.items[i+1].at):tm(o.closeAt!==undefined?o.closeAt:it.at)+0.8)+0.3,flow:true}));
  return flow(s,{nodes:nodes,links:links}); }
/* enzyme: lock-and-key. o:{x,y,at (substrate appears),bindAt,splitAt}; enzyme ink, substrate and products accent. Width about 440, height about 600 above y */
function enzyme(s,o){ const a=tm(o.at), b=tm(o.bindAt), c=tm(o.splitAt), e=outCubic(ramp(s,a-0.3,a+0.5)); const x=o.x, y=o.y;
  let g=`<path d="M ${x-220} ${y+90} L ${x-220} ${y-40} L ${x-90} ${y-40} L ${x-60} ${y+20} L ${x+60} ${y+20} L ${x+90} ${y-40} L ${x+220} ${y-40} L ${x+220} ${y+90} Z" fill="${PAPER}" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round" opacity="${outCubic(ramp(s,a-0.8,a-0.2))}"/>`;
  const mv=inOutCubic(ramp(s,b-1.4,b)), sp=inOutCubic(ramp(s,c,c+1.2)), wob=(1-mv)*8*Math.sin(s*3), sy=lerp(y-260,y-36,mv)+wob, sx=x+(1-mv)*40*Math.sin(s*1.3), d=sp*190;
  if(e>0.01){ g+=`<g opacity="${e}"><polygon points="${sx-80},${sy-4} ${sx-56},${sy+48} ${sx-2},${sy+48} ${sx-2},${sy-4}" fill="${ACC}" transform="translate(${-d} ${-d*1.2}) rotate(${-sp*14} ${sx-40} ${sy+20})"/><polygon points="${sx+80},${sy-4} ${sx+56},${sy+48} ${sx+2},${sy+48} ${sx+2},${sy-4}" fill="${ACC}" transform="translate(${d} ${-d*1.2}) rotate(${sp*14} ${sx+40} ${sy+20})"/></g>`; }
  return g; }
