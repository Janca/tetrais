import { useCallback } from 'react';
import { Player, MinoBoard, MoveAction } from '../types';
import { soundManager } from '../services/SoundManager';
import { isColliding, rotate } from '../gameLogic';
import { GameState } from '../App';

interface PlayerActionsProps {
    player: Player;
    board: MinoBoard;
    updatePlayerPos: (props: { x?: number; y?: number; collided?: boolean }) => void;
    setPlayer: React.Dispatch<React.SetStateAction<Player>>;
    gameState: GameState;
    isPaused: boolean;
    isSettingsOpen: boolean;
    isHighScoresOpen: boolean;
    dropTime: number | null;
    onHardDrop?: (pieceCenter: number) => void;
    recordMove: (action: MoveAction, playerState: Player, details?: any) => void;
}

export const usePlayerActions = ({
    player, board, updatePlayerPos, setPlayer, gameState, isPaused, isSettingsOpen, isHighScoresOpen, dropTime, onHardDrop, recordMove
}: PlayerActionsProps) => {

    const canPerformAction = gameState === 'PLAYING' && !isPaused && !isSettingsOpen && !isHighScoresOpen;

    const movePlayer = useCallback((dir: -1 | 1) => {
        if (!canPerformAction) return;
        if (!isColliding(player, board, { x: dir, y: 0 })) {
            recordMove('move', player, { dir });
            updatePlayerPos({ x: dir });
            soundManager.playMoveSound();
        }
    }, [canPerformAction, player, board, updatePlayerPos, recordMove]);

    const rotatePlayer = useCallback((direction: 'cw' | 'ccw') => {
        if (!canPerformAction) return;
        
        const prospectivePlayer = {
            ...player,
            pos: { ...player.pos }, // Important: shallow copy for mutation during wall kick
            mino: {
                ...player.mino,
                shape: rotate(player.mino.shape, direction),
            },
        };

        // Wall kick logic
        const originalX = prospectivePlayer.pos.x;
        let offset = 1;
        while(isColliding(prospectivePlayer, board, {x: 0, y: 0})) {
            prospectivePlayer.pos.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            // If offset is too large, rotation is not possible
            if (Math.abs(offset) > prospectivePlayer.mino.shape[0].length + 1) {
                return; // Abort rotation
            }
        }
        
        recordMove('rotate', player, { direction });
        setPlayer(prospectivePlayer);
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
        const shape = player.mino.shape;
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
