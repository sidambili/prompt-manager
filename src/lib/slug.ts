/**
 * Slug utilities for canonical prompt URLs.
 * Canonical format: /prompts/{slug}--{id}
 */

/**
 * Parse a slugId string into its components.
 * Returns null if the format is invalid.
 */
export function parseSlugId(slugId: string): { slug: string; id: string } | null {
  const parts = slugId.split('--');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return null;
  }
  return { slug: parts[0], id: parts[1] };
}

/**
 * Build a canonical slugId from slug and id.
 */
export function buildSlugId(slug: string, id: string): string {
  return `${slug}--${id}`;
}

/**
 * Generate a slug from a title.
 * Simple URL-friendly transformation.
 */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
