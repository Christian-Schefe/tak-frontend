import { Component, computed, linkedSignal, OnDestroy, OnInit } from '@angular/core';
import { GameComponent, GamePlayer } from '../../components/game-component/game-component';
import { interval, Subscription } from 'rxjs';
import { TakGameSettings, TakAction, TakPlayer } from '../../../tak-core';
import { checkTimeout, doMove, TakGameUI, newGameUI } from '../../../tak-core/ui';
import { newGame } from '../../../tak-core/game';

@Component({
  selector: 'app-local-play-route',
  imports: [GameComponent],
  templateUrl: './local-play-route.html',
  styleUrl: './local-play-route.css',
})
export class LocalPlayRoute implements OnInit, OnDestroy {
  settings: TakGameSettings = {
    boardSize: 5,
    halfKomi: 0,
    reserve: { pieces: 21, capstones: 1 },
    clock: {
      contingentMs: 1 * 60 * 1000,
      incrementMs: 5 * 1000,
    },
  };
  game = linkedSignal<TakGameUI>(() => {
    return newGameUI(newGame(this.settings));
  });
  players = computed<Record<TakPlayer, GamePlayer>>(() => {
    return {
      white: { type: 'local', name: 'Player 1' },
      black: { type: 'local', name: 'Player 2' },
    };
  });

  timeoutInterval: Subscription | null = null;

  ngOnInit() {
    this.timeoutInterval = interval(300).subscribe(() => {
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
    });
  }

  ngOnDestroy() {
    this.timeoutInterval?.unsubscribe();
  }

  onAction(action: TakAction) {
    console.log('Received action from Board Ninja:', action);
    this.game.update((game) => {
      doMove(game, action);
      return { ...game };
    });
  }
}
