
import React from 'react';
import { Scoreboard } from './Scoreboard';
import { PieceSuggestionsPreview } from './PieceSuggestionsPreview';
import { ControlsInfo } from './ControlsInfo';
import { Tetromino } from '../../types';

interface SidePanelProps {
    score: number;
    lines: number;
    level: number;
    pieceSuggestions: Tetromino[];
    highScore: number;
    highLines: number;
}

export const SidePanel: React.FC<SidePanelProps> = ({ score, lines, level, pieceSuggestions, highScore, highLines }) => (
    <aside className="stats-panel">
        <Scoreboard score={score} lines={lines} level={level} highScore={highScore} highLines={highLines} />
        <PieceSuggestionsPreview pieces={pieceSuggestions} />
        <ControlsInfo />
    </aside>
);
