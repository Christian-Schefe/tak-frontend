export * from './game';
export * from './base';

export type TakVariant = 'flat' | 'standing' | 'capstone';
export type TakPlayer = 'white' | 'black';

export interface TakPos {
  x: number;
  y: number;
}

export interface TakReserve {
  pieces: number;
  capstones: number;
}

export interface TakBaseGameSettings {
  boardSize: number;
  halfKomi: number;
  reserve: TakReserve;
}

export interface TakGameSettings {
  base: TakBaseGameSettings;
  timeControl: TakTimeControl;
}

export interface TakAsyncTimeControl {
  type: 'async';
  contingentMs: number;
}

export interface TakRealtimeTimeControl {
  type: 'realtime';
  contingentMs: number;
  incrementMs: number;
  extra: {
    onMove: number;
    extraMs: number;
  } | null;
}

export type TakTimeControl = TakAsyncTimeControl | TakRealtimeTimeControl;

export type TakPieceId = string;

export interface TakActionRecord {
  action: TakAction;
  pieceIds: TakPieceId[];
}

export type TakAction =
  | { type: 'place'; pos: TakPos; variant: TakVariant }
  | { type: 'move'; pos: TakPos; dir: TakDir; drops: number[] };

export const allDirections = ['up', 'down', 'left', 'right'] as const;
export type TakDir = (typeof allDirections)[number];

export type TakGameResult =
  | { type: 'win'; winner: TakPlayer; reason: 'default' | 'timeout' | 'resignation' }
  | {
      type: 'win';
      winner: TakPlayer;
      reason: 'flats';
      counts?: Record<TakPlayer, number>;
      flats?: TakPos[];
    }
  | { type: 'win'; winner: TakPlayer; reason: 'road'; road?: TakPos[] }
  | { type: 'draw' }
  | { type: 'aborted' };

export type TakGameState = { type: 'ongoing' } | TakGameResult;

export function playerOpponent(player: TakPlayer): TakPlayer {
  return player === 'white' ? 'black' : 'white';
}

export function getDefaultReserve(size: number): TakReserve {
  if (size === 3) return { pieces: 10, capstones: 0 };
  if (size === 4) return { pieces: 15, capstones: 0 };
  if (size === 5) return { pieces: 21, capstones: 1 };
  if (size === 6) return { pieces: 30, capstones: 1 };
  if (size === 7) return { pieces: 40, capstones: 2 };
  if (size === 8) return { pieces: 50, capstones: 2 };
  return { pieces: 21, capstones: 1 };
}

export function offsetPos(pos: TakPos, dir: TakDir, steps: number): TakPos {
  switch (dir) {
    case 'up':
      return { x: pos.x, y: pos.y + steps };
    case 'down':
      return { x: pos.x, y: pos.y - steps };
    case 'left':
      return { x: pos.x - steps, y: pos.y };
    case 'right':
      return { x: pos.x + steps, y: pos.y };
  }
}

export function isValidPos(size: number, pos: TakPos): boolean {
  return pos.x >= 0 && pos.x < size && pos.y >= 0 && pos.y < size;
}

export function dirFromAdjacent(to: TakPos, from: TakPos): TakDir | null {
  if (to.x === from.x && to.y === from.y + 1) return 'up';
  if (to.x === from.x && to.y === from.y - 1) return 'down';
  if (to.y === from.y && to.x === from.x + 1) return 'right';
  if (to.y === from.y && to.x === from.x - 1) return 'left';
  return null;
}

export function dirFromAligned(to: TakPos, from: TakPos): TakDir | null {
  if (to.x === from.x && to.y > from.y) return 'up';
  if (to.x === from.x && to.y < from.y) return 'down';
  if (to.y === from.y && to.x > from.x) return 'right';
  if (to.y === from.y && to.x < from.x) return 'left';
  return null;
}
