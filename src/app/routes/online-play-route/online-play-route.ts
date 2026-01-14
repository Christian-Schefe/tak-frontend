import { Component, computed, effect, inject, linkedSignal } from '@angular/core';
import { GameComponent, GameMode } from '../../components/game-component/game-component';
import { GameInfo, GameService } from '../../services/game-service/game-service';
import { IdentityService } from '../../services/identity-service/identity-service';
import { TakAction, TakGameSettings } from '../../../tak';
import { WsService } from '../../services/ws-service/ws-service';
import z from 'zod';
import { TakGame, takOngoingGameDoAction, takOngoingGameNew } from '../../../tak/game';
import { takActionFromString, takActionToString } from '../../../tak/ptn';

interface CurrentGame {
  gameId: number;
  settings: TakGameSettings;
  mode: GameMode;
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

  private lastPlayedGame = linkedSignal({
    source: () => ({ identity: this.identityService.identity(), games: this.gameService.games() }),
    computation: (source, prev): GameInfo | null => {
      const identity = source.identity;
      if (!identity) {
        return null;
      }
      const games = this.gameService.games();
      const myGame = games.find(
        (game) => game.whiteId === identity.playerId || game.blackId === identity.playerId,
      );
      if (!myGame) {
        return prev?.value || null;
      }
      return myGame;
    },
  });

  ongoingGameStatus = this.gameService.ongoingGameStatus(() => {
    const myGame = this.lastPlayedGame();
    return myGame ? myGame.id : undefined;
  });

  currentGame = computed<CurrentGame | null>(() => {
    const myGame = this.lastPlayedGame();
    const identity = this.identityService.identity();
    if (!identity || !myGame) {
      return null;
    }
    const settings: TakGameSettings = {
      boardSize: myGame.gameSettings.boardSize,
      halfKomi: myGame.gameSettings.halfKomi,
      reserve: {
        flats: myGame.gameSettings.pieces,
        capstones: myGame.gameSettings.capstones,
      },
      timeControl: {
        contingentMs: myGame.gameSettings.contingentMs,
        incrementMs: myGame.gameSettings.incrementMs,
        extra: myGame.gameSettings.extra
          ? {
              onMove: myGame.gameSettings.extra.onMove,
              extraMs: myGame.gameSettings.extra.extraMs,
            }
          : null,
      },
    };
    return {
      settings,
      gameId: myGame.id,
      mode: {
        type: 'online',
        localColor: identity.playerId === myGame.whiteId ? 'white' : 'black',
      },
    };
  });

  game = linkedSignal<TakGame | null>(() => {
    const currentGame = this.currentGame();
    if (!currentGame) {
      return null;
    }
    const game = takOngoingGameNew(currentGame.settings);
    if (this.ongoingGameStatus.hasValue()) {
      const actions = this.ongoingGameStatus.value().actions;
      for (const actionRecord of actions) {
        const res = takOngoingGameDoAction(game, takActionFromString(actionRecord), Date.now());
        if (res && res.type === 'error') {
          console.error('Error applying action from server:', res.reason);
        }
      }
      console.log(`Replayed ${actions.length} actions from server.`);
    }
    console.log('Initialized ongoing game from server actions:', game);
    return { type: 'ongoing', game };
  });

  constructor() {
    effect((onCleanup) => {
      const cleanup = this.wsService.subscribe(
        'gameAction',
        z.object({ gameId: z.number(), action: z.string(), plyIndex: z.number() }),
        ({ gameId, action, plyIndex }) => {
          const currentGame = this.currentGame();
          if (!currentGame || currentGame.gameId !== gameId) {
            return;
          }
          this.onRemoteAction(takActionFromString(action), plyIndex);
        },
      );
      onCleanup(() => {
        cleanup();
      });
    });
  }

  onLocalAction(action: TakAction) {
    this.game.update((game) => {
      if (!game) {
        return null;
      }
      if (game.type === 'ongoing') {
        const res = takOngoingGameDoAction(game.game, action, Date.now());
        if (res && res.type === 'game-over') {
          return { type: 'finished', game: res.game };
        }
        if (res && res.type === 'error') {
          console.error('Invalid action attempted:', res.reason);
        }
      }
      return { ...game };
    });
    const currentGame = this.currentGame();
    if (!currentGame) {
      return;
    }
    this.wsService
      .sendMessage('gameAction', {
        gameId: currentGame.gameId,
        action: takActionToString(action),
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
      if (game.type === 'ongoing') {
        if (game.game.actionHistory.length === plyIndex) {
          const res = takOngoingGameDoAction(game.game, action, Date.now());
          if (res && res.type === 'game-over') {
            return { type: 'finished', game: res.game };
          }
          if (res && res.type === 'error') {
            console.error('Invalid action attempted:', res.reason);
          }
        } else if (game.game.actionHistory.length === plyIndex + 1) {
          // This is our own action echoed back; ignore it.
          console.log('Ignoring echoed back action.');
        } else {
          console.error(`Ply index mismatch:  got ${plyIndex}`);
          //TODO: refetch game state from server
        }
      }
      return { ...game };
    });
  }
}
