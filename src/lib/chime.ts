import { Platform } from 'react-native';

/**
 * Soft single chime for the ritual-completion tap.
 *
 * Web: synthesize an attenuated C5 sine tone via Web Audio API — no asset,
 * no network. Total dwell ~600ms.
 *
 * Native: no-op for now. iOS/Android implementation needs an audio asset
 * (~30KB bundled .m4a) + expo-av or expo-audio; punt until we have the
 * sound design pass with proper royalty-free samples.
 */
export function playRitualChime(): void {
  if (Platform.OS !== 'web') return;

  try {
    const AudioCtor: typeof AudioContext | undefined =
      typeof window !== 'undefined'
        ? // Modern browsers expose AudioContext; older Safari uses webkitAudioContext.
          (window as typeof window & { webkitAudioContext?: typeof AudioContext }).AudioContext ??
          (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        : undefined;
    if (!AudioCtor) return;

    const ctx = new AudioCtor();
    const now = ctx.currentTime;

    // Two-note overlap: C5 + E5 a hair later, both with a soft ADSR. Reads
    // as a "small bowl-strike" rather than a tone.
    const notes = [
      { freq: 523.25, start: 0, duration: 0.6 },   // C5
      { freq: 659.25, start: 0.08, duration: 0.5 }, // E5
    ];

    for (const { freq, start, duration } of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(0.14, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + duration + 0.05);
    }

    // Close the context after the sound completes so we don't leak audio
    // graphs across taps.
    setTimeout(() => {
      ctx.close().catch(() => undefined);
    }, 800);
  } catch {
    // Audio is delight, not load-bearing — swallow all failures.
  }
}
