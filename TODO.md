# Tetrais Refactoring and Bug Fixes

## Task 1: Debug and Fix Premature Game Over
- [x] Investigate collision detection logic in `gameLogic.ts`.
- [x] Analyze how new pieces are spawned and checked in `useGameState.ts`.
- [x] Refactor game state management to be more robust and prevent incorrect game over conditions.

## Task 2: Control Body Scrollbar Based on Game State
- [x] Identify all possible game states from `types.ts`.
- [x] Implement an effect in a top-level component (e.g., `App.tsx`) that toggles `document.body.style.overflow` based on the current game state. It should be 'hidden' for all states except 'IDLE'.

## Task 3: Implement Movement Restrictions
- [x] Modify `useGameControls.ts` to prevent horizontal movement during soft or hard drops.
- [x] Add logic to `useGameControls.ts` to prevent rotation from being triggered by horizontal movement, and vice-versa. This might involve adding a small delay or a flag to distinguish between a tap for rotation and a hold for movement.