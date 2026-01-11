import { Injectable, signal } from '@angular/core';
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
  primengTheme: Preset;
  isDark: boolean;
}

export const lightTheme: Theme = {
  primengTheme: MyPreset,
  isDark: false,
};

export const darkTheme: Theme = {
  primengTheme: MyPreset,
  isDark: true,
};

export const themesList = [
  { name: 'Light', value: lightTheme },
  { name: 'Dark', value: darkTheme },
];

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  theme = signal<Theme>(lightTheme);

  applyTheme() {
    const theme = this.theme();
    console.log('Applying theme:', theme);

    document.documentElement.classList.toggle('dark-mode', theme.isDark);

    usePreset(theme.primengTheme);
  }
}
