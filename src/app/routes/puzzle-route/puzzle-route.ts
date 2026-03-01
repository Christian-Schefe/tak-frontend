import { Component, computed, inject, input, linkedSignal } from '@angular/core';
import {
  GameComponent,
  GamePlayer,
  TakActionEvent,
} from '../../components/game-component/game-component';
import {
  doMove,
  newGameUI,
  TakGameUI,
  tryPlaceOrAddToPartialMove,
  updatePartialMove,
} from '../../../tak-core/ui';
import { newGame } from '../../../tak-core/game';
import { TakAction, TakPlayer, TakPos } from '../../../tak-core';
import { PuzzleService } from '../../services/puzzle-service/puzzle-service';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { produce } from 'immer';
import { moveFromString, moveToString } from '../../../tak-core/move';

@Component({
  selector: 'app-puzzle-route',
  imports: [GameComponent, ProgressSpinnerModule],
  templateUrl: './puzzle-route.html',
  styleUrl: './puzzle-route.css',
})
export class PuzzleRoute {
  id = input.required<string>();

  players = computed<Record<TakPlayer, GamePlayer>>(() => {
    return {
      white: { type: 'local', name: 'Player 1' },
      black: { type: 'local', name: 'Player 2' },
    };
  });

  private puzzleService = inject(PuzzleService);

  puzzleInfo = this.puzzleService.getPuzzle(() => this.id());

  solved = linkedSignal(() => {
    this.puzzleInfo.value();
    return false;
  });

  game = linkedSignal<{ game: TakGameUI; solution: TakAction[] } | null>(() => {
    const puzzle = this.puzzleInfo.value();
    if (puzzle === undefined) {
      return null;
    }
    const game = newGameUI(
      newGame({
        boardSize: puzzle.gameSettings.boardSize,
        halfKomi: puzzle.gameSettings.halfKomi,
        reserve: {
          pieces: puzzle.gameSettings.pieces,
          capstones: puzzle.gameSettings.capstones,
        },
        clock: null,
      }),
    );
    return {
      game: produce(game, (game) => {
        for (const action of puzzle.actions) {
          doMove(game, moveFromString(action));
        }
      }),
      solution: [],
    };
  });

  onAction(action: TakActionEvent) {
    const gameData = this.game();
    if (!gameData) {
      return;
    }
    const { game, solution } = gameData;
    let move: TakAction | null = null;
    let pos: TakPos | null = null;
    if (action.type === 'full') {
      move = action.action;
    } else {
      move = tryPlaceOrAddToPartialMove(game, action.pos, action.variant);
      pos = action.pos;
    }

    const newSolution = move !== null ? [...solution, move] : solution;

    this.game.update((game) => {
      if (!game) {
        return game;
      }

      return produce(game, (game) => {
        if (move !== null) {
          doMove(game.game, move);
          game.solution.push(move);
        } else if (pos !== null) {
          updatePartialMove(game.game, pos);
        }
      });
    });

    if (move !== null) {
      const solution = newSolution.map((entry) => moveToString(entry));
      this.puzzleService.trySolvePuzzle(this.id(), solution).subscribe((res) => {
        console.log('Tried solving puzzle:', action, res);
        if (res.type === 'correct') {
          this.solved.set(true);
        } else if (res.type === 'incorrect') {
          console.log('Incorrect, try again!');
          this.puzzleInfo.refetch();
        } else {
          const action = moveFromString(res.action);
          this.game.update((game) => {
            if (!game) {
              return game;
            }
            console.log(game.game.actualGame.history.map((entry) => moveToString(entry)));
            return produce(game, (game) => {
              doMove(game.game, action);
            });
          });
        }
      });
    }
  }
}
