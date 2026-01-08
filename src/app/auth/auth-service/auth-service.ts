import { computed, Injectable, resource } from '@angular/core';
import { kratos } from '../kratos';
import { UpdateLoginFlowBody, UpdateRegistrationFlowBody } from '@ory/client';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private sessionResource = resource({
    loader: async () => {
      return await this.getSession();
    },
  });

  isLoggedIn = computed(() => {
    if (this.sessionResource.hasValue()) {
      return this.sessionResource.value() !== null;
    } else {
      return null;
    }
  });

  async startLoginFlow() {
    return await kratos.createBrowserLoginFlow();
  }

  async submitLogin(flowId: string, data: UpdateLoginFlowBody) {
    const res = await kratos.updateLoginFlow({
      flow: flowId,
      updateLoginFlowBody: data,
    });
    this.sessionResource.reload();
    return res;
  }

  async startRegistrationFlow() {
    return await kratos.createBrowserRegistrationFlow();
  }

  async submitRegistration(flowId: string, data: UpdateRegistrationFlowBody) {
    return await kratos.updateRegistrationFlow({
      flow: flowId,
      updateRegistrationFlowBody: data,
    });
  }

  private async getSession() {
    try {
      const newSession = await kratos.toSession();
      return newSession.data;
    } catch {
      return null;
    }
  }

  async logout() {
    const flow = await kratos.createBrowserLogoutFlow();
    await kratos.updateLogoutFlow({ token: flow.data.logout_token });
    this.sessionResource.reload();
  }
}
