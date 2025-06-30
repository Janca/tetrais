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
    const isDropping = useRef(false);
    const isRotating = useRef(false);

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (isSettingsOpen || isHighScoresOpen) return;
        const { code } = event;

        if (keysDown.current.has(code)) return;

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
                if (!isDropping.current && !isRotating.current) movePlayer(-1);
                break;
            case 'KeyD':
            case 'ArrowRight':
                if (!isDropping.current && !isRotating.current) movePlayer(1);
                break;
            case 'KeyS':
            case 'ArrowDown':
                if (!isDropping.current) {
                    isDropping.current = true;
                    softDropStart();
                }
                break;
            case 'KeyQ':
                if (!isRotating.current && !isDropping.current) {
                    isRotating.current = true;
                    rotatePlayer('ccw');
                }
                break;
            case 'KeyE':
            case 'ArrowUp':
                if (!isRotating.current && !isDropping.current) {
                    isRotating.current = true;
                    rotatePlayer('cw');
                }
                break;
            case 'Space':
            case 'KeyW':
                if (!isDropping.current) {
                    isDropping.current = true;
                    hardDrop();
                }
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

        switch (code) {
            case 'KeyS':
            case 'ArrowDown':
                isDropping.current = false;
                softDropEnd();
                break;
            case 'KeyQ':
            case 'KeyE':
            case 'ArrowUp':
                isRotating.current = false;
                break;
            case 'Space':
            case 'KeyW':
                isDropping.current = false;
                break;
        }
    }, [isSettingsOpen, isHighScoresOpen, gameState, isPaused, softDropEnd]);
    
    return { handleKeyDown, handleKeyUp };
};
