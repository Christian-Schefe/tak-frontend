import { Component, computed, inject } from '@angular/core';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import {
  BoardNativeSettings,
  GeneralSettings,
  SettingsService,
} from '../../services/settings-service/settings-service';
import { IftaLabelModule } from 'primeng/iftalabel';
import { TabsModule } from 'primeng/tabs';
import { themes as boardNativeThemeList } from '../../../2d-themes';
import { themes } from '../../services/theme-service/theme-service';

@Component({
  selector: 'app-settings-route',
  imports: [SelectModule, FormsModule, IftaLabelModule, TabsModule],
  templateUrl: './settings-route.html',
  styleUrl: './settings-route.css',
})
export class SettingsRoute {
  settingsService = inject(SettingsService);

  themes = computed(() => {
    return Object.entries(themes).map(([key, theme]) => ({
      label: theme.name,
      value: key,
    }));
  });

  boardTypes = computed(() => {
    return [
      { label: 'Ninja', value: 'ninja' },
      { label: '2D', value: '2d' },
      { label: '3D', value: '3d' },
    ];
  });

  boardNativeThemes = computed(() => {
    return Object.entries(boardNativeThemeList).map(([key, theme]) => ({
      label: theme?.name ?? '',
      value: key,
    }));
  });

  updateGeneralSettings(patch: Partial<GeneralSettings>) {
    this.settingsService.generalSettings.update((settings) => {
      return { ...settings, ...patch };
    });
  }

  updateBoardNativeSettings(patch: Partial<BoardNativeSettings>) {
    this.settingsService.boardNativeSettings.update((settings) => {
      return { ...settings, ...patch };
    });
  }
}
