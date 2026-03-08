import { Component, computed, effect, inject, input, linkedSignal, OnDestroy } from '@angular/core';
import {
  GameComponent,
  GameMode,
  GamePlayer,
  TakActionEvent,
} from '../../components/game-component/game-component';
import { GameRequestType, GameService } from '../../services/game-service/game-service';
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
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { GameAudioService } from '../../services/game-audio-service/game-audio-service';
import { GameActionsPanel } from '../../components/game-actions-panel/game-actions-panel';
import { GameInfoPanel } from '../../components/game-info-panel/game-info-panel';
import { GamePlayerBar } from '../../components/game-player-bar/game-player-bar';
import { GameChatPanel } from '../../components/game-chat-panel/game-chat-panel';

interface CurrentGame {
  gameId: number;
  settings: TakGameSettings;
  mode: GameMode;
  actions: string[];
  gameState: TakGameState;
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
      boardSize: game.gameSettings.boardSize,
      halfKomi: game.gameSettings.halfKomi,
      reserve: {
        pieces: game.gameSettings.pieces,
        capstones: game.gameSettings.capstones,
      },
      clock: {
        ...game.gameSettings.timeSettings,
        externallyDriven: true,
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
    console.log(`Replayed ${currentGame.actions.length.toString()} actions from server.`);
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
          const resultingPlyIndex = game.actualGame.history.length + 1;
          if (resultingPlyIndex === event.plyIndex) {
            this.gameAudioService.playMoveSound();

            return produce(game, (game) => {
              doMove(game, moveFromString(event.action));
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
          const resultingPlyIndex = game.actualGame.history.length - 1;
          if (resultingPlyIndex === event.plyIndex) {
            console.log('Applying undo from server.');
            return produce(game, (game) => {
              undoMove(game);
            });
          } else {
            console.error(`Ply index mismatch on undo: got ${event.plyIndex.toString()}`);
            this.ongoingGameStatus.refetch();
          }
          return game;
        });
      } else if (event.eventType === 'gameEnded') {
        this.game.update((game) => {
          const newGameState = gameStateFromStr(event.result);
          if (!game || !newGameState) {
            return game;
          }
          return produce(game, (game) => {
            setGameOverState(game, newGameState);
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
          setTimeRemaining(game.actualGame, event.timeInfo, new Date());
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

    if (move !== null) {
      this.gameAudioService.playMoveSound();
    }

    this.game.update((game) => {
      if (!game) {
        return game;
      }
      return produce(game, (game) => {
        if (move !== null) {
          doMove(game, move);
        } else if (pos !== null) {
          updatePartialMove(game, pos);
        }
      });
    });

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

  gameStateTrigger = computed<TakGameState | undefined>(() => {
    return this.game()?.actualGame.gameState;
  });
  showGameOverInfo = linkedSignal(() => {
    const gameState = this.gameStateTrigger();
    if (!gameState) {
      return false;
    }
    return gameState.type !== 'ongoing';
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
