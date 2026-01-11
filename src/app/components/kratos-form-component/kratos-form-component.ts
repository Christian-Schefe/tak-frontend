import { Component, computed, input, linkedSignal, output, signal } from '@angular/core';
import { UiContainer, UiNodeInputAttributes } from '@ory/client';
import { FormsModule } from '@angular/forms';
import { KratosInputComponent } from '../kratos-input-component/kratos-input-component';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { Message } from 'primeng/message';

@Component({
  selector: 'app-kratos-form-component',
  imports: [FormsModule, KratosInputComponent, RouterLink, ButtonModule, Message],
  templateUrl: './kratos-form-component.html',
  styleUrl: './kratos-form-component.css',
})
export class KratosFormComponent {
  ui = input.required<UiContainer>();
  submitForm = output<Record<string, unknown>>();
  validity = linkedSignal<Record<string, boolean>>(() => this.computeInitialValidity());
  data = linkedSignal<Record<string, unknown>>(() => this.computeInitialData());
  submitMethod = signal<[string, string] | null>(null);

  canSubmit = computed(() => {
    const validity = this.validity();
    for (const key in validity) {
      if (validity[key] === false) {
        return false;
      }
    }
    return true;
  });

  computeInitialData() {
    const data: Record<string, unknown> = {};
    for (const node of this.ui().nodes) {
      if (
        node.attributes.node_type === 'input' &&
        node.attributes.type !== 'submit' &&
        node.attributes.value !== undefined
      ) {
        data[node.attributes.name] = node.attributes.value;
      }
    }
    return data;
  }

  computeInitialValidity() {
    const validity: Record<string, boolean> = {};
    for (const node of this.ui().nodes) {
      if (node.attributes.node_type === 'input') {
        validity[node.attributes.name] = isValid(node.attributes, node.attributes.value);
      }
    }
    return validity;
  }

  onSubmit() {
    const submitData = this.submitMethod();
    if (!submitData) {
      console.warn('Submit method not set, cannot submit form.');
      return;
    }
    const [submitName, submitValue] = submitData;
    const data = { ...this.data(), [submitName]: submitValue };
    const expandedData: Record<string, unknown> = {};
    for (const key in data) {
      const parts = key.split('.');
      let current = expandedData;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (i === parts.length - 1) {
          current[part] = data[key];
        } else {
          if (!(part in current)) {
            current[part] = {};
          }
          current = current[part] as Record<string, unknown>;
        }
      }
    }
    this.submitForm.emit(expandedData);
  }

  onValueChange(attrs: UiNodeInputAttributes, value: unknown) {
    this.data.update((currentData) => {
      const newData = { ...currentData, [attrs.name]: value };
      if (value === '' || value === null || value === undefined) {
        delete newData[attrs.name];
      }
      return newData;
    });
    this.validity.update((currentValidity) => {
      const newValidity = { ...currentValidity, [attrs.name]: isValid(attrs, value) };
      return newValidity;
    });
  }
}

function isValid(attrs: UiNodeInputAttributes, val: unknown) {
  let valid = true;
  if (val === undefined || val === null || val === '') {
    val = undefined;
  }
  if (attrs.required && val === undefined) {
    valid = false;
  }
  if (attrs.pattern) {
    const regex = new RegExp(attrs.pattern, 'u');
    if (typeof val !== 'string' || !regex.test(val)) {
      valid = false;
    }
  }
  if (attrs.type === 'email' && typeof val === 'string') {
    if (!val.includes('@')) {
      valid = false;
    }
  }
  return valid;
}
