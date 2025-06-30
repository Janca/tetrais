/**
 * @file GameArea.tsx
 * @description
 * This component serves as the central hub for the main gameplay screen. It orchestrates the rendering of two distinct, layered components:
 * 1. `GameboardBackground`: Renders a subtle "glitch" effect behind where the frozen blocks are.
 * 2. `Gameboard`: Renders the actual gameplay elements, including the active player piece, the ghost piece, and the frozen blocks.
 *
 * This two-layer approach is crucial for the desired visual aesthetic. We want the frozen blocks to appear as a single, solid, dark mass.
 * The glitch effect from the background layer provides a subtle, stylized texture that is visible "through" this mass, while the active
 * player piece has its own distinct glitch effect on the top layer to make it stand out.
 */
import React, { useMemo, useRef } from 'react';
import { Gameboard } from '@components/game';
import { GameboardBackground } from '@components/game';
import { StartGameOverlay, GameOverOverlay, PauseOverlay } from '@components/overlays';
import { MinoBoard, Player } from '@/types';
import { ShakeType, GameState } from '@/App';
import { useTouchControls } from '@hooks/useTouchControls';
import './styles.css';

interface GameAreaProps {
    gameState: GameState;
    isPaused: boolean;
    isSettingsOpen: boolean;
    board: MinoBoard;
    player: Player;
    score: number;
    onStart: () => void;
    onRestart: (event: React.MouseEvent<HTMLButtonElement>) => void;
    onUnpause: () => void;
    shakeType: ShakeType;
    movePlayer: (dir: -1 | 1) => void;
    rotatePlayer: (direction: 'cw' | 'ccw') => void;
    hardDrop: () => void;
    softDropStart: () => void;
    softDropEnd: () => void;
    hapticsEnabled: boolean;
}

export const GameArea: React.FC<GameAreaProps> = ({
    gameState, isPaused, isSettingsOpen, board, player, score, onStart, onRestart, onUnpause, shakeType,
    movePlayer, rotatePlayer, hardDrop, softDropStart, softDropEnd, hapticsEnabled
}) => {
    const gameAreaRef = useRef<HTMLDivElement>(null);

    useTouchControls({
        targetRef: gameAreaRef,
        enabled: gameState === 'PLAYING' && !isPaused && !isSettingsOpen,
        movePlayer,
        rotatePlayer,
        hardDrop,
        softDropStart,
        softDropEnd,
        hapticsEnabled,
        player,
    });

    const memoizedGameboard = useMemo(() => <Gameboard board={board} />, [board]);
    const memoizedGameboardBackground = useMemo(() => <GameboardBackground board={board} />, [board]);
    
    const shakeClassMap: Record<ShakeType, string> = {
        'none': '',
        'low-motion': 'shake-low-motion',
        'left-1': 'shake-left-1', 'center-1': 'shake-center-1', 'right-1': 'shake-right-1',
        'left-2': 'shake-left-2', 'center-2': 'shake-center-2', 'right-2': 'shake-right-2',
        'left-3': 'shake-left-3', 'center-3': 'shake-center-3', 'right-3': 'shake-right-3',
    };
    const shakeClass = shakeClassMap[shakeType] || '';

    return (
        <main className="game-panel" ref={gameAreaRef}>
            <div className="game-area-container">
                 <div className={`gameboard-wrapper ${shakeClass}`}>
                    {gameState === 'IDLE' && <StartGameOverlay onStart={onStart} />}
                    {gameState === 'GAME_OVER' && <GameOverOverlay score={score} onRestart={onRestart} />}
                    {gameState === 'PLAYING' && isPaused && !isSettingsOpen && <PauseOverlay onUnpause={onUnpause} onRestart={onRestart} />}
                    
                    {memoizedGameboardBackground}
                    {memoizedGameboard}
                </div>
            </div>
        </main>
    );
};
