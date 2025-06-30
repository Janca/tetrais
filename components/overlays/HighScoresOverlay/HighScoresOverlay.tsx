import React, { useState } from 'react';
import { OverlayContainer } from '@components/ui/OverlayContainer/OverlayContainer';
import { HighScoreTable } from '@components/info/HighScoreTable/HighScoreTable';
import { settingsService } from '@services/settingsService';
import { MinimalButton } from '@components/ui/MinimalButton/MinimalButton';
import './styles.css';

interface HighScoresOverlayProps {
    onClose: () => void;
}

export const HighScoresOverlay: React.FC<HighScoresOverlayProps> = ({ onClose }) => {
    const [scores, setScores] = useState(settingsService.getSettings().highScores);

    const handleClearScores = () => {
        settingsService.clearHighScores();
        setScores([]);
    };

    return (
        <OverlayContainer>
            <button onClick={onClose} className="close-button chromatic-text" aria-label="Close high scores">&times;</button>
            <h1 className="overlay-title chromatic-text">HIGH SCORES</h1>
            
            {scores && scores.length > 0 ? (
                 <>
                    <HighScoreTable scores={scores} />
                    <div className="clear-scores-container">
                        <MinimalButton onClick={handleClearScores}>Clear High Scores</MinimalButton>
                    </div>
                 </>
            ) : (
                <p className="overlay-subtitle" style={{marginTop: '1.5rem'}}>No high scores yet. Complete a game to set one!</p>
            )}
        </OverlayContainer>
    );
};
