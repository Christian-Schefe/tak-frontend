import { Component, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { PuzzleService } from '../../services/puzzle-service/puzzle-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-puzzles-route',
  imports: [ButtonModule],
  templateUrl: './puzzles-route.html',
  styleUrl: './puzzles-route.css',
})
export class PuzzlesRoute {
  private puzzleService = inject(PuzzleService);
  private router = inject(Router);
  playRandomPuzzle() {
    this.puzzleService.getRandomPuzzleId().subscribe((res) => {
      void this.router.navigate(['/puzzle', res.id]);
    });
  }
}
