import { Component, computed, inject } from '@angular/core';
import { SelectModule } from 'primeng/select';
import { themesList } from '../../services/theme-service/theme-service';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../services/settings-service/settings-service';
import { IftaLabelModule } from 'primeng/iftalabel';
import { TabsModule } from 'primeng/tabs';
import { themes as boardNativeThemeList } from '../../../2d-themes';

@Component({
  selector: 'app-settings-route',
  imports: [SelectModule, FormsModule, IftaLabelModule, TabsModule],
  templateUrl: './settings-route.html',
  styleUrl: './settings-route.css',
})
export class SettingsRoute {
  settingsService = inject(SettingsService);

  themes = computed(() => {
    return themesList.map((theme) => ({
      label: theme.name,
      value: theme.id,
    }));
  });

  boardNativeThemes = computed(() => {
    return Object.entries(boardNativeThemeList).map(([key, theme]) => ({
      label: theme?.name ?? '',
      value: key,
    }));
  });

  updateGeneralTheme(themeId: string) {
    this.settingsService.generalSettings.update((settings) => {
      return { ...settings, theme: themeId };
    });
  }

  updateBoardNativeTheme(themeId: string) {
    this.settingsService.boardNativeSettings.update((settings) => {
      return { ...settings, theme: themeId };
    });
  }
}
