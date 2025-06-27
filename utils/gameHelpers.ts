
import { Tetromino, PieceKey } from '../types';
import { TETROMINOS, PIECE_KEYS } from '../constants';

export const selectBiasedPiece = (suggestions: Tetromino[]): Tetromino => {
    if (!suggestions || suggestions.length === 0) {
        const randomKey = PIECE_KEYS[Math.floor(Math.random() * PIECE_KEYS.length)];
        return TETROMINOS[randomKey];
    }
    // Bias towards the "worse" pieces (earlier in the suggestions array)
    const biasedRandom = Math.max(Math.random(), Math.random());
    const index = Math.floor(biasedRandom * suggestions.length);
    const safeIndex = Math.max(0, Math.min(suggestions.length - 1, index));
    return suggestions[safeIndex];
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
