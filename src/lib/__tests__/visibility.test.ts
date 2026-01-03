import { describe, expect, test } from 'vitest';
import { normalizeVisibility } from '@/lib/visibility';

describe('normalizeVisibility', () => {
  test('forces is_listed=false when is_public=false', () => {
    expect(normalizeVisibility({ is_public: false, is_listed: true })).toEqual({
      is_public: false,
      is_listed: false,
    });
  });

  test('preserves public + listed', () => {
    expect(normalizeVisibility({ is_public: true, is_listed: true })).toEqual({
      is_public: true,
      is_listed: true,
    });
  });

  test('preserves public + unlisted', () => {
    expect(normalizeVisibility({ is_public: true, is_listed: false })).toEqual({
      is_public: true,
      is_listed: false,
    });
  });
});
