/* Component demo: scenes 1-5 of a heat-pump video; cue phrases refer to its narration. Shows pathParticles, flow, bars+equation, compare, recap inside scn(). */
function scene1(s){
  const pts=[[360,520],[1560,520],[1560,860],[360,860]];
  let d=pathParticles(s,{pts:pts,closed:true,n:12,speed:0.07,at:0.8,w:5,stroke:INK});
  d+=note(360,470,"cold outside",s,cue("picks up heat outside"))+note(1200,470,"warm inside",s,cue("drops it off inside"),{anchor:'start'});
  d+=note(760,700,"refrigerant",s,cue("Refrigerant circulates"),{fill:ACC});
  return scn(s,["A heat pump moves heat."],d,{cy:690}); }
function scene2(s){
  const nodes=[{id:'e',x:420,y:560,text:'Evaporator',at:cue('evaporator')},{id:'c',x:1000,y:560,text:'Compressor',at:cue('compressor')},{id:'d',x:1500,y:560,text:'Condenser',at:cue('condenser'),accent:true},{id:'v',x:960,y:820,text:'Valve',at:cue('valve')}];
  const links=[{from:'e',to:'c',at:cue('compressor')+0.3,label:'gas',flow:true},{from:'c',to:'d',at:cue('condenser')+0.3,label:'hot gas'},{from:'d',to:'v',at:cue('valve')+0.3,label:'liquid'},{from:'v',to:'e',at:cue('valve')+1.0,label:'cold'}];
  return scn(s,["Four parts do the work."],flow(s,{nodes:nodes,links:links})); }
function scene3(s){
  let d=bars(s,{x:120,y:540,w:1300,max:4,unit:'',items:[{label:'electricity in',value:1,at:cue('every unit')},{label:'heat out',value:3,at:cue('three units of heat'),accent:true}]});
  d+=equation(s,{x:120,y:860,size:84,parts:[{t:'COP',at:cue('coefficient'),accent:true,sub:'ratio'},{t:'=',at:cue('That ratio')},{t:'heat out',at:cue('three units')},{t:'/',at:cue('That ratio')+0.3},{t:'work in',at:cue('electricity')}]});
  return scn(s,["One unit in, three out."],d,{push:0.03}); }
function scene4(s){ return scn(s,["Move it, do not make it."],compare(s,{x:120,y:470,w:1560,cols:['Furnace','Heat pump'],rows:[['burns fuel','moves existing heat',cue('burns fuel')],['makes heat','heat already exists',cue('only moves')]]})); }
function scene5(s){ return scn(s,["Three things to remember."],recap(s,{x:120,y:520,points:['Heat is moved, not made.','Four parts form a loop.','One unit of power gives about three of heat.'],at:['Heat is moved','Four parts','About three']})); }
