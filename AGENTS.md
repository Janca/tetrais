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

## Pull Request Guidelines

When creating a pull request, please ensure it:

1.  Includes a clear and concise description of the changes.
2.  References any related issues.
3.  Includes screenshots or GIFs for any UI changes.
4.  Remains focused on a single feature or fix.

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

All checks must pass before code can be merged.
