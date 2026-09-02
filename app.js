
(() => {
const SUPABASE_URL="https://cswvtuhbxvyigodcgwox.supabase.co";
const SUPABASE_KEY="sb_publishable_vPVjJOw_kiKRnsg0P8epZQ_TAjEcq0r";
const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const tg=window.Telegram?.WebApp;if(tg){tg.ready();tg.expand();}
const seed={
 weekFocus:'Не растерять ритм и закрыть ключевые рабочие задачи',
 tasks:[
  {id:'1',text:'12 000 шагов',done:false,scope:'today',goal:'sport'},
  {id:'2',text:'Тигры · Сбер приглосы',done:false,scope:'today',goal:'work'},
  {id:'3',text:'Презентация Уралсиб',done:false,scope:'today',goal:'work'},
  {id:'4',text:'Помыть волосы',done:false,scope:'today',goal:null},
  {id:'5',text:'Погулять',done:false,scope:'today',goal:'life'},
  {id:'6',text:'2 пробежки',done:false,scope:'week',goal:'sport'},
  {id:'7',text:'Перевести часть денег в валюту',done:false,scope:'week',goal:null}
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
  {id:'w1',title:'Оффер мечты',done:true,month:false},
  {id:'w2',title:'Новый айфон',done:true,month:false},
  {id:'w3',title:'Обучение стратегии',done:true,month:false},
  {id:'w4',title:'Сделать семейное древо',done:false,month:true},
  {id:'w5',title:'Съездить в Кыргызстан',done:false,month:true}
 ]
};
let state=structuredClone(seed),user=null,saveTimer;
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function loadState(){
 const {data,error}=await sb.from('planner_state').select('data').eq('user_id',user.id).maybeSingle();
 if(error)throw error;
 if(data?.data&&Object.keys(data.data).length) state={...structuredClone(seed),...data.data};
 else {
   await sb.from('planner_state').upsert({user_id:user.id,data:state,updated_at:new Date().toISOString()},{onConflict:'user_id'});
 }
}
function save(){clearTimeout(saveTimer);saveTimer=setTimeout(async()=>{
 const {error}=await sb.from('planner_state').upsert({user_id:user.id,data:state,updated_at:new Date().toISOString()},{onConflict:'user_id'});
 if(error) toast('Ошибка синхронизации');
},250)}
function toast(t){const e=$('#toast');e.textContent=t;e.classList.remove('hidden');setTimeout(()=>e.classList.add('hidden'),1600)}
function goalName(id){const g=state.yearGoals.find(x=>x.id===id);return g?g.icon+' '+g.title:''}
function taskEl(t){const d=document.createElement('div');d.className='task'+(t.done?' done':'');d.innerHTML=`<input type="checkbox" ${t.done?'checked':''}><div class="copy"><div>${esc(t.text)}</div>${t.goal?`<div class="meta">${esc(goalName(t.goal))}</div>`:''}</div><button class="del">×</button>`;d.querySelector('input').onchange=e=>{t.done=e.target.checked;save();render()};d.querySelector('.del').onclick=()=>{state.tasks=state.tasks.filter(x=>x.id!==t.id);save();render()};return d}
function goalHtml(g,month=false){const icon=month?(state.yearGoals.find(x=>x.id===g.goal)?.icon||''):g.icon;return `<div class="goal"><div class="row"><b>${icon} ${esc(g.title)}</b><span>${g.progress}%</span></div>${month?'':`<p>${esc(g.desc)}</p>`}<div class="bar"><div style="width:${g.progress}%"></div></div></div>`}
function render(){
 const now=new Date();$('#dateLabel').textContent=new Intl.DateTimeFormat('ru-RU',{weekday:'long',day:'numeric',month:'long'}).format(now).toUpperCase();$('#monthLabel').textContent=new Intl.DateTimeFormat('ru-RU',{month:'long'}).format(now).toUpperCase();$('#yearLabel').textContent='МОЙ '+now.getFullYear();
 const a=state.tasks.filter(t=>t.scope==='today'&&!t.done),d=state.tasks.filter(t=>t.scope==='today'&&t.done);$('#todayTasks').replaceChildren(...a.map(taskEl));$('#doneTasks').replaceChildren(...d.map(taskEl));$('#doneCount').textContent=d.length;$('#todayCount').textContent=d.length+'/'+(a.length+d.length);
 $('#weekFocus').textContent=state.weekFocus;const w=state.tasks.filter(t=>t.scope==='week');$('#weekTasks').replaceChildren(...w.map(taskEl));
 $('#monthGoals').innerHTML=state.monthGoals.map(g=>goalHtml(g,true)).join('');$('#monthWishes').innerHTML=state.wishes.filter(x=>x.month).map(x=>`<label class="wish"><input type="checkbox" data-w="${x.id}" ${x.done?'checked':''}><span>${esc(x.title)}</span></label>`).join('');$$('[data-w]').forEach(i=>i.onchange=e=>{state.wishes.find(x=>x.id===e.target.dataset.w).done=e.target.checked;save();render()});
 $('#yearGoals').innerHTML=state.yearGoals.map(g=>goalHtml(g,false)).join('');const wc=state.wishes.filter(x=>x.done).length;$('#wishCount').textContent=wc+'/50';$('#wishDots').innerHTML=Array.from({length:50},(_,i)=>`<span class="dot ${i<wc?'done':''}"></span>`).join('');
}
$$('nav button').forEach(b=>b.onclick=()=>{$$('.screen').forEach(s=>s.classList.toggle('active',s.dataset.screen===b.dataset.target));$$('nav button').forEach(x=>x.classList.toggle('active',x===b))});
$('#addTask').onsubmit=e=>{e.preventDefault();const x=$('#taskInput');const t=x.value.trim();if(!t)return;state.tasks.push({id:String(Date.now()),text:t,done:false,scope:'today',goal:null});x.value='';save();render()};
$('#authForm').onsubmit=async e=>{e.preventDefault();$('#authMessage').textContent='Входим…';const {data,error}=await sb.auth.signInWithPassword({email:$('#email').value.trim(),password:$('#password').value});if(error){$('#authMessage').textContent=error.message;return}user=data.user;await loadState();$('#authGate').classList.add('hidden');$('#app').classList.remove('hidden');render()};
$('#signup').onclick=async()=>{$('#authMessage').textContent='Создаём аккаунт…';const {data,error}=await sb.auth.signUp({email:$('#email').value.trim(),password:$('#password').value});if(error){$('#authMessage').textContent=error.message;return}if(!data.session){$('#authMessage').textContent='Аккаунт создан. Подтверди email в письме, затем нажми «Войти».';return}user=data.user;await loadState();$('#authGate').classList.add('hidden');$('#app').classList.remove('hidden');render()};
$('#logout').onclick=async()=>{await sb.auth.signOut();location.reload()};
(async()=>{const {data:{session}}=await sb.auth.getSession();if(session?.user){user=session.user;try{await loadState();$('#authGate').classList.add('hidden');$('#app').classList.remove('hidden');render()}catch(e){$('#authMessage').textContent='Не удалось загрузить данные из Supabase.'}}})();
})();
