import { effect, Injectable, signal, WritableSignal } from '@angular/core';
import z from 'zod';
import { THEME_IDS as primeNgThemes } from '../theme-service/theme.constants';
import { THEME_IDS as themeIdsNative } from '../../../2d-themes';
import { NINJA_2D_THEMES } from '../../components/board-ninja-component/board-ninja.constants';

const generalSettings = z.object({
  theme: z.enum(primeNgThemes),
  boardType: z.enum(['ninja', '2d', '3d']),
});
export type GeneralSettings = z.infer<typeof generalSettings>;

const boardNativeSettings = z.object({
  theme: z.enum(themeIdsNative),
});
export type BoardNativeSettings = z.infer<typeof boardNativeSettings>;

const boardNinjaSettings = z.object({
  colorTheme: z.enum(NINJA_2D_THEMES),
  axisLabels: z.enum(['normal', 'small', 'none']),
  highlightSquares: z.boolean(),
  animateBoard: z.boolean(),
  board3d: z.boolean(),
  orthographic: z.boolean(),
  perspective: z.number(),
});
export type BoardNinjaSettings = z.infer<typeof boardNinjaSettings>;

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  settingsSignals = new Set<string>();

  generalSettings = signal<GeneralSettings>({
    theme: 'dark',
    boardType: '3d',
  });
  boardNativeSettings = signal<BoardNativeSettings>({
    theme: 'classic',
  });
  boardNinjaSettings = signal<BoardNinjaSettings>({
    colorTheme: 'classic',
    axisLabels: 'normal',
    highlightSquares: true,
    animateBoard: true,
    board3d: false,
    orthographic: false,
    perspective: 5,
  });

  private readonly _loadSettingsEffect = this.loadSettingsEffects();

  private loadSettingsEffects() {
    const syncThemeSetting = this.linkSettingsSignal(
      'generalSettings',
      this.generalSettings,
      generalSettings,
    );
    const syncBoardNativeSettings = this.linkSettingsSignal(
      'boardNativeSettings',
      this.boardNativeSettings,
      boardNativeSettings,
    );
    const syncBoardNinjaSettings = this.linkSettingsSignal(
      'boardNinjaSettings',
      this.boardNinjaSettings,
      boardNinjaSettings,
    );
    return [
      effect(() => {
        const generalSettings = this.generalSettings();
        syncThemeSetting(generalSettings);
      }),
      effect(() => {
        const settings = this.boardNativeSettings();
        syncBoardNativeSettings(settings);
      }),
      effect(() => {
        const settings = this.boardNinjaSettings();
        syncBoardNinjaSettings(settings);
      }),
    ];
  }

  linkSettingsSignal<T>(
    key: string,
    signal: WritableSignal<T>,
    parser: z.ZodType<T>,
  ): (val: T) => void {
    if (this.settingsSignals.has(key)) {
      throw new Error(`Settings signal for key ${key} is already linked.`);
    } else {
      try {
        const storedValue = localStorage.getItem(`settings.${key}`);
        if (storedValue !== null) {
          const parsedStoredValue: unknown = JSON.parse(storedValue);
          const result = parser.safeParse(parsedStoredValue);
          if (result.success) {
            signal.set(result.data);
          }
        }
      } catch (e) {
        console.error(`Failed to load setting ${key} from localStorage:`, e);
      }
      this.settingsSignals.add(key);
      return (value) => {
        localStorage.setItem(`settings.${key}`, JSON.stringify(value));
      };
    }
  }
}
