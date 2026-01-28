import { Component, computed, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { RippleModule } from 'primeng/ripple';
import { InputNumberModule } from 'primeng/inputnumber';
import { TakGameSettings } from '../../../tak-core';

@Component({
  selector: 'app-new-local-form',
  imports: [
    IftaLabelModule,
    SelectModule,
    ButtonModule,
    InputTextModule,
    FormsModule,
    RippleModule,
    InputNumberModule,
  ],
  templateUrl: './new-local-form.html',
  styleUrl: './new-local-form.css',
})
export class NewLocalForm {
  boardSizes = [3, 4, 5, 6, 7, 8].map((size) => ({
    label: `${size.toString()}x${size.toString()}`,
    value: size,
  }));
  boardSize = signal(5);
  halfKomiOptions = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((value) => ({
    label: (value / 2).toString(),
    value,
  }));
  halfKomi = signal(0);

  timeContingentDefault = 10;
  timeIncrementDefault = 5;
  timeContingentMinutes = signal<number | undefined | null>(this.timeContingentDefault);
  timeIncrementSeconds = signal<number | undefined | null>(this.timeIncrementDefault);
  timeExtraMove = signal<number | undefined | null>(undefined);
  timeExtraMinutesDefault = 5;
  timeExtraMinutes = signal<number | undefined | null>(this.timeExtraMinutesDefault);

  piecesDefault = computed(() => {
    const size = this.boardSize();
    if (size < 3 || size > 8) {
      return 21;
    }
    return [10, 15, 21, 30, 40, 50][size - 3];
  });
  capstonesDefault = computed(() => {
    const size = this.boardSize();
    if (size < 3 || size > 8) {
      return 21;
    }
    return [0, 0, 1, 1, 2, 2][size - 3];
  });
  pieces = signal<number | undefined | null>(undefined);
  capstones = signal<number | undefined | null>(undefined);

  playLocal = output<TakGameSettings>();

  onSubmit() {
    const extraMove = this.timeExtraMove() ?? null;
    const extraMinutes = this.timeExtraMinutes() ?? null;

    const gameSettings: TakGameSettings = {
      boardSize: this.boardSize(),
      halfKomi: this.halfKomi(),
      reserve: {
        pieces: this.pieces() ?? this.piecesDefault(),
        capstones: this.capstones() ?? this.capstonesDefault(),
      },
      clock: {
        type: 'realtime',
        externallyDriven: false,
        contingentMs: (this.timeContingentMinutes() ?? this.timeContingentDefault) * 60 * 1000,
        incrementMs: (this.timeIncrementSeconds() ?? this.timeIncrementDefault) * 1000,
        extra:
          extraMove !== null && extraMinutes !== null
            ? { onMove: extraMove, extraMs: extraMinutes * 60 * 1000 }
            : null,
      },
    };

    this.playLocal.emit(gameSettings);
  }
}
