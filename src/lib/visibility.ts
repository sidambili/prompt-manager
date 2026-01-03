export type VisibilityInput = {
  is_public: boolean;
  is_listed: boolean;
};

export function normalizeVisibility(input: VisibilityInput): VisibilityInput {
  if (!input.is_public) {
    return {
      is_public: false,
      is_listed: false,
    };
  }

  return input;
}
