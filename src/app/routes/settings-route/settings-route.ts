import { Component, computed, inject } from '@angular/core';
import { SelectModule } from 'primeng/select';
import { themesList } from '../../services/theme-service/theme-service';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../services/settings-service/settings-service';
import { IftaLabelModule } from 'primeng/iftalabel';

@Component({
  selector: 'app-settings-route',
  imports: [SelectModule, FormsModule, IftaLabelModule],
  templateUrl: './settings-route.html',
  styleUrl: './settings-route.css',
})
export class SettingsRoute {
  settingsService = inject(SettingsService);

  themes = computed(() => {
    return themesList.map((theme) => ({
      label: theme.name,
      value: theme.id,
    }));
  });
}
