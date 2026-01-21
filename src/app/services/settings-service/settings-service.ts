import { effect, Injectable, signal, WritableSignal } from '@angular/core';
import z from 'zod';
import { themesList } from '../theme-service/theme-service';

const generatSettingsStore = z.object({
  theme: z.string(),
  boardType: z.string(),
});
type GeneralSettingsStore = z.infer<typeof generatSettingsStore>;

const boardNativeSettingsStore = z.object({
  theme: z.string(),
});
type BoardNativeSettingsStore = z.infer<typeof boardNativeSettingsStore>;

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  settingsSignals = new Set<string>();

  generalSettings = signal<GeneralSettingsStore>({
    theme: themesList[0].id,
    boardType: 'native',
  });
  boardNativeSettings = signal<BoardNativeSettingsStore>({
    theme: 'classic',
  });

  private readonly _loadSettingsEffect = this.loadSettingsEffects();

  private loadSettingsEffects() {
    const syncThemeSetting = this.linkSettingsSignal(
      'generalSettings',
      this.generalSettings,
      generatSettingsStore,
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
        if (storedValue) {
          const parsedStoredValue = JSON.parse(storedValue);
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
