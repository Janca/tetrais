import { useCallback, useRef } from 'react';
import { GameState } from '@/App';

interface GameControlProps {
    gameState: GameState;
    isPaused: boolean;
    isSettingsOpen: boolean;
    isHighScoresOpen: boolean;
    movePlayer: (dir: -1 | 1) => void;
    rotatePlayer: (direction: 'cw' | 'ccw') => void;
    hardDrop: () => void;
    togglePause: () => void;
    softDropStart: () => void;
    softDropEnd: () => void;
    holdPiece: () => void;
}

export const useGameControls = ({
    gameState, isPaused, isSettingsOpen, isHighScoresOpen, movePlayer, rotatePlayer,
    hardDrop, togglePause, softDropStart, softDropEnd, holdPiece
}: GameControlProps) => {
    const keysDown = useRef<Set<string>>(new Set());

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (isSettingsOpen || isHighScoresOpen) return;
        const { code } = event;

        // Use a ref to prevent multiple triggers for hold-down keys
        if (keysDown.current.has(code)) {
            return;
        }

        if (code === 'KeyP') {
            togglePause();
            keysDown.current.add(code);
            return;
        }

        if (gameState !== 'PLAYING' || isPaused) return;
        
        keysDown.current.add(code);

        switch (code) {
            case 'KeyA':
            case 'ArrowLeft':
                movePlayer(-1);
                break;
            case 'KeyD':
            case 'ArrowRight':
                movePlayer(1);
                break;
            case 'KeyS':
            case 'ArrowDown':
                softDropStart();
                break;
            case 'KeyQ':
                rotatePlayer('ccw');
                break;
            case 'KeyE':
            case 'ArrowUp':
                rotatePlayer('cw');
                break;
            case 'Space':
            case 'KeyW':
                hardDrop();
                break;
            case 'KeyC':
                holdPiece();
                break;
        }
    }, [gameState, isSettingsOpen, isHighScoresOpen, isPaused, togglePause, movePlayer, rotatePlayer, hardDrop, softDropStart, holdPiece]);

    const handleKeyUp = useCallback((event: KeyboardEvent) => {
        const { code } = event;
        keysDown.current.delete(code);

        if (isSettingsOpen || isHighScoresOpen || gameState !== 'PLAYING' || isPaused) return;

        if (code === 'KeyS' || code === 'ArrowDown') {
            softDropEnd();
        }
    }, [isSettingsOpen, isHighScoresOpen, gameState, isPaused, softDropEnd]);
    
    return { handleKeyDown, handleKeyUp };
};
