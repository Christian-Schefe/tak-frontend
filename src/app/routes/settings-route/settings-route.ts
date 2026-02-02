import { Component, computed, inject } from '@angular/core';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import {
  BoardNativeSettings,
  BoardNinjaSettings,
  GeneralSettings,
  SettingsService,
} from '../../services/settings-service/settings-service';
import { IftaLabelModule } from 'primeng/iftalabel';
import { TabsModule } from 'primeng/tabs';
import { SliderModule } from 'primeng/slider';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { themes as boardNativeThemeList } from '../../../2d-themes';
import { themes } from '../../services/theme-service/theme-service';
import { NINJA_2D_THEMES } from '../../components/board-ninja-component/board-ninja.constants';

@Component({
  selector: 'app-settings-route',
  imports: [
    SelectModule,
    FormsModule,
    IftaLabelModule,
    TabsModule,
    ToggleButtonModule,
    SliderModule,
  ],
  templateUrl: './settings-route.html',
  styleUrl: './settings-route.css',
})
export class SettingsRoute {
  settingsService = inject(SettingsService);

  generalSettings = {
    themes: Object.entries(themes).map(([key, theme]) => ({
      label: theme.name,
      value: key,
    })),
    boardTypes: [
      { label: 'Ninja', value: 'ninja' },
      { label: '2D', value: '2d' },
      { label: '3D', value: '3d' },
    ],
  };

  boardNativeSettings = {
    themes: Object.entries(boardNativeThemeList).map(([key, theme]) => ({
      label: theme.name,
      value: key,
    })),
  };

  boardNinjaSettings = {
    themes: NINJA_2D_THEMES.map((theme) => ({
      label: theme.charAt(0).toUpperCase() + theme.slice(1),
      value: theme,
    })),
    axisLabelOptions: [
      { label: 'Normal', value: 'normal' },
      { label: 'Small', value: 'small' },
      { label: 'None', value: 'none' },
    ],
  };

  perspective = computed(() => {
    const settings = this.settingsService.boardNinjaSettings();
    return settings.orthographic ? 0 : settings.perspective;
  });

  setPerspective(value: number) {
    this.updateBoardNinjaSettings({
      perspective: value,
      orthographic: value === 0,
    });
  }

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

  updateBoardNinjaSettings(patch: Partial<BoardNinjaSettings>) {
    this.settingsService.boardNinjaSettings.update((settings) => {
      return { ...settings, ...patch };
    });
  }
}
