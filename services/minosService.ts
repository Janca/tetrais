import { MinoBoard, Player, Mino, PieceKey } from '../types';
import { BOARD_WIDTH, BOARD_HEIGHT, PIECE_KEYS, MINOS } from '../constants';
import { isColliding, rotate } from '../gameLogic';

const getAggregateHeight = (board: MinoBoard): number => {
    let totalHeight = 0;
    for (let x = 0; x < BOARD_WIDTH; x++) {
        for (let y = 0; y < BOARD_HEIGHT; y++) {
            if (board[y][x][1] === 'merged') {
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
        for (let y = 0; y < BOARD_HEIGHT; y++) {
            if (board[y][x][1] === 'merged') {
                blockFound = true;
            } else if (blockFound && board[y][x][1] === 'clear') {
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
        for (let y = 0; y < BOARD_HEIGHT; y++) {
            if (board[y][x][1] === 'merged') {
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
        if (row.every(cell => cell[1] === 'merged')) {
            return acc + 1;
        }
        return acc;
    }, 0);
};

const getWells = (board: MinoBoard): number => {
    let wellScore = 0;
    const heights = Array(BOARD_WIDTH).fill(0);
    for (let x = 0; x < BOARD_WIDTH; x++) {
        for (let y = 0; y < BOARD_HEIGHT; y++) {
            if (board[y][x][1] === 'merged') {
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


const evaluateBoard = (board: MinoBoard): number => {
    const height = getAggregateHeight(board);
    const holes = getHoles(board);
    const bumpiness = getBumpiness(board);
    const lines = getLinesCleared(board);
    const wells = getWells(board);

    // Weights adjusted to maximize "pain" by heavily penalizing bad board states.
    return (lines * 8) - (height * 0.6) - (holes * 5) - (bumpiness * 0.3) - (wells * 2);
};

export const getPieceSuggestions = (board: MinoBoard): Mino[] => {
    const pieceScores: { pieceKey: PieceKey; score: number }[] = [];

    const isBoardEmpty = board.every(row => row.every(cell => cell[1] === 'clear'));
    
    for (const pieceKey of PIECE_KEYS) {
        const piece = MINOS[pieceKey];
         if (isBoardEmpty) {
            pieceScores.push({ pieceKey, score: 0 });
            continue;
        }

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
                const tempBoard: MinoBoard = board.map(row => row.map(cell => [...cell]));
                
                let placementPossible = true;
                for (let row = 0; row < currentPieceShape.length; row++) {
                    for (let col = 0; col < currentPieceShape[row].length; col++) {
                        if (currentPieceShape[row][col] !== 0) {
                            const newY = row + y;
                            const newX = col + x;
                            if(newY >= BOARD_HEIGHT || newX < 0 || newX >= BOARD_WIDTH || (tempBoard[newY] && tempBoard[newY][newX][1] === 'merged')) {
                                placementPossible = false;
                                break;
                            }
                            if(tempBoard[newY] && tempBoard[newY][newX]) {
                                tempBoard[newY][newX] = [pieceKey, 'merged'];
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
    
    if (isBoardEmpty) {
        pieceScores.sort(() => Math.random() - 0.5);
    } else {
        // Sort from worst score (lowest) to best score (highest).
        // This makes index 0 the "least efficient" piece.
        pieceScores.sort((a, b) => a.score - b.score);
    }

    return pieceScores.map(item => MINOS[item.pieceKey]);
};