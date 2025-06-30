# Tetrais Refactoring and Bug Fixes - DONE

## Task 1: Debug and Fix Premature Game Over
- [x] Investigated collision detection logic in `gameLogic.ts`.
- [x] Analyzed how new pieces are spawned and checked in `useGameState.ts`.
- [x] Refactored the game over condition in `useGameState.ts` to only trigger when a piece is locked outside the playing field.

## Task 2: Control Body Scrollbar Based on Game State
- [x] Identified all possible game states from `types.ts` and added a `PAUSED` state.
- [x] Implemented an effect in `App.tsx` that toggles `document.body.style.overflow` based on the current game state. It is now 'hidden' for all states except 'IDLE'.

## Task 3: Implement Movement Restrictions
- [x] Modified `useGameControls.ts` to prevent horizontal movement during soft or hard drops using `isDropping` and `isRotating` refs.
- [x] Added logic to `useGameControls.ts` to prevent rotation from being triggered by horizontal movement, and vice-versa.