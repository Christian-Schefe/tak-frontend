import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IdentityService } from '../../services/identity-service/identity-service';
import { MenubarModule } from 'primeng/menubar';
import { RippleModule } from 'primeng/ripple';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { solarGamepad, solarSettings, solarUser } from '@ng-icons/solar-icons/outline';
import { PlayerService } from '../../services/player-service/player-service';
import { MenuItem } from 'primeng/api';
import { SeeksDialogComponent } from '../seeks-dialog-component/seeks-dialog-component';
import { GamesDialogComponent } from '../games-dialog-component/games-dialog-component';

@Component({
  selector: 'app-app-nav-component',
  imports: [
    RouterLink,
    MenubarModule,
    NgIcon,
    RippleModule,
    SeeksDialogComponent,
    GamesDialogComponent,
  ],
  templateUrl: './app-nav-component.html',
  styleUrl: './app-nav-component.css',
  providers: [provideIcons({ solarGamepad, solarSettings, solarUser })],
})
export class AppNavComponent {
  identityService = inject(IdentityService);
  playerService = inject(PlayerService);

  playerInfo = computed(() => {
    const identity = this.identityService.identity();
    if (!identity) {
      return null;
    }
    const resource = this.playerService.getPlayerInfo(identity.playerId);
    if (resource.hasValue()) {
      return resource.value();
    }
    return null;
  });

  seeksDialogVisible = signal(false);
  gamesDialogVisible = signal(false);

  typedItem(item: unknown): MenuItem {
    return item as MenuItem;
  }

  items: MenuItem[] = [
    {
      label: 'Play Local',
      icon: 'solarGamepad',
      routerLink: '/app/local',
    },
    {
      label: 'Seeks',
      icon: 'solarGamepad',
      command: () => {
        this.seeksDialogVisible.set(true);
      },
    },
    {
      label: 'Games',
      icon: 'solarGamepad',
      command: () => {
        this.gamesDialogVisible.set(true);
      },
    },
    {
      label: 'Settings',
      icon: 'solarSettings',
      routerLink: '/app/settings',
    },
    {
      label: 'Account',
      icon: 'solarUser',
      routerLink: '/app/account',
    },
  ];
}
