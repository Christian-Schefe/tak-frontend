import z, { object } from 'zod';
import classic from './classic.json';
import jungle from './jungle.json';
import ignis from './ignis.json';
import neon from './neon.json';
import discord from './discord.json';
import beach from './beach.json';
import assassin from './assassin.json';
import space from './space.json';
import sakura from './sakura.json';
import steampunk from './steampunk.json';
import bubblegum from './bubblegum.json';
import frost from './frost.json';
import papyrus from './papyrus.json';
import galaxy from './galaxy.json';
import mushroom from './mushroom.json';

const pieceColorSchema = z.object({
  background: z.string(),
  border: z.string(),
  text: z.string().optional(),
  capstoneOverride: z
    .object({
      background: z.string(),
      border: z.string(),
    })
    .optional(),
});

export const themeSchema = z
  .object({
    name: z.string(),
    background: z.string(),
    text: z.string(),
    board1: z.string(),
    board2: z.string(),
    tileSpecial: z
      .object({
        color: z.string(),
        border: z.string(),
        borderColor: z.string(),
        rounded: z.string().default('0'),
        size: z.string(),
        transform: z.string().optional(),
        hideBackground: z.boolean().default(false),
      })
      .strict()
      .optional(),
    highlight: z.string(),
    hover: z.string(),
    piece1: pieceColorSchema,
    piece2: pieceColorSchema,
    board: object({
      spacing: z.string(),
      rounded: z.string(),
      tiling: z.enum(['checkerboard', 'rings', 'linear', 'random']),
    }).strict(),
    pieces: object({
      rounded: z.number(),
      border: z.string(),
      shadow: z
        .object({
          opacity: z.number().min(0).max(1),
          blur: z.string(),
          offsetY: z.number(),
          color: z.string().optional(),
        })
        .strict()
        .optional(),
    }).strict(),
  })
  .strict();

export type ThemeParams = z.infer<typeof themeSchema>;

export const defaultTheme = themeSchema.parse(classic);

export type ThemeId = keyof typeof themeObj;

const themeObj = {
  classic: defaultTheme,
  jungle: themeSchema.parse(jungle),
  ignis: themeSchema.parse(ignis),
  neon: themeSchema.parse(neon),
  discord: themeSchema.parse(discord),
  beach: themeSchema.parse(beach),
  assassin: themeSchema.parse(assassin),
  space: themeSchema.parse(space),
  sakura: themeSchema.parse(sakura),
  steampunk: themeSchema.parse(steampunk),
  bubblegum: themeSchema.parse(bubblegum),
  frost: themeSchema.parse(frost),
  papyrus: themeSchema.parse(papyrus),
  galaxy: themeSchema.parse(galaxy),
  mushroom: themeSchema.parse(mushroom),
};

export const themes: Record<ThemeId, ThemeParams> = themeObj;
export const themeIds: ThemeId[] = Object.keys(themeObj) as ThemeId[];
