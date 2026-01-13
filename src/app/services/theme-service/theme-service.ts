import { Injectable } from '@angular/core';
import Aura from '@primeuix/themes/aura';
import { Preset } from '@primeuix/themes/types';
import { definePreset, usePreset } from '@primeuix/themes';

const MyPreset = definePreset(Aura, {
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

export interface Theme {
  id: string;
  name: string;
  primengTheme: Preset;
  isDark: boolean;
}

export const lightTheme: Theme = {
  id: 'light',
  name: 'Light',
  primengTheme: MyPreset,
  isDark: false,
};

export const darkTheme: Theme = {
  id: 'dark',
  name: 'Dark',
  primengTheme: MyPreset,
  isDark: true,
};

export const themesList = [lightTheme, darkTheme];

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  applyTheme(theme: Theme) {
    console.log('Applying theme:', theme);

    document.documentElement.classList.toggle('dark-mode', theme.isDark);

    usePreset(theme.primengTheme);
  }
}
