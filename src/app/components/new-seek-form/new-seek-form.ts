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
  pieces?: number | null;
  capstones?: number | null;
  isRated?: boolean;
  timeMode?:
    | {
        type: 'realtime';
        timeContingentMinutes?: number;
        timeIncrementSeconds?: number;
        extra?: { onMove?: number; extraMinutes?: number };
      }
    | { type: 'async'; daysPerMove?: number };
}

const noPreset: SeekPreset = {
  name: 'None',
};

const simplePreset: SeekPreset = {
  name: 'Simple',
  boardSize: 5,
  halfKomi: 0,
  pieces: null,
  capstones: null,
  isRated: true,
  timeMode: {
    type: 'realtime',
    timeContingentMinutes: 10,
    timeIncrementSeconds: 5,
    extra: {
      onMove: 30,
      extraMinutes: 5,
    },
  },
};

export type TimeMode = Exclude<SeekPreset['timeMode'], undefined>['type'];

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
    label: preset.name,
    value: preset,
  }));
  preset = signal<SeekPreset>(noPreset);

  colorOptions = [
    { label: 'Random', value: 'random' },
    { label: 'Play as White', value: 'white' },
    { label: 'Play as Black', value: 'black' },
  ];
  color = signal<'random' | 'white' | 'black'>('random');
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

  timeModes: { label: string; value: TimeMode }[] = [
    { label: 'Realtime', value: 'realtime' },
    { label: 'Async', value: 'async' },
  ];
  timeMode = signal<TimeMode>('realtime');

  timeContingentDefault = 10;
  timeIncrementDefault = 5;
  timeContingentMinutes = signal<number | undefined | null>(this.timeContingentDefault);
  timeIncrementSeconds = signal<number | undefined | null>(this.timeIncrementDefault);
  timeExtraMove = signal<number | undefined | null>(undefined);
  timeExtraMinutesDefault = 5;
  timeExtraMinutes = signal<number | undefined | null>(this.timeExtraMinutesDefault);

  daysPerMoveDefault = 3;
  daysPerMove = signal<number | undefined | null>(this.daysPerMoveDefault);

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

  createSeek = output<CreateSeekPayload>();

  private readonly _presetEffect = effect(() => {
    const preset = this.preset();

    if (preset.boardSize !== undefined) {
      this.boardSize.set(preset.boardSize);
    }
    if (preset.halfKomi !== undefined) {
      this.halfKomi.set(preset.halfKomi);
    }
    if (preset.timeMode !== undefined) {
      this.timeMode.set(preset.timeMode.type);

      if (preset.timeMode.type === 'realtime') {
        if (preset.timeMode.timeContingentMinutes !== undefined) {
          this.timeContingentMinutes.set(preset.timeMode.timeContingentMinutes);
        }
        if (preset.timeMode.timeIncrementSeconds !== undefined) {
          this.timeIncrementSeconds.set(preset.timeMode.timeIncrementSeconds);
        }
        if (preset.timeMode.extra !== undefined) {
          if (preset.timeMode.extra.onMove !== undefined) {
            this.timeExtraMove.set(preset.timeMode.extra.onMove);
          }
          if (preset.timeMode.extra.extraMinutes !== undefined) {
            this.timeExtraMinutes.set(preset.timeMode.extra.extraMinutes);
          }
        }
      }
      if (preset.timeMode.type === 'async') {
        if (preset.timeMode.daysPerMove !== undefined) {
          this.daysPerMove.set(preset.timeMode.daysPerMove);
        }
      }
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
  });

  onSubmit() {
    const extraMove = this.timeExtraMove() ?? null;
    const extraMinutes = this.timeExtraMinutes() ?? null;

    const gameSettings: GameSettings = {
      boardSize: this.boardSize(),
      halfKomi: this.halfKomi(),
      pieces: this.pieces() ?? this.piecesDefault(),
      capstones: this.capstones() ?? this.capstonesDefault(),
      timeSettings:
        this.timeMode() === 'realtime'
          ? {
              type: 'realtime',
              contingentMs:
                (this.timeContingentMinutes() ?? this.timeContingentDefault) * 60 * 1000,
              incrementMs: (this.timeIncrementSeconds() ?? this.timeIncrementDefault) * 1000,
              extra:
                extraMove !== null && extraMinutes !== null
                  ? { onMove: extraMove, extraMs: extraMinutes * 60 * 1000 }
                  : null,
            }
          : {
              type: 'async',
              contingentMs: (this.daysPerMove() ?? this.daysPerMoveDefault) * 24 * 60 * 60 * 1000,
            },
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
