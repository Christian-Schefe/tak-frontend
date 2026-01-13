export type TakVariant = 'flat' | 'standing' | 'capstone';
export type TakPlayer = 'white' | 'black';

export interface TakPos {
  x: number;
  y: number;
}
export type TakDir = 'up' | 'down' | 'left' | 'right';
export type InvalidPlaceReason = 'out-of-bounds' | 'position-occupied' | 'no-pieces-remaining';
export type InvalidMoveReason =
  | 'out-of-bounds'
  | 'no-stack-at-position'
  | 'not-enough-pieces-to-move'
  | 'cannot-move-over-standing-piece'
  | 'cannot-move-over-capstone'
  | 'invalid-drops-configuration';

export type InvalidActionReason = InvalidPlaceReason | InvalidMoveReason | 'opening-violation';

export interface TakReserve {
  flats: number;
  capstones: number;
}

export interface TakGameSettings {
  boardSize: number;
  halfKomi: number;
  reserve: TakReserve;
  timeControl: TakTimeControl;
}

export interface TakTimeControl {
  contingentMs: number;
  incrementMs: number;
  extra: {
    onMove: number;
    extraMs: number;
  } | null;
}

export type TakGameOverState =
  | { type: 'win'; winner: TakPlayer; reason: 'road' | 'flats' | 'default' }
  | { type: 'draw' };

export type TakAction =
  | { type: 'place'; pos: TakPos; variant: TakVariant }
  | { type: 'move'; pos: TakPos; dir: TakDir; drops: number[] };

export type TakActionRecord = TakAction & { remainingMs: Record<TakPlayer, number> };
