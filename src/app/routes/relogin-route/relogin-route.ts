import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { KratosFlowComponent } from '../../components/kratos-flow-component/kratos-flow-component';

@Component({
  selector: 'app-relogin-route',
  imports: [CardModule, KratosFlowComponent],
  templateUrl: './relogin-route.html',
  styleUrl: './relogin-route.css',
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class ReloginRoute {}
