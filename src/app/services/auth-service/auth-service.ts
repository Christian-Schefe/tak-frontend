import { computed, Injectable, resource } from '@angular/core';
import {
  Session,
  UpdateLoginFlowBody,
  UpdateRegistrationFlowBody,
  UpdateSettingsFlowBody,
  UpdateVerificationFlowBody,
} from '@ory/client';
import { kratos } from '../../auth/kratos';

type AuthState =
  | {
      type: 'loading';
    }
  | {
      type: 'logged_out';
    }
  | {
      type: 'logged_in';
      session: Session;
    };

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private sessionResource = resource({
    loader: async () => {
      try {
        const newSession = await kratos.toSession();
        return newSession.data;
      } catch {
        return null;
      }
    },
  });

  authState = computed<AuthState>(() => {
    if (!this.sessionResource.hasValue()) {
      return { type: 'loading' };
    }
    const session = this.sessionResource.value();
    if (session !== null && session.active !== false) {
      return { type: 'logged_in', session: session };
    } else {
      return { type: 'logged_out' };
    }
  });

  async getSession() {
    const authState = this.authState();
    if (authState.type === 'logged_in') {
      return authState.session;
    }
    try {
      const newSession = await kratos.toSession();
      return newSession.data;
    } catch {
      return null;
    }
  }

  async getLoginFlow(flowId: string) {
    return await kratos.getLoginFlow({ id: flowId });
  }

  async startLoginFlow(refresh?: boolean) {
    return await kratos.createBrowserLoginFlow({ refresh });
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

  async startVerificationFlow() {
    return await kratos.createBrowserVerificationFlow();
  }

  async getVerificationFlow(flowId: string) {
    return await kratos.getVerificationFlow({ id: flowId });
  }

  async submitVerification(flowId: string, data: UpdateVerificationFlowBody) {
    return await kratos.updateVerificationFlow({
      flow: flowId,
      updateVerificationFlowBody: data,
    });
  }

  async logout() {
    if (this.authState().type === 'logged_in') {
      const flow = await kratos.createBrowserLogoutFlow();
      await kratos.updateLogoutFlow({ token: flow.data.logout_token });
    }
    console.log('logout', this.sessionResource.reload());
  }

  async startSettingsFlow() {
    return await kratos.createBrowserSettingsFlow();
  }

  async submitSettings(flowId: string, data: UpdateSettingsFlowBody) {
    return await kratos.updateSettingsFlow({
      flow: flowId,
      updateSettingsFlowBody: data,
    });
  }

  async getSettingsFlow(flowId: string) {
    return await kratos.getSettingsFlow({ id: flowId });
  }

  async startRecoveryFlow() {
    return await kratos.createBrowserRecoveryFlow();
  }

  async getRecoveryFlow(flowId: string) {
    return await kratos.getRecoveryFlow({ id: flowId });
  }

  async submitRecovery(flowId: string, data: UpdateVerificationFlowBody) {
    return await kratos.updateRecoveryFlow({
      flow: flowId,
      updateRecoveryFlowBody: data,
    });
  }
}
