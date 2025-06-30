export type PieceKey = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';
export type MinoCellValue = 0 | PieceKey;
export type CellState = 'clear' | 'merged' | 'ghost' | 'falling' | 'player';
export type MinoCellData = {
    value: MinoCellValue;
    state: CellState;
    spite: boolean;
};
export type MinoBoard = MinoCellData[][];

export interface Mino {
    shape: number[][];
    color: string;
    key: PieceKey | '0';
}

export interface Player {
    pos: { x: number; y: number };
    mino: Mino;
    collided: boolean;
}

export type MoveAction = 'move' | 'rotate' | 'softDrop_start' | 'softDrop_end' | 'drop' | 'hardDrop';
export interface MoveRecord {
    gameTime: number;
    action: MoveAction;
    player: Player;
    details?: any;
}

export interface HighScoreEntry {
    name: string;
    score: number;
    lines: number;
    date: string;
}
