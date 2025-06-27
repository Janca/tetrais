


import React, { useMemo } from 'react';
import Gameboard from './Gameboard';
import GameboardBackground from './GameboardBackground';
import { StartGameOverlay } from '../overlays/StartGameOverlay';
import { GameOverOverlay } from '../overlays/GameOverOverlay';
import { PauseOverlay } from '../overlays/PauseOverlay';
import { Board, Player } from '../../types';
import { ShakeType } from '../../App';

interface GameAreaProps {
    gameState: 'IDLE' | 'PLAYING' | 'GAME_OVER';
    isPaused: boolean;
    isSettingsOpen: boolean;
    board: Board;
    player: Player;
    score: number;
    onStart: () => void;
    onRestart: (event: React.MouseEvent<HTMLButtonElement>) => void;
    toggleSettings: () => void;
    shakeType: ShakeType;
}

export const GameArea: React.FC<GameAreaProps> = ({
    gameState, isPaused, isSettingsOpen, board, player, score, onStart, onRestart, toggleSettings, shakeType
}) => {
    const memoizedGameboard = useMemo(() => <Gameboard board={board} player={player} />, [board, player]);
    const memoizedGameboardBackground = useMemo(() => <GameboardBackground board={board} />, [board]);
    
    const shakeClassMap = {
        left: 'shake-left',
        center: 'shake-center',
        right: 'shake-right',
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
                <button className="settings-button" onClick={toggleSettings}>[ Settings ]</button>
            </div>
        </main>
    );
};
