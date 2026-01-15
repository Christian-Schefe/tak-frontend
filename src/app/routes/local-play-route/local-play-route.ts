import { Component, computed, linkedSignal } from '@angular/core';
import { GameComponent, GamePlayer } from '../../components/game-component/game-component';
import { TakAction, TakGameSettings, TakPlayer } from '../../../tak';
import { TakGame, takOngoingGameDoAction, takOngoingGameNew } from '../../../tak/game';

@Component({
  selector: 'app-local-play-route',
  imports: [GameComponent],
  templateUrl: './local-play-route.html',
  styleUrl: './local-play-route.css',
})
export class LocalPlayRoute {
  settings: TakGameSettings = {
    boardSize: 5,
    halfKomi: 0,
    reserve: { flats: 21, capstones: 1 },
    timeControl: {
      contingentMs: 5 * 60 * 1000,
      incrementMs: 0,
      extra: null,
    },
  };
  game = linkedSignal<TakGame>(() => {
    return { type: 'ongoing', game: takOngoingGameNew(this.settings) };
  });
  players = computed<Record<TakPlayer, GamePlayer>>(() => {
    return {
      white: { type: 'local', name: 'Player 1' },
      black: { type: 'local', name: 'Player 2' },
    };
  });

  onAction(action: TakAction) {
    console.log('Received action from Board Ninja:', action);
    this.game.update((game) => {
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
  }
}
