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

let state=structuredClone(seed),user=null,saveTimer;
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
   return {...t,sphere,linkType:t.linkType||(t.goal?'goal':null),linkId:t.linkId||(t.goal||null)};
 });
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
 if(data?.data&&Object.keys(data.data).length) state=normalizeState(data.data);
 else {
   state=normalizeState(seed);
   await sb.from('planner_state').upsert({user_id:user.id,data:state,updated_at:new Date().toISOString()},{onConflict:'user_id'});
 }
}
function save(){clearTimeout(saveTimer);saveTimer=setTimeout(async()=>{
 const {error}=await sb.from('planner_state').upsert({user_id:user.id,data:state,updated_at:new Date().toISOString()},{onConflict:'user_id'});
 if(error) toast('Ошибка синхронизации');
},250)}
function toast(t){const e=$('#toast');e.textContent=t;e.classList.remove('hidden');setTimeout(()=>e.classList.add('hidden'),1600)}
function sphere(id){return SPHERES.find(x=>x.id===id)||SPHERES[6]}
function goalName(id){const g=state.yearGoals.find(x=>x.id===id);return g?g.icon+' '+g.title:''}
function wishName(id){return state.wishes.find(x=>x.id===id)?.title||''}
function linkedLabel(t){
 if(t.linkType==='goal') return '→ '+goalName(t.linkId);
 if(t.linkType==='wish') return '→ ✦ '+wishName(t.linkId);
 return '';
}
function sphereTag(id){const s=sphere(id);return `<span class="tag">${s.icon} ${esc(s.label)}</span>`}

function taskEl(t){
 const d=document.createElement('div');d.className='task'+(t.done?' done':'');
 d.innerHTML=`<input type="checkbox" ${t.done?'checked':''}><div class="copy"><div>${esc(t.text)}</div><div class="meta">${sphereTag(t.sphere)} ${linkedLabel(t)?`<span>${esc(linkedLabel(t))}</span>`:''}</div></div><button class="del">×</button>`;
 d.querySelector('input').onchange=e=>{t.done=e.target.checked;save();render()};
 d.querySelector('.del').onclick=()=>{state.tasks=state.tasks.filter(x=>x.id!==t.id);save();render()};
 return d
}
function goalHtml(g,month=false){const icon=month?(state.yearGoals.find(x=>x.id===g.goal)?.icon||''):g.icon;return `<div class="goal"><div class="row"><b>${icon} ${esc(g.title)}</b><span>${g.progress}%</span></div>${month?'':`<p>${esc(g.desc)}</p>`}<div class="bar"><div style="width:${g.progress}%"></div></div></div>`}
function filterHtml(scope){
 const active=filters[scope];
 return [{id:'all',label:'Все',icon:''},...SPHERES].map(s=>`<button class="filter ${active===s.id?'active':''}" data-filter="${s.id}" data-scope="${scope}">${s.icon||''} ${s.label}</button>`).join('');
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
 const linked=state.tasks.filter(t=>t.linkType==='wish'&&t.linkId===w.id);
 const done=linked.filter(t=>t.done).length;
 const status=w.status==='done'?'Исполнено':w.month?'В этом месяце':w.status==='active'?'В процессе':'Хочу';
 return `<div class="wish-card ${w.status==='done'?'done':''}">
   <div class="wish-main"><button class="wish-check" data-wish-done="${w.id}">${w.status==='done'?'✓':'○'}</button><div><b>${esc(w.title)}</b><div class="meta">${sphereTag(w.sphere)} <span>${status}</span>${linked.length?` <span>· задач ${done}/${linked.length}</span>`:''}</div></div></div>
   <div class="wish-actions"><button data-wish-month="${w.id}">${w.month?'Убрать из месяца':'В месяц'}</button><button data-wish-task="${w.id}">+ задача</button></div>
 </div>`;
}
function monthWishCard(w){
 const linked=state.tasks.filter(t=>t.linkType==='wish'&&t.linkId===w.id);
 const done=linked.filter(t=>t.done).length;
 return `<div class="wish month-wish"><div><b>${esc(w.title)}</b><div class="meta">${sphereTag(w.sphere)} ${linked.length?`<span>задач ${done}/${linked.length}</span>`:'<span>ещё нет задач</span>'}</div></div><button data-wish-task="${w.id}">+ задача</button></div>`;
}
function bindWishActions(){
 $$('[data-wish-done]').forEach(b=>b.onclick=()=>{const w=state.wishes.find(x=>x.id===b.dataset.wishDone);w.status=w.status==='done'?'want':'done';save();render()});
 $$('[data-wish-month]').forEach(b=>b.onclick=()=>{const w=state.wishes.find(x=>x.id===b.dataset.wishMonth);w.month=!w.month;if(w.month&&w.status==='want')w.status='planned';save();render()});
 $$('[data-wish-task]').forEach(b=>b.onclick=()=>{const w=state.wishes.find(x=>x.id===b.dataset.wishTask);state.tasks.push({id:uid(),text:'Шаг к «'+w.title+'»',done:false,scope:'today',sphere:w.sphere,linkType:'wish',linkId:w.id});save();render();toast('Задача добавлена на сегодня')});
}
function renderSphereSummary(){
 const counts=SPHERES.map(s=>({s,total:state.tasks.filter(t=>t.sphere===s.id).length,done:state.tasks.filter(t=>t.sphere===s.id&&t.done).length}));
 const max=Math.max(1,...counts.map(x=>x.total));
 $('#sphereSummary').innerHTML=counts.map(x=>`<div class="sphere-row"><div class="row"><span>${x.s.icon} ${x.s.label}</span><span>${x.done}/${x.total}</span></div><div class="bar"><div style="width:${(x.total/max)*100}%"></div></div></div>`).join('');
}
function render(){
 const now=new Date();
 $('#dateLabel').textContent=new Intl.DateTimeFormat('ru-RU',{weekday:'long',day:'numeric',month:'long'}).format(now).toUpperCase();
 $('#monthLabel').textContent=new Intl.DateTimeFormat('ru-RU',{month:'long'}).format(now).toUpperCase();
 $('#yearLabel').textContent='МОЙ '+now.getFullYear();

 renderFilters(); taskOptions();

 const allToday=state.tasks.filter(t=>t.scope==='today');
 const filteredToday=allToday.filter(t=>filters.today==='all'||t.sphere===filters.today);
 const a=filteredToday.filter(t=>!t.done),d=filteredToday.filter(t=>t.done);
 $('#todayTasks').replaceChildren(...a.map(taskEl));$('#doneTasks').replaceChildren(...d.map(taskEl));
 $('#doneCount').textContent=allToday.filter(t=>t.done).length;
 $('#todayCount').textContent=allToday.filter(t=>t.done).length+'/'+allToday.length;

 $('#weekFocus').textContent=state.weekFocus;
 const w=state.tasks.filter(t=>t.scope==='week'&&(filters.week==='all'||t.sphere===filters.week));
 $('#weekTasks').replaceChildren(...w.map(taskEl));

 $('#monthGoals').innerHTML=state.monthGoals.map(g=>goalHtml(g,true)).join('');
 $('#monthWishes').innerHTML=state.wishes.filter(x=>x.month&&x.status!=='done').map(monthWishCard).join('')||'<p class="empty">Пока ни одно желание не выбрано на этот месяц.</p>';

 $('#yearGoals').innerHTML=state.yearGoals.map(g=>goalHtml(g,false)).join('');
 const wc=state.wishes.filter(x=>x.status==='done').length;
 $('#wishCount').textContent=wc+'/50';
 $('#wishProgress').style.width=Math.min(100,(wc/50)*100)+'%';
 $('#wishList').innerHTML=state.wishes.map(wishCard).join('');
 renderSphereSummary();
 bindWishActions();
}
function addTask(scope,inputId,sphereId,linkId){
 const x=$('#'+inputId),text=x.value.trim();if(!text)return;
 const link=$('#'+linkId).value;let linkType=null,linkedId=null;
 if(link){[linkType,linkedId]=link.split(':')}
 state.tasks.push({id:uid(),text,done:false,scope,sphere:$('#'+sphereId).value,linkType,linkId:linkedId});
 x.value='';save();render();
}
$$('nav button').forEach(b=>b.onclick=()=>{$$('.screen').forEach(s=>s.classList.toggle('active',s.dataset.screen===b.dataset.target));$$('nav button').forEach(x=>x.classList.toggle('active',x===b))});
$('#addTask').onsubmit=e=>{e.preventDefault();addTask('today','taskInput','taskSphere','taskLink')};
$('#addWeekTask').onsubmit=e=>{e.preventDefault();addTask('week','weekTaskInput','weekTaskSphere','weekTaskLink')};

$('#addWishBtn').onclick=()=>{$('#wishSphere').innerHTML=SPHERES.map(s=>`<option value="${s.id}">${s.icon} ${s.label}</option>`).join('');$('#wishDialog').showModal()};
$('#wishForm').onsubmit=e=>{
 if(e.submitter?.value==='cancel')return;
 e.preventDefault();const title=$('#wishTitle').value.trim();if(!title)return;
 state.wishes.push({id:uid(),title,status:'want',month:false,sphere:$('#wishSphere').value});
 $('#wishTitle').value='';$('#wishDialog').close();save();render();
};

$('#authForm').onsubmit=async e=>{e.preventDefault();$('#authMessage').textContent='Входим…';const {data,error}=await sb.auth.signInWithPassword({email:$('#email').value.trim(),password:$('#password').value});if(error){$('#authMessage').textContent=error.message;return}user=data.user;try{await loadState();$('#authGate').classList.add('hidden');$('#app').classList.remove('hidden');render()}catch(err){$('#authMessage').textContent='Вход выполнен, но данные не загрузились: '+err.message}};
$('#signup').onclick=async()=>{$('#authMessage').textContent='Создаём аккаунт…';const {data,error}=await sb.auth.signUp({email:$('#email').value.trim(),password:$('#password').value});if(error){$('#authMessage').textContent=error.message;return}if(!data.session){$('#authMessage').textContent='Аккаунт создан. Подтверди email в письме, затем вернись сюда и нажми «Войти».';return}user=data.user;await loadState();$('#authGate').classList.add('hidden');$('#app').classList.remove('hidden');render()};
$('#logout').onclick=async()=>{await sb.auth.signOut();location.reload()};
(async()=>{const {data:{session}}=await sb.auth.getSession();if(session?.user){user=session.user;try{await loadState();$('#authGate').classList.add('hidden');$('#app').classList.remove('hidden');render()}catch(e){$('#authMessage').textContent='Не удалось загрузить данные из Supabase: '+e.message}}})();
})();