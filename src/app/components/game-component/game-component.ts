import { Component, inject, input, output } from '@angular/core';
import { TakAction, TakPieceVariant, TakPlayer, TakPos } from '../../../tak-core';
import { TakGameUI } from '../../../tak-core/ui';
import { SettingsService } from '../../services/settings-service/settings-service';
import { GameBoard } from '../game-board/game-board';

export type GameMode =
  | { type: 'local' }
  | { type: 'online'; localPlayer: TakPlayer }
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

export type TakActionEvent =
  | {
      type: 'full';
      action: TakAction;
    }
  | {
      type: 'partial';
      pos: TakPos;
      variant: TakPieceVariant | null;
    };

@Component({
  selector: 'app-game-component',
  imports: [GameBoard],
  templateUrl: './game-component.html',
  styleUrl: './game-component.css',
})
export class GameComponent {
  game = input.required<TakGameUI>();
  mode = input.required<GameMode>();

  action = output<TakActionEvent>();
  settingsService = inject(SettingsService);
}
