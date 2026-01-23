import { Component, computed, effect, inject, input, linkedSignal, OnDestroy } from '@angular/core';
import {
  GameComponent,
  GameMode,
  GamePlayer,
  TakActionEvent,
} from '../../components/game-component/game-component';
import {
  gameEndedMessage,
  GameRequestType,
  GameService,
} from '../../services/game-service/game-service';
import { IdentityService } from '../../services/identity-service/identity-service';
import { WsService } from '../../services/ws-service/ws-service';
import z from 'zod';
import { TakGameSettings, TakGameState, TakAction, TakPlayer, TakPos } from '../../../tak-core';
import {
  doMove,
  TakGameUI,
  newGameUI,
  setPlyIndex,
  setGameOverState,
  tryPlaceOrAddToPartialMove,
  updatePartialMove,
  undoMove,
} from '../../../tak-core/ui';
import { newGame, setTimeRemaining } from '../../../tak-core/game';
import { moveFromString, moveToString } from '../../../tak-core/move';
import { gameStateFromStr } from '../../../tak-core/ptn';
import { produce } from 'immer';

interface CurrentGame {
  gameId: number;
  settings: TakGameSettings;
  mode: GameMode;
  actions: string[];
  gameState: TakGameState;
  remainingMs: Record<TakPlayer, number>;
}

@Component({
  selector: 'app-online-play-route',
  imports: [GameComponent],
  templateUrl: './online-play-route.html',
  styleUrl: './online-play-route.css',
})
export class OnlinePlayRoute implements OnDestroy {
  gameService = inject(GameService);
  identityService = inject(IdentityService);
  wsService = inject(WsService);
  id = input.required<string>();
  numId = computed(() => {
    const numId = Number(this.id());
    if (isNaN(numId)) {
      return undefined;
    }
    return numId;
  });

  ongoingGameStatus = this.gameService.gameStatus(() => {
    return this.numId();
  });

  currentGame = computed<CurrentGame | null>(() => {
    const numId = this.numId();
    const identity = this.identityService.identity();
    const game = this.ongoingGameStatus.value();
    if (!identity || !numId || !game) {
      return null;
    }
    const settings: TakGameSettings = {
      boardSize: game.gameSettings.boardSize,
      halfKomi: game.gameSettings.halfKomi,
      reserve: {
        pieces: game.gameSettings.pieces,
        capstones: game.gameSettings.capstones,
      },
      clock: {
        contingentMs: game.gameSettings.contingentMs,
        incrementMs: game.gameSettings.incrementMs,
        externallyDriven: true,
        extra: game.gameSettings.extra
          ? {
              move: game.gameSettings.extra.onMove,
              amountMs: game.gameSettings.extra.extraMs,
            }
          : undefined,
      },
    };
    const mode: GameMode =
      identity.playerId === game.playerIds.white
        ? {
            type: 'online',
            localPlayer: 'white',
          }
        : identity.playerId === game.playerIds.black
          ? {
              type: 'online',
              localPlayer: 'black',
            }
          : {
              type: 'spectator',
            };

    const gameState: TakGameState | null =
      game.status.type === 'ended'
        ? gameStateFromStr(game.status.result)
        : game.status.type === 'aborted'
          ? { type: 'aborted' }
          : null;

    return {
      settings,
      gameId: game.id,
      mode,
      actions: game.actions,
      gameState: gameState ?? { type: 'ongoing' },
      remainingMs: game.remainingMs,
    };
  });

  game = linkedSignal<TakGameUI | null>(() => {
    const currentGame = this.currentGame();
    if (!currentGame) {
      return null;
    }
    const game = newGameUI(newGame(currentGame.settings));
    for (const actionRecord of currentGame.actions) {
      doMove(game, moveFromString(actionRecord));
    }
    setTimeRemaining(game.actualGame, currentGame.remainingMs, new Date());
    if (game.actualGame.gameState.type === 'ongoing' && currentGame.gameState.type !== 'ongoing') {
      game.actualGame.gameState = currentGame.gameState;
    }
    console.log(`Replayed ${currentGame.actions.length} actions from server.`);
    return game;
  });

  players = computed<Record<TakPlayer, GamePlayer> | null>(() => {
    const game = this.ongoingGameStatus.value();
    if (!game) {
      return null;
    }
    return {
      white: { type: 'player', playerId: game.playerIds.white },
      black: { type: 'player', playerId: game.playerIds.black },
    };
  });

  private isSubscribedToGameId: number | null = null;

  private _subscribeSpectateEffect = effect(() => {
    const currentGame = this.currentGame();
    const game = this.game();
    const shouldBeSubscribedToGameId =
      currentGame !== null &&
      game !== null &&
      currentGame.mode.type === 'spectator' &&
      game.actualGame.gameState.type === 'ongoing'
        ? currentGame.gameId
        : null;
    if (
      this.isSubscribedToGameId === shouldBeSubscribedToGameId ||
      !this.wsService.authenticated()
    ) {
      return;
    }
    console.log('setting spectate subscription to', shouldBeSubscribedToGameId);
    this.isSubscribedToGameId = shouldBeSubscribedToGameId;
    this.wsService
      .sendMessage('spectateGame', { gameId: shouldBeSubscribedToGameId, spectate: true })
      .subscribe(() => {
        if (shouldBeSubscribedToGameId !== null) {
          console.log('Subscribed to spectate game:', currentGame?.gameId);
        } else {
          console.log('Unsubscribed from spectating game.');
        }
      });
  });

  ngOnDestroy() {
    if (this.isSubscribedToGameId !== null) {
      this.wsService
        .sendMessage('spectateGame', { gameId: this.isSubscribedToGameId, spectate: false })
        .subscribe(() => {
          console.log('Unsubscribed from spectating game on destroy.');
        });
    }
  }

  private readonly _gameActionEffect = this.wsService.subscribeEffect(
    'gameAction',
    z.object({ gameId: z.number(), action: z.string(), plyIndex: z.number() }),
    ({ gameId, action, plyIndex }) => {
      const currentGame = this.currentGame();
      if (!currentGame || currentGame.gameId !== gameId) {
        return;
      }
      this.onRemoteAction(moveFromString(action), plyIndex);
    },
  );
  private readonly _gameUndoEffect = this.wsService.subscribeEffect(
    'gameActionUndone',
    z.object({ gameId: z.number() }),
    ({ gameId }) => {
      const currentGame = this.currentGame();
      if (!currentGame || currentGame.gameId !== gameId) {
        return;
      }
      this.game.update((game) => {
        if (!game) {
          return game;
        }
        return produce(game, (game) => {
          undoMove(game);
        });
      });
    },
  );

  private readonly _gameTimeUpdateEffect = this.wsService.subscribeEffect(
    'gameTimeUpdate',
    z.object({
      gameId: z.number(),
      remainingMs: z.object({ white: z.number(), black: z.number() }),
    }),
    ({ gameId, remainingMs }) => {
      const currentGame = this.currentGame();
      if (!currentGame || currentGame.gameId !== gameId) {
        return;
      }
      console.log('Received time update from server:', remainingMs);
      this.game.update((game) => {
        if (!game) {
          return game;
        }
        return produce(game, (game) => {
          setTimeRemaining(game.actualGame, remainingMs, new Date());
        });
      });
    },
  );

  private readonly _gameEndedEffect = this.wsService.subscribeEffect(
    'gameEnded',
    gameEndedMessage,
    ({ gameId, result }) => {
      const currentGame = this.currentGame();
      if (!currentGame || currentGame.gameId !== gameId) {
        return;
      }
      this.game.update((game) => {
        const newGameState = gameStateFromStr(result);
        if (!game || !newGameState) {
          return game;
        }
        return produce(game, (game) => {
          setGameOverState(game, newGameState);
        });
      });
    },
  );

  private readonly _addRequestEffect = this.wsService.subscribeEffect(
    'gameRequestAdded',
    z.object({
      gameId: z.number(),
      requestId: z.number(),
      requestType: z.object({ type: z.union([z.literal('draw'), z.literal('undo')]) }),
      fromPlayerId: z.string(),
    }),
    ({ gameId, requestId, requestType, fromPlayerId }) => {
      const currentGame = this.currentGame();
      if (!currentGame || currentGame.gameId !== gameId) {
        return;
      }
      this.requests.update((ids) => {
        return [...ids, { id: requestId, requestType, fromPlayerId }];
      });
    },
  );

  private readonly _retractRequestEffect = this.wsService.subscribeEffect(
    'gameRequestRemoved',
    z.object({
      gameId: z.number(),
      requestId: z.number(),
    }),
    ({ gameId, requestId }) => {
      const currentGame = this.currentGame();
      if (!currentGame || currentGame.gameId !== gameId) {
        return;
      }
      this.requests.update((requests) => {
        return requests.filter((request) => request.id !== requestId);
      });
    },
  );

  requests = linkedSignal<GameRequestType[]>(() => {
    const gameStatus = this.ongoingGameStatus.value();
    if (!gameStatus || gameStatus.status.type !== 'ongoing') {
      return [];
    }
    return gameStatus.status.requests;
  });

  onLocalAction(action: TakActionEvent) {
    const game = this.game();
    if (!game) {
      return;
    }
    let move: TakAction | null = null;
    let pos: TakPos | null = null;
    if (action.type === 'full') {
      move = action.action;
    } else {
      move = tryPlaceOrAddToPartialMove(game, action.pos, action.variant);
      pos = action.pos;
    }

    const newGame = produce(game, (game) => {
      if (move !== null) {
        doMove(game, move);
      } else if (pos !== null) {
        updatePartialMove(game, pos);
      }
    });
    this.game.set(newGame);
    const currentGame = this.currentGame();
    if (!currentGame) {
      return;
    }

    if (move !== null) {
      this.wsService
        .sendMessage('gameAction', {
          gameId: currentGame.gameId,
          action: moveToString(move),
        })
        .subscribe(() => {
          console.log('Sent action to server:', action);
        });
    }
  }

  onRemoteAction(action: TakAction, plyIndex: number) {
    console.log('Received action from Board:', action);
    this.game.update((game) => {
      if (!game) {
        return game;
      }
      if (game.actualGame.history.length === plyIndex) {
        return produce(game, (game) => {
          doMove(game, action);
        });
      } else if (game.actualGame.history.length === plyIndex + 1) {
        // This is our own action echoed back; ignore it.
        console.log('Ignoring echoed back action.');
      } else {
        console.error(`Ply index mismatch: got ${plyIndex}`);
        this.ongoingGameStatus.refetch();
      }
      return game;
    });
  }

  onSetHistoryPlyIndex(plyIndex: number) {
    this.game.update((game) => {
      if (!game) {
        return game;
      }
      return produce(game, (game) => {
        setPlyIndex(game, plyIndex);
      });
    });
  }

  onResign() {
    const game = this.currentGame();
    if (!game) {
      return;
    }
    this.gameService.resignGame(game.gameId).subscribe(() => {
      console.log('Resigned successfully.');
    });
  }

  onRequestDraw() {
    const game = this.currentGame();
    if (!game) {
      return;
    }
    this.gameService.offerDraw(game.gameId).subscribe(() => {
      console.log('Offered draw successfully.');
    });
  }

  onRequestUndo() {
    const game = this.currentGame();
    if (!game) {
      return;
    }
    this.gameService.requestUndo(game.gameId).subscribe(() => {
      console.log('Requested undo successfully.');
    });
  }

  onRetractRequest(requestId: number) {
    const game = this.currentGame();
    if (!game) {
      return;
    }
    this.gameService.retractRequest(game.gameId, requestId).subscribe(() => {
      console.log('Retracted request successfully.');
    });
  }

  onRequestDecision(requestId: number, decision: 'accept' | 'reject') {
    const game = this.currentGame();
    if (!game) {
      return;
    }
    this.gameService
      .respondToRequest(game.gameId, requestId, decision === 'accept')
      .subscribe(() => {
        console.log(`Sent request decision (${decision}) successfully.`);
      });
  }
}
