

import React from 'react';
import { Board, Player, CellValue, PieceKey } from '../../types';
import { isColliding } from '../../gameLogic';

interface GameboardProps {
    board: Board;
    player: Player;
}

const Cell: React.FC<{ type: CellValue; state: string }> = React.memo(({ type, state }) => {
    const style: React.CSSProperties = {
        width: '100%',
        height: '100%',
        transition: 'box-shadow 50ms ease-in-out, background-color 100ms ease-in-out',
    };

    if (state === 'ghost') {
        style.border = '1.5px dashed rgba(0, 0, 0, 0.4)';
        style.backgroundColor = 'rgba(0, 0, 0, 0.05)'
    } else if (type !== 0) {
        // All pieces (player-controlled and merged) are solid black.
        if (state === 'player' || state === 'merged') {
            style.backgroundColor = 'var(--foreground)';
        }
        
        // Only the active player piece has the chromatic effect in the foreground.
        if (state === 'player') {
            style.boxShadow = 'var(--glitch-r-x1) var(--glitch-r-y1) 0 var(--glitch-red), var(--glitch-c-x1) var(--glitch-c-y1) 0 var(--glitch-cyan)';
        }
    }

    return <div style={style}></div>;
});

const Gameboard: React.FC<GameboardProps> = ({ board, player }) => {
    // Calculate ghost piece position
    let ghostY = player.pos.y;
    if (player.tetromino.shape.some(row => row.some(cell => cell === 1))) {
        while (!isColliding(player, board, { x: 0, y: ghostY - player.pos.y + 1 })) {
            ghostY++;
        }
    }
    
    const playerPieceKey = player.tetromino.key;

    // Create maps for efficient lookup of piece locations during render.
    const playerCells = new Map<string, PieceKey>();
    const ghostCells = new Map<string, PieceKey>();

    if (playerPieceKey && playerPieceKey !== '0') {
        player.tetromino.shape.forEach((row, r) => {
            row.forEach((val, c) => {
                if (val !== 0) {
                    playerCells.set(`${r + player.pos.y}-${c + player.pos.x}`, playerPieceKey);
                    if (ghostY !== player.pos.y) {
                       ghostCells.set(`${r + ghostY}-${c + player.pos.x}`, playerPieceKey);
                    }
                }
            });
        });
    }

    const cells = board.flatMap((row, y) =>
        row.map((cell, x) => {
            const coordKey = `${y}-${x}`;
            
            if (playerCells.has(coordKey)) {
                return <Cell key={coordKey} type={playerCells.get(coordKey)!} state="player" />;
            }
            
            if (ghostCells.has(coordKey) && board[y][x][1] === 'clear') {
                return <Cell key={coordKey} type={ghostCells.get(coordKey)!} state="ghost" />;
            }
            
            return <Cell key={coordKey} type={cell[0]} state={cell[1]} />;
        })
    );

    return (
        <div className="gameboard-foreground gameboard-grid">
            {cells}
        </div>
    );
};

export default Gameboard;
