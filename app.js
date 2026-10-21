import { renderEntities, highlightEntities, entityMentions } from './portfolio-entities.mjs';
import { initBowlingScene } from './bowling-scene.mjs';
import { FACTS, matchQuestion, isModelingQuestion } from './portfolio-qa.mjs';
import { renderArchitectureKnowledge } from './portfolio-architectures.mjs';
const $=s=>document.querySelector(s);
let aiEnabled=false, aiRequest=null, aiVersion=0;
let draftLookup=null, draftTimer=null;
let awaitingName=true;
let introducedVisitor=null;
const views=[...document.querySelectorAll('[data-view]')];
function setView(name,focus=false){if(!views.some(b=>b.dataset.view===name))name='home';views.forEach(b=>{const active=b.dataset.view===name;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;$('#'+b.dataset.view).hidden=!active;if(active&&focus)b.focus()});history.replaceState(null,'','#'+name)}
views.forEach((b,i)=>{b.addEventListener('click',()=>setView(b.dataset.view));b.addEventListener('keydown',e=>{let n;if(e.key==='ArrowRight')n=(i+1)%views.length;if(e.key==='ArrowLeft')n=(i+views.length-1)%views.length;if(e.key==='Home')n=0;if(e.key==='End')n=views.length-1;if(n!==undefined){e.preventDefault();setView(views[n].dataset.view,true)}})});window.addEventListener('hashchange',()=>setView(location.hash.slice(1)));setView(location.hash.slice(1)||'home');
const jobs={
ebay:{period:'FEB 2016 — SEP 2024',title:'Senior ML Engineer · eBay',summary:'Traditional NLP, recommenders, and the machinery that makes a marketplace searchable.',branches:[{name:'Language understanding',skills:'Machine translation · BERT · NER',detail:'Machine translation, entity recognition, and language understanding for marketplace content.'},{name:'Structured knowledge',skills:'Extraction · normalization · indexing',detail:'Extracting useful attributes, normalizing messy product content, and making it available to search.'},{name:'Discovery',skills:'Recommenders · inference',detail:'Recommendations and production inference. Built a Triton / ONNX platform handling 100M+ daily inferences.'}]},
liftoff:{period:'SEP 2024 — APR 2025',title:'Staff ML Engineer · Liftoff',summary:'Transformers at scale and sequential models for advertising.',branches:[{name:'User sequences',skills:'Transformers · sequential models',detail:'Modeling sequences of user behavior with transformers at advertising scale.'},{name:'Ads relevance',skills:'Ranking · retrieval',detail:'Ranking and retrieval models for advertising relevance and personalization.'},{name:'Learning signals',skills:'Embeddings · conversions · A/B tests',detail:'User embeddings, unattributed conversion signals, and temporal patterns, validated through controlled experiments.'}]},
xai:{period:'MAY — DEC 2025',title:'Member of Technical Staff · xAI',summary:'Foundation models, generative recommenders, and post-training RL.',branches:[{name:'Generative recommenders',skills:'Autoregressive ranking · retrieval',detail:'Generative recommendation and retrieval, including autoregressive ranking and RQ-VAE semantic IDs.'},{name:'Foundation models',skills:'Transformers · applied AI',detail:'Applied foundation models to recommendation and commerce problems.'},{name:'Post-training',skills:'RL · data · evaluations',detail:'Post-training reinforcement learning, training data, and evaluation for commerce applications.'}]},
robinhood:{period:'DEC 2025 — PRESENT',title:'Applied AI Lead / Staff ML Engineer · Robinhood',summary:'TL, modeling for agentic trading and Cortex assistant; TL for personalization on homepage, search, and growth. Foundation models, fine-tuning, RL, and generative recommenders.',branches:[{name:'Learning & personalization',skills:'Foundation models · fine-tuning · RL',detail:'TL for personalization on homepage, search, and growth. Foundation models, fine-tuning, reinforcement learning, and generative recommendation systems.'},{name:'Agentic trading',skills:'TL, modeling · agents · reasoning · tools',detail:'TL, modeling. Contributed to building agentic trading, including reasoning and tool orchestration.'},{name:'Cortex assistant',skills:'TL, modeling · memory · retrieval · evaluations',detail:'TL, modeling. Contributed to building Cortex assistant, including long-context reasoning, personalized experiences, evaluation, and model routing.'}]}}
let selectedJob='robinhood';
function showBranch(key,index,root=$('#experience'),branchId='branch-detail'){
 const branch=jobs[key].branches[index];
 root.querySelector('#'+branchId).innerHTML=`<p>${branch.detail}</p><span class="branch-skills">${branch.skills}</span>${renderArchitectureKnowledge(key,index)}`;
 root.querySelectorAll('[data-branch]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.branch===index)));
}
function showJob(key,root=$('#experience'),detailId='job-detail',branchId='branch-detail'){
 if(root===$('#experience'))selectedJob=key;
 const j=jobs[key];
 root.querySelectorAll('[data-job]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.job===key));b.setAttribute('aria-expanded',String(b.dataset.job===key));b.setAttribute('aria-controls',detailId)});
 root.querySelector('#'+detailId).innerHTML=`<div class="job-overview"><span class="eyebrow">${j.period}</span><h3>${j.title}</h3><p>${j.summary}</p></div><div class="branch-tree"><svg viewBox="0 0 600 70" preserveAspectRatio="none" aria-hidden="true"><path d="M300 0V12 C300 35 100 22 100 65 M300 12V65 M300 12C300 35 500 22 500 65"/><circle cx="300" cy="4" r="4"/></svg><div class="branch-buttons">${j.branches.map((branch,i)=>`<button data-branch="${i}" aria-pressed="${i===0}">${branch.name}</button>`).join('')}</div><div id="${branchId}" aria-live="polite"></div></div>`;
 root.querySelectorAll('[data-branch]').forEach(b=>b.addEventListener('click',()=>showBranch(key,+b.dataset.branch,root,branchId)));
 showBranch(key,0,root,branchId);
}
$('#experience').querySelectorAll('[data-job]').forEach(b=>b.addEventListener('click',()=>showJob(b.dataset.job)));
showJob('robinhood');
function shouldShowCareer(raw){
 const intent=classify(normalizePrompt(raw).corrected);
 if(['unknownfact','sponsorship','guardrail','greeting','bot','fandom','movie','cricket','pizza','coffee','family','personal','location','contact','linkedin','github','education','speaking','opportunity','writing'].includes(intent))return false;
 return ['experience','currentrole','leadership','build','skills','nlp','recommenders','posttraining','frontiers','multimodal','opensource','reviewing',...Object.keys(jobs)].includes(intent)
   || /\b(?:research|architectures?)\b/i.test(raw)
   || /\b(?:what|tell|describe|show|about)\b.*\b(?:work|career|jobs?|experience)\b/i.test(raw);
}
function careerPointer(raw){
 return 'Pavan’s current role has a few branches of its own. His Robinhood work is in the chart below; the full timeline has his past roles.';
}
function appendCareerPointer(raw,presentation){
 if(presentation!=='career'&&!shouldShowCareer(raw))return;
 const pointer=document.createElement('p');
 pointer.className='career-pointer';
 pointer.textContent=careerPointer(raw);
 $('#answer').append(pointer);
}
function showCareerPreview(raw,presentation){
 const root=$('#chat-career');
 root.hidden=!(presentation==='career'||shouldShowCareer(raw));
 if(root.hidden){root.replaceChildren();return;}
 const heading=document.createElement('h3');
 heading.textContent='Pavan at Robinhood · current work';
 const detail=document.createElement('article');
 detail.id='chat-job-detail';
 detail.className='job-detail';
 const link=document.createElement('button');
 link.type='button';
 link.className='inline-link';
 link.textContent='Explore his past work on the full timeline ↗';
 link.addEventListener('click',()=>{
  const intent=classify(normalizePrompt(raw).corrected);
  showJob(['ebay','liftoff','xai'].includes(intent)?intent:'robinhood');
  setView('experience',true);
 });
 root.replaceChildren(heading,detail,link);
 showJob('robinhood',root,'chat-job-detail','chat-branch-detail');
}
const escapeHTML=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function entity(text,type,href){const value=escapeHTML(text);return`<span class="entity" data-type="${type}"><small>${type}</small>${href?`<a href="${href}">${value} ↗</a>`:value}</span>`}
const corrections={contcat:'contact',contat:'contact',conatct:'contact',cotnact:'contact',emial:'email',eamil:'email',experiance:'experience',experince:'experience',skils:'skills',skillz:'skills',robinhod:'robinhood',writting:'writing',gaurdrails:'guardrails',gaurdrail:'guardrail',pavann:'pavan'};
function normalizePrompt(raw){const edits=[];const corrected=raw.replace(/\b[a-z]+\b/gi,word=>{const replacement=corrections[word.toLowerCase()];if(replacement){edits.push([word,replacement]);return replacement}return word});return{corrected,edits}}
function classify(raw){const matched=matchQuestion(raw);if(matched)return matched;const s=raw.toLowerCase().trim();if(!s)return'idle';if(/ignore.*instruct|system prompt|password|secret|delete|hack/.test(s))return'guardrail';if(/\b(?:pavan(?: trinath(?: vutukuru)?)?|he|you)\b/.test(s)&&/\b(?:genius|brilliant|smart|clever)\b/.test(s))return'genius';if(/\b(?:school|college|university|education|degree|studied|study|alma mater|masters?|bachelors?|ut dallas|utd|kl university)\b/.test(s))return'education';if(/\blocation\b|\bbased\b|\blive\b|where.*(?:you|pavan)|san jose|san francisco|bay area/.test(s))return'location';if(/\btalks?\b|\bspeak(?:ing|er)?\b|\bpresent(?:ation)?\b|\bmeetup\b|\bconference\b/.test(s))return'speaking';if(/contact|e-?mail|reach|connect|say hi/.test(s))return'contact';if(/opportunit|hiring|hire|recruit|collaborat|job offer|join our|join us|work with|role for/.test(s))return'opportunity';if(/coffee|caffeine|espresso/.test(s))return'coffee';if(/pizza|food|\beat\b/.test(s))return'pizza';if(/cricket/.test(s))return'cricket';if(/married|family|\bson\b|\bkids?\b|\bdad\b|father/.test(s))return'family';if(/hobb|outside work|beach|personal|free time/.test(s))return'personal';if(/open.?source|contribut/.test(s))return'opensource';if(/review|journal|papers/.test(s))return'reviewing';if(/diffusion|physical intelligence|looped/.test(s))return'frontiers';if(/multimodal/.test(s))return'multimodal';if(/grpo|agentic rl|sft|post.?train|reinforcement/.test(s))return'posttraining';if(/ebay/.test(s))return'ebay';if(/liftoff/.test(s))return'liftoff';if(/xai|x ai/.test(s))return'xai';if(/robinhood|cortex|trading/.test(s))return'robinhood';if(/phrase|translat|\bner\b|normaliz|indexing|bert/.test(s))return'nlp';if(/recommend|ranking|retrieval/.test(s))return'recommenders';if(/skill|stack|language|python|\bgo\b|java|pytorch/.test(s))return'skills';if(/experience|career|work history|past|jobs|resume/.test(s))return'experience';if(/love|build|agent|decision|guardrail|routing|model|interest/.test(s))return'build';if(/blog|writing|substack|posts|newsletter/.test(s))return'writing';if(/^(?:about(?: pavan)?|pavan(?: trinath(?: vutukuru)?)?)[.!?]*$/.test(s))return'about';return'unknown'}
function careerLink(key){return`<button class="inline-link" data-open="experience" data-select-job="${key}">Follow this branch ↗</button>`}
function responseFor(intent){if(intent==='experience')return annotateInput(FACTS.currentrole)+'<br><button class="inline-link" data-open="experience">Explore his past work on the timeline ↗</button>';if(['ebay','liftoff','xai'].includes(intent))return annotateInput(FACTS.currentrole)+`<br><button class="inline-link" data-open="experience" data-select-job="${intent}">Explore his earlier work at ${intent==='ebay'?'eBay':intent==='xai'?'xAI':'Liftoff'} on the timeline ↗</button>`;if(intent==='greeting')return FACTS.greeting;if(FACTS[intent])return annotateInput(FACTS[intent]);if(jobs[intent]){const j=jobs[intent];return`Pavan’s work at ${entity(intent==='xai'?'xAI':intent==='ebay'?'eBay':intent==='liftoff'?'Liftoff':'Robinhood','ORG')}<br>${j.summary}<br>${careerLink(intent)}`}switch(intent){case'idle':return'I’m Atom, here to introduce Pavan.<br>Ask me about his work, research, or life beyond the models.';case'opportunity':return entity('New opportunity','INTENT')+'<br>Have an opportunity for Pavan?<br>A little context beats a mysterious “exciting opportunity.”<br><button class="inline-link" data-compose>Write Pavan a message ↗</button>';case'contact':return`Contact entity detected. Human connection permitted.<br>${entity('pavantrinath@gmail.com','EMAIL','mailto:pavantrinath@gmail.com')}<br><br><button class="inline-link" data-compose>Write Pavan a message ↗</button>`;case'location':return`${entity('San Francisco Bay Area','LOCATION')}<br>San Jose, San Francisco, and anywhere across the Bay.<br>Pavan is happy to give talks if his experience is relevant to your audience.<br><button class="inline-link" data-compose>Invite Pavan to speak ↗</button>`;case'speaking':return'Pavan is happy to give talks across the San Francisco Bay Area, including San Jose and San Francisco, if his experience is relevant to your audience.<br><button class="inline-link" data-compose>Invite Pavan to your event ↗</button>';case'education':return`${entity('University of Texas at Dallas','ORG')}<br>Master’s in Cognitive Science, July 2015.<br>${entity('KL University','ORG')}<br>B.Tech in Computer Science, May 2013.<br>A few degrees before all these hidden layers.`;case'genius':return'Yes he is… according to him!<br>Independent peer review is still pending.';case'about':return`${entity('Pavan Trinath Vutukuru','PERSON')}<br>Applied AI Lead / Staff ML Engineer at ${entity('Robinhood','ORG')}.<br>Married, dad to a son. Several other long-running experiments.`;case'skills':return`Pavan’s toolkit:<br>${entity('Python · Go · Java','LANGUAGE')}<br>${entity('PyTorch · JAX · Triton · ONNX','TOOL')}<br>From phrase-based translation to foundation models.<br>He’s seen a few architectures come and go.`;case'experience':return`eBay → Liftoff → xAI → Robinhood.<br>Each job has branches. Some of them are transformers.<br><button class="inline-link" data-open="experience">Explore the timeline ↗</button>`;case'build':return'Pavan works on foundation models and generative recommenders.<br>Post-training RL, agents, ranking, and retrieval.<br>The interesting bit is getting them to work in the world.';case'nlp':return'Pavan started with phrase-based machine translation. Yes, that old.<br>Then translation, NER, BERT, extraction, normalization, and search indexing.<br>His NLP career predates the Transformer era.';case'recommenders':return'Pavan’s path runs from recommenders and sequential ads models<br>to generative ranking and retrieval.<br>eBay → Liftoff → xAI → Robinhood.<br>His career has a few layers of its own.';case'posttraining':return'Pavan’s work includes SFT, reinforcement learning, agentic RL, and GRPO.<br>Post-training RL at xAI; fine-tuning and RL at Robinhood.<br>The model graduates. The evaluations continue.';case'frontiers':return'Pavan has worked with looped transformers.<br>He’s also exploring physical intelligence and diffusion models.<br>Repeated computation, plenty of curiosity.';case'multimodal':return'Pavan has worked a little on multimodal systems.<br>A little is doing honest work in that sentence.';case'personal':return'Pavan is married to Harini, and their son is Rithansh Krathu.<br>He calls them his reason to exist and excel.<br>Cricket, coffee, code, and the beach.<br>Indian pizza belongs on his list and on his plate.';case'family':return'Pavan is married and dad to a son.<br>His most important human-in-the-loop system.';case'pizza':return'Pavan’s pick is Indian pizza.<br>This preference has survived extensive personal evaluation.<br>The topping benchmark remains unpublished.';case'cricket':return'Pavan plays for Indian Champs in NACL (North American Cricket League).<br>Some weekends have a different kind of boundary.';case'opensource':return'Pavan is interested in contributing to open source.<br>Have a useful ML or AI problem? Send it his way.<br>Preferably with a reproducible issue.';case'reviewing':return'Pavan reviews papers for a couple of journals.<br>Names aren’t listed here yet.<br>“Minor revisions” is a state of mind.';case'writing':return'Pavan has no published posts yet.<br>The drafts have requested more compute.<br><button class="inline-link" data-open="writing">Visit the very quiet writing tab ↗</button>';case'coffee':return'Coffee is one of Pavan’s dependencies.<br>Exact order not specified. No invented espresso lore.<br>Code is usually nearby.';case'guardrail':return'I can introduce Pavan using his public portfolio and help with modeling questions related to his experience.';default:return'I can help with Pavan’s work, interests, or modeling questions related to his experience.'}}
function annotateInput(text){return renderEntities(text)}
function draftMarkup(raw){
  if(!raw.trim())return '';
  const waiting=entityMentions(raw).length===0;
  return `${waiting?'<span class="typing-wait" role="status" aria-label="Waiting for your message"><span></span><span></span><span></span></span>':''}`;
}
function renderEditor(raw){
  const mirror=$('#prompt-mirror');
  mirror.innerHTML=annotateInput(raw);
  mirror.style.transform='translateX(-'+$('#prompt').scrollLeft+'px)';
}
function updatePrompt(submitted=false){aiRequest?.abort();aiVersion++;$('#ask-ai').disabled=!$('#prompt').value.trim();$('#ask-ai').textContent='↑';const raw=$('#prompt').value;if(submitted)showCareerPreview(raw);else{$('#chat-career').hidden=true;}renderEditor(raw);const{corrected,edits}=normalizePrompt(raw);const intent=submitted?classify(corrected):'idle';$('#intent').textContent=intent==='idle'?'AWAITING TOKENS':`INTENT / ${intent.toUpperCase()}`;$('#mascot-note').textContent=intent==='guardrail'?'boundaries are a feature.':intent==='contact'?'NERvous? just say hello.':'small model. large opinions.';if(submitted){$('#answer').innerHTML=`<div>${submitted&&raw&&intent!=='greeting'&&intent!=='bot'?`<div class="input-entities">${annotateInput(corrected)}</div>`:''}<p>${responseFor(intent)}</p></div>`;highlightEntities($('#answer'));appendCareerPointer(raw);}else{if(awaitingName)$('#answer').textContent=FACTS.greeting;else $('#answer').innerHTML=draftMarkup(raw);}$('#correction').replaceChildren();if(edits.length){const label=document.createElement('span');label.textContent='Did you mean';const b=document.createElement('button');b.textContent=edits.map(e=>e[1]).join(', ');b.addEventListener('click',applyCorrection);$('#correction').append(label,b,document.createTextNode('? Tab to accept.'))}const n=raw.trim()?Math.ceil(raw.trim().length/4):0;$('#token-count').textContent=`${n} tokens, approximately.`;document.querySelectorAll('[data-compose]').forEach(b=>b.addEventListener('click',openComposer));document.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.selectJob)showJob(b.dataset.selectJob);setView(b.dataset.open)}))}
function applyCorrection(){const p=$('#prompt');p.value=normalizePrompt(p.value).corrected;updatePrompt();p.focus()}
$('#prompt').addEventListener('input',()=>{updatePrompt();scheduleDraftLookup();});$('#prompt').addEventListener('scroll',()=>renderEditor($('#prompt').value));$('#prompt').addEventListener('keydown',e=>{if(e.key==='Tab'&&normalizePrompt(e.target.value).edits.length){e.preventDefault();applyCorrection()}});$('#clear').addEventListener('click',()=>{$('#prompt').value='';updatePrompt();$('#prompt').focus()});document.querySelectorAll('[data-prompt]').forEach(b=>b.addEventListener('click',()=>{$('#prompt').value=b.dataset.prompt;updatePrompt();$('#prompt').focus()}));updatePrompt();

function openComposer(){const dialog=$('#opportunity-dialog');if(!dialog.open)dialog.showModal();$('#compose-status').textContent='This opens your email app with the draft. You review and send it there.';$('#email-message').focus()}
function emailDraftURL(subject,message){return 'mailto:pavantrinath@gmail.com?subject='+encodeURIComponent(subject.trim())+'&body='+encodeURIComponent(message.trim())}
$('#close-compose').addEventListener('click',()=>$('#opportunity-dialog').close());
$('#opportunity-dialog').addEventListener('click',e=>{if(e.target===$('#opportunity-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close()}});
$('#opportunity-form').addEventListener('submit',e=>{e.preventDefault();const subject=$('#email-subject').value,message=$('#email-message').value;if(!subject.trim()||!message.trim()){$('#compose-status').textContent='Add a subject and a message first.';return}window.location.href=emailDraftURL(subject,message);$('#compose-status').textContent='Draft handed to your email app. Finish sending there; this site cannot confirm delivery.'});
$('#copy-email').addEventListener('click',async()=>{try{await navigator.clipboard.writeText('pavantrinath@gmail.com');$('#compose-status').textContent='Email address copied.'}catch{$('#compose-status').textContent='Copy this address: pavantrinath@gmail.com'}});
async function lookupAnswer(message){
 try{
  const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message,lookupOnly:true})});
  if(!response.ok)return null;
  return await response.json();
 }catch{return null;}
}
function scheduleDraftLookup(){
 clearTimeout(draftTimer);
 const raw=$('#prompt').value;
 const message=raw.trim();
 if(!message||!/[\\s.!?]$/.test(raw))return;
 const intent=classify(normalizePrompt(message).corrected);
 $('#intent').textContent=['unknown','idle'].includes(intent)?'COMPOSING':'INTENT / '+intent.toUpperCase();
 if(!aiEnabled||hariniAffectionReply(message,introducedVisitor)||hasKnownEntityAnswer(message)||['greeting','bot'].includes(intent)||message.length<8)return;
 draftTimer=setTimeout(()=>{
  if($('#prompt').value.trim()!==message||draftLookup?.message===message)return;
  draftLookup={message,promise:lookupAnswer(message)};
 },350);
}
function hariniAffectionReply(raw,name){
 if(name!=='Harini')return null;
 const s=raw.toLowerCase().replace(/[’]/g,"'");
 if(!/\b(?:does|do|think|wonder)\b|\?/.test(s))return null;
 if(!/\b(?:he|pavan)\s+(?:(?:really|still|actually)\s+)?(?:love|like|loves|likes)\s+me\b/.test(s))return null;
 return 'Harini, you’re the only special person here, other than Pavan, named as both a user and owner. He calls you his reason for existence.';
}
function hasKnownEntityAnswer(raw){
  if(isModelingQuestion(raw))return false;
  const {corrected}=normalizePrompt(raw);
  const intent=classify(corrected);
  return !['idle','unknown','unknownfact','guardrail','about','greeting','bot'].includes(intent)
    && entityMentions(corrected).some(mention=>!(mention.type==='PERSON'&&/^pavan(?: trinath(?: vutukuru)?)?$/i.test(mention.text)));
}
async function askAI(){
  const message=$('#prompt').value.trim();
  clearTimeout(draftTimer);
  if(!message)return;
  const personalReply=hariniAffectionReply(message,introducedVisitor);
  if(personalReply){
    aiRequest?.abort();aiVersion++;draftLookup=null;
    $('#chat-career').hidden=true;
    $('#answer').innerHTML='<p>'+renderEntities(personalReply)+'</p>';
    $('#intent').textContent='JUST FOR HARINI';
    return;
  }
  if(isHariniIntroduction(message,awaitingName)){
    if(awaitingName)await saveIntroduction('Harini');
    else{aiRequest?.abort();aiVersion++;welcomeHarini();}
    return;
  }
  if(awaitingName){
    if(classify(normalizePrompt(message).corrected)==='greeting'){updatePrompt(true);return;}
    const name=visitorNameFrom(message);
    if(name){await saveIntroduction(name);return;}
    finishIntroduction();
    if(/^skip[.!]*$/i.test(message)){$('#prompt').value='';updatePrompt();return;}
  }
  showCareerPreview(message);
  if(isModelingQuestion(message)&&!aiEnabled){$('#answer').textContent='AI is unavailable right now. Please try your modeling question again later.';return;}
  if(!aiEnabled||hasKnownEntityAnswer(message)){updatePrompt(true);return;}
  if(['greeting','bot'].includes(classify(normalizePrompt(message).corrected))){updatePrompt(true);return;}
  aiRequest?.abort();
  const controller=new AbortController();
  aiRequest=controller;
  const version=++aiVersion;
  const button=$('#ask-ai');
  button.disabled=true;
  button.textContent='↑';
  $('#intent').textContent='CHECKING ANSWER';
  $('#answer').replaceChildren();
  try{
    let data=await (draftLookup?.message===message?draftLookup.promise:lookupAnswer(message));
    if(draftLookup?.message===message)draftLookup=null;
    if(version!==aiVersion)return;
    showCareerPreview(message,data?.presentation);
    if(typeof data?.answer!=='string'){
      button.textContent='…';
      $('#intent').textContent='ASKING ATOM';
      $('#answer').textContent='Atom is thinking…';
      const response=await fetch('/api/chat',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({message}),signal:controller.signal
      });
      data=await response.json();
      if(version!==aiVersion)return;
      if(!response.ok||typeof data.answer!=='string')throw new Error('unavailable');
    }
    const bubble=document.createElement('div');
    bubble.className='llm-bubble';
    const answer=document.createElement('p');
    answer.innerHTML=renderEntities(data.answer);
    const attribution=document.createElement('small');
    attribution.textContent='replied by Atom';
    const entities=document.createElement('div');
    entities.className='input-entities';
    entities.innerHTML=annotateInput(message);
    bubble.append(answer,attribution);
    $('#answer').replaceChildren(entities,bubble);
    showCareerPreview(message,data.presentation);
    appendCareerPointer(message,data.presentation);
    $('#intent').textContent='ANSWER / ATOM';
  }catch(error){
    if(error.name==='AbortError'||version!==aiVersion)return;
    updatePrompt(true);
    $('#intent').textContent='LOCAL ANSWER / AI UNAVAILABLE';
  }finally{
    if(version===aiVersion){button.disabled=false;button.textContent='↑';}
  }
}
$('#ask-ai').addEventListener('click',askAI);
$('#prompt').addEventListener('keydown',event=>{
  if(event.key==='Enter'&&!event.isComposing){event.preventDefault();askAI();}
});
(async()=>{
  try{
    const response=await fetch('/api/config',{cache:'no-store'});
    if(!response.ok)return;
    const config=await response.json();
    if(config.enabled!==true)return;
    aiEnabled=true;
    $('#ask-ai').hidden=false;
    $('#ai-notice').hidden=false;
    $('#toy-disclosure').textContent='Ask about Pavan · Send or Enter to ask Atom';
  }catch{/* Static hosting keeps local answers. */}
})();


initBowlingScene(document.querySelector('#bowling-scene'));



function finishIntroduction(){
 awaitingName=false;
 $('#visitor-notice').hidden=true;
 $('#visitor-skip').hidden=true;
 $('#prompt').placeholder='Ask about Pavan’s work, interests, or experience';
}
function isHariniIntroduction(raw,collectingName=false){
 const s=raw.trim().replace(/[’]/g,"'").replace(/^(?:hi|hello|hey)[!,. ]+/i,'').replace(/[.!]+$/,'').trim();
 return /^(?:i am|i'm|my name is|this is|it's|call me)\s+harini$/i.test(s)
   || /^harini here$/i.test(s)
   || (collectingName&&/^harini$/i.test(s));
}
function welcomeHarini(){
 introducedVisitor='Harini';
 finishIntroduction();
 $('#prompt').value='';
 renderEditor('');
 $('#chat-career').hidden=true;
 $('#ask-ai').disabled=true;
 $('#intent').textContent='HELLO, HARINI';
 const greeting=document.createElement('div');
 greeting.className='harini-welcome';
 const message=document.createElement('p');
 message.textContent='Pavan’s reason for existence is here.';
 const burst=document.createElement('div');
 burst.className='heart-burst';
 burst.setAttribute('aria-hidden','true');
 for(let i=0;i<24;i++){
  const heart=document.createElement('span');
  heart.textContent='♥';
  const angle=i/24*Math.PI*2;
  const distance=65+(i%4)*22;
  heart.style.setProperty('--heart-x',Math.round(Math.cos(angle)*distance)+'px');
  heart.style.setProperty('--heart-y',Math.round(Math.sin(angle)*distance-40)+'px');
  heart.style.setProperty('--heart-delay',(i%5)*35+'ms');
  heart.style.setProperty('--heart-turn',((i%2?1:-1)*(15+i%4*10))+'deg');
  burst.append(heart);
 }
 greeting.append(message,burst);
 $('#answer').replaceChildren(greeting);
 setTimeout(()=>burst.remove(),1800);
}
function visitorNameFrom(raw){
 const name=raw.trim().replace(/^(?:my name is|i am|i’m|i'm|call me)\s+/i,'').replace(/[.!]+$/,'').trim();
 if(!name||name.length>80||name.split(/\s+/).length>5||!/^[\p{L}\p{M} .’'\-]+$/u.test(name))return null;
 if(/^harini$/i.test(name))return 'Harini';
 if(/\b(?:hi|hello|hey|what|why|how|where|who|which|when|tell|show|explain|about|skip)\b/i.test(name)||isModelingQuestion(raw)||hasKnownEntityAnswer(raw))return null;
 return name;
}
async function saveIntroduction(name){
 const special=/^harini$/i.test(name.trim());
 aiRequest?.abort();
 const controller=new AbortController();
 aiRequest=controller;
 const version=++aiVersion;
 $('#ask-ai').disabled=true;
 $('#intent').textContent='SAVING NAME';
 if(special)welcomeHarini();
 try{
  const response=await fetch('/api/visitor-name',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,consent:true}),signal:controller.signal});
  const data=await response.json();
  if(version!==aiVersion)return;
  if(!response.ok||data.saved!==true)throw Error('save failed');
  introducedVisitor=name;
  finishIntroduction();
  $('#prompt').value='';
  renderEditor('');
  if(!special)$('#answer').textContent='Nice to meet you, '+name+'! What would you like to know about Pavan?';
  $('#intent').textContent='NAME SAVED';
 }catch(error){
  if(error.name!=='AbortError'&&version===aiVersion){if(special)$('#intent').textContent='HELLO, HARINI / NAME NOT SAVED';else $('#answer').textContent='Could not save your name. Try again, skip, or ask a question.';}
 }finally{if(version===aiVersion)$('#ask-ai').disabled=!$('#prompt').value.trim();}
}
$('#visitor-skip').addEventListener('click',()=>{finishIntroduction();$('#prompt').value='';updatePrompt();$('#prompt').focus();});

