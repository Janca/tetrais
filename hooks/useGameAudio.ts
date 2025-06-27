
import { useState, useEffect, useCallback, useRef } from 'react';
import { soundManager } from '../services/SoundManager';
import { settingsService } from '../services/settingsService';

export const useGameAudio = (
    gameState: 'IDLE' | 'PLAYING' | 'GAME_OVER',
    isPaused: boolean,
    isSettingsOpen: boolean
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

        const canPlayMusic = gameState === 'PLAYING' || gameState === 'IDLE';
        const shouldPlayMusic = (canPlayMusic && !isPaused) || (isSettingsOpen && canPlayMusic);

        if (shouldPlayMusic) {
            soundManager.startMusic();
        } else {
            soundManager.stopMusic();
        }
    }, [userInteracted, gameState, isPaused, isSettingsOpen]);

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
