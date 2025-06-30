class SoundManager {
    private audioContext: AudioContext | null = null;

    // --- Volume Controls ---
    public effectsVolume: number = 1.0;
    public musicVolume: number = 0.5;
    public melodyVolume: number = 1.0;
    public bassVolume: number = 1.0;
    public percussionVolume: number = 0.8;
    public padVolume: number = 1.0;
    public otherVolume: number = 0.7; // For arpeggio and echo

    // --- Music Properties ---
    private musicScheduler: number | null = null;
    private _isMusicPlaying: boolean = false;
    private musicStep: number = 0;
    private nextNoteTime: number = 0.0;
    private musicOscillators: AudioScheduledSourceNode[] = [];
    private readonly lookahead = 0.1; // How far ahead to schedule audio (sec)
    private readonly scheduleAheadTime = 25.0; // How often to call scheduler (ms)

    private currentPlaybackRate: number = 1.0;
    private targetPlaybackRate: number = 1.0;

    private activeLayers: Set<string> = new Set(['melody', 'bassline']);
    private readonly availableLayers = ['percussion', 'arpeggio', 'pad', 'echo'];

    // --- Music Data ---
    private readonly baseNoteDuration = 0.125; // 16th note at 120 bpm
    private readonly melody: (number | null)[] = [
        329.63, null, 329.63, null, 392.00, null, 329.63, null, // E, E, G, E
        293.66, null, 293.66, null, 261.63, null, 293.66, 329.63, // D, D, C, D, E
        329.63, null, 329.63, null, 392.00, null, 329.63, null, // E, E, G, E
        293.66, null, 261.63, null, 220.00, null, 220.00, null, // D, C, A, A
        246.94, null, 246.94, null, 329.63, null, 246.94, null, // B, B, E, B
        261.63, null, 261.63, null, 220.00, null, 261.63, 293.66, // C, C, A, C, D
        293.66, null, 293.66, null, 329.63, null, 293.66, null, // D, D, E, D
        261.63, null, 220.00, null, 196.00, null, 196.00, null, // C, A, G, G
    ];
    private readonly bassline: (number | null)[] = [
        164.81, null, null, null, null, null, null, null, // E3
        146.83, null, null, null, null, null, null, null, // D3
        130.81, null, null, null, null, null, null, null, // C3
        110.00, null, null, null, null, null, null, null, // A2
        123.47, null, null, null, null, null, null, null, // B2
        130.81, null, null, null, null, null, null, null, // C3
        146.83, null, null, null, null, null, null, null, // D3
        98.00,  null, null, null, null, null, null, null, // G2
    ];
    private readonly arpeggio: (number | null)[];
    private readonly pad: (number | null)[];
    private readonly echo: (number | null)[];

    // New modular percussion system
    private readonly percPatterns: (number | null)[][];
    private percussionSequence: (number | null)[] = [];


    constructor() {
        const n = null;
        // Arpeggio (fast, high-pitched notes following chords)
        this.arpeggio = [
            659, n, 784, n, 988, n, 784, n, 659, n, 784, n, 988, n, 784, n,
            587, n, 740, n, 880, n, 740, n, 587, n, 740, n, 880, n, 740, n,
            523, n, 659, n, 784, n, 659, n, 523, n, 659, n, 784, n, 659, n,
            440, n, 523, n, 659, n, 523, n, 440, n, 523, n, 659, n, 523, n,
        ].flat();

        // Pad (long, sustained chord root notes)
        this.pad = [
            164.81, n,n,n, n,n,n,n, 146.83, n,n,n, n,n,n,n,
            130.81, n,n,n, n,n,n,n, 110.00,  n,n,n, n,n,n,n,
            123.47, n,n,n, n,n,n,n, 130.81, n,n,n, n,n,n,n,
            146.83, n,n,n, n,n,n,n, 98.00,   n,n,n, n,n,n,n,
        ];
        
        // Percussion patterns (1: kick, 2: hi-hat, 3: snare)
        const k = 1, h = 2, s = 3;
        this.percPatterns = [
            [k, n, h, n, s, n, h, n],    // Basic backbeat
            [k, n, h, h, s, n, h, n],    // Busy hat
            [k, n, h, n, s, n, k, n],    // Off-beat kick
            [k, n, n, n, s, n, n, n],    // Simple
            [k, k, h, n, s, n, h, n],    // Double kick
            [k, h, h, h, s, h, h, h],    // All hats
            [k, n, h, n, s, s, h, n],    // Double snare
            [k, k, h, k, s, n, h, n],    // Funky kick
        ];

        // Echo (sparse, delayed melody)
        this.echo = [n,n,n,n, ...this.melody.slice(0, -4)].map((note, i) => i % 8 === 4 ? note : n);
    }

    public initialize = () => {
        if (this.audioContext === null) {
            try {
                this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            } catch (e) {
                console.error("Web Audio API is not supported in this browser.");
            }
        }
        if (this.audioContext?.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    private playSound(frequency: number, duration: number, type: OscillatorType, volume: number, startTime: number): OscillatorNode | null {
        if (!this.audioContext || this.audioContext.state !== 'running' || volume <= 0) return null;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, startTime);
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
        return oscillator;
    }
    
    private playTone = (frequency: number, duration: number, type: OscillatorType = 'triangle', volume: number = 0.3) => {
        if (!this.audioContext) return;
        const finalVolume = volume * this.effectsVolume;
        this.playSound(frequency, duration, type, finalVolume, this.audioContext.currentTime);
    }
    
    private playNote(frequency: number, startTime: number, duration: number, type: OscillatorType, volume: number) {
        const osc = this.playSound(frequency, duration, type, volume, startTime);
        if (osc) {
            this.musicOscillators.push(osc);
            osc.onended = () => {
                this.musicOscillators = this.musicOscillators.filter(o => o !== osc);
            };
        }
    }

    private playSnareSound(time: number) {
        if (!this.audioContext) return;
        const finalVolume = 0.3 * this.percussionVolume * this.musicVolume;
        if (finalVolume <= 0) return;
        
        const noiseSource = this.audioContext.createBufferSource();
        const bufferSize = this.audioContext.sampleRate * 0.2; // 0.2 seconds is enough
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1; // white noise
        }
        noiseSource.buffer = buffer;

        const noiseFilter = this.audioContext.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = 1800;
        noiseFilter.Q.value = 1.2;

        const noiseEnvelope = this.audioContext.createGain();
        noiseSource.connect(noiseFilter);
        noiseFilter.connect(noiseEnvelope);
        noiseEnvelope.connect(this.audioContext.destination);

        noiseEnvelope.gain.setValueAtTime(0, time);
        noiseEnvelope.gain.linearRampToValueAtTime(finalVolume, time + 0.01);
        noiseEnvelope.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

        noiseSource.start(time);
        noiseSource.stop(time + 0.18);
        this.musicOscillators.push(noiseSource);
    }
    
    private playPercussion(type: number, time: number) {
        if (!this.audioContext) return;
        const finalPercVolume = this.percussionVolume * this.musicVolume;
        if (finalPercVolume <= 0) return;

        if (type === 1) { // Kick
            this.playNote(60, time, 0.1, 'square', 0.45 * finalPercVolume);
        } else if (type === 2) { // Hi-hat
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            const hpf = this.audioContext.createBiquadFilter();

            hpf.type = 'highpass';
            hpf.frequency.value = 7000;

            osc.type = 'sawtooth';
            osc.connect(hpf);
            hpf.connect(gain);
            gain.connect(this.audioContext.destination);

            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.1 * finalPercVolume, time + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.08);

            osc.start(time);
            osc.stop(time + 0.08);
            this.musicOscillators.push(osc);
        } else if (type === 3) { // Snare
            this.playSnareSound(time);
        }
    }

    private playPadNote(freq: number, time: number) {
        const finalVolume = 0.08 * this.padVolume * this.musicVolume;
        const noteDuration = this.baseNoteDuration / this.currentPlaybackRate;
        this.playNote(freq, time, noteDuration * 7.5, 'sawtooth', finalVolume);
    }

    private updateActiveLayers() {
        if (this.musicStep !== 0) return;

        this.availableLayers.forEach(layer => {
            const isActive = this.activeLayers.has(layer);
            const chanceToToggle = isActive ? 0.5 : 0.33; 
            
            if (Math.random() < chanceToToggle) {
                if (isActive) {
                    this.activeLayers.delete(layer);
                } else {
                    if ((this.activeLayers.size - 2) < 2) { 
                        this.activeLayers.add(layer);
                    }
                }
            }
        });
    }

    private scheduler = () => {
        if (!this.audioContext) return;
        
        while (this.nextNoteTime < this.audioContext.currentTime + this.lookahead) {
            if(this.musicStep === 0) {
                this.updateActiveLayers();
                this.currentPlaybackRate = this.targetPlaybackRate;
            }

            const noteDuration = this.baseNoteDuration / this.currentPlaybackRate;
            const time = this.nextNoteTime;
            const step = this.musicStep;

            const melodyNote = this.melody[step];
            if (melodyNote) this.playNote(melodyNote, time, noteDuration * 0.95, 'triangle', 0.15 * this.melodyVolume * this.musicVolume);
            
            const bassNote = this.bassline[step];
            if (bassNote) this.playNote(bassNote, time, noteDuration * 1.5, 'sine', 0.25 * this.bassVolume * this.musicVolume);

            if (this.activeLayers.has('percussion')) {
                const percNote = this.percussionSequence[step];
                if (percNote) this.playPercussion(percNote, time);
            }
            if (this.activeLayers.has('arpeggio')) {
                const arpNote = this.arpeggio[step % this.arpeggio.length];
                if (arpNote) this.playNote(arpNote, time, noteDuration * 0.8, 'sine', 0.1 * this.otherVolume * this.musicVolume);
            }
            if (this.activeLayers.has('pad')) {
                const padNote = this.pad[step];
                if (padNote) this.playPadNote(padNote, time);
            }
            if (this.activeLayers.has('echo')) {
                const echoNote = this.echo[step];
                if (echoNote) this.playNote(echoNote, time, noteDuration * 4, 'sine', 0.12 * this.otherVolume * this.musicVolume);
            }

            this.nextNoteTime += noteDuration;
            this.musicStep = (this.musicStep + 1) % this.melody.length;
        }
    }

    private generatePercussionSequence() {
        const sequence: (number | null)[] = [];
        // A full music loop is 64 steps, which is 8 sections of 8 steps each.
        for (let i = 0; i < 8; i++) {
            const patternIndex = Math.floor(Math.random() * this.percPatterns.length);
            sequence.push(...this.percPatterns[patternIndex]);
        }
        this.percussionSequence = sequence;
    }

    public updateMusicSpeed(linesCleared: number): void {
        const firstPhaseLines = Math.min(linesCleared, 5);
        const secondPhaseLines = Math.max(0, linesCleared - 5);
        const speedMultiplier = Math.pow(1.01, firstPhaseLines) * Math.pow(1.0125, secondPhaseLines);
        this.targetPlaybackRate = Math.min(1.5, speedMultiplier);
    }

    public isMusicPlaying = (): boolean => {
        return this._isMusicPlaying;
    }

    public startMusic = () => {
        if (this._isMusicPlaying) return;
        this.initialize();
        if (!this.audioContext || this.audioContext.state !== 'running') return;

        this.generatePercussionSequence(); // Generate a new random beat for this session

        this.activeLayers = new Set(['melody', 'bassline']);
        this._isMusicPlaying = true;
        this.musicStep = 0;
        this.nextNoteTime = this.audioContext.currentTime;
        this.musicScheduler = window.setInterval(this.scheduler, this.scheduleAheadTime);
    }
    
    public stopMusic = () => {
        if (!this._isMusicPlaying) return;
        this._isMusicPlaying = false;
        
        if (this.musicScheduler) {
            window.clearInterval(this.musicScheduler);
            this.musicScheduler = null;
        }
        
        this.musicOscillators.forEach(osc => {
            try {
                osc.stop(0);
            } catch (e) { /* Ignore errors from stopping already stopped nodes */ }
        });
        this.musicOscillators = [];
        this.activeLayers.clear();
    }

    public playLockSound = () => this.playTone(90, 0.1, 'square', 0.2);
    public playHardLockSound = () => this.playTone(80, 0.15, 'square', 0.5);
    public playLineClearSound = () => {
        this.playTone(880, 0.15, 'sawtooth');
        if (this.audioContext) {
            window.setTimeout(() => this.playTone(1046.50, 0.1, 'sawtooth'), 50);
        }
    };
    public playRotateSound = () => this.playTone(440, 0.05, 'sine', 0.2);
    public playMoveSound = () => this.playTone(660, 0.05, 'sine', 0.15);
    public playSoftDropSound = () => this.playTone(150, 0.05, 'square', 0.1);
    public playCascadeSound = () => this.playTone(120, 0.05, 'square', 0.15);
    public playGameOverSound = (stopMusicFirst: boolean = true) => {
        if (stopMusicFirst) {
            this.stopMusic();
        }
        this.playTone(261.63, 0.2, 'sawtooth', 0.3); // C4
        window.setTimeout(() => this.playTone(220.00, 0.2, 'sawtooth', 0.3), 150); // A3
        window.setTimeout(() => this.playTone(174.61, 0.2, 'sawtooth', 0.3), 300); // F3
        window.setTimeout(() => this.playTone(146.83, 0.4, 'sawtooth', 0.3), 450); // D3
    };
}

export const soundManager = new SoundManager();