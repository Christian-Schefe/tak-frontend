import { Component, inject, input, linkedSignal } from '@angular/core';
import { GameComponent } from '../../components/game-component/game-component';

import { TakAction, TakBaseGame } from '../../../tak-core';
import { PuzzleService, SolveResponse } from '../../services/puzzle-service/puzzle-service';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { produce } from 'immer';
import { GameAudioService } from '../../services/game-audio-service/game-audio-service';
import { actionFromString, actionToString } from '../../../tak-core/ptn';

@Component({
  selector: 'app-puzzle-route',
  imports: [GameComponent, ProgressSpinnerModule],
  templateUrl: './puzzle-route.html',
  styleUrl: './puzzle-route.css',
})
export class PuzzleRoute {
  id = input.required<string>();

  private puzzleService = inject(PuzzleService);
  private gameAudioService = inject(GameAudioService);

  puzzleInfo = this.puzzleService.getPuzzle(() => this.id());

  solved = linkedSignal(() => {
    this.puzzleInfo.value();
    return false;
  });

  game = linkedSignal<{ game: TakBaseGame; solution: TakAction[] } | null>(() => {
    if (!this.puzzleInfo.resource.hasValue()) {
      return null;
    }
    const puzzle = this.puzzleInfo.resource.value();
    const game = new TakBaseGame({
      boardSize: puzzle.gameSettings.boardSize,
      halfKomi: puzzle.gameSettings.halfKomi,
      reserve: {
        pieces: puzzle.gameSettings.pieces,
        capstones: puzzle.gameSettings.capstones,
      },
    });
    return {
      game: produce(game, (game) => {
        for (const actionStr of puzzle.actions) {
          const action = actionFromString(actionStr);
          if (!action) {
            console.error('Invalid action in puzzle:', actionStr);
            continue;
          }
          game.doAction(action);
        }
      }),
      solution: [],
    };
  });

  onAction(action: TakAction) {
    this.gameAudioService.playMoveSound();

    this.game.update((game) => {
      if (!game) {
        return game;
      }

      return produce(game, (game) => {
        game.game.doAction(action);
        game.solution.push(action);
        const solutionStrs = game.solution.map((entry) => actionToString(entry));
        this.puzzleService.trySolvePuzzle(this.id(), solutionStrs).subscribe((res) => {
          this.onSolveResponse(res);
        });
      });
    });
  }
  private onSolveResponse(res: SolveResponse) {
    console.log('Tried solving puzzle:', res);
    if (res.type === 'correct') {
      this.solved.set(true);
    } else if (res.type === 'incorrect') {
      console.log('Incorrect, try again!');
      this.puzzleInfo.refetch();
    } else {
      const action = actionFromString(res.action);
      if (!action) {
        console.error('Invalid action from server:', res.action);
        return;
      }

      this.gameAudioService.playMoveSound();

      this.game.update((game) => {
        if (!game) {
          return game;
        }
        return produce(game, (game) => {
          game.game.doAction(action);
        });
      });
    }
  }
}
