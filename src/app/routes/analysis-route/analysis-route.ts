import { Component, computed, effect, inject, linkedSignal, OnInit, signal } from '@angular/core';
import { EngineService } from '../../services/engine-service/engine-service';
import { ButtonModule } from 'primeng/button';
import { TakAction, TakPlayer, TakPos } from '../../../tak-core';
import { newGame } from '../../../tak-core/game';
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

  evaluation = signal<number>(0);

  ngOnInit() {
    void this.onInit();
  }

  private async onInit() {
    await this.engineService.initialize(engineKey, (message) => {
      console.log('Received message from worker:', message);

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
    void this.engineService.evaluatePosition(engineKey, game);
  });

  game = linkedSignal<TakGameUI>(() => {
    return newGameUI(
      newGame({
        boardSize: 6,
        halfKomi: 4,
        reserve: { pieces: 30, capstones: 1 },
        clock: null,
      }),
    );
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
