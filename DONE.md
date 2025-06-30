## Unified Tetromino Preview Component

- **Date:** 2025-06-30
- **Summary:** Refactored `HeldPiecePreview` and `PieceSuggestionsPreview` to use a new shared `TetrominoPreview` component. This eliminates duplicate code and centralizes the logic for rendering tetrominoes in preview contexts.
- **Changes:**
    - Created a new `TetrominoPreview` component under `components/ui/TetrominoPreview`.
    - Updated `HeldPiecePreview` to use `TetrominoPreview`.
    - Updated `PieceSuggestionsPreview` to use `TetrominoPreview`.
    - Removed the redundant stylesheet from `PieceSuggestionsPreview`.
    - Updated component index files to export the new `TetrominoPreview` component.