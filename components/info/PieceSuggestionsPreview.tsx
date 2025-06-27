
import React from 'react';
import { Tetromino } from '../../types';
import { MiniBlock } from '../ui/MiniBlock';

export const PieceSuggestionsPreview: React.FC<{ pieces: Tetromino[] }> = ({ pieces }) => (
    <div className="minimal-panel next-piece-panel">
        <h2 className="panel-title">WORST → BEST</h2>
        <div className="next-piece-container">
            {pieces && pieces.length > 0 ? (
                pieces.map((piece) => {
                    if (!piece || piece.key === '0') return null;
                    const nonEmptyRows = piece.shape.filter(row => row.some(cell => cell !== 0));
                    if (nonEmptyRows.length === 0) return null;

                    const gridCols = piece.shape[0]?.length || 0;
                    if (gridCols === 0) return null;

                    return (
                        <div key={piece.key} className="piece-preview">
                             <div
                                className="piece-preview-grid"
                                style={{ gridTemplateColumns: `repeat(${gridCols}, 0.75rem)` }}
                            >
                                {piece.shape.map((row, y) =>
                                    row.map((cell, x) => (
                                        <div key={`${y}-${x}`} className="piece-preview-cell">
                                            {cell !== 0 && <MiniBlock />}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })
            ) : (
                <p className="ai-suggestion-description">
                    TetrAIs attempts to provide you with a high chance of the least efficient block for your current grid-fill. How many lines can you make?
                </p>
            )}
        </div>
    </div>
);
