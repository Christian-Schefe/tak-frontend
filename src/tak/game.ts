import {
  InvalidActionReason,
  TakAction,
  TakActionRecord,
  TakGameOverState,
  TakGameSettings,
  TakPlayer,
  TakReserve,
} from '.';
import {
  TakBoard,
  takBoardCanDoMove,
  takBoardCanDoPlace,
  takBoardCheckForRoad,
  takBoardComputeHash,
  takBoardCountFlats,
  takBoardIsFull,
  takBoardMove,
  takBoardNew,
  takBoardPlace,
} from './board';

export interface TakFinishedBaseGame {
  gameState: TakGameOverState;
}

export interface TakOngoingBaseGame {
  settings: TakGameSettings;
  board: TakBoard;
  currentPlayer: TakPlayer;
  reserves: Record<TakPlayer, TakReserve>;
  boardHashHistory: Partial<Record<string, number>>;
  plyIndex: number;
}

export function takOngoingBaseGameNew(settings: TakGameSettings): TakOngoingBaseGame {
  const board = takBoardNew(settings.boardSize);
  return {
    settings,
    board,
    currentPlayer: 'white',
    reserves: {
      white: { ...settings.reserve },
      black: { ...settings.reserve },
    },
    boardHashHistory: {},
    plyIndex: 0,
  };
}

export function takOngoingBaseGameCanDoAction(
  self: TakOngoingBaseGame,
  action: TakAction,
): InvalidActionReason | null {
  if (action.type === 'place') {
    if (self.plyIndex < 2 && action.variant !== 'flat') {
      return 'opening-violation';
    }
    if (
      self.reserves[self.currentPlayer][action.variant === 'capstone' ? 'capstones' : 'flats'] <= 0
    ) {
      return 'no-pieces-remaining';
    }
    return takBoardCanDoPlace(self.board, action.pos);
  } else {
    if (self.plyIndex < 2) {
      return 'opening-violation';
    }
    return takBoardCanDoMove(self.board, action.pos, action.dir, action.drops);
  }
}

export function takOngoingBaseGameDoAction(
  self: TakOngoingBaseGame,
  action: TakAction,
):
  | { type: 'error'; reason: InvalidActionReason }
  | { type: 'game-over'; game: TakFinishedBaseGame }
  | null {
  const invalidReason = takOngoingBaseGameCanDoAction(self, action);
  if (invalidReason !== null) {
    return { type: 'error', reason: invalidReason };
  }
  if (action.type === 'place') {
    const placeColor =
      self.plyIndex < 2 ? (self.currentPlayer === 'white' ? 'black' : 'white') : self.currentPlayer;
    self.reserves[self.currentPlayer][action.variant === 'capstone' ? 'capstones' : 'flats'] -= 1;
    takBoardPlace(self.board, action.pos, action.variant, placeColor);
  } else {
    takBoardMove(self.board, action.pos, action.dir, action.drops);
  }
  const boardHash = takBoardComputeHash(self.board);
  self.boardHashHistory[boardHash] = (self.boardHashHistory[boardHash] ?? 0) + 1;

  const maybeFinished = checkGameOver(self, boardHash);
  if (maybeFinished !== null) {
    return { type: 'game-over', game: { gameState: maybeFinished } };
  }

  self.plyIndex += 1;
  self.currentPlayer = self.currentPlayer === 'white' ? 'black' : 'white';

  return null;
}

function checkGameOver(self: TakOngoingBaseGame, boardHash: string): TakGameOverState | null {
  const whiteReserveEmpty = self.reserves.white.flats === 0 && self.reserves.white.capstones === 0;
  const blackReserveEmpty = self.reserves.black.flats === 0 && self.reserves.black.capstones === 0;

  const currentOpponent = self.currentPlayer === 'white' ? 'black' : 'white';

  if (takBoardCheckForRoad(self.board, self.currentPlayer)) {
    return { type: 'win', winner: self.currentPlayer, reason: 'road' };
  } else if (takBoardCheckForRoad(self.board, currentOpponent)) {
    return {
      type: 'win',
      winner: currentOpponent,
      reason: 'road',
    };
  } else if (whiteReserveEmpty || blackReserveEmpty || takBoardIsFull(self.board)) {
    const flatCounts = takBoardCountFlats(self.board);
    const whiteScore = flatCounts.white * 2;
    const blackScore = flatCounts.black * 2 + self.settings.halfKomi;

    if (whiteScore > blackScore) {
      return {
        type: 'win',
        winner: 'white',
        reason: 'flats',
      };
    } else if (blackScore > whiteScore) {
      return {
        type: 'win',
        winner: 'black',
        reason: 'flats',
      };
    } else {
      return {
        type: 'draw',
      };
    }
  } else if ((self.boardHashHistory[boardHash] ?? 0) >= 3) {
    return {
      type: 'draw',
    };
  }
  return null;
}

export interface TakFinishedGame {
  base: TakFinishedBaseGame;
  actionHistory: TakActionRecord[];
  timeRemainingMs: Record<TakPlayer, number>;
}

export interface TakOngoingGame {
  base: TakOngoingBaseGame;
  actionHistory: TakActionRecord[];
  clock: TakClock;
}

export type TakGame =
  | {
      type: 'ongoing';
      game: TakOngoingGame;
    }
  | {
      type: 'finished';
      game: TakFinishedGame;
    };

export interface TakClock {
  remainingMs: Record<TakPlayer, number>;
  lastUpdateTimestamp: number;
  hasGainedExtraTime: Record<TakPlayer, boolean>;
  isTicking: boolean;
}

export function takOngoingGameNew(settings: TakGameSettings): TakOngoingGame {
  const base = takOngoingBaseGameNew(settings);
  const clock: TakClock = {
    remainingMs: {
      white: settings.timeControl.contingentMs,
      black: settings.timeControl.contingentMs,
    },
    lastUpdateTimestamp: Date.now(),
    hasGainedExtraTime: {
      white: false,
      black: false,
    },
    isTicking: true,
  };
  return {
    base,
    actionHistory: [],
    clock,
  };
}

function maybeApplyElapsed(
  self: TakOngoingGame,
  now: number,
  player: TakPlayer,
  addIncrement: boolean,
) {
  if (self.clock.isTicking) {
    const elapsed = Math.max(0, now - self.clock.lastUpdateTimestamp);
    self.clock.remainingMs[player] = Math.max(0, self.clock.remainingMs[player] - elapsed);
  }
  if (addIncrement) {
    self.clock.remainingMs[player] += self.base.settings.timeControl.incrementMs;
  }
  self.clock.lastUpdateTimestamp = now;
}

function maybeGainExtraTime(self: TakOngoingGame, player: TakPlayer) {
  if (!self.clock.isTicking) {
    return;
  }
  const extra = self.base.settings.timeControl.extra;
  if (extra && !self.clock.hasGainedExtraTime[player]) {
    const moveIndex = Math.floor((self.base.plyIndex + 1) / 2);
    if (moveIndex === extra.onMove) {
      self.clock.remainingMs[player] += extra.extraMs;
      self.clock.hasGainedExtraTime[player] = true;
    }
  }
}

function startOrUpdateClock(self: TakOngoingGame, now: number, player: TakPlayer) {
  maybeApplyElapsed(self, now, player, true);
  maybeGainExtraTime(self, player);
  self.clock.isTicking = true;
}

function stopClock(self: TakOngoingGame, now: number, player: TakPlayer) {
  maybeApplyElapsed(self, now, player, false);
  self.clock.isTicking = false;
}

export function takOngoingGameGetTimeRemainingMs(
  self: TakOngoingGame,
  player: TakPlayer,
  now: number,
): number {
  if (self.clock.isTicking && self.base.currentPlayer === player) {
    const elapsed = Math.max(0, now - self.clock.lastUpdateTimestamp);
    return Math.max(0, self.clock.remainingMs[player] - elapsed);
  }
  return self.clock.remainingMs[player];
}

export function takOngoingGameCheckTimeout(
  self: TakOngoingGame,
  now: number,
): TakFinishedGame | null {
  const player = self.base.currentPlayer;
  const currentPlayerTime = takOngoingGameGetTimeRemainingMs(self, player, now);
  if (currentPlayerTime <= 0) {
    stopClock(self, now, player);
    return {
      base: {
        gameState: {
          type: 'win',
          winner: player === 'white' ? 'black' : 'white',
          reason: 'default',
        },
      },
      actionHistory: self.actionHistory,
      timeRemainingMs: self.clock.remainingMs,
    };
  }
  return null;
}

export function takOngoingGameSetTimeRemainingMs(
  self: TakOngoingGame,
  remainingMs: Record<TakPlayer, number>,
  now: number,
) {
  self.clock.remainingMs = { ...remainingMs };
  self.clock.lastUpdateTimestamp = now;
}

export function takOngoingGameDoAction(
  self: TakOngoingGame,
  action: TakAction,
  now: number,
):
  | { type: 'error'; reason: InvalidActionReason }
  | { type: 'game-over'; game: TakFinishedGame }
  | null {
  const timeoutGame = takOngoingGameCheckTimeout(self, now);
  if (timeoutGame !== null) {
    return { type: 'game-over', game: timeoutGame };
  }

  const player = self.base.currentPlayer;

  const result = takOngoingBaseGameDoAction(self.base, action);
  if (result && result.type === 'error') {
    return { type: 'error', reason: result.reason };
  } else if (result === null) {
    startOrUpdateClock(self, now, player);
    self.actionHistory.push({
      ...action,
      remainingMs: self.clock.remainingMs,
    });
    return null;
  } else {
    stopClock(self, now, player);
    self.actionHistory.push({
      ...action,
      remainingMs: self.clock.remainingMs,
    });
    return {
      type: 'game-over',
      game: {
        base: result.game,
        actionHistory: self.actionHistory,
        timeRemainingMs: self.clock.remainingMs,
      },
    };
  }
}

export function takOngoingGameUndoLastAction(self: TakOngoingGame, now: number): boolean {
  const lastActionRecord = self.actionHistory.pop();
  if (!lastActionRecord) {
    return false;
  }
  const player = self.base.currentPlayer;

  const newBase = takOngoingBaseGameNew(self.base.settings);
  for (const action of self.actionHistory) {
    takOngoingBaseGameDoAction(newBase, action);
  }
  self.base = newBase;
  maybeApplyElapsed(self, now, player, true);
  return true;
}

export function takOngoingGameSetGameOver(
  self: TakOngoingGame,
  gameState: TakGameOverState,
  now: number,
): TakFinishedGame {
  stopClock(self, now, self.base.currentPlayer);
  return {
    base: {
      gameState,
    },
    actionHistory: self.actionHistory,
    timeRemainingMs: self.clock.remainingMs,
  };
}
