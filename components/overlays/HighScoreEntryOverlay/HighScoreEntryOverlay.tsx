import React, { useState, useRef, useEffect } from 'react';
import { OverlayContainer, Button } from '@components/ui';
import { settingsService } from '@services';
import './styles.css';

interface HighScoreEntryOverlayProps {
    score: number;
    onSubmit: (name: string) => void;
}

export const HighScoreEntryOverlay: React.FC<HighScoreEntryOverlayProps> = ({ score, onSubmit }) => {
    const [name, setName] = useState(() => settingsService.getSettings().lastPlayerName || 'Player');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onSubmit(name.trim());
        }
    };

    return (
        <OverlayContainer>
            <h1 className="overlay-title chromatic-glitch-text">HIGH SCORE!</h1>
            <p className="overlay-subtitle">You scored: {score.toLocaleString()}</p>
            <p className="overlay-subtitle" style={{marginTop: '1rem'}}>Enter your name:</p>
            <form onSubmit={handleSubmit} className="highscore-form">
                <input
                    ref={inputRef}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="name-input"
                    maxLength={10}
                    aria-label="Enter your name"
                />
                <Button onClick={()=>{/* Handled by form onSubmit */}}>SUBMIT</Button>
            </form>
        </OverlayContainer>
    );
};
