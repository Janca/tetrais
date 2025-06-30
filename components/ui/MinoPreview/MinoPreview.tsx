import React, { useRef, useEffect } from 'react';
import { Mino } from '@/types';
import { MiniBlock } from '@components/ui/MiniBlock';
import './styles.css';

interface MinoPreviewProps {
    piece: Mino | null;
}

export const MinoPreview: React.FC<MinoPreviewProps> = ({ piece }) => {
    const gridRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (gridRef.current && piece && piece.key !== '0') {
            const gridCols = piece.shape[0]?.length || 0;
            gridRef.current!.style.setProperty('--piece-grid-cols', gridCols.toString());
        }
    }, [piece]);

    if (!piece) {
        return (
            <div className="piece-preview">
                <div className="piece-grid-container">
                    <div className="piece-preview-grid" />
                </div>
            </div>
        );
    }

    return (
        <div className="piece-preview">
            <div className="piece-grid-container">
                <div
                    ref={gridRef}
                    className="piece-preview-grid"
                >
                    {piece.shape.map((row, y) =>
                        row.map((cell, x) => (
                            <div key={`${y}-${x}`} className="piece-preview-cell">
                                {cell !== 0 && <MiniBlock value={piece.key} />}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};