/* Guxo: public-speaking practice. Hash-routed single-page app. */

const app = document.getElementById('app');
const $ = sel => app.querySelector(sel);

let viewCleanup = null;
let pending = null;        // session config waiting to run
let lastMedia = null;      // { id, url, video, type } for the most recent recording
let lastNewBadges = null;  // { id, list } badges unlocked by the most recent session

const FACES = { 1: '😌', 2: '🙂', 3: '😐', 4: '😟', 5: '😰' };
const MODE_TINT = { word: 'teal', question: 'blue', debate: 'coral', story: 'violet' };
const TINTS = ['teal', 'amber', 'coral', 'blue', 'violet', 'pink'];
const catTint = id => TINTS[Math.max(0, CATEGORIES.findIndex(c => c.id === id)) % TINTS.length];

/* ---------- helpers ---------- */

function go(hash) {
  if (location.hash === hash) render();
  else location.hash = hash;
}

function pad(n) { return String(n).padStart(2, '0'); }

function fmtTime(sec) {
  sec = Math.max(0, Math.ceil(sec));
  return `${Math.floor(sec / 60)}:${pad(sec % 60)}`;
}

function fmtDur(sec) {
  if (sec < 60) return `${sec}s`;
  if (sec % 60 === 0) return `${sec / 60} min`;
  return `${Math.floor(sec / 60)}:${pad(sec % 60)} min`;
}

function fmtDate(iso) {
  const d = new Date(iso);
  const locale = Store.settings.lang === 'sq' ? 'sq-AL' : 'en-GB';
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short' }) + ' · ' +
    d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}

function otherLang(obj) {
  return Store.settings.lang === 'en' ? obj.sq : obj.en;
}

function normalize(s) {
  return s.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
}

function speakDefault() {
  return Store.settings.speakTime || Stats.path(Store.history).recommended;
}

function newSessionConfig({ mode, category = 'any', prompt = null, fixed = false, daily = false }) {
  const s = Store.settings;
  return {
    mode,
    category,
    prompt: prompt || Prompts.make(mode, category),
    fixed,
    daily,
    prepTime: s.prepTime,
    speakTime: speakDefault(),
    camera: s.camera,
    transcript: s.transcript && SpeechSession.transcriptSupported,
    breathing: s.breathing,
    lang: s.lang,
  };
}

function launch(cfg) {
  pending = cfg;
  go('#/session');
}

function anxietyScale(selected) {
  return `<div class="anx-scale" role="radiogroup">
    ${[1, 2, 3, 4, 5].map(n => `
      <button type="button" class="anx ${selected === n ? 'selected' : ''}" data-anx="${n}" role="radio" aria-checked="${selected === n}">
        <span class="anx-face" aria-hidden="true">${FACES[n]}</span><span>${t('anx.' + n)}</span>
      </button>`).join('')}
  </div>`;
}

function pathWidget(path) {
  return `<ol class="path">
    ${path.stages.map((st, i) => `
      <li class="path-step ${st.complete ? 'done' : ''} ${i === path.current && !st.complete ? 'current' : ''}"
          title="${t('progress.level', { n: i + 1 })}: ${fmtDur(st.seconds)} (${st.done}/${Stats.PATH_NEEDED})">
        <span class="path-time">${st.complete ? '✓ ' : ''}${fmtDur(st.seconds)}</span>
        <span class="path-dots" aria-hidden="true">${[0, 1, 2].map(d => `<i class="${d < st.done ? 'on' : ''}"></i>`).join('')}</span>
      </li>`).join('')}
  </ol>`;
}

function modeCard(m, href) {
  return `<a class="mode-card tint-${MODE_TINT[m]}" href="${href}">
    <span class="mode-icon" aria-hidden="true">${MODE_ICONS[m]}</span>
    <strong>${t('mode.' + m)}</strong>
    <span class="muted">${t('mode.' + m + '.d')}</span>
  </a>`;
}

function promptRow(item, mode, catId, idx) {
  return `<li class="prompt-row">
    <div class="prompt-row-text">
      <span>${escapeHTML(L(item))}</span>
      <span class="alt">${escapeHTML(otherLang(item))}</span>
    </div>
    <button class="btn btn-sm" data-practice="${mode}|${catId}|${idx}" aria-label="${t('topics.practice')}: ${escapeHTML(L(item))}">▶ ${t('topics.practice')}</button>
  </li>`;
}

/* ---------- chrome (header, footer, theme, language) ---------- */

function applyTheme() {
  const theme = Store.settings.theme;
  if (theme === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', theme);
}

function currentThemeIsDark() {
  const theme = Store.settings.theme;
  if (theme !== 'auto') return theme === 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function renderChrome(routeName) {
  document.documentElement.lang = Store.settings.lang;
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  const langBtn = document.getElementById('lang-btn');
  langBtn.textContent = Store.settings.lang === 'en' ? 'SQ' : 'EN';
  langBtn.setAttribute('aria-label', t('aria.lang'));
  const themeBtn = document.getElementById('theme-btn');
  themeBtn.textContent = currentThemeIsDark() ? '☀️' : '🌙';
  themeBtn.setAttribute('aria-label', t('aria.theme'));
  document.querySelectorAll('.nav a').forEach(a => {
    a.classList.toggle('active', a.dataset.route === (routeName || ''));
  });
}

document.getElementById('lang-btn').addEventListener('click', () => {
  Store.set('lang', Store.settings.lang === 'en' ? 'sq' : 'en');
  render();
});

document.getElementById('theme-btn').addEventListener('click', () => {
  Store.set('theme', currentThemeIsDark() ? 'light' : 'dark');
  applyTheme();
  renderChrome(parseHash().name);
});

/* Delegated actions available on several pages. */
app.addEventListener('click', e => {
  const practice = e.target.closest('[data-practice]');
  if (practice) {
    const [mode, catId, idx] = practice.dataset.practice.split('|');
    let text, category = catId;
    if (mode === 'debate') {
      const d = DEBATES[+idx];
      text = { en: d.en, sq: d.sq };
      category = d.cat;
    } else {
      const cat = Prompts.getCategory(catId);
      text = mode === 'word' ? cat.words[+idx] : cat.questions[+idx];
    }
    launch(newSessionConfig({ mode, category, prompt: { mode, category, text }, fixed: true }));
    return;
  }
  const random = e.target.closest('[data-random]');
  if (random) {
    const [mode, catId] = random.dataset.random.split('|');
    launch(newSessionConfig({ mode, category: catId }));
  }
});

/* ---------- router ---------- */

function parseHash() {
  const h = location.hash.replace(/^#\/?/, '');
  const [path, qs] = h.split('?');
  const parts = path.split('/');
  return { name: parts[0] || '', param: parts[1] ? decodeURIComponent(parts[1]) : null, query: new URLSearchParams(qs || '') };
}

const ROUTES = {
  '': HomeView,
  practice: PracticeView,
  session: SessionView,
  results: ResultsView,
  topics: TopicsView,
  progress: ProgressView,
};

function render() {
  if (viewCleanup) { viewCleanup(); viewCleanup = null; }
  const route = parseHash();
  const view = ROUTES[route.name] || HomeView;
  renderChrome(route.name);
  app.innerHTML = '';
  view(route);
  window.scrollTo(0, 0);
  const h1 = app.querySelector('h1, h2');
  if (h1 && route.name !== 'session') { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); }
}

window.addEventListener('hashchange', render);

/* ---------- Home ---------- */

function HomeView() {
  const history = Store.history;
  const streak = Stats.streaks(history);
  const path = Stats.path(history);
  const today = Stats.dayKey();
  const daily = Prompts.daily(today);
  const dailyDone = history.some(s => s.daily && Stats.dayKey(new Date(s.date)) === today);
  const tip = Prompts.tipOfDay(today);
  const promptCount = Math.floor((CATEGORIES.reduce((n, c) => n + c.words.length + c.questions.length, 0) + DEBATES.length) / 10) * 10;

  app.innerHTML = `
    <section class="hero">
      <div class="hero-text">
        <p class="eyebrow">🎤 ${t('tagline')}</p>
        <h1>${t('home.title1')}<br><span class="grad-text">${t('home.title2')}</span></h1>
        <p class="lead">${t('home.lead')}</p>
        <div class="btn-row">
          <button class="btn btn-primary btn-lg" id="quick">🎤 ${t('home.start')}</button>
          <a class="btn btn-ghost btn-lg" href="#/practice">${t('home.custom')}</a>
        </div>
        <div class="stats-strip">
          <span><strong>${CATEGORIES.length}</strong>${t('home.statTopics')}</span>
          <span><strong>${promptCount}+</strong>${t('home.statPrompts')}</span>
          <span><strong>2</strong>${t('home.statLangs')} · EN / SQ</span>
        </div>
      </div>
      <aside class="stage-card">
        <div class="card-head">
          <span class="eyebrow">📅 ${t('home.daily')}</span>
          <span class="chip">${MODE_ICONS[daily.mode]} ${t('mode.' + daily.mode)}</span>
        </div>
        <p class="daily-text">${escapeHTML(L(daily.text))}</p>
        <div class="stage-mic">
          <span class="eq" aria-hidden="true">${'<i></i>'.repeat(14)}</span>
          <span>${t('home.stageNote')}</span>
        </div>
        <div class="btn-row">
          <button class="btn btn-primary" id="daily">${t('home.dailyGo')} →</button>
          ${dailyDone ? `<span class="done-pill">✓ ${t('home.dailyDone')}</span>` : ''}
        </div>
      </aside>
    </section>

    <section class="grid-2">
      <div class="card">
        <div class="card-head">
          <h2>🧗 ${t('home.path')}</h2>
          <span class="streak"><strong>${streak.current}</strong> 🔥 ${t('home.streak')}</span>
        </div>
        <p class="muted small">${t('home.pathLead')}</p>
        ${pathWidget(path)}
      </div>
      <div class="card tip">
        <span class="eyebrow">💡 ${t('home.tip')}</span>
        <p class="tip-text">${escapeHTML(L(tip))}</p>
        <a class="link" href="#/topics">${t('home.browse')} →</a>
      </div>
    </section>

    <section>
      <h2>${t('home.modes')}</h2>
      <div class="mode-grid">${MODES.map(m => modeCard(m, `#/practice?mode=${m}`)).join('')}</div>
    </section>

    <section>
      <h2>${t('home.how')}</h2>
      <ol class="steps">
        ${[1, 2, 3, 4].map(n => `<li><span class="step-num">${n}</span><strong>${t('home.s' + n)}</strong><span class="muted">${t('home.s' + n + 'd')}</span></li>`).join('')}
      </ol>
    </section>`;

  $('#quick').onclick = () => launch(newSessionConfig({ mode: Store.settings.mode, category: Store.settings.category }));
  $('#daily').onclick = () => launch(newSessionConfig({ mode: daily.mode, category: daily.category || 'any', prompt: daily, fixed: true, daily: true }));
}

/* ---------- Practice setup ---------- */

function PracticeView({ query }) {
  if (MODES.includes(query.get('mode'))) Store.set('mode', query.get('mode'));
  if (query.get('cat')) Store.set('category', query.get('cat'));
  const s = Store.settings;
  const path = Stats.path(Store.history);
  const prepOpts = [0, 5, 15, 30, 60];
  const speakOpts = [30, 60, 90, 120, 180, 300];
  const srOK = SpeechSession.transcriptSupported;

  const chip = (name, value, checked, label) =>
    `<label class="chip-option"><input type="radio" name="${name}" value="${value}" ${checked ? 'checked' : ''}><span>${label}</span></label>`;
  const toggle = (name, label, desc, checked, disabled) =>
    `<label class="toggle ${disabled ? 'disabled' : ''}">
      <input type="checkbox" name="${name}" ${checked && !disabled ? 'checked' : ''} ${disabled ? 'disabled' : ''}>
      <span class="switch" aria-hidden="true"></span>
      <span class="toggle-text"><strong>${label}</strong><span class="muted small">${desc}</span></span>
    </label>`;

  app.innerHTML = `
    <div class="page-head"><h1>${t('practice.title')}</h1></div>
    <form class="setup" id="setup">
      <fieldset>
        <legend>${t('practice.mode')}</legend>
        <div class="mode-grid">
          ${MODES.map(m => `
            <label class="mode-card selectable tint-${MODE_TINT[m]}">
              <input type="radio" name="mode" value="${m}" ${s.mode === m ? 'checked' : ''}>
              <span class="mode-icon" aria-hidden="true">${MODE_ICONS[m]}</span>
              <strong>${t('mode.' + m)}</strong>
              <span class="muted">${t('mode.' + m + '.d')}</span>
            </label>`).join('')}
        </div>
      </fieldset>

      <label class="field">
        <span class="legend">${t('practice.topic')}</span>
        <select name="category">
          <option value="any">${t('practice.any')}</option>
          ${CATEGORIES.map(c => `<option value="${c.id}" ${s.category === c.id ? 'selected' : ''}>${c.icon} ${escapeHTML(L(c.name))}</option>`).join('')}
        </select>
      </label>

      <fieldset>
        <legend>${t('practice.prep')}</legend>
        <div class="chips">${prepOpts.map(v => chip('prepTime', v, v === s.prepTime, v ? fmtDur(v) : t('practice.none'))).join('')}</div>
      </fieldset>

      <fieldset>
        <legend>${t('practice.speak')}</legend>
        <div class="chips">
          ${chip('speakTime', 'auto', s.speakTime == null, '🧗 ' + t('practice.auto', { t: fmtDur(path.recommended) }))}
          ${speakOpts.map(v => chip('speakTime', v, v === s.speakTime, fmtDur(v))).join('')}
        </div>
      </fieldset>

      <fieldset>
        <legend>${t('practice.options')}</legend>
        <div class="toggles">
          ${toggle('breathing', t('practice.breathing'), t('practice.breathing.d'), s.breathing, false)}
          ${toggle('transcript', t('practice.transcript'), srOK ? t('practice.transcript.d') : t('practice.transcriptNA'), s.transcript, !srOK)}
          ${toggle('camera', t('practice.camera'), t('practice.camera.d'), s.camera, false)}
        </div>
      </fieldset>

      <div class="btn-row">
        <button class="btn btn-primary btn-lg" type="submit">▶ ${t('practice.start')}</button>
        <span class="muted small">🔒 ${t('practice.privacy')}</span>
      </div>
    </form>`;

  const form = $('#setup');
  form.addEventListener('change', e => {
    const el = e.target;
    let v;
    if (el.type === 'checkbox') v = el.checked;
    else if (el.name === 'prepTime') v = +el.value;
    else if (el.name === 'speakTime') v = el.value === 'auto' ? null : +el.value;
    else v = el.value;
    Store.set(el.name, v);
  });
  form.addEventListener('submit', e => {
    e.preventDefault();
    launch(newSessionConfig({ mode: Store.settings.mode, category: Store.settings.category }));
  });
}

/* ---------- Session (check-in → breathe → prepare → speak) ---------- */

function SessionView() {
  const cfg = pending;
  if (!cfg) { location.replace('#/practice'); return; }
  pending = null; // a refresh returns to setup instead of replaying

  const lang = cfg.lang;
  const RING_C = 2 * Math.PI * 54;
  let timers = [];
  let audio = null;
  let micOk = false;
  let micPromise = null;
  let micPending = false;
  let rerolls = 2;
  let anxietyBefore = null;
  let phase = 'checkin';
  let speakStart = 0;
  let lastNudgeAt = 0;
  let finished = false;
  let keyHandler = null;
  let disposed = false;

  document.body.classList.add('in-session');

  const clearTimers = () => { timers.forEach(id => { clearInterval(id); clearTimeout(id); }); timers = []; };
  const setKeys = fn => {
    if (keyHandler) document.removeEventListener('keydown', keyHandler);
    keyHandler = fn;
    if (fn) document.addEventListener('keydown', fn);
  };

  viewCleanup = () => {
    disposed = true;
    clearTimers();
    setKeys(null);
    if (audio) { audio.destroy(); audio = null; }
    document.body.classList.remove('in-session');
  };

  function countdown(total, onTick, onDone) {
    const start = performance.now();
    const id = setInterval(() => {
      const elapsed = (performance.now() - start) / 1000;
      const remaining = Math.max(0, total - elapsed);
      onTick(remaining, elapsed);
      if (remaining <= 0) { clearInterval(id); onDone(); }
    }, 100);
    timers.push(id);
  }

  function ring(total) {
    return `<div class="ring" role="timer" aria-live="off">
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <defs><linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#14b8a6"/><stop offset="1" stop-color="#f06a4f"/></linearGradient></defs>
        <circle class="ring-bg" cx="60" cy="60" r="54"/>
        <circle class="ring-fg" id="ring-fg" cx="60" cy="60" r="54" stroke-dasharray="${RING_C}" stroke-dashoffset="0"/>
      </svg>
      <div class="ring-label" id="ring-label">${fmtTime(total)}</div>
    </div>`;
  }

  function setRing(remaining, total) {
    const fg = $('#ring-fg'), label = $('#ring-label');
    if (!fg) return;
    fg.style.strokeDashoffset = RING_C * (1 - remaining / total);
    label.textContent = fmtTime(remaining);
    fg.classList.toggle('warn', remaining <= 10 && total > 20);
  }

  function promptBlock(big) {
    const p = cfg.prompt;
    const cat = p.category && Prompts.getCategory(p.category);
    return `<div class="prompt-card ${big ? 'big' : ''}">
      <div class="prompt-meta">
        <span class="chip">${MODE_ICONS[cfg.mode]} ${t('mode.' + cfg.mode)}</span>
        ${cat ? `<span class="chip">${cat.icon} ${escapeHTML(L(cat.name, lang))}</span>` : ''}
      </div>
      <p class="prompt-text">${escapeHTML(L(p.text, lang))}</p>
      ${cfg.mode === 'story' ? `<p class="prompt-sub">${t('session.storyHint')}</p>` : ''}
      ${cfg.mode === 'debate' ? `<p class="prompt-sub side" id="side">${t('session.for')}</p>` : ''}
    </div>`;
  }

  function structureCard() {
    const fw = FRAMEWORKS[MODE_FRAMEWORK[cfg.mode]];
    return `<div class="card structure">
      <span class="eyebrow">${t('session.structure')}</span>
      <h3>${escapeHTML(L(fw.name, lang))}</h3>
      <ol>${fw.steps[lang].map(s => `<li>${escapeHTML(s)}</li>`).join('')}</ol>
    </div>`;
  }

  function topBar(label, live) {
    return `<div class="session-top">
      <span class="phase-label ${live ? 'live' : ''}">${live ? '<span class="dot"></span>' : ''}${label}</span>
      <button type="button" class="btn btn-ghost btn-sm" id="quit">✕ ${t('session.quit')}</button>
    </div>`;
  }

  function bindQuit() {
    const q = $('#quit');
    if (q) q.onclick = () => go('#/');
  }

  /* Microphone */
  function startMic() {
    if (micPromise) return micPromise;
    micPending = true;
    audio = new SpeechSession({
      lang,
      video: cfg.camera,
      transcript: cfg.transcript,
      onLevel,
      onTranscript,
    });
    micPromise = audio.init()
      .then(() => { micOk = true; })
      .catch(() => { micOk = false; if (audio) audio.destroy(); audio = null; })
      .finally(() => { micPending = false; attachVideo(); updateMicNotice(); });
    return micPromise;
  }

  function attachVideo() {
    const v = $('#mirror');
    if (!v) return;
    if (audio && audio.hasVideo) {
      v.srcObject = audio.stream;
      v.hidden = false;
    } else {
      v.hidden = true;
    }
  }

  function updateMicNotice() {
    const el = $('#mic-notice');
    if (!el) return;
    if (micPending) el.innerHTML = `<p class="notice">🎙️ ${t('session.requesting')}</p>`;
    else if (!micOk) el.innerHTML = `<p class="notice warn">⚠️ ${t('session.micError')}</p>`;
    else el.innerHTML = '';
  }

  function onLevel(level, voiced, silentMs) {
    const meter = $('#meter');
    if (meter) meter.style.transform = `scaleX(${Math.max(0.02, level)})`;
    const ringEl = app.querySelector('.ring');
    if (ringEl) ringEl.style.setProperty('--level', phase === 'speak' ? Math.min(1, level * 2.5).toFixed(2) : 0);
    if (phase !== 'speak') return;
    const status = $('#status');
    if (status) {
      status.textContent = voiced ? `🗣️ ${t('session.listening')}` : `🤫 ${t('session.quiet')}`;
      status.classList.toggle('on', voiced);
    }
    const now = performance.now();
    if (silentMs > 4000 && now - lastNudgeAt > 7000 && now - speakStart > 3000) {
      lastNudgeAt = now;
      showNudge(Prompts.pick(NUDGES[lang] || NUDGES.en));
    }
  }

  function onTranscript(finalText, interim) {
    const el = $('#live');
    if (!el) return;
    const tail = finalText.length > 400 ? '…' + finalText.slice(-400) : finalText;
    el.innerHTML = escapeHTML(tail) + `<span class="interim">${escapeHTML(interim)}</span>`;
  }

  function showNudge(text, strong) {
    const el = $('#nudge');
    if (!el) return;
    el.textContent = text;
    el.className = 'nudge show' + (strong ? ' strong' : '');
    timers.push(setTimeout(() => { if (el.isConnected) el.classList.remove('show'); }, 4000));
  }

  /* Phase 1: check-in */
  function showCheckin() {
    phase = 'checkin';
    app.innerHTML = `
      <div class="session stage">
        ${topBar('1 / 3')}
        <h1 class="stage-title">${t('session.checkin')}</h1>
        ${anxietyScale(null)}
        <button type="button" class="btn btn-ghost" id="skip">${t('session.skip')} →</button>
      </div>`;
    bindQuit();
    const next = () => (cfg.breathing ? showBreathing() : showPrep());
    app.querySelectorAll('[data-anx]').forEach(b => {
      b.onclick = () => { anxietyBefore = +b.dataset.anx; next(); };
    });
    $('#skip').onclick = next;
  }

  /* Phase 2: breathing (4s in, 2s hold, 6s out, three times) */
  function showBreathing() {
    phase = 'breathe';
    startMic();
    app.innerHTML = `
      <div class="session stage">
        ${topBar('2 / 3')}
        <h1 class="stage-title">${t('session.breatheTitle')}</h1>
        <div class="breath-wrap">
          <div class="breath-circle" id="bc"></div>
          <div class="breath-label" id="bl" aria-live="polite"></div>
        </div>
        <p class="muted" id="bcount"></p>
        <button type="button" class="btn btn-ghost" id="skip">${t('session.skip')} →</button>
        <div id="mic-notice"></div>
      </div>`;
    bindQuit();
    updateMicNotice();
    const steps = [['in', 4000, 1], ['hold', 2000, 1], ['out', 6000, 0.5]];
    const bc = $('#bc'), bl = $('#bl');
    let cycle = 0, i = 0;
    function step() {
      if (cycle >= 3) { showPrep(); return; }
      const [key, ms, scale] = steps[i];
      bl.textContent = t('session.' + key);
      bc.style.transitionDuration = ms + 'ms';
      bc.style.transform = `scale(${scale})`;
      $('#bcount').textContent = `${cycle + 1} / 3`;
      i++;
      if (i === steps.length) { i = 0; cycle++; }
      timers.push(setTimeout(step, ms));
    }
    bc.style.transform = 'scale(0.5)';
    timers.push(setTimeout(step, 60));
    $('#skip').onclick = () => { clearTimers(); showPrep(); };
  }

  /* Phase 3: preparation */
  function showPrep() {
    clearTimers();
    phase = 'prep';
    startMic();
    app.innerHTML = `
      <div class="session">
        ${topBar(`3 / 3 · ${t('session.prepare')}`)}
        ${promptBlock(true)}
        <div class="session-grid">
          <div class="timer-col">
            ${cfg.prepTime ? ring(cfg.prepTime) : ''}
            <button type="button" class="btn btn-primary btn-lg" id="go">🎤 ${t('session.ready')}</button>
            ${!cfg.fixed && rerolls > 0 ? `<button type="button" class="btn btn-ghost btn-sm" id="reroll">🔀 ${t('session.reroll', { n: rerolls })}</button>` : ''}
            <p class="muted small keys">${t('session.keys')}</p>
          </div>
          <div class="side-col">
            ${structureCard()}
            ${cfg.camera ? '<video id="mirror" class="mirror" autoplay muted playsinline hidden></video>' : ''}
          </div>
        </div>
        <div id="mic-notice"></div>
      </div>`;
    bindQuit();
    attachVideo();
    updateMicNotice();

    $('#go').onclick = startSpeaking;
    const reroll = $('#reroll');
    if (reroll) reroll.onclick = () => {
      rerolls--;
      cfg.prompt = Prompts.make(cfg.mode, cfg.category);
      showPrep();
    };
    setKeys(e => { if (e.key === 'Enter' && !e.target.closest('button')) { e.preventDefault(); startSpeaking(); } });

    if (cfg.prepTime) {
      let lastBeep = null;
      countdown(cfg.prepTime, remaining => {
        setRing(remaining, cfg.prepTime);
        const sec = Math.ceil(remaining);
        if (sec <= 3 && sec > 0 && sec !== lastBeep) { lastBeep = sec; Sound.tick(); }
      }, startSpeaking);
    }
  }

  /* Phase 4: speaking */
  async function startSpeaking() {
    if (phase !== 'prep') return;
    phase = 'starting';
    clearTimers();
    setKeys(null);
    if (micPromise) {
      app.querySelectorAll('button').forEach(b => { b.disabled = true; });
      await micPromise;
    }
    if (finished || disposed) return;

    phase = 'speak';
    app.innerHTML = `
      <div class="session speaking">
        ${topBar(t('session.speak'), true)}
        ${promptBlock(false)}
        <div class="session-grid">
          <div class="timer-col">
            ${ring(cfg.speakTime)}
            <div class="meter" aria-hidden="true"><div class="meter-fill" id="meter"></div></div>
            <p class="status" id="status">${micOk ? '' : '⏱️'}</p>
            <button type="button" class="btn btn-primary btn-lg" id="finish">■ ${t('session.finish')}</button>
            <p class="muted small keys">Esc · ${t('session.finish')}</p>
          </div>
          <div class="side-col">
            <div class="nudge" id="nudge" aria-live="polite"></div>
            ${cfg.camera ? '<video id="mirror" class="mirror" autoplay muted playsinline hidden></video>' : ''}
            ${cfg.transcript && micOk ? `<div class="card transcript-live"><span class="eyebrow">${t('session.live')}</span><p id="live"></p></div>` : ''}
            ${structureCard()}
          </div>
        </div>
        <div id="mic-notice"></div>
      </div>`;
    bindQuit();
    attachVideo();
    updateMicNotice();

    Sound.start();
    if (audio) audio.start();
    speakStart = performance.now();
    let flipped = false;

    countdown(cfg.speakTime, (remaining, elapsed) => {
      setRing(remaining, cfg.speakTime);
      if (cfg.mode === 'debate' && !flipped && elapsed >= cfg.speakTime / 2) {
        flipped = true;
        Sound.flip();
        const side = $('#side');
        if (side) { side.textContent = t('session.against'); side.classList.add('flipped'); }
        showNudge('⚖️ ' + t('session.switch'), true);
      }
    }, () => finish(true));

    $('#finish').onclick = () => finish(false);
    setKeys(e => { if (e.key === 'Escape') finish(false); });
  }

  /* Wrap up, analyse and save */
  async function finish(full) {
    if (finished) return;
    finished = true;
    clearTimers();
    setKeys(null);
    phase = 'done';
    const elapsed = (performance.now() - speakStart) / 1000;
    if (full) Sound.end();
    app.innerHTML = `<div class="session stage"><div class="spinner" aria-hidden="true"></div><p>${t('session.wrapping')}</p></div>`;

    let r = { media: null, transcript: '', transcriptAvailable: false, srError: null, voicedSeconds: null, longestPause: null };
    if (audio) {
      const a = audio;
      r = await a.stop();
      a.destroy();
      audio = null;
    }
    if (disposed) return;

    const duration = full ? cfg.speakTime : Math.min(cfg.speakTime, Math.round(elapsed));
    if (duration < 3) { go('#/practice'); return; }

    const a = r.transcriptAvailable ? Analysis.analyze(r.transcript, lang) : { words: null, fillers: {}, fillerTotal: null };
    const session = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      date: new Date().toISOString(),
      lang,
      mode: cfg.mode,
      category: cfg.prompt.category || null,
      prompt: cfg.prompt.text,
      daily: cfg.daily,
      prepTime: cfg.prepTime,
      speakTime: cfg.speakTime,
      duration,
      completed: full || duration >= cfg.speakTime * 0.9,
      words: a.words,
      wpm: a.words != null && duration >= 10 ? Math.round(a.words / (duration / 60)) : null,
      fillers: a.fillers,
      fillerTotal: a.fillerTotal,
      transcript: r.transcriptAvailable ? r.transcript : '',
      srError: cfg.transcript ? r.srError : null,
      longestPause: r.longestPause != null ? Math.round(r.longestPause * 10) / 10 : null,
      voicedRatio: r.voicedSeconds != null ? Math.min(1, r.voicedSeconds / duration) : null,
      anxietyBefore,
      anxietyAfter: null,
      rating: null,
      notes: '',
    };

    const before = Stats.earnedBadges(Store.history);
    Store.add(session);
    const after = Stats.earnedBadges(Store.history);
    lastNewBadges = { id: session.id, list: [...after].filter(b => !before.has(b)) };
    if (lastMedia) URL.revokeObjectURL(lastMedia.url);
    lastMedia = r.media ? { id: session.id, ...r.media } : null;
    go('#/results/' + session.id);
  }

  showCheckin();
}

/* ---------- Results ---------- */

function buildFeedback(s) {
  const out = [];
  if (s.completed) out.push(['✅', t('fb.completed')]);
  else out.push(['⏱️', t('fb.early', { p: Math.round((s.duration / s.speakTime) * 100) })]);
  if (s.completed && s.anxietyBefore >= 4) out.push(['🦁', t('fb.brave')]);
  if (s.anxietyBefore && s.anxietyAfter && s.anxietyAfter < s.anxietyBefore) {
    out.push(['🌊', t('fb.calmer', { a: `${s.anxietyBefore}/5`, b: `${s.anxietyAfter}/5` })]);
  }
  if (s.wpm != null && s.words >= 20) {
    if (s.wpm > 170) out.push(['🐇', t('fb.fast', { w: s.wpm })]);
    else if (s.wpm < 100) out.push(['🐢', t('fb.slow', { w: s.wpm })]);
    else out.push(['🎯', t('fb.pace', { w: s.wpm })]);
  }
  if (s.fillerTotal != null && s.words >= 30) {
    const perMin = s.fillerTotal / (s.duration / 60);
    if (perMin > 4) out.push(['🧹', t('fb.fillers', { n: perMin.toFixed(1) })]);
    else if (s.fillerTotal <= 1) out.push(['✨', t('fb.noFillers')]);
  }
  if (s.longestPause != null && s.longestPause > 5) out.push(['🤫', t('fb.pause', { s: s.longestPause })]);
  return out.map(([icon, text]) => `<li><span aria-hidden="true">${icon}</span><span>${escapeHTML(text)}</span></li>`).join('');
}

function badgeHTML(id, earned = true) {
  const b = Stats.BADGES.find(x => x.id === id);
  return `<div class="badge ${earned ? '' : 'locked'}">
    <span class="badge-icon" aria-hidden="true">${b.icon}</span>
    <strong>${t('badge.' + id)}</strong>
    <span class="muted small">${t('badge.' + id + '.d')}</span>
  </div>`;
}

function ResultsView({ param }) {
  const s = Store.find(param);
  if (!s) {
    app.innerHTML = `<div class="page-head"><h1>${t('results.notFound')}</h1></div><a class="btn btn-primary" href="#/">${t('nav.home')}</a>`;
    return;
  }
  const media = lastMedia && lastMedia.id === s.id ? lastMedia : null;
  const newBadges = lastNewBadges && lastNewBadges.id === s.id ? lastNewBadges.list : [];
  const cat = s.category && Prompts.getCategory(s.category);
  const dash = '—';
  let anxietyAfter = s.anxietyAfter;
  let rating = s.rating;

  const tile = (label, value, sub) => `<div class="tile"><span class="tile-label">${label}</span><span class="tile-value">${value}</span>${sub ? `<span class="muted small">${sub}</span>` : ''}</div>`;
  const fillerList = s.fillers && Object.keys(s.fillers).length
    ? Object.entries(s.fillers).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([w, n]) => `"${escapeHTML(w)}" ×${n}`).join(', ')
    : '';

  app.innerHTML = `
    <div class="results">
      <header class="results-head">
        <div class="big-emoji" aria-hidden="true">${s.completed ? '🎉' : '💪'}</div>
        <h1>${s.completed ? t('results.done') : t('results.early')}</h1>
        <p class="prompt-recap">“${escapeHTML(L(s.prompt))}”</p>
        <div class="prompt-meta center">
          <span class="chip">${MODE_ICONS[s.mode]} ${t('mode.' + s.mode)}</span>
          ${cat ? `<span class="chip">${cat.icon} ${escapeHTML(L(cat.name))}</span>` : ''}
          <span class="chip">${s.lang.toUpperCase()}</span>
          <span class="chip">${fmtDate(s.date)}</span>
        </div>
      </header>

      ${newBadges.length ? `
        <div class="card badge-unlock">
          <h2>🏆 ${t('results.newBadge')}</h2>
          <div class="badge-grid">${newBadges.map(id => badgeHTML(id)).join('')}</div>
        </div>` : ''}

      <div class="tiles">
        ${tile(t('results.time'), fmtTime(s.duration), `/ ${fmtTime(s.speakTime)}`)}
        ${tile(t('results.words'), s.words ?? dash)}
        ${tile(t('results.wpm'), s.wpm ?? dash)}
        ${tile(t('results.fillers'), s.fillerTotal ?? dash, fillerList)}
        ${tile(t('results.pause'), s.longestPause != null ? s.longestPause + 's' : dash)}
        ${tile(t('results.voiced'), s.voicedRatio != null ? Math.round(s.voicedRatio * 100) + '%' : dash)}
      </div>

      <div class="grid-2">
        <div class="card">
          <h2>${t('results.feedback')}</h2>
          <ul class="feedback" id="feedback">${buildFeedback(s)}</ul>
        </div>
        <div class="card">
          <h2>${t('results.recording')}</h2>
          ${media ? `
            ${media.video
              ? `<video class="playback" controls playsinline src="${media.url}"></video>`
              : `<audio class="playback" controls src="${media.url}"></audio>`}
            <a class="btn btn-sm" href="${media.url}" download="guxo-${s.id}.${media.type.includes('mp4') ? 'mp4' : media.type.includes('ogg') ? 'ogg' : 'webm'}">⬇ ${t('results.download')}</a>
            <p class="muted small">${t('results.noMedia')}</p>` : `<p class="muted">${t('results.noRecording')}</p>`}
        </div>
      </div>

      <div class="card">
        <h2>${t('results.transcript')}</h2>
        ${s.srError ? `<p class="notice warn">⚠️ ${t('results.srError', { e: escapeHTML(s.srError) })}</p>` : ''}
        ${s.transcript
          ? `<p class="transcript">${Analysis.highlight(s.transcript, s.lang)}</p><p class="muted small">${t('results.fillerHint')}</p>`
          : `<p class="muted">${t('results.noTranscript')}</p>`}
      </div>

      <form class="card reflect" id="reflect">
        <h2>${t('results.reflect')}</h2>
        <p class="field-label">${t('session.checkinAfter')}</p>
        <div id="anx-after">${anxietyScale(anxietyAfter)}</div>
        <p class="field-label">${t('results.rating')}</p>
        <div class="stars" id="stars" role="radiogroup" aria-label="${t('results.rating')}">
          ${[1, 2, 3, 4, 5].map(n => `<button type="button" class="star ${rating >= n ? 'on' : ''}" data-star="${n}" role="radio" aria-checked="${rating === n}" aria-label="${n}/5">★</button>`).join('')}
        </div>
        <label class="field">
          <span class="field-label">${t('results.notes')}</span>
          <textarea name="notes" rows="3">${escapeHTML(s.notes || '')}</textarea>
        </label>
        <div class="btn-row">
          <button type="submit" class="btn btn-primary">${t('results.save')}</button>
          <span class="saved-msg" id="saved" aria-live="polite"></span>
        </div>
        <div id="late-badges"></div>
      </form>

      <div class="btn-row center">
        <button class="btn btn-primary btn-lg" id="next">🔀 ${t('results.next')}</button>
        <button class="btn btn-ghost btn-lg" id="again">🔁 ${t('results.again')}</button>
        <a class="btn btn-ghost btn-lg" href="#/">${t('nav.home')}</a>
      </div>
    </div>`;

  const bindAnx = () => app.querySelectorAll('#anx-after [data-anx]').forEach(b => {
    b.onclick = () => {
      anxietyAfter = +b.dataset.anx;
      $('#anx-after').innerHTML = anxietyScale(anxietyAfter);
      bindAnx();
    };
  });
  bindAnx();

  app.querySelectorAll('[data-star]').forEach(b => {
    b.onclick = () => {
      rating = +b.dataset.star;
      app.querySelectorAll('[data-star]').forEach(x => {
        x.classList.toggle('on', +x.dataset.star <= rating);
        x.setAttribute('aria-checked', +x.dataset.star === rating);
      });
    };
  });

  $('#reflect').addEventListener('submit', e => {
    e.preventDefault();
    const before = Stats.earnedBadges(Store.history);
    Store.update(s.id, { anxietyAfter, rating, notes: e.target.notes.value.trim() });
    const after = Stats.earnedBadges(Store.history);
    const fresh = [...after].filter(b => !before.has(b));
    $('#feedback').innerHTML = buildFeedback(Store.find(s.id));
    $('#saved').textContent = '✓ ' + t('results.saved');
    if (fresh.length) {
      $('#late-badges').innerHTML = `<h3>🏆 ${t('results.newBadge')}</h3><div class="badge-grid">${fresh.map(id => badgeHTML(id)).join('')}</div>`;
    }
  });

  const fresh = lastNewBadges && lastNewBadges.id === s.id && !lastNewBadges.celebrated;
  if (fresh && s.completed && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    lastNewBadges.celebrated = true;
    viewCleanup = confetti();
  }

  $('#next').onclick = () => launch(newSessionConfig({ mode: s.mode, category: Store.settings.category }));
  $('#again').onclick = () => launch(newSessionConfig({
    mode: s.mode,
    category: s.category || 'any',
    prompt: { mode: s.mode, category: s.category, text: s.prompt },
    fixed: true,
  }));
}

/* A short, lightweight confetti burst. Returns a cleanup function. */
function confetti() {
  const canvas = document.createElement('canvas');
  canvas.id = 'confetti';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.width = innerWidth * dpr;
  const H = canvas.height = innerHeight * dpr;
  const colors = ['#14b8a6', '#2dd4bf', '#f06a4f', '#ffb347', '#a78bfa', '#f472b6'];
  const pieces = Array.from({ length: 140 }, () => ({
    x: W / 2 + (Math.random() - 0.5) * W * 0.3,
    y: H * 0.35,
    vx: (Math.random() - 0.5) * 18 * dpr,
    vy: (Math.random() * -16 - 6) * dpr,
    w: (6 + Math.random() * 6) * dpr,
    h: (8 + Math.random() * 8) * dpr,
    r: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.3,
    c: colors[Math.floor(Math.random() * colors.length)],
  }));
  let frame, start = performance.now();
  const draw = now => {
    const tt = (now - start) / 1000;
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = Math.max(0, 1 - Math.max(0, tt - 2) / 1.2);
    for (const p of pieces) {
      p.vy += 0.5 * dpr; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
      ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r * 2)));
      ctx.restore();
    }
    if (tt < 3.2) frame = requestAnimationFrame(draw);
    else canvas.remove();
  };
  frame = requestAnimationFrame(draw);
  return () => { cancelAnimationFrame(frame); canvas.remove(); };
}

/* ---------- Topics ---------- */

function TopicsView({ param }) {
  if (param === 'debates') return DebatesDetail();
  if (param && Prompts.getCategory(param)) return TopicDetail(Prompts.getCategory(param));

  app.innerHTML = `
    <div class="page-head">
      <h1>${t('topics.title')}</h1>
      <p class="lead">${t('topics.lead')}</p>
      <input type="search" class="search" id="search" placeholder="${t('topics.search')}" aria-label="${t('topics.search')}">
    </div>
    <div id="topic-body"></div>`;

  const body = $('#topic-body');
  const grid = () => `
    <div class="topic-grid">
      ${CATEGORIES.map(c => `
        <a class="topic-card tint-${catTint(c.id)}" href="#/topics/${c.id}">
          <span class="topic-icon" aria-hidden="true">${c.icon}</span>
          <strong>${escapeHTML(L(c.name))}</strong>
          <span class="alt">${escapeHTML(otherLang(c.name))}</span>
          <span class="topic-foot">
            <span class="chip sm level-${c.level}">${t('level.' + c.level)}</span>
            <span class="muted small">${t('topics.count', { n: c.words.length + c.questions.length })}</span>
          </span>
        </a>`).join('')}
      <a class="topic-card tint-coral" href="#/topics/debates">
        <span class="topic-icon" aria-hidden="true">⚖️</span>
        <strong>${t('topics.debates')}</strong>
        <span class="alt">${Store.settings.lang === 'en' ? 'Debate' : 'Debates'}</span>
        <span class="topic-foot">
          <span class="chip sm level-3">${t('level.3')}</span>
          <span class="muted small">${t('topics.count', { n: DEBATES.length })}</span>
        </span>
      </a>
    </div>`;

  function search(q) {
    const nq = normalize(q.trim());
    if (nq.length < 2) { body.innerHTML = grid(); return; }
    const match = item => normalize(item.en).includes(nq) || normalize(item.sq).includes(nq);
    const rows = [];
    CATEGORIES.forEach(c => {
      c.words.forEach((w, i) => { if (match(w)) rows.push(promptRow(w, 'word', c.id, i)); });
      c.questions.forEach((w, i) => { if (match(w)) rows.push(promptRow(w, 'question', c.id, i)); });
    });
    DEBATES.forEach((d, i) => { if (match(d)) rows.push(promptRow(d, 'debate', d.cat, i)); });
    body.innerHTML = rows.length ? `<ul class="prompt-list">${rows.join('')}</ul>` : `<p class="muted">${t('topics.none')}</p>`;
  }

  body.innerHTML = grid();
  $('#search').addEventListener('input', e => search(e.target.value));
}

function TopicDetail(c) {
  const debates = DEBATES.map((d, i) => [d, i]).filter(([d]) => d.cat === c.id);
  app.innerHTML = `
    <a class="link back" href="#/topics">← ${t('topics.back')}</a>
    <div class="page-head topic-head tint-${catTint(c.id)}">
      <span class="topic-icon big" aria-hidden="true">${c.icon}</span>
      <div>
        <h1>${escapeHTML(L(c.name))}</h1>
        <p class="alt">${escapeHTML(otherLang(c.name))} · <span class="chip sm level-${c.level}">${t('level.' + c.level)}</span></p>
      </div>
    </div>

    <div class="card">
      <span class="eyebrow">🎲 ${t('topics.random')}</span>
      <div class="btn-row">
        ${MODES.map(m => `<button class="btn btn-sm" data-random="${m}|${c.id}">${MODE_ICONS[m]} ${t('mode.' + m)}</button>`).join('')}
      </div>
    </div>

    <section>
      <h2>${MODE_ICONS.word} ${t('topics.words')}</h2>
      <div class="word-grid tint-${catTint(c.id)}">
        ${c.words.map((w, i) => `
          <button class="word-chip" data-practice="word|${c.id}|${i}">
            <strong>${escapeHTML(L(w))}</strong><span class="alt">${escapeHTML(otherLang(w))}</span>
          </button>`).join('')}
      </div>
    </section>

    <section>
      <h2>${MODE_ICONS.question} ${t('topics.questions')}</h2>
      <ul class="prompt-list">${c.questions.map((q, i) => promptRow(q, 'question', c.id, i)).join('')}</ul>
    </section>

    ${debates.length ? `
      <section>
        <h2>${MODE_ICONS.debate} ${t('topics.debates')}</h2>
        <ul class="prompt-list">${debates.map(([d, i]) => promptRow(d, 'debate', d.cat, i)).join('')}</ul>
      </section>` : ''}`;
}

function DebatesDetail() {
  app.innerHTML = `
    <a class="link back" href="#/topics">← ${t('topics.back')}</a>
    <div class="page-head topic-head tint-coral">
      <span class="topic-icon big" aria-hidden="true">⚖️</span>
      <div>
        <h1>${t('topics.debates')}</h1>
        <p class="lead">${t('mode.debate.d')}</p>
      </div>
    </div>
    <div class="btn-row"><button class="btn btn-primary" data-random="debate|any">🎲 ${t('topics.random')}</button></div>
    <ul class="prompt-list">${DEBATES.map((d, i) => promptRow(d, 'debate', d.cat, i)).join('')}</ul>`;
}

/* ---------- Progress ---------- */

function anxietyChart(history) {
  const pts = history.filter(s => s.anxietyBefore || s.anxietyAfter).slice(0, 20).reverse();
  if (pts.length < 2) return { html: `<p class="muted">${t('progress.chartEmpty')}</p>`, bind() {} };

  const W = 640, H = 230, m = { l: 34, r: 64, t: 14, b: 30 };
  const x = i => m.l + (i * (W - m.l - m.r)) / (pts.length - 1);
  const y = v => m.t + ((5 - v) * (H - m.t - m.b)) / 4;
  const series = [
    { key: 'anxietyBefore', label: t('progress.before'), cls: 's1' },
    { key: 'anxietyAfter', label: t('progress.after'), cls: 's2' },
  ];

  const pathFor = key => {
    let d = '', pen = false;
    pts.forEach((s, i) => {
      const v = s[key];
      if (v) { d += `${pen ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)} `; pen = true; }
      else pen = false;
    });
    return d;
  };

  const lastIdx = key => { for (let i = pts.length - 1; i >= 0; i--) if (pts[i][key]) return i; return -1; };
  const ends = series.map(se => ({ se, i: lastIdx(se.key) })).filter(e => e.i >= 0)
    .map(e => ({ ...e, yv: y(pts[e.i][e.se.key]) }));
  if (ends.length === 2 && Math.abs(ends[0].yv - ends[1].yv) < 14) { ends[0].yv -= 8; ends[1].yv += 8; }

  const html = `
    <div class="chart" id="anx-chart">
      <div class="legend">
        ${series.map(se => `<span class="legend-item"><i class="swatch ${se.cls}"></i>${se.label}</span>`).join('')}
      </div>
      <div class="chart-plot">
        <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${t('progress.anxiety')}">
          ${[1, 2, 3, 4, 5].map(v => `
            <line class="grid" x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}"/>
            <text class="axis" x="${m.l - 10}" y="${y(v) + 4}" text-anchor="end">${v}</text>`).join('')}
          <text class="axis" x="${x(0)}" y="${H - 8}" text-anchor="start">${fmtDate(pts[0].date).split(' · ')[0]}</text>
          <text class="axis" x="${x(pts.length - 1)}" y="${H - 8}" text-anchor="end">${fmtDate(pts[pts.length - 1].date).split(' · ')[0]}</text>
          <line class="crosshair" id="xhair" x1="0" x2="0" y1="${m.t}" y2="${H - m.b}" visibility="hidden"/>
          ${series.map(se => `<path class="line ${se.cls}" d="${pathFor(se.key)}"/>`).join('')}
          ${series.map(se => pts.map((s, i) => s[se.key]
            ? `<circle class="dot ${se.cls}" cx="${x(i)}" cy="${y(s[se.key])}" r="4"/>` : '').join('')).join('')}
          ${ends.map(e => `<text class="direct-label" x="${x(e.i) + 10}" y="${e.yv + 4}">${e.se.label}</text>`).join('')}
          <rect class="hit" x="${m.l - 10}" y="0" width="${W - m.l - m.r + 20}" height="${H}" fill="transparent"/>
        </svg>
        <div class="tooltip" id="tip" hidden></div>
      </div>
    </div>`;

  function bind() {
    const root = document.getElementById('anx-chart');
    if (!root) return;
    const svg = root.querySelector('svg');
    const tip = root.querySelector('#tip');
    const xhair = root.querySelector('#xhair');
    const show = clientX => {
      const rect = svg.getBoundingClientRect();
      const sx = ((clientX - rect.left) / rect.width) * W;
      const i = Math.max(0, Math.min(pts.length - 1, Math.round(((sx - m.l) / (W - m.l - m.r)) * (pts.length - 1))));
      const s = pts[i];
      xhair.setAttribute('x1', x(i));
      xhair.setAttribute('x2', x(i));
      xhair.setAttribute('visibility', 'visible');
      tip.innerHTML = `
        <strong>${fmtDate(s.date)}</strong>
        <span class="muted small">${escapeHTML(L(s.prompt)).slice(0, 60)}</span>
        ${series.map(se => `<span class="tip-row"><i class="swatch ${se.cls}"></i>${se.label}<b>${s[se.key] ? s[se.key] + '/5 ' + FACES[s[se.key]] : '—'}</b></span>`).join('')}`;
      tip.hidden = false;
      const px = (x(i) / W) * rect.width;
      const tipW = tip.offsetWidth;
      tip.style.left = Math.max(0, Math.min(rect.width - tipW, px - tipW / 2)) + 'px';
    };
    const hide = () => { tip.hidden = true; xhair.setAttribute('visibility', 'hidden'); };
    svg.addEventListener('pointermove', e => show(e.clientX));
    svg.addEventListener('pointerdown', e => show(e.clientX));
    svg.addEventListener('pointerleave', hide);
  }

  return { html, bind };
}

function ProgressView() {
  const history = Store.history;
  const streak = Stats.streaks(history);
  const totals = Stats.totals(history);
  const path = Stats.path(history);
  const earned = Stats.earnedBadges(history);
  const chart = anxietyChart(history);

  const tile = (label, value) => `<div class="tile"><span class="tile-label">${label}</span><span class="tile-value">${value}</span></div>`;

  app.innerHTML = `
    <div class="page-head"><h1>${t('progress.title')}</h1></div>

    <div class="tiles">
      ${tile(t('progress.sessions'), totals.sessions)}
      ${tile(t('progress.minutes'), totals.minutes)}
      ${tile(t('progress.streak'), `${streak.current} 🔥`)}
      ${tile(t('progress.best'), `${streak.best} ${t('progress.days')}`)}
    </div>

    <div class="card">
      <h2>🧗 ${t('home.path')}</h2>
      <p class="muted small">${t('home.pathLead')}</p>
      ${pathWidget(path)}
    </div>

    <div class="card">
      <h2>${t('progress.anxiety')}</h2>
      ${chart.html}
    </div>

    <div class="card">
      <h2>${t('progress.badges')} <span class="muted small">${earned.size} / ${Stats.BADGES.length}</span></h2>
      <div class="badge-grid">${Stats.BADGES.map(b => badgeHTML(b.id, earned.has(b.id))).join('')}</div>
    </div>

    <div class="card">
      <h2>${t('progress.history')}</h2>
      ${history.length ? `
        <ul class="history">
          ${history.map(s => `
            <li class="history-row">
              <a href="#/results/${s.id}" class="history-main">
                <span class="history-icon" aria-hidden="true">${MODE_ICONS[s.mode] || '🎤'}</span>
                <span class="history-text">
                  <strong>${escapeHTML(L(s.prompt))}</strong>
                  <span class="muted small">${fmtDate(s.date)} · ${fmtTime(s.duration)} / ${fmtTime(s.speakTime)} · ${s.lang.toUpperCase()}${s.completed ? ' · ✓' : ''}</span>
                </span>
                <span class="history-anx" title="${t('progress.before')} → ${t('progress.after')}">
                  ${s.anxietyBefore ? FACES[s.anxietyBefore] : '·'} → ${s.anxietyAfter ? FACES[s.anxietyAfter] : '·'}
                </span>
              </a>
              <button class="btn btn-ghost btn-sm icon-btn" data-del="${s.id}" aria-label="${t('progress.confirmDelete')}">🗑</button>
            </li>`).join('')}
        </ul>` : `
        <p class="muted">${t('progress.empty')}</p>
        <button class="btn btn-primary" id="first">🎤 ${t('home.start')}</button>`}
    </div>

    <div class="btn-row">
      <button class="btn btn-sm" id="export">⬇ ${t('progress.export')}</button>
      <label class="btn btn-sm">⬆ ${t('progress.import')}<input type="file" accept="application/json,.json" id="import" hidden></label>
      <button class="btn btn-sm btn-danger" id="reset">${t('progress.reset')}</button>
    </div>`;

  chart.bind();

  const first = $('#first');
  if (first) first.onclick = () => launch(newSessionConfig({ mode: 'question', category: 'personal' }));

  app.querySelectorAll('[data-del]').forEach(b => {
    b.onclick = () => {
      if (confirm(t('progress.confirmDelete'))) { Store.remove(b.dataset.del); render(); }
    };
  });

  $('#export').onclick = () => {
    const blob = new Blob([Store.exportJSON()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `guxo-progress-${Stats.dayKey()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  $('#import').onchange = async e => {
    const file = e.target.files[0];
    if (!file) return;
    try { Store.importJSON(await file.text()); render(); }
    catch { alert(t('progress.importError')); }
  };

  $('#reset').onclick = () => {
    if (confirm(t('progress.confirmReset'))) { Store.clear(); render(); }
  };
}

/* ---------- boot ---------- */

applyTheme();
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => renderChrome(parseHash().name));
render();
