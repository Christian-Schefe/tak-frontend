import { computed, effect, inject, Injectable } from '@angular/core';
import Aura from '@primeuix/themes/aura';
import Material from '@primeuix/themes/material';
import { Preset } from '@primeuix/themes/types';
import { definePreset, usePreset } from '@primeuix/themes';
import { SettingsService } from '../settings-service/settings-service';
import { ThemeId } from './theme.constants';

const AuraBlue = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{blue.50}',
      100: '{blue.100}',
      200: '{blue.200}',
      300: '{blue.300}',
      400: '{blue.400}',
      500: '{blue.500}',
      600: '{blue.600}',
      700: '{blue.700}',
      800: '{blue.800}',
      900: '{blue.900}',
      950: '{blue.950}',
    },
  },
});

const ClassicTheme = definePreset(Material, {
  semantic: {
    primary: {
      50: '#e6ecf8',
      100: '#cdd9f1',
      200: '#a3b8e4',
      300: '#7997d7',
      400: '#567bc7',
      500: '#3f63b5',
      600: '#2f5aa8',
      700: '#274f99',
      800: '#20448a',
      900: '#1a3a7a',
    },
  },
});

function auraTheme(primary: string, surface: string): Preset {
  return definePreset(Aura, {
    semantic: {
      primary: {
        50: `{${primary}.50}`,
        100: `{${primary}.100}`,
        200: `{${primary}.200}`,
        300: `{${primary}.300}`,
        400: `{${primary}.400}`,
        500: `{${primary}.500}`,
        600: `{${primary}.600}`,
        700: `{${primary}.700}`,
        800: `{${primary}.800}`,
        900: `{${primary}.900}`,
        950: `{${primary}.950}`,
      },
      colorScheme: {
        light: {
          surface: {
            0: '#ffffff',
            50: `{${surface}.50}`,
            100: `{${surface}.100}`,
            200: `{${surface}.200}`,
            300: `{${surface}.300}`,
            400: `{${surface}.400}`,
            500: `{${surface}.500}`,
            600: `{${surface}.600}`,
            700: `{${surface}.700}`,
            800: `{${surface}.800}`,
            900: `{${surface}.900}`,
            950: `{${surface}.950}`,
          },
        },
        dark: {
          surface: {
            0: '#ffffff',
            50: `{${surface}.50}`,
            100: `{${surface}.100}`,
            200: `{${surface}.200}`,
            300: `{${surface}.300}`,
            400: `{${surface}.400}`,
            500: `{${surface}.500}`,
            600: `{${surface}.600}`,
            700: `{${surface}.700}`,
            800: `{${surface}.800}`,
            900: `{${surface}.900}`,
            950: `{${surface}.950}`,
          },
        },
      },
    },
  });
}

export const SunsetTheme = auraTheme('orange', 'stone');
export const MintTheme = auraTheme('green', 'gray');

export interface Theme {
  name: string;
  primengTheme: Preset;
  isDark: boolean;
}

export const lightTheme: Theme = {
  name: 'Light',
  primengTheme: AuraBlue,
  isDark: false,
};

export const darkTheme: Theme = {
  name: 'Dark',
  primengTheme: AuraBlue,
  isDark: true,
};

export const classicTheme: Theme = {
  name: 'Classic',
  primengTheme: ClassicTheme,
  isDark: true,
};

export const sunsetTheme: Theme = {
  name: 'Sunset',
  primengTheme: SunsetTheme,
  isDark: true,
};

export const mintTheme: Theme = {
  name: 'Mint',
  primengTheme: MintTheme,
  isDark: true,
};

export const themes: Record<ThemeId, Theme> = {
  light: lightTheme,
  dark: darkTheme,
  classic: classicTheme,
  sunset: sunsetTheme,
  mint: mintTheme,
};

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  settingsService = inject(SettingsService);
  theme = computed(() => {
    return themes[this.settingsService.generalSettings().theme];
  });

  private readonly _applyThemeEffect = effect(() => {
    const theme = this.theme();
    console.log('Applying theme:', theme);

    document.documentElement.classList.toggle('dark-mode', theme.isDark);

    usePreset(theme.primengTheme);
  });
}
