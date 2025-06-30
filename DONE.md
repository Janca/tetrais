## Piece Holding Feature

- Implemented the "Piece Holding" feature, allowing players to store and swap a Tetrimino.
- Added `heldPiece` and `hasSwapped` state variables to manage the hold queue.
- Created a `holdPiece` function to handle the core logic of the feature.
- Integrated a `HeldPiecePreview` component to display the held piece in the UI.
- Added a new keybinding ('C') to trigger the hold action.
- Added new sounds for the hold and error actions.
- Ensured the `hasSwapped` flag is reset correctly to prevent misuse of the feature.
