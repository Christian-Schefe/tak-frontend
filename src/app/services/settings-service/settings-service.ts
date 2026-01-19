import { effect, inject, Injectable, signal, WritableSignal } from '@angular/core';
import z from 'zod';
import { ThemeService, themesList } from '../theme-service/theme-service';

const themeStore = z.string();
type ThemeStore = z.infer<typeof themeStore>;

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  settingsSignals = new Set<string>();
  themeService = inject(ThemeService);

  themeId = signal<ThemeStore>(themesList[0].id);

  private readonly _loadSettingsEffect = this.loadSettingsEffect();

  private loadSettingsEffect() {
    const syncThemeSetting = this.linkSettingsSignal('theme', this.themeId, themeStore);
    return effect(() => {
      const themeId = this.themeId();
      const theme = themesList.find((t) => t.id === themeId) ?? themesList[0];

      console.log(`Applying theme: ${theme.name}`);
      this.themeService.applyTheme(theme);

      syncThemeSetting(themeId);
    });
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
