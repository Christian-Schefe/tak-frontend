import { Injectable, WritableSignal } from '@angular/core';
import z from 'zod';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  settingsSignals = new Set<string>();

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
