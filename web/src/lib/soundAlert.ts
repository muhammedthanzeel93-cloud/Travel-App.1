/**
 * Web Audio API Alert Chime Utility
 * Synthesizes subtle audio chimes without relying on external mp3 assets
 */
export function playChime(type: 'success' | 'warning' = 'success', enabled: boolean = true): void {
  if (!enabled || typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const audioCtx = new AudioCtx();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    const freq = type === 'success' ? 880 : 440;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      type === 'success' ? 1760 : 660,
      audioCtx.currentTime + 0.15
    );

    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.25);
  } catch {
    // Audio context may be restricted before user gesture
  }
}
