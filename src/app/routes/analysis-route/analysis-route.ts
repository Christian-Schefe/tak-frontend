import { Component, computed, effect, inject, linkedSignal, OnInit, signal } from '@angular/core';
import { EngineService } from '../../services/engine-service/engine-service';
import { ButtonModule } from 'primeng/button';
import { TakAction, TakGame, TakPlayer, TakPos } from '../../../tak-core';
import { newGame } from '../../../tak-core/game';
import { moveToString } from '../../../tak-core/move';
import { GameService } from '../../services/game-service/game-service';
import {
  doMove,
  newGameUI,
  TakGameUI,
  tryPlaceOrAddToPartialMove,
  updatePartialMove,
} from '../../../tak-core/ui';
import {
  GamePlayer,
  TakActionEvent,
  GameComponent,
} from '../../components/game-component/game-component';
import { produce } from 'immer';

const engineKey = 'analysis-worker';

@Component({
  selector: 'app-analysis-route',
  imports: [ButtonModule, GameComponent],
  templateUrl: './analysis-route.html',
  styleUrl: './analysis-route.css',
})
export class AnalysisRoute implements OnInit {
  private engineService = inject(EngineService);

  private hasLoaded = signal(false);
  private isRunning = signal(false);

  evaluation = signal<number>(0);

  adjustedEvaluation = computed(() => {
    const evalValue = this.evaluation();
    const invert = this.game().actualGame.currentPlayer === 'black';
    const inverted = invert ? -evalValue : evalValue;
    const centeredValue = inverted * 0.5 + 50;
    return centeredValue;
  });

  ngOnInit() {
    void this.onInit();
  }

  private async onInit() {
    await this.engineService.initialize(engineKey, (message) => {
      console.log('Received message from worker:', message);
      if (message.message === 'teiok') {
        this.hasLoaded.set(true);
        this.isRunning.set(false);
      }
      if (message.message.startsWith('info')) {
        const words = message.message.split(' ');
        const scoreIndex = words.findIndex((word) => word === 'score');
        if (scoreIndex !== -1 && scoreIndex < words.length - 2) {
          const scoreType = words[scoreIndex + 1];
          if (scoreType !== 'cp') {
            console.warn('Unexpected score type from engine:', scoreType);
            return;
          }
          const scoreValue = Number.parseFloat(words[scoreIndex + 2]);
          if (isNaN(scoreValue)) {
            console.warn('Invalid score value from engine:', words[scoreIndex + 2]);
            return;
          }
          this.evaluation.set(scoreValue);
        }
      }
    });
  }

  private _updateEffect = effect(() => {
    if (!this.hasLoaded()) {
      return;
    }
    console.log('Game updated, sending new position to engine');
    void this.runAnalysis(this.game().actualGame);
  });

  private async runAnalysis(game: TakGame) {
    try {
      if (game.gameState.type !== 'ongoing') {
        if (this.isRunning()) {
          await this.engineService.sendMessage(engineKey, 'stop');
        }
        return;
      }
      if (!this.isRunning()) {
        await this.engineService.sendMessage(
          engineKey,
          `teinewgame ${game.settings.boardSize.toString()}`,
        );
        this.isRunning.set(true);
      } else {
        await this.engineService.sendMessage(engineKey, 'stop');
      }
      const moves = game.history.map((move) => moveToString(move)).join(' ');
      await this.engineService.sendMessage(engineKey, `position startpos moves ${moves}`);
      await this.engineService.sendMessage(engineKey, 'go infinite');
      console.log('Async analysis updated');
    } catch (error) {
      console.error('Error during async analysis:', error);
    }
  }

  private gameService = inject(GameService);
  game = linkedSignal<TakGameUI>(() => {
    return newGameUI(newGame(this.gameService.localGameSettings()));
  });
  players = computed<Record<TakPlayer, GamePlayer>>(() => {
    return {
      white: { type: 'local', name: 'Player 1' },
      black: { type: 'local', name: 'Player 2' },
    };
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

      return produce(game, (game) => {
        if (move !== null) {
          doMove(game, move);
        } else if (pos !== null) {
          updatePartialMove(game, pos);
        }
      });
    });
  }
}
