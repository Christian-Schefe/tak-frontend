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
import { newGameFromBoard } from '../../../tak-core/game';
import { TakAction, TakPlayer, TakPos } from '../../../tak-core';
import { PuzzleService } from '../../services/puzzle-service/puzzle-service';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { fromPositionString } from '../../../tak-core/board';
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

  game = linkedSignal<TakGameUI | null>(() => {
    const puzzle = this.puzzleInfo.value();
    if (puzzle === undefined) {
      return null;
    }
    const board = fromPositionString(puzzle.position);
    return newGameUI(
      newGameFromBoard(
        {
          boardSize: puzzle.gameSettings.boardSize,
          halfKomi: puzzle.gameSettings.halfKomi,
          reserve: {
            pieces: puzzle.gameSettings.pieces,
            capstones: puzzle.gameSettings.capstones,
          },
          clock: null,
        },
        board,
      ),
    );
  });

  onAction(action: TakActionEvent) {
    const game = this.game();
    if (!game) {
      return;
    }
    let move: TakAction | null = null;
    let pos: TakPos | null = null;
    if (action.type === 'full') {
      move = action.action;
    } else {
      move = tryPlaceOrAddToPartialMove(game, action.pos, action.variant);
      pos = action.pos;
    }

    const newGame = produce(game, (game) => {
      if (move !== null) {
        doMove(game, move);
      } else if (pos !== null) {
        updatePartialMove(game, pos);
      }
    });
    this.game.set(newGame);

    if (move !== null) {
      const moveHistory = newGame.actualGame.history.map((entry) => moveToString(entry));
      this.puzzleService.trySolvePuzzle(this.id(), moveHistory).subscribe((res) => {
        console.log('Tried solving puzzle:', action, res);
        if (res.type === 'correct') {
          alert('Correct!');
        } else if (res.type === 'incorrect') {
          alert('Incorrect, try again!');
        } else {
          const action = moveFromString(res.action);
          this.game.update((game) => {
            if (!game) {
              return game;
            }
            return produce(game, (game) => {
              doMove(game, action);
            });
          });
        }
      });
    }
  }
}
