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
  [/\b(on time|time on|plan my|things? to do|what to do tomorrow|what (?:should|can|will) i do tomorrow|plans? for tomorrow|tomorrow'?s? (?:plan|schedule))\b/g,.52]
 ]],
 [6,[ // Past & Memory
  [/\b(past|memory|memories|childhood|nostalgia|nostalgic|used to|my ex|previous life)\b/g,.50]
 ]]
];

// A small qualitative collection should not use one hard similarity cutoff.
// Strong matches may reveal a wider cluster; softer matches show only the few
// closest echoes. Only very weak matches are treated as new to the collection.
const sem={ready:false},STRONG_MATCH=.34,SOFT_MATCH=.22,NO_HINT_MATCH=.27,
      STRONG_RANGE=.12,SOFT_RANGE=.055,TOPIC_K=18;

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
 return{topic,scores,evidence,hinted:evidence[topic].length>0}
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

 // Explicit topic evidence lets the small collection offer a few looser echoes.
 // Without a topic clue, require a slightly stronger semantic match so generic
 // phrases such as "I don't know" do not acquire arbitrary company.
 const minimum=decision.hinted?SOFT_MATCH:NO_HINT_MATCH;
 if(!bestPair||bestPair[0]<minimum)return{topic,best:null,idx:[],near:[],g:null,tier:'new',score:bestPair?.[0]??0};

 const strong=bestPair[0]>=STRONG_MATCH;
 const range=strong?STRONG_RANGE:SOFT_RANGE;
 const limit=strong?10:4;
 const floor=Math.max(minimum,bestPair[0]-range),seen={},idx=[];
 for(const [s,i] of inTopic){
  if(s<floor)break;
  const t=D[i][0],key=t.toLowerCase().replace(/\s+/g,' ').trim();
  if(!seen[key]){seen[key]=true;idx.push(i)};
  if(idx.length>=limit)break
 }
 const best=bestPair[1];
 return{topic,best,idx,near:idx.map(i=>D[i][0]),g:D[best][3],tier:strong?'strong':'soft',score:bestPair[0]}}

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
 const hasCompany=!!(hit&&hit.near&&hit.near.length),soft=hasCompany&&hit.tier==='soft';scatter(hasCompany?hit.near:[]);
 $('h2').textContent=hasCompany?(soft?'Your thought has a few echoes':'Your thought has company'):'Yours is new to this collection';
 $('p2').textContent=hasCompany?(soft?'These are the nearest echoes in this small collection—not exact matches.':'These classmates wrote something close. The match combines meaning-based similarity with topics coded by hand, so it is a suggestion, not a measurement.'):'No classmate wrote anything close enough to show. It can still join the circle.';
 go(2)};
$('skip').onclick=()=>{you='';hit=null;drop();off();go(3)};
$('join').onclick=()=>{if($('join').dataset.mode==='again')return $('again').onclick();off();
 const th=hit&&hit.best!=null?A[hit.best]:hit&&hit.topic!=null?topicAngle[hit.topic]:Math.PI/2;
 mark(th);go(3)};
$('next').onclick=()=>go(4);
$('back').onclick=()=>go(3);
$('again').onclick=()=>{$('t').value='';you='';hit=null;drop();off();go(1)};
