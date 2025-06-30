import { useState, useEffect, useCallback, useRef } from 'react';
import { MinoBoard, Player, Mino, MoveRecord, MoveAction, PieceKey } from '@/types';
import { createEmptyMinoBoard, BOARD_WIDTH, MINOS, BOARD_HEIGHT } from '@/constants';
import { getPieceSuggestions, selectBiasedPiece, calculateDropTime } from '@utils';
import { settingsService, soundManager } from '@services';
import { calculateGhostPosition, isColliding, mergePlayerToMinoBoard, clearLines, markFloatingBlocks, stepCascade, freezeFallingBlocks, rotate } from '@/gameLogic';
import { GameState } from '@/App';


interface UseGameStateProps {
    physicsEnabled: boolean;
    onHardDrop?: (pieceCenter: number) => void;
}

export const useGameState = ({ physicsEnabled, onHardDrop }: UseGameStateProps) => {
    const [board, setBoard] = useState<MinoBoard>(createEmptyMinoBoard());
    const [player, setPlayer] = useState<Player>({
        pos: { x: 0, y: 0 },
        mino: MINOS['0'],
        collided: false,
    });
    const [heldPiece, setHeldPiece] = useState<Mino | null>(null);
    const [hasSwapped, setHasSwapped] = useState(false);
    const [pieceSuggestions, setPieceSuggestions] = useState<Mino[]>([]);
    const [score, setScore] = useState(0);
    const [lines, setLines] = useState(0);
    const [level, setLevel] = useState(0);
    const [gameState, setGameState] = useState<GameState>('IDLE');
    const [dropTime, setDropTime] = useState<number | null>(1000);
    const [moveHistory, setMoveHistory] = useState<MoveRecord[]>([]);
    const [gameOverData, setGameOverData] = useState<any>(null);
    const [displayBoard, setDisplayBoard] = useState<MinoBoard>(createEmptyMinoBoard());

    const mostNeededPieceRef = useRef<PieceKey | null>(null);
    const cascadeTimerRef = useRef<number | null>(null);
    const cascadeTimeRef = useRef(0);

    const [isActionLocked, setIsActionLocked] = useState(false);

    const resetActionLock = useCallback(() => {
        setIsActionLocked(false);
    }, []);

    const recordMove = useCallback((action: MoveAction, playerState: Player, details?: any) => {
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

    const resetPlayer = useCallback((currentBoard: MinoBoard) => {
        const suggestions = getPieceSuggestions(currentBoard);
        setPieceSuggestions(suggestions);

        const leastNeededPiece = suggestions[0];
        let newPiece: Mino;
        let spite = false;

        if (mostNeededPieceRef.current && mostNeededPieceRef.current === leastNeededPiece.key) {
            newPiece = MINOS[mostNeededPieceRef.current];
            spite = true;
        } else {
            const weights = settingsService.getSettings().pieceSuggestionWeights;
            newPiece = selectBiasedPiece(suggestions, weights);
        }
        
        mostNeededPieceRef.current = suggestions[suggestions.length - 1].key as PieceKey;

        const spawnY = -newPiece.shape.filter(row => row.some(cell => cell !== 0)).length + 1;
        const spawnPos = { x: Math.floor(BOARD_WIDTH / 2) - 2, y: spawnY };
        
        const newPlayer: Player = { pos: spawnPos, mino: newPiece, collided: false };

        if (isColliding(newPlayer, currentBoard, { x: 0, y: 0 })) {
            let isGameOver = false;
            newPlayer.mino.shape.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value !== 0) {
                        if (newPlayer.pos.y + y < 0) {
                            isGameOver = true;
                        }
                    }
                });
            });

            if (isGameOver) {
                const finalGameOverData = {
                    timestamp: new Date().toISOString(),
                    finalBoard: currentBoard,
                    collidingPlayer: newPlayer,
                    moveHistory,
                    finalSuggestions: suggestions,
                    finalScore: score,
                    finalLines: lines,
                    level,
                };
                setGameOverData(finalGameOverData);
                setDropTime(null);
                soundManager.playGameOverSound(true);
                setGameState(settingsService.isHighScore(score) ? 'HIGH_SCORE_ENTRY' : 'GAME_OVER');
                return;
            }
        }
        
        setPlayer(newPlayer);
        setHasSwapped(false);
        resetActionLock();
        if (spite) {
            // This is a bit of a hack, but we need to merge the piece immediately
            // to show the spiteful color.
            setBoard(prevBoard => mergePlayerToMinoBoard(newPlayer, prevBoard, true));
        }

    }, [score, lines, level, moveHistory]);

    const startGame = useCallback(() => {
        const startBoard = createEmptyMinoBoard();
        setBoard(startBoard);
        setScore(0);
        setLines(0);
        setLevel(0);
        setDropTime(calculateDropTime(0));
        setMoveHistory([]);
        setGameOverData(null);
        mostNeededPieceRef.current = null;
        setHeldPiece(null);
        setHasSwapped(false);
        resetPlayer(startBoard);
        setGameState('PLAYING');
    }, [resetPlayer]);

    const holdPiece = useCallback(() => {
        if (hasSwapped || gameState !== 'PLAYING') return;

        setHasSwapped(true);
        soundManager.playHoldSound();

        if (!heldPiece) {
            setHeldPiece(player.mino);
            resetPlayer(board);
        } else {
            const tempPiece = player.mino;
            const newPlayerPiece = heldPiece;
            
            const spawnY = -newPlayerPiece.shape.filter(row => row.some(cell => cell !== 0)).length + 1;
            const spawnPos = { x: Math.floor(BOARD_WIDTH / 2) - 2, y: spawnY };
            
            const newPlayer: Player = { pos: spawnPos, mino: newPlayerPiece, collided: false };

            if (isColliding(newPlayer, board, { x: 0, y: 0 })) {
                // This is a rare edge case where swapping would cause an immediate game over.
                // To prevent this, we can either revert the swap or just end the game.
                // For simplicity, we'll revert the swap.
                setHasSwapped(false); // Revert the hasSwapped flag
                soundManager.playErrorSound(); // Optional: play an error sound
                return;
            }

            setPlayer(newPlayer);
            setHeldPiece(tempPiece);
        }
    }, [hasSwapped, gameState, heldPiece, player.mino, board, resetPlayer]);

    // Player Actions
    const movePlayer = useCallback((dir: -1 | 1) => {
        if (gameState !== 'PLAYING' || isActionLocked) return;
        if (!isColliding(player, board, { x: dir, y: 0 })) {
            recordMove('move', player, { dir });
            updatePlayerPos({ x: dir });
            soundManager.playMoveSound();
        }
    }, [gameState, player, board, updatePlayerPos, recordMove, isActionLocked]);

    const rotatePlayer = useCallback((direction: 'cw' | 'ccw') => {
        if (gameState !== 'PLAYING' || isActionLocked) return;
        
        const prospectivePlayer = { ...player, mino: { ...player.mino, shape: rotate(player.mino.shape, direction) } };
        let offset = 1;
        while (isColliding(prospectivePlayer, board, { x: 0, y: 0 })) {
            prospectivePlayer.pos.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if (Math.abs(offset) > prospectivePlayer.mino.shape[0].length + 1) return;
        }
        
        recordMove('rotate', player, { direction });
        setIsActionLocked(true);
        setPlayer(prospectivePlayer);
        soundManager.playRotateSound();
    }, [gameState, player, board, setPlayer, recordMove, isActionLocked]);

    const drop = useCallback(() => {
        if (gameState !== 'PLAYING') return;
        
        recordMove('drop', player);
        if (!isColliding(player, board, { x: 0, y: 1 })) {
            updatePlayerPos({ y: 1, collided: false });
            if (dropTime !== null && dropTime <= 50) soundManager.playSoftDropSound();
        } else {
            soundManager.playLockSound();
            updatePlayerPos({ collided: true });
        }
    }, [gameState, player, board, updatePlayerPos, dropTime, recordMove]);

    const hardDrop = useCallback(() => {
        if (gameState !== 'PLAYING' || isActionLocked) return;
        let y = 0;
        while (!isColliding(player, board, { x: 0, y: y + 1 })) y++;
        
        recordMove('hardDrop', player);
        soundManager.playHardLockSound();
        setIsActionLocked(true);
        updatePlayerPos({ y, collided: true });

        const shape = player.mino.shape;
        let minC = shape[0].length, maxC = -1, hasBlocks = false;
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
            onHardDrop?.(player.pos.x + (minC + maxC) / 2.0);
        } else {
            onHardDrop?.(player.pos.x);
        }
    }, [gameState, player, board, updatePlayerPos, onHardDrop, recordMove]);

    const handleLineClear = useCallback((boardWithPiece: MinoBoard) => {
        if (!physicsEnabled) {
            const { newBoard, linesCleared } = clearLines(boardWithPiece);
            if (linesCleared > 0) {
                soundManager.playLineClearSound();
                const pointsEarned = [40, 100, 300, 1200][linesCleared - 1] * (level + 1);
                setScore(prev => prev + pointsEarned);
                const newTotalLines = lines + linesCleared;
                setLines(newTotalLines);
                setLevel(Math.floor(newTotalLines / 5));
                setBoard(newBoard);
                resetPlayer(newBoard);
            } else {
                setBoard(boardWithPiece);
                resetPlayer(boardWithPiece);
            }
            return;
        }

        let clearedRowsIndexes: number[] = [];
        boardWithPiece.forEach((row, y) => {
            if (row.every(cell => cell.state === 'merged')) clearedRowsIndexes.push(y);
        });
        const linesCleared = clearedRowsIndexes.length;

        if (linesCleared > 0) {
            soundManager.playLineClearSound();
            const pointsEarned = [40, 100, 300, 1200][linesCleared - 1] * (level + 1);
            setScore(prev => prev + pointsEarned);
            const newTotalLines = lines + linesCleared;
            setLines(newTotalLines);
            setLevel(Math.floor(newTotalLines / 5));
            
            const boardWithEmptyRows = boardWithPiece.map((row, y) => 
                clearedRowsIndexes.includes(y) ? Array(BOARD_WIDTH).fill({ value: 0, state: 'clear', spite: false }) : row
            );
            
            const boardToCascade = markFloatingBlocks(boardWithEmptyRows);
            if (boardToCascade.some(row => row.some(cell => cell.state === 'falling'))) {
                setBoard(boardToCascade);
                setPlayer(prev => ({...prev, mino: MINOS['0']}));
                setGameState('CASCADING');
            } else {
                const compactedBoard = boardWithEmptyRows.filter(row => row.some(cell => cell.state !== 'clear'));
                while(compactedBoard.length < BOARD_HEIGHT) {
                    compactedBoard.unshift(Array(BOARD_WIDTH).fill({ value: 0, state: 'clear', spite: false }));
                }
                setBoard(compactedBoard as MinoBoard);
                resetPlayer(compactedBoard as MinoBoard);
            }
        } else {
            setBoard(boardWithPiece);
            resetPlayer(boardWithPiece);
        }
    }, [lines, level, physicsEnabled, resetPlayer]);

    useEffect(() => {
        if (!player.collided || gameState !== 'PLAYING') return;
        const boardWithPiece = mergePlayerToMinoBoard(player, board);
        setBoard(boardWithPiece);
        setPlayer(prev => ({ ...prev, mino: MINOS['0'] }));
        setGameState('PROCESSING_BOARD');
    }, [player.collided, gameState, board]);

    useEffect(() => {
        if (gameState !== 'PROCESSING_BOARD') return;
        handleLineClear(board);
        setGameState(prev => prev === 'PROCESSING_BOARD' ? 'PLAYING' : prev);
    }, [gameState, board, handleLineClear]);
    
    const runCascade = useCallback(() => {
        setBoard(currentBoard => {
            const { nextBoard: steppedBoard, moved } = stepCascade(currentBoard);
            if (moved) {
                soundManager.playCascadeSound();
                return steppedBoard;
            }
    
            if (cascadeTimerRef.current) cancelAnimationFrame(cascadeTimerRef.current);
            cascadeTimerRef.current = null;
    
            const frozenBoard = freezeFallingBlocks(steppedBoard);
            let clearedRowsIndexes: number[] = [];
            frozenBoard.forEach((row, y) => {
                if (row.every(cell => cell.state === 'merged')) clearedRowsIndexes.push(y);
            });
            const linesCleared = clearedRowsIndexes.length;
    
            if (linesCleared > 0) {
                soundManager.playLineClearSound();
                const pointsEarned = [40, 100, 300, 1200][linesCleared - 1] * (level + 1) * 1.5;
                setScore(prev => prev + pointsEarned);
                const newTotalLines = lines + linesCleared;
                setLines(newTotalLines);
                setLevel(Math.floor(newTotalLines / 5));
    
                const boardWithEmptyRows = frozenBoard.map((row, y) => 
                    clearedRowsIndexes.includes(y) ? Array(BOARD_WIDTH).fill({ value: 0, state: 'clear', spite: false }) : row
                );
    
                const boardToCascadeAgain = markFloatingBlocks(boardWithEmptyRows);
                if (boardToCascadeAgain.some(row => row.some(cell => cell.state === 'falling'))) {
                    return boardToCascadeAgain;
                } else {
                    const compactedBoard = boardWithEmptyRows.filter(row => row.some(cell => cell.state !== 'clear'));
                    while (compactedBoard.length < BOARD_HEIGHT) {
                        compactedBoard.unshift(Array(BOARD_WIDTH).fill({ value: 0, state: 'clear', spite: false }));
                    }
                    setGameState('PLAYING');
                    resetPlayer(compactedBoard as MinoBoard);
                    return compactedBoard as MinoBoard;
                }
            } else {
                const compactedBoard = frozenBoard.filter(row => row.some(cell => cell.state !== 'clear'));
                while (compactedBoard.length < BOARD_HEIGHT) {
                    compactedBoard.unshift(Array(BOARD_WIDTH).fill({ value: 0, state: 'clear', spite: false }));
                }
                setGameState('PLAYING');
                resetPlayer(compactedBoard as MinoBoard);
                return compactedBoard as MinoBoard;
            }
        });
    }, [lines, level, resetPlayer]);

    useEffect(() => {
        if (gameState !== 'CASCADING') {
            if (cascadeTimerRef.current) cancelAnimationFrame(cascadeTimerRef.current);
            return;
        }
        
        if (!cascadeTimerRef.current) {
            cascadeTimeRef.current = 0;
            let lastTime = 0;
            const loop = (time: number) => {
                if (lastTime > 0) {
                    const deltaTime = time - lastTime;
                    cascadeTimeRef.current += deltaTime;
                    if (cascadeTimeRef.current > 500) {
                        runCascade();
                        cascadeTimeRef.current = 0;
                    }
                }
                lastTime = time;
                cascadeTimerRef.current = requestAnimationFrame(loop);
            };
            cascadeTimerRef.current = requestAnimationFrame(loop);
        }
        return () => {
            if (cascadeTimerRef.current) cancelAnimationFrame(cascadeTimerRef.current);
        };
    }, [gameState, runCascade]);

    useEffect(() => {
        const newDisplayBoard = board.map(row => row.map(cell => ({ ...cell })));
        const ghostY = calculateGhostPosition(player, board);

        if (gameState === 'PLAYING') {
            // Draw ghost piece
            player.mino.shape.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value !== 0) {
                        const boardY = ghostY + y;
                        const boardX = player.pos.x + x;
                        if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
                            if (newDisplayBoard[boardY][boardX].state === 'clear') {
                                newDisplayBoard[boardY][boardX] = { value: player.mino.key as PieceKey, state: 'ghost', spite: false };
                            }
                        }
                    }
                });
            });

            // Draw player piece
            player.mino.shape.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value !== 0) {
                        const boardY = player.pos.y + y;
                        const boardX = player.pos.x + x;
                        if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
                            newDisplayBoard[boardY][boardX] = { value: player.mino.key as PieceKey, state: 'player', spite: false };
                        }
                    }
                });
            });
        }
        setDisplayBoard(newDisplayBoard);
    }, [player, board, gameState]);

    return {
        board: displayBoard,
        player, pieceSuggestions, score, lines, level, gameState, dropTime,
        heldPiece, gameOverData, recordMove, setDropTime, setGameState, startGame, 
        movePlayer, rotatePlayer, drop, hardDrop, holdPiece,
        isActionLocked, resetActionLock,
    };
};
