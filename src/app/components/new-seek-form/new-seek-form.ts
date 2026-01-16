import { Component, computed, effect, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { GameSettings } from '../../services/game-service/game-service';
import { CreateSeekPayload } from '../../services/seek-service/seek-service';
import { RippleModule } from 'primeng/ripple';
import { InputNumberModule } from 'primeng/inputnumber';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, debounceTime, of, switchMap } from 'rxjs';
import { PlayerService } from '../../services/player-service/player-service';

interface SeekPreset {
  name: string;
  boardSize?: number;
  halfKomi?: number;
  timeContingentMinutes?: number;
  timeIncrementSeconds?: number;
  pieces?: number;
  capstones?: number;
  isRated?: boolean;
}

const noPreset: SeekPreset = {
  name: 'None',
};

const simplePreset: SeekPreset = {
  name: 'Simple',
  boardSize: 5,
  halfKomi: 0,
  timeContingentMinutes: 10,
  timeIncrementSeconds: 5,
  pieces: 21,
  capstones: 1,
  isRated: true,
};

@Component({
  selector: 'app-new-seek-form',
  imports: [
    IftaLabelModule,
    SelectModule,
    ButtonModule,
    InputTextModule,
    FormsModule,
    RippleModule,
    InputNumberModule,
  ],
  templateUrl: './new-seek-form.html',
  styleUrl: './new-seek-form.css',
})
export class NewSeekForm {
  playerService = inject(PlayerService);
  presets: { label: string; value: SeekPreset }[] = [noPreset, simplePreset].map((preset) => ({
    label: preset ? preset.name : 'None',
    value: preset,
  }));
  preset = signal<SeekPreset>(noPreset);

  colorOptions = [
    { label: 'Random', value: 'random' },
    { label: 'Play as White', value: 'white' },
    { label: 'Play as Black', value: 'black' },
  ];
  color = signal<'random' | 'white' | 'black'>('random');
  boardSizes = [3, 4, 5, 6, 7, 8].map((size) => ({ label: `${size}x${size}`, value: size }));
  boardSize = signal(5);
  halfKomiOptions = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((value) => ({
    label: (value / 2).toString(),
    value,
  }));
  halfKomi = signal(0);
  ratedOptions = [
    { label: 'Rated', value: true },
    { label: 'Unrated', value: false },
  ];
  rated = signal(true);

  opponentName = signal<string>('');

  opponentNameObservable = toObservable(this.opponentName);
  opponentPlayerInfo = this.opponentNameObservable.pipe(
    debounceTime(300),
    switchMap((opponentName) => {
      if (!opponentName || opponentName.trim() === '') {
        return of(null);
      }
      return this.playerService.getPlayerByUsername(opponentName).pipe(catchError(() => of(null)));
    }),
  );
  opponentPlayerInfoSignal = toSignal(this.opponentPlayerInfo);
  isValidOpponent = computed(() => {
    const name = this.opponentName();
    return !name || name.trim() === '' || this.opponentPlayerInfoSignal() !== null;
  });

  timeContingentDefault = 10;
  timeIncrementDefault = 5;
  timeContingentMinutes = signal<number | undefined>(this.timeContingentDefault);
  timeIncrementSeconds = signal<number | undefined>(this.timeIncrementDefault);

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
  pieces = signal<number | undefined>(undefined);
  capstones = signal<number | undefined>(undefined);

  createSeek = output<CreateSeekPayload>();

  constructor() {
    this.opponentPlayerInfo.subscribe((res) => {
      console.log('opponentPlayerInfo', res);
    });

    effect(() => {
      const preset = this.preset();
      if (preset) {
        if (preset.boardSize !== undefined) {
          this.boardSize.set(preset.boardSize);
        }
        if (preset.halfKomi !== undefined) {
          this.halfKomi.set(preset.halfKomi);
        }
        if (preset.timeContingentMinutes !== undefined) {
          this.timeContingentMinutes.set(preset.timeContingentMinutes);
        }
        if (preset.timeIncrementSeconds !== undefined) {
          this.timeIncrementSeconds.set(preset.timeIncrementSeconds);
        }
        if (preset.pieces !== undefined) {
          this.pieces.set(preset.pieces);
        }
        if (preset.capstones !== undefined) {
          this.capstones.set(preset.capstones);
        }
        if (preset.isRated !== undefined) {
          this.rated.set(preset.isRated);
        }
      }
    });
  }

  onSubmit() {
    const gameSettings: GameSettings = {
      boardSize: this.boardSize(),
      halfKomi: this.halfKomi(),
      pieces: this.pieces() ?? this.piecesDefault(),
      capstones: this.capstones() ?? this.capstonesDefault(),
      contingentMs: (this.timeContingentMinutes() ?? this.timeContingentDefault) * 60 * 1000,
      incrementMs: (this.timeIncrementSeconds() ?? this.timeIncrementDefault) * 1000,
      extra: null,
    };

    const opponentId = this.opponentPlayerInfoSignal()?.id ?? null;

    console.log('Creating seek with settings:', gameSettings, 'opponentId:', opponentId);

    this.createSeek.emit({
      opponentId,
      color: this.color(),
      isRated: true,
      gameSettings,
    });
  }
}
