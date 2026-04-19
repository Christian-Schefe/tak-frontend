import { immerable } from 'immer';
import {
  playerOpponent,
  TakAction,
  TakActionRecord,
  TakBaseGameSettings,
  TakGameResult,
  TakGameState,
  TakPlayer,
  TakReserve,
} from '.';
import { TakBoard } from './board';

export class TakBaseGame {
  [immerable] = true;

  settings: TakBaseGameSettings;
  board: TakBoard;
  currentPlayer: TakPlayer = 'white';
  reserves: Record<TakPlayer, TakReserve>;
  boardHashHistory: Record<string, number | undefined> = {};
  actionHistory: TakActionRecord[] = [];
  gameResult: TakGameResult | null = null;

  constructor(settings: TakBaseGameSettings) {
    this.settings = settings;
    this.board = new TakBoard(settings.boardSize);
    this.reserves = {
      white: { ...settings.reserve },
      black: { ...settings.reserve },
    };
  }

  clone(): TakBaseGame {
    const newGame = new TakBaseGame(this.settings);
    newGame.board = this.board.clone();
    newGame.currentPlayer = this.currentPlayer;
    newGame.reserves = {
      white: { ...this.reserves.white },
      black: { ...this.reserves.black },
    };
    newGame.boardHashHistory = { ...this.boardHashHistory };
    newGame.actionHistory = [...this.actionHistory];
    newGame.gameResult = this.gameResult;
    return newGame;
  }

  gameState(): TakGameState {
    return this.gameResult ?? { type: 'ongoing' };
  }

  isOngoing(): boolean {
    return this.gameResult === null;
  }

  canDoAction(action: TakAction): boolean {
    if (this.gameResult !== null) {
      return false;
    }
    switch (action.type) {
      case 'place': {
        if (this.actionHistory.length < 2 && action.variant !== 'flat') {
          return false;
        }
        const reserve = this.reserves[this.currentPlayer];
        const amountInReserve = action.variant === 'capstone' ? reserve.capstones : reserve.pieces;
        if (amountInReserve <= 0) {
          return false;
        }
        return this.board.canDoPlace(action.pos) && this.reserves[this.currentPlayer].pieces > 0;
      }
      case 'move': {
        if (this.actionHistory.length < 2) {
          return false;
        }
        return this.board.canDoMove(action.pos, action.dir, action.drops);
      }
    }
  }

  doAction(action: TakAction): boolean {
    if (!this.canDoAction(action)) {
      return false;
    }
    const movedPlayer = this.currentPlayer;
    let actionRecord: TakActionRecord;
    switch (action.type) {
      case 'place': {
        const placingPlayer =
          this.actionHistory.length < 2 ? playerOpponent(this.currentPlayer) : this.currentPlayer;
        const reserve = this.reserves[placingPlayer];
        if (action.variant === 'capstone') {
          reserve.capstones -= 1;
        } else {
          reserve.pieces -= 1;
        }
        const result = this.board.doPlace(action.pos, action.variant, placingPlayer);
        if (!result) {
          return false;
        }
        actionRecord = { type: 'place', action, pieceIds: [result.pieceId] };
        break;
      }
      case 'move': {
        const result = this.board.doMove(action.pos, action.dir, action.drops);
        if (!result) {
          return false;
        }
        actionRecord = {
          type: 'move',
          action,
          pieceIds: result.pieceIds,
          wasSmash: result.wasSmash,
        };
        break;
      }
    }
    this.actionHistory.push(actionRecord);
    this.currentPlayer = playerOpponent(this.currentPlayer);

    const boardHash = this.board.computeHashString();
    this.boardHashHistory[boardHash] = (this.boardHashHistory[boardHash] ?? 0) + 1;

    const gameResult = this.checkGameOver(boardHash, movedPlayer);
    if (gameResult) {
      this.gameResult = gameResult;
    }
    return true;
  }

  canUndoAction(): boolean {
    if (this.gameResult !== null) {
      return false;
    }
    return this.actionHistory.length > 0;
  }

  undoAction(): boolean {
    if (!this.canUndoAction()) {
      return false;
    }
    const lastActionRecord = this.actionHistory.pop();
    if (!lastActionRecord) {
      return false;
    }
    const boardHash = this.board.computeHashString();
    this.boardHashHistory[boardHash] = (this.boardHashHistory[boardHash] ?? 1) - 1;
    this.currentPlayer = playerOpponent(this.currentPlayer);

    switch (lastActionRecord.type) {
      case 'place': {
        this.board.undoPlace(lastActionRecord.action.pos);
        break;
      }
      case 'move': {
        this.board.undoMove(
          lastActionRecord.action.pos,
          lastActionRecord.action.dir,
          lastActionRecord.action.drops,
          lastActionRecord.wasSmash,
        );
        break;
      }
    }
    return true;
  }

  private checkGameOver(boardHash: string, movedPlayer: TakPlayer): TakGameResult | null {
    const whiteReserveEmpty =
      this.reserves.white.pieces === 0 && this.reserves.white.capstones === 0;
    const blackReserveEmpty =
      this.reserves.black.pieces === 0 && this.reserves.black.capstones === 0;
    const repeatCount = this.boardHashHistory[boardHash] ?? 0;

    if (this.board.checkForRoad(movedPlayer)) {
      return {
        type: 'win',
        winner: movedPlayer,
        reason: 'road',
      };
    } else if (this.board.checkForRoad(playerOpponent(movedPlayer))) {
      return { type: 'win', winner: playerOpponent(movedPlayer), reason: 'road' };
    } else if (this.board.isFull() || whiteReserveEmpty || blackReserveEmpty) {
      const flatCounts = this.board.countFlats();
      const whiteScore = flatCounts.white * 2;
      const blackScore = flatCounts.black * 2 + this.settings.halfKomi;
      if (whiteScore > blackScore) {
        return { type: 'win', winner: 'white', reason: 'flats', counts: flatCounts };
      } else if (blackScore > whiteScore) {
        return { type: 'win', winner: 'black', reason: 'flats', counts: flatCounts };
      } else {
        return { type: 'draw' };
      }
    } else if (repeatCount >= 3) {
      return { type: 'draw' };
    }
    return null;
  }

  trimToPlyIndex(plyIndex: number) {
    const undoCount = this.actionHistory.length - plyIndex;
    for (let i = 0; i < undoCount; i++) {
      this.undoAction();
    }
  }
}
