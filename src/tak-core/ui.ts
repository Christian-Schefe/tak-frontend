import {
  playerOpposite,
  type TakPos,
  type TakDir,
  type TakGame,
  type TakAction,
  type TakPieceId,
  type TakPieceVariant,
  type TakPlayer,
  type TakReserve,
  TakGameState,
} from '.';
import { isValidCoord } from './board';
import { coordEquals, dirFromAdjacent, offsetCoord } from './coord';
import { isDraft, current } from 'immer';
import * as game from './game';

export interface TakUIPiece {
  player: TakPlayer;
  variant: TakPieceVariant;
  pos: TakPos;
  height: number;
  isFloating: boolean;
  zPriority: number | null;
  deleted: boolean;
  buriedPieceCount: number;
  canBePicked: boolean;
}

export interface TakUITile {
  owner: TakPlayer | null;
  highlighted: boolean;
  selectable: boolean;
  hoverable: boolean;
  lastMove: boolean;
}

export interface TakGameUI {
  actualGame: TakGame;
  plyIndex: number | null;
  pieces: Record<TakPieceId, TakUIPiece | undefined>;
  priorityPieces: TakPieceId[];
  tiles: TakUITile[][];
  partialMove: {
    take: number;
    drops: number[];
    pos: TakPos;
    dir: TakDir | null;
  } | null;
  shownReserves: Record<TakPlayer, TakReserve> | null;
}

export function boardSize(ui: TakGameUI): number {
  return ui.actualGame.board.size;
}

export function newGameUI(game: TakGame): TakGameUI {
  const gameUI: TakGameUI = {
    actualGame: game,
    pieces: {},
    tiles: [],
    partialMove: null,
    priorityPieces: [],
    plyIndex: null,
    shownReserves: null,
  };
  onGameUpdate(gameUI);
  return gameUI;
}

export function setPlyIndex(ui: TakGameUI, index: number | null) {
  const prevIndex = ui.plyIndex ?? ui.actualGame.history.length;
  ui.plyIndex = index === null || index >= ui.actualGame.history.length ? null : Math.max(0, index);

  const newIndex = ui.plyIndex ?? ui.actualGame.history.length;

  const isSteppingForwardOne = newIndex === prevIndex + 1;
  const isSteppingBackOne = newIndex === prevIndex - 1;

  ui.priorityPieces = isSteppingForwardOne
    ? ui.actualGame.history[prevIndex].affectedPieces
    : isSteppingBackOne
      ? ui.actualGame.history[newIndex].affectedPieces
      : [];
  ui.partialMove = null;
  onGameUpdate(ui);
}

export function setGameOverState(ui: TakGameUI, newGameState: TakGameState) {
  if (ui.actualGame.gameState.type !== 'ongoing' || newGameState.type === 'ongoing') {
    return;
  }
  game.applyTimeToClock(ui.actualGame, new Date());
  ui.actualGame.gameState = newGameState;
  onGameUpdate(ui);
}

export function doResign(ui: TakGameUI, player: TakPlayer) {
  setGameOverState(ui, {
    type: 'win',
    player: playerOpposite(player),
    reason: 'resignation',
  });
}

export function doDraw(ui: TakGameUI) {
  setGameOverState(ui, { type: 'draw', reason: 'mutual agreement' });
}

export function checkTimeout(ui: TakGameUI) {
  game.checkTimeout(ui.actualGame, new Date());
  onGameUpdate(ui);
}

export function canDoMove(ui: TakGameUI, move: TakAction): boolean {
  const err = game.canDoMove(ui.actualGame, move, new Date());
  if (err !== null) {
    return false;
  }
  return true;
}

export function doMove(ui: TakGameUI, move: TakAction) {
  game.doMove(ui.actualGame, move, new Date());
  ui.partialMove = null;
  ui.plyIndex = null;
  ui.priorityPieces = getLastMovePiecesInOrder(ui.actualGame);
  onGameUpdate(ui);
}

export function canUndoMove(ui: TakGameUI): boolean {
  const err = game.canUndoMove(ui.actualGame, new Date());
  if (err !== null) {
    return false;
  }
  return true;
}

export function undoMove(ui: TakGameUI) {
  const undoneMove = game.undoMove(ui.actualGame, new Date());
  ui.plyIndex = null;
  ui.partialMove = null;
  ui.priorityPieces = undoneMove.affectedPieces;
  onGameUpdate(ui);
}

export function clearPartialMove(ui: TakGameUI) {
  ui.partialMove = null;
  onGameUpdate(ui);
}

export function tryPlaceOrAddToPartialMove(
  ui: TakGameUI,
  pos: TakPos,
  variant: TakPieceVariant,
): TakAction | null {
  if (ui.plyIndex !== null) {
    return null;
  }
  const move: TakAction = {
    type: 'place',
    pos,
    variant,
  };
  if (!ui.partialMove && canDoMove(ui, move)) {
    doMove(ui, move);
    return move;
  } else {
    return addToPartialMove(ui, pos);
  }
}

function partialMoveToMove(
  partialMove: TakGameUI['partialMove'],
): { move: TakAction; complete: boolean } | null {
  if (partialMove?.dir) {
    const drops = partialMove.drops;
    const floatingCount = partialMove.take - drops.reduce((acc, drop) => acc + drop, 0);

    return {
      move: {
        from: partialMove.pos,
        type: 'move',
        dir: partialMove.dir,
        drops: drops.map((x, i) => (i === drops.length - 1 ? x + floatingCount : x)),
      },
      complete: floatingCount === 0,
    };
  }
  return null;
}

export function addToPartialMove(ui: TakGameUI, pos: TakPos): TakAction | null {
  addToPartialMoveHelper(ui, pos);
  const partialMove = partialMoveToMove(ui.partialMove);

  if (partialMove?.complete === true) {
    doMove(ui, partialMove.move);
    return partialMove.move;
  }
  onGameUpdate(ui);
  return null;
}

function addToPartialMoveHelper(ui: TakGameUI, pos: TakPos) {
  if (ui.actualGame.gameState.type !== 'ongoing' || ui.actualGame.history.length < 2) {
    ui.partialMove = null;
    return;
  }

  if (!ui.partialMove) {
    const stack = ui.actualGame.board.pieces[pos.y][pos.x];
    if (!stack) return;

    if (stack.composition[stack.composition.length - 1].player !== ui.actualGame.currentPlayer) {
      return;
    }
    ui.partialMove = {
      take: Math.min(stack.composition.length, ui.actualGame.board.size),
      drops: [],
      pos,
      dir: null,
    };
    return;
  }

  const stack = ui.actualGame.board.pieces[ui.partialMove.pos.y][ui.partialMove.pos.x];
  if (!stack) {
    ui.partialMove = null;
    return;
  }

  const dropPos = ui.partialMove.dir
    ? offsetCoord(ui.partialMove.pos, ui.partialMove.dir, ui.partialMove.drops.length)
    : ui.partialMove.pos;
  if (coordEquals(dropPos, pos)) {
    if (ui.partialMove.drops.length > 0) {
      ui.partialMove.drops[ui.partialMove.drops.length - 1]++;
    } else {
      ui.partialMove.take--;
      if (ui.partialMove.take <= 0) {
        ui.partialMove = null;
        return;
      }
    }
  } else {
    const dir = dirFromAdjacent(pos, dropPos);
    if (!dir || (ui.partialMove.dir && ui.partialMove.dir !== dir)) {
      ui.partialMove = null;
      return;
    }
    const otherStack = ui.actualGame.board.pieces[pos.y][pos.x];
    if (otherStack && otherStack.variant !== 'flat') {
      const floatingCount =
        ui.partialMove.take - ui.partialMove.drops.reduce((acc, drop) => acc + drop, 0);
      if (
        !(stack.variant === 'capstone' && otherStack.variant === 'standing' && floatingCount === 1)
      ) {
        ui.partialMove = null;
        return;
      }
    }
    ui.partialMove.dir = dir;
    ui.partialMove.drops.push(1);
  }
}

function getLastMovePiecesInOrder(game: TakGame): TakPieceId[] {
  if (game.history.length === 0) return [];
  const lastMove = game.history[game.history.length - 1];
  return lastMove.affectedPieces;
}

export function onGameUpdate(ui: TakGameUI) {
  const gameClone = isDraft(ui) ? current(ui).actualGame : structuredClone(ui.actualGame);
  const shownGame =
    ui.plyIndex !== null ? game.gameFromPlyCount(gameClone, ui.plyIndex, true) : gameClone;

  const partialMove = partialMoveToMove(ui.partialMove);
  if (partialMove) {
    game.doMove(shownGame, partialMove.move, new Date());
    ui.priorityPieces = getLastMovePiecesInOrder(shownGame);
  }

  ui.shownReserves = {
    white: { ...shownGame.reserves.white },
    black: { ...shownGame.reserves.black },
  };

  const floatingData = ui.partialMove && {
    pos: ui.partialMove.dir
      ? offsetCoord(ui.partialMove.pos, ui.partialMove.dir, ui.partialMove.drops.length)
      : ui.partialMove.pos,
    floatingCount: ui.partialMove.take - ui.partialMove.drops.reduce((acc, drop) => acc + drop, 0),
  };

  const size = ui.actualGame.board.size;

  const clickOptions = [];

  if (ui.partialMove && floatingData) {
    const clickOptionDirs: TakDir[] = ui.partialMove.dir
      ? [ui.partialMove.dir]
      : ['left', 'up', 'down', 'right'];
    const dropPos = floatingData.pos;
    const floatingCount = floatingData.floatingCount;
    clickOptions.push(dropPos);
    for (const dir of clickOptionDirs) {
      const newPos = offsetCoord(dropPos, dir, 1);
      if (!isValidCoord(size, newPos)) continue;
      const stack = shownGame.board.pieces[newPos.y][newPos.x];
      if (!stack || stack.variant === 'flat') {
        clickOptions.push(newPos);
      } else if (stack.variant === 'standing' && floatingCount === 1) {
        const thisStack = shownGame.board.pieces[dropPos.y][dropPos.x];
        if (thisStack && thisStack.variant === 'capstone') {
          clickOptions.push(newPos);
        }
      }
    }
  }

  const oldPieces = ui.pieces;
  ui.pieces = {};
  ui.tiles = [];
  for (const piece of Object.keys(oldPieces) as TakPieceId[]) {
    if (oldPieces[piece] !== undefined) {
      ui.pieces[piece] = {
        ...oldPieces[piece],
        deleted: true,
      };
    }
  }

  const isOngoing = ui.actualGame.gameState.type === 'ongoing';
  const isNotHistoric = ui.plyIndex === null;

  for (let y = 0; y < size; y++) {
    ui.tiles[y] = [];
    for (let x = 0; x < size; x++) {
      const stack = shownGame.board.pieces[y][x];
      const pos = { x, y };
      const selectable = clickOptions.some((coord) => coordEquals(coord, pos));
      let hoverable = ui.partialMove === null;
      if (stack) {
        const floatingHeightThreshold =
          floatingData && coordEquals(pos, floatingData.pos)
            ? stack.composition.length - floatingData.floatingCount
            : null;
        const buriedPieceCount = Math.max(0, stack.composition.length - size);

        for (let height = 0; height < stack.composition.length; height++) {
          const priorityIndex = ui.priorityPieces.findIndex(
            (id) => id === stack.composition[height].id,
          );
          const canBePicked = stack.composition.length - height <= size;
          ui.pieces[stack.composition[height].id] = {
            buriedPieceCount,
            canBePicked,
            zPriority: priorityIndex >= 0 ? priorityIndex : null,
            player: stack.composition[height].player,
            variant: height === stack.composition.length - 1 ? stack.variant : 'flat',
            pos,
            height,
            isFloating: floatingHeightThreshold !== null && height >= floatingHeightThreshold,
            deleted: false,
          };
        }
        hoverable &&=
          ui.actualGame.history.length >= 2 &&
          stack.composition[stack.composition.length - 1].player === ui.actualGame.currentPlayer;
      }

      ui.tiles[y][x] = {
        owner: stack?.composition[0].player ?? null,
        highlighted: false,
        selectable: isOngoing && isNotHistoric && selectable,
        hoverable: isOngoing && isNotHistoric && (hoverable || selectable),
        lastMove: false,
      };
    }
  }

  if ((ui.plyIndex ?? ui.actualGame.history.length) >= 1) {
    const lastMove =
      ui.actualGame.history[
        ui.plyIndex !== null ? ui.plyIndex - 1 : ui.actualGame.history.length - 1
      ];
    if (lastMove.type === 'place') {
      ui.tiles[lastMove.pos.y][lastMove.pos.x].lastMove = true;
    } else {
      for (let i = 0; i <= lastMove.drops.length; i++) {
        const pos = offsetCoord(lastMove.from, lastMove.dir, i);
        ui.tiles[pos.y][pos.x].lastMove = true;
      }
    }
  }
}
