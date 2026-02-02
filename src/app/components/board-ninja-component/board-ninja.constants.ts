export const NINJA_2D_THEMES = [
  'aaron',
  'aer',
  'aether',
  'aqua',
  'atlas',
  'backlit',
  'bubbletron',
  'classic',
  'discord',
  'essence',
  'fresh',
  'ignis',
  'luna',
  'paper',
  'retro',
  'stealth',
  'terra',
  'zen',
] as const;

export type Ninja2DThemes = (typeof NINJA_2D_THEMES)[number];
