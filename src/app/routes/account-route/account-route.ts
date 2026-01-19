import { Component, inject, linkedSignal, resource } from '@angular/core';
import { KratosFormComponent } from '../../components/kratos-form-component/kratos-form-component';
import { AuthService } from '../../services/auth-service/auth-service';
import { SettingsFlow, UpdateSettingsFlowBody } from '@ory/client';
import { ActivatedRoute, Router } from '@angular/router';
import { AxiosError } from 'axios';

@Component({
  selector: 'app-account-route',
  imports: [KratosFormComponent],
  templateUrl: './account-route.html',
  styleUrl: './account-route.css',
})
export class AccountRoute {
  route = inject(ActivatedRoute);
  authService = inject(AuthService);
  router = inject(Router);
  flow = resource({
    loader: async () => {
      const flowId = this.route.snapshot.queryParams['flow'];
      if (flowId) {
        const flow = await this.authService.getSettingsFlow(flowId);
        console.log('Fetched existing settings flow data:', flow.data);
        return flow.data;
      } else {
        const flow = await this.authService.startSettingsFlow();
        console.log('Settings flow data:', flow.data);
        return flow.data;
      }
    },
  });
  shownFlow = linkedSignal<SettingsFlow | undefined, SettingsFlow | undefined>({
    source: () => this.flow.value(),
    computation: (source, prev) => {
      if (prev?.value && !source) {
        return prev.value;
      }
      return source;
    },
  });

  onSubmit(data: unknown) {
    this.doSubmit(data);
  }

  private async doSubmit(data: unknown) {
    if (!this.flow.hasValue()) {
      return;
    }
    const flow = this.flow.value();
    try {
      console.log('Submitting settings data:', JSON.stringify(data));

      const result = await this.authService.submitSettings(flow.id, data as UpdateSettingsFlowBody);
      console.log('Settings update successful:', result);
      this.flow.set(result.data);
    } catch (error: unknown) {
      const axiosError = error as AxiosError<unknown>;
      if (axiosError.response) {
        if (axiosError.response.status === 400) {
          console.log('Validation error during settings update:', axiosError.response.data);
          this.flow.set(axiosError.response.data as SettingsFlow);
          return;
        }
        if (axiosError.response.status === 401 || axiosError.response.status === 403) {
          console.log('Unauthorized during settings update, redirecting to relogin.');
          this.router.navigate(['/relogin'], {
            queryParams: { return_to: `/app/account?flow=${flow.id}` },
          });
          return;
        }
      }
    }
  }
}
