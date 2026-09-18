import { CONFIG } from './config.js';
const C = CONFIG.AUDIO;

class AudioManager {
  constructor() {
    this.muted = false;
    try { this.muted = localStorage.getItem(C.MUTE_STORAGE_KEY) === 'true'; } catch {}
    this.context = null;
    this.music = null;
    this.assets = null;
    this.buffers = new Map();
    this.rawSounds = new Map();
    this.voices = new Set();
    this.generation = 0;
    this.lastError = null;
    this.events = {};
    this.onChange = () => {};
  }

  createGraph(position = 0) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext || !this.assets) return false;
    try {
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = this.muted ? 0 : 1;
      this.master.connect(this.context.destination);
      this.musicGain = this.context.createGain();
      this.musicGain.gain.value = C.MUSIC_VOLUME;
      this.musicGain.connect(this.master);
      this.sfxGain = this.context.createGain();
      this.sfxGain.gain.value = C.SFX_VOLUME;
      this.sfxGain.connect(this.master);
      this.music = new Audio(this.assets.music);
      this.music.preload = 'auto';
      this.music.loop = true;
      this.music.setAttribute('playsinline', '');
      this.music.muted = this.muted;
      // GainNode controls music volume on iOS, where media.volume is limited.
      this.musicSource = this.context.createMediaElementSource(this.music);
      this.musicSource.connect(this.musicGain);
      const music = this.music;
      music.addEventListener('loadedmetadata', () => {
        if (position > 0 && Number.isFinite(music.duration)) music.currentTime = position % music.duration;
      }, { once: true });
      music.addEventListener('error', () => {
        if (music === this.music) this.lastError = 'Music unavailable; hold the sound button to retry.';
      });
      this.generation++;
      return true;
    } catch (error) { this.lastError = error.message; return false; }
  }

  async init(assets) {
    this.assets = assets;
    if (!this.createGraph()) return;
    await Promise.all(Object.entries(assets.sfx).map(async ([name, url]) => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Cannot load sound ${name}`);
        this.rawSounds.set(name, await response.arrayBuffer());
      } catch (error) { this.lastError = error.message; }
    }));
    await this.decodeSounds();
    // This may be blocked; normal game gestures call unlock() to recover.
    this.playMusic();
  }

  async decodeSounds() {
    const context = this.context, generation = this.generation;
    if (!context) return;
    await Promise.all([...this.rawSounds].map(async ([name, bytes]) => {
      try {
        const buffer = await context.decodeAudioData(bytes.slice(0));
        if (this.generation === generation) this.buffers.set(name, buffer);
      } catch (error) { if (this.generation === generation) this.lastError = error.message; }
    }));
  }

  unlock() {
    if (this.muted || !this.assets) return;
    if (!this.context || this.context.state === 'closed') { this.reset(); return; }
    // Call both APIs synchronously in the trusted gesture, without awaiting fetches.
    this.playMusic();
  }

  playMusic() {
    if (this.muted || !this.context || !this.music) return;
    const context = this.context, music = this.music, generation = this.generation;
    if (context.state !== 'running') context.resume().catch(error => {
      if (generation === this.generation) this.lastError = error.message;
    });
    if (music.paused) music.play().then(() => {
      if (generation !== this.generation || this.muted) music.pause();
      else this.lastError = null;
    }).catch(error => {
      if (generation === this.generation && error.name !== 'NotAllowedError' && error.name !== 'AbortError') this.lastError = error.message;
    });
  }

  playSfx(name) {
    if (this.muted || !this.context || !this.buffers.has(name)) return;
    try {
      // A pickup can be scheduled while a gesture's resume() is still settling.
      if (this.context.state !== 'running') this.context.resume().catch(() => {});
      if (this.voices.size >= C.MAX_SFX_VOICES) this.stopVoice(this.voices.values().next().value);
      const source = this.context.createBufferSource(), gain = this.context.createGain();
      source.buffer = this.buffers.get(name);
      gain.gain.value = C.SFX_MULTIPLIERS[name] ?? 1;
      source.connect(gain); gain.connect(this.sfxGain);
      const voice = { source, gain };
      this.voices.add(voice);
      source.onended = () => { source.disconnect(); gain.disconnect(); this.voices.delete(voice); };
      source.start();
      this.events[name] = (this.events[name] || 0) + 1;
    } catch (error) { this.lastError = error.message; }
  }

  stopVoice(voice) {
    if (!voice) return;
    try { voice.source.stop(); } catch {}
    voice.source.disconnect(); voice.gain.disconnect(); this.voices.delete(voice);
  }

  setMuted(muted) {
    this.muted = Boolean(muted);
    try { localStorage.setItem(C.MUTE_STORAGE_KEY, String(this.muted)); } catch {}
    if (this.master && this.context && this.context.state !== 'closed') this.master.gain.setValueAtTime(this.muted ? 0 : 1, this.context.currentTime);
    if (this.music) this.music.muted = this.muted;
    if (this.muted) {
      this.music?.pause();
      for (const voice of [...this.voices]) this.stopVoice(voice);
    } else this.unlock();
    this.onChange();
  }

  reset() {
    const position = this.music?.currentTime || 0;
    for (const voice of [...this.voices]) this.stopVoice(voice);
    if (this.music) { this.music.pause(); this.music.removeAttribute('src'); this.music.load(); }
    try { this.musicSource?.disconnect(); this.master?.disconnect(); } catch {}
    if (this.context && this.context.state !== 'closed') this.context.close().catch(() => {});
    this.music = null; this.context = null; this.buffers.clear(); this.lastError = null;
    this.musicSource = null; this.master = null; this.musicGain = null; this.sfxGain = null;
    if (this.createGraph(position)) {
      this.decodeSounds();
      // Recreate and resume during the hold-release gesture, never after an await.
      if (!this.muted) this.playMusic();
    }
    this.onChange();
  }

  snapshot() {
    return { muted: this.muted, contextState: this.context?.state ?? 'unavailable',
      musicTime: this.music?.currentTime ?? 0, musicPaused: this.music?.paused ?? true,
      musicLoop: this.music?.loop ?? false, musicReadyState: this.music?.readyState ?? 0,
      generation: this.generation, loadedSfx: [...this.buffers.keys()], activeVoices: this.voices.size,
      musicVolume: this.musicGain?.gain.value, masterVolume: this.master?.gain.value,
      events: { ...this.events }, lastError: this.lastError };
  }
}

export const audio = new AudioManager();

export function bindSoundControl(button) {
  let pointer = null, pressedAt = 0;
  button.style.setProperty('--hold-duration', `${C.HOLD_TO_RESET_MS}ms`);
  audio.onChange = () => {
    button.dataset.muted = String(audio.muted);
    button.setAttribute('aria-pressed', String(audio.muted));
    button.setAttribute('aria-label', audio.muted ? 'Unmute sound' : 'Mute sound');
  };
  audio.onChange();
  const clear = () => {
    const id = pointer; pointer = null; button.classList.remove('holding');
    if (id !== null && button.hasPointerCapture(id)) button.releasePointerCapture(id);
  };
  button.addEventListener('pointerdown', event => {
    event.preventDefault();
    if (pointer !== null || event.isPrimary === false || (event.pointerType === 'mouse' && event.button !== 0)) return;
    pointer = event.pointerId; pressedAt = performance.now();
    button.setPointerCapture(pointer); button.classList.add('holding');
  });
  button.addEventListener('pointerup', event => {
    event.preventDefault(); if (event.pointerId !== pointer) return;
    const held = performance.now() - pressedAt >= C.HOLD_TO_RESET_MS;
    clear();
    if (held) { audio.reset(); button.animate([{ opacity: .5 }, { opacity: 1 }], { duration: 300 }); }
    else audio.setMuted(!audio.muted);
  });
  for (const name of ['pointercancel', 'lostpointercapture']) button.addEventListener(name, event => {
    if (event.pointerId === pointer) clear();
  });
  // Native keyboard/assistive clicks have detail 0; pointer taps are handled above.
  button.addEventListener('click', event => { event.preventDefault(); if (event.detail === 0) audio.setMuted(!audio.muted); });
  button.addEventListener('contextmenu', event => event.preventDefault());
  window.addEventListener('blur', clear);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clear();
    else audio.unlock();
  });
  for (const name of ['pointerdown', 'pointerup', 'keydown']) document.addEventListener(name, event => {
    if (event.isTrusted && !button.contains(event.target)) audio.unlock();
  }, { capture: true });
}
