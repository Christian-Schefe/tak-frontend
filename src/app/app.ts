import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './services/theme-service/theme-service';
import { SettingsService } from './services/settings-service/settings-service';
import { WsService } from './services/ws-service/ws-service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  themeService = inject(ThemeService);
  settingsService = inject(SettingsService);
  wsService = inject(WsService);

  constructor() {
    this.settingsService.load();
    this.wsService.initialize();
  }
}
