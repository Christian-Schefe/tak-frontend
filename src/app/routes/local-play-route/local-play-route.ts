import { Component, computed, effect, inject, linkedSignal } from '@angular/core';
import { GameComponent, GamePlayer } from '../../components/game-component/game-component';

import { TakAction, TakPlayer } from '../../../tak-core';
import { checkTimeout, doMove, TakGameUI, newGameUI } from '../../../tak-core/ui';
import { newGame } from '../../../tak-core/game';
import { GameService } from '../../services/game-service/game-service';

@Component({
  selector: 'app-local-play-route',
  imports: [GameComponent],
  templateUrl: './local-play-route.html',
  styleUrl: './local-play-route.css',
})
export class LocalPlayRoute {
  gameService = inject(GameService);
  game = linkedSignal<TakGameUI>(() => {
    return newGameUI(newGame(this.gameService.localGameSettings()));
  });
  players = computed<Record<TakPlayer, GamePlayer>>(() => {
    return {
      white: { type: 'local', name: 'Player 1' },
      black: { type: 'local', name: 'Player 2' },
    };
  });

  private readonly _timeoutEffect = effect((onCleanup) => {
    const id = setInterval(() => {
      this.game.update((game) => {
        if (game.actualGame.gameState.type !== 'ongoing') {
          return game;
        }
        checkTimeout(game);
        if (game.actualGame.gameState.type === 'ongoing') {
          return game;
        }
        return { ...game };
      });
    }, 300);

    onCleanup(() => clearInterval(id));
  });

  onAction(action: TakAction) {
    this.game.update((game) => {
      doMove(game, action);
      return { ...game };
    });
  }
}
