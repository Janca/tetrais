import React from 'react';
import { MinoBoard } from '../../../types';

const EffectCell: React.FC = () => {
    const style: React.CSSProperties = {
        width: '100%',
        height: '100%',
        boxShadow: 'var(--glitch-r-x1) var(--glitch-r-y1) 0 var(--glitch-red), var(--glitch-c-x1) var(--glitch-c-y1) 0 var(--glitch-cyan)',
        transition: 'box-shadow 50ms ease-in-out',
    };
    return <div style={style}></div>;
};

const GameboardBackground: React.FC<{ board: MinoBoard }> = ({ board }) => {
    const cells = board.flatMap((row, y) =>
        row.map((cell, x) => {
            const coordKey = `${y}-${x}`;
            if (cell[1] === 'merged') {
                return <EffectCell key={coordKey} />;
            }
            return <div key={coordKey}></div>; // Render an empty div to keep the grid structure
        })
    );

    return (
        <div className="gameboard-background-effects gameboard-grid">
            {cells}
        </div>
    );
};

export default GameboardBackground;