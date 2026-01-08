import { Component, inject, signal, effect } from '@angular/core';
import { RegistrationFlow, UpdateRegistrationFlowBody } from '@ory/client';
import { KratosFormComponent } from '../kratos-form-component/kratos-form-component';
import { AuthService } from '../auth-service/auth-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registration-component',
  imports: [KratosFormComponent],
  templateUrl: './registration-component.html',
  styleUrl: './registration-component.css',
})
export class RegistrationComponent {
  authService = inject(AuthService);
  flow = signal<RegistrationFlow | null>(null);
  router = inject(Router);

  constructor() {
    effect(() => {
      const authStatus = this.authService.isLoggedIn();
      if (authStatus !== null) {
        if (authStatus) {
          console.log('User is already authenticated, redirecting to home.');
          this.router.navigate(['/']);
        } else {
          this.startRegistration();
        }
      }
    });
  }

  async startRegistration() {
    const flow = await this.authService.startRegistrationFlow();
    console.log('Registration flow data:', flow.data);
    this.flow.set(flow.data);
  }

  async submitRegistration(data: unknown) {
    const flow = this.flow();
    if (!flow) {
      return;
    }
    try {
      console.log('Submitting registration data:', JSON.stringify(data));
      const result = await this.authService.submitRegistration(
        flow.id,
        data as UpdateRegistrationFlowBody,
      );
      console.log('Registration successful:', result);
    } catch (error: unknown) {
      const response = error as { response?: { status: number; data: RegistrationFlow } };
      if (response.response) {
        this.flow.set(response.response?.data);
      } else {
        console.error('Unexpected error during registration:', error);
      }
    }
  }

  onSubmit(data: unknown) {
    this.submitRegistration(data);
  }
}
