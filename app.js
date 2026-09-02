
(() => {
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.ready();
    tg.expand();
    try { tg.setHeaderColor('bg_color'); } catch (_) {}
    try { tg.setBackgroundColor('bg_color'); } catch (_) {}
  }

  const STORAGE_KEY = 'navigator_state_v1';

  const seed = {
    weekFocus: 'Не растерять ритм и закрыть ключевые рабочие задачи',
    monthTheme: 'Делать сразу, держать спортивный ритм и не откладывать жизнь',
    tasks: [
      {id:'t1', text:'12 000 шагов', done:false, scope:'today', goal:'sport'},
      {id:'t2', text:'Тигры · Сбер приглосы', done:false, scope:'today', goal:'work'},
      {id:'t3', text:'Презентация Уралсиб', done:false, scope:'today', goal:'work'},
      {id:'t4', text:'Помыть волосы', done:false, scope:'today', goal:null},
      {id:'t5', text:'Погулять', done:false, scope:'today', goal:'life'},
      {id:'t6', text:'2 пробежки', done:false, scope:'week', goal:'sport'},
      {id:'t7', text:'Перевести часть денег в валюту', done:false, scope:'week', goal:null},
      {id:'t8', text:'Встреча с Алиной', done:false, scope:'week', goal:'life'}
    ],
    yearGoals: [
      {id:'work', icon:'💼', title:'Работа и доход', description:'Стабильный доход 250К+ и сильные проекты', progress:72, metric:'180К / 250К'},
      {id:'sport', icon:'🏃', title:'Форма', description:'Регулярный спорт · сильное тело · 58 кг', progress:54, metric:'🔥 3 недели'},
      {id:'life', icon:'✨', title:'Активный год', description:'Больше нового опыта, поездок, людей и приключений', progress:64, metric:'8 желаний'}
    ],
    monthGoals: [
      {goal:'work', title:'250 000+ ₽ за месяц', progress:72, metric:'180 000 / 250 000 ₽'},
      {goal:'sport', title:'Вернуться в спортивный режим', progress:54, metric:'7 активных дней'},
      {goal:'life', title:'Сделать месяц насыщенным', progress:50, metric:'2 / 4 события'}
    ],
    wishes: [
      {id:'w1', title:'Оффер мечты', done:true, month:false},
      {id:'w2', title:'Новый айфон', done:true, month:false},
      {id:'w3', title:'Обучение стратегии', done:true, month:false},
      {id:'w4', title:'Сходить на концерт', done:true, month:false},
      {id:'w5', title:'Сделать семейное древо', done:false, month:true},
      {id:'w6', title:'Съездить в Кыргызстан', done:false, month:true},
      {id:'w7', title:'Выступить перед аудиторией про креатив', done:false, month:true},
      {id:'w8', title:'Пробежать 10 км меньше часа', done:false, month:false}
    ],
    achievements: [
      {icon:'🔥', title:'Втянулась', text:'3 недели спортивного режима подряд', locked:false},
      {icon:'💼', title:'Работа мечты', text:'Получен желанный оффер', locked:false},
      {icon:'✨', title:'Сказала «да»', text:'5 новых впечатлений за месяц', locked:false},
      {icon:'🔒', title:'Четверть миллиона', text:'180К / 250К', locked:true}
    ],
    story: [
      {date:'Май', text:'Получила оффер и начала новую работу · подготовка к забегу'},
      {date:'Июль', text:'Продуктивный рабочий месяц · больше спорта · поездки'}
    ],
    retros: {}
  };

  let state = seed;

  const cloud = tg?.CloudStorage;
  function loadState() {
    return new Promise(resolve => {
      if (cloud?.getItem) {
        cloud.getItem(STORAGE_KEY, (err, value) => {
          if (!err && value) {
            try { state = {...seed, ...JSON.parse(value)}; } catch (_) {}
          } else {
            const local = localStorage.getItem(STORAGE_KEY);
            if (local) try { state = {...seed, ...JSON.parse(local)}; } catch (_) {}
          }
          resolve();
        });
      } else {
        const local = localStorage.getItem(STORAGE_KEY);
        if (local) try { state = {...seed, ...JSON.parse(local)}; } catch (_) {}
        resolve();
      }
    });
  }

  function saveState() {
    const value = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, value);
    if (cloud?.setItem) cloud.setItem(STORAGE_KEY, value, () => {});
  }

  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function fmtDate(d) {
    return new Intl.DateTimeFormat('ru-RU', {weekday:'long', day:'numeric', month:'long'}).format(d);
  }
  function monthName(d) {
    return new Intl.DateTimeFormat('ru-RU', {month:'long'}).format(d).toUpperCase();
  }
  function goalLabel(id) {
    const g = state.yearGoals.find(x => x.id === id);
    return g ? `${g.icon} ${g.title}` : '';
  }

  function renderTask(task, doneList=false) {
    const row = document.createElement('div');
    row.className = 'task-row' + (task.done ? ' done-row' : '');
    row.innerHTML = `
      <input type="checkbox" ${task.done?'checked':''} aria-label="Выполнено">
      <div class="task-copy">
        <div>${escapeHtml(task.text)}</div>
        ${task.goal ? `<div class="task-meta">${escapeHtml(goalLabel(task.goal))}</div>` : ''}
      </div>
      <button class="task-delete" aria-label="Удалить">×</button>`;
    row.querySelector('input').addEventListener('change', e => {
      task.done = e.target.checked;
      if (task.goal === 'sport' && task.done) {
        const g = state.yearGoals.find(x => x.id === 'sport');
        g.progress = Math.min(100, g.progress + 2);
      }
      saveState(); render();
      haptic('success');
    });
    row.querySelector('.task-delete').addEventListener('click', () => {
      state.tasks = state.tasks.filter(x => x.id !== task.id);
      saveState(); render();
    });
    return row;
  }

  function progressCard(goal, month=false) {
    const icon = month ? state.yearGoals.find(x=>x.id===goal.goal)?.icon : goal.icon;
    return `<article class="goal-card">
      <div class="goal-head">
        <div><h3>${icon || ''} ${escapeHtml(goal.title)}</h3>${!month ? `<p>${escapeHtml(goal.description)}</p>` : ''}</div>
        <div class="metric">${escapeHtml(goal.metric || '')}</div>
      </div>
      <div class="progress"><div style="width:${Math.max(0,Math.min(100,goal.progress))}%"></div></div>
    </article>`;
  }

  function render() {
    const now = new Date();
    $('#todayLabel').textContent = fmtDate(now).toUpperCase();
    $('#todayHeading').textContent = 'Сегодня';
    $('#monthName').textContent = monthName(now);
    $('#yearLabel').textContent = `МОЙ ${now.getFullYear()}`;
    const start = new Date(now.getFullYear(),0,0);
    const day = Math.floor((now-start)/86400000);
    const total = ((now.getFullYear()%4===0 && now.getFullYear()%100!==0)||now.getFullYear()%400===0) ? 366 : 365;
    $('#yearDayCounter').textContent = `${day} / ${total}`;

    const monday = new Date(now); const dow=(now.getDay()+6)%7; monday.setDate(now.getDate()-dow);
    const sunday = new Date(monday); sunday.setDate(monday.getDate()+6);
    $('#weekDates').textContent = `${monday.getDate()} ${monthName(monday).slice(0,3)} — ${sunday.getDate()} ${monthName(sunday).slice(0,3)}`;

    const activeToday = state.tasks.filter(t=>t.scope==='today' && !t.done);
    const doneToday = state.tasks.filter(t=>t.scope==='today' && t.done);
    $('#todayTasks').replaceChildren(...activeToday.map(t=>renderTask(t)));
    $('#doneTasks').replaceChildren(...doneToday.map(t=>renderTask(t,true)));
    $('#doneCount').textContent = doneToday.length;
    $('#todayCounter').textContent = `${doneToday.length}/${activeToday.length+doneToday.length}`;

    const sportOpen = state.tasks.filter(t=>t.goal==='sport' && !t.done).length;
    $('#streakText').textContent = sportOpen ? `🔥 3 недели подряд. Осталось ${sportOpen} спортивных пункта в планах.` : 'Спортивный минимум недели закрыт.';
    $('#weekFocus').textContent = state.weekFocus;
    $('#monthTheme').textContent = state.monthTheme;

    $('#weekCourse').innerHTML = state.yearGoals.map(g=>`
      <article class="course-card">
        <strong>${g.icon} ${escapeHtml(g.title)}</strong>
        <div class="progress"><div style="width:${g.progress}%"></div></div>
        <p>${escapeHtml(g.metric)}</p>
      </article>`).join('');

    const week = state.tasks.filter(t=>t.scope==='week');
    $('#weekTasks').replaceChildren(...week.map(t=>renderTask(t)));
    $('#weekTaskCounter').textContent = `${week.filter(x=>x.done).length}/${week.length}`;

    $('#monthGoals').innerHTML = state.monthGoals.map(g=>progressCard(g,true)).join('');
    const monthWishes = state.wishes.filter(w=>w.month);
    $('#monthWishes').innerHTML = monthWishes.length ? monthWishes.map(w=>`
      <label class="wish-row">
        <input type="checkbox" data-wish-id="${w.id}" ${w.done?'checked':''}>
        <span>${escapeHtml(w.title)}</span>
      </label>`).join('') : `<p class="counter">Пока ничего не выбрано.</p>`;
    $$('[data-wish-id]').forEach(input=>input.addEventListener('change', e=>{
      const w=state.wishes.find(x=>x.id===e.target.dataset.wishId); w.done=e.target.checked; saveState(); render(); haptic('success');
    }));

    $('#yearGoals').innerHTML = state.yearGoals.map(g=>progressCard(g,false)).join('');
    const wishDone = state.wishes.filter(w=>w.done).length;
    $('#wishDoneCount').textContent = wishDone;
    $('#wishDots').innerHTML = Array.from({length:50},(_,i)=>`<span class="wish-dot ${i<wishDone?'done':''}"></span>`).join('');
    $('#achievements').innerHTML = state.achievements.map(a=>`
      <article class="achievement ${a.locked?'locked':''}">
        <div class="badge">${a.icon}</div><strong>${escapeHtml(a.title)}</strong><p>${escapeHtml(a.text)}</p>
      </article>`).join('');
    $('#story').innerHTML = [...state.story].reverse().map(s=>`
      <div class="story-item"><strong>${escapeHtml(s.date)}</strong><p>${escapeHtml(s.text)}</p></div>`).join('');

    const totalTasks = state.tasks.length, doneTasks = state.tasks.filter(t=>t.done).length;
    $('#autoRetroStats').innerHTML = `
      <div class="stat"><strong>${doneTasks}/${totalTasks}</strong><span>задач</span></div>
      <div class="stat"><strong>${state.monthGoals[1].progress}%</strong><span>форма</span></div>
      <div class="stat"><strong>${state.monthGoals[0].progress}%</strong><span>доход</span></div>
      <div class="stat"><strong>${wishDone}</strong><span>желаний</span></div>`;
  }

  function switchScreen(name) {
    $$('.screen').forEach(s=>s.classList.toggle('active',s.dataset.screen===name));
    $$('.nav-button').forEach(b=>b.classList.toggle('active',b.dataset.target===name));
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function haptic(type='selection') {
    try {
      if (!tg?.HapticFeedback) return;
      if (type==='success') tg.HapticFeedback.notificationOccurred('success');
      else tg.HapticFeedback.selectionChanged();
    } catch (_) {}
  }

  function toast(text) {
    const el=$('#toast'); el.textContent=text; el.classList.remove('hidden');
    clearTimeout(toast.t); toast.t=setTimeout(()=>el.classList.add('hidden'),1800);
  }

  function openModal(title, body, onSave) {
    $('#modalTitle').textContent=title;
    $('#modalBody').innerHTML=body;
    const modal=$('#modal');
    modal.showModal();
    const save=$('#modalSave');
    const fn=(e)=>{ e.preventDefault(); onSave(); modal.close(); save.removeEventListener('click',fn); };
    save.addEventListener('click',fn);
  }

  $$('.nav-button').forEach(b=>b.addEventListener('click',()=>{switchScreen(b.dataset.target);haptic();}));
  $('#addTaskForm').addEventListener('submit',e=>{
    e.preventDefault(); const input=$('#taskInput'), text=input.value.trim(); if(!text) return;
    state.tasks.push({id:'t'+Date.now(),text,done:false,scope:'today',goal:null});
    input.value=''; saveState(); render(); haptic('success');
  });

  $('#editWeekFocus').addEventListener('click',()=>{
    openModal('Фокус недели', `<label>Одной фразой<input id="focusInput" value="${escapeHtml(state.weekFocus)}"></label>`, ()=>{
      state.weekFocus=$('#focusInput').value.trim()||state.weekFocus; saveState();render();
    });
  });

  $('#closeMonthButton').addEventListener('click',()=>$('#retroPanel').classList.remove('hidden'));
  $('#closeRetro').addEventListener('click',()=>$('#retroPanel').classList.add('hidden'));
  $('#saveRetro').addEventListener('click',()=>{
    const key=`${new Date().getFullYear()}-${new Date().getMonth()+1}`;
    const r={}; $$('[data-retro]').forEach(x=>r[x.dataset.retro]=x.value);
    state.retros[key]=r; saveState(); toast('Ретро сохранено ✓'); haptic('success');
  });

  $('#addWishToMonth').addEventListener('click',()=>{
    const available=state.wishes.filter(w=>!w.month);
    const body = available.length
      ? available.map(w=>`<label class="wish-row"><input type="radio" name="wishpick" value="${w.id}"><span>${escapeHtml(w.title)}</span></label>`).join('')
      : `<p>Все текущие желания уже разобраны.</p>`;
    openModal('Взять желание в месяц', body, ()=>{
      const id=$('input[name="wishpick"]:checked')?.value;
      if(id){state.wishes.find(w=>w.id===id).month=true;saveState();render();}
    });
  });

  $('#openWishes').addEventListener('click',()=>{
    const body=state.wishes.map(w=>`
      <label class="wish-row"><input type="checkbox" data-modal-wish="${w.id}" ${w.done?'checked':''}><span>${escapeHtml(w.title)}</span></label>`).join('')
      + `<label>Новое желание<input id="newWishInput" placeholder="Например: увидеть северное сияние"></label>`;
    openModal('50 желаний',body,()=>{
      $$('[data-modal-wish]').forEach(i=>state.wishes.find(w=>w.id===i.dataset.modalWish).done=i.checked);
      const t=$('#newWishInput').value.trim();
      if(t) state.wishes.push({id:'w'+Date.now(),title:t,done:false,month:false});
      saveState();render();
    });
  });

  $('#rememberToday').addEventListener('click',()=>{
    openModal('Запомнить этот день', `<label>Что произошло?<textarea id="storyInput" rows="4" placeholder="То, что хочется вспомнить в конце года"></textarea></label>`,()=>{
      const t=$('#storyInput').value.trim(); if(!t)return;
      state.story.push({date:new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long'}).format(new Date()),text:t});
      saveState();render();toast('Добавлено в историю ⭐');
    });
  });

  $('#settingsButton').addEventListener('click',()=>{
    openModal('Настройки',`
      <label>Тема месяца<input id="monthThemeInput" value="${escapeHtml(state.monthTheme)}"></label>
      <p class="counter">Данные сохраняются в Telegram CloudStorage, если приложение открыто в Telegram. В браузере используется localStorage.</p>
      <button type="button" id="resetButton" class="small-button">Сбросить демо-данные</button>
    `,()=>{
      state.monthTheme=$('#monthThemeInput').value.trim()||state.monthTheme; saveState();render();
    });
    setTimeout(()=>$('#resetButton')?.addEventListener('click',()=>{
      if(confirm('Сбросить все изменения?')){state=JSON.parse(JSON.stringify(seed));saveState();render();$('#modal').close();}
    }),0);
  });

  loadState().then(render);
})();
