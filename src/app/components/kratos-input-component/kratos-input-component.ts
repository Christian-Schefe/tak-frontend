import { Component, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UiNodeInputAttributes, UiNodeMeta, UiText } from '@ory/client';
import { InputTextModule } from 'primeng/inputtext';
import { IftaLabelModule } from 'primeng/iftalabel';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';

@Component({
  selector: 'app-kratos-input-component',
  imports: [
    FormsModule,
    InputTextModule,
    IftaLabelModule,
    ButtonModule,
    CheckboxModule,
    MessageModule,
    PasswordModule,
    RippleModule,
  ],
  templateUrl: './kratos-input-component.html',
  styleUrl: './kratos-input-component.css',
})
export class KratosInputComponent {
  messages = input.required<UiText[]>();
  attributes = input.required<UiNodeInputAttributes>();
  meta = input.required<UiNodeMeta>();
  value = model.required<unknown>();
  validity = input.required<boolean>();
  submitMethod = model.required<[string, string] | null>();

  onSubmit(value: string) {
    this.submitMethod.set([this.attributes().name, value]);
  }
}
