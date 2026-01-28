import { Component, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './services/theme-service/theme-service';
import { SettingsService } from './services/settings-service/settings-service';
import { WsService } from './services/ws-service/ws-service';
import { GameService } from './services/game-service/game-service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
  providers: [MessageService],
})
export class App {
  themeService = inject(ThemeService);
  settingsService = inject(SettingsService);
  wsService = inject(WsService);
  gameService = inject(GameService);
  messageService = inject(MessageService);

  hasNotified = false;

  private readonly _notifyEffect = effect(() => {
    if (this.hasNotified) return;
    const thisPlayerGames = this.gameService.thisPlayerGames();
    if (thisPlayerGames.length > 0) {
      this.messageService.add({
        severity: 'info',
        summary: 'Ongoing Game',
        detail: `You have ${thisPlayerGames.length.toString()} ongoing games.`,
      });
      this.hasNotified = true;
    }
  });
}
