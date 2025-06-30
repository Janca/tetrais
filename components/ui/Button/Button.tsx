import React from 'react';
import './styles.css';

export const Button: React.FC<{ onClick: (event: React.MouseEvent<HTMLButtonElement>) => void; children: React.ReactNode }> = ({ onClick, children }) => (
    <button onClick={onClick} className="button">
        {children}
    </button>
);
