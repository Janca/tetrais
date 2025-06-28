import { useState, useEffect, useCallback, useRef } from 'react';
import { MinoBoard, Player, Mino, MoveRecord, MoveAction, MinoCellData } from '../types';
import { createEmptyMinoBoard, BOARD_WIDTH, MINOS, BOARD_HEIGHT } from '../constants';
import { getPieceSuggestions } from '../services/minosService';
import { selectBiasedPiece, calculateDropTime } from '../utils/gameHelpers';
import { soundManager } from '../services/SoundManager';
import { isColliding, mergePlayerToMinoBoard, clearLines, markFloatingBlocks, stepCascade, freezeFallingBlocks } from '../gameLogic';
import { settingsService } from '../services/settingsService';
import { GameState } from '../App';


interface UseGameStateProps {
    physicsEnabled: boolean;
}

export const useGameState = ({ physicsEnabled }: UseGameStateProps) => {
    const [board, setBoard] = useState<MinoBoard>(createEmptyMinoBoard());
    const [player, setPlayer] = useState<Player>({
        pos: { x: 0, y: 0 },
        mino: MINOS['0'],
        collided: false,
    });
    const [pieceSuggestions, setPieceSuggestions] = useState<Mino[]>([]);
    const [score, setScore] = useState(0);
    const [lines, setLines] = useState(0);
    const [level, setLevel] = useState(0);
    const [gameState, setGameState] = useState<GameState>('IDLE');
    const [dropTime, setDropTime] = useState<number | null>(1000);
    const [moveHistory, setMoveHistory] = useState<MoveRecord[]>([]);
    const [gameOverData, setGameOverData] = useState<any>(null);

    const cascadeTimerRef = useRef<number | null>(null);
    const cascadeTimeRef = useRef(0);

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

    const resetPlayer = useCallback((currentBoard: MinoBoard) => {
        const suggestions = getPieceSuggestions(currentBoard);
        setPieceSuggestions(suggestions);

        const weights = settingsService.getSettings().pieceSuggestionWeights;
        const newPiece = selectBiasedPiece(suggestions, weights);
        const newPlayer: Player = {
            pos: { x: Math.floor(BOARD_WIDTH / 2) - 2, y: 0 },
            mino: newPiece,
            collided: false,
        };

        if (isColliding(newPlayer, currentBoard, { x: 0, y: 0 })) {
            const finalGameOverData = {
                timestamp: new Date().toISOString(),
                finalBoard: currentBoard,
                collidingPlayer: player, // The piece that ended the game
                moveHistory,
                finalSuggestions: suggestions,
                finalScore: score,
                finalLines: lines,
                level,
            };
            setGameOverData(finalGameOverData);
            
            setDropTime(null);
            soundManager.playGameOverSound(true);
            
            if (settingsService.isHighScore(score)) {
                setGameState('HIGH_SCORE_ENTRY');
            } else {
                setGameState('GAME_OVER');
            }
        } else {
            setPlayer(newPlayer);
        }
    }, [score, lines, level, player, moveHistory]);

    const startGame = useCallback(() => {
        const startBoard = createEmptyMinoBoard();
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

    const handleLineClear = useCallback((boardWithPiece: MinoBoard) => {
        if (!physicsEnabled) {
            // --- Traditional Gameplay ---
            const { newBoard, linesCleared } = clearLines(boardWithPiece);
            if (linesCleared > 0) {
                soundManager.playLineClearSound();
                const linePoints = [40, 100, 300, 1200];
                const pointsEarned = (linePoints[linesCleared - 1] || 0) * (level + 1);
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

        // --- Physics-Enabled Gameplay ---
        let clearedRowsIndexes: number[] = [];
        boardWithPiece.forEach((row, y) => {
            if (row.every(cell => cell[1] === 'merged')) {
                clearedRowsIndexes.push(y);
            }
        });
        const linesCleared = clearedRowsIndexes.length;

        if (linesCleared > 0) {
            soundManager.playLineClearSound();
            const linePoints = [40, 100, 300, 1200];
            const pointsEarned = (linePoints[linesCleared - 1] || 0) * (level + 1);
            setScore(prev => prev + pointsEarned);

            const newTotalLines = lines + linesCleared;
            setLines(newTotalLines);
            setLevel(Math.floor(newTotalLines / 5));
            
            const boardWithEmptyRows = boardWithPiece.map((row, y) => {
                if (clearedRowsIndexes.includes(y)) {
                    return Array(BOARD_WIDTH).fill([0, 'clear'] as MinoCellData);
                }
                return row;
            });
            
            const boardToCascade = markFloatingBlocks(boardWithEmptyRows);
            const hasFallingBlocks = boardToCascade.some(row => row.some(cell => cell[1] === 'falling'));

            if (hasFallingBlocks) {
                setBoard(boardToCascade);
                setPlayer(prev => ({...prev, mino: MINOS['0']})); // Hide player piece
                setGameState('CASCADING');
            } else {
                 // No blocks are falling, but we need to compact the board from the clear.
                const compactedBoard = boardWithEmptyRows.filter(row => row.some(cell => cell[1] !== 'clear'));
                while(compactedBoard.length < BOARD_HEIGHT) {
                    compactedBoard.unshift(Array(BOARD_WIDTH).fill([0, 'clear']));
                }
                setBoard(compactedBoard as MinoBoard);
                resetPlayer(compactedBoard as MinoBoard);
            }
        } else {
            setBoard(boardWithPiece);
            resetPlayer(boardWithPiece);
        }
    }, [lines, level, physicsEnabled, resetPlayer]);


    // Piece collision and line clearing
    useEffect(() => {
        if (!player.collided || gameState !== 'PLAYING') {
            return;
        }
        const boardWithPiece = mergePlayerToMinoBoard(player, board);
        handleLineClear(boardWithPiece);

    }, [player.collided, gameState, board, handleLineClear]);
    
    const runCascade = useCallback(() => {
        setBoard(currentBoard => {
            const { nextBoard: steppedBoard, moved } = stepCascade(currentBoard);
            
            // If blocks are still falling, continue the animation.
            if (moved) {
                soundManager.playCascadeSound();
                return steppedBoard;
            }
    
            // --- Cascade step has finished, blocks have settled ---
            if (cascadeTimerRef.current) {
                cancelAnimationFrame(cascadeTimerRef.current);
                cascadeTimerRef.current = null;
            }
    
            const frozenBoard = freezeFallingBlocks(steppedBoard);
            
            // Check if the settled blocks created new lines.
            let clearedRowsIndexes: number[] = [];
            frozenBoard.forEach((row, y) => {
                if (row.every(cell => cell[1] === 'merged')) {
                    clearedRowsIndexes.push(y);
                }
            });
            const linesCleared = clearedRowsIndexes.length;
    
            if (linesCleared > 0) {
                // --- CHAIN REACTION ---
                soundManager.playLineClearSound();
                const linePoints = [40, 100, 300, 1200];
                const pointsEarned = (linePoints[linesCleared - 1] || 0) * (level + 1) * 1.5; // Cascade bonus
                setScore(prev => prev + pointsEarned);
    
                const newTotalLines = lines + linesCleared;
                setLines(newTotalLines);
                setLevel(Math.floor(newTotalLines / 5));
    
                // Create a new board with the newly cleared lines empty
                const boardWithEmptyRows = frozenBoard.map((row, y) => {
                    if (clearedRowsIndexes.includes(y)) {
                        return Array(BOARD_WIDTH).fill([0, 'clear'] as MinoCellData);
                    }
                    return row;
                });
    
                // Mark any new floating blocks to start the next cascade cycle
                const boardToCascadeAgain = markFloatingBlocks(boardWithEmptyRows);
                const hasFallingBlocks = boardToCascadeAgain.some(row => row.some(cell => cell[1] === 'falling'));
                
                if (hasFallingBlocks) {
                    // There are more blocks to fall, so we continue the CASCADING state
                    // by returning the new board. The useEffect will start a new animation loop.
                    return boardToCascadeAgain;
                } else {
                    // Edge case: a clear didn't cause more falling. Compact and end turn.
                    const compactedBoard = boardWithEmptyRows.filter(row => row.some(cell => cell[1] !== 'clear'));
                    while (compactedBoard.length < BOARD_HEIGHT) {
                        compactedBoard.unshift(Array(BOARD_WIDTH).fill([0, 'clear']));
                    }
                    setGameState('PLAYING');
                    resetPlayer(compactedBoard as MinoBoard);
                    return compactedBoard as MinoBoard;
                }
            } else {
                // --- CASCADE ENDS, NO NEW LINES ---
                // The board might have empty rows from previous clears that need removal.
                const compactedBoard = frozenBoard.filter(row => row.some(cell => cell[1] !== 'clear'));
                 while (compactedBoard.length < BOARD_HEIGHT) {
                    compactedBoard.unshift(Array(BOARD_WIDTH).fill([0, 'clear']));
                }
                setGameState('PLAYING');
                resetPlayer(compactedBoard as MinoBoard);
                return compactedBoard as MinoBoard;
            }
        });
    }, [lines, level, resetPlayer]);


    // useEffect to manage the cascade animation loop
    useEffect(() => {
        if (gameState !== 'CASCADING') {
            if (cascadeTimerRef.current) {
                cancelAnimationFrame(cascadeTimerRef.current);
                cascadeTimerRef.current = null;
            }
            return;
        }
        
        if (!cascadeTimerRef.current) {
            cascadeTimeRef.current = 0;
            let lastTime = 0;
            
            const loop = (time: number) => {
                if (lastTime > 0) {
                    const deltaTime = time - lastTime;
                    cascadeTimeRef.current += deltaTime;
                    if (cascadeTimeRef.current > 500) { // cascade step speed
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
            if (cascadeTimerRef.current) {
                cancelAnimationFrame(cascadeTimerRef.current);
                cascadeTimerRef.current = null;
            }
        }
    }, [gameState, runCascade]);


    return {
        board, player, pieceSuggestions, score, lines, level, gameState, dropTime,
        gameOverData, recordMove,
        setDropTime, setGameState, startGame, updatePlayerPos, setPlayer,
    };
};
