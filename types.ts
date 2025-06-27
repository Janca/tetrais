export type PieceKey = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';
export type CellValue = 0 | PieceKey;
export type CellState = 'clear' | 'merged' | 'ghost';
export type CellData = [CellValue, CellState];
export type Board = CellData[][];

export interface Tetromino {
    shape: number[][];
    color: string;
    key: PieceKey | '0';
}

export interface Player {
    pos: { x: number; y: number };
    tetromino: Tetromino;
    collided: boolean;
}

export type MoveAction = 'move' | 'rotate' | 'softDrop_start' | 'softDrop_end' | 'drop' | 'hardDrop';
export interface MoveRecord {
    gameTime: number;
    action: MoveAction;
    player: Player;
    details?: any;
}
