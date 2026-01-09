import { Component, inject, resource } from '@angular/core';
import { AuthService } from '../auth-service/auth-service';
import {
  LoginFlow,
  RegistrationFlow,
  UpdateVerificationFlowBody,
  VerificationFlow,
} from '@ory/client';
import { KratosFormComponent } from '../kratos-form-component/kratos-form-component';
import { ActivatedRoute } from '@angular/router';

type AuthFlow = LoginFlow | RegistrationFlow | VerificationFlow;

@Component({
  selector: 'app-auth-route',
  imports: [KratosFormComponent],
  templateUrl: './verification-route.html',
  styleUrl: './verification-route.css',
})
export class VerificationRoute {
  route = inject(ActivatedRoute);
  authService = inject(AuthService);
  flow = resource({
    loader: async () => {
      const flowId = this.route.snapshot.queryParams['flow'];
      if (flowId) {
        const flow = await this.authService.getVerificationFlow(flowId);
        console.log('Fetched existing verification flow data:', flow.data);
        return flow.data;
      } else {
        const flow = await this.authService.startVerificationFlow();
        console.log('Verification flow data:', flow.data);
        return flow.data;
      }
    },
  });

  constructor() {
    this.route.queryParams.subscribe(() => {
      const res = this.flow.reload();
      console.log('Query params changed, reloading verification flow: ', res);
    });
  }

  onSubmit(data: unknown) {
    this.doSubmit(data);
  }

  private async doSubmit(data: unknown) {
    if (!this.flow.hasValue()) {
      return;
    }
    const flow = this.flow.value();
    try {
      console.log('Submitting verification data:', JSON.stringify(data));
      const result = await this.authService.submitVerification(
        flow.id,
        data as UpdateVerificationFlowBody,
      );
      console.log('Verification successful:', result);
      this.flow.set(result.data);
    } catch (error: unknown) {
      const err = error as { response?: { status: number; data: AuthFlow } };
      if (err.response) {
        this.flow.set(err.response?.data);
      } else {
        console.error('Unexpected error during authentication:', err);
      }
    }
  }
}
