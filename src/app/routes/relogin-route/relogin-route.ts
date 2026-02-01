import { Component, inject, resource } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth-service/auth-service';
import { LoginFlow, UpdateLoginFlowBody } from '@ory/client';
import { CardModule } from 'primeng/card';
import { KratosFormComponent } from '../../components/kratos-form-component/kratos-form-component';

@Component({
  selector: 'app-relogin-route',
  imports: [CardModule, KratosFormComponent],
  templateUrl: './relogin-route.html',
  styleUrl: './relogin-route.css',
})
export class ReloginRoute {
  route = inject(ActivatedRoute);
  router = inject(Router);
  authService = inject(AuthService);
  flow = resource({
    loader: async () => {
      const flowId: unknown = this.route.snapshot.queryParams['flow'];
      if (typeof flowId === 'string') {
        const flow = await this.authService.getLoginFlow(flowId);
        console.log('Fetched existing login flow data:', flow.data);
        return flow.data;
      } else {
        const flow = await this.authService.startLoginFlow(true);
        console.log('Login flow data:', flow.data);
        return flow.data;
      }
    },
  });

  onSubmit(data: unknown) {
    void this.doSubmit(data);
  }

  private async doSubmit(data: unknown) {
    if (!this.flow.hasValue()) {
      return;
    }
    const flow = this.flow.value();
    try {
      console.log('Submitting login data:', JSON.stringify(data));
      const result = await this.authService.submitLogin(flow.id, data as UpdateLoginFlowBody);
      console.log('Login successful:', result);
      const returnToParam: unknown = this.route.snapshot.queryParams['return_to'];
      const returnTo = typeof returnToParam === 'string' ? decodeURI(returnToParam) : '/app';
      console.log('Navigating to return_to URL:', returnTo);
      void this.router.navigateByUrl(returnTo);
    } catch (error: unknown) {
      const err = error as { response?: { status: number; data: LoginFlow } };
      if (err.response) {
        this.flow.set(err.response.data);
      } else {
        console.error('Unexpected error during authentication:', err);
      }
    }
  }
}
