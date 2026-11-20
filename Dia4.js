/* DÍA 4 · NUESTRO UNIVERSO — "Cine y vinilo"
   Se carga DESPUÉS de app.js (usa sus funciones: $, showScreen, renderDays, progress, saveProgress,
   bgPause, killFrame, stopSong y la variable songFrame). Todo lo editable está en las constantes de arriba. */
(function(){
  'use strict';

  // ── EDITABLE ──────────────────────────────────────────────────────────────
  // Tu número con código de país y sin "+" (ej. '51999999999'). Vacío = ella elige a quién enviárselo.
  const WA_NUMBER = '';
  // Cuántos discos debe poner antes de que se abra la función especial.
  const MIN_HEARD = 3;

  // yt = ID del video de YouTube (lo que va después de ?v=). Si es null, el botón la busca en YouTube.
  // Cuando tengas el enlace exacto de cada canción, pega solo el ID aquí y sonará dentro de la página.
  const RECORDS = [
    { t:'Quiero caminar de tu mano', a:'Río Roma',          c1:'#e8a07a', c2:'#8f3b4a', yt:null,
      n:'Una canción para caminar sin prisa, de tu mano, hacia donde sea.' },
    { t:'With Me',                    a:'Sum 41',            c1:'#6fa8e8', c2:'#14304f', yt:'X-9ENGPgrc4',
      n:'La que sonó el 17 de marzo, cuando te pedí ser mi enamorada. Desde ese día es nuestra.' },
    { t:"Can't Help Falling in Love", a:'Elvis Presley',     c1:'#d9b26a', c2:'#5a3a1e', yt:null,
      n:'Hay cosas que no se planean. Encontrarte fue una de ellas.' },
    { t:'Wonder of You',              a:'Elvis Presley',     c1:'#c9788f', c2:'#4a2236', yt:null,
      n:'Para los días en que quiero decirte lo importante que eres, y no me alcanzan las palabras.' },
    { t:'A Thousand Years',           a:'Crepúsculo',        c1:'#9db8d4', c2:'#2d4a6e', yt:null,
      n:'La de tu película favorita, la que vimos juntos en el cine. Desde entonces también es un poco mía.' },
    { t:'The Winner Takes It All',    a:'Mamma Mia',         c1:'#e6c36a', c2:'#9a5a2a', yt:null,
      n:'De Mamma Mia, una de las que vimos juntos. Hay canciones que se sienten más fuertes cuando se escuchan con alguien.' },
    { t:'Come running home to you',   a:'The Flash',         c1:'#e0675a', c2:'#6e1f2c', yt:'QRBOzK8kLyc',
      n:'La de aquel chico que llegó corriendo a su primera cita. Sigo corriendo hacia ti.' },
    { t:'My Funny Valentine',         a:'Chet Baker',        c1:'#7f9bb8', c2:'#1d2c44', yt:null,
      n:'Para las noches tranquilas: luz tenue, un disco y tú a mi lado.' }
  ];

  // Cartelera. n = nota al voltear la entrada (opcional). soon = "próximamente". chips = lista simple sin voltear.
  const FILMS = [
    { cat:'En el cine', big:true, items:[
      { t:'Crepúsculo: Amanecer · Parte 1', n:'Tu película favorita. Hasta tu hermano nos acompañó.' },
      { t:'Spider-Man: Brand New Day',       n:'Fue muy bonito verla contigo.' }
    ]},
    { cat:'Series', items:[
      { t:'Gossip Girl', n:'Vamos por la quinta temporada. Somos Chuck y Blair, y nuestra hija ya tiene nombre.' },
      { t:'WandaVision', n:'Tu relación favorita: Wanda y Vision.' },
      { t:'The Chosen' },
      { t:'Loki' },
      { t:'VisionQuest' }
    ]},
    { cat:'Anime', items:[
      { t:'Shingeki no Kyojin', n:'Mi favorito, y a ti también te gustó.' },
      { t:'Naruto',             n:'El tuyo. Tu amiga ya sabía lo que hacía cuando te lo hizo ver.' },
      { t:'Chainsaw Man', soon:true, n:'Viste la película primero. El anime espera su turno.' }
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

  // Opciones de "¿qué quieres ver conmigo?".
  const OPTS = [
    'Chainsaw Man (el anime)',
    'Seguir Gossip Girl',
    'La saga de Crepúsculo',
    'Una maratón de Marvel'
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
  const count = $('#d4Count'), cta = $('#d4Cta');
  const heard = new Set();

  function renderNow(r){
    now.innerHTML = '';
    if(!r){
      now.append(el('p', 'd4-empty', 'Elige un disco de la repisa y ponlo en el tocadiscos.'));
      return;
    }
    now.append(el('h3', '', r.t), el('p', 'd4-artist', r.a), el('p', 'd4-note', r.n));
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
    count.textContent = n >= MIN_HEARD ? `${n} de ${RECORDS.length} discos escuchados` : `${n} de ${MIN_HEARD} discos para abrir la función especial`;
    cta.classList.toggle('hidden', n < MIN_HEARD);
  }
  function resetDisc(){
    tt.classList.remove('playing');
    [...shelf.children].forEach(s => s.classList.remove('on'));
    labelTxt.textContent = '♪';
    renderNow(null);
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
    f.append(el('small', '', it.soon ? 'Próximamente' : 'Admite dos'), el('strong', '', it.t));
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

  // ── MINIJUEGO: próxima función ────────────────────────────────────────────
  const optsBox = $('#d4Opts'), own = $('#d4Own'), song = $('#d4Song'), fb = $('#d4Fb'), reveal = $('#revealStamp4');
  let opt = null;
  const pick = () => [opt, own.value.trim()].filter(Boolean).join(' + ');
  function message(){
    const p = pick(), s = song.value.trim();
    const lines = ['Mi caballero 🏰 aquí van mis ideas para nuestra próxima función 🎬'];
    if(p) lines.push(`Quiero ver contigo: ${p}.`);
    if(s) lines.push(`Y sugiero esta canción para nuestra playlist: ${s}.`);
    return lines.join('\n');
  }
  function update(){
    const p = pick(), s = song.value.trim();
    $('#d4Pick').textContent = p || 'Por elegir…';
    $('#d4Next').textContent = p; $('#d4NextLine').classList.toggle('hidden', !p);
    $('#d4Extra').textContent = s; $('#d4ExtraLi').classList.toggle('hidden', !s);
    reveal.classList.toggle('hidden', !(p || s));
  }
  OPTS.forEach(o => {
    const b = el('button', 'opt-chip', o); b.type = 'button'; b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', () => {
      opt = opt === o ? null : o;
      [...optsBox.children].forEach(c => { const on = c.textContent === opt; c.classList.toggle('sel', on); c.setAttribute('aria-pressed', on); });
      update();
    });
    optsBox.append(b);
  });
  own.addEventListener('input', update); song.addEventListener('input', update);
  $('#d4Send').addEventListener('click', () => {
    if(!(pick() || song.value.trim())){ fb.textContent = 'Elige o escribe algo primero.'; return; }
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message())}`, '_blank', 'noopener');
    fb.textContent = 'Listo. Cuando lo envíes, tu caballero lo verá.';
  });
  $('#d4Copy').addEventListener('click', () => {
    if(!(pick() || song.value.trim())){ fb.textContent = 'Elige o escribe algo primero.'; return; }
    (navigator.clipboard ? navigator.clipboard.writeText(message()) : Promise.reject())
      .then(() => { fb.textContent = 'Mensaje copiado. Pégalo donde quieras.'; })
      .catch(() => { fb.textContent = 'No se pudo copiar. Usa el botón de enviar.'; });
  });
  reveal.addEventListener('click', () => {
    progress.completed = [...new Set([...progress.completed, 19])]; saveProgress(); renderDays(); showScreen('#estampa4');
  });

  // ── ESTAMPA ───────────────────────────────────────────────────────────────
  const tracks = $('#d4Tracks'), seen = $('#d4Seen');
  RECORDS.forEach(r => tracks.append(el('li', '', `${r.t} · ${r.a}`)));
  const extra = el('li', 'hidden'); extra.id = 'd4ExtraLi';
  extra.append(el('span', '', ''), document.createTextNode(' '));
  extra.firstChild.id = 'd4Extra';
  extra.append(el('small', '', '(sugerida por ti)'));
  tracks.append(extra);
  SEEN.forEach(t => seen.append(el('li', '', t)));

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