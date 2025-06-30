

import { MinoBoard, Player, PieceKey, MinoCellData } from './types';
import { BOARD_WIDTH, BOARD_HEIGHT, VISIBLE_BOARD_HEIGHT } from './constants';

/**
 * Checks if a player's piece is colliding with board boundaries or merged cells.
 * @param player The player object with mino and position.
 * @param board The game board.
 * @param move The attempted move coordinates.
 * @returns True if there is a collision, false otherwise.
 */
export const isColliding = (player: Player, board: MinoBoard, move: { x: number; y: number }): boolean => {
    const { mino, pos } = player;
    const { shape } = mino;
    const { x: moveX, y: moveY } = move;

    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x] !== 0) {
                const newX = pos.x + x + moveX;
                const newY = pos.y + y + moveY;

                // Wall collision
                if (newX < 0 || newX >= BOARD_WIDTH) {
                    return true;
                }
                
                // Floor collision
                if (newY >= BOARD_HEIGHT) {
                    return true;
                }
                
                // Board collision - only check within the board's vertical bounds
                if (newY >= 0 && board[newY] && board[newY][newX] && board[newY][newX].state !== 'clear') {
                    return true;
                }
            }
        }
    }
    return false;
};

/**
 * Rotates a 2D matrix (mino shape) 90 degrees.
 * @param shape The matrix to rotate.
 * @param direction The direction of rotation ('cw' or 'ccw').
 * @returns The new rotated matrix.
 */
export const rotate = (shape: number[][], direction: 'cw' | 'ccw' = 'cw'): number[][] => {
    // Transpose the matrix
    const transposed = shape[0].map((_, colIndex) => shape.map(row => row[colIndex]));

    if (direction === 'cw') {
        // For clockwise, reverse the elements of each row of the transposed matrix
        return transposed.map(row => row.reverse());
    } else {
        // For counter-clockwise, reverse the rows of the transposed matrix
        return transposed.reverse();
    }
};

/**
 * Merges a player's piece into the board.
 * @param player The player object.
 * @param board The current board.
 * @returns A new board state with the player's piece merged.
 */
export const mergePlayerToMinoBoard = (player: Player, board: MinoBoard): MinoBoard => {
    const newBoard = board.map(row => row.map(cell => ({ ...cell })));
    player.mino.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                const boardY = player.pos.y + y;
                const boardX = player.pos.x + x;
                if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
                    newBoard[boardY][boardX] = { value: player.mino.key as PieceKey, state: 'merged', spite: false };
                }
            }
        });
    });
    return newBoard;
};

/**
 * Clears completed lines from the board with NES-style logic.
 * @param board The board to process.
 * @param player The current player, to determine which rows to check.
 * @returns An object with the new board and the number of lines cleared.
 */
export const clearLines = (board: MinoBoard, player: Player): { newBoard: MinoBoard; linesCleared: number } => {
    let linesCleared = 0;
    let newBoard = board.map(row => row.map(cell => ({ ...cell })));

    // In NES Tetris, line clear checks are centered around the piece's final position.
    // It checks 4 rows: 2 above the piece's center, the center row, and 1 below.
    // The "center" is the second block of the piece's internal 4x4 matrix.
    const checkRowStart = Math.max(0, player.pos.y + 1 - 2);
    const checkRowEnd = player.pos.y + 1 + 1;

    for (let y = checkRowStart; y <= checkRowEnd && y < BOARD_HEIGHT; y++) {
        const isFull = newBoard[y].every(cell => cell.state === 'merged');

        if (isFull) {
            linesCleared++;
            
            // This is the infamous NES bug. When row 0 (our row 2) is cleared,
            // the memory copy operation is flawed and shifts the *entire* board data.
            if (y === 2) { 
                // Simulate the buggy shift for the top visible row
                const shiftedBoard = newBoard.slice(1); // Drop the actual top row of the buffer
                shiftedBoard.push(Array(BOARD_WIDTH).fill({ value: 0, state: 'clear', spite: false })); // Add a new empty row at the bottom
                newBoard = shiftedBoard;
            } else {
                // Normal line clear for other rows
                const clearedRow = newBoard.splice(y, 1)[0];
                newBoard.unshift(Array(BOARD_WIDTH).fill({ value: 0, state: 'clear', spite: false }));
            }
        }
    }

    return { newBoard, linesCleared };
};

/**
 * Identifies blocks that are no longer supported and marks them as 'falling'.
 * Uses a BFS approach starting from blocks touching the ground.
 * @param board The board to process.
 * @returns A new board with floating blocks marked.
 */
export const markFloatingBlocks = (board: MinoBoard): MinoBoard => {
    const newBoard = board.map(row => row.map(cell => ({ ...cell })));
    const supported = new Set<string>();
    const queue: {x: number, y: number}[] = [];

    // 1. Find all blocks resting on the floor.
    for (let x = 0; x < BOARD_WIDTH; x++) {
        if (newBoard[BOARD_HEIGHT - 1][x].state === 'merged') {
            const key = `${x},${BOARD_HEIGHT - 1}`;
            if (!supported.has(key)) {
                supported.add(key);
                queue.push({ x, y: BOARD_HEIGHT - 1 });
            }
        }
    }

    // 2. BFS to find all connected, supported blocks.
    let head = 0;
    while (head < queue.length) {
        const { x, y } = queue[head++];
        
        // Check neighbors (up, left, right that could be supported by this block)
        const neighbors = [
            { nx: x, ny: y - 1 }, // block above
            { nx: x - 1, ny: y }, // block to the left
            { nx: x + 1, ny: y }, // block to the right
        ];

        for (const { nx, ny } of neighbors) {
            if (nx >= 0 && nx < BOARD_WIDTH && ny >= 0 && ny < BOARD_HEIGHT) {
                if (newBoard[ny][nx].state === 'merged') {
                    const key = `${nx},${ny}`;
                    if (!supported.has(key)) {
                        supported.add(key);
                        queue.push({ x: nx, y: ny });
                    }
                }
            }
        }
    }
    
    // 3. Mark all non-supported 'merged' blocks as 'falling'.
    for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
            if (newBoard[y][x].state === 'merged' && !supported.has(`${x},${y}`)) {
                newBoard[y][x].state = 'falling';
            }
        }
    }

    return newBoard;
};

/**
 * Moves all 'falling' blocks down by one step if possible.
 * @param board The board to process.
 * @returns An object with the new board and a flag indicating if any blocks moved.
 */
export const stepCascade = (board: MinoBoard): { nextBoard: MinoBoard, moved: boolean } => {
    const nextBoard = board.map(row => row.map(cell => ({ ...cell })));
    let moved = false;
    
    // Iterate from the bottom up to prevent blocks from moving more than once per step
    for (let y = BOARD_HEIGHT - 2; y >= 0; y--) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
            if (nextBoard[y][x].state === 'falling' && nextBoard[y + 1][x].state === 'clear') {
                nextBoard[y + 1][x] = nextBoard[y][x];
                nextBoard[y][x] = { value: 0, state: 'clear', spite: false };
                moved = true;
            }
        }
    }
    return { nextBoard, moved };
};

/**
 * Changes the state of all 'falling' blocks to 'merged'.
 * @param board The board to process.
 * @returns A new board with all falling blocks settled.
 */
export const freezeFallingBlocks = (board: MinoBoard): MinoBoard => {
    const newBoard = board.map(row => row.map(cell => ({ ...cell })));
    for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
            if (newBoard[y][x].state === 'falling') {
                newBoard[y][x].state = 'merged';
            }
        }
    }
    return newBoard;
};

/**
 * Calculates the position of the ghost piece.
 * @param player The player object.
 * @param board The current board.
 * @returns The y position of the ghost piece.
 */
export const calculateGhostPosition = (player: Player, board: MinoBoard): number => {
    let ghostY = player.pos.y;
    if (player.mino.shape.some(row => row.some(cell => cell === 1))) {
        while (!isColliding(player, board, { x: 0, y: ghostY - player.pos.y + 1 })) {
            ghostY++;
        }
    }
    return ghostY;
};
