/* ---------- tail.js: subtitles from exact sentence times, chapter tag, renderFrame ---------- */
function subtitles(idx,s){
  const F={font:'nr',w:400,size:32}, MAXW=1680; let out='';
  SENT[idx].forEach((r,k)=>{ const a=r[0]-0.05, b=(k===SENT[idx].length-1)?DUR[idx]-PAD+0.35:SENT[idx][k+1][0]-0.05;
    const op=ramp(s,a,a+0.12)*(1-ramp(s,b-0.12,b)); if(op<=0) return;
    let lines=[r[2]];
    if(tw(r[2],F)>MAXW){ const w=r[2].split(' '); let best=null;
      for(let i=1;i<w.length;i++){ const l1=w.slice(0,i).join(' '), l2=w.slice(i).join(' '), m=Math.max(tw(l1,F),tw(l2,F)); if(best===null||m<best.m) best={m,l1,l2}; }
      lines=[best.l1,best.l2]; }
    const y0=1010-(lines.length-1)*42;
    lines.forEach((l,i)=>{ out+=T(120,y0+i*42,l,{font:'nr',w:400,size:32,fill:SUB,op:op}); }); });
  return `<g id="subs">${out}</g>`; }
const chapterTag=c=>c?T(120,64,c,{font:'nr',it:true,w:400,size:30,fill:MUTED}):'';
function placeholderScene(i){ return function(s){ return headline(HEAD[i],s,0.05)+T(120,620,'scene '+(i+1)+' not built',{font:'nr',it:true,w:400,size:40,fill:MUTED}); }; }
const SCENES=DUR.map((_,i)=>typeof window['scene'+(i+1)]==='function'?window['scene'+(i+1)]:placeholderScene(i));
window.BUILT=DUR.map((_,i)=>typeof window['scene'+(i+1)]==='function');
const TOTAL=DUR.reduce((a,b)=>a+b,0); window.TOTAL=TOTAL;
window.START=DUR.map((_,i)=>DUR.slice(0,i).reduce((a,b)=>a+b,0));
window.ready=Promise.all(['800 96px SG','700 40px SG','500 40px SG','400 40px NR','italic 400 40px NR','500 40px NR'].map(f=>document.fonts.load(f))).then(()=>document.fonts.ready);
window.renderFrame=function(t){
  t=Math.min(t,TOTAL-0.001); let acc=0, idx=0;
  for(let i=0;i<DUR.length;i++){ if(t<acc+DUR[i]){idx=i;break;} acc+=DUR[i]; idx=i; }
  const s=t-acc, D=DUR[idx]; CUR=idx; SD=D;
  const ex=ramp(s,D-0.5,D-0.1);                       // scene exit: fade and slide left 40 px
  const body=`<g opacity="${1-ex}" transform="translate(${-40*outCubic(ex)} 0)">${SCENES[idx](s)}</g>`;
  const tagOp=(CHAP[idx]!==CHAP[idx-1])?ramp(s,0.3,1.0):1;
  document.getElementById('svg').innerHTML=`<g opacity="${tagOp*(CHAP[idx]!==CHAP[idx+1]?1-ex:1)}">${chapterTag(CHAP[idx])}</g>`+body+subtitles(idx,s);
  return idx; };
window.sig=function(t){ renderFrame(t); const h=document.getElementById('svg').innerHTML; let x=5381; for(let i=0;i<h.length;i++) x=((x<<5)+x+h.charCodeAt(i))|0; return x+':'+h.length; };
</script></body></html>
