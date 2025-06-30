/**
 * @file GameboardBackground.tsx
 * @description
 * This component renders the background layer of the game board. Its sole purpose is to create a "glitch" texture that appears behind the frozen blocks.
 * It receives the full game board state but only renders an effect for cells that are in the "merged" state.
 * By slicing the top two rows from the board state, it ensures the glitch effect aligns perfectly with the visible frozen blocks on the foreground layer,
 * preventing any visual misalignment.
 */
import React from 'react';
import { MinoBoard } from '../../../types';
import './styles.css';

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
    const visibleBoard = board.slice(2); // Slice the board to align with the foreground
    const cells = visibleBoard.flatMap((row, y) =>
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