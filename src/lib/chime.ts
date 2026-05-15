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

    // Shared lowpass filter softens the sine harmonics so the bowl reads
    // as warm wood, not test tone. 2200Hz cutoff with mild Q.
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2200;
    filter.Q.value = 0.7;
    filter.connect(ctx.destination);

    // Three-note chord (C5 + E5 + G5) with small detunes for chorus, each
    // entering on a slight stagger. Slow 80ms attack avoids the click the
    // previous 20ms ramp produced; exponential release gives the wood-bowl
    // tail.
    const notes = [
      { freq: 523.25, start: 0.00, peak: 0.16, duration: 0.85 }, // C5
      { freq: 659.25, start: 0.05, peak: 0.12, duration: 0.75 }, // E5
      { freq: 783.99, start: 0.10, peak: 0.08, duration: 0.65 }, // G5
    ];

    for (const { freq, start, peak, duration } of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      // Tiny detune (±4 cents) so the three notes shimmer rather than beat.
      osc.detune.value = (Math.random() - 0.5) * 8;
      osc.frequency.value = freq;
      // Start at literal zero so there's no DC step — eliminates the click.
      gain.gain.setValueAtTime(0, now + start);
      // 80ms soft attack.
      gain.gain.linearRampToValueAtTime(peak, now + start + 0.08);
      // Hold 60ms then exponential decay over the rest of the note.
      gain.gain.setValueAtTime(peak, now + start + 0.14);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);
      osc.connect(gain);
      gain.connect(filter);
      osc.start(now + start);
      osc.stop(now + start + duration + 0.06);
    }

    // Close the context after the sound completes so we don't leak audio
    // graphs across taps.
    setTimeout(() => {
      ctx.close().catch(() => undefined);
    }, 1100);
  } catch {
    // Audio is delight, not load-bearing — swallow all failures.
  }
}
