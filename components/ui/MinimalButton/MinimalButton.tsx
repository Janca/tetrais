import React from 'react';
import './styles.css';

export const MinimalButton: React.FC<{ onClick: (event: React.MouseEvent<HTMLButtonElement>) => void; children: React.ReactNode }> = ({ onClick, children }) => (
    <button onClick={onClick} className="minimal-button">
        {children}
    </button>
);
