


import React, { useState, useEffect, useCallback, useRef } from 'react';

import { useGameState } from './hooks/useGameState';
import { usePlayerActions } from './hooks/usePlayerActions';
import { useGameControls } from './hooks/useGameControls';
import { useGameLoop } from './hooks/useGameLoop';
import { useGameAudio } from './hooks/useGameAudio';
import { useGlitchEffect } from './hooks/useGlitchEffect';

import { SettingsOverlay } from './components/overlays/SettingsOverlay';
import { GameArea } from './components/game/GameArea';
import { SidePanel } from './components/info/SidePanel';
import { calculateDropTime } from './utils/gameHelpers';
import { settingsService } from './services/settingsService';
import { soundManager } from './services/SoundManager';
import { MoveRecord, Tetromino } from './types';

export type ShakeType = 'none' | 'left' | 'center' | 'right';

const App: React.FC = () => {
    // UI State
    const [shakeType, setShakeType] = useState<ShakeType>('none');
    const [isPaused, setIsPaused] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const gameContainerRef = useRef<HTMLDivElement>(null);

    // Persisted Settings State
    const [highScore, setHighScore] = useState(() => settingsService.getSettings().highScore);
    const [highLines, setHighLines] = useState(() => settingsService.getSettings().highLines);

    const handleGameOver = useCallback((finalScore: number, finalLines: number) => {
        if (settingsService.checkAndSetHighScore(finalScore, finalLines)) {
            const newSettings = settingsService.getSettings();
            setHighScore(newSettings.highScore);
            setHighLines(newSettings.highLines);
        }
    }, []);

    // Game State Hook
    const {
        board, player, pieceSuggestions, score, lines, level, gameState, dropTime,
        gameOverData, recordMove,
        setDropTime, startGame, updatePlayerPos, setPlayer
    } = useGameState({ onGameOver: handleGameOver });

    // UI and Audio Hooks
    const {
        musicVolume, effectsVolume, melodyVolume, bassVolume, percussionVolume, padVolume, otherVolume,
        handleUserInteraction,
        handleMusicVolumeChange, handleEffectsVolumeChange,
        handleMelodyVolumeChange, handleBassVolumeChange, handlePercussionVolumeChange, handlePadVolumeChange, handleOtherVolumeChange
    } = useGameAudio(gameState, isPaused, isSettingsOpen);
    useGlitchEffect();
    
    const toggleSettings = () => {
        handleUserInteraction();
        setIsSettingsOpen(prev => !prev);
    };

    const togglePause = useCallback(() => {
        if (gameState === 'PLAYING') {
            setIsPaused(prev => !prev);
        }
    }, [gameState]);

    const fullStartGame = useCallback(() => {
        handleUserInteraction();
        setIsPaused(false);
        setIsSettingsOpen(false);
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
                tetrominoKey: move.player.tetromino.key,
                collided: move.player.collided,
            }
        }));

        const cleanedCollidingPlayer = {
            pos: gameOverData.collidingPlayer.pos,
            tetrominoKey: gameOverData.collidingPlayer.tetromino.key,
            collided: gameOverData.collidingPlayer.collided,
        };

        const cleanedSuggestions = gameOverData.finalSuggestions.map((p: Tetromino) => p.key);

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
        a.download = `TetrAIs-debug-dump-${new Date().toISOString().replace(/:/g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [gameOverData]);

    const handleRestart = (event: React.MouseEvent<HTMLButtonElement>) => {
        if (event.shiftKey) {
            handleDebugDump();
        }
        fullStartGame();
    };

    // Player Actions Hook
    const triggerShake = useCallback((pieceCenter: number) => {
        // BOARD_WIDTH is 10.
        // Left third: < 3.5, Center: 3.5-6.5, Right third: > 6.5
        if (pieceCenter < 3.5) {
            setShakeType('left');
        } else if (pieceCenter > 6.5) {
            setShakeType('right');
        } else {
            setShakeType('center');
        }
    }, []);
    
    const { movePlayer, rotatePlayer, drop, hardDrop } = usePlayerActions({
        player, board, updatePlayerPos, setPlayer, gameState, isPaused, isSettingsOpen, dropTime,
        onHardDrop: triggerShake,
        recordMove,
    });
    
    // Game Loop Hook
    useGameLoop(drop, dropTime, gameState, isPaused, isSettingsOpen);
    
    // Controls Hook
    const resetDropTime = useCallback(() => {
        setDropTime(calculateDropTime(lines));
    }, [lines, setDropTime]);
    
    // Auto-adjust drop time and music speed when level changes (lines are updated)
    useEffect(() => {
        const isSoftDropping = dropTime !== null && dropTime <= 50;
        if (gameState === 'PLAYING' && !isPaused && !isSettingsOpen) {
            soundManager.updateMusicSpeed(lines);
            if (!isSoftDropping) {
                resetDropTime();
            }
        }
    }, [lines, gameState, isPaused, isSettingsOpen, dropTime, resetDropTime]);
    
    const { handleKeyDown, handleKeyUp } = useGameControls({
        gameState, isPaused, isSettingsOpen, movePlayer, rotatePlayer,
        hardDrop, togglePause, setDropTime, resetDropTime,
        player, recordMove,
    });

    // Focus Management
    useEffect(() => {
        if (gameState === 'PLAYING' && !isPaused && !isSettingsOpen) {
            gameContainerRef.current?.focus();
        }
    }, [gameState, isPaused, isSettingsOpen]);
    
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
                />
            )}
            <div className="w-full glitch-effect">
                <h1 className="app-header chromatic-text-1">Malice</h1>
                <div className="main-content">
                    <GameArea
                        gameState={gameState}
                        isPaused={isPaused}
                        isSettingsOpen={isSettingsOpen}
                        board={board}
                        player={player}
                        score={score}
                        onStart={fullStartGame}
                        onRestart={handleRestart}
                        toggleSettings={toggleSettings}
                        shakeType={shakeType}
                    />
                    <SidePanel
                        score={score}
                        lines={lines}
                        level={level}
                        pieceSuggestions={pieceSuggestions}
                        highScore={highScore}
                        highLines={highLines}
                    />
                </div>
            </div>
        </div>
    );
};

export default App;
