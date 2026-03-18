import { Component, computed, effect, inject, linkedSignal, signal, OnInit } from '@angular/core';
import {
  GameComponent,
  GamePlayer,
  TakActionEvent,
} from '../../components/game-component/game-component';

import { TakAction, TakPlayer, TakPos } from '../../../tak-core';
import {
  checkTimeout,
  doMove,
  TakGameUI,
  newGameUI,
  setPlyIndex,
  doDraw,
  doResign,
  undoMove,
  updatePartialMove,
  tryPlaceOrAddToPartialMove,
} from '../../../tak-core/ui';
import { newGame } from '../../../tak-core/game';
import { GameService } from '../../services/game-service/game-service';
import { produce } from 'immer';
import { GameAudioService } from '../../services/game-audio-service/game-audio-service';
import { GameActionsPanel } from '../../components/game-actions-panel/game-actions-panel';
import { GameInfoPanel } from '../../components/game-info-panel/game-info-panel';
import { EngineService } from '../../services/engine-service/engine-service';
import { GameAnalysisBar } from '../../components/game-analysis-bar/game-analysis-bar';
import { GameChatPanel } from '../../components/game-chat-panel/game-chat-panel';

const engineKey = 'local-play-worker';

@Component({
  selector: 'app-local-play-route',
  imports: [GameComponent, GameActionsPanel, GameInfoPanel, GameAnalysisBar, GameChatPanel],
  templateUrl: './local-play-route.html',
  styleUrl: './local-play-route.css',
})
export class LocalPlayRoute implements OnInit {
  private gameService = inject(GameService);
  private gameAudioService = inject(GameAudioService);

  private engineService = inject(EngineService);
  private hasLoaded = signal(false);

  evaluation = signal<number>(0);

  ngOnInit() {
    void this.onInit();
  }

  private async onInit() {
    await this.engineService.initialize(engineKey, (message) => {
      const invert = this.game().actualGame.currentPlayer === 'black';
      this.evaluation.set(invert ? -message.score : message.score);
    });
    this.hasLoaded.set(true);
  }

  private _updateEffect = effect(() => {
    if (!this.hasLoaded()) {
      return;
    }
    console.log('Game updated, sending new position to engine');
    const game = this.game().actualGame;
    if (game.gameState.type !== 'ongoing') {
      return;
    }
    void this.engineService.evaluatePosition(engineKey, game);
  });

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
        return produce(game, (game) => {
          if (game.actualGame.gameState.type !== 'ongoing') {
            return;
          }
          checkTimeout(game);
        });
      });
    }, 300);

    onCleanup(() => {
      clearInterval(id);
    });
  });

  onAction(action: TakActionEvent) {
    this.game.update((game) => {
      let move: TakAction | null = null;
      let pos: TakPos | null = null;
      if (action.type === 'full') {
        move = action.action;
      } else {
        move = tryPlaceOrAddToPartialMove(game, action.pos, action.variant);
        pos = action.pos;
      }

      if (move !== null) {
        this.gameAudioService.playMoveSound();
      }

      return produce(game, (game) => {
        if (move !== null) {
          doMove(game, move);
        } else if (pos !== null) {
          updatePartialMove(game, pos);
        }
      });
    });
  }

  onSetHistoryPlyIndex(plyIndex: number) {
    this.game.update((game) => {
      return produce(game, (game) => {
        setPlyIndex(game, plyIndex);
      });
    });
  }

  onRequestDraw() {
    this.game.update((game) => {
      return produce(game, (game) => {
        doDraw(game);
      });
    });
  }

  onRequestUndo() {
    this.game.update((game) => {
      return produce(game, (game) => {
        undoMove(game);
      });
    });
  }

  onResign() {
    this.game.update((game) => {
      return produce(game, (game) => {
        doResign(game, game.actualGame.currentPlayer);
      });
    });
  }
}
