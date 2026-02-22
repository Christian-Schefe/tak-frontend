import { Component, model, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { FileUploadHandlerEvent, FileUploadModule } from 'primeng/fileupload';
import { PanelModule } from 'primeng/panel';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-profile-picture-change-dialog',
  imports: [
    DialogModule,
    FileUploadModule,
    ButtonModule,
    CardModule,
    PanelModule,
    ProgressSpinnerModule,
  ],
  templateUrl: './profile-picture-change-dialog.html',
  styleUrl: './profile-picture-change-dialog.css',
})
export class ProfilePictureChangeDialog {
  visible = model.required<boolean>();
  avatarUrl = model.required<string | null>();
  uploadAvatar = output<File>();

  onUpload(fu: FileUploadHandlerEvent) {
    console.log('File selected', fu.files);
    if (fu.files.length === 0) {
      return;
    }
    const file: File = fu.files[0];
    this.uploadAvatar.emit(file);
  }
}
