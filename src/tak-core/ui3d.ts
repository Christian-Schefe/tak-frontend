import { current, immerable, isDraft } from 'immer';
import {
  dirFromAdjacent,
  isValidPos,
  offsetPos,
  TakAction,
  TakDir,
  TakPieceId,
  TakPlayer,
  TakPos,
  TakVariant,
} from '.';
import { TakBaseGame } from './base';

export interface TakUI3DBoardPiece {
  type: 'board';
  index: number;
  kindIndex: number;
  player: TakPlayer;
  variant: TakVariant;
  pos: TakPos;
  height: number;
  isFloating: boolean;
}
export interface TakUI3DReservePiece {
  type: 'reserve';
  index: number;
  kindIndex: number;
  player: TakPlayer;
  isCapstone: boolean;
  isTopOfKind: boolean;
}

export type TakUI3DPiece = TakUI3DBoardPiece | TakUI3DReservePiece;

export interface TakUI3DTile {
  owner: TakPlayer | null;
  highlighted: boolean;
  selectable: boolean;
  hoverable: boolean;
  lastAction: boolean;
}

export class TakGame3DUI {
  [immerable] = true;

  actualGame: TakBaseGame;
  pieces: TakUI3DPiece[];
  reservePieces: Record<
    TakPlayer,
    Record<'capstone' | 'flat', (TakUI3DReservePiece | undefined)[]>
  >;
  private pieceMap: Record<
    TakPieceId,
    { type: 'active'; piece: TakUI3DBoardPiece } | { type: 'removed'; index: number } | undefined
  >;
  tiles: TakUI3DTile[][];
  partialAction: PartialAction | null;

  constructor(game: TakBaseGame) {
    this.actualGame = game;
    this.pieceMap = {};
    this.reservePieces = { black: { capstone: [], flat: [] }, white: { capstone: [], flat: [] } };
    this.partialAction = null;
    this.pieces = [];
    this.tiles = [];
    const size = game.board.size;
    for (let y = 0; y < size; y++) {
      const row: TakUI3DTile[] = [];
      for (let x = 0; x < size; x++) {
        row.push({
          owner: null,
          highlighted: false,
          selectable: false,
          hoverable: false,
          lastAction: false,
        });
      }
      this.tiles.push(row);
    }
    let indexCounter = 0;
    for (let p = 0; p < game.settings.reserve.pieces; p++) {
      const whiteFlat: TakUI3DReservePiece = {
        type: 'reserve',
        kindIndex: p,
        index: indexCounter++,
        player: 'white',
        isCapstone: false,
        isTopOfKind: p === game.settings.reserve.pieces - 1,
      };
      this.reservePieces.white.flat.push(whiteFlat);
      this.pieces.push(whiteFlat);
      const blackFlat: TakUI3DReservePiece = {
        type: 'reserve',
        kindIndex: p,
        index: indexCounter++,
        player: 'black',
        isCapstone: false,
        isTopOfKind: p === game.settings.reserve.pieces - 1,
      };
      this.reservePieces.black.flat.push(blackFlat);
      this.pieces.push(blackFlat);
    }
    for (let c = 0; c < game.settings.reserve.capstones; c++) {
      const whiteCapstone: TakUI3DReservePiece = {
        type: 'reserve',
        kindIndex: c,
        index: indexCounter++,
        player: 'white',
        isCapstone: true,
        isTopOfKind: c === game.settings.reserve.capstones - 1,
      };
      this.reservePieces.white.capstone.push(whiteCapstone);
      this.pieces.push(whiteCapstone);
      const blackCapstone: TakUI3DReservePiece = {
        type: 'reserve',
        kindIndex: c,
        index: indexCounter++,
        player: 'black',
        isCapstone: true,
        isTopOfKind: c === game.settings.reserve.capstones - 1,
      };
      this.reservePieces.black.capstone.push(blackCapstone);
      this.pieces.push(blackCapstone);
    }
    this.onGameUpdate();
  }

  updateGame(game: TakBaseGame) {
    if (this.actualGame === game) {
      return;
    }

    this.actualGame = game;
    this.partialAction = null;
    this.onGameUpdate();
  }

  private onGameUpdate() {
    const shownGame = isDraft(this.actualGame)
      ? current(this.actualGame).clone()
      : this.actualGame.clone();

    const partialAction = partialActionToAction(this.partialAction);
    if (partialAction) {
      shownGame.doAction(partialAction.action);
    }

    const floatingData = this.partialAction && {
      pos: this.partialAction.dir
        ? offsetPos(this.partialAction.pos, this.partialAction.dir, this.partialAction.drops.length)
        : this.partialAction.pos,
      floatingCount:
        this.partialAction.take - this.partialAction.drops.reduce((acc, drop) => acc + drop, 0),
    };

    const size = this.actualGame.board.size;

    const clickOptions = [];

    if (this.partialAction && floatingData) {
      const clickOptionDirs: TakDir[] = this.partialAction.dir
        ? [this.partialAction.dir]
        : ['left', 'up', 'down', 'right'];
      const dropPos = floatingData.pos;
      const floatingCount = floatingData.floatingCount;
      clickOptions.push(dropPos);
      for (const dir of clickOptionDirs) {
        const newPos = offsetPos(dropPos, dir, 1);
        if (!isValidPos(size, newPos)) continue;
        const stack = shownGame.board.getStack(newPos);
        if (!stack || stack.variant === 'flat') {
          clickOptions.push(newPos);
        } else if (stack.variant === 'standing' && floatingCount === 1) {
          const thisStack = shownGame.board.getStack(dropPos);
          if (thisStack && thisStack.variant === 'capstone') {
            clickOptions.push(newPos);
          }
        }
      }
    }

    const isOngoing = !this.actualGame.gameResult;

    const presentIds = new Set<TakPieceId>();

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const stack = shownGame.board.getStack({ x, y });
        const pos = { x, y };
        const selectable = clickOptions.some((pos) => pos.x === x && pos.y === y);
        let hoverable = this.partialAction === null;
        if (stack) {
          const floatingHeightThreshold =
            floatingData && pos.x === floatingData.pos.x && pos.y === floatingData.pos.y
              ? stack.composition.length - floatingData.floatingCount
              : null;

          for (let height = 0; height < stack.composition.length; height++) {
            const id = stack.composition[height].id;
            const presentPiece = this.pieceMap[id];
            const player = stack.composition[height].player;
            const variant = height === stack.composition.length - 1 ? stack.variant : 'flat';
            let pieceData: TakUI3DPiece;
            if (presentPiece) {
              if (presentPiece.type === 'active') {
                pieceData = presentPiece.piece;
              } else {
                const reservePiece = this.pieces[presentPiece.index];
                if (reservePiece.type !== 'reserve') {
                  console.error('Expected reserve piece for id', id, 'but found', reservePiece);
                  continue;
                }
                this.reservePieces[reservePiece.player][
                  reservePiece.isCapstone ? 'capstone' : 'flat'
                ][reservePiece.kindIndex] = undefined;
                pieceData = reservePiece;
              }
            } else {
              const reservePieceArray =
                this.reservePieces[player][variant === 'capstone' ? 'capstone' : 'flat'];
              const topOfKindIndex = reservePieceArray.findIndex(
                (p) => p !== undefined && p.isTopOfKind,
              );
              const reservePiece = reservePieceArray[topOfKindIndex];
              if (!reservePiece) {
                console.error('No reserve piece available for', player, variant);
                continue;
              }
              reservePieceArray[topOfKindIndex] = undefined;
              pieceData = reservePiece;
            }
            const newPiece: TakUI3DBoardPiece = {
              type: 'board',
              kindIndex: pieceData.kindIndex,
              index: pieceData.index,
              player: pieceData.player,
              variant,
              pos,
              height,
              isFloating: floatingHeightThreshold !== null && height >= floatingHeightThreshold,
            };
            this.pieceMap[id] = { type: 'active', piece: newPiece };
            this.pieces[newPiece.index] = newPiece;
            presentIds.add(id);
          }
          hoverable &&=
            this.actualGame.actionHistory.length >= 2 &&
            stack.composition[stack.composition.length - 1].player ===
              this.actualGame.currentPlayer;
        }

        const newTile: TakUI3DTile = {
          owner: stack?.composition[0].player ?? null,
          highlighted: false,
          selectable: isOngoing && selectable,
          hoverable: isOngoing && (hoverable || selectable),
          lastAction: false,
        };
        if (areTilesDifferent(this.tiles[y][x], newTile)) {
          this.tiles[y][x] = newTile;
        }
      }
    }

    for (const id of Object.keys(this.pieceMap)) {
      const pieceEntry = this.pieceMap[id];
      if (pieceEntry !== undefined && !presentIds.has(id) && pieceEntry.type === 'active') {
        const piece = pieceEntry.piece;
        const newPiece: TakUI3DReservePiece = {
          type: 'reserve',
          kindIndex: piece.kindIndex,
          index: piece.index,
          player: piece.player,
          isCapstone: piece.variant === 'capstone',
          isTopOfKind: false,
        };
        this.reservePieces[newPiece.player][newPiece.isCapstone ? 'capstone' : 'flat'][
          newPiece.kindIndex
        ] = newPiece;
        this.pieceMap[id] = { type: 'removed', index: newPiece.index };
        this.pieces[newPiece.index] = newPiece;
      }
    }

    //recompute top of kind for reserves
    for (const player of ['white', 'black'] as TakPlayer[]) {
      for (const variant of ['flat', 'capstone'] as ('flat' | 'capstone')[]) {
        const reservePieceArray = this.reservePieces[player][variant];
        let topOfKindIndex = -1;
        for (let i = reservePieceArray.length - 1; i >= 0; i--) {
          if (reservePieceArray[i]) {
            topOfKindIndex = i;
            break;
          }
        }
        for (let i = 0; i < reservePieceArray.length; i++) {
          const piece = reservePieceArray[i];
          if (piece) {
            const isTopOfKind = i === topOfKindIndex;
            if (piece.isTopOfKind !== isTopOfKind) {
              const newPiece = { ...piece, isTopOfKind };
              reservePieceArray[i] = newPiece;
              this.pieces[newPiece.index] = newPiece;
            }
          }
        }
      }
    }

    if (this.actualGame.actionHistory.length >= 1) {
      const lastAction = this.actualGame.actionHistory[this.actualGame.actionHistory.length - 1];
      if (lastAction.action.type === 'place') {
        this.tiles[lastAction.action.pos.y][lastAction.action.pos.x].lastAction = true;
      } else {
        for (let i = 0; i <= lastAction.action.drops.length; i++) {
          const pos = offsetPos(lastAction.action.pos, lastAction.action.dir, i);
          this.tiles[pos.y][pos.x].lastAction = true;
        }
      }
    }
  }

  tryPlaceOrAddToPartialAction(pos: TakPos, variant: TakVariant | null): TakAction | null {
    const action: TakAction = {
      type: 'place',
      pos,
      variant: variant ?? 'flat',
    };
    if (variant && !this.partialAction && this.actualGame.canDoAction(action)) {
      return action;
    } else {
      return this.getPartialAction(pos);
    }
  }

  updatePartialAction(pos: TakPos) {
    const newPartialAction = this.getNewPartialAction(pos);
    this.partialAction = newPartialAction;
    this.onGameUpdate();
  }

  private getPartialAction(pos: TakPos): TakAction | null {
    const newPartialAction = this.getNewPartialAction(pos);
    const partialAction = partialActionToAction(newPartialAction);
    if (partialAction?.complete === true) {
      return partialAction.action;
    }
    return null;
  }

  private getNewPartialAction(pos: TakPos): PartialAction | null {
    let partialAction: PartialAction | null = this.partialAction
      ? { ...this.partialAction, drops: [...this.partialAction.drops] }
      : null;

    if (!this.actualGame.isOngoing() || this.actualGame.actionHistory.length < 2) {
      partialAction = null;
      return partialAction;
    }

    if (!partialAction) {
      const stack = this.actualGame.board.getStack(pos);
      if (!stack) return partialAction;

      if (
        stack.composition[stack.composition.length - 1].player !== this.actualGame.currentPlayer
      ) {
        return partialAction;
      }
      partialAction = {
        take: Math.min(stack.composition.length, this.actualGame.board.size),
        drops: [],
        pos,
        dir: null,
      };
      return partialAction;
    }

    const stack = this.actualGame.board.getStack(partialAction.pos);
    if (!stack) {
      partialAction = null;
      return partialAction;
    }

    const dropPos = partialAction.dir
      ? offsetPos(partialAction.pos, partialAction.dir, partialAction.drops.length)
      : partialAction.pos;
    if (dropPos.x === pos.x && dropPos.y === pos.y) {
      if (partialAction.drops.length > 0) {
        partialAction.drops[partialAction.drops.length - 1]++;
      } else {
        partialAction.take--;
        if (partialAction.take <= 0) {
          partialAction = null;
          return partialAction;
        }
      }
    } else {
      const dir = dirFromAdjacent(pos, dropPos);
      if (!dir || (partialAction.dir && partialAction.dir !== dir)) {
        partialAction = null;
        return partialAction;
      }
      const otherStack = this.actualGame.board.getStack(pos);
      if (otherStack && otherStack.variant !== 'flat') {
        const floatingCount =
          partialAction.take - partialAction.drops.reduce((acc, drop) => acc + drop, 0);
        if (
          !(
            stack.variant === 'capstone' &&
            otherStack.variant === 'standing' &&
            floatingCount === 1
          )
        ) {
          partialAction = null;
          return partialAction;
        }
      }
      partialAction.dir = dir;
      partialAction.drops.push(1);
    }
    return partialAction;
  }
}

function partialActionToAction(
  partialAction: PartialAction | null,
): { action: TakAction; complete: boolean } | null {
  if (partialAction?.dir) {
    const drops = partialAction.drops;
    const floatingCount = partialAction.take - drops.reduce((acc, drop) => acc + drop, 0);

    return {
      action: {
        pos: partialAction.pos,
        type: 'move',
        dir: partialAction.dir,
        drops: drops.map((x, i) => (i === drops.length - 1 ? x + floatingCount : x)),
      },
      complete: floatingCount === 0,
    };
  }
  return null;
}

interface PartialAction {
  take: number;
  drops: number[];
  pos: TakPos;
  dir: TakDir | null;
}

function areTilesDifferent(tile: TakUI3DTile, newTile: TakUI3DTile): boolean {
  return (
    tile.owner !== newTile.owner ||
    tile.highlighted !== newTile.highlighted ||
    tile.selectable !== newTile.selectable ||
    tile.hoverable !== newTile.hoverable ||
    tile.lastAction !== newTile.lastAction
  );
}
