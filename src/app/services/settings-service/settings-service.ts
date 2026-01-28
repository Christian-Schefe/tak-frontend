import { effect, Injectable, signal, WritableSignal } from '@angular/core';
import z from 'zod';
import { themeIds as primeNgThemes } from '../theme-service/theme-service';
import { themeIds as themeIdsNative } from '../../../2d-themes';

const generalSettings = z.object({
  theme: z.enum(primeNgThemes),
  boardType: z.enum(['ninja', '2d', '3d']),
});
export type GeneralSettings = z.infer<typeof generalSettings>;

const boardNativeSettingsStore = z.object({
  theme: z.enum(themeIdsNative),
});
export type BoardNativeSettings = z.infer<typeof boardNativeSettingsStore>;

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  settingsSignals = new Set<string>();

  generalSettings = signal<GeneralSettings>({
    theme: 'light',
    boardType: '2d',
  });
  boardNativeSettings = signal<BoardNativeSettings>({
    theme: 'classic',
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
      boardNativeSettingsStore,
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
