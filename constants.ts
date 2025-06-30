import { MinoBoard, Mino, PieceKey } from './types';

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 22;

export const VISIBLE_BOARD_HEIGHT = 20;

export const createEmptyMinoBoard = (): MinoBoard => 
    Array.from({ length: BOARD_HEIGHT }, (): [0, 'clear'][] => 
        Array(BOARD_WIDTH).fill([0, 'clear'])
    );

type MinoCollection = {
    [key: string]: Mino;
};

export const MINOS: MinoCollection = {
    '0': { key: '0', shape: [[0]], color: 'transparent' },
    'I': {
        key: 'I',
        shape: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
        color: '#000000',
    },
    'J': {
        key: 'J',
        shape: [[0, 1, 0], [0, 1, 0], [1, 1, 0]],
        color: '#000000',
    },
    'L': {
        key: 'L',
        shape: [[0, 1, 0], [0, 1, 0], [0, 1, 1]],
        color: '#000000',
    },
    'O': {
        key: 'O',
        shape: [[1, 1], [1, 1]],
        color: '#000000',
    },
    'S': {
        key: 'S',
        shape: [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
        color: '#000000',
    },
    'T': {
        key: 'T',
        shape: [[1, 1, 1], [0, 1, 0], [0, 0, 0]],
        color: '#000000',
    },
    'Z': {
        key: 'Z',
        shape: [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
        color: '#000000',
    }
};

export const PIECE_KEYS: PieceKey[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];