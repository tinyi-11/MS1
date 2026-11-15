// Where thoughts go: screens, circle, and matching. Data comes from data.js.
const $=id=>document.getElementById(id),NS='http://www.w3.org/2000/svg';
const go=n=>{document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('on',s.id==='s'+n));window.scrollTo(0,0)};
const ns=(t,a)=>{const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);return e};
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;');

// ---------- 1. Draw the circle: one line per thought ----------
const svg=$('svg'),c=$('c'),cx=450,cy=450,R=230;
const def='<b>'+D.length+'</b><span>thoughts from 32 DT students</span><span>Point at or tap a line</span>';
c.innerHTML=def;
svg.append(ns('circle',{cx,cy,r:R,fill:'none',stroke:'var(--ring)','stroke-width':.8}));
const byG={},V=[],A=[],hits=ns('g',{}),step=2*Math.PI/D.length;let a=Math.PI/2;
T.forEach((name,k)=>{
 const rows=D.map((d,i)=>[d,i]).filter(r=>r[0][1]===k),mid=a-rows.length*step/2;
 const lx=cx+R*1.55*Math.cos(mid),ly=cy-R*1.55*Math.sin(mid),t=ns('text',{y:ly});
 name.replace(' & ',' &\n').split('\n').forEach((s,j)=>{const ts=ns('tspan',{x:lx,dy:j?'1.25em':0});
  if(!j){const dot=ns('tspan',{style:'fill:var(--c'+k+')'});dot.textContent='● ';ts.append(dot)}
  ts.append(document.createTextNode(s));t.append(ts)});
 svg.append(t);
 rows.forEach(([d,i],j)=>{const th=a-j*step,L=.12+.07*Math.min(d[4]-1,6),tl=d[2];A[i]=th;
  const [r0,r1]=tl==0?[1-.04-L/6,1+.04+L/6]:tl>0?[1,1+2*L]:[1,1-2*L];  // on the ring / in / out
  const at={x1:cx+R*r0*Math.cos(th),y1:cy-R*r0*Math.sin(th),x2:cx+R*r1*Math.cos(th),y2:cy-R*r1*Math.sin(th)};
  const v=ns('line',{...at,class:'v',style:'stroke:var(--c'+k+')'}),h=ns('line',{...at,class:'h'});
  h.dataset.i=i;V[i]=v;svg.append(v);hits.append(h);(byG[d[3]]=byG[d[3]]||[]).push(v)});
 a-=rows.length*step});
svg.append(hits);

// ---------- 2. Hover: light up a similar-thought group ----------
let cur=-1,curEl=null;
function clear(){svg.classList.remove('dim');svg.querySelectorAll('.on,.cur').forEach(v=>v.classList.remove('on','cur'));cur=-1;curEl=null}
function off(){clear();c.innerHTML=def}
function light(g){if(g!==cur){clear();cur=g;svg.classList.add('dim');(byG[g]||[]).forEach(v=>v.classList.add('on'))}}
function show(i){light(D[i][3]);if(curEl)curEl.classList.remove('cur');curEl=V[i];curEl.classList.add('cur');c.innerHTML='<b>“'+esc(D[i][0])+'”</b>'}
hits.addEventListener('pointerover',e=>{const h=e.target.closest('.h');if(h)show(+h.dataset.i)});
svg.addEventListener('pointerleave',e=>{if(e.pointerType!=='touch')off()});
svg.addEventListener('pointerdown',e=>{if(!e.target.closest('.h,.mkh'))off()});

//#match-start
// ---------- 3. Match a visitor's thought to the closest classmate thoughts (shared words) ----------
const STOP=new Set('a an the and or but i me my we our you your it its is am are was were be been to of in on at for with so if that this these those can cant dont do does did not no just really very have has had will would should could how what why when who where about think thought keep again there than then them they'.split(' '));
const tok=s=>(s.toLowerCase().replace(/[’']/g,'').match(/[a-z]+/g)||[]).map(w=>w.replace(/(ing|ed|es|s)$/,'')).filter(w=>w.length>2&&!STOP.has(w));
const TK=D.map(d=>new Set(tok(d[0]))),df={};
TK.forEach(s=>s.forEach(w=>df[w]=(df[w]||0)+1));
const idf=w=>Math.log(1+D.length/(df[w]||1));   // rare shared words count more
function match(text){
 const q=tok(text);let best=-1,bs=0;
 const sc=TK.map((s,i)=>{let x=0;q.forEach(w=>{if(s.has(w))x+=idf(w)});if(x>bs){bs=x;best=i}return x});
 if(bs<1.2)return null;                           // 1.2 = how strict matching is; raise it to be stricter
 const g=D[best][3],seen=new Set(),near=[];
 sc.map((x,i)=>[x,i]).filter(p=>D[p[1]][3]===g).sort((u,v)=>v[0]-u[0]||Math.random()-.5).forEach(([x,i])=>{
  const t=D[i][0];if(!seen.has(t)&&t.toLowerCase()!==text.trim().toLowerCase()){seen.add(t);near.push(t)}});
 return{g,best,near:near.slice(0,6)}}
//#match-end

// ---------- 4. The visitor's own thought on the circle, and moving between screens ----------
let you='',hit=null,mk=null;
function drop(){if(mk){mk.remove();mk=null}}
function mark(th){drop();mk=ns('g',{});const x=cx+R*Math.cos(th),y=cy-R*Math.sin(th);
 const t=ns('text',{x:cx+(R+28)*Math.cos(th),y:cy-(R+28)*Math.sin(th)+5,class:'yl'});t.textContent='yours';
 mk.append(ns('circle',{cx:x,cy:y,r:7,class:'pulse'}),ns('circle',{cx:x,cy:y,r:5,class:'dot'}),t,ns('circle',{cx:x,cy:y,r:14,fill:'transparent',class:'mkh'}));svg.append(mk)}
function showYou(){if(hit)light(hit.g);else clear();c.innerHTML='<b>“'+esc(you)+'”</b><span>Your thought</span>'}
svg.addEventListener('pointerover',e=>{if(e.target.closest('.mkh'))showYou()});
$('go').onclick=()=>{const v=$('t').value.trim();if(!v){$('t').focus();return}
 you=v;hit=match(v);$('you').textContent='“'+v+'”';
 $('near').innerHTML=hit?hit.near.map((t,i)=>'<span class="chip" style="animation-delay:'+(i*.15)+'s">“'+esc(t)+'”</span>').join(''):'';
 $('h2').textContent=hit?'Your thought has company':'Yours is new to this collection';
 $('p2').textContent=hit?'These classmates wrote something close. The match comes from shared words and a theme coded by hand, so it is a suggestion, not a measurement.':'No classmate wrote anything close to it. It can still join the circle.';
 go(2)};
$('skip').onclick=()=>{you='';hit=null;drop();off();go(3)};
$('join').onclick=()=>{off();mark(hit?A[hit.best]:Math.PI/2);go(3)};
$('next').onclick=()=>go(4);
$('back').onclick=()=>go(3);
$('again').onclick=()=>{$('t').value='';you='';hit=null;drop();off();go(1)};
