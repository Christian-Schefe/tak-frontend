import {
  Component,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  OnDestroy,
  signal,
} from '@angular/core';
import {
  GameComponent,
  GameMode,
  GamePlayer,
} from '../../components/game-component/game-component';
import { GameRequestType, GameService } from '../../services/game-service/game-service';
import { IdentityService } from '../../services/identity-service/identity-service';
import { WsService } from '../../services/ws-service/ws-service';
import z from 'zod';

import { produce } from 'immer';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { GameAudioService } from '../../services/game-audio-service/game-audio-service';
import { GameActionsPanel } from '../../components/game-actions-panel/game-actions-panel';
import { GameInfoPanel } from '../../components/game-info-panel/game-info-panel';
import { GamePlayerBar } from '../../components/game-player-bar/game-player-bar';
import { GameChatPanel } from '../../components/game-chat-panel/game-chat-panel';
import {
  TakAction,
  TakGame,
  TakGameResult,
  TakGameSettings,
  TakGameState,
  TakPlayer,
} from '../../../tak-core';
import { actionFromString, actionToString, gameResultFromString } from '../../../tak-core/ptn';

interface CurrentGame {
  gameId: number;
  settings: TakGameSettings;
  mode: GameMode;
  actions: string[];
  gameResult: TakGameResult | null;
  remainingMs: Record<TakPlayer, number>;
}

const timeInfo = z.object({ white: z.number(), black: z.number() });

const gameEventBase = z.object({ gameId: z.number(), timeInfo });

const gameEvent = z.union([
  z.object({
    eventType: z.literal('gameAction'),
    action: z.string(),
    plyIndex: z.number(),
    ...gameEventBase.shape,
  }),
  z.object({
    eventType: z.literal('gameActionUndone'),
    plyIndex: z.number(),
    ...gameEventBase.shape,
  }),
  z.object({
    eventType: z.literal('gameEnded'),
    result: z.string(),
    ...gameEventBase.shape,
  }),
  z.object({
    eventType: z.literal('gameRequestAdded'),
    requestId: z.number(),
    requestType: z.object({ type: z.union([z.literal('draw'), z.literal('undo')]) }),
    fromPlayerId: z.string(),
    ...gameEventBase.shape,
  }),
  z.object({
    eventType: z.literal('gameRequestRemoved'),
    requestId: z.number(),
    ...gameEventBase.shape,
  }),
]);

const matchEvent = z.union([
  z.object({
    eventType: z.literal('matchRematchRequestAdded'),
    matchId: z.number(),
    fromPlayerId: z.string(),
  }),
  z.object({
    eventType: z.literal('matchRematchRequestRemoved'),
    matchId: z.number(),
  }),
]);

@Component({
  selector: 'app-online-play-route',
  imports: [
    GameComponent,
    ProgressSpinnerModule,
    GameActionsPanel,
    GameInfoPanel,
    GamePlayerBar,
    GameChatPanel,
  ],
  templateUrl: './online-play-route.html',
  styleUrl: './online-play-route.css',
})
export class OnlinePlayRoute implements OnDestroy {
  private gameService = inject(GameService);
  private identityService = inject(IdentityService);
  private wsService = inject(WsService);
  private gameAudioService = inject(GameAudioService);

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
    if (!identity || numId === undefined || !game) {
      return null;
    }
    const settings: TakGameSettings = {
      base: {
        boardSize: game.gameSettings.boardSize,
        halfKomi: game.gameSettings.halfKomi,
        reserve: {
          pieces: game.gameSettings.pieces,
          capstones: game.gameSettings.capstones,
        },
      },
      timeControl: game.gameSettings.timeSettings,
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

    const gameState: TakGameResult | null =
      game.status.type === 'ended'
        ? gameResultFromString(game.status.result)
        : game.status.type === 'aborted'
          ? { type: 'aborted' }
          : null;

    return {
      settings,
      gameId: game.id,
      mode,
      actions: game.actions,
      gameResult: gameState,
      remainingMs: game.remainingMs,
    };
  });

  game = linkedSignal<TakGame | null>(() => {
    const currentGame = this.currentGame();
    if (!currentGame) {
      return null;
    }
    const now = Date.now();
    const game = new TakGame(currentGame.settings);
    for (const actionRecord of currentGame.actions) {
      const action = actionFromString(actionRecord);
      if (!action) {
        console.error('Invalid action string from server:', actionRecord);
        continue;
      }
      game.doAction(action, now);
    }
    game.setTimeRemaining(currentGame.remainingMs, now);
    if (game.base.isOngoing() && currentGame.gameResult) {
      game.setGameOver(currentGame.gameResult, now);
    }
    console.log(`Replayed ${currentGame.actions.length.toString()} actions from server.`);
    return game;
  });

  plyIndex = signal<number | null>(null);

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
      game.base.isOngoing()
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

  private readonly _matchEventEffect = this.wsService.subscribeEffect(
    'matchEvent',
    matchEvent,
    (event) => {
      const currentGame = this.ongoingGameStatus.value();
      if (!currentGame || currentGame.matchId !== event.matchId) {
        return;
      }
      if (event.eventType === 'matchRematchRequestAdded') {
        this.rematchRequestedBy.set(event.fromPlayerId);
      } else {
        this.rematchRequestedBy.set(null);
      }
    },
  );

  private readonly _gameEventEffect = this.wsService.subscribeEffect(
    'gameEvent',
    gameEvent,
    (event) => {
      const currentGame = this.currentGame();
      if (!currentGame || currentGame.gameId !== event.gameId) {
        return;
      }
      if (event.eventType === 'gameAction') {
        this.game.update((game) => {
          if (!game) {
            return game;
          }
          const resultingPlyIndex = game.base.actionHistory.length + 1;
          if (resultingPlyIndex === event.plyIndex) {
            this.gameAudioService.playMoveSound();
            const action = actionFromString(event.action);
            if (!action) {
              console.error('Invalid action string from server:', event.action);
              return game;
            }
            return produce(game, (game) => {
              game.doAction(action, Date.now());
            });
          } else if (resultingPlyIndex - 1 === event.plyIndex) {
            // This is our own action echoed back; ignore it.
            console.log('Ignoring echoed back action.');
          } else {
            console.error(`Ply index mismatch: got ${event.plyIndex.toString()}`);
            this.ongoingGameStatus.refetch();
          }
          return game;
        });
      } else if (event.eventType === 'gameActionUndone') {
        this.game.update((game) => {
          if (!game) {
            return game;
          }
          const resultingPlyIndex = game.base.actionHistory.length - 1;
          if (resultingPlyIndex === event.plyIndex) {
            console.log('Applying undo from server.');
            return produce(game, (game) => {
              game.undoAction(Date.now());
            });
          } else {
            console.error(`Ply index mismatch on undo: got ${event.plyIndex.toString()}`);
            this.ongoingGameStatus.refetch();
          }
          return game;
        });
      } else if (event.eventType === 'gameEnded') {
        this.game.update((game) => {
          const newGameState = gameResultFromString(event.result);
          if (!game || !newGameState) {
            return game;
          }
          return produce(game, (game) => {
            game.setGameOver(newGameState, Date.now());
          });
        });
      } else if (event.eventType === 'gameRequestAdded') {
        this.requests.update((ids) => {
          return [
            ...ids,
            {
              id: event.requestId,
              requestType: event.requestType,
              fromPlayerId: event.fromPlayerId,
            },
          ];
        });
      } else {
        this.requests.update((requests) => {
          return requests.filter((request) => request.id !== event.requestId);
        });
      }

      this.game.update((game) => {
        if (!game) {
          return game;
        }
        return produce(game, (game) => {
          game.setTimeRemaining(event.timeInfo, Date.now());
        });
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

  rematchRequestedBy = linkedSignal(() => {
    const rematchStatus = this.rematchRequestStatus.value();
    return rematchStatus?.rematchRequestedBy ?? null;
  });

  rematchRequestAction = computed<'request' | 'accept' | 'retract' | undefined>(() => {
    const identity = this.identityService.identity();
    const gameStatus = this.currentGame();
    if (!gameStatus || !identity || gameStatus.mode.type !== 'online') {
      return undefined;
    }

    const rematchRequestedBy = this.rematchRequestedBy();
    if (rematchRequestedBy === null) {
      return 'request';
    }
    if (rematchRequestedBy === identity.playerId) {
      return 'retract';
    }
    return 'accept';
  });

  onLocalAction(action: TakAction) {
    const game = this.game();
    if (!game) {
      return;
    }

    this.gameAudioService.playMoveSound();

    this.game.update((game) => {
      if (!game) {
        return game;
      }
      return produce(game, (game) => {
        game.doAction(action, Date.now());
      });
    });

    const currentGame = this.currentGame();
    if (!currentGame) {
      return;
    }

    this.wsService
      .sendMessage('gameAction', {
        gameId: currentGame.gameId,
        action: actionToString(action),
      })
      .subscribe(() => {
        console.log('Sent action to server:', action);
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

  onRequestDecision({ requestId, decision }: { requestId: number; decision: 'accept' | 'reject' }) {
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

  onSetHistoryPlyIndex(plyIndex: number | null) {
    const game = this.game();
    if (!game) {
      return;
    }
    const currentPlyIndex = game.base.actionHistory.length;
    const newPlyIndex = plyIndex !== null && plyIndex >= currentPlyIndex ? null : plyIndex;
    this.plyIndex.set(newPlyIndex);
  }

  rematchRequestStatus = this.gameService.getRematchStatus(() => {
    const gameStatus = this.ongoingGameStatus.value();
    if (!gameStatus || gameStatus.matchId === null) {
      return undefined;
    }
    return gameStatus.matchId;
  });

  onRequestRematch() {
    console.log('Requesting rematch...');
    const gameStatus = this.ongoingGameStatus.value();
    if (!gameStatus || gameStatus.matchId === null) {
      console.error('Cannot request rematch: no match ID found.');
      return;
    }
    this.gameService.requestRematch(gameStatus.matchId).subscribe(() => {
      console.log('Requested rematch successfully.');
    });
  }

  onRetractRematchRequest() {
    const gameStatus = this.ongoingGameStatus.value();
    if (!gameStatus || gameStatus.matchId === null) {
      console.error('Cannot retract rematch request: no match ID found.');
      return;
    }
    this.gameService.retractRematchRequest(gameStatus.matchId).subscribe(() => {
      console.log('Retracted rematch request successfully.');
    });
  }

  gameStateTrigger = computed<TakGameState | undefined>(() => {
    const game = this.game();
    if (!game) {
      return undefined;
    }
    if (game.base.gameResult) {
      return game.base.gameResult;
    }
    return { type: 'ongoing' };
  });
  showGameOverInfo = linkedSignal(() => {
    const gameState = this.gameStateTrigger();
    return !!gameState;
  });

  opponentRequests = computed<GameRequestType[]>(() => {
    const identity = this.identityService.identity();
    const gameState = this.gameStateTrigger();
    if (!identity || !gameState || gameState.type !== 'ongoing') {
      return [];
    }
    const opponentRequests = this.requests().filter(
      (request) => request.fromPlayerId !== identity.playerId,
    );
    console.log('opponentRequests', opponentRequests);
    return opponentRequests;
  });

  myDrawOffer = computed<number | null>(() => {
    const identity = this.identityService.identity();
    if (!identity) {
      return null;
    }
    const drawRequest = this.requests().find(
      (request) =>
        request.requestType.type === 'draw' && request.fromPlayerId === identity.playerId,
    );
    return drawRequest ? drawRequest.id : null;
  });

  myUndoRequest = computed<number | null>(() => {
    const identity = this.identityService.identity();
    if (!identity) {
      return null;
    }
    const undoRequest = this.requests().find(
      (request) =>
        request.requestType.type === 'undo' && request.fromPlayerId === identity.playerId,
    );
    return undoRequest ? undoRequest.id : null;
  });
}
