/* Microphone / camera capture, level metering, pause detection, recording and live transcription. */

const Sound = (() => {
  let ctx;
  function tone(freq, start, dur) {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    const t = ctx.currentTime + start;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }
  return {
    start() { try { tone(523, 0, 0.18); tone(784, 0.16, 0.3); } catch { /* audio blocked */ } },
    tick() { try { tone(880, 0, 0.1); } catch { /* audio blocked */ } },
    flip() { try { tone(660, 0, 0.15); tone(660, 0.2, 0.15); } catch { /* audio blocked */ } },
    end() { try { tone(784, 0, 0.2); tone(659, 0.18, 0.2); tone(523, 0.36, 0.45); } catch { /* audio blocked */ } },
  };
})();

const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;

class SpeechSession {
  constructor({ lang, video, transcript, onLevel, onTranscript }) {
    this.lang = lang;
    this.wantVideo = video;
    this.wantTranscript = transcript && !!SpeechRec;
    this.onLevel = onLevel || (() => {});
    this.onTranscript = onTranscript || (() => {});
    this.recording = false;
    this.finalText = '';
    this.interim = '';
    this.srError = null;
    this.noiseSamples = [];
    this.threshold = 0.02;
    this.resetPauseStats();
  }

  static get transcriptSupported() { return !!SpeechRec; }

  resetPauseStats() {
    this.voicedMs = 0;
    this.silentRunMs = 0;
    this.longestPauseMs = 0;
    this.lastTick = 0;
  }

  async init() {
    const constraints = {
      audio: { echoCancellation: true, noiseSuppression: true },
      video: this.wantVideo ? { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } : false,
    };
    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      if (!this.wantVideo) throw err;
      // Camera refused or missing: fall back to audio only.
      this.wantVideo = false;
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: constraints.audio });
    }
    this.hasVideo = this.stream.getVideoTracks().length > 0;

    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    const source = this.ctx.createMediaStreamSource(new MediaStream(this.stream.getAudioTracks()));
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 1024;
    source.connect(this.analyser);
    this.buf = new Float32Array(this.analyser.fftSize);
    this.meter = setInterval(() => this.sample(), 100);
  }

  sample() {
    this.analyser.getFloatTimeDomainData(this.buf);
    let sum = 0;
    for (let i = 0; i < this.buf.length; i++) sum += this.buf[i] * this.buf[i];
    const rms = Math.sqrt(sum / this.buf.length);

    if (!this.recording) {
      // Learn the room's background noise while the user prepares.
      this.noiseSamples.push(rms);
      if (this.noiseSamples.length > 50) this.noiseSamples.shift();
    } else {
      const now = performance.now();
      const dt = this.lastTick ? now - this.lastTick : 100;
      this.lastTick = now;
      if (rms > this.threshold) {
        this.voicedMs += dt;
        this.silentRunMs = 0;
      } else {
        this.silentRunMs += dt;
        this.longestPauseMs = Math.max(this.longestPauseMs, this.silentRunMs);
      }
    }
    this.onLevel(Math.min(1, rms / 0.2), rms > this.threshold, this.silentRunMs);
  }

  calibrate() {
    if (this.noiseSamples.length < 5) return;
    const sorted = [...this.noiseSamples].sort((a, b) => a - b);
    const floor = sorted[Math.floor(sorted.length / 2)];
    this.threshold = Math.min(0.08, Math.max(0.012, floor * 3));
  }

  start() {
    this.calibrate();
    this.resetPauseStats();
    this.recording = true;
    this.startedAt = performance.now();

    this.chunks = [];
    const types = this.hasVideo
      ? ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4']
      : ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
    const mimeType = window.MediaRecorder ? types.find(t => MediaRecorder.isTypeSupported(t)) : null;
    if (window.MediaRecorder) {
      try {
        this.recorder = new MediaRecorder(this.stream, mimeType ? { mimeType } : undefined);
        this.recorder.ondataavailable = e => { if (e.data && e.data.size) this.chunks.push(e.data); };
        this.recorder.start(1000);
      } catch { this.recorder = null; }
    }

    if (this.wantTranscript) this.startRecognition();
  }

  startRecognition() {
    const rec = new SpeechRec();
    rec.lang = this.lang === 'sq' ? 'sq-AL' : 'en-US';
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = e => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) this.finalText += r[0].transcript.trim() + ' ';
        else interim += r[0].transcript;
      }
      this.interim = interim;
      this.onTranscript(this.finalText, interim);
    };
    rec.onerror = e => {
      if (['not-allowed', 'service-not-allowed', 'language-not-supported', 'network'].includes(e.error)) {
        this.srError = e.error;
      }
    };
    rec.onend = () => {
      // Chrome ends recognition after silences; keep it alive while recording.
      if (this.recording && !this.srError) { try { rec.start(); } catch { /* already started */ } }
    };
    try { rec.start(); this.rec = rec; } catch { this.srError = 'start-failed'; }
  }

  async stop() {
    const elapsed = (performance.now() - this.startedAt) / 1000;
    this.recording = false;

    const media = await new Promise(resolve => {
      if (!this.recorder || this.recorder.state === 'inactive') return resolve(null);
      this.recorder.onstop = () => {
        if (!this.chunks.length) return resolve(null);
        const blob = new Blob(this.chunks, { type: this.recorder.mimeType || this.chunks[0].type });
        resolve({ blob, url: URL.createObjectURL(blob), video: this.hasVideo, type: blob.type });
      };
      this.recorder.stop();
    });

    if (this.rec) {
      // Give the recogniser a moment to deliver its last final result.
      await new Promise(resolve => {
        const done = () => resolve();
        this.rec.onend = done;
        try { this.rec.stop(); } catch { done(); }
        setTimeout(done, 1200);
      });
    }

    return {
      elapsed,
      media,
      transcript: (this.finalText + ' ' + this.interim).replace(/\s+/g, ' ').trim(),
      transcriptAvailable: this.wantTranscript && !this.srError,
      srError: this.srError,
      voicedSeconds: this.voicedMs / 1000,
      longestPause: this.longestPauseMs / 1000,
    };
  }

  destroy() {
    this.recording = false;
    clearInterval(this.meter);
    try { this.rec && this.rec.abort(); } catch { /* ignore */ }
    try { this.recorder && this.recorder.state !== 'inactive' && this.recorder.stop(); } catch { /* ignore */ }
    this.stream && this.stream.getTracks().forEach(t => t.stop());
    this.ctx && this.ctx.close().catch(() => {});
  }
}

/* Transcript analysis: word count and filler detection. */
const Analysis = {
  fillerRegex(lang) {
    const list = [...(FILLERS[lang] || FILLERS.en)].sort((a, b) => b.length - a.length);
    const escaped = list.map(f => f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+'));
    return new RegExp(`(?<![\\p{L}\\p{N}])(${escaped.join('|')})(?![\\p{L}\\p{N}])`, 'giu');
  },

  analyze(text, lang) {
    const words = (text.match(/[\p{L}\p{N}'’-]+/gu) || []).length;
    const fillers = {};
    let fillerTotal = 0;
    for (const m of text.matchAll(this.fillerRegex(lang))) {
      const key = m[1].toLowerCase().replace(/\s+/g, ' ');
      fillers[key] = (fillers[key] || 0) + 1;
      fillerTotal++;
    }
    return { words, fillers, fillerTotal };
  },

  highlight(text, lang) {
    return escapeHTML(text).replace(this.fillerRegex(lang), '<mark>$1</mark>');
  },
};

function escapeHTML(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
