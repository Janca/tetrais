


import React from 'react';
import { OverlayContainer } from '../ui/OverlayContainer';
import { MinimalButton } from '../ui/MinimalButton';

export const GameOverOverlay: React.FC<{ score: number; onRestart: (event: React.MouseEvent<HTMLButtonElement>) => void }> = ({ score, onRestart }) => (
    <OverlayContainer>
        <h1 className="overlay-title game-over chromatic-glitch-text">GAME OVER</h1>
        <p className="overlay-subtitle">Final Score: {score}</p>
        <MinimalButton onClick={onRestart}>RESTART</MinimalButton>
    </OverlayContainer>
);
