import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { GameComponent, GamePlayer } from '../../components/game-component/game-component';

import { TakAction, TakBaseGame, TakPlayer } from '../../../tak-core';

import { GameService } from '../../services/game-service/game-service';
import { produce } from 'immer';
import { GameAudioService } from '../../services/game-audio-service/game-audio-service';
import { GameActionsPanel } from '../../components/game-actions-panel/game-actions-panel';
import { GameInfoPanel } from '../../components/game-info-panel/game-info-panel';
import { GameAnalysisBar } from '../../components/game-analysis-bar/game-analysis-bar';
import { GameChatPanel } from '../../components/game-chat-panel/game-chat-panel';

@Component({
  selector: 'app-local-play-route',
  imports: [GameComponent, GameActionsPanel, GameInfoPanel, GameAnalysisBar, GameChatPanel],
  templateUrl: './local-play-route.html',
  styleUrl: './local-play-route.css',
})
export class LocalPlayRoute {
  private gameService = inject(GameService);
  private gameAudioService = inject(GameAudioService);

  plyIndex = signal<number | null>(null);
  game = linkedSignal<TakBaseGame>(() => {
    return new TakBaseGame(this.gameService.localGameSettings());
  });
  players = computed<Record<TakPlayer, GamePlayer>>(() => {
    return {
      white: { type: 'local', name: 'Player 1' },
      black: { type: 'local', name: 'Player 2' },
    };
  });

  onAction(action: TakAction) {
    this.gameAudioService.playMoveSound();
    this.game.update((game) => {
      return produce(game, (game) => {
        game.doAction(action);
      });
    });
  }

  onSetHistoryPlyIndex(plyIndex: number | null) {
    const game = this.game();
    const maxPlyIndex = game.actionHistory.length;
    const newPlyIndex = plyIndex !== null && plyIndex >= maxPlyIndex ? null : plyIndex;
    const currentPlyIndex = this.plyIndex();
    if (currentPlyIndex === newPlyIndex) {
      return;
    }
    this.plyIndex.set(newPlyIndex);
  }

  onRequestUndo() {
    this.game.update((game) => {
      return produce(game, (game) => {
        game.undoAction();
      });
    });
  }
}
