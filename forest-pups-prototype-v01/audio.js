// One persistent manager per app. No per-level music instances or scheduler timers.
export const AUDIO_CONFIG = Object.freeze({
  MUSIC_URL: "./assets/forest-exploration.mp3",
  MUSIC_VOLUME: 0.28,
  SFX_VOLUME: 0.9,
  MUSIC_GAIN_TRIM: 0.2, // mastered recording versus quiet synthesized cues
  LOOP_CROSSFADE_SECONDS: 3,
});

// Tail blends into the opening; native buffer looping then has a continuous seam.
// Trim only near-silent margins, retaining the music's phrasing.
export function prepareLoop(
  context,
  decoded,
  fadeSeconds = AUDIO_CONFIG.LOOP_CROSSFADE_SECONDS,
) {
  const rate = decoded.sampleRate,
    channels = decoded.numberOfChannels;
  const data = Array.from({ length: channels }, (_, i) =>
    decoded.getChannelData(i),
  );
  const block = Math.floor(rate * 0.02);
  const audible = (offset) => {
    let peak = 0;
    for (const channel of data)
      for (let j = offset; j < Math.min(offset + block, decoded.length); j++)
        peak = Math.max(peak, Math.abs(channel[j]));
    return peak > 0.001;
  };
  let first = 0,
    last = decoded.length;
  while (first + block < last && !audible(first)) first += block;
  while (last - block > first && !audible(last - block)) last -= block;
  const fade = Math.min(
    Math.floor(rate * fadeSeconds),
    Math.floor((last - first) / 4),
  );
  const length = last - first - fade;
  const loop = context.createBuffer(channels, length, rate);
  for (let ch = 0; ch < channels; ch++) {
    const input = data[ch],
      out = loop.getChannelData(ch);
    out.set(input.subarray(first + fade, last));
    for (let i = 0; i < fade; i++) {
      const t = i / fade;
      // Complementary gains avoid boosting a correlated boundary.
      out[length - fade + i] =
        input[last - fade + i] * (1 - t) + input[first + i] * t;
    }
  }
  return loop;
}

export function createAudioManager({
  log = () => {},
  storageKey = "forest-pups-audio",
} = {}) {
  let context = null,
    musicBus,
    sfxBus,
    buffer = null,
    loading = null,
    bytes = null;
  let music = null,
    offset = 0,
    startedAt = 0,
    starts = 0,
    unlocked = false,
    hidden = document.hidden;
  let muted = false,
    musicVolume = AUDIO_CONFIG.MUSIC_VOLUME,
    sfxVolume = AUDIO_CONFIG.SFX_VOLUME;
  let error = null,
    generation = 0;
  const voices = new Set();
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
    if (saved) {
      muted = !!saved.muted;
      musicVolume = valid(saved.musicVolume, musicVolume);
      sfxVolume = valid(saved.sfxVolume, sfxVolume);
    }
  } catch {}
  function valid(v, fallback) {
    return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : fallback;
  }
  function save() {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ muted, musicVolume, sfxVolume }),
      );
    } catch {}
  }
  function gains() {
    if (!context) return;
    musicBus.gain.setTargetAtTime(
      musicVolume * AUDIO_CONFIG.MUSIC_GAIN_TRIM,
      context.currentTime,
      0.025,
    );
    sfxBus.gain.setTargetAtTime(sfxVolume, context.currentTime, 0.015);
  }
  function position() {
    return buffer
      ? (offset + (music ? context.currentTime - startedAt : 0)) %
          buffer.duration
      : 0;
  }
  function pauseMusic() {
    if (!music) return;
    offset = position();
    music.stop();
    music.disconnect();
    music = null;
  }
  function startMusic() {
    if (
      music ||
      !buffer ||
      !unlocked ||
      muted ||
      hidden ||
      context?.state !== "running"
    )
      return;
    music = context.createBufferSource();
    music.buffer = buffer;
    music.loop = true;
    music.connect(musicBus);
    startedAt = context.currentTime;
    music.start(0, offset);
    starts++;
  }
  function fetchBytes() {
    if (!bytes)
      bytes = fetch(AUDIO_CONFIG.MUSIC_URL)
        .then((r) => {
          if (!r.ok) throw Error("Music HTTP " + r.status);
          return r.arrayBuffer();
        })
        .catch((e) => {
          bytes = null;
          throw e;
        });
    return bytes;
  }
  // Download can begin before touch; playback/context creation cannot.
  fetchBytes().catch((e) => {
    error = e.message;
    log("music_load_failed");
  });
  function load() {
    if (buffer) return Promise.resolve();
    if (!loading)
      loading = fetchBytes()
        .then((b) => context.decodeAudioData(b.slice(0)))
        .then((decoded) => {
          buffer = prepareLoop(context, decoded);
          error = null;
          log("music_loaded", { duration: buffer.duration });
          startMusic();
        })
        .catch((e) => {
          error = e.message;
          log("music_load_failed");
        })
        .finally(() => {
          loading = null;
        });
    return loading;
  }
  function unlock() {
    try {
      if (!context) {
        context = new (window.AudioContext || window.webkitAudioContext)();
        musicBus = context.createGain();
        sfxBus = context.createGain();
        musicBus.connect(context.destination);
        sfxBus.connect(context.destination);
        gains();
        context.onstatechange = () => {
          if (context.state !== "running") pauseMusic();
          else startMusic();
        };
      }
      unlocked = true;
      if (navigator.audioSession) navigator.audioSession.type = "playback";
      const resumed = context.resume();
      load();
      resumed.then(startMusic).catch(() => log("audio_resume_failed"));
    } catch (e) {
      error = e.message;
      log("audio_unavailable");
    }
  }
  function stopSfx() {
    generation++;
    for (const voice of voices) {
      try {
        voice.stop();
      } catch {}
    }
    voices.clear();
  }
  function sound(kind) {
    if (!context || muted || hidden) return;
    const gen = generation;
    const play = () => {
      if (gen !== generation || muted || hidden || context.state !== "running")
        return;
      const notes = {
        pickup: [392],
        match: [523, 659],
        return: [294],
        complete: [523, 659, 784],
        portal: [392, 523, 659],
        friend: [523, 659, 784, 659],
      }[kind] || [440];
      notes.forEach((freq, i) => {
        const o = context.createOscillator(),
          g = context.createGain(),
          t = context.currentTime + i * 0.1;
        o.type = "sine";
        o.frequency.setValueAtTime(freq, t);
        o.frequency.exponentialRampToValueAtTime(freq * 0.94, t + 0.16);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(
          kind === "return" ? 0.025 : 0.055,
          t + 0.015,
        );
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
        o.connect(g);
        g.connect(sfxBus);
        voices.add(o);
        o.onended = () => {
          voices.delete(o);
          o.disconnect();
          g.disconnect();
        };
        o.start(t);
        o.stop(t + 0.26);
      });
    };
    if (context.state === "running") play();
    else
      context
        .resume()
        .then(play)
        .catch(() => log("audio_resume_failed"));
  }
  function setMuted(value) {
    muted = value;
    save();
    if (muted) {
      stopSfx();
      pauseMusic();
    } else {
      startMusic();
    }
  }
  function setBackground(value) {
    hidden = value;
    if (hidden) {
      stopSfx();
      pauseMusic();
      context?.suspend().catch(() => {});
    } else if (unlocked && !muted)
      context
        ?.resume()
        .then(startMusic)
        .catch(() => log("audio_resume_required"));
  }
  document.addEventListener("visibilitychange", () =>
    setBackground(document.hidden),
  );
  window.addEventListener("pagehide", () => setBackground(true));
  window.addEventListener("pageshow", () => setBackground(document.hidden));
  return {
    unlock,
    sound,
    stopSfx,
    setMuted,
    setVolumes(m, s) {
      musicVolume = valid(m, musicVolume);
      sfxVolume = valid(s, sfxVolume);
      gains();
      save();
    },
    get status() {
      return {
        state: context?.state || "not-started",
        muted,
        musicLoaded: !!buffer,
        musicPlaying:
          !!music && context?.state === "running" && !hidden && !muted,
        musicPosition: position(),
        musicDuration: buffer?.duration || 0,
        musicStarts: starts,
        musicVolume,
        sfxVolume,
        activeSounds: voices.size,
        error,
      };
    },
  };
}
