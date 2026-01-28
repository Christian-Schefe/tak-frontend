import { Component, effect, inject, linkedSignal, resource, signal } from '@angular/core';
import {
  LoginFlow,
  RegistrationFlow,
  UpdateLoginFlowBody,
  UpdateRegistrationFlowBody,
} from '@ory/client';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth-service/auth-service';
import { KratosFormComponent } from '../../components/kratos-form-component/kratos-form-component';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

type AuthFlowState = 'login' | 'registration';
type AuthFlow = LoginFlow | RegistrationFlow;

@Component({
  selector: 'app-auth-route',
  imports: [KratosFormComponent, CardModule, ButtonModule, ProgressSpinnerModule],
  templateUrl: './auth-route.html',
  styleUrl: './auth-route.css',
})
export class AuthRoute {
  router = inject(Router);
  authService = inject(AuthService);
  authFlowState = signal<AuthFlowState>('login');
  flow = resource({
    params: () => ({ authState: this.authFlowState() }),
    loader: async ({ params }) => {
      const state = params.authState;
      if (state === 'registration') {
        const flow = await this.authService.startRegistrationFlow();
        return flow.data;
      } else {
        const flow = await this.authService.startLoginFlow();
        return flow.data;
      }
    },
  });
  shownFlow = linkedSignal<AuthFlow | undefined, AuthFlow | undefined>({
    source: () => this.flow.value(),
    computation: (source, prev) => {
      if (prev?.value && !source) {
        return prev.value;
      }
      return source;
    },
  });

  private readonly _navigateIfLoggedInEffect = effect(() => {
    const authState = this.authService.authState();
    if (authState.type === 'logged_in') {
      void this.router.navigate(['/app']);
    }
  });

  setAuthState(state: AuthFlowState) {
    this.authFlowState.set(state);
  }

  onSubmit(data: unknown) {
    void this.doSubmit(data);
  }

  private async doSubmit(data: unknown) {
    if (!this.flow.hasValue()) {
      return;
    }
    const flow = this.flow.value();
    const authState = this.authFlowState();
    try {
      console.log('Submitting authentication data:', JSON.stringify(data));
      if (authState === 'login') {
        const result = await this.authService.submitLogin(flow.id, data as UpdateLoginFlowBody);
        console.log('Login successful:', result);
      } else {
        const result = await this.authService.submitRegistration(
          flow.id,
          data as UpdateRegistrationFlowBody,
        );
        console.log('Registration successful:', result);
        if (result.data.continue_with !== undefined) {
          const verificationFlowId = result.data.continue_with.find(
            (value) => value.action === 'show_verification_ui',
          )?.flow.id;
          if (verificationFlowId !== undefined) {
            await this.router.navigate(['/verify'], { queryParams: { flow: verificationFlowId } });
          }
        }
      }
    } catch (error: unknown) {
      const response = error as { response?: { status: number; data: AuthFlow } };
      if (response.response) {
        this.flow.set(response.response.data);
      } else {
        console.error('Unexpected error during authentication:', error);
      }
    }
  }
}
