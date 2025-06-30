# Project Agents.md Guide for Tetrais

This Agents.md file provides comprehensive guidance for AI agents working with the Tetrais codebase.

## Project Structure

The project follows a standard React structure. New files should be placed in the appropriate directories.

- `/src`: Source code.
  - `/components`: Reusable React components.
    - Each component should be in its own directory with its name in `PascalCase`.
    - Component directories should contain the component file (`.tsx`) and its corresponding stylesheet (`.css`).
  - `/hooks`: Custom React hooks.
  - `/services`: Services for business logic, such as game logic and sound management.
  - `/utils`: General-purpose utility functions.
- `/public`: Static assets that are served directly by the web server.

**Note:** Use `index.ts` files to export modules from directories where appropriate to simplify imports.

## Coding Conventions

### General
- All new code must be written in TypeScript.
- Follow the existing code style.
- Use meaningful and descriptive names for variables, functions, and components.
- Add comments to explain complex or non-obvious logic.
- Before creating new functionality, scan the existing codebase to avoid duplication.

### React & Component Guidelines
- Use functional components with hooks.
- Keep components small, focused, and reusable.
- Component filenames must be in `PascalCase` (e.g., `GameArea.tsx`).
- Use `useState` for local component state and `useReducer` for more complex state logic.
- For shared state, consider using React Context or a state management library if the need arises.

### CSS/Styling Standards
- Use CSS for all styling.
- Component-specific styles should be located in a `styles.css` file within the component's directory.
- Use a consistent naming convention for CSS classes to maintain clarity and avoid conflicts.

## File Docblocks

Every new source file (`.ts` or `.tsx`) must begin with a JSDoc-style docblock. This documentation is critical for maintaining context and helping other agents understand the file's purpose and implementation details.

When creating or editing a file, ensure its docblock is present and up-to-date.

### Docblock Content
A good docblock should be concise yet informative, explaining:
- **@file:** The name of the file.
- **@description:** A clear explanation of the file's purpose.
- **Why it exists:** The problem it solves or the feature it provides.
- **How it works:** A brief overview of the implementation, especially for complex logic or visual effects.
- **Visual Aesthetic (for UI components):** Describe the intended look and feel and how the code achieves it.

### Example: A Complex UI Component (`GameArea.tsx`)
```typescript
/**
 * @file GameArea.tsx
 * @description
 * This component serves as the central hub for the main gameplay screen. It orchestrates the rendering of two distinct, layered components:
 * 1. `GameboardBackground`: Renders a subtle "glitch" effect behind where the frozen blocks are.
 * 2. `Gameboard`: Renders the actual gameplay elements, including the active player piece, the ghost piece, and the frozen blocks.
 *
 * This two-layer approach is crucial for the desired visual aesthetic. We want the frozen blocks to appear as a single, solid, dark mass.
 * The glitch effect from the background layer provides a subtle, stylized texture that is visible "through" this mass, while the active
 * player piece has its own distinct glitch effect on the top layer to make it stand out.
 */
```

### Example: A Component with Specific Styling Logic (`Gameboard.tsx`)
```typescript
/**
 * @file Gameboard.tsx
 * @description
 * Renders the main gameplay grid, which is the foreground layer of the game.
 * This component is responsible for three key visual elements:
 * 1. The active player's tetromino, which has a distinct "glitch" effect to make it stand out.
 * 2. The "ghost" piece, a transparent outline showing where the active piece will land.
 * 3. The "frozen" or "merged" blocks. These are styled to appear as a single, solid mass by dynamically removing the borders between adjacent cells.
 *    This creates a clean, unified look for the settled pieces, contrasting with the active piece.
 */
```

## Git Workflow

This project uses a local Git repository to track changes. All changes should be committed to the local repository. There is no need to push changes to a remote repository.

When committing changes, please follow these guidelines:

1.  **Add all changed files:** Use `git add .` to stage all changes.
2.  **Write a clear commit message:** The commit message should be a single line and should concisely describe the changes made.

## Programmatic Checks

Before submitting changes, run the following commands to ensure code quality and prevent build failures:

```bash
# Build for production
npm run build
```

---

When completed with your task, commit your changes.
