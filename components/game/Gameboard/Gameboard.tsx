/**
 * @file Gameboard.tsx
 * @description
 * Renders the main gameplay grid, which is the foreground layer of the game.
 * This component is responsible for three key visual elements:
 * 1. The active player's tetromino, which has a distinct "glitch" effect to make it stand out.
 * 2. The "ghost" piece, a transparent outline showing where the active piece will land.
 * 3. The "frozen" or "merged" blocks. These are styled to appear as a single, solid mass by dynamically removing the borders between adjacent cells.
 *    This creates a clean, unified look for the settled pieces, contrasting with the active piece.
 */
import React from 'react';
import { MinoBoard, MinoCellValue } from '../../../types';
import './styles.css';

interface GameboardProps {
    board: MinoBoard;
}

const Cell: React.FC<{ type: MinoCellValue; state: string; y: number; x: number; board: MinoBoard }> = React.memo(({ type, state, y, x, board }) => {
    const style: React.CSSProperties = {
        width: '100%',
        height: '100%',
        transition: 'box-shadow 50ms ease-in-out, background-color 100ms ease-in-out',
    };

    if (state === 'ghost') {
        style.border = '1.5px dashed rgba(0, 0, 0, 0.4)';
        style.backgroundColor = 'rgba(0, 0, 0, 0.05)'
    } else if (type !== 0) {
        if (state === 'player' || state === 'merged') {
            style.backgroundColor = 'var(--foreground)';
        }
        
        if (state === 'merged') {
            // Check adjacent cells to remove borders and create a solid mass
            const isAboveMerged = y > 0 && board[y - 1][x][1] === 'merged';
            const isBelowMerged = y < board.length - 1 && board[y + 1][x][1] === 'merged';
            const isLeftMerged = x > 0 && board[y][x - 1][1] === 'merged';
            const isRightMerged = x < board[0].length - 1 && board[y][x + 1][1] === 'merged';

            if (isAboveMerged) style.borderTop = 'none';
            if (isBelowMerged) style.borderBottom = 'none';
            if (isLeftMerged) style.borderLeft = 'none';
            if (isRightMerged) style.borderRight = 'none';
        }

        if (state === 'player') {
            style.boxShadow = 'var(--glitch-r-x1) var(--glitch-r-y1) 0 var(--glitch-red), var(--glitch-c-x1) var(--glitch-c-y1) 0 var(--glitch-cyan)';
        }
    }

    return <div style={style} className={`gameboard-cell ${state} mino-${type}`}></div>;
});

const Gameboard: React.FC<GameboardProps> = ({ board }) => {
    const visibleBoard = board.slice(2);

    return (
        <div className="gameboard-grid gameboard-foreground">
            {visibleBoard.map((row, y) => (
                <React.Fragment key={y}>
                    {row.map((cell, x) => {
                        const minoKey = cell[0];
                        const cellState = cell[1];
                        return <Cell key={`${y}-${x}`} type={minoKey} state={cellState} y={y} x={x} board={visibleBoard} />;
                    })}
                </React.Fragment>
            ))}
        </div>
    );
};

export default Gameboard;
