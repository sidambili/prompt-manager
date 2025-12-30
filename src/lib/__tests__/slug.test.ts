import { describe, it, expect } from 'vitest';

import { buildSlugId, parseSlugId, slugify } from '../slug';

describe('slug utilities', () => {
  it('buildSlugId builds canonical slugId', () => {
    expect(buildSlugId('hello-world', '123')).toBe('hello-world--123');
  });

  it('parseSlugId parses canonical slugId', () => {
    expect(parseSlugId('hello-world--123')).toEqual({ slug: 'hello-world', id: '123' });
  });

  it('parseSlugId returns null for invalid slugId', () => {
    expect(parseSlugId('missing')).toBeNull();
    expect(parseSlugId('--123')).toBeNull();
    expect(parseSlugId('hello--')).toBeNull();
    expect(parseSlugId('a--b--c')).toBeNull();
  });

  it('slugify produces a url-friendly slug', () => {
    expect(slugify('  Hello, World!  ')).toBe('hello-world');
  });
});
