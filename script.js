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
const byG={},V=[],A=[],topicAngle=[],hits=ns('g',{}),step=2*Math.PI/D.length;let a=Math.PI/2;
T.forEach((name,k)=>{
 const rows=D.map((d,i)=>[d,i]).filter(r=>r[0][1]===k),mid=a-rows.length*step/2;
 topicAngle[k]=mid;
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
function lightSet(ix){clear();cur=-2;svg.classList.add('dim');ix.forEach(i=>V[i].classList.add('on'))}
function light(g){if(g!==cur){clear();cur=g;svg.classList.add('dim');(byG[g]||[]).forEach(v=>v.classList.add('on'))}}
function show(i){light(D[i][3]);if(curEl)curEl.classList.remove('cur');curEl=V[i];curEl.classList.add('cur');c.innerHTML='<b>“'+esc(D[i][0])+'”</b>'}
hits.addEventListener('pointerover',e=>{const h=e.target.closest('.h');if(h)show(+h.dataset.i)});
svg.addEventListener('pointerleave',e=>{if(e.pointerType!=='touch')off()});
svg.addEventListener('pointerdown',e=>{if(!e.target.closest('.h,.mkh'))off()});

//#match-start
// ---------- 3. Match a visitor's thought to the closest classmate thoughts (shared words) ----------
// Meaning-based hints: if the typed text matches the pattern on the left, that classmate thought (middle) gets extra points (right).
// Add your own lines here. The middle text must be written exactly as it appears in data.js.
const CONCEPTS=[
 [/\b(dream|goal|success|fail|enough|worth|proud|prove|achiev|fulfil|talent|capable|deserve|compare|behind)/,'Am I doing enough?',3],
 [/\bam i\b/,'Am I doing well in general?',2],
 [/\b(mom|mother|dad|father|parent|sister|brother|grandm|grandp)/,'I miss my family.',3],
 [/\b(lonely|alone|friend)/,'I miss traveling with my friend.',3],
 [/\b(money|rent|tuition|bills?|loan|debt|expens)/,'Did I pay my rent this month?',3],
 [/\b(health|sick|pain|doctor|diet|weight)/,'I worry about my health.',3],
 [/\b(career|job|graduat|intern|resume|hired?)/,'What should I do in the future?',3],
 [/\b(due|homework|exam|essay|grade|project)/,'I haven’t finished my assignment.',3],
 [/\b(insomnia|awake|tired|bedtime|nap)/,'I should go to sleep.',3],
 [/\b(anxi|worr|stress|panic|overwhelm|scared|afraid|nervous)/,'I feel anxious every day.',3],
 [/\b(embarrass|awkward|cring|rude)/,'I think about an awkward moment.',3],
 [/\b(childhood|nostalg|back home|my ex)/,'I think about good memories from the past.',3],
 [/\b(exist|meaning|faith|universe)/,'I think about life.',3]
];
const STOP=new Set('a an the and or but i me my we our you your it its is am are was were be been to of in on at for with so if that this these those can cant dont do does did not no just really very have has had will would should could how what why when who where about think thought keep again feel there than then them they'.split(' '));
const tok=s=>(s.toLowerCase().replace(/[’']/g,'').match(/[a-z]+/g)||[]).map(w=>w.replace(/(ing|ed|es|s)$/,'')).filter(w=>w.length>2&&!STOP.has(w));
const TK=D.map(d=>new Set(tok(d[0]))),df={};
TK.forEach(s=>s.forEach(w=>df[w]=(df[w]||0)+1));
const idf=w=>Math.log(1+D.length/(df[w]||1));   // rare shared words count more
function match(text){
 const q=tok(text),low=text.toLowerCase();let best=-1,bs=0;
 const sc=TK.map(s=>{let x=0;q.forEach(w=>{if(s.has(w))x+=idf(w)});return x});
 CONCEPTS.forEach(([re,like,pts])=>{if(re.test(low)){const i=D.findIndex(d=>d[0]===like);if(i>=0)sc[i]+=pts}});
 sc.forEach((x,i)=>{if(x>bs){bs=x;best=i}});
 if(bs<1.2)return null;                           // 1.2 = how strict matching is; raise it to be stricter
 const g=D[best][3],seen={},near=[];
 sc.map((x,i)=>[x,i]).filter(p=>D[p[1]][3]===g).sort((u,v)=>v[0]-u[0]||Math.random()-.5).forEach(([x,i])=>{
  const t=D[i][0];seen[t]=(seen[t]||0)+1;if(seen[t]<=4)near.push(t)});   // a phrase can repeat up to 4 times, like in your draft
 return{g,best,near:near.slice(0,10)}}
//#match-end

// ---------- 3b. Hybrid matching: meaning first, then topic, then phrases ----------
// MiniLM finds paraphrases, while the topic hints below stop generic words such as
// "tomorrow" from pulling a daily-life thought into the sleep cluster.
//
// The hints do NOT choose the final phrases. They only add evidence to one of the
// seven hand-coded topics. Phrases are still ranked by semantic similarity inside
// the winning topic.
const TOPIC_HINTS=[
 [0,[ // School, Work & Making
  [/\b(assignment|homework|deadline|project|presentation|critique|class|school|course|study|studying|coding|material|workload)\b/g,.48],
  [/\b(work|finish|prepare)\b/g,.12]
 ]],
 [1,[ // Self-Worth & Meaning
  [/\b(good enough|doing enough|done enough|prove myself|better person|left behind|keeping up|self[- ]?worth|meaning|existence|exist|god|psychology)\b/g,.48],
  [/\b(capable|deserve|worth|purpose)\b/g,.32]
 ]],
 [2,[ // People & Belonging
  [/\b(family|friend|relationship|conversation|social|people|belong|rude|awkward|embarrass\w*|interaction|message|messages|text|call)\b/g,.42],
  [/\b(mom|mother|dad|father|parent|sister|brother|partner)\b/g,.48]
 ]],
 [3,[ // Future & Place
  [/\b(future|career|job|internship|intern|visa|graduat\w*|new york|degree)\b/g,.48],
  [/\b(path|heading|stay here)\b/g,.24]
 ]],
 [4,[ // Sleep & Restless Mind
  [/\b(sleep|asleep|awake|bed|bedtime|insomnia|pillow|exhausted|restless)\b/g,.55],
  [/\b(tired|overthink\w*)\b/g,.30]
 ]],
 [5,[ // Daily Life & Body
  [/\b(to[- ]?do|todo|schedule|organize|organise|calendar|routine|rent|money|spending|phone|scroll\w*|health|diet|eat|food|meal|breakfast|lunch|dinner|smoke|smoking|drink|drinking)\b/g,.52],
  [/\b(on time|time on|plan my|things? to do|what to do tomorrow)\b/g,.36]
 ]],
 [6,[ // Past & Memory
  [/\b(past|memory|memories|childhood|nostalgia|nostalgic|used to|my ex|previous life)\b/g,.50]
 ]]
];

// SEM_MIN is the minimum similarity for claiming that the collection contains a
// genuinely close phrase. TOPIC_RANGE controls how far below the best phrase the
// surrounding echoes may be. Raise SEM_MIN if loose matches still appear.
const sem={ready:false},SEM_MIN=0.34,TOPIC_RANGE=0.12,TOPIC_K=18;

function topicHints(text){
 const low=text.toLowerCase().replace(/[’]/g,"'");
 const scores=T.map(()=>0),evidence=T.map(()=>[]);
 TOPIC_HINTS.forEach(([topic,rules])=>rules.forEach(([re,weight])=>{
  re.lastIndex=0;const found=low.match(re);
  if(found){scores[topic]+=weight*Math.min(found.length,2);evidence[topic].push(...found)}
 }));
 return{scores,evidence}
}

function chooseTopic(text,ranked){
 const {scores,evidence}=topicHints(text);
 // A weighted vote from several neighbours is more stable than trusting the
 // single closest sentence. Squaring the signal lets strong neighbours matter
 // without allowing a large category to win just because it has more rows.
 ranked.slice(0,TOPIC_K).forEach(([similarity,i],rank)=>{
  const signal=Math.max(0,similarity-.18),weight=1/(1+rank*.18);
  scores[D[i][1]]+=signal*signal*weight;
 });
 let topic=0;
 scores.forEach((score,i)=>{if(score>scores[topic])topic=i});
 return{topic,scores,evidence}
}
sem.loading=(async()=>{const st=$('engine');
 try{st.textContent='Loading the meaning model… (first time only)';
  const {pipeline}=await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2');
  const ex=await pipeline('feature-extraction','Xenova/all-MiniLM-L6-v2',{progress_callback:p=>{if(p.status==='progress')st.textContent='Loading the meaning model… '+Math.round(p.progress)+'%'}});
  sem.embed=async list=>(await ex(list,{pooling:'mean',normalize:true})).tolist();
  sem.V=await sem.embed(D.map(d=>d[0]));
  sem.ready=true;st.textContent='Matching by meaning and topic is on.';
 }catch(e){st.textContent='Basic matching is on (the meaning model could not load).';console.log(e)}})();
async function smatch(text){
 const [q]=await sem.embed([text]);
 const rk=sem.V.map((v,i)=>[v.reduce((s,x,k)=>s+x*q[k],0),i]).sort((a,b)=>b[0]-a[0]);
 const decision=chooseTopic(text,rk),topic=decision.topic;
 const inTopic=rk.filter(([,i])=>D[i][1]===topic),bestPair=inTopic[0];
 console.groupCollapsed('Thought match: '+text);
 console.table(rk.slice(0,12).map(([s,i])=>({score:s.toFixed(3),topic:T[D[i][1]],thought:D[i][0]})));
 console.table(T.map((name,i)=>({topic:name,score:decision.scores[i].toFixed(3),hints:decision.evidence[i].join(', ')})).sort((a,b)=>b.score-a.score));
 console.log('Chosen topic:',T[topic]);console.groupEnd();

 // We may understand the topic but still have no sufficiently similar phrase.
 // In that case the thought can join that sector without pretending it has company.
 if(!bestPair||bestPair[0]<SEM_MIN)return{topic,best:null,idx:[],near:[],g:null};

 const floor=Math.max(SEM_MIN,bestPair[0]-TOPIC_RANGE),seen={},idx=[];
 for(const [s,i] of inTopic){
  if(s<floor)break;
  const t=D[i][0];seen[t]=(seen[t]||0)+1;
  if(seen[t]<=4)idx.push(i);
  if(idx.length>=10)break
 }
 const best=bestPair[1];
 return{topic,best,idx,near:idx.map(i=>D[i][0]),g:D[best][3]}}

// Scatter similar phrases around the visitor's thought (positions are % of the stage: [left, top])
const SLOTS=[[22,13],[52,6],[80,15],[13,34],[87,36],[14,66],[86,64],[24,88],[52,94],[78,86]];
function scatter(list){const st=$('stage');st.querySelectorAll('.ph').forEach(e=>e.remove());
 const cnt={};list.forEach(t=>cnt[t]=(cnt[t]||0)+1);
 list.slice(0,SLOTS.length).forEach((t,i)=>{const p=document.createElement('div');p.className='ph'+(cnt[t]>1?' rep':'');p.textContent='“'+t+'”';
  p.style.cssText='left:'+SLOTS[i][0]+'%;top:'+SLOTS[i][1]+'%;--r:'+((i*37%7)-3)+'deg;animation-delay:'+(i*.12)+'s,'+(i*.7)+'s;animation-duration:.9s,'+(7+i%4)+'s';st.append(p)})}
const CRISIS=/\b(suicid|kill myself|end my life|want to die|self.?harm|hurt myself|better off dead)/i;

// ---------- 4. The visitor's own thought on the circle, and moving between screens ----------
let you='',hit=null,mk=null;
function drop(){if(mk){mk.remove();mk=null}}
function mark(th){drop();mk=ns('g',{});const x=cx+R*Math.cos(th),y=cy-R*Math.sin(th);
 const t=ns('text',{x:cx+(R+28)*Math.cos(th),y:cy-(R+28)*Math.sin(th)+5,class:'yl'});t.textContent='yours';
 mk.append(ns('circle',{cx:x,cy:y,r:7,class:'pulse'}),ns('circle',{cx:x,cy:y,r:5,class:'dot'}),t,ns('circle',{cx:x,cy:y,r:14,fill:'transparent',class:'mkh'}));svg.append(mk)}
function showYou(){if(hit&&hit.idx&&hit.idx.length)lightSet(hit.idx);else if(hit&&hit.g!=null)light(hit.g);else clear();c.innerHTML='<b>“'+esc(you)+'”</b><span>Your thought</span>'}
svg.addEventListener('pointerover',e=>{if(e.target.closest('.mkh'))showYou()});
$('go').onclick=async()=>{const v=$('t').value.trim();if(!v){$('t').focus();return}
 if(CRISIS.test(v)){you='';hit=null;$('stage').style.display='none';$('h2').textContent='Thank you for writing that down';
  $('p2').textContent='This project can’t respond to something this heavy, and your words won’t be added. If you might hurt yourself, please contact someone you trust or a crisis line now. In the US, you can call or text 988.';
  $('join').textContent='Start again';$('join').dataset.mode='again';go(2);return}
 $('stage').style.display='';$('join').textContent='Let it join the circle';$('join').dataset.mode='';
 // If the visitor submits during the model's first download, wait for the same
 // meaning engine instead of silently switching to the less accurate fallback.
 $('go').disabled=true;
 try{if(!sem.ready&&sem.loading)await sem.loading;hit=sem.ready?await smatch(v):match(v)}
 finally{$('go').disabled=false}
 you=v;$('you').textContent='“'+v+'”';
 const hasCompany=!!(hit&&hit.near&&hit.near.length);scatter(hasCompany?hit.near:[]);
 $('h2').textContent=hasCompany?'Your thought has company':'Yours is new to this collection';
 $('p2').textContent=hasCompany?'These classmates wrote something close. The match combines meaning-based similarity with topics coded by hand, so it is a suggestion, not a measurement.':'No classmate wrote anything close enough to show. It can still join the circle.';
 go(2)};
$('skip').onclick=()=>{you='';hit=null;drop();off();go(3)};
$('join').onclick=()=>{if($('join').dataset.mode==='again')return $('again').onclick();off();
 const th=hit&&hit.best!=null?A[hit.best]:hit&&hit.topic!=null?topicAngle[hit.topic]:Math.PI/2;
 mark(th);go(3)};
$('next').onclick=()=>go(4);
$('back').onclick=()=>go(3);
$('again').onclick=()=>{$('t').value='';you='';hit=null;drop();off();go(1)};
