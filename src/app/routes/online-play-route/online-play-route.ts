import { Component, computed, inject, input, linkedSignal } from '@angular/core';
import {
  GameComponent,
  GameMode,
  GamePlayer,
} from '../../components/game-component/game-component';
import { GameService } from '../../services/game-service/game-service';
import { IdentityService } from '../../services/identity-service/identity-service';
import { TakAction, TakGameSettings, TakPlayer } from '../../../tak';
import { WsService } from '../../services/ws-service/ws-service';
import z from 'zod';
import { TakGame, takOngoingGameDoAction, takOngoingGameNew } from '../../../tak/game';
import { takActionFromString, takActionToString } from '../../../tak/ptn';

interface CurrentGame {
  gameId: number;
  settings: TakGameSettings;
  mode: GameMode;
  actions: string[];
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
        flats: game.gameSettings.pieces,
        capstones: game.gameSettings.capstones,
      },
      timeControl: {
        contingentMs: game.gameSettings.contingentMs,
        incrementMs: game.gameSettings.incrementMs,
        extra: game.gameSettings.extra,
      },
    };
    return {
      settings,
      gameId: game.id,
      mode: {
        type: 'online',
        localColor: identity.playerId === game.playerIds.white ? 'white' : 'black',
      },
      actions: game.actions,
    };
  });

  game = linkedSignal<TakGame | null>(() => {
    const currentGame = this.currentGame();
    if (!currentGame) {
      return null;
    }
    const game = takOngoingGameNew(currentGame.settings);
    for (const actionRecord of currentGame.actions) {
      const res = takOngoingGameDoAction(game, takActionFromString(actionRecord), Date.now());
      if (res && res.type === 'error') {
        console.error('Error applying action from server:', res.reason);
      }
    }
    console.log(`Replayed ${currentGame.actions.length} actions from server.`);
    return { type: 'ongoing', game };
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
        this.onRemoteAction(takActionFromString(action), plyIndex);
      },
    );
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
          console.error(`Ply index mismatch: got ${plyIndex}`);
          this.ongoingGameStatus.refetch();
        }
      }
      return { ...game };
    });
  }
}
