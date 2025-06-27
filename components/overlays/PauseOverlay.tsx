
import React from 'react';
import { OverlayContainer } from '../ui/OverlayContainer';

export const PauseOverlay: React.FC = () => (
     <OverlayContainer>
        <h1 className="overlay-title chromatic-text">PAUSED</h1>
        <p className="overlay-subtitle">Press 'P' to resume.</p>
    </OverlayContainer>
);
