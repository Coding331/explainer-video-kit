/* Example scenes. scene<N> is the function for scene id N. Technique: stepped RK4 + live graph + cue()-timed note (1); seeded random walk + live counters (2). */
/* ===== 1: pendulum ===== */
function pendStep(st,dt){ const g=9.81, L=1, c=0.12;
  const f=(th,om)=>[om,-(g/L)*Math.sin(th)-c*om];
  const k1=f(st[0],st[1]), k2=f(st[0]+dt/2*k1[0],st[1]+dt/2*k1[1]), k3=f(st[0]+dt/2*k2[0],st[1]+dt/2*k2[1]), k4=f(st[0]+dt*k3[0],st[1]+dt*k3[1]);
  return [st[0]+dt/6*(k1[0]+2*k2[0]+2*k3[0]+k4[0]), st[1]+dt/6*(k1[1]+2*k2[1]+2*k3[1]+k4[1])]; }
const TH0=0.9, PEND=simTable([TH0,0],pendStep,1/240,12);
let OMMAX=0; PEND.out.forEach(st=>{ OMMAX=Math.max(OMMAX,Math.abs(st[1])); });
function scene1(s){
  let o=headline(["Height becomes speed."],s,0.05);
  const px=600, py=470, Lp=330, tau=Math.max(0,s-1.4);
  const st=simState(PEND,tau), th=st[0], om=st[1];
  const bx=px+Lp*Math.sin(th), by=py+Lp*Math.cos(th), e=outCubic(ramp(s,0.5,1.3));
  let d='';
  d+=seg(px-110,py,px+110,py,e,INK,7);
  for(let i=0;i<8;i++) if(px-100+i*28<=px-110+220*e) d+=`<line x1="${px-100+i*28}" y1="${py-4}" x2="${px-88+i*28}" y2="${py-22}" stroke="${INK}" stroke-width="2.5" stroke-linecap="round" opacity="${e}"/>`;
  d+=dashLine(px,py,px,py+Lp+40,RULE,2,'8 10',e);
  if(e>0.01) d+=`<line x1="${px}" y1="${py}" x2="${bx}" y2="${by}" stroke="${INK}" stroke-width="4" opacity="${e}"/><circle cx="${bx}" cy="${by}" r="28" fill="${INK}" opacity="${e}"/>`;
  // velocity arrow (accent = the quantity being explained)
  const vl=Lp*om*0.2; d+=arrow(bx,by,bx+Math.cos(th)*vl,by-Math.sin(th)*vl,ACC,6,ramp(s,1.4,2.0));
  // energy bars: height (ink) trades against speed (accent)
  const hv=(1-Math.cos(th))/(1-Math.cos(TH0)), sv=Math.abs(om)/OMMAX, be=ramp(s,1.0,1.8), base=880, mh=300;
  d+=`<g opacity="${be}"><rect x="120" y="${base-mh}" width="56" height="${mh}" fill="none" stroke="${RULE}" stroke-width="2"/><rect x="120" y="${base-mh*hv}" width="56" height="${mh*hv}" fill="${INK}"/>`;
  d+=`<rect x="210" y="${base-mh}" width="56" height="${mh}" fill="none" stroke="${RULE}" stroke-width="2"/><rect x="210" y="${base-mh*sv}" width="56" height="${mh*sv}" fill="${ACC}"/></g>`;
  d+=T(148,922,"height",{font:'nr',it:true,w:400,size:32,fill:SUB,anchor:'middle',op:be})+T(238,922,"speed",{font:'nr',it:true,w:400,size:32,fill:SUB,anchor:'middle',op:be});
  // live graph of angle over time
  d+=livePlot(1010,540,790,300,t=>simState(PEND,t)[0],tau,0,10.6,-0.95,0.95,INK,ramp(s,1.0,1.8));
  d+=T(1010,505,"angle over time",{font:'nr',it:true,w:400,size:34,fill:SUB,op:ramp(s,1.2,2.0)});
  d+=note(690,850,"fastest at the bottom",s,cue("moves fastest"),{size:32});   // appears when the narration says it
  d+=T(1800,884,"time",{font:'nr',it:true,w:400,size:32,fill:MUTED,anchor:'end',op:ramp(s,1.2,2.0)});
  return o+d; }


/* ===================== BIOLOGY 1: diffusion through a membrane (random motion, seeded) ===================== */
const DF={x0:160,x1:1160,y0:460,y1:880,mx:660,r:9,pores:[[560,640],[700,780]],N:70,sigma:170};
function diffInit(){ const r=mulberry(11), a=[]; for(let i=0;i<DF.N;i++){ a.push(185+r()*(DF.mx-35-185), 485+r()*(855-485)); } return a; }
const DIFF_R=mulberry(23);
function diffStep(st,dt){ const out=new Array(st.length), sg=DF.sigma*Math.sqrt(dt);
  for(let i=0;i<DF.N;i++){ let x=st[2*i], y=st[2*i+1], nx=x+sg*gauss(DIFF_R), ny=y+sg*gauss(DIFF_R);
    if(ny<DF.y0+DF.r){ ny=2*(DF.y0+DF.r)-ny; } if(ny>DF.y1-DF.r){ ny=2*(DF.y1-DF.r)-ny; }
    if(nx<DF.x0+DF.r){ nx=2*(DF.x0+DF.r)-nx; } if(nx>DF.x1-DF.r){ nx=2*(DF.x1-DF.r)-nx; }
    if((x<DF.mx)!==(nx<DF.mx)){ const yc=y+(ny-y)*(DF.mx-x)/(nx-x); const ok=DF.pores.some(p=>yc>p[0]+DF.r&&yc<p[1]-DF.r);
      if(!ok) nx=2*DF.mx-nx; }
    out[2*i]=nx; out[2*i+1]=ny; }
  return out; }
const DIFF=simTable(diffInit(),diffStep,1/60,12);
function scene2(s){
  let o=headline(["Particles spread out","on their own."],s,0.05);
  const tau=Math.max(0,s-1.6), st=simState(DIFF,tau), e=outCubic(ramp(s,0.5,1.3));
  let d=`<g opacity="${e}"><rect x="${DF.x0}" y="${DF.y0}" width="${DF.x1-DF.x0}" height="${DF.y1-DF.y0}" fill="none" stroke="${INK}" stroke-width="3"/>`;
  const wallSeg=[[DF.y0,560],[640,700],[780,DF.y1]]; wallSeg.forEach(w=>{ d+=`<line x1="${DF.mx}" y1="${w[0]}" x2="${DF.mx}" y2="${w[1]}" stroke="${INK}" stroke-width="7"/>`; }); d+='</g>';
  d+=T(DF.mx,436,"membrane with pores",{font:'nr',it:true,w:400,size:32,fill:SUB,anchor:'middle',op:ramp(s,0.9,1.6)});
  let left=0; for(let i=0;i<DF.N;i++){ const x=st[2*i], y=st[2*i+1]; if(x<DF.mx) left++; d+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${DF.r}" fill="${ACC}" opacity="${0.9*e}"/>`; }
  const right=DF.N-left, bb=880, mh=330, bw=90;
  d+=`<g opacity="${ramp(s,1.0,1.8)}"><line x1="1290" y1="${bb}" x2="1780" y2="${bb}" stroke="${INK}" stroke-width="2.5"/>`;
  d+=`<rect x="1340" y="${bb-mh*left/DF.N}" width="${bw}" height="${mh*left/DF.N}" fill="${ACC}"/><rect x="1500" y="${bb-mh*right/DF.N}" width="${bw}" height="${mh*right/DF.N}" fill="${ACC}"/></g>`;
  const lo=ramp(s,1.0,1.8);
  d+=T(1385,bb-mh*left/DF.N-14,String(left),{size:40,w:700,fill:INK,anchor:'middle',op:lo})+T(1545,bb-mh*right/DF.N-14,String(right),{size:40,w:700,fill:INK,anchor:'middle',op:lo});
  d+=T(1385,922,"left side",{font:'nr',it:true,w:400,size:32,fill:SUB,anchor:'middle',op:lo})+T(1545,922,"right side",{font:'nr',it:true,w:400,size:32,fill:SUB,anchor:'middle',op:lo});
  d+=T(1290,470,"particles on each side",{font:'nr',it:true,w:400,size:34,fill:SUB,op:ramp(s,1.2,2.0)});
  return o+d; }

