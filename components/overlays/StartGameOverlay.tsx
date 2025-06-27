


import React from 'react';
import { OverlayContainer } from '../ui/OverlayContainer';
import { MinimalButton } from '../ui/MinimalButton';

export const StartGameOverlay: React.FC<{ onStart: () => void }> = ({ onStart }) => (
    <OverlayContainer>
        <h1 className="overlay-title chromatic-text">Malice</h1>
        <p className="overlay-subtitle">Awaiting input.</p>
        <MinimalButton onClick={() => onStart()}>START</MinimalButton>
    </OverlayContainer>
);
