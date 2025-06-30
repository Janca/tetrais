import React, { useState, useEffect } from 'react';
import { OverlayContainer, MinimalButton } from '@components/ui';
import './styles.css';

const DOUBLE_TAP_WINDOW_MS = 300;

interface PauseOverlayProps {
    onUnpause: () => void;
    onRestart: () => void;
}

export const PauseOverlay: React.FC<PauseOverlayProps> = ({ onUnpause, onRestart }) => {
    const [isMobile, setIsMobile] = useState(false);
    const [lastTapTime, setLastTapTime] = useState(0);

    useEffect(() => {
        const mobileCheck = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        setIsMobile(mobileCheck);
    }, []);

    const handleTap = () => {
        if (!isMobile) return;

        const currentTime = Date.now();
        if (currentTime - lastTapTime < DOUBLE_TAP_WINDOW_MS) {
            onUnpause();
        }
        setLastTapTime(currentTime);
    };

    const handleRestartClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        onRestart();
    };

    return (
        <OverlayContainer onTouchEnd={isMobile ? handleTap : undefined} onClick={!isMobile ? onUnpause : undefined}>
            <h1 className="overlay-title chromatic-text">PAUSED</h1>
            <div className="pause-overlay-buttons">
                <MinimalButton onClick={handleRestartClick}>Restart</MinimalButton>
            </div>
            <p className="overlay-subtitle">
                {isMobile ? 'Double-Tap to Resume' : "Press 'P' to resume."}
            </p>
        </OverlayContainer>
    );
};
