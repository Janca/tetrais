import React from 'react';
import { OverlayContainer } from '../../ui/OverlayContainer/OverlayContainer';
import { HighScoreTable } from '../../info/HighScoreTable/HighScoreTable';
import { settingsService } from '../../../services/settingsService';
import './styles.css';

interface HighScoresOverlayProps {
    onClose: () => void;
}

export const HighScoresOverlay: React.FC<HighScoresOverlayProps> = ({ onClose }) => {
    const { highScores } = settingsService.getSettings();

    return (
        <OverlayContainer>
            <button onClick={onClose} className="close-button chromatic-text" aria-label="Close high scores">&times;</button>
            <h1 className="overlay-title chromatic-text">HIGH SCORES</h1>
            
            {highScores && highScores.length > 0 ? (
                 <HighScoreTable scores={highScores} />
            ) : (
                <p className="overlay-subtitle" style={{marginTop: '1.5rem'}}>No high scores yet. Complete a game to set one!</p>
            )}
        </OverlayContainer>
    );
};
