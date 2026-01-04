# Changelog

## 1.0.0 - 2026-01-03

### Added
- Fullscreen “Create Prompt” modal with improved tag inputs, PromptViewer styling, and PWA-friendly layout.
- Prompt versioning timeline with commit messages, hover details, and restore controls.
- Metadata change logging system with editor UI to inspect non-content changes.
- Visibility inspector that clarifies Public vs Listed semantics and handles SEO `noindex`.
- UI building blocks (RevisionHistory panel, hover cards) and Supabase migrations for revision triggers, commit messages, and metadata events.

### Changed
- PromptViewer and creation flows now share consistent styling and avoid nested scroll areas.
- Visibility toggles automatically enforce `is_public => is_listed` invariants and display clearer helper copy.

### Fixed
- Ensured dashboards no longer show double scrollbars in viewer/editor tabs.
- Eliminated missing commit message edge cases by normalizing blank input to `null`.

## 0.0.1 - 2025-12-28

### Added
- Initial implementation of PromptManager.