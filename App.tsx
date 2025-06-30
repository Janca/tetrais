import React, { useState, useEffect, useCallback, useRef } from 'react';
import './styles.css';

import {
    useGameState,
    useGameControls,
    useGameLoop,
    useGameAudio,
    useGlitchEffect,
} from './hooks';

import {
    SettingsOverlay,
    HighScoreEntryOverlay,
    HighScoresOverlay,
    GameArea,
    PieceSuggestionsPreview,
    ControlsInfo,
    DebugOverlay,
} from './components';
import { calculateDropTime } from './utils';
import { settingsService, soundManager } from './services';
import { MoveRecord, Mino } from './types';

export type ShakeType =
    | 'none'
    | 'low-motion'
    | 'left-1' | 'center-1' | 'right-1'
    | 'left-2' | 'center-2' | 'right-2'
    | 'left-3' | 'center-3' | 'right-3';

export type GameState = 'IDLE' | 'PLAYING' | 'GAME_OVER' | 'CASCADING' | 'HIGH_SCORE_ENTRY' | 'PROCESSING_BOARD';

const App: React.FC = () => {
    // UI State
    const [shakeType, setShakeType] = useState<ShakeType>('none');
    const [isPaused, setIsPaused] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isHighScoresOpen, setIsHighScoresOpen] = useState(false);
    const appContainerRef = useRef<HTMLDivElement>(null);

    const [finalScore, setFinalScore] = useState(0);

    // Persisted Settings State
    const [physicsEnabled] = useState(() => settingsService.getSettings().physicsEnabled);
    const [lowMotionEnabled, setLowMotionEnabled] = useState(() => settingsService.getSettings().lowMotionEnabled);
    const [hapticsEnabled, setHapticsEnabled] = useState(() => settingsService.getSettings().hapticsEnabled);
    const [pieceSuggestionWeights] = useState(() => settingsService.getSettings().pieceSuggestionWeights);

    const handleLowMotionChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const enabled = event.target.checked;
        setLowMotionEnabled(enabled);
        settingsService.updateSetting('lowMotionEnabled', enabled);
    }, []);

    const handleHapticsChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const enabled = event.target.checked;
        setHapticsEnabled(enabled);
        settingsService.updateSetting('hapticsEnabled', enabled);
    }, []);

    // Player Actions Hook
    const triggerShake = useCallback((pieceCenter: number) => {
        if (lowMotionEnabled) {
            setShakeType('low-motion');
            return;
        }

        const shakeVariation = Math.floor(Math.random() * 3) + 1;

        // BOARD_WIDTH is 10.
        // Left third: < 3.5, Center: 3.5-6.5, Right third: > 6.5
        if (pieceCenter < 3.5) {
            setShakeType(`left-${shakeVariation}` as ShakeType);
        } else if (pieceCenter > 6.5) {
            setShakeType(`right-${shakeVariation}` as ShakeType);
        } else {
            setShakeType(`center-${shakeVariation}` as ShakeType);
        }
    }, [lowMotionEnabled]);

    // Game State Hook
    const {
        board, player, pieceSuggestions, score, lines, level, gameState, dropTime,
        gameOverData, recordMove, setDropTime, setGameState, startGame, 
        movePlayer, rotatePlayer, drop, hardDrop,
    } = useGameState({ physicsEnabled, onHardDrop: triggerShake });

    useEffect(() => {
        if (gameState === 'GAME_OVER' || gameState === 'HIGH_SCORE_ENTRY') {
            if (gameOverData?.finalScore) {
                setFinalScore(gameOverData.finalScore);
            }
        }
    }, [gameState, gameOverData]);

    // UI and Audio Hooks
    const {
        musicVolume, effectsVolume, melodyVolume, bassVolume, percussionVolume, padVolume, otherVolume,
        handleUserInteraction,
        handleMusicVolumeChange, handleEffectsVolumeChange,
        handleMelodyVolumeChange, handleBassVolumeChange, handlePercussionVolumeChange, handlePadVolumeChange, handleOtherVolumeChange
    } = useGameAudio(gameState, isPaused, isSettingsOpen, isHighScoresOpen);
    useGlitchEffect(lowMotionEnabled);

    const toggleSettings = () => {
        handleUserInteraction();
        setIsSettingsOpen(prev => !prev);
    };

    const toggleHighScores = ()=> {
        handleUserInteraction();
        setIsHighScoresOpen(prev => !prev);
    };

    const togglePause = useCallback(() => {
        if (gameState === 'PLAYING' || isPaused) { // Allow unpausing
            setIsPaused(prev => !prev);
        }
    }, [gameState, isPaused]);

    const fullStartGame = useCallback(() => {
        handleUserInteraction();
        setIsPaused(false);
        setIsSettingsOpen(false);
        setIsHighScoresOpen(false);
        startGame();
    }, [handleUserInteraction, startGame]);

    const handleRestart = () => {
        fullStartGame();
    };

    // Game Loop Hook
    useGameLoop(drop, dropTime, gameState, isPaused, isSettingsOpen, isHighScoresOpen);

    // Shared drop logic for keyboard and touch
    const resetDropTime = useCallback(() => {
        if (gameState === 'PLAYING') {
            setDropTime(calculateDropTime(lines));
        }
    }, [lines, setDropTime, gameState]);

    const softDropStart = useCallback(() => {
        if (gameState === 'PLAYING' && !isPaused && !isSettingsOpen && !isHighScoresOpen) {
            recordMove('softDrop_start', player);
            setDropTime(50);
        }
    }, [gameState, isPaused, isSettingsOpen, isHighScoresOpen, player, recordMove, setDropTime]);

    const softDropEnd = useCallback(() => {
        if (gameState === 'PLAYING' && !isPaused && !isSettingsOpen && !isHighScoresOpen) {
            recordMove('softDrop_end', player);
            resetDropTime();
        }
    }, [gameState, isPaused, isSettingsOpen, isHighScoresOpen, player, recordMove, resetDropTime]);

    // Auto-adjust drop time and music speed when level changes (lines are updated)
    useEffect(() => {
        const isSoftDropping = dropTime !== null && dropTime <= 50;
        if (gameState === 'PLAYING' && !isPaused && !isSettingsOpen && !isHighScoresOpen) {
            soundManager.updateMusicSpeed(lines);
            if (!isSoftDropping) {
                resetDropTime();
            }
        }
    }, [lines, gameState, isPaused, isSettingsOpen, isHighScoresOpen, dropTime, resetDropTime]);

    // Controls Hooks
    const { handleKeyDown, handleKeyUp } = useGameControls({
        gameState, isPaused, isSettingsOpen, isHighScoresOpen, movePlayer, rotatePlayer,
        hardDrop, togglePause, softDropStart, softDropEnd,
    });

    // Focus & Scroll Management
    useEffect(() => {
        const isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        const isLocked = gameState === 'PLAYING' && !isPaused && !isSettingsOpen && !isHighScoresOpen;

        document.body.style.overflow = (isLocked || isMobile) ? 'hidden' : 'auto';

        if (isLocked) {
            appContainerRef.current?.focus();
        }

        return () => {
            document.body.style.overflow = 'auto';
        }
    }, [gameState, isPaused, isSettingsOpen, isHighScoresOpen]);

    // Shake effect timer
    useEffect(() => {
        if (shakeType !== 'none') {
            const timer = setTimeout(() => setShakeType('none'), 300); // Duration matches CSS
            return () => clearTimeout(timer);
        }
    }, [shakeType]);

    // Attach global event listeners
    useEffect(() => {
        const handleFirstInteraction = () => {
            handleUserInteraction();
            window.removeEventListener('mousedown', handleFirstInteraction);
        };
        window.addEventListener('mousedown', handleFirstInteraction);
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('mousedown', handleFirstInteraction);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [handleKeyDown, handleKeyUp, handleUserInteraction]);

    return (
        <div ref={appContainerRef} className="app-container" tabIndex={-1}>
            {isSettingsOpen && (
                <SettingsOverlay
                    onClose={toggleSettings}
                    musicVolume={musicVolume}
                    onMusicVolumeChange={handleMusicVolumeChange}
                    effectsVolume={effectsVolume}
                    onEffectsVolumeChange={handleEffectsVolumeChange}
                    melodyVolume={melodyVolume}
                    onMelodyVolumeChange={handleMelodyVolumeChange}
                    bassVolume={bassVolume}
                    onBassVolumeChange={handleBassVolumeChange}
                    percussionVolume={percussionVolume}
                    onPercussionVolumeChange={handlePercussionVolumeChange}
                    padVolume={padVolume}
                    onPadVolumeChange={handlePadVolumeChange}
                    otherVolume={otherVolume}
                    onOtherVolumeChange={handleOtherVolumeChange}
                    lowMotionEnabled={lowMotionEnabled}
                    onLowMotionChange={handleLowMotionChange}
                    hapticsEnabled={hapticsEnabled}
                    onHapticsChange={handleHapticsChange}
                />
            )}

            {isHighScoresOpen && <HighScoresOverlay onClose={toggleHighScores} />}

            {gameState === 'HIGH_SCORE_ENTRY' && gameOverData && (
                <HighScoreEntryOverlay
                    score={finalScore}
                    onSubmit={handleHighScoreSubmit}
                />
            )}

            <div className="game-viewport-wrapper glitch-effect">
                <h1 className="app-header chromatic-text-1">MiNOS</h1>
                <div className="game-viewport">
                    <header className="game-header">
                        <div className="game-header-item">
                            <span className="game-header-label">SCORE</span>
                            <span className="game-header-value chromatic-text-2">{score.toString().padStart(7, '0')}</span>
                        </div>
                        <div className="game-header-item align-right">
                            <span className="game-header-label">LINES</span>
                            <span className="game-header-value chromatic-text-2">{lines}</span>
                        </div>
                    </header>
                    <div className="game-body">
                        <GameArea
                            gameState={gameState}
                            isPaused={isPaused}
                            isSettingsOpen={isSettingsOpen}
                            board={board}
                            player={player}
                            score={finalScore}
                            onStart={fullStartGame}
                            onRestart={handleRestart}
                            onUnpause={togglePause}
                            shakeType={shakeType}
                            movePlayer={movePlayer}
                            rotatePlayer={rotatePlayer}
                            hardDrop={hardDrop}
                            softDropStart={softDropStart}
                            softDropEnd={softDropEnd}
                            hapticsEnabled={hapticsEnabled}
                        />
                        <PieceSuggestionsPreview
                            pieces={pieceSuggestions}
                            weights={pieceSuggestionWeights}
                        />
                    </div>
                    <footer className="game-footer">
                        <button className="highscore-button" onClick={toggleHighScores}>[ High Scores ]</button>
                        <button className="pause-button" onClick={togglePause}>[ {isPaused ? 'Resume' : 'Pause'} ]</button>
                        <button className="settings-button" onClick={toggleSettings}>[ Settings ]</button>
                    </footer>
                </div>
            </div>

            <div className="controls-section">
                <ControlsInfo />
            </div>
        </div>
    );
};

export default App;
