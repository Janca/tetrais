


import { useState, useEffect, useCallback } from 'react';
import { Board, Player, Tetromino, MoveRecord, MoveAction } from '../types';
import { createEmptyBoard, BOARD_WIDTH, TETROMINOS } from '../constants';
import { getPieceSuggestions } from '../services/tetrisService';
import { selectBiasedPiece, calculateDropTime } from '../utils/gameHelpers';
import { soundManager } from '../services/SoundManager';
import { isColliding, mergePlayerToBoard, clearLines } from '../gameLogic';

interface UseGameStateProps {
    onGameOver?: (score: number, lines: number) => void;
}

export const useGameState = ({ onGameOver }: UseGameStateProps = {}) => {
    const [board, setBoard] = useState<Board>(createEmptyBoard());
    const [player, setPlayer] = useState<Player>({
        pos: { x: 0, y: 0 },
        tetromino: TETROMINOS['0'],
        collided: false,
    });
    const [pieceSuggestions, setPieceSuggestions] = useState<Tetromino[]>([]);
    const [score, setScore] = useState(0);
    const [lines, setLines] = useState(0);
    const [level, setLevel] = useState(0);
    const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'GAME_OVER'>('IDLE');
    const [dropTime, setDropTime] = useState<number | null>(1000);
    const [moveHistory, setMoveHistory] = useState<MoveRecord[]>([]);
    const [gameOverData, setGameOverData] = useState<any>(null);

    const recordMove = useCallback((action: MoveAction, playerState: Player, details?: any) => {
        // Deep copy player state to avoid mutation issues with stale closures
        const playerCopy = JSON.parse(JSON.stringify(playerState));
        setMoveHistory(prev => [...prev, {
            gameTime: Date.now(),
            action,
            player: playerCopy,
            details,
        }]);
    }, []);

    const updatePlayerPos = useCallback(({ x, y, collided }: { x?: number; y?: number; collided?: boolean }) => {
        setPlayer(prev => ({
            ...prev,
            pos: { x: prev.pos.x + (x || 0), y: prev.pos.y + (y || 0) },
            collided: collided !== undefined ? collided : prev.collided,
        }));
    }, []);

    const resetPlayer = useCallback((currentBoard: Board) => {
        const suggestions = getPieceSuggestions(currentBoard);
        setPieceSuggestions(suggestions);

        const newPiece = selectBiasedPiece(suggestions);
        const newPlayer: Player = {
            pos: { x: Math.floor(BOARD_WIDTH / 2) - 2, y: 0 },
            tetromino: newPiece,
            collided: false,
        };

        if (isColliding(newPlayer, currentBoard, { x: 0, y: 0 })) {
            setGameOverData({
                timestamp: new Date().toISOString(),
                finalBoard: currentBoard,
                collidingPlayer: player, // The piece that ended the game
                score,
                lines,
                level,
                moveHistory,
                finalSuggestions: suggestions,
            });
            setGameState('GAME_OVER');
            setDropTime(null);
            soundManager.playGameOverSound(true);
            onGameOver?.(score, lines);
        } else {
            setPlayer(newPlayer);
        }
    }, [onGameOver, score, lines, player, moveHistory]);

    const startGame = useCallback(() => {
        const startBoard = createEmptyBoard();
        setBoard(startBoard);
        setScore(0);
        setLines(0);
        setLevel(0);
        setDropTime(calculateDropTime(0));
        setMoveHistory([]); // Reset history
        setGameOverData(null); // Reset game over data
        resetPlayer(startBoard);
        setGameState('PLAYING');
    }, [resetPlayer]);

    // Piece collision and line clearing
    useEffect(() => {
        if (!player.collided || gameState !== 'PLAYING') {
            return;
        }

        // 1. Merge the collided piece into the board
        const boardWithPiece = mergePlayerToBoard(player, board);

        // 2. Check for and clear completed lines
        const { newBoard, linesCleared } = clearLines(boardWithPiece);

        // 3. Update score and lines if any were cleared
        if (linesCleared > 0) {
            soundManager.playLineClearSound();
            const newTotalLines = lines + linesCleared;
            setLines(newTotalLines);
            // Recalculate level based on new total lines
            const newLevel = Math.floor(newTotalLines / 5);
            setLevel(newLevel);
            
            const linePoints = [40, 100, 300, 1200];
            const pointsEarned = linePoints[linesCleared - 1] || 0;
            setScore(prev => prev + pointsEarned * (newLevel + 1));
        }

        // 4. Update the board state
        setBoard(newBoard);
        
        // 5. Spawn the next piece, which includes the game over check
        resetPlayer(newBoard);

    }, [player.collided, gameState, board, lines, resetPlayer]);
    
    // Level up logic is now implicitly handled when lines are updated
    useEffect(() => {
        if (lines > 0 && lines >= (level + 1) * 5) {
            setLevel(prev => prev + 1);
        }
    }, [lines, level]);
    
    return {
        board, player, pieceSuggestions, score, lines, level, gameState, dropTime,
        gameOverData, recordMove,
        setDropTime, setGameState, startGame, updatePlayerPos, setPlayer,
    };
};
