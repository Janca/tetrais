/**
 * @file HeldPiecePreview.tsx
 * @description Displays the piece currently in the hold queue.
 */
import React from 'react';
import { Mino } from '@/types';
import { MiniBlock } from '@components/ui/MiniBlock';
import './styles.css';

interface HeldPiecePreviewProps {
    piece: Mino | null;
}

export const HeldPiecePreview: React.FC<HeldPiecePreviewProps> = ({ piece }) => {
    if (!piece) {
        return null;
    }

    // Create a 4x4 grid to display the piece
    const grid = Array(4).fill(null).map(() => Array(4).fill(0));

    // Center the piece in the grid
    const shape = piece.shape;
    const shapeHeight = shape.length;
    const shapeWidth = shape[0].length;
    const startY = Math.floor((4 - shapeHeight) / 2);
    const startX = Math.floor((4 - shapeWidth) / 2);

    for (let y = 0; y < shapeHeight; y++) {
        for (let x = 0; x < shapeWidth; x++) {
            if (shape[y][x]) {
                grid[startY + y][startX + x] = piece.key;
            }
        }
    }

    return (
        <div className="held-piece-preview">
            {grid.map((row, y) => (
                <div key={y} className="held-piece-row">
                    {row.map((cell, x) => (
                        <MiniBlock key={x} value={cell} />
                    ))}
                </div>
            ))}
        </div>
    );
};
