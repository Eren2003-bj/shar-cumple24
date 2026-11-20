
const STORAGE_KEY = 'floresAzules_progreso_v1';
const DAYS = [
  // screen = pantalla de entrada · group = todas las pantallas del día · assets = carpeta de su multimedia y su cancion.mp3
  // Para activar un día nuevo basta añadirle esas tres propiedades; su fecha lo desbloquea sola.
  { day:16, title:'Donde comenzó todo', subtitle:'Un partido, una frase y un sachet de ketchup', screen:'#mision', group:['#mision','#minijuego','#estampa'], assets:'assets' },
  { day:17, title:'El recuerdo de un ramo azul', subtitle:'Detalles que hacen especial nuestra historia', screen:'#mision2', group:['#mision2','#minijuego2','#estampa2'], assets:'assets2' },
  { day:18, title:'Conmigo y Contigo', subtitle:'El día en que me dijiste que sí', screen:'#mision3', group:['#mision3','#minijuego3','#estampa3'], assets:'assets3' },
  { day:19, title:'Nuestro universo', subtitle:'Historias, canciones y mundos que compartimos', screen:'#mision4', group:['#mision4','#minijuego4','#estampa4'], assets:'assets4' },
  { day:20, title:'[CLASIFICADO]', subtitle:'░▒▓██████▓▒░' },
  { day:21, title:'[CLASIFICADO]', subtitle:'░▒▓██████▓▒░' },
  { day:22, title:'Para ti, preciosa princesa', subtitle:'Tu cumpleaños y la misión final' }
];
const QUESTIONS = [
  { question:'¿Qué actividad reunió a nuestros amigos aquel 30 de noviembre?', options:['Una tarde de cine','Un partido de vóley','Una salida a una pizzería'], answer:1, explanation:'¡Un partido de vóley! Una amiga preparó aquel encuentro porque creía que éramos tal para cual.' },
  { question:'¿Qué frase dije antes de entrar a la pollería?', options:['Que tenía hambre de pizza','Que Shingeki me había dado más alegrías que cualquier mujer','Que nunca volvería a jugar vóley'], answer:1, explanation:'¡La famosa frase de Shingeki! Quién iba a imaginar lo que vendría después.' },
  { question:'¿Qué pequeño detalle nos dio una excusa para empezar a conversar?', options:['Un sachet de ketchup','Una botella de agua','Un lugar en la mesa'], answer:0, explanation:'¡El legendario sachet de ketchup! A veces los comienzos se esconden en cosas diminutas.' }
];
// Canción elegida para la primera estampa. El QR está generado en assets/qr-sabes-una-cosa-luis-miguel.png.
const QR_SONG_URL = 'https://www.youtube.com/watch?v=UuGrc3vvdMw';

const $ = (selector) => document.querySelector(selector);
const screens = [...document.querySelectorAll('section.screen')].map(s => '#' + s.id);
let progress = loadProgress();

function loadProgress(){
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { completed: [] }; }
  catch { return { completed: [] }; }
}
function saveProgress(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); }
const YEAR = 2026;
const PREVIEW = new URLSearchParams(location.search).has('preview');   // index.html?preview abre todos los días para probar
const isOpen = day => PREVIEW || new Date() >= new Date(YEAR, 10, day.day);   // se desbloquea a las 00:00 de su fecha
const dayOfScreen = id => DAYS.find(d => d.group && d.group.includes(id));

function showScreen(id, { push = true } = {}){
  if(!screens.includes(id)) id = '#inicio';
  const day = dayOfScreen(id);
  if(day && !isOpen(day)) id = '#calendario';
  if(id === '#calendario') renderDays();
  screens.forEach(selector => $(selector).classList.toggle('hidden', selector !== id));
  document.body.dataset.theme = $(id).dataset.theme || '';
  if(!['#minijuego3','#estampa3'].includes(id)) stopSong();
  if(id === '#minijuego3') bgPause();
  svSync(id === '#mision2');
  if(typeof d4Sync === 'function') d4Sync(id);
  if(push && location.hash !== id) history.pushState(null, '', id);
  window.scrollTo({top:0,behavior:'smooth'});
}
function renderDays(){
  const list = $('#dayList');
  list.innerHTML = '';
  DAYS.forEach((day,index) => {
    const complete = progress.completed.includes(day.day);
    const available = !!day.screen && isOpen(day);
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `day-card ${available?'available':'locked'}`;
    card.disabled = !available;
    card.innerHTML = `<span class="day-number">${String(day.day).padStart(2,'0')}</span><span class="day-info"><small>Día ${index+1} · noviembre</small><strong>${day.title}</strong><span>${day.subtitle}</span></span><span class="day-status">${complete?'✓ Completado':available?'Abrir ↗':'🔒'}</span>`;
    if(available) card.addEventListener('click', () => { playDaySong(day); showScreen(day.screen); });
    list.appendChild(card);
  });
  const count = progress.completed.length;
  $('#progressText').textContent = `${count} de 7 recuerdos`;
  $('#progressBar').style.width = `${Math.max(14.285, count/7*100)}%`;
}
function renderQuiz(rootSel='#quiz', resultSel='#quizResult', questions=QUESTIONS, dayNum=16){
  const root = $(rootSel); root.innerHTML = ''; const answered = new Set();
  questions.forEach((item,index) => {
    const card = document.createElement('article'); card.className = 'question-card';
    const title = document.createElement('h4'); title.className = 'question-title'; title.textContent = `${index+1}. ${item.question}`;
    const options = document.createElement('div'); options.className = 'options';
    const note = document.createElement('p'); note.className = 'answer-note'; note.hidden = true;
    item.options.forEach((option,optionIndex) => {
      const button = document.createElement('button'); button.className = 'option'; button.type='button'; button.textContent = option;
      button.addEventListener('click', () => {
        if(answered.has(index)) return;
        answered.add(index);
        [...options.children].forEach((other,i) => {
          other.disabled = true;
          if(i === item.answer) other.classList.add('correct');
          else if(i === optionIndex) other.classList.add('wrong');
        });
        note.textContent = item.explanation; note.hidden = false;
        if(answered.size === questions.length){
          $(resultSel).classList.remove('hidden');
          progress.completed = [...new Set([...progress.completed,dayNum])]; saveProgress(); renderDays();
        }
      });
      options.appendChild(button);
    });
    card.append(title,options,note); root.appendChild(card);
  });
  $(resultSel).classList.add('hidden');
}

$('#startButton').addEventListener('click', () => {renderDays();showScreen('#calendario');});
$('#backHome').addEventListener('click', () => showScreen('#inicio'));
$('#backCalendar').addEventListener('click', () => {renderDays();showScreen('#calendario');});
$('#backMission').addEventListener('click', () => showScreen('#mision'));
$('#startKetchupGame').addEventListener('click', () => { resetKetchupGame(); showScreen('#minijuego'); });
$('#backToQuiz').addEventListener('click', () => showScreen('#mision'));
$('#revealStampButton').addEventListener('click', () => showScreen('#estampa'));
$('#finishDay').addEventListener('click', () => {renderDays();showScreen('#calendario');});
$('#printButton').addEventListener('click', () => window.print());
renderQuiz();

// MINIJUEGO: rasgar el sachet desde la muesca, con un arrastre horizontal sobre el borde superior.
// Funciona con ratón, dedo y teclado (flecha derecha), y tiene un botón alternativo "Abrir de un toque".
const sachet = $('#ketchupPacket');
const tearZone = $('#tearTrack');
const feedback = $('#gameFeedback');
const hint = $('#tearHint');
const revealBtn = $('#revealStampButton');
const tapBtn = $('#openTapButton');
let dragging = false;
let tearProgress = 0;
let opened = false;

function setTear(value){
  tearProgress = Math.max(0, Math.min(1, value));
  sachet.style.setProperty('--p', tearProgress);
  const pct = Math.round(tearProgress * 100);
  tearZone.setAttribute('aria-valuenow', pct);
  tearZone.setAttribute('aria-valuetext', pct >= 100 ? 'Abierto' : pct === 0 ? 'Cerrado' : `${pct} por ciento abierto`);
}
function resetKetchupGame(){
  dragging = false; opened = false;
  sachet.classList.remove('opened','touched');
  setTear(0);
  hint.textContent = 'Empieza en la muesca de la izquierda';
  feedback.textContent = 'Mantén pulsado sobre el borde superior y arrastra.';
  revealBtn.classList.add('hidden');
  tapBtn.classList.remove('hidden');
}
function pointerProgress(event){
  const rect = tearZone.getBoundingClientRect();
  return (event.clientX - rect.left) / rect.width;
}
function describeProgress(){
  if(tearProgress > .75) feedback.textContent = 'Ya casi. Un poquito más…';
  else if(tearProgress > .4) feedback.textContent = 'Así, sin prisa. Sigue hacia la derecha.';
  else if(tearProgress > .08) feedback.textContent = 'Muy bien, el sobre empieza a ceder.';
}
function finishTear(){
  if(opened) return;
  opened = true; dragging = false;
  setTear(1);
  sachet.classList.add('opened');
  hint.textContent = '';
  feedback.textContent = 'Abierto. De un gesto pequeño floreció toda esta historia.';
  tapBtn.classList.add('hidden');
  revealBtn.classList.remove('hidden');
  if(navigator.vibrate) navigator.vibrate(30);
}
tearZone.addEventListener('pointerdown', event => {
  if(opened) return;
  // Hay que empezar junto al borde ya rasgado (o en la muesca), como en un sachet real.
  if(pointerProgress(event) > tearProgress + .2){ hint.textContent = 'Empieza por la muesca de la izquierda'; return; }
  dragging = true; sachet.classList.add('touched');
  tearZone.setPointerCapture(event.pointerId);
  hint.textContent = 'Arrastra con suavidad →';
});
tearZone.addEventListener('pointermove', event => {
  if(!dragging || opened) return;
  // El rasgado solo avanza; limitar el salto evita abrirlo "de golpe".
  setTear(Math.max(tearProgress, Math.min(pointerProgress(event), tearProgress + .12)));
  describeProgress();
  if(tearProgress >= .97) finishTear();
});
['pointerup','pointercancel'].forEach(type => tearZone.addEventListener(type, () => {
  if(dragging && !opened) feedback.textContent = 'Retoma desde donde quedó el rasgado.';
  dragging = false;
}));
tearZone.addEventListener('keydown', event => {
  if(opened) return;
  if(event.key === 'ArrowRight' || event.key === 'ArrowUp'){ event.preventDefault(); sachet.classList.add('touched'); setTear(tearProgress + .1); describeProgress(); if(tearProgress >= .97) finishTear(); }
  if(event.key === 'Enter' || event.key === ' '){ event.preventDefault(); finishTear(); }
});
tapBtn.addEventListener('click', () => {
  sachet.classList.add('touched');
  const start = performance.now(), from = tearProgress, duration = 800;
  const step = now => {
    const t = Math.min(1, (now - start) / duration);
    setTear(from + (1 - from) * t);
    if(t < 1) requestAnimationFrame(step); else finishTear();
  };
  requestAnimationFrame(step);
});
// MÚSICA: cada día tiene su canción (assets/, assets2/, assets3/… + /cancion.mp3) y empieza al abrir ese día, no antes.
const music = $('#bgMusic');
const musicBtn = $('#musicToggle');
music.volume = 0.6;
let userPaused = false;   // si ella la pausa a mano, los días siguientes no la reanudan solos
function syncMusicBtn(){
  musicBtn.hidden = !music.getAttribute('src');
  musicBtn.classList.toggle('off', music.paused);
  musicBtn.setAttribute('aria-label', music.paused ? 'Reproducir música' : 'Pausar música');
}
function playDaySong(day, autoplay = true){
  const src = `${day.assets}/cancion.mp3`;
  if(music.getAttribute('src') !== src) music.src = src;
  if(autoplay && !userPaused) music.play().catch(() => {});
  syncMusicBtn();
}
['play','pause'].forEach(type => music.addEventListener(type, syncMusicBtn));
musicBtn.addEventListener('click', () => {
  if(songFrame) return;   // mientras suena el video del día 3 no se mezclan
  if(music.paused){ userPaused = false; music.play().catch(() => {}); }
  else { userPaused = true; music.pause(); }
});

// ───────── DÍA 2 ─────────
const QUESTIONS2 = [
  { question:'¿Dónde fue nuestra primera cita?', options:['En una cafetería','En una pizzería pequeña de Trujillo','En el parque'], answer:1, explanation:'¡En una pizzería pequeña, para tener más privacidad!' },
  { question:'¿Qué pasó antes de aquella cita?', options:['Llegué tarde y corrí hasta tu casa','Me olvidé de ir','Llegué una hora antes'], answer:0, explanation:'Y Mishell, que nos espiaba, te pidió que me dieras una oportunidad por esforzarme corriendo.' },
  { question:'¿Qué pizza pedimos en la primera cita?', options:['Tú una carnívora y yo una hawaiana','Mitad due sensazioni y mitad carnívora','Una napolitana entera'], answer:1, explanation:'Una pizza, dos sabores: piña con pollo y carnívora.' },
  { question:'¿Qué comimos en el picnic del 27 de diciembre?', options:['Hamburguesas','Sushi','Pizza de Little Caesars'], answer:2, explanation:'Pizza de Little Caesars, un mantel y Gossip Girl en mi laptop.' }
];
const STORIES = [
  { file:'cita-10-dic.jpg', date:'10 de diciembre', text:'Un miércoles, una pizza a dos sabores y mucho por contarnos.' },
  { file:'picnic.jpg', date:'27 de diciembre', text:'Pizza de Little Caesars, un mantel y Gossip Girl en mi laptop.' },
  { file:'picnic-2.jpg', date:'27 de diciembre', text:'Nada elaborado. Con estar contigo bastaba.' },
  { file:'ramo-azul.jpg', date:'27 de diciembre', text:'Un ramo azul que llegó hasta tu puerta.' },
  { file:'parque.jpg', date:'27 de diciembre', text:'El parque se quedó en silencio, y lo demás no necesitó palabras.' }
];

// Historias con transición (deslizar + fundido) y avance automático
let svIndex = 0, svCur = 0, svTimer = null;
const slides = [$('#svA'), $('#svB')];
slides.forEach(s => { const i = s.querySelector('img'); i.addEventListener('error', () => s.classList.add('empty')); i.addEventListener('load', () => s.classList.remove('empty')); });
function svShow(d = 1, first = false){
  const s = STORIES[svIndex], next = first ? slides[0] : slides[1 - svCur], old = slides[svCur], cap = $('#svCaption');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, dur = reduce ? 450 : 560, ease = 'cubic-bezier(.22,.8,.2,1)';
  slides.forEach(sl => sl.getAnimations().forEach(a => a.cancel()));   // permite hacer clic rápido sin que se encimen
  if(!first) slides.forEach(sl => { if(sl !== old) sl.classList.remove('show'); });
  next.classList.remove('empty'); const img = next.querySelector('img'); img.src = `assets2/${s.file}`; img.alt = s.text;
  next.querySelector('small').textContent = `Coloca assets2/${s.file}`;
  cap.classList.add('swap');
  next.style.zIndex = 2; old.style.zIndex = 1; next.classList.add('show');
  if(first) next.animate([{opacity:0},{opacity:1}], {duration:dur*.8, easing:'ease'});
  else {
    // la nueva historia entra deslizando; la anterior se desplaza un poco y se desvanece
    next.animate([{transform:`translateX(${reduce?0:d*100}%)`,opacity:reduce?0:1},{transform:'translateX(0)',opacity:1}], {duration:dur, easing:ease});
    const out = old.animate([{transform:'translateX(0)',opacity:1},{transform:`translateX(${reduce?0:-d*30}%)`,opacity:reduce?0:.15}], {duration:dur, easing:ease, fill:'forwards'});
    out.onfinish = () => { old.classList.remove('show'); out.cancel(); };
  }
  setTimeout(() => { cap.textContent = s.text; cap.classList.remove('swap'); }, first ? 0 : dur*.45);
  svCur = slides.indexOf(next);
  $('#svDate').textContent = s.date;
  $('#svBars').innerHTML = STORIES.map((_,i) => `<i class="${i<svIndex?'done':i===svIndex?'cur':''}"><b></b></i>`).join('');
  clearTimeout(svTimer);
  if(svIndex < STORIES.length - 1) svTimer = setTimeout(() => svMove(1), 5000);
}
function svMove(d){ svIndex = (svIndex + d + STORIES.length) % STORIES.length; svShow(d); }
function svSync(active){
  clearTimeout(svTimer); if(!active) return;
  svIndex = 0; svCur = 0; slides.forEach(s => s.classList.remove('show')); svShow(1, true);
}
$('#svScreen').addEventListener('click', e => { const r = e.currentTarget.getBoundingClientRect(); svMove((e.clientX - r.left) < r.width*.3 ? -1 : 1); });
$('#svScreen').addEventListener('keydown', e => { if(e.key==='Enter'||e.key===' '||e.key==='ArrowRight'){ e.preventDefault(); svMove(1); } if(e.key==='ArrowLeft') svMove(-1); });
$('#svNext').addEventListener('click', () => svMove(1));
$('#svPrev').addEventListener('click', () => svMove(-1));

// Catálogo de flores (azules, blancas y rosadas)
const ell = (n,cy,rx,ry) => Array.from({length:n},(_,i) => `<ellipse cx="50" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${i*360/n} 50 50)"/>`).join('');
const dots = pts => pts.map(([x,y,r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('');
const ring = (n,rad,r) => dots(Array.from({length:n},(_,i) => [50+rad*Math.sin(i*2*Math.PI/n), 50-rad*Math.cos(i*2*Math.PI/n), r]));
const g = s => `<g fill="currentColor" stroke="rgba(20,48,79,.22)" stroke-width="1.2">${s}</g>`;
const core = (c='#f6e2b3') => `<circle cx="50" cy="50" r="9" fill="${c}"/><circle cx="50" cy="50" r="4" fill="#c9a96a"/>`;
const FLOWERS = [
  { n:'Nomeolvides azul', c:'#5b88b8', px:62, svg:g(ell(5,27,14,21))+core() },
  { n:'Flor celeste', c:'#9cc3ea', px:62, svg:g(ell(6,28,12,18))+core('#fff') },
  { n:'Margarita', c:'#ffffff', px:60, svg:g(ell(12,24,6,22))+core('#f2c94c') },
  { n:'Alstroemeria', c:'#fff7ea', px:66, svg:g(ell(6,24,13,26))+'<path d="M50 50V30M50 50L33 40M50 50L67 40M50 50V70M50 50L33 60M50 50L67 60" stroke="#a5564f" stroke-width="2" stroke-linecap="round"/>'+core('#e8c86a') },
  { n:'Clavel rosa', c:'#e88ba8', px:62, svg:g(ring(10,30,13)+ring(7,16,13))+'<circle cx="50" cy="50" r="9" fill="#d2688b"/>' },
  { n:'Rosa pálida', c:'#f4b9c8', px:60, svg:g('<circle cx="50" cy="50" r="38"/>')+'<g fill="none" stroke="#d98aa0" stroke-width="2.2" stroke-linecap="round"><circle cx="50" cy="50" r="26"/><circle cx="50" cy="50" r="15"/><path d="M50 50c4-4 8 2 3 6"/></g>' },
  { n:'Hortensia azul', c:'#7fa6d6', px:64, svg:g(ring(9,32,12)+ring(6,17,12)+dots([[50,50,12]])) },
  { n:'Nube blanca', c:'#ffffff', px:48, svg:g(dots([[50,50,10],[30,38,10],[68,34,10],[38,66,10],[66,64,10],[22,58,9],[78,52,9],[50,24,9],[52,80,9]])) },
  { n:'Hoja', c:'#5f9468', px:64, leaf:true, svg:'<g fill="currentColor" stroke="rgba(20,48,79,.25)" stroke-width="1.2"><path d="M50 6C84 30 84 74 50 94 16 74 16 30 50 6Z"/></g><path d="M50 14V90" stroke="#3d6b47" stroke-width="2.5" fill="none"/>' }
];
const fsvg = (f,px) => `<svg viewBox="0 0 100 100" width="${px}" height="${px}" aria-hidden="true">${f.svg}</svg>`;

// Fondo del día 2: flores y caja naranja
function buildDecor(){
  const items = [[0,'r',3,'t',4,80,15],[4,'r',11,'t',2,66,20],[8,'r',6,'t',1,92,40],[2,'r',8,'t',13,58,0],[6,'r',1,'t',14,60,-10],
    [8,'l',2,'b',8,92,-30],[5,'l',4,'b',14,76,10],[1,'l',10,'b',6,70,0],[3,'l',12,'b',17,72,-15],[7,'l',1,'b',24,50,0],
    [2,'l',-2,'t',42,60,20],[0,'r',-2,'t',52,64,-15]];
  $('#picnicDecor').innerHTML = items.map(([i,s,x,v,y,px,r]) => `<div class="pd" style="${s==='l'?'left':'right'}:${x}%;${v==='t'?'top':'bottom'}:${y}%;width:${px}px;height:${px}px;transform:rotate(${r}deg);color:${FLOWERS[i].c}">${fsvg(FLOWERS[i],px)}</div>`).join('')
    + `<div class="pd" style="right:-34px;bottom:-26px;width:230px;height:230px;transform:rotate(-10deg)"><svg viewBox="0 0 200 200"><rect x="12" y="34" width="176" height="140" rx="10" fill="#e8741a"/><rect x="24" y="46" width="152" height="116" rx="6" fill="#f7a548"/><circle cx="100" cy="104" r="46" fill="#e2a95b"/><circle cx="100" cy="104" r="39" fill="#f6d68f"/>${[[84,92],[116,92],[100,118],[80,122],[120,120],[100,86]].map(([x,y]) => `<circle cx="${x}" cy="${y}" r="7" fill="#c63d2f"/>`).join('')}<path d="M24 46h152" stroke="#c75d10" stroke-width="3"/></svg></div>`;
}

// Minijuego del ramo: arrastrar, colocar, mover y quitar
const stage = $('#bqStage'), stems = $('#bqStems'), pal = $('#bqPal');
let placed = [], zTop = 2, bqUnlocked = false;
const rnd = (a,b) => a + Math.random()*(b-a);
const inRect = (ev,r) => ev.clientX>=r.left && ev.clientX<=r.right && ev.clientY>=r.top && ev.clientY<=r.bottom;
function drawStems(){
  const ax = stage.clientWidth/2, ay = stage.clientHeight - 62;
  stems.innerHTML = placed.filter(p => !p.t.leaf).map(p => `<path d="M${ax} ${ay}Q${(ax+p.x)/2} ${ay-(ay-p.y)*.4} ${p.x} ${p.y}" stroke="#4f8a5b" stroke-width="3" fill="none" stroke-linecap="round"/>`).join('');
}
function updateCount(){
  const n = placed.length;
  $('#bqCount').textContent = `${n} de 8 flores`;
  $('#bqFeedback').textContent = n === 0 ? 'Arrastra una flor al ramo, o tócala para añadirla.' : n < 8 ? `Faltan ${8-n} para los 8 meses.` : '¡Listo! Puedes seguir adornándolo.';
  if(n >= 8 && !bqUnlocked){ bqUnlocked = true; $('#monthsCard').classList.remove('hidden'); $('#revealStamp2').classList.remove('hidden'); if(navigator.vibrate) navigator.vibrate(30); }
}
function removeFlower(p){ p.el.remove(); placed = placed.filter(x => x !== p); drawStems(); updateCount(); }
function addFlower(t,x,y){
  const el = document.createElement('div'), p = { t, el, x:0, y:0 };
  el.className = 'placed'; el.tabIndex = 0; el.setAttribute('role','img'); el.setAttribute('aria-label', `${t.n}. Flechas para mover, Suprimir para quitar`);
  el.style.setProperty('--r', `${rnd(-18,18)}deg`); el.style.color = t.c; el.style.zIndex = ++zTop; el.innerHTML = fsvg(t,t.px);
  placed.push(p); stage.appendChild(el);
  const put = (nx,ny) => { p.x = Math.max(20,Math.min(stage.clientWidth-20,nx)); p.y = Math.max(20,Math.min(stage.clientHeight-20,ny)); el.style.left = p.x+'px'; el.style.top = p.y+'px'; drawStems(); };
  put(x,y);
  el.addEventListener('pointerdown', e => {
    e.preventDefault(); el.style.zIndex = ++zTop; el.classList.add('drag');
    const move = ev => { const r = stage.getBoundingClientRect(); put(ev.clientX-r.left, ev.clientY-r.top); };
    const up = ev => {
      ['pointermove','pointerup','pointercancel'].forEach((k,i) => window.removeEventListener(k,[move,up,up][i]));
      el.classList.remove('drag');
      if(ev.type === 'pointerup' && !inRect(ev, stage.getBoundingClientRect())) removeFlower(p);
    };
    window.addEventListener('pointermove',move); window.addEventListener('pointerup',up); window.addEventListener('pointercancel',up);
  });
  el.addEventListener('keydown', e => {
    const d = { ArrowLeft:[-10,0], ArrowRight:[10,0], ArrowUp:[0,-10], ArrowDown:[0,10] }[e.key];
    if(d){ e.preventDefault(); put(p.x+d[0], p.y+d[1]); }
    if(e.key === 'Delete' || e.key === 'Backspace'){ e.preventDefault(); removeFlower(p); }
  });
  updateCount();
}
const randomSpot = () => [stage.clientWidth/2 + rnd(-70,70), stage.clientHeight*.35 + rnd(-40,50)];
function buildPalette(){
  pal.innerHTML = '';
  FLOWERS.forEach(t => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'pal'; b.style.color = t.c; b.innerHTML = fsvg(t,64); b.setAttribute('aria-label', `Añadir ${t.n}`);
    b.addEventListener('pointerdown', e => {
      e.preventDefault();
      const ghost = document.createElement('div'); ghost.className = 'ghost'; ghost.style.color = t.c; ghost.innerHTML = fsvg(t,t.px); document.body.appendChild(ghost);
      const sx = e.clientX, sy = e.clientY; let moved = false;
      const pos = ev => { ghost.style.left = ev.clientX+'px'; ghost.style.top = ev.clientY+'px'; };
      pos(e);
      const move = ev => { if(Math.hypot(ev.clientX-sx, ev.clientY-sy) > 6) moved = true; pos(ev); };
      const up = ev => {
        ['pointermove','pointerup','pointercancel'].forEach((k,i) => window.removeEventListener(k,[move,up,up][i]));
        ghost.remove(); if(ev.type !== 'pointerup') return;
        const r = stage.getBoundingClientRect();
        if(!moved) addFlower(t, ...randomSpot()); else if(inRect(ev,r)) addFlower(t, ev.clientX-r.left, ev.clientY-r.top);
      };
      window.addEventListener('pointermove',move); window.addEventListener('pointerup',up); window.addEventListener('pointercancel',up);
    });
    b.addEventListener('keydown', e => { if(e.key==='Enter'||e.key===' '){ e.preventDefault(); addFlower(t, ...randomSpot()); } });
    pal.appendChild(b);
  });
}
function resetBouquet(){
  placed.forEach(p => p.el.remove()); placed = []; bqUnlocked = false; drawStems();
  $('#monthsCard').classList.add('hidden'); $('#revealStamp2').classList.add('hidden'); updateCount();
}
buildPalette(); buildDecor(); resetBouquet();
renderQuiz('#quiz2','#quizResult2',QUESTIONS2,17);
$('#bqClear').addEventListener('click', resetBouquet);
$('#backCalendar2').addEventListener('click', () => {renderDays();showScreen('#calendario');});
$('#startBouquetGame').addEventListener('click', () => { resetBouquet(); showScreen('#minijuego2'); });
$('#backToQuiz2').addEventListener('click', () => showScreen('#mision2'));
$('#revealStamp2').addEventListener('click', () => showScreen('#estampa2'));
$('#backMission2').addEventListener('click', () => showScreen('#mision2'));
$('#finishDay2').addEventListener('click', () => {renderDays();showScreen('#calendario');});
$('#printButton2').addEventListener('click', () => window.print());

// ───────── DÍA 3: San Remo ─────────
let songFrame = null, bgWasPlaying = false;
function bgPause(){ if(!music.paused){ bgWasPlaying = true; music.pause(); } }
function killFrame(){ if(songFrame){ songFrame.remove(); songFrame = null; } }
function stopSong(){ killFrame(); if(bgWasPlaying){ bgWasPlaying = false; music.play().catch(() => {}); } }
function playSong(){
  if(songFrame) return;
  songFrame = document.createElement('iframe');
  songFrame.src = 'https://www.youtube-nocookie.com/embed/X-9ENGPgrc4?autoplay=1&rel=0&playsinline=1';
  songFrame.allow = 'autoplay; encrypted-media'; songFrame.title = 'With Me, de Sum 41';
  $('#songSlot').appendChild(songFrame);
}
(function buildRemoDecor(){
  const bokeh = Array.from({length:16}, () => `<i style="left:${rnd(0,100)}%;top:${rnd(0,100)}%;--s:${rnd(16,52)}px;--d:${rnd(5,11)}s;animation-delay:-${rnd(0,9)}s"></i>`).join('');
  const candle = '<div class="rd candle"><svg viewBox="0 0 40 120"><ellipse class="flame" cx="20" cy="17" rx="6" ry="12" fill="#ffd27a"/><rect x="10" y="32" width="20" height="86" rx="3" fill="#f6efe2"/></svg></div>';
  const glass = '<div class="rd glass"><svg viewBox="0 0 60 120"><path d="M8 4h44c2 28-6 50-22 52C14 54 6 32 8 4Z" fill="rgba(255,255,255,.22)" stroke="#f3e6c8" stroke-width="2"/><path d="M10 14h40c0 12-4 22-20 24C14 36 10 26 10 14Z" fill="#a3294a" opacity=".75"/><path d="M30 56v52M14 114h32" stroke="#f3e6c8" stroke-width="3" stroke-linecap="round"/></svg></div>';
  $('#remoDecor').innerHTML = bokeh + candle + glass;
})();
const ringBox = $('#ringBox'), lidBtn = $('#lidBtn');
function resetRings(){
  killFrame(); ringBox.className = 'ring-box'; lidBtn.disabled = true;
  $('#ringHint').textContent = '¿Qué habrá debajo del plato?';
  $('#songCard').classList.add('hidden'); $('#revealStamp3').classList.add('hidden');
}
$('#plateBtn').addEventListener('click', () => {
  ringBox.classList.add('plate-off'); lidBtn.disabled = false; lidBtn.focus();
  $('#ringHint').textContent = 'Ahora ábrela con cuidado';
});
lidBtn.addEventListener('click', () => {
  if(ringBox.classList.contains('open')) return;
  ringBox.classList.add('open'); lidBtn.disabled = true;
  $('#ringHint').textContent = 'Un escudo para él, una corona para ella';
  playSong(); $('#songCard').classList.remove('hidden'); $('#revealStamp3').classList.remove('hidden');
  if(navigator.vibrate) navigator.vibrate(30);
});
$('#startRingGame').addEventListener('click', () => { resetRings(); showScreen('#minijuego3'); });
$('#backCalendar3').addEventListener('click', () => {renderDays();showScreen('#calendario');});
$('#backToMission3').addEventListener('click', () => showScreen('#mision3'));
$('#backMission3').addEventListener('click', () => showScreen('#mision3'));
$('#revealStamp3').addEventListener('click', () => {
  progress.completed = [...new Set([...progress.completed,18])]; saveProgress(); renderDays(); showScreen('#estampa3');
});
$('#finishDay3').addEventListener('click', () => {renderDays();showScreen('#calendario');});
$('#printButton3').addEventListener('click', () => window.print());

// ───────── NAVEGACIÓN: botón "atrás" del celular y recarga en la misma pantalla ─────────
window.addEventListener('popstate', () => showScreen(location.hash || '#inicio', { push:false }));
(function restoreFromHash(){
  const id = location.hash;
  if(!id || id === '#inicio' || !screens.includes(id)) return;
  const day = dayOfScreen(id);
  if(day && isOpen(day)) playDaySong(day, false);   // sin autoplay: el navegador lo bloquea sin un toque previo
  showScreen(id, { push:false });
})();
