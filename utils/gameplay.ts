/**
 * @file gameplay.ts
 * @description
 * This file contains stateless utility functions related to Tetris gameplay logic.
 * It was created by combining the former `minosService.ts` and `gameHelpers.ts` files
 * to centralize core gameplay calculations and logic.
 *
 * Why it exists:
 * - To provide a single, authoritative source for gameplay-related functions.
 * - To ensure that all core gameplay logic is stateless and easily testable.
 * - To separate gameplay calculations from the state management and rendering logic
 *   in the React components and hooks.
 *
 * How it works:
 * - The file exports a collection of functions that take the current game state
 *   (e.g., the board, player, etc.) as input and return calculated values.
 * - The `evaluateBoard` function uses a weighted heuristic to score the current
 *   board state, which is then used by `getPieceSuggestions` to determine the
 *   "best" and "worst" pieces to offer the player.
 * - Other functions calculate the player's score, level, and the drop time of
 *   the current piece.
 */

import { MinoBoard, Player, Mino, PieceKey } from '../types';
import { BOARD_WIDTH, BOARD_HEIGHT, PIECE_KEYS, MINOS } from '../constants';
import { isColliding, rotate } from '../gameLogic';

const getNegativeSpacePenalty = (board: MinoBoard): number => {
    let penalty = 0;
    // Only penalize blocks in the top two rows (the "negative" space)
    for (let y = 0; y < 2; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
            if (board[y][x].state === 'merged') {
                // Apply a smaller penalty for using the negative space
                penalty += 0.1;
            }
        }
    }
    return penalty;
};

const getAggregateHeight = (board: MinoBoard): number => {
    let totalHeight = 0;
    for (let x = 0; x < BOARD_WIDTH; x++) {
        for (let y = 2; y < BOARD_HEIGHT; y++) { // Start from the visible board
            if (board[y][x].state === 'merged') {
                totalHeight += (BOARD_HEIGHT - y);
                break;
            }
        }
    }
    return totalHeight;
};

const getHoles = (board: MinoBoard): number => {
    let holes = 0;
    for (let x = 0; x < BOARD_WIDTH; x++) {
        let blockFound = false;
        for (let y = 2; y < BOARD_HEIGHT; y++) { // Start from the visible board
            if (board[y][x].state === 'merged') {
                blockFound = true;
            } else if (blockFound && board[y][x].state === 'clear') {
                holes++;
            }
        }
    }
    return holes;
};

const getBumpiness = (board: MinoBoard): number => {
    let bumpiness = 0;
    const heights = [];
    for (let x = 0; x < BOARD_WIDTH; x++) {
        let height = 0;
        for (let y = 2; y < BOARD_HEIGHT; y++) { // Start from the visible board
            if (board[y][x].state === 'merged') {
                height = BOARD_HEIGHT - y;
                break;
            }
        }
        heights.push(height);
    }

    for (let i = 0; i < heights.length - 1; i++) {
        bumpiness += Math.abs(heights[i] - heights[i + 1]);
    }
    return bumpiness;
};

const getLinesCleared = (board: MinoBoard): number => {
    return board.reduce((acc, row) => {
        if (row.every(cell => cell.state === 'merged')) {
            return acc + 1;
        }
        return acc;
    }, 0);
};

const getWells = (board: MinoBoard): number => {
    let wellScore = 0;
    const heights = Array(BOARD_WIDTH).fill(0);
    for (let x = 0; x < BOARD_WIDTH; x++) {
        for (let y = 2; y < BOARD_HEIGHT; y++) { // Start from the visible board
            if (board[y][x].state === 'merged') {
                heights[x] = BOARD_HEIGHT - y;
                break;
            }
        }
    }
    
    for (let x = 0; x < BOARD_WIDTH; x++) {
        const h = heights[x];
        const h_left = x > 0 ? heights[x-1] : BOARD_HEIGHT; 
        const h_right = x < BOARD_WIDTH - 1 ? heights[x+1] : BOARD_HEIGHT;
        
        const wellDepth = Math.min(h_left, h_right) - h;
        if(wellDepth > 1){
            wellScore += wellDepth;
        }
    }
    return wellScore;
};


const getTopRowClearBonus = (board: MinoBoard): number => {
    // Check if the top visible row (row 2) is one block away from being full
    const topVisibleRow = board[2];
    const blocksInRow = topVisibleRow.filter(cell => cell.state === 'merged').length;
    if (blocksInRow === BOARD_WIDTH - 1) {
        // This is a huge bonus because it can lead to a buggy Tetris
        return 50;
    }
    return 0;
};

const evaluateBoard = (board: MinoBoard): number => {
    const height = getAggregateHeight(board);
    const holes = getHoles(board);
    const bumpiness = getBumpiness(board);
    const lines = getLinesCleared(board);
    const wells = getWells(board);
    const negativeSpacePenalty = getNegativeSpacePenalty(board);
    const topRowClearBonus = getTopRowClearBonus(board);

    // Weights adjusted to maximize "pain" by heavily penalizing bad board states,
    // but also recognizing the strategic value of the new mechanics.
    return (lines * 8) - (height * 0.6) - (holes * 5) - (bumpiness * 0.3) - (wells * 2) - negativeSpacePenalty + topRowClearBonus;
};

export const getPieceSuggestions = (board: MinoBoard): Mino[] => {
    const pieceScores: { pieceKey: PieceKey; score: number }[] = [];

    for (const pieceKey of PIECE_KEYS) {
        const piece = MINOS[pieceKey];
        let bestScoreForThisPiece = -Infinity;
        
        let currentPieceShape = piece.shape;
        // Try all 4 rotations
        for (let r = 0; r < 4; r++) {
            
            // Try all horizontal positions
            for (let x = -2; x < BOARD_WIDTH; x++) {
                const tempPlayer: Player = {
                    pos: { x, y: 0 },
                    mino: { ...piece, shape: currentPieceShape },
                    collided: false,
                };

                // check if it's a valid starting position
                let validX = true;
                for(let row=0; row<currentPieceShape.length; row++){
                    for(let col=0; col<currentPieceShape[row].length; col++){
                        if(currentPieceShape[row][col] === 1){
                             if(tempPlayer.pos.x + col < 0 || tempPlayer.pos.x + col >= BOARD_WIDTH){
                                validX = false;
                                break;
                            }
                        }
                    }
                    if(!validX) break;
                }
                if(!validX) continue;
                
                // Hard drop simulation
                let y = 0;
                while (!isColliding(tempPlayer, board, { x: 0, y: y + 1 })) {
                    y++;
                }
                
                // Create a temporary board with the piece placed
                const tempBoard: MinoBoard = board.map(row => row.map(cell => ({ ...cell })));
                
                let placementPossible = true;
                for (let row = 0; row < currentPieceShape.length; row++) {
                    for (let col = 0; col < currentPieceShape[row].length; col++) {
                        if (currentPieceShape[row][col] !== 0) {
                            const newY = row + y;
                            const newX = col + x;
                            if(newY >= BOARD_HEIGHT || newX < 0 || newX >= BOARD_WIDTH || (tempBoard[newY] && tempBoard[newY][newX].state === 'merged')) {
                                placementPossible = false;
                                break;
                            }
                            if(tempBoard[newY] && tempBoard[newY][newX]) {
                                tempBoard[newY][newX] = { value: pieceKey, state: 'merged', spite: false };
                            }
                        }
                    }
                    if(!placementPossible) break;
                }
                
                if (placementPossible) {
                    const score = evaluateBoard(tempBoard);
                    if (score > bestScoreForThisPiece) {
                        bestScoreForThisPiece = score;
                    }
                }
            }
             currentPieceShape = rotate(currentPieceShape);
        }
        
        pieceScores.push({ pieceKey, score: bestScoreForThisPiece });
    }
    
    // Sort from worst score (lowest) to best score (highest).
    // This makes index 0 the "least efficient" piece.
    pieceScores.sort((a, b) => a.score - b.score);

    return pieceScores.map(item => MINOS[item.pieceKey]);
};

export const selectBiasedPiece = (suggestions: Mino[], weights: number[]): Mino => {
    if (!suggestions || suggestions.length === 0) {
        const randomKey = PIECE_KEYS[Math.floor(Math.random() * PIECE_KEYS.length)];
        return MINOS[randomKey];
    }
    
    // Fallback if weights are not provided correctly
    if (!weights || weights.length !== suggestions.length) {
        console.warn('Piece suggestion weights are invalid. Falling back to random selection.');
        const randomIndex = Math.floor(Math.random() * suggestions.length);
        return suggestions[randomIndex];
    }

    let r = Math.random();
    let cumulativeProbability = 0;
    for (let i = 0; i < weights.length; i++) {
        cumulativeProbability += weights[i];
        if (r <= cumulativeProbability) {
            return suggestions[i];
        }
    }

    // Fallback in case of floating point inaccuracies or if weights don't sum to 1
    return suggestions[suggestions.length - 1];
};

export const calculateDropTime = (linesCleared: number): number => {
    const baseDropTime = 1000;
    // Speed increases faster in the early game, then slightly slower
    const firstPhaseLines = Math.min(linesCleared, 5);
    const secondPhaseLines = Math.max(0, linesCleared - 5);
    const speedMultiplier = Math.pow(1.01, firstPhaseLines) * Math.pow(1.0125, secondPhaseLines);
    const newDropTime = baseDropTime / speedMultiplier;
    // Cap the drop time at a minimum of 50ms
    return Math.max(50, newDropTime);
};


export const calculateScore = (linesCleared: number, level: number): number => {
    const linePoints = [0, 100, 300, 500, 800];
    return linePoints[linesCleared] * (level + 1);
};

export const getLevel = (linesCleared: number): number => {
    return Math.floor(linesCleared / 10);
};
