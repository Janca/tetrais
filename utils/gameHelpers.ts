import { Mino } from '../types';
import { MINOS, PIECE_KEYS } from '../constants';

export const selectBiasedPiece = (suggestions: Mino[], weights: number[]): Mino => {
    if (!suggestions || suggestions.length === 0) {
        const randomKey = PIECE_KEYS[Math.floor(Math.random() * PIECE_KEYS.length)];
        return MINOS[randomKey];
    }
    
    // Fallback if weights are not provided correctly
    if (!weights || weights.length !== suggestions.length) {
        console.warn('Piece suggestion weights are invalid. Falling back to random selection.');
        const randomIndex = Math.floor(Math.random() * suggestions.length);
        return suggestions[randomIndex];
    }

    let r = Math.random();
    let cumulativeProbability = 0;
    for (let i = 0; i < weights.length; i++) {
        cumulativeProbability += weights[i];
        if (r <= cumulativeProbability) {
            return suggestions[i];
        }
    }

    // Fallback in case of floating point inaccuracies or if weights don't sum to 1
    return suggestions[suggestions.length - 1];
};

export const calculateDropTime = (linesCleared: number): number => {
    const baseDropTime = 1000;
    // Speed increases faster in the early game, then slightly slower
    const firstPhaseLines = Math.min(linesCleared, 5);
    const secondPhaseLines = Math.max(0, linesCleared - 5);
    const speedMultiplier = Math.pow(1.01, firstPhaseLines) * Math.pow(1.0125, secondPhaseLines);
    const newDropTime = baseDropTime / speedMultiplier;
    // Cap the drop time at a minimum of 50ms
    return Math.max(50, newDropTime);
};