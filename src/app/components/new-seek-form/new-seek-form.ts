import { Component, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { GameSettings } from '../../services/game-service/game-service';
import { CreateSeekPayload } from '../../services/seek-service/seek-service';
import { RippleModule } from 'primeng/ripple';

@Component({
  selector: 'app-new-seek-form',
  imports: [
    IftaLabelModule,
    SelectModule,
    ButtonModule,
    InputTextModule,
    FormsModule,
    RippleModule,
  ],
  templateUrl: './new-seek-form.html',
  styleUrl: './new-seek-form.css',
})
export class NewSeekForm {
  boardSizes = [3, 4, 5, 6, 7, 8];
  boardSize = signal(5);
  createSeek = output<CreateSeekPayload>();

  onSubmit() {
    const gameSettings: GameSettings = {
      boardSize: this.boardSize(),
      halfKomi: 0,
      pieces: 21,
      capstones: 1,
      contingentMs: 5 * 60 * 1000,
      incrementMs: 5 * 1000,
      extra: null,
    };

    this.createSeek.emit({
      opponentId: null,
      color: 'random',
      isRated: false,
      gameSettings,
    });
  }
}
