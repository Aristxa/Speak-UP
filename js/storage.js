/* Local persistence (settings + session history) and derived stats. */

const Store = (() => {
  const KEY_SETTINGS = 'guxo.settings';
  const KEY_HISTORY = 'guxo.history';

  const defaults = {
    lang: (navigator.language || '').toLowerCase().startsWith('sq') ? 'sq' : 'en',
    theme: 'auto',
    mode: 'question',
    category: 'any',
    prepTime: 15,
    speakTime: null, // null = follow the Courage Path
    camera: false,
    transcript: true,
    breathing: true,
  };

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
  }

  let settings = { ...defaults, ...read(KEY_SETTINGS, {}) };
  let history = read(KEY_HISTORY, []);
  if (!Array.isArray(history)) history = [];

  return {
    get settings() { return settings; },
    set(key, value) { settings[key] = value; write(KEY_SETTINGS, settings); },

    get history() { return history; },
    find(id) { return history.find(s => s.id === id); },
    add(session) { history.unshift(session); write(KEY_HISTORY, history); },
    update(id, patch) {
      const s = this.find(id);
      if (s) { Object.assign(s, patch); write(KEY_HISTORY, history); }
    },
    remove(id) { history = history.filter(s => s.id !== id); write(KEY_HISTORY, history); },
    clear() { history = []; write(KEY_HISTORY, history); },

    exportJSON() {
      return JSON.stringify({ app: 'guxo', version: 1, exported: new Date().toISOString(), settings, history }, null, 2);
    },
    importJSON(text) {
      const data = JSON.parse(text);
      if (!Array.isArray(data.history)) throw new Error('invalid');
      const known = new Set(history.map(s => s.id));
      const merged = [...history, ...data.history.filter(s => s && s.id && !known.has(s.id))];
      merged.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      history = merged;
      write(KEY_HISTORY, history);
    },
  };
})();

const Stats = {
  dayKey(d = new Date()) {
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  },

  daysBetween(a, b) {
    const da = new Date(a + 'T12:00:00'), db = new Date(b + 'T12:00:00');
    return Math.round((db - da) / 86400000);
  },

  streaks(history) {
    const days = [...new Set(history.map(s => this.dayKey(new Date(s.date))))].sort();
    if (!days.length) return { current: 0, best: 0, today: false };
    let best = 1, run = 1;
    for (let i = 1; i < days.length; i++) {
      run = this.daysBetween(days[i - 1], days[i]) === 1 ? run + 1 : 1;
      best = Math.max(best, run);
    }
    const today = this.dayKey();
    const last = days[days.length - 1];
    const gap = this.daysBetween(last, today);
    let current = 0;
    if (gap <= 1) {
      current = 1;
      for (let i = days.length - 1; i > 0 && this.daysBetween(days[i - 1], days[i]) === 1; i--) current++;
    }
    return { current, best, today: last === today };
  },

  totals(history) {
    const seconds = history.reduce((sum, s) => sum + (s.duration || 0), 0);
    return { sessions: history.length, minutes: Math.round(seconds / 60), seconds };
  },

  /* Courage Path: progressively longer speeches; 3 full-length sessions unlock the next stage. */
  PATH: [30, 60, 90, 120, 180, 300],
  PATH_NEEDED: 3,

  path(history) {
    const stages = this.PATH.map(sec => {
      const done = history.filter(s => s.completed && s.speakTime >= sec).length;
      return { seconds: sec, done: Math.min(done, this.PATH_NEEDED), complete: done >= this.PATH_NEEDED };
    });
    let current = stages.findIndex(s => !s.complete);
    if (current === -1) current = stages.length - 1;
    return { stages, current, recommended: this.PATH[current] };
  },

  BADGES: [
    { id: 'first', icon: '🎤', test: h => h.length >= 1 },
    { id: 'streak3', icon: '🔥', test: h => Stats.streaks(h).best >= 3 },
    { id: 'streak7', icon: '🌟', test: h => Stats.streaks(h).best >= 7 },
    { id: 'ten', icon: '🏅', test: h => h.length >= 10 },
    { id: 'marathon', icon: '🏃', test: h => h.some(s => s.duration >= 180) },
    { id: 'smooth', icon: '🧈', test: h => h.some(s => s.words >= 50 && s.duration >= 60 && s.fillerTotal === 0) },
    { id: 'debater', icon: '⚖️', test: h => h.some(s => s.mode === 'debate' && s.completed) },
    { id: 'storyteller', icon: '📖', test: h => h.some(s => s.mode === 'story' && s.completed) },
    { id: 'brave', icon: '🦁', test: h => h.some(s => s.anxietyBefore >= 4 && s.completed) },
    { id: 'calmer', icon: '🌊', test: h => h.some(s => s.anxietyBefore && s.anxietyAfter && s.anxietyBefore - s.anxietyAfter >= 2) },
    { id: 'explorer', icon: '🧭', test: h => new Set(h.map(s => s.category).filter(Boolean)).size >= 5 },
    { id: 'bilingual', icon: '🗣️', test: h => new Set(h.map(s => s.lang)).size >= 2 },
  ],

  earnedBadges(history) {
    return new Set(this.BADGES.filter(b => b.test(history)).map(b => b.id));
  },
};
