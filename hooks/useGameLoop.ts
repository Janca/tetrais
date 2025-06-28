import { useEffect, useRef, useCallback } from 'react';
import { GameState } from '../App';

export const useGameLoop = (
    drop: () => void,
    dropTime: number | null,
    gameState: GameState,
    isPaused: boolean,
    isSettingsOpen: boolean,
    isHighScoresOpen: boolean
) => {
    const gameLoopRef = useRef<number>(-1);
    const lastTimeRef = useRef<number>(0);
    const dropCounterRef = useRef<number>(0);

    const gameLoop = useCallback((time: number) => {
        if (isPaused || isSettingsOpen || isHighScoresOpen || gameState !== 'PLAYING') {
            lastTimeRef.current = time; // Prevent large deltaTime jump after unpausing
            gameLoopRef.current = requestAnimationFrame(gameLoop);
            return;
        }

        if (lastTimeRef.current > 0 && dropTime !== null) {
            const deltaTime = time - lastTimeRef.current;
            dropCounterRef.current += deltaTime;
            if (dropCounterRef.current > dropTime) {
                drop();
                dropCounterRef.current = 0;
            }
        }
        lastTimeRef.current = time;
        gameLoopRef.current = requestAnimationFrame(gameLoop);
    }, [drop, dropTime, isPaused, isSettingsOpen, isHighScoresOpen, gameState]);

    useEffect(() => {
        gameLoopRef.current = requestAnimationFrame(gameLoop);
        return () => {
            if (gameLoopRef.current) {
                cancelAnimationFrame(gameLoopRef.current);
            }
        };
    }, [gameLoop]);
};
