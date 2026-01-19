import { Component, computed, input, linkedSignal, output } from '@angular/core';
import { BoardNinjaComponent } from '../board-ninja-component/board-ninja-component';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { GamePlayerBar } from '../game-player-bar/game-player-bar';
import { TakAction, TakPlayer } from '../../../tak-core';
import { TakGameUI } from '../../../tak-core/ui';
import { GameSidePanel } from '../game-side-panel/game-side-panel';
import { GameChatPanel } from '../game-chat-panel/game-chat-panel';

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
  imports: [
    BoardNinjaComponent,
    ButtonModule,
    DialogModule,
    GamePlayerBar,
    GameSidePanel,
    GameChatPanel,
  ],
  templateUrl: './game-component.html',
  styleUrl: './game-component.css',
})
export class GameComponent {
  game = input.required<TakGameUI>();
  action = output<TakAction>();
  mode = input.required<GameMode>();
  players = input.required<Record<TakPlayer, GamePlayer>>();

  playerOrder = computed<{ p1: TakPlayer; p2: TakPlayer }>(() => {
    const mode = this.mode();
    if (mode.type === 'online' && mode.localColor === 'black') {
      return { p1: 'black', p2: 'white' };
    }
    return { p1: 'white', p2: 'black' };
  });

  showGameOverInfo = linkedSignal<boolean>(() => {
    const game = this.game();
    return game.actualGame.gameState.type !== 'ongoing';
  });
}
