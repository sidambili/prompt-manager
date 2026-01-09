# Changelog

## 1.2.0 (2026-01-08)

### Added
- Categories and Subcategories CRUD with owner-scoped permissions and public/private visibility
- Dashboard categories management page with search, create, edit, delete flows
- Category detail page showing prompts assigned directly or via subcategories
- Modal forms `CategoryForm` and `SubcategoryForm` with validation and slug auto-generation
- Database migrations for `categories` and `subcategories` tables with RLS policies
- RPC `delete_subcategory_reassign_prompts` for safe subcategory deletion
- Breadcrumb navigation and category/subcategory badges in PromptViewer
- Dashboard "Explore Collections" quick access link
- Vitest/RTL integration test suite for categories page UI and permissions
- Global ResizeObserver stub in test setup for Radix Dialog compatibility

### Changed
- Prompts can be assigned to `category_id` or `subcategory_id` (mutually exclusive)
- Subcategory deletion now reassigns prompts to parent category instead of leaving unassigned
- Updated prompts queries to support direct category assignments
## 1.1.0 (2026-01-03)
- Added reusable CopyButton component with unified brand styling.
- Fixed sticky positioning in Dashboard layout.
- Implemented floating copy buttons in Prompt Viewer (Template & Output tabs).
- Audited and added unique HTML IDs to PromptViewer and PromptEditor.
- Refactored components to use Sonner for consistent toast notifications.

## 1.0.0 (2026-01-03)

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

## 0.0.1 (2025-12-28)

### Added
- Initial implementation of PromptManager.