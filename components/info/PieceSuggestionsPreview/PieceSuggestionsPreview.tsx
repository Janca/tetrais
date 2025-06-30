import React from 'react';
import { Mino } from '@/types';
import { TetrominoPreview } from '@components/ui';
import '@components/ui/TetrominoPreview/styles.css';

export const PieceSuggestionsPreview: React.FC<{ pieces: Mino[], weights: number[] }> = ({ pieces, weights }) => {
    return (
        <div className="minimal-panel next-piece-panel">
            <div className="next-piece-container">
                {(
                    pieces.map((piece, index) => {
                        if (!piece || piece.key === '0') return null;
                        const nonEmptyRows = piece.shape.filter(row => row.some(cell => cell !== 0));
                        if (nonEmptyRows.length === 0) return null;

                        const gridCols = piece.shape[0]?.length || 0;
                        if (gridCols === 0) return null;

                        const weightPercentage = weights?.[index] ? (weights[index] * 100).toFixed(1) : '...';

                        return (
                            <div key={piece.key} className="piece-preview">
                                <TetrominoPreview piece={piece} />
                                <p className="piece-preview-percentage">{`${weightPercentage}%`}</p>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
