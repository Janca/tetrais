import React, { useRef, useEffect } from 'react';
import { Mino } from '@/types';
import { MiniBlock } from '@components/ui/MiniBlock/MiniBlock';
import './styles.css';

export const PieceSuggestionsPreview: React.FC<{ pieces: Mino[], weights: number[] }> = ({ pieces, weights }) => {
    const gridRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        pieces.forEach((piece, index) => {
            if (gridRefs.current[index] && piece && piece.key !== '0') {
                const gridCols = piece.shape[0]?.length || 0;
                gridRefs.current[index]!.style.setProperty('--piece-grid-cols', gridCols.toString());
            }
        });
    }, [pieces]);

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
                                <div className="piece-grid-container">
                                    <div
                                        ref={el => gridRefs.current[index] = el}
                                        className="piece-preview-grid"
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
                                <p className="piece-preview-percentage">{`${weightPercentage}%`}</p>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
