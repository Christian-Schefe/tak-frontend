import { Component, computed, input, linkedSignal, output } from '@angular/core';
import { BoardNinjaComponent } from '../board-ninja-component/board-ninja-component';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { GamePlayerBar } from '../game-player-bar/game-player-bar';
import { TakAction, TakGameState, TakPieceVariant, TakPlayer, TakPos } from '../../../tak-core';
import { TakGameUI } from '../../../tak-core/ui';
import { GameSidePanel } from '../game-side-panel/game-side-panel';
import { GameChatPanel } from '../game-chat-panel/game-chat-panel';
import { BoardNativeComponent } from '../board-native/board-native-component/board-native-component';

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

export type BoardStyle = 'ninja' | '2d';

export type TakActionEvent =
  | {
      type: 'full';
      action: TakAction;
    }
  | {
      type: 'partial';
      pos: TakPos;
      variant: TakPieceVariant;
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
    BoardNativeComponent,
  ],
  templateUrl: './game-component.html',
  styleUrl: './game-component.css',
})
export class GameComponent {
  game = input.required<TakGameUI>();
  action = output<TakActionEvent>();
  mode = input.required<GameMode>();
  players = input.required<Record<TakPlayer, GamePlayer>>();
  setHistoryPlyIndex = output<number>();
  drawState = input.required<'none' | 'offered' | 'requested'>();
  undoState = input.required<'none' | 'offered' | 'requested'>();
  requestDraw = output<boolean>();
  requestUndo = output<boolean>();
  resign = output<void>();
  boardStyle = '2d';

  playerOrder = computed<{ p1: TakPlayer; p2: TakPlayer }>(() => {
    const mode = this.mode();
    if (mode.type === 'online' && mode.localColor === 'black') {
      return { p1: 'black', p2: 'white' };
    }
    return { p1: 'white', p2: 'black' };
  });

  gameStateTrigger = computed<TakGameState>(() => {
    return this.game().actualGame.gameState;
  });
  showGameOverInfo = linkedSignal(() => {
    return this.gameStateTrigger().type !== 'ongoing';
  });
}
