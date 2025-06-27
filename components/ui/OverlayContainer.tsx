
import React from 'react';

export const OverlayContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="overlay-container">
        <div className="minimal-panel overlay-content-box">
            {children}
        </div>
    </div>
);
