(() => {
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const storage = {
    get(k, fallback){ try { return JSON.parse(localStorage.getItem(k)) ?? fallback; } catch { return fallback; } },
    set(k, v){ localStorage.setItem(k, JSON.stringify(v)); }
  };
  const toast = $('#toast');
  let toastTimer;
  const notify = msg => { toast.textContent = msg; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>toast.classList.remove('show'),2200); };
  $('#year').textContent = new Date().getFullYear();

  // Reveal
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => entries.forEach(e => { if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target);} }), {threshold:.08});
    $$('.reveal').forEach(el=>io.observe(el));
  } else $$('.reveal').forEach(el=>el.classList.add('visible'));

  // Menu
  const menu = $('#mobile-menu'), menuToggle = $('#menu-toggle');
  const closeMenu = () => { menu.classList.remove('open'); menu.setAttribute('aria-hidden','true'); menuToggle.setAttribute('aria-expanded','false'); document.body.classList.remove('menu-open'); };
  menuToggle.addEventListener('click',()=>{const open=!menu.classList.contains('open');menu.classList.toggle('open',open);menu.setAttribute('aria-hidden',String(!open));menuToggle.setAttribute('aria-expanded',String(open));document.body.classList.toggle('menu-open',open);});
  $('#menu-close').addEventListener('click',closeMenu); $$('#mobile-menu a').forEach(a=>a.addEventListener('click',closeMenu));
  $$('[data-scroll]').forEach(b=>b.addEventListener('click',()=>$(b.dataset.scroll)?.scrollIntoView({behavior:'smooth'})));

  // Greeting
  const h = new Date().getHours(); $('#greeting').textContent = h < 12 ? 'Good morning.' : h < 18 ? 'Good afternoon.' : 'Good evening.';

  const rules = [
    ['Protect process, not ego.','A good trade is one that followed your system. A profitable rule-break is still bad execution because it trains the wrong behavior.'],
    ['A missed trade costs zero.','Chasing a move converts impatience into bad location. Missing a setup protects capital; forcing one spends it.'],
    ['Risk must be boring.','If the planned loss changes your breathing, your size is probably too large for clear execution.'],
    ['The next trade owes you nothing.','A previous loss is history. Do not make the next setup responsible for repairing your emotion.'],
    ['Wait for evidence, not relief.','Entering early often removes the discomfort of waiting while adding the financial cost of poor confirmation.'],
    ['Confidence is not certainty.','Winning streaks should not change the rules that kept risk controlled before the streak began.'],
    ['You are paid for consistency.','Your edge appears across a series. One candle, one trade, and one outcome are not your identity.']
  ];
  const dayIndex = Math.floor(Date.now()/86400000)%rules.length;
  let ruleIndex = dayIndex;
  const renderRule = () => { const [t,c]=rules[ruleIndex]; $('#rule-number').textContent=`RULE ${String(ruleIndex+1).padStart(2,'0')}`;$('#rule-title').textContent=t;$('#rule-copy').textContent=c;$('#dash-rule').textContent=t;const save=$('[data-save-insight="daily-rule"]');save.dataset.title=t;syncBookmarks(); };
  $('#next-rule').addEventListener('click',()=>{ruleIndex=(ruleIndex+1)%rules.length;renderRule();}); renderRule();

  // Daily check-in
  const mentalActions = {
    calm:['LOW','Clear state. Keep normal risk and wait for your actual setup.'],
    fear:['HIGH','Reduce decision pressure. Consider smaller risk, wait for confirmation, and accept the stop before entry.'],
    greed:['HIGH','Do not chase. Recheck location and size. If urgency remains, skip the trade.'],
    anger:['EXTREME','No new order. Use the 60-second reset and step away until the need to win back disappears.'],
    euphoria:['HIGH','Keep normal risk. A winning streak does not increase the certainty of the next trade.'],
    tired:['ELEVATED','Attention is part of risk management. Reduce size or stop if you cannot monitor your rules clearly.']
  };
  const checkins = storage.get('ti-checkins',[]);
  $$('#mood-grid button').forEach(btn=>btn.addEventListener('click',()=>{
    $$('#mood-grid button').forEach(b=>b.classList.remove('active'));btn.classList.add('active');
    const mood=btn.dataset.mood,risk=+btn.dataset.risk,[label,action]=mentalActions[mood];
    $('#risk-fill').style.width=risk+'%';$('#risk-label').textContent=`${label} · ${btn.querySelector('strong').textContent}`;$('#risk-action').textContent=action;$('#dash-mental').textContent=btn.querySelector('strong').textContent;
    checkins.push({date:new Date().toISOString(),mood,risk}); if(checkins.length>30)checkins.shift();storage.set('ti-checkins',checkins); updateScore();
  }));

  // Bookmarks / saved
  let saved = storage.get('ti-saved',[]);
  function syncBookmarks(){
    $$('[data-save-insight]').forEach(btn=>{const id=btn.dataset.saveInsight;const on=saved.some(x=>x.id===id);btn.classList.toggle('saved',on);if(btn.classList.contains('bookmark'))btn.textContent=on?'★':'☆';else if(id==='daily-rule')btn.textContent=on?'★ Saved rule':'☆ Save rule';});
    $('#saved-count').textContent=saved.length; renderSaved();
  }
  document.addEventListener('click',e=>{const btn=e.target.closest('[data-save-insight]');if(!btn)return;const id=btn.dataset.saveInsight,title=btn.dataset.title||btn.closest('.insight-card')?.querySelector('h3')?.textContent||'Saved insight';const exists=saved.findIndex(x=>x.id===id);if(exists>=0){saved.splice(exists,1);notify('Removed from My Playbook');}else{saved.unshift({id,title,date:new Date().toISOString()});notify('Saved to My Playbook');}storage.set('ti-saved',saved);syncBookmarks();});
  function renderSaved(){const grid=$('#saved-grid');if(!saved.length){grid.innerHTML='<div class="saved-empty">No saved insights yet. Tap ☆ on any rule or playbook card.</div>';return;}grid.innerHTML=saved.map(x=>`<article class="saved-card"><small>SAVED INSIGHT</small><strong>${escapeHtml(x.title)}</strong><button type="button" data-remove-saved="${escapeAttr(x.id)}">Remove</button></article>`).join('');$$('[data-remove-saved]',grid).forEach(b=>b.addEventListener('click',()=>{saved=saved.filter(x=>x.id!==b.dataset.removeSaved);storage.set('ti-saved',saved);syncBookmarks();}));}

  // Playbook filters/search
  const cards = $$('#playbook-grid .insight-card');
  let activeFilter='all';
  function filterPlaybook(){const q=$('#playbook-search').value.trim().toLowerCase();let visible=0;cards.forEach(c=>{const cat=c.dataset.category.split(' '),hay=(c.dataset.search+' '+c.textContent).toLowerCase();const show=(activeFilter==='all'||cat.includes(activeFilter))&&(!q||hay.includes(q));c.classList.toggle('hidden',!show);if(show)visible++;});$('#playbook-empty').hidden=visible>0;}
  $$('#playbook-filters .filter').forEach(b=>b.addEventListener('click',()=>{$$('#playbook-filters .filter').forEach(x=>x.classList.remove('active'));b.classList.add('active');activeFilter=b.dataset.filter;filterPlaybook();}));
  $('#playbook-search').addEventListener('input',filterPlaybook);

  // Emotional state lab
  const states={
    fear:{tag:'FEAR RESPONSE',risk:'HIGH',title:'Fear tries to turn uncertainty into avoidance.',description:'You may hesitate on valid setups, close winners too early or widen your criteria until no trade feels safe.',trigger:'Recent loss / fear of being wrong',replacement:'Risk small enough that the planned stop is emotionally tolerable.',action:'Reduce decision pressure. Review setup criteria. Accept the exact predefined loss before entering.'},
    greed:{tag:'GREED / FOMO',risk:'HIGH',title:'Urgency makes a late entry feel necessary.',description:'Greed narrows attention to what you might gain and hides what you are paying in location, invalidation quality and size.',trigger:'Fast move / recent missed profit',replacement:'Treat a missed trade as zero loss and wait for a fresh setup.',action:'Do not enter because price is moving. Recheck structure, distance to invalidation and whether the setup still exists.'},
    revenge:{tag:'REVENGE RESPONSE',risk:'EXTREME',title:'Anger wants the market to repair the last result.',description:'The next trade stops being independent. Size increases, criteria weaken and speed replaces evidence.',trigger:'Loss / stop-out / feeling disrespected',replacement:'Separate recovery of emotion from recovery of money.',action:'No new order until the reset is complete. If you still feel urgency, end the session.'},
    euphoria:{tag:'EUPHORIA RESPONSE',risk:'HIGH',title:'Winning can make rules feel optional.',description:'After repeated wins, normal uncertainty can feel smaller than it really is. This often appears as larger size or lower-quality setups.',trigger:'Winning streak / unusually large win',replacement:'Keep risk and setup standards unchanged after success.',action:'Score the last trade on process. If rules slipped despite profit, treat it as a warning rather than validation.'}
  };
  $$('.state-tab').forEach(b=>b.addEventListener('click',()=>{$$('.state-tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');const s=states[b.dataset.state];$('#state-tag').textContent=s.tag;$('#state-risk').textContent=s.risk;$('#state-title').textContent=s.title;$('#state-description').textContent=s.description;$('#state-trigger').textContent=s.trigger;$('#state-replacement').textContent=s.replacement;$('#state-action').textContent=s.action;}));

  // Trade gate
  const gates=$$('[data-gate]');
  function updateGate(){const n=gates.filter(x=>x.checked).length;$('#gate-count').textContent=n;const ready=n===gates.length;const result=$('#gate-result');result.classList.toggle('ready',ready);result.querySelector('strong').textContent=ready?'MENTALLY READY ✓':'NOT READY';$('#dash-gate').textContent=ready?'Ready ✓':`${n}/8 checked`;storage.set('ti-gate',gates.map(x=>x.checked));updateScore();}
  const gateSaved=storage.get('ti-gate',[]);gates.forEach((g,i)=>{g.checked=!!gateSaved[i];g.addEventListener('change',updateGate)});updateGate();

  // Score sliders
  const sliderMap=[['discipline','discipline-value'],['risk-control','risk-value'],['setup-quality','setup-value'],['emotion-stability','emotion-value'],['rule-adherence','rules-value']];
  const savedMetrics=storage.get('ti-score-metrics',{});sliderMap.forEach(([id,out])=>{const el=$('#'+id);if(savedMetrics[id]!=null)el.value=savedMetrics[id];$('#'+out).textContent=el.value;el.addEventListener('input',()=>{ $('#'+out).textContent=el.value; calcProcessScore();});});
  function calcProcessScore(){const vals=sliderMap.map(([id])=>+$('#'+id).value);const score=Math.round(vals.reduce((a,b)=>a+b,0)/vals.length);$('#process-score').textContent=score;const data={};sliderMap.forEach(([id])=>data[id]=+$('#'+id).value);storage.set('ti-score-metrics',data);$('#score-copy').textContent=score>=85?'Strong process. Protect consistency; do not use this score as permission to increase risk.':score>=70?'Solid process. Tighten the weakest controllable behavior before increasing risk.':score>=50?'Execution is unstable. Reduce complexity and focus on one rule at a time.':'High process risk. Stop optimizing entries and rebuild basic discipline first.';updateScore();}
  function updateScore(){const process=+$('#process-score').textContent||70;const gate=gates.filter(x=>x.checked).length/gates.length*100;const mentalBtn=$('#mood-grid .active');const mental=mentalBtn?100-(+mentalBtn.dataset.risk):55;const protocol=storage.get('ti-protocol',[]).length/7*100;const score=Math.round(process*.45+gate*.2+mental*.2+protocol*.15);$('#trader-score').textContent=score;$('#score-ring').style.strokeDashoffset=(301.6*(1-score/100)).toFixed(1);}
  calcProcessScore();

  // Mistake library
  const mistakes={
    fomo:['Price moves fast without me','“I’m going to miss it.”','Chase entry','Poor location · emotional SL','Miss the trade. Protect the process.'],
    revenge:['A loss feels personal','“I need it back now.”','Force next trade','Criteria weaken · size rises','Reset first. Next trade is independent.'],
    stop:['Price approaches invalidation','“Give it more room.”','Move the stop','Planned risk becomes unknown','If invalidation is unchanged, SL stays.'],
    overtrade:['Boredom / constant chart watching','“There must be something.”','Create setups','Fees · noise · emotional fatigue','Set a maximum number of valid attempts.'],
    oversize:['Strong confidence / need fast recovery','“This one is obvious.”','Increase position','Emotion controls management','Size from risk formula, never conviction.'],
    earlyexit:['Open profit starts fluctuating','“I can’t lose this profit.”','Close before plan','Edge gets cut short','Manage by structure or plan, not P&L flicker.'],
    lateentry:['Setup already moved','“I’m still right on direction.”','Enter far from planned level','Bad R:R · tight emotional stop','Correct direction does not justify bad location.'],
    hesitation:['Valid setup reaches entry','“What if this one loses?”','Delay until confirmation is gone','Missed rule-based trades','Reduce risk until taking the stop is tolerable.'],
    strategy:['Normal losing streak appears','“My strategy stopped working.”','Switch model','No sample size · no mastery','Review data before changing the system.']
  };
  $$('.mistake-chip').forEach(b=>b.addEventListener('click',()=>{$$('.mistake-chip').forEach(x=>x.classList.remove('active'));b.classList.add('active');const m=mistakes[b.dataset.mistake];['trigger','thought','action','consequence','replacement'].forEach((k,i)=>$('#mistake-'+k).textContent=m[i]);}));

  // Diagnostic
  const paths={
    hesitate:['Confidence Through Smaller Risk','For 7 sessions, use smaller risk and execute only your written A+ setup. Score whether you followed the entry rule—not whether it won.'],
    overtrade:['Selective Execution','Define one setup and a maximum number of attempts. Every non-setup becomes a deliberate “no trade” repetition.'],
    revenge:['Loss Recovery Protocol','After every stop-out, run the reset before any new order. Track whether urgency is still present after 60 seconds.'],
    fear:['Loss Acceptance','Before entry, write the exact monetary loss you accept. If that number creates strong physical resistance, reduce size.'],
    early:['Winner Management','Hide running P&L when possible. Manage from technical invalidation or predefined management rules only.'],
    chase:['FOMO Interruption','For one week, screenshot every late move you deliberately did not chase. Train missed trades as successful discipline.'],
    switch:['Strategy Stability','Choose one model and define the review sample size before you are allowed to change it. No switching from emotion.']
  };
  $$('#diagnostic-options button').forEach(b=>b.addEventListener('click',()=>{$$('#diagnostic-options button').forEach(x=>x.classList.remove('active'));b.classList.add('active');const [title,copy]=paths[b.dataset.problem];const box=$('#diagnostic-result');box.querySelector('h3').textContent=title;box.querySelector('p').textContent=copy;$('#path-progress-bar').style.width='14%';$('#path-progress-label').textContent='Day 1 / 7 · 14% started';storage.set('ti-learning-path',{problem:b.dataset.problem,title});notify('Learning path selected');}));
  const savedPath=storage.get('ti-learning-path',null);if(savedPath){const b=$(`[data-problem="${savedPath.problem}"]`);if(b)b.click();}

  // Protocol
  let protocol=storage.get('ti-protocol',[]);
  function renderProtocol(){ $$('#protocol-grid button').forEach(b=>b.classList.toggle('done',protocol.includes(+b.dataset.day)));const n=protocol.length;$('#protocol-count').textContent=n;$('#protocol-progress').style.width=(n/7*100)+'%';$('#dash-training').textContent=`Day ${Math.min(n+1,7)} / 7`;updateScore(); }
  $$('#protocol-grid button').forEach(b=>b.addEventListener('click',()=>{const d=+b.dataset.day;protocol=protocol.includes(d)?protocol.filter(x=>x!==d):[...protocol,d].sort();storage.set('ti-protocol',protocol);renderProtocol();}));
  $('#protocol-reset').addEventListener('click',()=>{protocol=[];storage.set('ti-protocol',protocol);renderProtocol();notify('Protocol reset');});renderProtocol();

  // Session mode
  const sessionData={pre:['PRE-MARKET RULE','My job is to prepare conditions—not predict candles.',['Bias defined','Key structure marked','Risk limit known','Mental state checked']],during:['LIVE-MARKET RULE','Wait. Observe. Execute only when your written condition appears.',['No chasing','No moving stop emotionally','Only A+ setup','Pause after loss']],post:['POST-MARKET RULE','The session is finished when the lesson is recorded.',['Screenshot the trade','Score execution','Record emotion','Write one lesson']]};
  $$('.session-tabs button').forEach(b=>b.addEventListener('click',()=>{$$('.session-tabs button').forEach(x=>x.classList.remove('active'));b.classList.add('active');const [label,quote,items]=sessionData[b.dataset.session];$('#session-content').innerHTML=`<div class="session-quote"><small>${label}</small><strong>${quote}</strong></div><div class="session-items">${items.map(x=>`<label><input type="checkbox"><span></span>${x}</label>`).join('')}</div>`;}));

  // Journal
  let journal=storage.get('ti-journal',[]);
  const dayKey=d=>new Date(d).toISOString().slice(0,10);
  function calcStreak(){if(!journal.length)return 0;const unique=[...new Set(journal.map(x=>dayKey(x.date)))].sort().reverse();let streak=0;let cursor=new Date();for(let i=0;i<unique.length;i++){const k=cursor.toISOString().slice(0,10);if(unique.includes(k)){streak++;cursor.setDate(cursor.getDate()-1);}else if(i===0){cursor.setDate(cursor.getDate()-1);if(unique.includes(cursor.toISOString().slice(0,10))){streak++;cursor.setDate(cursor.getDate()-1);}else break;}else break;}return streak;}
  function renderJournal(){const list=$('#journal-list');$('#journal-streak').textContent=calcStreak();if(!journal.length){list.innerHTML='<div class="empty-journal">No entries yet. Your first review will appear here.</div>';return;}list.innerHTML=journal.slice().reverse().slice(0,12).map(x=>`<article class="journal-entry"><div class="journal-entry-top"><strong>${escapeHtml(x.setup)}</strong><small>${new Date(x.date).toLocaleDateString()}</small></div><p>${escapeHtml(x.lesson||'No lesson recorded.')}</p><div class="journal-entry-tags"><span>${escapeHtml(x.result)}</span><span>Before: ${escapeHtml(x.before)}</span><span>Rules: ${escapeHtml(x.rules)}</span></div></article>`).join('');}
  $('#journal-form').addEventListener('submit',e=>{e.preventDefault();journal.push({date:new Date().toISOString(),setup:$('#journal-setup').value.trim(),result:$('#journal-result').value,before:$('#emotion-before').value,after:$('#emotion-after').value,rules:$('#journal-rules').value,lesson:$('#journal-lesson').value.trim()});if(journal.length>100)journal=journal.slice(-100);storage.set('ti-journal',journal);e.target.reset();renderJournal();notify('Journal entry saved');});
  $('#clear-journal').addEventListener('click',()=>{if(confirm('Clear all journal entries stored on this device?')){journal=[];storage.set('ti-journal',journal);renderJournal();}});renderJournal();

  // Emergency reset
  const emergency=$('#emergency-modal');let breathTimer=null,breathRemaining=60;
  $$('[data-open-emergency]').forEach(b=>b.addEventListener('click',()=>{if(!emergency.open)emergency.showModal();}));$$('[data-close-emergency]').forEach(b=>b.addEventListener('click',()=>emergency.close()));
  $('#breath-start').addEventListener('click',()=>{if(breathTimer)return;breathRemaining=60;$('#breath-count').textContent=breathRemaining;$('#breath-start').textContent='Reset in progress…';let phase=0;const phases=[['Breathe in · 4 seconds','breathe-in',4],['Hold · 2 seconds','',2],['Breathe out · 6 seconds','breathe-out',6]];let phaseRemaining=phases[0][2];const apply=()=>{const [text,cls]=phases[phase];$('#breath-instruction').textContent=text;$('#breath-orb').classList.remove('breathe-in','breathe-out');if(cls)$('#breath-orb').classList.add(cls);};apply();breathTimer=setInterval(()=>{breathRemaining--;phaseRemaining--;$('#breath-count').textContent=breathRemaining;if(phaseRemaining<=0){phase=(phase+1)%phases.length;phaseRemaining=phases[phase][2];apply();}if(breathRemaining<=0){clearInterval(breathTimer);breathTimer=null;$('#breath-orb').classList.remove('breathe-in','breathe-out');$('#breath-count').textContent='✓';$('#breath-label').textContent='reset complete';$('#breath-instruction').textContent='Now recheck the setup. If urgency remains, do not trade.';$('#breath-start').textContent='Start again';notify('Reset complete');}},1000);});
  emergency.addEventListener('close',()=>{if(breathTimer){clearInterval(breathTimer);breathTimer=null;}$('#breath-start').textContent='Start 60-second reset';$('#breath-count').textContent='60';$('#breath-label').textContent='seconds';$('#breath-orb').classList.remove('breathe-in','breathe-out');$('#breath-instruction').textContent='Press start. Breathe in for 4, hold for 2, out for 6.';});

  // Embedded sources
  const videoModal=$('#video-modal'),frame=$('#video-frame');$$('[data-video]').forEach(b=>b.addEventListener('click',()=>{$('#video-title').textContent=b.dataset.videoTitle;frame.src=`https://www.youtube-nocookie.com/embed/${encodeURIComponent(b.dataset.video)}?rel=0`;videoModal.showModal();}));$$('[data-close-video]').forEach(b=>b.addEventListener('click',()=>videoModal.close()));videoModal.addEventListener('close',()=>frame.src='');

  // Search modal
  const searchModal=$('#search-modal'),globalInput=$('#global-search');
  const searchItems=[
    ['Trader OS dashboard','#dashboard','mental state score daily rule'],['Daily mental check-in','#daily-check','calm fear greed anger tired emotion'],['Psychology playbook','#playbook','fear fomo risk process execution recovery'],['Candle psychology','#candles','wick engulfing inside displacement candles'],['Mind lab','#mind','fear greed revenge euphoria'],['Trade gate','#trade-gate','checklist entry stop risk reward'],['Mistake library','#mistakes','fomo revenge overtrading oversizing stop loss'],['Learning path','#diagnostic','hesitate overtrade revenge fear chase strategy'],['7-day protocol','#protocol','training discipline week'],['Session mode','#session-mode','pre market during post'],['Psychology journal','#journal','journal emotion lesson'],['My Playbook','#saved','saved bookmark'],['Source transparency','#sources','video podcast source rande howell']
  ];
  const renderGlobal=()=>{const q=globalInput.value.trim().toLowerCase();const list=q?searchItems.filter(x=>(x[0]+' '+x[2]).toLowerCase().includes(q)):[];$('#global-results').innerHTML=list.length?list.map(x=>`<button class="search-result" type="button" data-target="${x[1]}"><strong>${x[0]}</strong><small>${x[2]}</small></button>`).join(''):'<p>Try “FOMO”, “stop loss”, “fear”, “journal” or “structure”.</p>';$$('[data-target]',$('#global-results')).forEach(b=>b.addEventListener('click',()=>{searchModal.close();$(b.dataset.target)?.scrollIntoView({behavior:'smooth'});}));};
  $('#search-trigger').addEventListener('click',()=>{searchModal.showModal();setTimeout(()=>globalInput.focus(),50)});$$('[data-close-search]').forEach(b=>b.addEventListener('click',()=>searchModal.close()));globalInput.addEventListener('input',renderGlobal);document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();searchModal.showModal();setTimeout(()=>globalInput.focus(),50)}if(e.key==='Escape'){closeMenu();}});

  // Helpers
  function escapeHtml(v=''){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
  function escapeAttr(v=''){return escapeHtml(v).replace(/`/g,'&#96;');}
  syncBookmarks(); updateScore(); renderGlobal();
})();
