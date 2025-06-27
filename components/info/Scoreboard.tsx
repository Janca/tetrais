
import React from 'react';

export const Scoreboard: React.FC<{ score: number; lines: number; level: number; highScore: number; highLines: number; }> = ({ score, lines, level, highScore, highLines }) => (
    <div className="minimal-panel scoreboard-panel">
        <div className="score-row">
            <div>
                <h2 className="panel-title">SCORE</h2>
                <p className="score-value chromatic-text-2">{score.toString().padStart(7, '0')}</p>
            </div>
            <div className="score-item-right">
                <h2 className="panel-title">HIGH SCORE</h2>
                <p className="score-value chromatic-text-2">{highScore.toString().padStart(7, '0')}</p>
            </div>
        </div>

        <div className="score-row">
            <div>
                <h2 className="panel-title">LINES</h2>
                <p className="score-value chromatic-text-2">{lines}</p>
            </div>
            <div className="score-item-right">
                <h2 className="panel-title">HIGH LINES</h2>
                <p className="score-value chromatic-text-2">{highLines}</p>
            </div>
        </div>

        <div>
            <h2 className="panel-title">LEVEL</h2>
            <p className="score-value chromatic-text-2" style={{ marginBottom: 0 }}>{level}</p>
        </div>
    </div>
);
