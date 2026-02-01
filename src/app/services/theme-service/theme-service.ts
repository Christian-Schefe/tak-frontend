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

export const SunsetTheme = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{orange.50}',
      100: '{orange.100}',
      200: '{orange.200}',
      300: '{orange.300}',
      400: '{orange.400}',
      500: '{orange.500}',
      600: '{orange.600}',
      700: '{orange.700}',
      800: '{orange.800}',
      900: '{orange.900}',
      950: '{orange.950}',
    },
    borderRadius: {
      xs: '0.5rem',
      sm: '0.5rem',
      md: '0.5rem',
      lg: '0.5rem',
      xl: '0.5rem',
    },
    colorScheme: {
      light: {
        surface: {
          0: '#ffffff',
          50: '{amber.50}',
          100: '{amber.100}',
          200: '{amber.200}',
          300: '{amber.300}',
          400: '{amber.400}',
          500: '{amber.500}',
          600: '{amber.600}',
          700: '{amber.700}',
          800: '{amber.800}',
          900: '{amber.900}',
          950: '{amber.950}',
        },
      },
      dark: {
        surface: {
          0: '#ffffff',
          50: '{stone.50}',
          100: '{stone.100}',
          200: '{stone.200}',
          300: '{stone.300}',
          400: '{stone.400}',
          500: '{stone.500}',
          600: '{stone.600}',
          700: '{stone.700}',
          800: '{stone.800}',
          900: '{stone.900}',
          950: '{stone.950}',
        },
      },
    },
  },
});

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

export const themes: Record<ThemeId, Theme> = {
  light: lightTheme,
  dark: darkTheme,
  classic: classicTheme,
  sunset: sunsetTheme,
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
