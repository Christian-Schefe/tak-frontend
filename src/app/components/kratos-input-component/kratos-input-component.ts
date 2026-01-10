import { Component, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UiNodeInputAttributes, UiNodeMeta, UiText } from '@ory/client';

@Component({
  selector: 'app-kratos-input-component',
  imports: [FormsModule],
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
