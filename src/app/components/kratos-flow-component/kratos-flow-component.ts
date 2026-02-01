import { Component, inject, input, resource } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth-service/auth-service';
import {
  RecoveryFlow,
  SettingsFlow,
  UpdateRecoveryFlowBody,
  UpdateSettingsFlowBody,
  UpdateVerificationFlowBody,
  VerificationFlow,
} from '@ory/client';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { KratosFormComponent } from '../kratos-form-component/kratos-form-component';
import { AxiosError } from 'axios';

type Flow = RecoveryFlow | VerificationFlow | SettingsFlow;

@Component({
  selector: 'app-kratos-flow-component',
  imports: [ProgressSpinnerModule, KratosFormComponent],
  templateUrl: './kratos-flow-component.html',
  styleUrl: './kratos-flow-component.css',
})
export class KratosFlowComponent {
  route = inject(ActivatedRoute);
  authService = inject(AuthService);
  router = inject(Router);

  flowType = input.required<'recovery' | 'verification' | 'settings'>();

  flow = resource({
    loader: async () => {
      const flowId: unknown = this.route.snapshot.queryParams['flow'];
      const flowType = this.flowType();
      try {
        if (typeof flowId === 'string') {
          const flow = await this.getFlow(flowType, flowId);
          console.log(`${flowType} flow data:`, flow);
          return flow;
        } else {
          const flow = await this.startFlow(flowType);
          console.log(`${flowType} flow data:`, flow);
          return flow;
        }
      } catch (error: unknown) {
        const newFlow = await this.handleError(error as AxiosError);
        return newFlow;
      }
    },
  });

  private async getFlow(flowType: string, flowId: string): Promise<Flow> {
    if (flowType === 'recovery') {
      return (await this.authService.getRecoveryFlow(flowId)).data;
    } else if (flowType === 'verification') {
      return (await this.authService.getVerificationFlow(flowId)).data;
    } else {
      return (await this.authService.getSettingsFlow(flowId)).data;
    }
  }

  private async startFlow(flowType: string): Promise<Flow> {
    if (flowType === 'recovery') {
      return (await this.authService.startRecoveryFlow()).data;
    } else if (flowType === 'verification') {
      return (await this.authService.startVerificationFlow()).data;
    } else {
      return (await this.authService.startSettingsFlow()).data;
    }
  }

  private async submitFlow(flowType: string, flowId: string, data: unknown): Promise<Flow> {
    if (flowType === 'recovery') {
      return (await this.authService.submitRecovery(flowId, data as UpdateRecoveryFlowBody)).data;
    } else if (flowType === 'verification') {
      return (await this.authService.submitVerification(flowId, data as UpdateVerificationFlowBody))
        .data;
    } else {
      return (await this.authService.submitSettings(flowId, data as UpdateSettingsFlowBody)).data;
    }
  }

  onSubmit(data: unknown) {
    void this.doSubmit(data);
  }

  private async doSubmit(data: unknown) {
    if (!this.flow.hasValue()) {
      return;
    }
    const flow = this.flow.value();
    const flowType = this.flowType();
    try {
      console.log(`Submitting ${flowType} data:`, JSON.stringify(data));
      const result = await this.submitFlow(flowType, flow.id, data);
      console.log(`${flowType} successful:`, result);
      this.flow.set(result);
    } catch (error: unknown) {
      const newFlow = await this.handleError(error as AxiosError);
      if (newFlow) {
        this.flow.set(newFlow);
      }
    }
  }

  private async handleError(error: AxiosError) {
    if (error.response?.data === undefined) {
      console.error('Unexpected error during authentication:', error);
      return;
    }
    const err = error.response.data as { error?: { id: string }; redirect_browser_to: string };
    const flow = error.response.data as Flow;

    if (
      this.flowType() === 'settings' &&
      (error.response.status === 401 || error.response.status === 403)
    ) {
      console.log('Unauthorized, redirecting to relogin.');
      void this.router.navigate(['/relogin'], {
        queryParams: { return_to: `/app/account?flow=${flow.id}` },
      });
      return;
    }

    if (err.error?.id === 'browser_location_change_required') {
      const redirectTo = err.redirect_browser_to;
      console.log(`Redirecting browser to: ${redirectTo}`);
      await this.router.navigateByUrl(redirectTo);
    } else if (err.error?.id === 'session_already_available') {
      console.log('Session already available, navigating to /app');
      await this.router.navigateByUrl('/app');
    } else {
      return flow;
    }
    return undefined;
  }
}
