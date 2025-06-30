/**
 * @file useGameAudio.ts
 * @description
 * This hook manages all audio-related logic for the game. It is responsible for
 * initializing the sound manager, handling volume changes, and controlling the
 * background music based on the game state.
 *
 * Why it exists:
 * - To centralize all audio logic in one place, making it easier to manage and
 *   debug.
 * - To separate audio concerns from the main game logic and UI components.
 *
 * How it works:
 * - It uses the `soundManager` service to play and stop sounds and music.
 * - It initializes the sound manager with the user's saved volume settings.
 * - It provides callback functions to handle volume changes from the UI.
 * - A `useEffect` hook monitors the game state and other UI flags (e.g., `isPaused`,
 *   `isSettingsOpen`) to determine whether the background music should be playing.
 * - To prevent the music from restarting unnecessarily (e.g., when a piece is
 *   locked), the hook checks if the music is already playing before starting it.
 *   It also allows music to continue playing during the `PROCESSING_BOARD` state.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { soundManager, settingsService } from '@services';
import { GameState } from '@/App';

export const useGameAudio = (
    gameState: GameState,
    isPaused: boolean,
    isSettingsOpen: boolean,
    isHighScoresOpen: boolean
) => {
    const [initialSettings] = useState(() => {
        const settings = settingsService.getSettings();
        // Initialize the sound manager with the loaded settings
        soundManager.musicVolume = settings.musicVolume;
        soundManager.effectsVolume = settings.effectsVolume;
        soundManager.melodyVolume = settings.melodyVolume;
        soundManager.bassVolume = settings.bassVolume;
        soundManager.percussionVolume = settings.percussionVolume;
        soundManager.padVolume = settings.padVolume;
        soundManager.otherVolume = settings.otherVolume;
        return settings;
    });

    const [musicVolume, setMusicVolume] = useState(initialSettings.musicVolume);
    const [effectsVolume, setEffectsVolume] = useState(initialSettings.effectsVolume);
    const [melodyVolume, setMelodyVolume] = useState(initialSettings.melodyVolume);
    const [bassVolume, setBassVolume] = useState(initialSettings.bassVolume);
    const [percussionVolume, setPercussionVolume] = useState(initialSettings.percussionVolume);
    const [padVolume, setPadVolume] = useState(initialSettings.padVolume);
    const [otherVolume, setOtherVolume] = useState(initialSettings.otherVolume);
    
    const [userInteracted, setUserInteracted] = useState(false);
    const effectsVolumeChangeTimeout = useRef<number | null>(null);

    const handleUserInteraction = useCallback(() => {
        if (userInteracted) return;
        soundManager.initialize();
        setUserInteracted(true);
    }, [userInteracted]);

    const handleMusicVolumeChange = useCallback((value: number) => {
        const clampedValue = Math.max(0, Math.min(1, value));
        soundManager.musicVolume = clampedValue;
        settingsService.updateSetting('musicVolume', clampedValue);
        setMusicVolume(clampedValue);
    }, []);
    
    const handleEffectsVolumeChange = useCallback((value: number) => {
        const clampedValue = Math.max(0, Math.min(1, value));
        soundManager.effectsVolume = clampedValue;
        settingsService.updateSetting('effectsVolume', clampedValue);
        setEffectsVolume(clampedValue);

        if (effectsVolumeChangeTimeout.current) {
            clearTimeout(effectsVolumeChangeTimeout.current);
        }

        effectsVolumeChangeTimeout.current = window.setTimeout(() => {
            soundManager.playGameOverSound(false);
        }, 300);
    }, []);

    const handleMelodyVolumeChange = useCallback((value: number) => {
        const clamped = Math.max(0, Math.min(1, value));
        soundManager.melodyVolume = clamped;
        settingsService.updateSetting('melodyVolume', clamped);
        setMelodyVolume(clamped);
    }, []);

    const handleBassVolumeChange = useCallback((value: number) => {
        const clamped = Math.max(0, Math.min(1, value));
        soundManager.bassVolume = clamped;
        settingsService.updateSetting('bassVolume', clamped);
        setBassVolume(clamped);
    }, []);

    const handlePercussionVolumeChange = useCallback((value: number) => {
        const clamped = Math.max(0, Math.min(1, value));
        soundManager.percussionVolume = clamped;
        settingsService.updateSetting('percussionVolume', clamped);
        setPercussionVolume(clamped);
    }, []);

    const handlePadVolumeChange = useCallback((value: number) => {
        const clamped = Math.max(0, Math.min(1, value));
        soundManager.padVolume = clamped;
        settingsService.updateSetting('padVolume', clamped);
        setPadVolume(clamped);
    }, []);

    const handleOtherVolumeChange = useCallback((value: number) => {
        const clamped = Math.max(0, Math.min(1, value));
        soundManager.otherVolume = clamped;
        settingsService.updateSetting('otherVolume', clamped);
        setOtherVolume(clamped);
    }, []);


    // Manage background music
    useEffect(() => {
        if (!userInteracted) return;

        const canPlayMusic = gameState === 'PLAYING' || gameState === 'IDLE' || gameState === 'CASCADING' || gameState === 'PROCESSING_BOARD';
        const shouldPlayMusic = (canPlayMusic && !isPaused) || ((isSettingsOpen || isHighScoresOpen) && canPlayMusic);

        if (shouldPlayMusic) {
            if (!soundManager.isMusicPlaying()) {
                soundManager.startMusic();
            }
        } else {
            soundManager.stopMusic();
        }
    }, [userInteracted, gameState, isPaused, isSettingsOpen, isHighScoresOpen]);

    // Cleanup timers and music on unmount
    useEffect(() => {
        return () => {
            if (effectsVolumeChangeTimeout.current) {
                clearTimeout(effectsVolumeChangeTimeout.current);
            }
            soundManager.stopMusic();
        };
    }, []);
    
    return {
        musicVolume,
        effectsVolume,
        melodyVolume,
        bassVolume,
        percussionVolume,
        padVolume,
        otherVolume,
        handleUserInteraction,
        handleMusicVolumeChange,
        handleEffectsVolumeChange,
        handleMelodyVolumeChange,
        handleBassVolumeChange,
        handlePercussionVolumeChange,
        handlePadVolumeChange,
        handleOtherVolumeChange,
    };
};