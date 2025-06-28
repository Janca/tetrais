import React, { useMemo } from 'react';
import Gameboard from '../Gameboard/Gameboard';
import GameboardBackground from '../GameboardBackground/GameboardBackground';
import { StartGameOverlay } from '../../overlays/StartGameOverlay/StartGameOverlay';
import { GameOverOverlay } from '../../overlays/GameOverOverlay/GameOverOverlay';
import { PauseOverlay } from '../../overlays/PauseOverlay/PauseOverlay';
import { MinoBoard, Player } from '../../../types';
import { ShakeType, GameState } from '../../../App';
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
    shakeType: ShakeType;
}

export const GameArea: React.FC<GameAreaProps> = ({
    gameState, isPaused, isSettingsOpen, board, player, score, onStart, onRestart, shakeType
}) => {
    const memoizedGameboard = useMemo(() => <Gameboard board={board} player={player} />, [board, player]);
    const memoizedGameboardBackground = useMemo(() => <GameboardBackground board={board} />, [board]);
    
    const shakeClassMap = {
        left: 'shake-left',
        center: 'shake-center',
        right: 'shake-right',
        'low-motion': 'shake-low-motion',
        none: '',
    };
    const shakeClass = shakeClassMap[shakeType] || '';

    return (
        <main className="game-panel">
            <div className="game-area-container">
                 <div className={`gameboard-wrapper ${shakeClass}`}>
                    {gameState === 'IDLE' && <StartGameOverlay onStart={onStart} />}
                    {gameState === 'GAME_OVER' && <GameOverOverlay score={score} onRestart={onRestart} />}
                    {gameState === 'PLAYING' && isPaused && !isSettingsOpen && <PauseOverlay />}
                    
                    {memoizedGameboardBackground}
                    {memoizedGameboard}
                </div>
            </div>
        </main>
    );
};
