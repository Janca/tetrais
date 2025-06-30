import React from 'react';
import { MinoBoard, MinoCellValue } from '../../../types';
import './styles.css';

interface GameboardProps {
    board: MinoBoard;
}

const Cell: React.FC<{ type: MinoCellValue; state: string }> = React.memo(({ type, state }) => {
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

const Gameboard: React.FC<GameboardProps> = ({ board }) => {
    const visibleBoard = board.slice(2);

    return (
        <div className="gameboard-grid">
            {visibleBoard.map((row, y) => (
                <React.Fragment key={y}>
                    {row.map((cell, x) => {
                        const minoKey = cell[0];
                        const cellState = cell[1];
                        return <Cell key={`${y}-${x}`} type={minoKey} state={cellState} />;
                    })}
                </React.Fragment>
            ))}
        </div>
    );
};

export default Gameboard;
