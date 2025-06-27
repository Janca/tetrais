
import { Board, Player, PieceKey, CellData } from './types';
import { BOARD_WIDTH, BOARD_HEIGHT } from './constants';

/**
 * Checks if a player's piece is colliding with board boundaries or merged cells.
 * @param player The player object with tetromino and position.
 * @param board The game board.
 * @param move The attempted move coordinates.
 * @returns True if there is a collision, false otherwise.
 */
export const isColliding = (player: Player, board: Board, { x: moveX, y: moveY }: { x: number; y: number }): boolean => {
    for (let y = 0; y < player.tetromino.shape.length; y += 1) {
        for (let x = 0; x < player.tetromino.shape[y].length; x += 1) {
            if (player.tetromino.shape[y][x] !== 0) {
                const newY = y + player.pos.y + moveY;
                const newX = x + player.pos.x + moveX;

                if (
                    newY < 0 || // Off-screen top
                    newY >= BOARD_HEIGHT || // Off-screen bottom
                    newX < 0 || // Off-screen left
                    newX >= BOARD_WIDTH || // Off-screen right
                    (board[newY] && board[newY][newX][1] !== 'clear') // Piece collision
                ) {
                    return true;
                }
            }
        }
    }
    return false;
};

/**
 * Rotates a 2D matrix (tetromino shape) 90 degrees clockwise.
 * @param shape The matrix to rotate.
 * @returns The new rotated matrix.
 */
export const rotate = (shape: number[][]): number[][] => {
    // Transpose and reverse rows to rotate
    const rotated = shape[0].map((_, colIndex) => shape.map(row => row[colIndex]));
    return rotated.map(row => row.reverse());
};

/**
 * Merges a player's piece into the board.
 * @param player The player object.
 * @param board The current board.
 * @returns A new board state with the player's piece merged.
 */
export const mergePlayerToBoard = (player: Player, board: Board): Board => {
    const newBoard = board.map(row => row.map(cell => [...cell] as CellData));
    player.tetromino.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                const boardY = player.pos.y + y;
                const boardX = player.pos.x + x;
                if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
                    newBoard[boardY][boardX] = [player.tetromino.key as PieceKey, 'merged'];
                }
            }
        });
    });
    return newBoard;
};

/**
 * Clears completed lines from the board.
 * @param board The board to process.
 * @returns An object with the new board and the number of lines cleared.
 */
export const clearLines = (board: Board): { newBoard: Board; linesCleared: number } => {
    let linesCleared = 0;
    const newBoard = board.reduce((ack, row) => {
        if (row.every(cell => cell[1] === 'merged')) {
            linesCleared++;
            ack.unshift(Array(BOARD_WIDTH).fill([0, 'clear']));
            return ack;
        }
        ack.push(row);
        return ack;
    }, [] as Board);
    return { newBoard, linesCleared };
};
