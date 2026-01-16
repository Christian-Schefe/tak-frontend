import { Component, computed, inject, input, linkedSignal } from '@angular/core';
import {
  GameComponent,
  GameMode,
  GamePlayer,
} from '../../components/game-component/game-component';
import { gameEndedMessage, GameService } from '../../services/game-service/game-service';
import { IdentityService } from '../../services/identity-service/identity-service';
import { WsService } from '../../services/ws-service/ws-service';
import z from 'zod';
import { TakGameSettings, TakGameState, TakAction, TakPlayer } from '../../../tak-core';
import { doMove, TakGameUI, newGameUI } from '../../../tak-core/ui';
import { newGame, setTimeRemaining } from '../../../tak-core/game';
import { moveFromString, moveToString } from '../../../tak-core/move';
import { gameStateFromStr } from '../../../tak-core/ptn';

interface CurrentGame {
  gameId: number;
  settings: TakGameSettings;
  mode: GameMode;
  actions: string[];
  gameState: TakGameState | null;
}

@Component({
  selector: 'app-online-play-route',
  imports: [GameComponent],
  templateUrl: './online-play-route.html',
  styleUrl: './online-play-route.css',
})
export class OnlinePlayRoute {
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
            localColor: 'white',
          }
        : identity.playerId === game.playerIds.black
          ? {
              type: 'online',
              localColor: 'black',
            }
          : {
              type: 'spectator',
            };
    return {
      settings,
      gameId: game.id,
      mode,
      actions: game.actions,
      gameState: gameStateFromStr(game.status.type === 'ended' ? game.status.result : ''),
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
    if (
      game.actualGame.gameState.type === 'ongoing' &&
      currentGame.gameState &&
      currentGame.gameState.type !== 'ongoing'
    ) {
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

  constructor() {
    this.wsService.subscribeEffect(
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
    this.wsService.subscribeEffect(
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
        this.game.update((game) => {
          if (!game) {
            return game;
          }
          console.log('Received time update from server:', remainingMs);
          setTimeRemaining(game.actualGame, remainingMs, new Date());
          return { ...game };
        });
      },
    );

    this.wsService.subscribeEffect('gameEnded', gameEndedMessage, ({ gameId, result }) => {
      const currentGame = this.currentGame();
      if (!currentGame || currentGame.gameId !== gameId) {
        return;
      }
      this.game.update((game) => {
        if (!game || game.actualGame.gameState.type !== 'ongoing') {
          return game;
        }
        const newGameState = gameStateFromStr(result);
        if (newGameState && newGameState.type !== 'ongoing') {
          game.actualGame.gameState = newGameState;
          return { ...game };
        }
        return game;
      });
    });
  }

  onLocalAction(action: TakAction) {
    this.game.update((game) => {
      if (!game) {
        return null;
      }
      doMove(game, action);
      return { ...game };
    });
    const currentGame = this.currentGame();
    if (!currentGame) {
      return;
    }
    this.wsService
      .sendMessage('gameAction', {
        gameId: currentGame.gameId,
        action: moveToString(action),
      })
      .subscribe(() => {
        console.log('Sent action to server:', action);
      });
  }

  onRemoteAction(action: TakAction, plyIndex: number) {
    console.log('Received action from Board:', action);
    this.game.update((game) => {
      if (!game) {
        return null;
      }
      if (game.actualGame.history.length === plyIndex) {
        doMove(game, action);
      } else if (game.actualGame.history.length === plyIndex + 1) {
        // This is our own action echoed back; ignore it.
        console.log('Ignoring echoed back action.');
      } else {
        console.error(`Ply index mismatch: got ${plyIndex}`);
        this.ongoingGameStatus.refetch();
      }
      return { ...game };
    });
  }
}
