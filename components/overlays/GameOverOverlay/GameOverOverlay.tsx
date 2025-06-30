import React from 'react';
import { OverlayContainer, Button } from '@components/ui';
import { HighScoreTable } from '@components/info';
import { settingsService } from '@services';
import { logToFile } from '@/utils/logging';

export const GameOverOverlay: React.FC<{ score: number; onRestart: (event: React.MouseEvent<HTMLButtonElement>) => void; gameOverData: any; }> = ({ score, onRestart, gameOverData }) => {
    const { highScores } = settingsService.getSettings();

    const handleRestartClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        if (event.shiftKey) {
            logToFile(`gameover-${Date.now()}.json`, gameOverData);
        } else {
            onRestart(event);
        }
    };
    
    return (
        <OverlayContainer>
            <h1 className="overlay-title game-over chromatic-glitch-text">GAME OVER</h1>
            <p className="overlay-subtitle">Final Score: {score.toLocaleString()}</p>
            <Button onClick={handleRestartClick}>RESTART</Button>
            {highScores && highScores.length > 0 && <HighScoreTable scores={highScores} />}
        </OverlayContainer>
    );
};
