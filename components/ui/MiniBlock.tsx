
import React from 'react';

export const MiniBlock: React.FC = () => (
    <div style={{
        width: '100%',
        height: '100%',
        border: '1px solid var(--foreground)',
        boxShadow: '1px 1px 0 var(--glitch-red), -1px -1px 0 var(--glitch-cyan)',
        backgroundColor: 'rgba(0, 0, 0, 1.0)',
     }}></div>
);
