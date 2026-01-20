export type TakPlayer = 'white' | 'black';

export type TakPieceVariant = 'flat' | 'standing' | 'capstone';

export interface TakPos {
  x: number;
  y: number;
}

export type TakDir = 'up' | 'down' | 'left' | 'right';

export type TakGameState =
  | { type: 'ongoing' }
  | {
      type: 'win';
      player: TakPlayer;
      reason: 'resignation' | 'timeout' | 'timeout or resignation';
    }
  | {
      type: 'win';
      player: TakPlayer;
      reason: 'flats';
      counts?: Record<TakPlayer, number>;
      flats?: TakPos[];
    }
  | {
      type: 'win';
      player: TakPlayer;
      reason: 'road';
      road?: TakPos[];
    }
  | { type: 'draw'; reason: 'flats'; counts?: Record<TakPlayer, number> }
  | { type: 'draw'; reason: 'mutual agreement' }
  | { type: 'aborted' };

export type TakAction =
  | { type: 'place'; pos: TakPos; variant: TakPieceVariant }
  | {
      type: 'move';
      from: TakPos;
      dir: TakDir;
      drops: number[];
    };

export type TakActionRecord = (
  | { type: 'place'; pos: TakPos; variant: TakPieceVariant }
  | {
      type: 'move';
      from: TakPos;
      dir: TakDir;
      drops: number[];
      smash: boolean;
    }
) & { affectedPieces: TakPieceId[] };

export type TakPieceId = `${'W' | 'B'}/${'P' | 'C'}/${string}`;

export interface TakTrackedPiece {
  id: TakPieceId;
  player: TakPlayer;
}

export interface TakStack {
  variant: TakPieceVariant;
  composition: TakTrackedPiece[];
}

export interface TakBoard {
  size: number;
  pieces: (TakStack | null)[][];
  _idCounter: Record<TakPlayer, { pieces: number; capstones: number }>;
}

export interface TakReserve {
  pieces: number;
  capstones: number;
}

export interface TakClock {
  hasStarted: boolean;
  lastUpdate: Date | null;
  remainingMs: Record<TakPlayer, number>;
  hasGainedExtra: Record<TakPlayer, boolean>;
}

export interface TakGame {
  settings: TakGameSettings;
  board: TakBoard;
  currentPlayer: TakPlayer;
  reserves: Record<TakPlayer, TakReserve>;
  gameState: TakGameState;
  history: TakActionRecord[];
  clock?: TakClock;
}

export interface TakGameSettings {
  boardSize: number;
  halfKomi: number;
  reserve: TakReserve;
  clock?: {
    externallyDriven?: boolean;
    contingentMs: number;
    incrementMs: number;
    extra?: {
      move: number;
      amountMs: number;
    };
  };
}

export function playerOpposite(player: TakPlayer): TakPlayer {
  return player === 'white' ? 'black' : 'white';
}

export * as ui from './ui';
