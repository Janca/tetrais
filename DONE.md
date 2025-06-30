# Refactoring Summary

I have completed a comprehensive refactoring of the Tetris codebase. The following changes were made:

## Component Refactoring

*   **`MinimalButton` replaced with `Button`**: The `MinimalButton` component was replaced with a more generic `Button` component to improve reusability. All instances of `MinimalButton` were updated to use the new `Button` component.
*   **Removed unused components**: The `HeldPiecePreview`, `Scoreboard`, and `SidePanel` components were removed from the codebase as they were either unused or provided no additional functionality over their native counterparts.
*   **Consolidated `MinoPreview`**: The `HeldPiecePreview` component was a simple wrapper around the `MinoPreview` component. It has been removed and `MinoPreview` is now used directly.

## CSS Refactoring

*   **Moved overlay styles to `styles.css`**: The styles for the `OverlayContainer` component were moved to the main `styles.css` file to improve consistency and reduce code duplication.
*   **Moved `close-button` styles to `styles.css`**: The styles for the `.close-button` class were moved to the main `styles.css` file.
*   **Removed duplicate styles**: Duplicate `panel-title` and `font-family` styles were removed from component-specific stylesheets.

These changes have resulted in a more streamlined and maintainable codebase.
