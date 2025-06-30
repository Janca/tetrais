import React from 'react';
import { OverlayContainer, MinimalButton } from '@components/ui';
import { HighScoreTable } from '@components/info';
import { settingsService } from '@services';

export const GameOverOverlay: React.FC<{ score: number; onRestart: (event: React.MouseEvent<HTMLButtonElement>) => void }> = ({ score, onRestart }) => {
    const { highScores } = settingsService.getSettings();
    
    return (
        <OverlayContainer>
            <h1 className="overlay-title game-over chromatic-glitch-text">GAME OVER</h1>
            <p className="overlay-subtitle">Final Score: {score.toLocaleString()}</p>
            <MinimalButton onClick={onRestart}>RESTART</MinimalButton>
            {highScores && highScores.length > 0 && <HighScoreTable scores={highScores} />}
        </OverlayContainer>
    );
};
