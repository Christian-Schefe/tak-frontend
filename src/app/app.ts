import { Component, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './services/theme-service/theme-service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  themeService = inject(ThemeService);

  constructor() {
    effect(() => {
      this.themeService.applyTheme();
    });
  }
}
