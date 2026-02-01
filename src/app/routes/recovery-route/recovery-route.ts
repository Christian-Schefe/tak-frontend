import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { KratosFlowComponent } from '../../components/kratos-flow-component/kratos-flow-component';

@Component({
  selector: 'app-auth-route',
  imports: [CardModule, KratosFlowComponent],
  templateUrl: './recovery-route.html',
  styleUrl: './recovery-route.css',
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class RecoveryRoute {}
