import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavComponent } from '../../components/nav-component/nav-component';

@Component({
  selector: 'app-public-layout',
  imports: [RouterOutlet, NavComponent],
  templateUrl: './public-layout.html',
  styleUrl: './public-layout.css',
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class PublicLayout {}
