import { Component, inject, signal, OnInit } from '@angular/core';
import { LoginFlow, UpdateLoginFlowBody } from '@ory/client';
import { AuthService } from '../auth-service/auth-service';
import { KratosFormComponent } from "../kratos-form-component/kratos-form-component";

@Component({
  selector: 'app-login-component',
  imports: [KratosFormComponent],
  templateUrl: './login-component.html',
  styleUrl: './login-component.css',
})
export class LoginComponent implements OnInit {
  authService = inject(AuthService);
  flow = signal<LoginFlow | null>(null);

  ngOnInit() {
    this.authService.startLoginFlow().then((flow) => {
      console.log('Login flow data:', flow.data);
      this.flow.set(flow.data);
    });
  }

  onSubmit(data: unknown) {
    const flow = this.flow();
    if (flow) {
      console.log('Submitting login data:', JSON.stringify(data));
      this.authService.submitLogin(flow.id, data as UpdateLoginFlowBody).then((result) => {
        console.log('Login successful:', result);
      });
    }
  }
}
