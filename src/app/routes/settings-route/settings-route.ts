import { Component, computed, inject } from '@angular/core';
import { SelectModule } from 'primeng/select';
import { ThemeService, themesList } from '../../services/theme-service/theme-service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-settings-route',
  imports: [SelectModule, FormsModule],
  templateUrl: './settings-route.html',
  styleUrl: './settings-route.css',
})
export class SettingsRoute {
  themeService = inject(ThemeService);
  themes = computed(() => {
    return themesList.map((theme) => ({
      label: theme.name,
      value: theme.value,
    }));
  });
}
