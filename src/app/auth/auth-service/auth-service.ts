import { computed, Injectable, resource } from '@angular/core';
import { kratos } from '../kratos';
import {
  Session,
  UpdateLoginFlowBody,
  UpdateRegistrationFlowBody,
  UpdateVerificationFlowBody,
} from '@ory/client';

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

  async checkLoggedIn() {
    const session = await this.getSession();
    return session !== null;
  }

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
    const flow = await kratos.createBrowserLogoutFlow();
    await kratos.updateLogoutFlow({ token: flow.data.logout_token });
    this.sessionResource.reload();
  }
}
