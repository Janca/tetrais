/**
 * @file HeldPiecePreview.tsx
 * @description Displays the piece currently in the hold queue.
 */
import React from 'react';
import { Mino } from '@/types';
import { TetrominoPreview } from '@components/ui';
import '@components/ui/TetrominoPreview/styles.css';

interface HeldPiecePreviewProps {
    piece: Mino | null;
}

export const HeldPiecePreview: React.FC<HeldPiecePreviewProps> = ({ piece }) => {
    return <TetrominoPreview piece={piece} />;
};
