import {
  playerOpposite,
  type TakGame,
  type TakGameSettings,
  type TakGameState,
  type TakAction,
  type TakActionRecord,
  type TakPlayer,
} from '.';
import {
  canMovePiece,
  canPlacePiece,
  countFlats,
  findRoads,
  getFlats,
  isFilled,
  movePiece,
  newBoard,
  placePiece,
} from './board';

export function newGame(settings: TakGameSettings): TakGame {
  const board = newBoard(settings.boardSize);
  return {
    board,
    settings,
    currentPlayer: 'white',
    history: [],
    reserves: {
      white: { ...settings.reserve },
      black: { ...settings.reserve },
    },
    gameState: { type: 'ongoing' },
    clock: settings.clock && {
      hasStarted: false,
      lastUpdate: null,
      remainingMs: {
        white: settings.clock.contingentMs,
        black: settings.clock.contingentMs,
      },
      hasGainedExtra: { white: false, black: false },
    },
  };
}

export function canDoMove(game: TakGame, move: TakAction, now: Date): string | null {
  if (isTimeout(game, now)) {
    return 'Game is over: timeout';
  }

  if (game.gameState.type !== 'ongoing') return `Game is not ongoing: ${game.gameState.type}`;

  if (move.type === 'place') {
    if (game.history.length < 2 && move.variant !== 'flat') {
      return 'Invalid place move';
    }
    const reserve = game.reserves[game.currentPlayer];
    const reserveNumber = move.variant === 'capstone' ? reserve.capstones : reserve.pieces;
    if (reserveNumber <= 0) {
      return 'Not enough pieces in reserve';
    }
    return canPlacePiece(game.board, move.pos);
  } else {
    if (game.history.length < 2) {
      return 'Cannot move piece';
    }
    return canMovePiece(game.board, move.from, move.dir, move.drops, game.currentPlayer);
  }
}

function isReserveEmpty(game: TakGame) {
  return (
    (game.reserves.white.pieces === 0 && game.reserves.white.capstones === 0) ||
    (game.reserves.black.pieces === 0 && game.reserves.black.capstones === 0)
  );
}

export function isClockActive(game: TakGame, player: TakPlayer): boolean {
  return (
    game.gameState.type === 'ongoing' &&
    game.currentPlayer === player &&
    game.clock?.hasStarted === true &&
    game.clock.lastUpdate !== null
  );
}

export function gameFromPlyCount(game: TakGame, plyCount: number, removeClock?: boolean): TakGame {
  const resultGame = newGame({ ...game.settings, clock: undefined });
  const history = game.history.slice(0, plyCount);
  for (const move of history) {
    doMove(resultGame, move, new Date());
  }
  if (removeClock !== true) {
    resultGame.clock = game.clock;
    resultGame.settings.clock = game.settings.clock;
  }
  return resultGame;
}

export function getTimeRemaining(game: TakGame, player: TakPlayer, now: Date): number | null {
  if (game.clock) {
    return Math.max(
      0,
      game.clock.remainingMs[player] -
        (game.gameState.type === 'ongoing' &&
        game.currentPlayer === player &&
        game.clock.hasStarted &&
        game.clock.lastUpdate
          ? now.getTime() - game.clock.lastUpdate.getTime()
          : 0),
    );
  }
  return null;
}

export function setTimeRemaining(game: TakGame, remaining: Record<TakPlayer, number>, now: Date) {
  if (game.clock) {
    game.clock.remainingMs.white = remaining.white;
    game.clock.remainingMs.black = remaining.black;
    game.clock.lastUpdate = now;
    checkTimeout(game, now);
  }
}

export function applyTimeToClock(game: TakGame, now: Date) {
  const remaining = getTimeRemaining(game, game.currentPlayer, now);
  if (game.clock && remaining !== null) {
    game.clock.remainingMs[game.currentPlayer] = remaining;
    game.clock.lastUpdate = now;
  }
}

export function isTimeout(game: TakGame, now: Date): boolean {
  if (game.gameState.type !== 'ongoing') return false;

  const player = game.currentPlayer;
  const timeRemaining = getTimeRemaining(game, player, now);
  return timeRemaining !== null && timeRemaining <= 0;
}

export function checkTimeout(game: TakGame, now: Date): number | null {
  if (game.gameState.type !== 'ongoing') return null;

  applyTimeToClock(game, now);

  const player = game.currentPlayer;
  const timeRemaining = getTimeRemaining(game, player, now);
  if (timeRemaining !== null && timeRemaining <= 0) {
    game.gameState = {
      type: 'win',
      player: playerOpposite(player),
      reason: 'timeout',
    };
  }
  return timeRemaining ?? null;
}

export function canUndoMove(game: TakGame, now: Date): string | null {
  if (isTimeout(game, now)) {
    return 'Game is over: timeout';
  }

  if (game.gameState.type !== 'ongoing') return `Game is not ongoing: ${game.gameState.type}`;

  if (game.history.length === 0) {
    return 'No moves to undo';
  }

  return null;
}

export function undoMove(game: TakGame, now: Date) {
  const timeRemaining =
    game.settings.clock?.externallyDriven !== true ? checkTimeout(game, now) : null;

  if (game.settings.clock?.externallyDriven === true) {
    applyTimeToClock(game, now);
  }

  const err = canUndoMove(game, now);
  if (err !== null) {
    throw new Error(`Cannot undo: ${err}`);
  }

  const player = game.currentPlayer;

  const undoneGame = gameFromPlyCount(game, game.history.length - 1);
  const undoneMove = game.history[game.history.length - 1];
  game.board = undoneGame.board;
  game.currentPlayer = undoneGame.currentPlayer;
  game.reserves = undoneGame.reserves;
  game.gameState = undoneGame.gameState;
  game.history = undoneGame.history;

  startOrUpdateClock(game, timeRemaining, player, now, false);

  return undoneMove;
}

export function doMove(game: TakGame, move: TakAction, now: Date) {
  const timeRemaining =
    game.settings.clock?.externallyDriven !== true ? checkTimeout(game, now) : null;

  if (game.settings.clock?.externallyDriven === true) {
    applyTimeToClock(game, now);
  }

  const err = canDoMove(game, move, now);
  if (err !== null) {
    throw new Error(`Invalid move: ${err}`);
  }

  const player = game.currentPlayer;

  let record: TakActionRecord;
  if (move.type === 'place') {
    const placingPlayer = game.history.length < 2 ? playerOpposite(player) : player;

    record = placePiece(game.board, move.pos, placingPlayer, move.variant);

    const reserve = game.reserves[game.currentPlayer];
    if (move.variant === 'capstone') {
      reserve.capstones--;
    } else {
      reserve.pieces--;
    }
  } else {
    record = movePiece(game.board, move.from, move.dir, move.drops, game.currentPlayer);
  }

  startOrUpdateClock(game, timeRemaining, player, now, true);

  game.history.push(record);
  game.currentPlayer = playerOpposite(player);

  const road = findRoads(game.board, player) ?? findRoads(game.board, playerOpposite(player));
  if (road) {
    game.gameState = {
      type: 'win',
      player,
      reason: 'road',
      road,
    };
  } else if (isReserveEmpty(game) || isFilled(game.board)) {
    const flatCounts = countFlats(game.board);
    const whiteScore = flatCounts.white * 2;
    const blackScore = flatCounts.black * 2 + game.settings.halfKomi;
    if (whiteScore !== blackScore) {
      const winner = whiteScore > blackScore ? 'white' : 'black';
      game.gameState = {
        type: 'win',
        player: winner,
        reason: 'flats',
        flats: getFlats(game.board, winner),
        counts: flatCounts,
      };
    } else {
      game.gameState = {
        type: 'draw',
        reason: 'flats',
        counts: flatCounts,
      };
    }
  }
}

function startOrUpdateClock(
  game: TakGame,
  timeRemaining: number | null,
  player: TakPlayer,
  now: Date,
  allowGainExtra: boolean,
) {
  if (game.clock && game.settings.clock) {
    if (timeRemaining !== null) {
      const move = Math.floor(game.history.length / 2) + 1;
      const shouldGainExtra =
        allowGainExtra &&
        game.settings.clock.extra !== undefined &&
        move === game.settings.clock.extra.move &&
        !game.clock.hasGainedExtra[player];

      if (shouldGainExtra) {
        game.clock.hasGainedExtra[player] = true;
      }
      const extraGain = shouldGainExtra ? (game.settings.clock.extra?.amountMs ?? 0) : 0;
      game.clock.remainingMs[player] = timeRemaining + game.settings.clock.incrementMs + extraGain;
    }
    game.clock.lastUpdate = now;
    game.clock.hasStarted = true;
  }
}

export function gameResultToString(gameResult: TakGameState) {
  switch (gameResult.type) {
    case 'win': {
      const letter = gameResult.reason === 'flats' ? 'F' : gameResult.reason === 'road' ? 'R' : '1';
      return gameResult.player === 'white' ? `${letter}-0` : `0-${letter}`;
    }
    case 'draw':
      return '1/2-1/2';
    case 'ongoing':
      return null;
    case 'aborted':
      return '0-0';
  }
}
