import { Component, input, linkedSignal, model, output } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { Button } from 'primeng/button';

import { SelectModule } from 'primeng/select';
import { IftaLabelModule } from 'primeng/iftalabel';
import { FormsModule } from '@angular/forms';
import { AccountProfile } from '../../services/profile-service/profile-service';
import { countries } from 'countries-list';

const countryArray = Object.entries(countries).map(([code, country]) => ({
  code,
  name: country.name,
}));
countryArray.sort((a, b) => a.name.localeCompare(b.name));

@Component({
  selector: 'app-edit-player-profile-dialog',
  imports: [DialogModule, Button, SelectModule, IftaLabelModule, FormsModule],
  templateUrl: './edit-player-profile-dialog.html',
  styleUrl: './edit-player-profile-dialog.css',
})
export class EditPlayerProfileDialog {
  visible = model.required<boolean>();

  countries = countryArray.map(({ code, name }) => ({
    value: code,
    label: name,
  }));
  updateProfile = output<AccountProfile>();

  currentProfile = input.required<AccountProfile | undefined>();

  selectedCountry = linkedSignal<string | null>(() => {
    this.visible(); // This causes reset when dialog is opened
    return this.currentProfile()?.country ?? null;
  });

  onSubmit() {
    const profile: AccountProfile = {
      country: this.selectedCountry(),
    };
    this.updateProfile.emit(profile);
    this.visible.set(false);
  }
}
