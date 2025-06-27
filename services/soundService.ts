// services/soundService.ts

let audioContext: AudioContext | null = null;

/**
 * Initializes the AudioContext. Must be called in response to a user gesture (e.g., a click).
 */
export const initializeAudio = () => {
    if (!audioContext && window.AudioContext) {
        audioContext = new (window.AudioContext)();
    }
};

/**
 * Plays a simple tone with a given frequency and duration.
 * @param frequency The frequency of the tone in Hertz.
 * @param duration The duration of the tone in seconds.
 * @param type The type of waveform to use.
 */
const playTone = (frequency: number, duration: number, type: OscillatorType = 'triangle', volume: number = 0.3) => {
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Set oscillator properties
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

    // Create a simple volume envelope to avoid harsh clicks
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01); // Quick attack
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration); // Decay

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
};

/**
 * Plays a soft, low-pitched sound for when a piece locks naturally or with a soft drop.
 */
export const playLockSound = () => {
    playTone(90, 0.1, 'square', 0.2);
};

/**
 * Plays a louder, more impactful sound for a hard drop lock.
 */
export const playHardLockSound = () => {
    playTone(80, 0.15, 'square', 0.5);
}

/**
 * Plays a higher-pitched sound for clearing a line.
 */
export const playLineClearSound = () => {
    playTone(880, 0.15, 'sawtooth');
    // Add a second, higher harmony note for a more rewarding feel
    if (audioContext) {
      setTimeout(() => playTone(1046.50, 0.1, 'sawtooth'), 50);
    }
};

/**
 * Plays a quick sound for piece rotation.
 */
export const playRotateSound = () => {
    playTone(440, 0.05, 'sine', 0.2);
};

/**
 * Plays a quick, high-pitched sound for horizontal movement.
 */
export const playMoveSound = () => {
    playTone(660, 0.05, 'sine', 0.15);
};


/**
 * Plays a subtle tick sound for each step of a soft drop.
 */
export const playSoftDropSound = () => {
    playTone(150, 0.05, 'square', 0.1);
};

/**
 * Plays a descending arpeggio for game over.
 */
export const playGameOverSound = () => {
    if (!audioContext) return;
    playTone(261.63, 0.2, 'sawtooth', 0.3); // C4
    setTimeout(() => playTone(220.00, 0.2, 'sawtooth', 0.3), 150); // A3
    setTimeout(() => playTone(174.61, 0.2, 'sawtooth', 0.3), 300); // F3
    setTimeout(() => playTone(146.83, 0.4, 'sawtooth', 0.3), 450); // D3
};