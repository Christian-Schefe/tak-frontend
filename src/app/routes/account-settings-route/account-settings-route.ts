import { Component } from '@angular/core';
import { KratosFlowComponent } from '../../components/kratos-flow-component/kratos-flow-component';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-account-settings-route',
  imports: [KratosFlowComponent, CardModule],
  templateUrl: './account-settings-route.html',
  styleUrl: './account-settings-route.css',
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class AccountSettingsRoute {}
