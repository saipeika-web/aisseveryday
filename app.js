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

const RESULT_TYPES=[
 {id:'',label:'Без типа',icon:'·'},
 {id:'workout',label:'Тренировка',icon:'🎾'},
 {id:'book',label:'Книга',icon:'📚'},
 {id:'brief',label:'Бриф',icon:'🗂'},
 {id:'walk',label:'Прогулка',icon:'🚶'},
 {id:'steps',label:'Шаги',icon:'👟'},
 {id:'lesson',label:'Занятие',icon:'✏️'},
 {id:'other',label:'Другое',icon:'✦'}
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
let state=structuredClone(seed),user=null,saveTimer,currentParentId=null,selectedDay=null,moveCtx=null;
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
   return {...t,sphere,linkType:t.linkType||(t.goal?'goal':null),linkId:t.linkId||(t.goal||null),kind:t.kind||'single',date:t.date||null,time:t.time||null,resultType:t.resultType||null,completedAt:t.completedAt||null,subtasks:(t.subtasks||[]).map(st=>({...st,id:st.id||uid(),date:st.date||null,time:st.time||null,resultType:st.resultType||t.resultType||null,completedAt:st.completedAt||null}))};
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

function parseISODate(s){const [y,m,d]=String(s).split('-').map(Number);const x=new Date(y,m-1,d);x.setHours(12,0,0,0);return x}
function shiftDate(s,days){const d=parseISODate(s);d.setDate(d.getDate()+days);return isoDate(d)}
function selectedDate(){if(!selectedDay)selectedDay=todayISO();return selectedDay}
function prettySelectedDate(s){const d=parseISODate(s);return new Intl.DateTimeFormat('ru-RU',{weekday:'long',day:'numeric',month:'long'}).format(d)}
function resultTypeOf(item){
 if(item?.resultType)return item.resultType;
 const t=String(item?.text||'').toLowerCase();
 if(/тренир|заряд|пробеж|спорт|йог/.test(t))return 'workout';
 if(/книг|читать|прочит/.test(t))return 'book';
 if(/бриф/.test(t))return 'brief';
 if(/прогул|погуля/.test(t))return 'walk';
 if(/шаг/.test(t))return 'steps';
 if(/англий|занят|урок/.test(t))return 'lesson';
 return item?.resultType||'';
}
function resultDef(id){return RESULT_TYPES.find(x=>x.id===id)||RESULT_TYPES[0]}
function itemDate(item){return item?.date||null}
function isLegacyTodayTask(t){return t.scope==='today'&&!t.date}
function taskVisibleOnDay(t,day){return t.date===day || (day===todayISO()&&isLegacyTodayTask(t))}
function itemTimeValue(item){return item?.time||''}
function sortByTime(a,b){const at=itemTimeValue(a.item||a),bt=itemTimeValue(b.item||b);if(at&&bt)return at.localeCompare(bt);if(at)return -1;if(bt)return 1;return String((a.item||a).text||'').localeCompare(String((b.item||b).text||''),'ru')}
function setCompleted(item,done){item.done=done;item.completedAt=done?new Date().toISOString():null}
function periodBounds(kind){
 const now=new Date(); now.setHours(12,0,0,0);
 if(kind==='week'){const day=(now.getDay()+6)%7;const start=new Date(now);start.setDate(now.getDate()-day);const end=new Date(start);end.setDate(start.getDate()+6);return [isoDate(start),isoDate(end)]}
 const start=new Date(now.getFullYear(),now.getMonth(),1);const end=new Date(now.getFullYear(),now.getMonth()+1,0);return [isoDate(start),isoDate(end)]
}
function eventDateForSummary(item){if(item.date)return item.date;if(item.completedAt)return isoDate(new Date(item.completedAt));return null}
function summaryItems(kind){
 const [start,end]=periodBounds(kind),items=[];
 state.tasks.forEach(t=>{
   if(t.kind==='parent'&&(t.subtasks||[]).length){
     t.subtasks.forEach(st=>{const d=eventDateForSummary(st);if(st.done&&d&&d>=start&&d<=end)items.push({...st,resultType:st.resultType||t.resultType,text:st.text||t.text})});
   }else{
     const d=eventDateForSummary(t);
     const legacyWeek=kind==='week'&&t.done&&!d&&t.scope==='week';
     if(t.done&&((d&&d>=start&&d<=end)||legacyWeek))items.push(t);
   }
 });
 return items;
}
function summaryHtml(kind){
 const items=summaryItems(kind),counts={};
 items.forEach(i=>{const type=resultTypeOf(i)||'other';counts[type]=(counts[type]||0)+1});
 const entries=Object.entries(counts).sort((a,b)=>b[1]-a[1]);
 if(!entries.length)return '<div class="summary-empty">Пока нечего считать — закрывай задачи, и здесь появится коллекция результатов ✦</div>';
 return entries.map(([id,n],idx)=>{const def=resultDef(id);return `<article class="summary-card summary-${id}" style="--summary-index:${idx}"><div class="summary-objects">${Array.from({length:Math.min(n,12)},()=>`<span>${def.icon}</span>`).join('')}</div><strong>${n}</strong><p>${def.label}${n===1?'':' · '+n}</p></article>`}).join('');
}
function sphereColor(id){return ({work:'#ff8b5b',health:'#c7f94b',impressions:'#ff83b5',home:'#73d5c9',finance:'#ffd84d',growth:'#7898ff',personal:'#b48cff'})[id]||'#bbb'}
function daySphereStats(day){
 const items=[];
 state.tasks.filter(t=>taskVisibleOnDay(t,day)).forEach(t=>items.push({sphere:t.sphere,done:t.done}));
 state.tasks.filter(t=>t.scope==='week'&&t.kind==='parent').forEach(p=>(p.subtasks||[]).filter(s=>s.date===day).forEach(s=>items.push({sphere:p.sphere,done:s.done})));
 return SPHERES.map(s=>{const a=items.filter(i=>i.sphere===s.id);return {sphere:s,total:a.length,done:a.filter(i=>i.done).length,pct:a.length?a.filter(i=>i.done).length/a.length:0}})
}
function renderDayRing(day){
 const stats=daySphereStats(day),total=stats.reduce((n,x)=>n+x.total,0),done=stats.reduce((n,x)=>n+x.done,0);
 $('#dayScore').textContent=done+'/'+total;
 $('#dayRingSegments').innerHTML=stats.map((x,i)=>`<span class="ring-pill" style="--i:${i};--ring-color:${sphereColor(x.sphere.id)};--ring-opacity:${x.total?0.35+0.65*x.pct:0.16}" title="${x.sphere.label}: ${x.done}/${x.total}">${x.sphere.icon}</span>`).join('');
 $('#dayMessage').textContent=total===0?'Свободный день — можно оставить так ✦':done===total?'Сегодня всё закрыто ✨':done?`Уже ${done} из ${total}. Осталось ${total-done}`:`План готов: ${total} задач`;
}
function renderDayStrip(){
 const center=parseISODate(selectedDate());
 const days=Array.from({length:7},(_,i)=>{const d=new Date(center);d.setDate(center.getDate()+i-3);return d});
 $('#dayStrip').innerHTML=days.map(d=>{const id=isoDate(d),active=id===selectedDate();return `<button class="day-chip ${active?'active':''}" data-day="${id}"><small>${new Intl.DateTimeFormat('ru-RU',{weekday:'short'}).format(d).replace('.','')}</small><b>${d.getDate()}</b></button>`}).join('');
 $$('[data-day]').forEach(b=>b.onclick=()=>{selectedDay=b.dataset.day;render()});
}
function renderDayHeader(){
 const day=selectedDate(),d=parseISODate(day),isToday=day===todayISO();
 $('#selectedDateLabel').textContent=isToday?'СЕГОДНЯ':new Intl.DateTimeFormat('ru-RU',{month:'long'}).format(d).toUpperCase();
 $('#selectedDayTitle').textContent=isToday?'Сегодня':prettySelectedDate(day);
 $('#dayDatePicker').value=day;
 renderDayStrip();renderDayRing(day);
}
function openMoveTask(ctx){
 moveCtx=ctx;const item=ctx.kind==='task'?state.tasks.find(t=>t.id===ctx.taskId):(state.tasks.find(t=>t.id===ctx.parentId)?.subtasks||[]).find(s=>s.id===ctx.subId);if(!item)return;
 $('#moveTaskTitle').textContent=item.text||'Задача';$('#moveDate').value=item.date||selectedDate();$('#moveTime').value=item.time||'';$('#addToCalendar').disabled=!($('#moveDate').value);
 $('#moveDialog').showModal();
}
function getMoveItem(){if(!moveCtx)return null;if(moveCtx.kind==='task')return state.tasks.find(t=>t.id===moveCtx.taskId);const p=state.tasks.find(t=>t.id===moveCtx.parentId);return (p?.subtasks||[]).find(s=>s.id===moveCtx.subId)}
function applyMove(date,time){const item=getMoveItem();if(!item)return;item.date=date||null;item.time=time||null;if(moveCtx.kind==='task'&&date)item.scope=item.scope==='week'?'week':'today';save();$('#moveDialog').close();render();toast(date?'Перенесено':'Оставлено без даты')}
function icsEscape(s){return String(s||'').replace(/\\/g,'\\\\').replace(/,/g,'\\,').replace(/;/g,'\\;').replace(/\n/g,'\\n')}
function icsDate(date,time){const d=date.replaceAll('-','');return time?d+'T'+time.replace(':','')+'00':d}
function exportCalendar(){
 const item=getMoveItem();if(!item)return;const date=$('#moveDate').value||item.date;if(!date){toast('Сначала выбери дату');return}const time=$('#moveTime').value||item.time||'';
 const start=icsDate(date,time),end=time?icsDate(date,(()=>{const [h,m]=time.split(':').map(Number);const x=new Date(2000,0,1,h,m+60);return String(x.getHours()).padStart(2,'0')+':'+String(x.getMinutes()).padStart(2,'0')})()):icsDate(date,'');
 const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Aisseveryday//Planner//RU','BEGIN:VEVENT','UID:'+uid()+'@aisseveryday','DTSTAMP:'+new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z/,'Z'),time?'DTSTART:'+start:'DTSTART;VALUE=DATE:'+start,time?'DTEND:'+end:'DTEND;VALUE=DATE:'+icsDate(shiftDate(date,1),''),'SUMMARY:'+icsEscape(item.text),'DESCRIPTION:'+icsEscape('Добавлено из Мой навигатор'),'END:VEVENT','END:VCALENDAR'];
 const blob=new Blob([lines.join('\r\n')],{type:'text/calendar;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='aisseveryday-'+date+'.ics';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);toast('Файл календаря готов 📅');
}

function parentProgress(t){const subs=t.subtasks||[];if(!subs.length)return{done:0,total:0,pct:0};const done=subs.filter(s=>s.done).length;return{done,total:subs.length,pct:Math.round(done/subs.length*100)}}
function syncParentDone(t){if(t.kind==='parent'&&(t.subtasks||[]).length)t.done=t.subtasks.every(s=>s.done)}

function sphereTag(id){const s=sphere(id);return `<span class="tag">${s.icon} ${esc(s.label)}</span>`}

function taskEl(t,context='today'){
 const d=document.createElement('div');d.className='task'+(t.done?' done':'')+(t.kind==='parent'?' parent-task':'');
 const prog=t.kind==='parent'?parentProgress(t):null, rdef=resultDef(resultTypeOf(t));
 const progressHtml=prog?`<div class="parent-progress"><div class="row"><span>${prog.done}/${prog.total} выполнено</span><b>${prog.pct}%</b></div><div class="bar"><div style="width:${prog.pct}%"></div></div></div>`:'';
 let action='';if(context==='week')action=t.kind==='parent'?'<button class="subs">Запланировать</button>':'<button class="make-parent">Разбить</button>';
 const time=t.time?`<span class="task-time">${t.time}</span>`:'';
 d.style.setProperty('--task-accent',sphereColor(t.sphere));
 d.innerHTML=`<input type="checkbox" ${t.done?'checked':''}><div class="copy"><div class="task-title-line">${time}<strong>${esc(t.text)}</strong></div><div class="meta">${sphereTag(t.sphere)} ${t.resultType?`<span>${rdef.icon} ${rdef.label}</span>`:''} ${linkedLabel(t)?`<span>${esc(linkedLabel(t))}</span>`:''}${t.kind==='parent'?`<span>· ${prog.done}/${prog.total}</span>`:''}</div>${progressHtml}</div>${action}${t.date?'<button class="calendar-btn" title="Календарь">📅</button>':''}<button class="move-btn" title="Перенести">•••</button><button class="del">×</button>`;
 d.querySelector('input').onchange=e=>{setCompleted(t,e.target.checked);if(t.kind==='parent'&&(t.subtasks||[]).length)t.subtasks.forEach(s=>{setCompleted(s,t.done)});if(t.done)celebrate();save();setTimeout(render,t.done?650:0)};
 if(context==='week'&&t.kind==='parent')d.querySelector('.subs').onclick=()=>openSubtasks(t.id);
 if(context==='week'&&t.kind!=='parent')d.querySelector('.make-parent').onclick=()=>{t.kind='parent';t.subtasks=t.subtasks||[];t.done=false;save();render();openSubtasks(t.id)};
 d.querySelector('.move-btn').onclick=()=>openMoveTask({kind:'task',taskId:t.id});
 if(d.querySelector('.calendar-btn'))d.querySelector('.calendar-btn').onclick=()=>openMoveTask({kind:'task',taskId:t.id});
 d.querySelector('.del').onclick=()=>{state.tasks=state.tasks.filter(x=>x.id!==t.id);save();render()};return d
}

function scheduledSubtaskEl(parent,sub){
 const d=document.createElement('div');d.className='task scheduled-subtask'+(sub.done?' done':'');d.style.setProperty('--task-accent',sphereColor(parent.sphere));const rdef=resultDef(resultTypeOf(sub)||resultTypeOf(parent));
 d.innerHTML=`<input type="checkbox" ${sub.done?'checked':''}><div class="copy"><div class="task-title-line">${sub.time?`<span class="task-time">${sub.time}</span>`:''}<strong>${esc(sub.text)}</strong></div><div class="meta">${sphereTag(parent.sphere)} ${rdef.id?`<span>${rdef.icon} ${rdef.label}</span>`:''}<span>↳ из недели: ${esc(parent.text)}</span></div></div><button class="calendar-btn" title="Календарь">📅</button><button class="move-btn">•••</button></div>`;
 d.querySelector('input').onchange=e=>{setCompleted(sub,e.target.checked);syncParentDone(parent);if(sub.done)celebrate();save();setTimeout(render,sub.done?650:0)};
 d.querySelector('.move-btn').onclick=()=>openMoveTask({kind:'subtask',parentId:parent.id,subId:sub.id});d.querySelector('.calendar-btn').onclick=()=>openMoveTask({kind:'subtask',parentId:parent.id,subId:sub.id});return d
}

function overdueTaskEl(t){
 const d=taskEl(t,'today');d.classList.add('overdue-task');return d
}
function renderOverdue(day){
 const today=todayISO();if(day!==today){$('#overdueBlock').classList.add('hidden');return}
 const overdue=state.tasks.filter(t=>!t.done&&t.date&&t.date<today);
 const sub=[];state.tasks.filter(t=>t.scope==='week'&&t.kind==='parent').forEach(p=>(p.subtasks||[]).filter(s=>!s.done&&s.date&&s.date<today).forEach(s=>sub.push({parent:p,sub:s})));
 if(!overdue.length&&!sub.length){$('#overdueBlock').classList.add('hidden');return}
 $('#overdueBlock').classList.remove('hidden');$('#overdueTasks').replaceChildren(...overdue.map(overdueTaskEl),...sub.map(x=>scheduledSubtaskEl(x.parent,x.sub)));
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
 const resultOpts=RESULT_TYPES.map(r=>`<option value="${r.id}">${r.icon} ${r.label}</option>`).join(''); ['taskResult','weekTaskResult','subtaskResult'].forEach(id=>{const el=$('#'+id);if(el)el.innerHTML=resultOpts});
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
 $('#retroStats').innerHTML=[['Задачи',done+'/'+all.length],['Здоровье',health+' выполнено'],['Желания',wishesDone+'/'+state.wishes.length],['Шаги к желаниям',linkedDone]].map(x=>`<div class="retro-stat"><b>${x[1]}</b><span>${x[0]}</span></div>`).join('');
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
       <input data-sub-time="${s.id}" type="time" value="${s.time||''}">
       <select data-sub-result="${s.id}">${RESULT_TYPES.map(r=>`<option value="${r.id}" ${r.id===(s.resultType||t.resultType||'')?'selected':''}>${r.icon} ${r.label}</option>`).join('')}</select>
     </div>
     <button data-sub-del="${s.id}">×</button>
   </div>`).join('')||'<p class="empty">Добавь отдельные шаги. Например: «Зарядка 1», «Зарядка 2», «Зарядка 3», «Зарядка 4». Потом назначь каждому день.</p>';
 $$('[data-sub-check]').forEach(b=>b.onchange=()=>{const st=t.subtasks.find(s=>s.id===b.dataset.subCheck);st.done=b.checked;syncParentDone(t);save();renderSubtasks();render()});
 $$('[data-sub-date]').forEach(sel=>sel.onchange=()=>{const st=t.subtasks.find(s=>s.id===sel.dataset.subDate);st.date=sel.value||null;save();renderSubtasks();render();if(st.date===todayISO())toast('Добавлено в Сегодня')}); $$('[data-sub-time]').forEach(inp=>inp.onchange=()=>{const st=t.subtasks.find(s=>s.id===inp.dataset.subTime);st.time=inp.value||null;save();render()}); $$('[data-sub-result]').forEach(sel=>sel.onchange=()=>{const st=t.subtasks.find(s=>s.id===sel.dataset.subResult);st.resultType=sel.value||null;save();render()});
 $$('[data-sub-del]').forEach(b=>b.onclick=()=>{t.subtasks=t.subtasks.filter(s=>s.id!==b.dataset.subDel);syncParentDone(t);save();renderSubtasks();render()});
}

function render(){
 const now=new Date();selectedDate();
 $('#dateLabel').textContent=new Intl.DateTimeFormat('ru-RU',{weekday:'long',day:'numeric',month:'long'}).format(now).toUpperCase();
 $('#monthLabel').textContent=new Intl.DateTimeFormat('ru-RU',{month:'long'}).format(now).toUpperCase();$('#yearLabel').textContent='МОЙ '+now.getFullYear();
 renderFilters();taskOptions();renderDayHeader();
 const day=selectedDate(),regular=state.tasks.filter(t=>taskVisibleOnDay(t,day)&&(filters.today==='all'||t.sphere===filters.today));
 const scheduled=[];state.tasks.filter(t=>t.scope==='week'&&t.kind==='parent').forEach(parent=>(parent.subtasks||[]).filter(s=>s.date===day).forEach(sub=>scheduled.push({parent,sub})));
 const scheduledFiltered=scheduled.filter(x=>filters.today==='all'||x.parent.sphere===filters.today);
 const active=[...regular.filter(t=>!t.done).map(t=>({kind:'task',item:t})),...scheduledFiltered.filter(x=>!x.sub.done).map(x=>({kind:'sub',item:x.sub,parent:x.parent}))].sort(sortByTime);
 const done=[...regular.filter(t=>t.done).map(t=>({kind:'task',item:t})),...scheduledFiltered.filter(x=>x.sub.done).map(x=>({kind:'sub',item:x.sub,parent:x.parent}))].sort(sortByTime);
 $('#todayTasks').replaceChildren(...active.map(x=>x.kind==='task'?taskEl(x.item,'today'):scheduledSubtaskEl(x.parent,x.item)));$('#doneTasks').replaceChildren(...done.map(x=>x.kind==='task'?taskEl(x.item,'today'):scheduledSubtaskEl(x.parent,x.item)));
 $('#doneCount').textContent=done.length;$('#todayCount').textContent=done.length+'/'+(active.length+done.length);$('#dayPlanHint').textContent=active.some(x=>x.item.time)?'По времени и сферам':'Без жёсткого расписания';renderOverdue(day);
 $('#weekFocus').textContent=state.weekFocus;const w=state.tasks.filter(t=>t.scope==='week'&&(filters.week==='all'||t.sphere===filters.week));$('#weekTasks').replaceChildren(...w.map(t=>taskEl(t,'week')));$('#weekSummary').innerHTML=summaryHtml('week');
 $('#monthGoals').innerHTML=state.monthGoals.map(g=>goalHtml(g,true)).join('');renderMonthThoughts();$('#monthPlans').innerHTML=state.monthPlans.map(monthPlanHtml).join('')||'<p class="empty">Пока пусто. Нажми «Разбить дальше» у цели года или желания.</p>';$('#monthWishes').innerHTML=state.wishes.filter(x=>x.month&&x.status!=='done').map(monthWishCard).join('')||'<p class="empty">Пока ни одно желание не выбрано на этот месяц.</p>';$('#monthSummary').innerHTML=summaryHtml('month');
 $('#yearGoals').innerHTML=state.yearGoals.map(g=>goalHtml(g,false)).join('');const completed=state.wishes.filter(x=>x.status==='done'),activeWishes=state.wishes.filter(x=>x.status!=='done');$('#wishCount').textContent=state.wishes.length+' всего · '+completed.length+' исполнено';$('#wishProgress').style.width=(state.wishes.length?Math.round(completed.length/state.wishes.length*100):0)+'%';$('#wishList').innerHTML=activeWishes.map(wishCard).join('')||'<p class="empty">Все текущие желания исполнены ✨</p>';$('#completedWishCount').textContent=completed.length;$('#completedWishList').innerHTML=completed.map(completedWishCard).join('');renderSphereSummary();renderRetro();bindWishActions();bindMonthPlans();bindDecompose();
}
function addTask(scope,inputId,sphereId,linkId,kindId,dateId=null,timeId=null,resultId=null){
 const x=$('#'+inputId),text=x.value.trim();if(!text)return;const link=$('#'+linkId).value;let linkType=null,linkedId=null;if(link)[linkType,linkedId]=link.split(':');const kind=$('#'+kindId).value;
 const date=dateId&&$('#'+dateId)?($('#'+dateId).value||null):(scope==='today'?selectedDate():null),time=timeId&&$('#'+timeId)?($('#'+timeId).value||null):null,resultType=resultId&&$('#'+resultId)?($('#'+resultId).value||null):null;
 state.tasks.push({id:uid(),text,done:false,scope,sphere:$('#'+sphereId).value,linkType,linkId:linkedId,kind,subtasks:[],date,time,resultType,completedAt:null});x.value='';if(timeId&&$('#'+timeId))$('#'+timeId).value='';save();render()
}
$$('nav button').forEach(b=>b.onclick=()=>{$$('.screen').forEach(s=>s.classList.toggle('active',s.dataset.screen===b.dataset.target));$$('nav button').forEach(x=>x.classList.toggle('active',x===b))});
$('#addTask').onsubmit=e=>{e.preventDefault();addTask('today','taskInput','taskSphere','taskLink','taskKind',null,'taskTime','taskResult')};
$('#addWeekTask').onsubmit=e=>{e.preventDefault();addTask('week','weekTaskInput','weekTaskSphere','weekTaskLink','weekTaskKind','weekTaskDate','weekTaskTime','weekTaskResult')};

$('#addWishBtn').onclick=()=>{$('#wishSphere').innerHTML=SPHERES.map(s=>`<option value="${s.id}">${s.icon} ${s.label}</option>`).join('');$('#wishDialog').showModal()};
$('#wishForm').onsubmit=e=>{
 if(e.submitter?.value==='cancel')return;
 e.preventDefault();const title=$('#wishTitle').value.trim();if(!title)return;
 state.wishes.push({id:uid(),title,status:'want',month:false,sphere:$('#wishSphere').value});
 $('#wishTitle').value='';$('#wishDialog').close();save();render();
};

$('#prevDay').onclick=()=>{selectedDay=shiftDate(selectedDate(),-1);render()};
$('#nextDay').onclick=()=>{selectedDay=shiftDate(selectedDate(),1);render()};
$('#openDatePicker').onclick=()=>{const p=$('#dayDatePicker');if(p.showPicker)p.showPicker();else p.click()};
$('#dayDatePicker').onchange=e=>{if(e.target.value){selectedDay=e.target.value;render()}};
$('#moveTomorrow').onclick=()=>applyMove(shiftDate(selectedDate(),1),$('#moveTime').value||null);
$('#moveNextWeek').onclick=()=>applyMove(shiftDate(selectedDate(),7),$('#moveTime').value||null);
$('#moveCustom').onclick=()=>applyMove($('#moveDate').value||selectedDate(),$('#moveTime').value||null);
$('#moveToWeek').onclick=()=>{const item=getMoveItem();if(!item)return;item.date=null;item.time=null;if(moveCtx.kind==='task')item.scope='week';save();$('#moveDialog').close();render();toast('Оставлено в неделе')};
$('#addToCalendar').onclick=exportCalendar;$('#closeMoveDialog').onclick=()=>$('#moveDialog').close();

$('#authForm').onsubmit=async e=>{e.preventDefault();$('#authMessage').textContent='Входим…';const {data,error}=await sb.auth.signInWithPassword({email:$('#email').value.trim(),password:$('#password').value});if(error){$('#authMessage').textContent=error.message;return}user=data.user;try{await loadState();$('#authGate').classList.add('hidden');$('#app').classList.remove('hidden');render()}catch(err){$('#authMessage').textContent='Вход выполнен, но данные не загрузились: '+err.message}};
$('#signup').onclick=async()=>{$('#authMessage').textContent='Создаём аккаунт…';const {data,error}=await sb.auth.signUp({email:$('#email').value.trim(),password:$('#password').value});if(error){$('#authMessage').textContent=error.message;return}if(!data.session){$('#authMessage').textContent='Аккаунт создан. Подтверди email в письме, затем вернись сюда и нажми «Войти».';return}user=data.user;await loadState();$('#authGate').classList.add('hidden');$('#app').classList.remove('hidden');render()};

$('#saveRetro').onclick=()=>{state.retro={worked:$('#retroWorked').value,didnt:$('#retroDidnt').value,why:$('#retroWhy').value,insight:$('#retroInsight').value,change:$('#retroChange').value};save();toast('Ретро сохранено')};
$('#addSubtaskForm').onsubmit=e=>{e.preventDefault();const t=state.tasks.find(x=>x.id===currentParentId),text=$('#subtaskInput').value.trim();if(!t||!text)return;t.subtasks=t.subtasks||[];t.subtasks.push({id:uid(),text,done:false,date:null,time:$('#subtaskTime').value||null,resultType:$('#subtaskResult').value||t.resultType||null,completedAt:null});$('#subtaskInput').value='';$('#subtaskTime').value='';syncParentDone(t);save();renderSubtasks();render()};
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