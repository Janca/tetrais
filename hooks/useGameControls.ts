


import { useCallback, useRef } from 'react';
import { Player, MoveAction } from '../types';

interface GameControlProps {
    gameState: 'IDLE' | 'PLAYING' | 'GAME_OVER';
    isPaused: boolean;
    isSettingsOpen: boolean;
    movePlayer: (dir: -1 | 1) => void;
    rotatePlayer: () => void;
    hardDrop: () => void;
    togglePause: () => void;
    setDropTime: (time: number | null) => void;
    resetDropTime: () => void;
    player: Player;
    recordMove: (action: MoveAction, playerState: Player, details?: any) => void;
}

export const useGameControls = ({
    gameState, isPaused, isSettingsOpen, movePlayer, rotatePlayer,
    hardDrop, togglePause, setDropTime, resetDropTime,
    player, recordMove
}: GameControlProps) => {
    const keysDown = useRef<Set<number>>(new Set());

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (isSettingsOpen) return;
        const { keyCode } = event;

        // Use a ref to prevent multiple triggers for hold-down keys unless intended
        if (keysDown.current.has(keyCode)) {
            return;
        }

        if (keyCode === 80) { // 'P' to pause
            togglePause();
            keysDown.current.add(keyCode);
            return;
        }

        if (gameState !== 'PLAYING' || isPaused) return;
        
        keysDown.current.add(keyCode);

        switch (keyCode) {
            case 65: movePlayer(-1); break; // A
            case 68: movePlayer(1); break; // D
            case 83: 
                recordMove('softDrop_start', player);
                setDropTime(50); 
                break; // S (soft drop)
            case 81: rotatePlayer(); break; // Q
            case 69: rotatePlayer(); break; // E
            case 87: case 32: hardDrop(); break; // W or Space
        }
    }, [gameState, isSettingsOpen, isPaused, togglePause, movePlayer, setDropTime, rotatePlayer, hardDrop, player, recordMove]);

    const handleKeyUp = useCallback((event: KeyboardEvent) => {
        const { keyCode } = event;
        keysDown.current.delete(keyCode);

        if (isSettingsOpen || gameState !== 'PLAYING' || isPaused) return;

        if (keyCode === 83) { // 'S' key release
            recordMove('softDrop_end', player);
            resetDropTime();
        }
    }, [isSettingsOpen, gameState, isPaused, resetDropTime, player, recordMove]);
    
    return { handleKeyDown, handleKeyUp };
};
