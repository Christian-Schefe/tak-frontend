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
  partialMove: PartialAction | null;
  shownReserves: Record<TakPlayer, TakReserve>;
}

interface PartialAction {
  take: number;
  drops: number[];
  pos: TakPos;
  dir: TakDir | null;
}

export function boardSize(ui: TakGameUI): number {
  return ui.actualGame.board.size;
}

export function newGameUI(game: TakGame): TakGameUI {
  const tiles: TakUITile[][] = [];
  const size = game.board.size;
  for (let y = 0; y < size; y++) {
    const row: TakUITile[] = [];
    for (let x = 0; x < size; x++) {
      row.push({
        owner: null,
        highlighted: false,
        selectable: false,
        hoverable: false,
        lastMove: false,
      });
    }
    tiles.push(row);
  }

  const gameUI: TakGameUI = {
    actualGame: game,
    pieces: {},
    tiles,
    partialMove: null,
    priorityPieces: [],
    plyIndex: null,
    shownReserves: { white: { ...game.reserves.white }, black: { ...game.reserves.black } },
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
  game.setGameOver(ui.actualGame, newGameState, new Date());
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
  const gameState = ui.actualGame.gameState;
  if (gameState.type !== 'ongoing') {
    return;
  }
  game.checkTimeout(ui.actualGame, new Date());
  if (ui.actualGame.gameState.type !== 'ongoing') {
    onGameUpdate(ui);
  }
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
    return move;
  } else {
    return getPartialMove(ui, pos);
  }
}

export function updatePartialMove(ui: TakGameUI, pos: TakPos) {
  const newPartialMove = getNewPartialMove(ui, pos);
  ui.partialMove = newPartialMove;
  onGameUpdate(ui);
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

function getPartialMove(ui: TakGameUI, pos: TakPos): TakAction | null {
  const newPartialMove = getNewPartialMove(ui, pos);
  const partialMove = partialMoveToMove(newPartialMove);
  if (partialMove?.complete === true) {
    return partialMove.move;
  }
  return null;
}

function getNewPartialMove(ui: TakGameUI, pos: TakPos): PartialAction | null {
  let partialMove: PartialAction | null = isDraft(ui)
    ? structuredClone(current(ui).partialMove)
    : structuredClone(ui.partialMove);

  if (ui.actualGame.gameState.type !== 'ongoing' || ui.actualGame.history.length < 2) {
    partialMove = null;
    return partialMove;
  }

  if (!partialMove) {
    const stack = ui.actualGame.board.pieces[pos.y][pos.x];
    if (!stack) return partialMove;

    if (stack.composition[stack.composition.length - 1].player !== ui.actualGame.currentPlayer) {
      return partialMove;
    }
    partialMove = {
      take: Math.min(stack.composition.length, ui.actualGame.board.size),
      drops: [],
      pos,
      dir: null,
    };
    return partialMove;
  }

  const stack = ui.actualGame.board.pieces[partialMove.pos.y][partialMove.pos.x];
  if (!stack) {
    partialMove = null;
    return partialMove;
  }

  const dropPos = partialMove.dir
    ? offsetCoord(partialMove.pos, partialMove.dir, partialMove.drops.length)
    : partialMove.pos;
  if (coordEquals(dropPos, pos)) {
    if (partialMove.drops.length > 0) {
      partialMove.drops[partialMove.drops.length - 1]++;
    } else {
      partialMove.take--;
      if (partialMove.take <= 0) {
        partialMove = null;
        return partialMove;
      }
    }
  } else {
    const dir = dirFromAdjacent(pos, dropPos);
    if (!dir || (partialMove.dir && partialMove.dir !== dir)) {
      partialMove = null;
      return partialMove;
    }
    const otherStack = ui.actualGame.board.pieces[pos.y][pos.x];
    if (otherStack && otherStack.variant !== 'flat') {
      const floatingCount =
        partialMove.take - partialMove.drops.reduce((acc, drop) => acc + drop, 0);
      if (
        !(stack.variant === 'capstone' && otherStack.variant === 'standing' && floatingCount === 1)
      ) {
        partialMove = null;
        return partialMove;
      }
    }
    partialMove.dir = dir;
    partialMove.drops.push(1);
  }
  return partialMove;
}

function getLastMovePiecesInOrder(game: TakGame): TakPieceId[] {
  if (game.history.length === 0) return [];
  const lastMove = game.history[game.history.length - 1];
  return lastMove.affectedPieces;
}

function arePiecesDifferent(piece: TakUIPiece | undefined, newData: TakUIPiece): boolean {
  return (
    !piece ||
    piece.player !== newData.player ||
    piece.variant !== newData.variant ||
    piece.pos.x !== newData.pos.x ||
    piece.pos.y !== newData.pos.y ||
    piece.height !== newData.height ||
    piece.isFloating !== newData.isFloating ||
    piece.zPriority !== newData.zPriority ||
    piece.deleted !== newData.deleted ||
    piece.buriedPieceCount !== newData.buriedPieceCount ||
    piece.canBePicked !== newData.canBePicked
  );
}

function areTilesDifferent(tile: TakUITile, newTile: TakUITile): boolean {
  return (
    tile.owner !== newTile.owner ||
    tile.highlighted !== newTile.highlighted ||
    tile.selectable !== newTile.selectable ||
    tile.hoverable !== newTile.hoverable ||
    tile.lastMove !== newTile.lastMove
  );
}

export function onGameUpdate(ui: TakGameUI) {
  const gameClone = isDraft(ui)
    ? structuredClone(current(ui).actualGame)
    : structuredClone(ui.actualGame);
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

  const isOngoing = ui.actualGame.gameState.type === 'ongoing';
  const isNotHistoric = ui.plyIndex === null;

  const presentIds = new Set<TakPieceId>();

  for (let y = 0; y < size; y++) {
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
          const id = stack.composition[height].id;
          const newPiece: TakUIPiece = {
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
          if (arePiecesDifferent(ui.pieces[id], newPiece)) {
            ui.pieces[id] = newPiece;
          }
          presentIds.add(id);
        }
        hoverable &&=
          ui.actualGame.history.length >= 2 &&
          stack.composition[stack.composition.length - 1].player === ui.actualGame.currentPlayer;
      }

      const newTile: TakUITile = {
        owner: stack?.composition[0].player ?? null,
        highlighted: false,
        selectable: isOngoing && isNotHistoric && selectable,
        hoverable: isOngoing && isNotHistoric && (hoverable || selectable),
        lastMove: false,
      };
      if (areTilesDifferent(ui.tiles[y][x], newTile)) {
        ui.tiles[y][x] = newTile;
      }
    }
  }

  for (const id of Object.keys(ui.pieces) as TakPieceId[]) {
    if (ui.pieces[id] !== undefined && !presentIds.has(id)) {
      if (ui.pieces[id].deleted) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete ui.pieces[id];
      } else {
        ui.pieces[id].deleted = true;
      }
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
