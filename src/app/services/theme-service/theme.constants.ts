export const THEME_IDS = ['light', 'dark', 'classic', 'sunset'] as const;
export type ThemeId = (typeof THEME_IDS)[number];
