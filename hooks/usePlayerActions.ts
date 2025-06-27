


import { useCallback } from 'react';
import { Player, Board, MoveAction } from '../types';
import { soundManager } from '../services/SoundManager';
import { isColliding, rotate } from '../gameLogic';

interface PlayerActionsProps {
    player: Player;
    board: Board;
    updatePlayerPos: (props: { x?: number; y?: number; collided?: boolean }) => void;
    setPlayer: React.Dispatch<React.SetStateAction<Player>>;
    gameState: 'IDLE' | 'PLAYING' | 'GAME_OVER';
    isPaused: boolean;
    isSettingsOpen: boolean;
    dropTime: number | null;
    onHardDrop?: (pieceCenter: number) => void;
    recordMove: (action: MoveAction, playerState: Player, details?: any) => void;
}

export const usePlayerActions = ({
    player, board, updatePlayerPos, setPlayer, gameState, isPaused, isSettingsOpen, dropTime, onHardDrop, recordMove
}: PlayerActionsProps) => {

    const canPerformAction = gameState === 'PLAYING' && !isPaused && !isSettingsOpen;

    const movePlayer = useCallback((dir: -1 | 1) => {
        if (!canPerformAction) return;
        if (!isColliding(player, board, { x: dir, y: 0 })) {
            recordMove('move', player, { dir });
            updatePlayerPos({ x: dir });
            soundManager.playMoveSound();
        }
    }, [canPerformAction, player, board, updatePlayerPos, recordMove]);

    const rotatePlayer = useCallback(() => {
        if (!canPerformAction) return;
        
        const clonedPlayer = JSON.parse(JSON.stringify(player));
        clonedPlayer.tetromino.shape = rotate(clonedPlayer.tetromino.shape);

        // Wall kick logic
        const originalX = clonedPlayer.pos.x;
        let offset = 1;
        while(isColliding(clonedPlayer, board, {x: 0, y: 0})) {
            clonedPlayer.pos.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            // If offset is too large, rotation is not possible
            if (Math.abs(offset) > clonedPlayer.tetromino.shape[0].length + 1) {
                return; // Abort rotation
            }
        }
        
        recordMove('rotate', player);
        setPlayer(clonedPlayer);
        soundManager.playRotateSound();
    }, [canPerformAction, player, board, setPlayer, recordMove]);

    const drop = useCallback(() => {
        if (!canPerformAction) return;
        
        recordMove('drop', player);
        if (!isColliding(player, board, { x: 0, y: 1 })) {
            updatePlayerPos({ y: 1, collided: false });
            if (dropTime !== null && dropTime <= 50) { // Check for soft drop
                soundManager.playSoftDropSound();
            }
        } else {
            soundManager.playLockSound();
            updatePlayerPos({ collided: true });
        }
    }, [canPerformAction, player, board, updatePlayerPos, dropTime, recordMove]);

    const hardDrop = useCallback(() => {
        if (!canPerformAction) return;
        let y = 0;
        while (!isColliding(player, board, { x: 0, y: y + 1 })) {
            y++;
        }
        recordMove('hardDrop', player);
        soundManager.playHardLockSound();
        updatePlayerPos({ y, collided: true });

        // Calculate piece center for shake effect
        const shape = player.tetromino.shape;
        let minC = shape[0].length;
        let maxC = -1;
        let hasBlocks = false;
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c] === 1) {
                    hasBlocks = true;
                    if (c < minC) minC = c;
                    if (c > maxC) maxC = c;
                }
            }
        }
        
        if (hasBlocks) {
            const pieceCenterOnBoard = player.pos.x + (minC + maxC) / 2.0;
            onHardDrop?.(pieceCenterOnBoard);
        } else {
            onHardDrop?.(player.pos.x); // Fallback for empty shapes
        }

    }, [canPerformAction, player, board, updatePlayerPos, onHardDrop, recordMove]);

    return { movePlayer, rotatePlayer, drop, hardDrop };
};
