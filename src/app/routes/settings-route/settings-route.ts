import { Component, computed, effect, inject, signal } from '@angular/core';
import { SelectModule } from 'primeng/select';
import { ThemeService, themesList } from '../../services/theme-service/theme-service';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../services/settings-service/settings-service';
import z from 'zod';

const themeStore = z.string();
type ThemeStore = z.infer<typeof themeStore>;

@Component({
  selector: 'app-settings-route',
  imports: [SelectModule, FormsModule],
  templateUrl: './settings-route.html',
  styleUrl: './settings-route.css',
})
export class SettingsRoute {
  themeService = inject(ThemeService);
  settingsService = inject(SettingsService);

  themes = computed(() => {
    return themesList.map((theme) => ({
      label: theme.name,
      value: theme.id,
    }));
  });

  themeId = signal<ThemeStore>(this.themeService.theme().id);

  constructor() {
    const syncThemeSetting = this.settingsService.linkSettingsSignal(
      'theme',
      this.themeId,
      themeStore,
    );
    effect(() => {
      const themeId = this.themeId();
      const theme = themesList.find((t) => t.id === themeId);
      if (theme) {
        console.log(`Applying theme: ${theme.name}`);
        this.themeService.theme.set(theme);
      }
      syncThemeSetting(themeId);
    });
  }
}
