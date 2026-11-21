/* DÍA 4 · NUESTRO UNIVERSO — "Cine y vinilo"
   Se carga DESPUÉS de app.js (usa sus funciones: $, showScreen, renderDays, progress, saveProgress,
   bgPause, killFrame, stopSong y la variable songFrame). Todo lo editable está en las constantes de arriba. */
(function(){
  'use strict';

  // ── EDITABLE ──────────────────────────────────────────────────────────────
  // Tu número con código de país y sin "+" (ej. '51999999999'). Vacío = ella elige a quién enviárselo.
  const WA_NUMBER = '51902429337';
  // Textos del mensaje que le llega a tu WhatsApp.
  const MSG_TO   = 'Mi caballero 🏰';
  const MSG_SIGN = 'Con mucho amor, tu princesa 👸';

  // yt = ID del video de YouTube (lo que va después de v= en el enlace, o después de youtu.be/).
  const RECORDS = [
    { t:'Quiero caminar de tu mano', a:'Río Roma',          c1:'#e8a07a', c2:'#8f3b4a', yt:'idC5sWB9sC0',
      n:'Me la dedicaste en mi cumpleaños y le guardo mucho cariño' },
    { t:'With Me',                    a:'Sum 41',            c1:'#6fa8e8', c2:'#14304f', yt:'X-9ENGPgrc4',
      n:'La que puse en el restaurante para pedirte ser mi enamorada. Nuestra canción' },
    { t:"Can't Help Falling in Love", a:'Elvis Presley',     c1:'#d9b26a', c2:'#5a3a1e', yt:'_zmsbsdu1Po',
      n:'Me encanta bailar esta contigo.' },
    { t:'A Thousand Years',           a:'Crepúsculo',        c1:'#9db8d4', c2:'#2d4a6e', yt:'LpcUCiX3wzk',
      n:'Viene de tus peliculas favoritas, te la he cantado y tocado para hacerte sentir mejor, desde entonces también es un poco mía.' },
    { t:'The Winner Takes It All × Red Swan', a:'Mamma Mia × Shingeki', c1:'#e6c36a', c2:'#9a5a2a', yt:'bUkkBoQCOeE',
      n:'Un poco de los dos.' },
    { t:'Come running home to you',   a:'The Flash',         c1:'#e0675a', c2:'#6e1f2c', yt:'QRBOzK8kLyc',
      n:'La de aquel chico que llegó corriendo a su primera cita. Sigo corriendo hacia ti.' },
    { t:'My Funny Valentine',         a:'Chet Baker',        c1:'#7f9bb8', c2:'#1d2c44', yt:'42fUbPVhq3k',
      n:'Te amo linda.' }
  ];

  // Cartelera. n = nota al voltear la entrada (opcional). soon = "próximamente". chips = lista simple sin voltear.
  const FILMS = [
    { cat:'En el cine', big:true, items:[
      { t:'Crepúsculo: Amanecer · Parte 1', n:'Tu película favorita, ese día fuimos con tu hermano.' },
      { t:'Spider-Man: Brand New Day',       n:'Fue muy bonito verla contigo, muy buena película.' }
    ]},
    { cat:'Series', items:[
      { t:'Gossip Girl', n:'Tu serie favorita. Vamos por la quinta temporada. Gracias a esta serie nuestra futura hija ya tiene nombre.' },
      { t:'WandaVision', n:'Tu relación favorita de superhéroes: Wanda y Vision.' },
      { t:'The Chosen' },
      { t:'Loki' },
      { t:'VisionQuest' }
    ]},
    { cat:'Anime', items:[
      { t:'Shingeki no Kyojin', n:'Me encantó ver mi anime favorito contigo, nuestras series favoritas le darán nombre a nuestros hijos.' },
      { t:'Naruto',             n:'El favorito tuyo. Mishell ya sabía lo que hacía cuando te lo hizo ver.' }
    ]},
    { cat:'En casa', chips:true, items:[
      'Crepúsculo', 'Avengers (varias)', 'Thor: Ragnarok', 'Doctor Strange en el multiverso de la locura',
      'Desencantada', 'Mamma Mia', 'Un puente hacia Terabithia', 'La Bella y la Bestia',
      '10 cosas que odio de ti', 'Karate Kid'
    ]}
  ];

  // Lo que aparece en el Lado B de la estampa (se imprime, así que va resumido).
  const SEEN = [
    'Crepúsculo: Amanecer 1 (en el cine)', 'Spider-Man: Brand New Day (en el cine)', 'Gossip Girl',
    'WandaVision · Loki · VisionQuest', 'The Chosen', 'Shingeki no Kyojin', 'Naruto', 'Mamma Mia',
    'La Bella y la Bestia', 'Y todo lo que falta por ver'
  ];

  // ── UTILIDADES ────────────────────────────────────────────────────────────
  const el = (tag, cls, txt) => {
    const e = document.createElement(tag);
    if(cls) e.className = cls;
    if(txt != null) e.textContent = txt;
    return e;
  };
  const inRect = (ev, r) => ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom;
  const link = r => r.yt ? `https://www.youtube.com/watch?v=${r.yt}`
                         : `https://www.youtube.com/results?search_query=${encodeURIComponent(r.t + ' ' + r.a)}`;

  // ── LADO A: tocadiscos y repisa ───────────────────────────────────────────
  const tt = $('#tt'), labelTxt = $('#ttLabelTxt'), shelf = $('#d4Shelf'), now = $('#d4Now');
  const count = $('#d4Count');
  const btnPrev = $('#ttPrev'), btnPlay = $('#ttPlay'), btnNext = $('#ttNext');
  const records = RECORDS.slice();      // el disco secreto se añade aquí cuando se desbloquea
  const heard = new Set();
 let current = null, frame = null;
 
 function syncCtrl(){
    const on = tt.classList.contains('playing');
    btnPlay.textContent = on ? '⏸' : '▶';
    btnPlay.setAttribute('aria-label', on ? 'Pausar' : 'Reproducir');
  }
 
  function renderNow(r){
    now.innerHTML = '';
    if(!r){
      now.append(el('p', 'd4-empty', 'Elige un disco de la repisa y ponlo en el tocadiscos.'));
      return;
    }
    const h = el('h3', '', r.t), eq = el('span', 'd4-eq'); eq.setAttribute('aria-hidden', 'true');
    for(let k = 0; k < 4; k++) eq.append(document.createElement('i'));
    h.append(eq);
    now.append(h, el('p', 'd4-artist', r.a), el('p', 'd4-note', r.n));
    const slot = el('div', 'd4-slot'); slot.id = 'd4Slot'; now.append(slot);
    const row = el('div', 'd4-row');
    const a = el('a', '', r.yt ? 'Abrir en YouTube ↗' : 'Buscar en YouTube ↗');
    a.href = link(r); a.target = '_blank'; a.rel = 'noopener noreferrer';
    const off = el('button', 'button button-quiet', 'Quitar el disco'); off.type = 'button';
    off.addEventListener('click', idle);
    row.append(a, off); now.append(row);
  }
  function updateCount(){
    const n = heard.size;
    count.textContent = n ? `${n} de ${RECORDS.length} discos escuchados` : '';
    if(SECRET && n >= RECORDS.length && records.length === RECORDS.length){
      records.push(SECRET);
      shelf.append(makeSleeve(SECRET, records.length - 1, true));
      count.textContent += ' · ¡apareció un disco nuevo en la repisa!';
  }
  function resetDisc(){
    tt.classList.remove('playing');
    [...shelf.children].forEach(s => s.classList.remove('on'));
    labelTxt.textContent = '♪';
    current = null; frame = null;
    renderNow(null); syncCtrl();
  }
  function idle(){ resetDisc(); stopSong(); }
  function play(i){
    const r = RECORDS[i];
    tt.style.setProperty('--c1', r.c1); tt.style.setProperty('--c2', r.c2);
    labelTxt.textContent = r.t;
    tt.classList.add('playing');
    [...shelf.children].forEach((s, k) => s.classList.toggle('on', k === i));
    killFrame(); renderNow(r);
    if(r.yt){
      bgPause();
      const f = document.createElement('iframe');
      f.src = `https://www.youtube-nocookie.com/embed/${r.yt}?autoplay=1&rel=0&playsinline=1`;
      f.allow = 'autoplay; encrypted-media'; f.title = `${r.t}, de ${r.a}`;
      $('#d4Slot').appendChild(f);
      songFrame = f;                // así el botón de música de fondo y stopSong() lo respetan
    } else {
      stopSong();                   // sin video: vuelve la música de fondo si estaba sonando
    }
    heard.add(i); updateCount();
    if(navigator.vibrate) navigator.vibrate(15);
  }

  RECORDS.forEach((r, i) => {
    const b = el('button', 'sleeve'); b.type = 'button';
    b.style.setProperty('--c1', r.c1); b.style.setProperty('--c2', r.c2);
    b.setAttribute('aria-label', `Poner ${r.t}, de ${r.a}`);
    b.append(el('span', 'sl-disc'));
    const txt = el('span', 'sl-txt'); txt.append(el('strong', '', r.t), el('small', '', r.a)); b.append(txt);
    // Arrastrar al tocadiscos (ratón) o tocar (dedo). Con el dedo, deslizar sigue desplazando la repisa.
    b.addEventListener('pointerdown', e => {
      if(e.button > 0) return;
      const sx = e.clientX, sy = e.clientY; let ghost = null;
      const move = ev => {
        if(!ghost && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 8){
          ghost = el('div', 'd4ghost'); ghost.style.setProperty('--c1', r.c1); ghost.style.setProperty('--c2', r.c2);
          document.body.appendChild(ghost);
        }
        if(ghost){ ghost.style.left = ev.clientX + 'px'; ghost.style.top = ev.clientY + 'px'; }
      };
      const off = () => ['pointermove','pointerup','pointercancel'].forEach((k, n) => window.removeEventListener(k, [move, up, up][n]));
      const up = ev => {
        off(); if(ghost) ghost.remove();
        if(ev.type !== 'pointerup') return;
        if(!ghost || inRect(ev, tt.getBoundingClientRect())) play(i);
      };
      window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
    });
    b.addEventListener('click', e => { if(e.detail === 0) play(i); });   // teclado (Enter / Espacio)
    shelf.appendChild(b);
  });
  resetDisc(); updateCount();

  // ── LADO B: cartelera ─────────────────────────────────────────────────────
  function ticket(it){
    const note = !!it.n;
    const t = el(note ? 'button' : 'div', 'tk' + (it.soon ? ' soon' : '') + (note ? '' : ' plain'));
    if(note){ t.type = 'button'; t.setAttribute('aria-pressed', 'false'); }
    const inn = el('span', 'tk-in'), f = el('span', 'tk-f');
    if(it.soon) f.append(el('small', '', 'Próximamente'));
    f.append(el('strong', '', it.t));
    inn.append(f);
    if(note){
      const b = el('span', 'tk-b'); b.append(el('em', '', it.n)); inn.append(b);
      t.addEventListener('click', () => { const on = t.classList.toggle('flip'); t.setAttribute('aria-pressed', on); });
    }
    t.append(inn);
    return t;
  }
  const films = $('#d4Films');
  FILMS.forEach(g => {
    const sec = el('section', 'cat'); sec.append(el('h4', '', g.cat));
    if(g.chips){
      const w = el('div', 'chips'); g.items.forEach(t => w.append(el('span', 'chip', t))); sec.append(w);
    } else {
      const grid = el('div', 'tk-grid' + (g.big ? ' big' : '')); g.items.forEach(it => grid.append(ticket(it))); sec.append(grid);
    }
    films.append(sec);
  });

  // ── MINIJUEGO: próxima función (ella arma dos listas) ─────────────────────
  const KEY = 'floresAzules_d4_v1', MAX_ITEMS = 12, STAMP_EXTRA = 4;
  let lists = { films: [], songs: [] };
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if(saved && Array.isArray(saved.films) && Array.isArray(saved.songs))
      lists = { films: saved.films.slice(0, MAX_ITEMS), songs: saved.songs.slice(0, MAX_ITEMS) };
  } catch(e){}
  const saveLists = () => { try { localStorage.setItem(KEY, JSON.stringify(lists)); } catch(e){} };
  const fb = $('#d4Fb'), reveal = $('#revealStamp4'), pickBox = $('#d4Pick');
  const tracks = $('#d4Tracks'), seen = $('#d4Seen');

  // mensaje que llega al chat: una lista limpia, con negritas de WhatsApp (*así*)
  function message(){
    const out = ['🎬 *Nuestra próxima función*', '', MSG_TO];
    if(lists.films.length){ out.push('', 'Esto quiero ver contigo:'); lists.films.forEach(f => out.push(`✧ ${f}`)); }
    if(lists.songs.length){ out.push('', '🎵 *Para nuestra playlist:*'); lists.songs.forEach(s => out.push(`♪ ${s}`)); }
    out.push('', MSG_SIGN);
    return out.join('\n');
  }
  function renderList(key, ul){
    ul.innerHTML = '';
    lists[key].forEach((t, i) => {
      const li = el('li'); li.append(el('span', '', t));
      const x = el('button', 'd4-del', '×'); x.type = 'button'; x.setAttribute('aria-label', `Quitar ${t}`);
      x.addEventListener('click', () => { lists[key].splice(i, 1); saveLists(); refresh(); });
      li.append(x); ul.append(li);
    });
  }
  // estampa: lo que ella elige aparece impreso
  RECORDS.forEach(r => tracks.append(el('li', '', `${r.t} · ${r.a}`)));
  SEEN.forEach(t => seen.append(el('li', '', t)));
  function renderStamp(){
    tracks.querySelectorAll('.d4-more').forEach(n => n.remove());
    lists.songs.slice(0, STAMP_EXTRA).forEach(s => {
      const li = el('li', 'd4-more', s + ' '); li.append(el('small', '', '(sugerida por ti)')); tracks.append(li);
    });
    if(lists.songs.length > STAMP_EXTRA) tracks.append(el('li', 'd4-more', `y ${lists.songs.length - STAMP_EXTRA} más…`));
    const f = lists.films;
    $('#d4Next').textContent = f.slice(0, 3).join(' · ') + (f.length > 3 ? ` y ${f.length - 3} más` : '');
    $('#d4NextLine').classList.toggle('hidden', !f.length);
  }
  function refresh(){
    renderList('films', $('#d4FilmList')); renderList('songs', $('#d4SongList'));
    pickBox.innerHTML = '';
    if(lists.films.length) lists.films.forEach(f => pickBox.append(el('span', '', f)));
    else pickBox.textContent = 'Por elegir…';
    renderStamp();
    reveal.classList.toggle('hidden', !(lists.films.length || lists.songs.length));
  }
  function builder(key, input, btn){
    const add = () => {
      const v = input.value.trim().replace(/\s+/g, ' ');
      if(!v) return;
      if(lists[key].some(x => x.toLowerCase() === v.toLowerCase())){ fb.textContent = 'Eso ya está en tu lista.'; input.value = ''; return; }
      if(lists[key].length >= MAX_ITEMS){ fb.textContent = `Ya son ${MAX_ITEMS}. Quita alguna para añadir otra.`; return; }
      lists[key].push(v); input.value = ''; fb.textContent = ''; saveLists(); refresh(); input.focus();
    };
    btn.addEventListener('click', add);
    input.addEventListener('keydown', e => { if(e.key === 'Enter'){ e.preventDefault(); add(); } });
    return add;
  }
  const addFilm = builder('films', $('#d4FilmIn'), $('#d4FilmAdd'));
  const addSong = builder('songs', $('#d4SongIn'), $('#d4SongAdd'));
  const hasAny = () => lists.films.length || lists.songs.length;
  $('#d4Send').addEventListener('click', () => {
    addFilm(); addSong();   // si dejó algo escrito sin pulsar "Añadir", también entra
    if(!hasAny()){ fb.textContent = 'Añade al menos una idea primero.'; return; }
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message())}`, '_blank', 'noopener');
    fb.textContent = 'Listo. Cuando lo envíes, tu caballero lo verá.';
  });
  $('#d4Copy').addEventListener('click', () => {
    addFilm(); addSong();
    if(!hasAny()){ fb.textContent = 'Añade al menos una idea primero.'; return; }
    (navigator.clipboard ? navigator.clipboard.writeText(message()) : Promise.reject())
      .then(() => { fb.textContent = 'Mensaje copiado. Pégalo donde quieras.'; })
      .catch(() => { fb.textContent = 'No se pudo copiar. Usa el botón de enviar.'; });
  });
  reveal.addEventListener('click', () => {
    addFilm(); addSong();
    progress.completed = [...new Set([...progress.completed, 19])]; saveProgress(); renderDays(); showScreen('#estampa4');
  });
  refresh();

  // ── NAVEGACIÓN ────────────────────────────────────────────────────────────
  $('#backCalendar4').addEventListener('click', () => { renderDays(); showScreen('#calendario'); });
  $('#startD4Game').addEventListener('click', () => showScreen('#minijuego4'));
  $('#backToMission4').addEventListener('click', () => showScreen('#mision4'));
  $('#backMission4').addEventListener('click', () => showScreen('#mision4'));
  $('#finishDay4').addEventListener('click', () => { renderDays(); showScreen('#calendario'); });
  $('#printButton4').addEventListener('click', () => window.print());

  // app.js llama a esto desde showScreen(): al volver a la repisa el tocadiscos está en reposo.
  window.d4Sync = id => { if(id === '#mision4') resetDisc(); };
})();
