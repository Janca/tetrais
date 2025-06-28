import React from 'react';
import { HighScoreEntry } from '../../../types';
import './styles.css';

export const HighScoreTable: React.FC<{ scores: HighScoreEntry[] }> = ({ scores }) => {
    return (
        <div className="highscore-panel">
            <h2 className="highscore-title chromatic-text-2">HIGH SCORES</h2>
            <table className="highscore-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>NAME</th>
                        <th>SCORE</th>
                        <th>LINES</th>
                        <th>DATE</th>
                    </tr>
                </thead>
                <tbody>
                    {scores.map((score, index) => (
                        <tr key={index}>
                            <td>{index + 1}</td>
                            <td>{score.name}</td>
                            <td>{score.score.toLocaleString()}</td>
                            <td>{score.lines}</td>
                            <td>{score.date}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
