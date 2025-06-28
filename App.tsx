import React, { useState, useEffect, useCallback, useRef } from 'react';
import './styles.css';

import { useGameState } from './hooks/useGameState';
import { usePlayerActions } from './hooks/usePlayerActions';
import { useGameControls } from './hooks/useGameControls';
import { useGameLoop } from './hooks/useGameLoop';
import { useGameAudio } from './hooks/useGameAudio';
import { useGlitchEffect } from './hooks/useGlitchEffect';
import { useTouchControls } from './hooks/useTouchControls';

import { SettingsOverlay } from './components/overlays/SettingsOverlay/SettingsOverlay';
import { HighScoreEntryOverlay } from './components/overlays/HighScoreEntryOverlay/HighScoreEntryOverlay';
import { HighScoresOverlay } from './components/overlays/HighScoresOverlay/HighScoresOverlay';
import { GameArea } from './components/game/GameArea/GameArea';
import { PieceSuggestionsPreview } from './components/info/PieceSuggestionsPreview/PieceSuggestionsPreview';
import { ControlsInfo } from './components/info/ControlsInfo/ControlsInfo';
import { calculateDropTime } from './utils/gameHelpers';
import { settingsService } from './services/settingsService';
import { soundManager } from './services/SoundManager';
import { MoveRecord, Mino } from './types';

export type ShakeType = 'none' | 'left' | 'center' | 'right' | 'low-motion';
export type GameState = 'IDLE' | 'PLAYING' | 'GAME_OVER' | 'CASCADING' | 'HIGH_SCORE_ENTRY';

const App: React.FC = () => {
    // UI State
    const [shakeType, setShakeType] = useState<ShakeType>('none');
    const [isPaused, setIsPaused] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isHighScoresOpen, setIsHighScoresOpen] = useState(false);
    const gameContainerRef = useRef<HTMLDivElement>(null);

    // Persisted Settings State
    const [pieceSuggestionWeights] = useState(() => settingsService.getSettings().pieceSuggestionWeights);
    const [physicsEnabled] = useState(() => settingsService.getSettings().physicsEnabled);
    const [lowMotionEnabled, setLowMotionEnabled] = useState(() => settingsService.getSettings().lowMotionEnabled);

    const handleLowMotionChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const enabled = event.target.checked;
        setLowMotionEnabled(enabled);
        settingsService.updateSetting('lowMotionEnabled', enabled);
    }, []);

    // Game State Hook
    const {
        board, player, pieceSuggestions, score, lines, level, gameState, dropTime,
        gameOverData, recordMove,
        setDropTime, startGame, updatePlayerPos, setPlayer, setGameState
    } = useGameState({ physicsEnabled });

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

    const toggleHighScores = () => {
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

    const handleDebugDump = useCallback(() => {
        if (!gameOverData) {
            console.warn("No game over data to dump.");
            return;
        }

        const cleanedHistory = gameOverData.moveHistory.map((move: MoveRecord) => ({
            ...move,
            player: {
                pos: move.player.pos,
                minoKey: move.player.mino.key,
                collided: move.player.collided,
            }
        }));

        const cleanedCollidingPlayer = {
            pos: gameOverData.collidingPlayer.pos,
            minoKey: gameOverData.collidingPlayer.mino.key,
            collided: gameOverData.collidingPlayer.collided,
        };

        const cleanedSuggestions = gameOverData.finalSuggestions.map((p: Mino) => p.key);

        const debugData = {
            ...gameOverData,
            collidingPlayer: cleanedCollidingPlayer,
            moveHistory: cleanedHistory,
            finalSuggestions: cleanedSuggestions,
        };

        const jsonString = JSON.stringify(debugData, null, 2);
        
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `MinoAIs-debug-dump-${new Date().toISOString().replace(/:/g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [gameOverData]);

    const handleHighScoreSubmit = useCallback((name: string) => {
        if (gameOverData && gameOverData.finalScore !== undefined) {
            settingsService.addHighScore(name, gameOverData.finalScore, gameOverData.finalLines);
            setGameState('GAME_OVER');
        }
    }, [gameOverData, setGameState]);

    const handleRestart = (event: React.MouseEvent<HTMLButtonElement>) => {
        if (event.shiftKey) {
            handleDebugDump();
        }
        fullStartGame();
    };

    // Player Actions Hook
    const triggerShake = useCallback((pieceCenter: number) => {
        if (lowMotionEnabled) {
            setShakeType('low-motion');
            return;
        }
        // BOARD_WIDTH is 10.
        // Left third: < 3.5, Center: 3.5-6.5, Right third: > 6.5
        if (pieceCenter < 3.5) {
            setShakeType('left');
        } else if (pieceCenter > 6.5) {
            setShakeType('right');
        } else {
            setShakeType('center');
        }
    }, [lowMotionEnabled]);
    
    const { movePlayer, rotatePlayer, drop, hardDrop } = usePlayerActions({
        player, board, updatePlayerPos, setPlayer, gameState, isPaused, isSettingsOpen, isHighScoresOpen, dropTime,
        onHardDrop: triggerShake,
        recordMove,
    });
    
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

    useTouchControls({
        targetRef: gameContainerRef,
        enabled: gameState === 'PLAYING' && !isPaused && !isSettingsOpen && !isHighScoresOpen,
        movePlayer,
        rotatePlayer,
        hardDrop,
        softDropStart,
        softDropEnd,
    });

    // Focus & Scroll Management
    useEffect(() => {
        const isLocked = gameState === 'PLAYING' && !isPaused && !isSettingsOpen && !isHighScoresOpen;
        document.body.style.overflow = isLocked ? 'hidden' : 'auto';

        if (isLocked) {
            gameContainerRef.current?.focus();
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
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [handleKeyDown, handleKeyUp]);

    return (
        <div ref={gameContainerRef} className="app-container" tabIndex={-1}>
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
                />
            )}

            {isHighScoresOpen && <HighScoresOverlay onClose={toggleHighScores} />}
            
            {gameState === 'HIGH_SCORE_ENTRY' && gameOverData && (
                <HighScoreEntryOverlay
                    score={gameOverData.finalScore}
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
                            score={gameOverData?.finalScore ?? score}
                            onStart={fullStartGame}
                            onRestart={handleRestart}
                            shakeType={shakeType}
                        />
                        <PieceSuggestionsPreview
                            pieces={pieceSuggestions}
                            weights={pieceSuggestionWeights}
                        />
                    </div>
                     <footer className="game-footer">
                        <button className="highscore-button" onClick={toggleHighScores}>[ High Scores ]</button>
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
