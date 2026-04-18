import { Component, inject, input, output } from '@angular/core';
import { TakAction, TakPlayer } from '../../../tak-core';
import { SettingsService } from '../../services/settings-service/settings-service';
import { GameBoard } from '../game-board/game-board';
import { TakBaseGame } from '../../../tak-core/base';

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

@Component({
  selector: 'app-game-component',
  imports: [GameBoard],
  templateUrl: './game-component.html',
  styleUrl: './game-component.css',
})
export class GameComponent {
  game = input.required<TakBaseGame>();
  plyIndex = input.required<number | null>();
  mode = input.required<GameMode>();

  action = output<TakAction>();
  settingsService = inject(SettingsService);
}
