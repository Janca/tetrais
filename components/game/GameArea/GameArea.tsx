import React, { useMemo, useRef } from 'react';
import Gameboard from '../Gameboard/Gameboard';
import GameboardBackground from '../GameboardBackground/GameboardBackground';
import { StartGameOverlay } from '../../overlays/StartGameOverlay/StartGameOverlay';
import { GameOverOverlay } from '../../overlays/GameOverOverlay/GameOverOverlay';
import { PauseOverlay } from '../../overlays/PauseOverlay/PauseOverlay';
import { MinoBoard, Player } from '../../../types';
import { ShakeType, GameState } from '../../../App';
import { useTouchControls } from '../../../hooks/useTouchControls';
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

    const memoizedGameboard = useMemo(() => <Gameboard board={board} player={player} />, [board, player]);
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
                    {gameState === 'PLAYING' && isPaused && !isSettingsOpen && <PauseOverlay onUnpause={onUnpause} />}
                    
                    {memoizedGameboardBackground}
                    {memoizedGameboard}
                </div>
            </div>
        </main>
    );
};
