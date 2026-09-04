(() => {
const SUPABASE_URL="https://cswvtuhbxvwigodcgwox.supabase.co";
const SUPABASE_KEY="sb_publishable_vPVjJOw_kiKRnsg0P8epZQ_TAjEcq0r";
const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const tg=window.Telegram?.WebApp;if(tg){tg.ready();tg.expand();}

const SPHERES=[
 {id:'work',label:'Работа',icon:'💼'},
 {id:'health',label:'Здоровье',icon:'🏃'},
 {id:'impressions',label:'Впечатления',icon:'✨'},
 {id:'home',label:'Дом',icon:'🏠'},
 {id:'finance',label:'Финансы',icon:'₽'},
 {id:'growth',label:'Развитие',icon:'📚'},
 {id:'personal',label:'Личное',icon:'♡'}
];

const seed={
 weekFocus:'Не растерять ритм и закрыть ключевые рабочие задачи',
 tasks:[
  {id:'1',text:'12 000 шагов',done:false,scope:'today',sphere:'health',linkType:'goal',linkId:'sport'},
  {id:'2',text:'Тигры · Сбер приглосы',done:false,scope:'today',sphere:'work',linkType:'goal',linkId:'work'},
  {id:'3',text:'Презентация Уралсиб',done:false,scope:'today',sphere:'work',linkType:'goal',linkId:'work'},
  {id:'4',text:'Помыть волосы',done:false,scope:'today',sphere:'personal',linkType:null,linkId:null},
  {id:'5',text:'Погулять',done:false,scope:'today',sphere:'impressions',linkType:'goal',linkId:'life'},
  {id:'6',text:'2 пробежки',done:false,scope:'week',sphere:'health',linkType:'goal',linkId:'sport'},
  {id:'7',text:'Перевести часть денег в валюту',done:false,scope:'week',sphere:'finance',linkType:null,linkId:null}
 ],
 yearGoals:[
  {id:'work',icon:'💼',title:'Работа и доход',desc:'Стабильный доход 250К+ и сильные проекты',progress:72},
  {id:'sport',icon:'🏃',title:'Форма',desc:'Регулярный спорт · сильное тело · 58 кг',progress:54},
  {id:'life',icon:'✨',title:'Активный год',desc:'Новый опыт, поездки, люди и приключения',progress:64}
 ],
 monthGoals:[
  {goal:'work',title:'250 000+ ₽ за месяц',progress:72},
  {goal:'sport',title:'Вернуться в спортивный режим',progress:54},
  {goal:'life',title:'Сделать месяц насыщенным',progress:50}
 ],
 wishes:[
  {id:'w1',title:'Оффер мечты',status:'done',month:false,sphere:'work'},
  {id:'w2',title:'Новый айфон',status:'done',month:false,sphere:'personal'},
  {id:'w3',title:'Обучение стратегии',status:'done',month:false,sphere:'growth'},
  {id:'w4',title:'Сделать семейное древо',status:'planned',month:true,sphere:'personal'},
  {id:'w5',title:'Съездить в Кыргызстан',status:'planned',month:true,sphere:'impressions'}
 ]
};

seed.retro={worked:'',didnt:'',why:'',insight:'',change:''};
let state=structuredClone(seed),user=null,saveTimer,currentParentId=null;
let filters={today:'all',week:'all'};
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>crypto.randomUUID?crypto.randomUUID():String(Date.now()+Math.random());

function normalizeState(raw){
 const merged={...structuredClone(seed),...raw};
 merged.yearGoals=raw?.yearGoals||structuredClone(seed.yearGoals);
 merged.monthGoals=raw?.monthGoals||structuredClone(seed.monthGoals);
 merged.tasks=(raw?.tasks||seed.tasks).map(t=>{
   let sphere=t.sphere;
   if(!sphere) sphere=t.goal==='sport'?'health':t.goal==='work'?'work':t.goal==='life'?'impressions':'personal';
   return {...t,sphere,linkType:t.linkType||(t.goal?'goal':null),linkId:t.linkId||(t.goal||null),kind:t.kind||'single',subtasks:(t.subtasks||[]).map(st=>({...st,id:st.id||uid(),date:st.date||null}))};
 });
 merged.retro={worked:'',didnt:'',why:'',insight:'',change:'',...(raw?.retro||{})};
 merged.monthThoughts={work:'',sport:'',life:'',...(raw?.monthThoughts||{})};
 merged.monthPlans=(raw?.monthPlans||[]).map(p=>({...p,id:p.id||uid(),done:!!p.done}));
 merged.wishes=(raw?.wishes||seed.wishes).map(w=>({
   ...w,
   status:w.status||(w.done?'done':w.month?'planned':'want'),
   sphere:w.sphere||'personal'
 }));
 return merged;
}

async function loadState(){
 const {data,error}=await sb.from('planner_state').select('data').eq('user_id',user.id).maybeSingle();
 if(error)throw error;
 if(data?.data&&Object.keys(data.data).length){
   try{
     localStorage.setItem('aisseveryday_supabase_backup_latest',JSON.stringify({
       savedAt:new Date().toISOString(),
       data:data.data
     }));
   }catch(_){}
   state=normalizeState(data.data);
 } else {
   state=normalizeState(seed);
   const {error:seedError}=await sb.from('planner_state').upsert(
     {user_id:user.id,data:state,updated_at:new Date().toISOString()},
     {onConflict:'user_id'}
   );
   if(seedError)throw seedError;
 }
}
function save(){clearTimeout(saveTimer);saveTimer=setTimeout(async()=>{
 const {error}=await sb.from('planner_state').upsert({user_id:user.id,data:state,updated_at:new Date().toISOString()},{onConflict:'user_id'});
 if(error) toast('Ошибка синхронизации');
},250)}
function toast(t){const e=$('#toast');e.textContent=t;e.classList.remove('hidden');setTimeout(()=>e.classList.add('hidden'),1600)}
function celebrate(){const c=$('#celebration');if(!c)return;c.classList.remove('hidden','play');void c.offsetWidth;c.classList.add('play');setTimeout(()=>c.classList.add('hidden'),1100)}
function sphere(id){return SPHERES.find(x=>x.id===id)||SPHERES[6]}
function goalName(id){const g=state.yearGoals.find(x=>x.id===id);return g?g.icon+' '+g.title:''}
function wishName(id){return state.wishes.find(x=>x.id===id)?.title||''}
function linkedLabel(t){
 if(t.linkType==='goal') return '→ '+goalName(t.linkId);
 if(t.linkType==='wish') return '→ ✦ '+wishName(t.linkId);
 return '';
}


function isoDate(d){const x=new Date(d);x.setHours(12,0,0,0);return x.toISOString().slice(0,10)}
function todayISO(){return isoDate(new Date())}
function weekDays(){
 const now=new Date(); now.setHours(12,0,0,0);
 const day=(now.getDay()+6)%7;
 const monday=new Date(now); monday.setDate(now.getDate()-day);
 return Array.from({length:7},(_,i)=>{const d=new Date(monday);d.setDate(monday.getDate()+i);return d});
}
function dayLabel(d){
 const today=todayISO(), id=isoDate(d);
 if(id===today) return 'Сегодня';
 return new Intl.DateTimeFormat('ru-RU',{weekday:'short',day:'numeric',month:'short'}).format(d).replace('.','');
}
function dateOptions(selected){
 return `<option value="">Выбрать день</option>`+weekDays().map(d=>`<option value="${isoDate(d)}" ${selected===isoDate(d)?'selected':''}>${dayLabel(d)}</option>`).join('');
}

function parentProgress(t){const subs=t.subtasks||[];if(!subs.length)return{done:0,total:0,pct:0};const done=subs.filter(s=>s.done).length;return{done,total:subs.length,pct:Math.round(done/subs.length*100)}}
function syncParentDone(t){if(t.kind==='parent'&&(t.subtasks||[]).length)t.done=t.subtasks.every(s=>s.done)}

function sphereTag(id){const s=sphere(id);return `<span class="tag">${s.icon} ${esc(s.label)}</span>`}

function taskEl(t,context='today'){
 const d=document.createElement('div');d.className='task'+(t.done?' done':'')+(t.kind==='parent'?' parent-task':'');
 const prog=t.kind==='parent'?parentProgress(t):null;
 const progressHtml=prog?`<div class="parent-progress"><div class="row"><span>${prog.done}/${prog.total} выполнено</span><b>${prog.pct}%</b></div><div class="bar"><div style="width:${prog.pct}%"></div></div></div>`:'';
 let action='';
 if(context==='week'){
   action=t.kind==='parent'
     ? '<button class="subs">Запланировать</button>'
     : '<button class="make-parent">Разбить</button>';
 }
 d.innerHTML=`<input type="checkbox" ${t.done?'checked':''}><div class="copy"><div>${esc(t.text)}</div><div class="meta">${sphereTag(t.sphere)} ${linkedLabel(t)?`<span>${esc(linkedLabel(t))}</span>`:''}${t.kind==='parent'?`<span>· ${prog.done}/${prog.total}</span>`:''}</div>${progressHtml}</div>${action}<button class="del">×</button>`;
 d.querySelector('input').onchange=e=>{
   t.done=e.target.checked;
   if(t.kind==='parent'&&(t.subtasks||[]).length)t.subtasks.forEach(s=>s.done=t.done);
   if(t.done)celebrate();save();setTimeout(render,t.done?650:0)
 };
 if(context==='week'&&t.kind==='parent') d.querySelector('.subs').onclick=()=>openSubtasks(t.id);
 if(context==='week'&&t.kind!=='parent') d.querySelector('.make-parent').onclick=()=>{
   t.kind='parent'; t.subtasks=t.subtasks||[]; t.done=false; save(); render(); openSubtasks(t.id);
 };
 d.querySelector('.del').onclick=()=>{state.tasks=state.tasks.filter(x=>x.id!==t.id);save();render()};
 return d
}

function scheduledSubtaskEl(parent,sub){
 const d=document.createElement('div');
 d.className='task scheduled-subtask'+(sub.done?' done':'');
 d.innerHTML=`<input type="checkbox" ${sub.done?'checked':''}><div class="copy"><div>${esc(sub.text)}</div><div class="meta">${sphereTag(parent.sphere)} <span>↳ из недели: ${esc(parent.text)}</span></div></div><button class="del" title="Убрать из дня">×</button>`;
 d.querySelector('input').onchange=e=>{sub.done=e.target.checked;syncParentDone(parent);if(sub.done)celebrate();save();setTimeout(render,sub.done?650:0)};
 d.querySelector('.del').onclick=()=>{sub.date=null;save();render()};
 return d;
}

function goalHtml(g,month=false){
 const icon=month?(state.yearGoals.find(x=>x.id===g.goal)?.icon||''):g.icon,id=month?g.goal:g.id,level=month?'month':'year';
 return `<div class="goal dopamine-card"><div class="row"><b>${icon} ${esc(g.title)}</b><span class="progress-number">${g.progress}%</span></div>${month?'':`<p>${esc(g.desc)}</p>`}<div class="bar"><div style="width:${g.progress}%"></div></div><button class="decompose-btn" data-decompose-level="${level}" data-decompose-id="${id}">＋ Разбить дальше</button></div>`
}
function filterHtml(scope){
 const active=filters[scope];
 return [{id:'all',label:'Все',icon:''},...SPHERES]
   .map(s=>`<button class="filter ${active===s.id?'active':''}" data-filter="${s.id}" data-scope="${scope}">${s.icon||''} ${s.label}</button>`)
   .join('');
}

function renderFilters(){
 $('#todayFilters').innerHTML=filterHtml('today');
 $('#weekFilters').innerHTML=filterHtml('week');
 $$('[data-filter]').forEach(b=>b.onclick=()=>{filters[b.dataset.scope]=b.dataset.filter;render()});
}
function taskOptions(){
 const sphereOpts=SPHERES.map(s=>`<option value="${s.id}">${s.icon} ${s.label}</option>`).join('');
 ['taskSphere','weekTaskSphere'].forEach(id=>{$('#'+id).innerHTML=sphereOpts});
 const linkOpts=`<option value="">Без связи</option><optgroup label="3 цели года">${state.yearGoals.map(g=>`<option value="goal:${g.id}">${g.icon} ${esc(g.title)}</option>`).join('')}</optgroup><optgroup label="50 желаний">${state.wishes.filter(w=>w.status!=='done').map(w=>`<option value="wish:${w.id}">✦ ${esc(w.title)}</option>`).join('')}</optgroup>`;
 ['taskLink','weekTaskLink'].forEach(id=>{$('#'+id).innerHTML=linkOpts});
}
function wishCard(w){
 const linked=state.tasks.filter(t=>t.linkType==='wish'&&t.linkId===w.id),done=linked.filter(t=>t.done).length;
 return `<div class="wish-card dopamine-card"><div class="wish-main"><button class="wish-check" data-wish-done="${w.id}">○</button><div><b>${esc(w.title)}</b><div class="meta">${sphereTag(w.sphere)} <span>${w.month?'В этом месяце':'Хочу'}</span>${linked.length?` <span>· задач ${done}/${linked.length}</span>`:''}</div></div></div><div class="wish-actions"><button data-wish-month="${w.id}">${w.month?'Убрать из месяца':'В месяц'}</button><button data-decompose-level="wish" data-decompose-id="${w.id}">＋ Разбить дальше</button></div></div>`;
}
function completedWishCard(w){return `<div class="wish-card done completed-card"><div class="wish-main"><button class="wish-check" data-wish-done="${w.id}">✓</button><div><b>${esc(w.title)}</b><div class="meta">${sphereTag(w.sphere)} <span>Исполнено</span></div></div></div></div>`;}
function monthWishCard(w){
 const linked=state.tasks.filter(t=>t.linkType==='wish'&&t.linkId===w.id);
 const done=linked.filter(t=>t.done).length;
 return `<div class="wish month-wish"><div><b>${esc(w.title)}</b><div class="meta">${sphereTag(w.sphere)} ${linked.length?`<span>задач ${done}/${linked.length}</span>`:'<span>ещё нет задач</span>'}</div></div><button data-wish-task="${w.id}">+ задача</button></div>`;
}
function bindWishActions(){
 $$('[data-wish-done]').forEach(b=>b.onclick=()=>{const w=state.wishes.find(x=>x.id===b.dataset.wishDone);w.status=w.status==='done'?'want':'done';if(w.status==='done')celebrate();save();setTimeout(render,w.status==='done'?650:0)});
 $$('[data-wish-month]').forEach(b=>b.onclick=()=>{const w=state.wishes.find(x=>x.id===b.dataset.wishMonth);w.month=!w.month;if(w.month&&w.status==='want')w.status='planned';save();render()});
 $$('[data-wish-task]').forEach(b=>b.onclick=()=>{const w=state.wishes.find(x=>x.id===b.dataset.wishTask);state.tasks.push({id:uid(),text:'Шаг к «'+w.title+'»',done:false,scope:'today',sphere:w.sphere,linkType:'wish',linkId:w.id,kind:'single',subtasks:[]});save();render();toast('Задача добавлена на сегодня')});
 $$('[data-wish-parent]').forEach(b=>b.onclick=()=>{const w=state.wishes.find(x=>x.id===b.dataset.wishParent);const t={id:uid(),text:w.title,done:false,scope:'week',sphere:w.sphere,linkType:'wish',linkId:w.id,kind:'parent',subtasks:[]};state.tasks.push(t);save();render();openSubtasks(t.id)});
}
function renderSphereSummary(){
 const counts=SPHERES.map(s=>({s,total:state.tasks.filter(t=>t.sphere===s.id).length,done:state.tasks.filter(t=>t.sphere===s.id&&t.done).length}));
 const max=Math.max(1,...counts.map(x=>x.total));
 $('#sphereSummary').innerHTML=counts.map(x=>`<div class="sphere-row"><div class="row"><span>${x.s.icon} ${x.s.label}</span><span>${x.done}/${x.total}</span></div><div class="bar"><div style="width:${(x.total/max)*100}%"></div></div></div>`).join('');
}


function monthPlanHtml(p){
 const parent=p.parentType==='wish'?'✦ '+wishName(p.parentId):p.parentType==='goal'?goalName(p.parentId):'';
 return `<div class="month-plan dopamine-card ${p.done?'done':''}"><label class="plan-check"><input type="checkbox" data-month-plan-check="${p.id}" ${p.done?'checked':''}><span><b>${esc(p.text)}</b><small>${parent?`↳ ${esc(parent)}`:''}</small></span></label><button class="decompose-btn" data-decompose-level="monthPlan" data-decompose-id="${p.id}">＋ Разбить на неделю</button></div>`;
}
function renderMonthThoughts(){
 const defs=[['work','💼 Работа и доход'],['sport','🏃 Форма и здоровье'],['life','✨ Жизнь и впечатления']];
 $('#monthThoughts').innerHTML=defs.map(([id,label])=>`<div class="thought-card"><b>${label}</b><textarea data-thought="${id}" placeholder="Мысли, идеи, намерения…">${esc(state.monthThoughts[id]||'')}</textarea></div>`).join('');
 $$('[data-thought]').forEach(t=>t.onchange=()=>{state.monthThoughts[t.dataset.thought]=t.value;save()});
}
function bindMonthPlans(){$$('[data-month-plan-check]').forEach(c=>c.onchange=()=>{const p=state.monthPlans.find(x=>x.id===c.dataset.monthPlanCheck);p.done=c.checked;if(p.done)celebrate();save();setTimeout(render,p.done?650:0)})}
let decomposeCtx=null;
function openDecompose(level,id){
 decomposeCtx={level,id};let title='',hint='',ph='';
 if(level==='year'){const g=state.yearGoals.find(x=>x.id===id);title=g?.title||'Цель года';hint='Добавим часть этой цели в текущий месяц.';ph='Например: прочитать 4 книги в сентябре'}
 if(level==='wish'){const w=state.wishes.find(x=>x.id===id);title=w?.title||'Желание';hint='Добавим конкретный план на этот месяц.';ph='Например: прочитать 4 книги в сентябре'}
 if(level==='month'){const g=state.monthGoals.find(x=>x.goal===id);title=g?.title||'Цель месяца';hint='Добавим конкретную задачу на эту неделю.';ph='Например: сделать 4 тренировки'}
 if(level==='monthPlan'){const p=state.monthPlans.find(x=>x.id===id);title=p?.text||'План месяца';hint='Добавим конкретную задачу на эту неделю.';ph='Например: дочитать одну книгу'}
 $('#decomposeTitle').textContent=title;$('#decomposeHint').textContent=hint;$('#decomposeText').placeholder=ph;$('#decomposeText').value='';$('#decomposeDialog').showModal()
}
function bindDecompose(){$$('[data-decompose-level]').forEach(b=>b.onclick=()=>openDecompose(b.dataset.decomposeLevel,b.dataset.decomposeId))}
function renderRetro(){
 const all=state.tasks,done=all.filter(t=>t.done).length,health=all.filter(t=>t.sphere==='health'&&t.done).length,wishesDone=state.wishes.filter(w=>w.status==='done').length,linkedDone=all.filter(t=>t.done&&t.linkType==='wish').length;
 $('#retroStats').innerHTML=[['Задачи',done+'/'+all.length],['Здоровье',health+' выполнено'],['Желания',wishesDone+'/50'],['Шаги к желаниям',linkedDone]].map(x=>`<div class="retro-stat"><b>${x[1]}</b><span>${x[0]}</span></div>`).join('');
 $('#retroWorked').value=state.retro?.worked||''; $('#retroDidnt').value=state.retro?.didnt||''; $('#retroWhy').value=state.retro?.why||''; $('#retroInsight').value=state.retro?.insight||''; $('#retroChange').value=state.retro?.change||'';
}
function openSubtasks(id){currentParentId=id;const t=state.tasks.find(x=>x.id===id);if(!t)return;$('#subtaskTitle').textContent=t.text+' · разложить по дням';renderSubtasks();$('#subtaskDialog').showModal()}
function renderSubtasks(){
 const t=state.tasks.find(x=>x.id===currentParentId);if(!t)return;
 const list=$('#subtaskList');
 list.innerHTML=(t.subtasks||[]).map(s=>`
   <div class="subtask-plan-row">
     <input type="checkbox" data-sub-check="${s.id}" ${s.done?'checked':''}>
     <div class="subtask-copy">
       <span class="${s.done?'done-text':''}">${esc(s.text)}</span>
       <select data-sub-date="${s.id}">${dateOptions(s.date)}</select>
     </div>
     <button data-sub-del="${s.id}">×</button>
   </div>`).join('')||'<p class="empty">Добавь отдельные шаги. Например: «Зарядка 1», «Зарядка 2», «Зарядка 3», «Зарядка 4». Потом назначь каждому день.</p>';
 $$('[data-sub-check]').forEach(b=>b.onchange=()=>{const st=t.subtasks.find(s=>s.id===b.dataset.subCheck);st.done=b.checked;syncParentDone(t);save();renderSubtasks();render()});
 $$('[data-sub-date]').forEach(sel=>sel.onchange=()=>{const st=t.subtasks.find(s=>s.id===sel.dataset.subDate);st.date=sel.value||null;save();renderSubtasks();render();if(st.date===todayISO())toast('Добавлено в Сегодня')});
 $$('[data-sub-del]').forEach(b=>b.onclick=()=>{t.subtasks=t.subtasks.filter(s=>s.id!==b.dataset.subDel);syncParentDone(t);save();renderSubtasks();render()});
}

function render(){
 const now=new Date();
 $('#dateLabel').textContent=new Intl.DateTimeFormat('ru-RU',{weekday:'long',day:'numeric',month:'long'}).format(now).toUpperCase();
 $('#monthLabel').textContent=new Intl.DateTimeFormat('ru-RU',{month:'long'}).format(now).toUpperCase();
 $('#yearLabel').textContent='МОЙ '+now.getFullYear();

 renderFilters(); taskOptions();

 const allToday=state.tasks.filter(t=>t.scope==='today');
 const filteredToday=allToday.filter(t=>filters.today==='all'||t.sphere===filters.today);
 const scheduled=[];
 state.tasks.filter(t=>t.scope==='week'&&t.kind==='parent').forEach(parent=>{
   (parent.subtasks||[]).filter(s=>s.date===todayISO()).forEach(sub=>scheduled.push({parent,sub}));
 });
 const scheduledFiltered=scheduled.filter(x=>filters.today==='all'||x.parent.sphere===filters.today);
 const a=filteredToday.filter(t=>!t.done),d=filteredToday.filter(t=>t.done);
 const sa=scheduledFiltered.filter(x=>!x.sub.done),sd=scheduledFiltered.filter(x=>x.sub.done);
 $('#todayTasks').replaceChildren(...a.map(t=>taskEl(t,'today')),...sa.map(x=>scheduledSubtaskEl(x.parent,x.sub)));
 $('#doneTasks').replaceChildren(...d.map(t=>taskEl(t,'today')),...sd.map(x=>scheduledSubtaskEl(x.parent,x.sub)));
 const total=allToday.length+scheduled.length;
 const doneTotal=allToday.filter(t=>t.done).length+scheduled.filter(x=>x.sub.done).length;
 $('#doneCount').textContent=doneTotal;
 $('#todayCount').textContent=doneTotal+'/'+total;

 $('#weekFocus').textContent=state.weekFocus;
 const w=state.tasks.filter(t=>t.scope==='week'&&(filters.week==='all'||t.sphere===filters.week));
 $('#weekTasks').replaceChildren(...w.map(t=>taskEl(t,'week')));

 $('#monthGoals').innerHTML=state.monthGoals.map(g=>goalHtml(g,true)).join('');
 renderMonthThoughts();
 $('#monthPlans').innerHTML=state.monthPlans.map(monthPlanHtml).join('')||'<p class="empty">Пока пусто. Нажми «Разбить дальше» у цели года или желания.</p>';
 $('#monthWishes').innerHTML=state.wishes.filter(x=>x.month&&x.status!=='done').map(monthWishCard).join('')||'<p class="empty">Пока ни одно желание не выбрано на этот месяц.</p>';

 $('#yearGoals').innerHTML=state.yearGoals.map(g=>goalHtml(g,false)).join('');
 const completed=state.wishes.filter(x=>x.status==='done'),activeWishes=state.wishes.filter(x=>x.status!=='done');
 $('#wishCount').textContent=state.wishes.length+' всего · '+completed.length+' исполнено';
 $('#wishProgress').style.width=(state.wishes.length?Math.round(completed.length/state.wishes.length*100):0)+'%';
 $('#wishList').innerHTML=activeWishes.map(wishCard).join('')||'<p class="empty">Все текущие желания исполнены ✨</p>';
 $('#completedWishCount').textContent=completed.length;
 $('#completedWishList').innerHTML=completed.map(completedWishCard).join('');
 renderSphereSummary();
 renderRetro();
 bindWishActions();
 bindMonthPlans();
 bindDecompose();
}
function addTask(scope,inputId,sphereId,linkId,kindId){
 const x=$('#'+inputId),text=x.value.trim();if(!text)return;
 const link=$('#'+linkId).value;let linkType=null,linkedId=null;
 if(link){[linkType,linkedId]=link.split(':')}
 const kind=$('#'+kindId).value; state.tasks.push({id:uid(),text,done:false,scope,sphere:$('#'+sphereId).value,linkType,linkId:linkedId,kind,subtasks:[]});
 x.value='';save();render();
}
$$('nav button').forEach(b=>b.onclick=()=>{$$('.screen').forEach(s=>s.classList.toggle('active',s.dataset.screen===b.dataset.target));$$('nav button').forEach(x=>x.classList.toggle('active',x===b))});
$('#addTask').onsubmit=e=>{e.preventDefault();addTask('today','taskInput','taskSphere','taskLink','taskKind')};
$('#addWeekTask').onsubmit=e=>{e.preventDefault();addTask('week','weekTaskInput','weekTaskSphere','weekTaskLink','weekTaskKind')};

$('#addWishBtn').onclick=()=>{$('#wishSphere').innerHTML=SPHERES.map(s=>`<option value="${s.id}">${s.icon} ${s.label}</option>`).join('');$('#wishDialog').showModal()};
$('#wishForm').onsubmit=e=>{
 if(e.submitter?.value==='cancel')return;
 e.preventDefault();const title=$('#wishTitle').value.trim();if(!title)return;
 state.wishes.push({id:uid(),title,status:'want',month:false,sphere:$('#wishSphere').value});
 $('#wishTitle').value='';$('#wishDialog').close();save();render();
};

$('#authForm').onsubmit=async e=>{e.preventDefault();$('#authMessage').textContent='Входим…';const {data,error}=await sb.auth.signInWithPassword({email:$('#email').value.trim(),password:$('#password').value});if(error){$('#authMessage').textContent=error.message;return}user=data.user;try{await loadState();$('#authGate').classList.add('hidden');$('#app').classList.remove('hidden');render()}catch(err){$('#authMessage').textContent='Вход выполнен, но данные не загрузились: '+err.message}};
$('#signup').onclick=async()=>{$('#authMessage').textContent='Создаём аккаунт…';const {data,error}=await sb.auth.signUp({email:$('#email').value.trim(),password:$('#password').value});if(error){$('#authMessage').textContent=error.message;return}if(!data.session){$('#authMessage').textContent='Аккаунт создан. Подтверди email в письме, затем вернись сюда и нажми «Войти».';return}user=data.user;await loadState();$('#authGate').classList.add('hidden');$('#app').classList.remove('hidden');render()};

$('#saveRetro').onclick=()=>{state.retro={worked:$('#retroWorked').value,didnt:$('#retroDidnt').value,why:$('#retroWhy').value,insight:$('#retroInsight').value,change:$('#retroChange').value};save();toast('Ретро сохранено')};
$('#addSubtaskForm').onsubmit=e=>{e.preventDefault();const t=state.tasks.find(x=>x.id===currentParentId),text=$('#subtaskInput').value.trim();if(!t||!text)return;t.subtasks=t.subtasks||[];t.subtasks.push({id:uid(),text,done:false,date:null});$('#subtaskInput').value='';syncParentDone(t);save();renderSubtasks();render()};
$('#closeSubtasks').onclick=()=>$('#subtaskDialog').close();


$('#cancelDecompose').onclick=()=>$('#decomposeDialog').close();
$('#decomposeForm').onsubmit=e=>{
 e.preventDefault();const text=$('#decomposeText').value.trim();if(!text||!decomposeCtx)return;
 const {level,id}=decomposeCtx;
 if(level==='year'){state.monthPlans.push({id:uid(),text,done:false,parentType:'goal',parentId:id,sphere:id==='sport'?'health':id==='work'?'work':'impressions'});toast('Добавлено в месяц')}
 if(level==='wish'){const w=state.wishes.find(x=>x.id===id);state.monthPlans.push({id:uid(),text,done:false,parentType:'wish',parentId:id,sphere:w?.sphere||'personal'});if(w){w.month=true;if(w.status==='want')w.status='planned'}toast('Желание разбито на месяц')}
 if(level==='month'){state.tasks.push({id:uid(),text,done:false,scope:'week',sphere:id==='sport'?'health':id==='work'?'work':'impressions',linkType:'goal',linkId:id,kind:'single',subtasks:[],parentType:'monthGoal',parentId:id});toast('Добавлено в неделю')}
 if(level==='monthPlan'){const p=state.monthPlans.find(x=>x.id===id);state.tasks.push({id:uid(),text,done:false,scope:'week',sphere:p?.sphere||'personal',linkType:p?.parentType==='wish'?'wish':p?.parentType==='goal'?'goal':null,linkId:p?.parentId||null,kind:'single',subtasks:[],parentType:'monthPlan',parentId:id});toast('Добавлено в неделю')}
 save();$('#decomposeDialog').close();render()
};
$('#logout').onclick=async()=>{await sb.auth.signOut();location.reload()};
(async()=>{const {data:{session}}=await sb.auth.getSession();if(session?.user){user=session.user;try{await loadState();$('#authGate').classList.add('hidden');$('#app').classList.remove('hidden');render()}catch(e){$('#authMessage').textContent='Не удалось загрузить данные из Supabase: '+e.message}}})();
})();