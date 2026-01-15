import { Component, input, linkedSignal, output } from '@angular/core';
import { TakGame } from '../../../tak/game';
import { TakAction, TakGameSettings, TakPlayer } from '../../../tak';
import { BoardNinjaComponent } from '../board-ninja-component/board-ninja-component';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { GamePlayerBar } from '../game-player-bar/game-player-bar';

export type GameMode =
  | { type: 'local' }
  | { type: 'online'; localColor: TakPlayer }
  | { type: 'spectator' };

export type GamePlayer =
  | {
      type: 'player';
      playerId: string;
    }
  | {
      type: 'local';
      name: string;
    };

@Component({
  selector: 'app-game-component',
  imports: [BoardNinjaComponent, ButtonModule, DialogModule, GamePlayerBar],
  templateUrl: './game-component.html',
  styleUrl: './game-component.css',
})
export class GameComponent {
  settings = input.required<TakGameSettings>();
  game = input.required<TakGame>();
  action = output<TakAction>();
  mode = input.required<GameMode>();
  players = input.required<Record<TakPlayer, GamePlayer>>();

  showGameOverInfo = linkedSignal<boolean>(() => {
    const game = this.game();
    return game.type === 'finished';
  });
}
