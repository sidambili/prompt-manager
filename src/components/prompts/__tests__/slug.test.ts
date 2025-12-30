import { describe, it, expect } from 'vitest';
import { parseSlugId, buildSlugId, slugify } from '@/lib/slug';

describe('slug utilities', () => {
  describe('parseSlugId', () => {
    it('parses valid slug-id format', () => {
      const result = parseSlugId('my-prompt--abc123');
      expect(result).toEqual({ slug: 'my-prompt', id: 'abc123' });
    });

    it('returns null for invalid format', () => {
      expect(parseSlugId('invalid')).toBeNull();
      expect(parseSlugId('no-id--')).toBeNull();
      expect(parseSlugId('--no-slug')).toBeNull();
      expect(parseSlugId('multiple--dashes--here')).toBeNull();
    });
  });

  describe('buildSlugId', () => {
    it('builds canonical slug-id', () => {
      const result = buildSlugId('my-prompt', 'abc123');
      expect(result).toBe('my-prompt--abc123');
    });
  });

  describe('slugify', () => {
    it('converts title to slug', () => {
      expect(slugify('My Awesome Prompt!')).toBe('my-awesome-prompt');
      expect(slugify('Hello World')).toBe('hello-world');
      expect(slugify('   spaced   title   ')).toBe('spaced-title');
      expect(slugify('Special #$%^& Characters')).toBe('special-characters');
      expect(slugify('Multiple---Dashes')).toBe('multiple-dashes');
      expect(slugify('')).toBe('');
    });
  });
});
