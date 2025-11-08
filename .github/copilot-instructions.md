# Copilot Instructions

- Use Tanstack Router with React and TypeScript across the project.
- Use bun for all package management commands (not npm or yarn).
- Use MUI (Material-UI) for all UI components and styling.
- Prefer functional components and React hooks over class components.
- Use Zustand for state management.
- Ensure all code is written in TypeScript with strict typing.
- Put all tab-related components in a dedicated `tab` folder within the `components` directory.
- Organize workspace-related hooks in a `workspace` folder within the `components` directory.
- Maintain localization files in JSON format within the `locales` directory, supporting multiple languages.
- Doen't create too many docs, just enough to understand the project structure and coding standards.

# Folder structure reference (high-level):

```text
src/
  apps/
    server/ (hono)
    web/ (react - tanstack router)
  packages/
    auth/ (better-auth)
    db/ (prisma - postgresql)
```

### Directory Structure Guidelines

- Place all tab-related components (e.g., `EditableTabs`, `TopAppBar`) in the `tab` folder under `components`.
- Place workspace-related hooks (e.g., `useWorkspaceTabs`) in the `workspace`
  folder under `components`.
- Keep localization files organized by language in the `locales` directory.
- Store Zustand state management files in the `stores` directory.

# Coding Standards

- Always use TypeScript with strict typing.
- Use functional components and React hooks.
- Use MUI components for UI elements.
- Use Tanstack Router for routing.
- Use Zustand for state management.
- Use react-hook-form for form handling.
- Ensure code is clean, well-documented, and follows best practices
- Ensure using @/ as the base path for all imports from the `src` directory.
