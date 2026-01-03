# Contributing to PromptManager

First off, thank you for considering contributing to PromptManager! It's people like you that make PromptManager such a great tool.

PromptManager is an open-source, self-hostable prompt management platform built for automation engineers and developers. We follow a strict architectural path to ensure the project remains clean, modular, and easy to maintain.

## Table of Contents
- [Contributing to PromptManager](#contributing-to-promptmanager)
  - [Table of Contents](#table-of-contents)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Local Setup](#local-setup)
  - [Development Workflow](#development-workflow)
    - [Branching Strategy](#branching-strategy)
    - [Commits](#commits)
  - [Coding Standards](#coding-standards)
    - [General Rules](#general-rules)
    - [Components](#components)
  - [Database Migrations](#database-migrations)
  - [Pull Request Process](#pull-request-process)
  - [License](#license)

---

## Getting Started

### Prerequisites
- **Node.js**: v18 or later
- **Docker**: Required for local Supabase instance
- **Supabase CLI**: `npm install -g supabase`

### Local Setup
1. **Clone the repository**:
   ```bash
   git clone https://github.com/sidambili/prompt-manager.git
   cd prompt-manager
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start Supabase (Docker required)**:
   ```bash
   npx supabase start
   ```

4. **Initialize Database**:
   ```bash
   npx supabase db reset
   npx supabase db seed
   ```

5. **Start Next.js Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## Development Workflow

### Branching Strategy
- Create a new branch for each feature or bug fix: `feature/your-feature-name` or `fix/issue-description`.
- Keep branches small and focused.

### Commits
- Use descriptive commit messages.
- Follow conventional commits if possible (e.g., `feat: add variable extraction`, `fix: resolve auth redirect`).

---

## Coding Standards

We maintain a high standard for code quality. Please follow these guidelines:

### General Rules
- **TypeScript**: Use strict mode. Define explicit types/interfaces for all data structures.
- **Naming Conventions**:
  - Components: `PascalCase` (e.g., `PromptViewer.tsx`)
  - Hooks: `camelCase` starting with `use` (e.g., `useAuth.ts`)
  - Utilities: `camelCase` (e.g., `formatDate.ts`)
- **Styling**: Always use Tailwind CSS semantic tokens. Avoid raw literals for colors or spacing.
- **Accessibility**: All interactive elements MUST have unique IDs and proper ARIA labels.

### Components
- Keep components modular and reusable.
- Preferred file size: < 500 lines (Hard limit: 1000 lines).
- Organize by responsibility, not convenience.

---

## Database Migrations

PromptManager uses Supabase for database management.

1. **New Migrations**: Create a new migration file using the CLI:
   ```bash
   npx supabase migration new your_migration_name
   ```
2. **SQL Guidelines**:
   - migrations live in `src/supabase/migrations`.
   - Never modify an existing migration file that has been merged.
   - Always include Row Level Security (RLS) policies for new tables.
3. **Testing**: Run `npx supabase db reset` to ensure the migration applies cleanly.

---

## Pull Request Process

1. **Update Documentation**: If you're changing behavior, update the relevant docs in `docs/`.
2. **Tests**: Ensure all tests pass (`npm run test`).
3. **Review**: All PRs require at least one review from the core maintainers.
4. **No Dead Code**: Remove any unused functions, modules, or commented-out code before submitting.

---

## License
By contributing to PromptManager, you agree that your contributions will be licensed under the MIT License.
