import React from 'react';
import { OverlayContainer, MinimalButton } from '@components/ui';
import { HighScoreTable } from '@components/info';
import { settingsService } from '@services';

export const StartGameOverlay: React.FC<{ onStart: () => void }> = ({ onStart }) => {
    const { highScores } = settingsService.getSettings();
    
    return (
        <OverlayContainer>
            <h1 className="overlay-title chromatic-text">MiNOS</h1>
            
            {highScores && highScores.length > 0 ? (
                 <HighScoreTable scores={highScores} />
            ) : (
                <p className="overlay-subtitle">Awaiting input.</p>
            )}

            <MinimalButton onClick={() => onStart()}>START</MinimalButton>
        </OverlayContainer>
    );
};
