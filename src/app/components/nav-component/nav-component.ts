import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MenubarModule } from 'primeng/menubar';

@Component({
  selector: 'app-nav-component',
  imports: [RouterLink, MenubarModule],
  templateUrl: './nav-component.html',
  styleUrl: './nav-component.css',
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class NavComponent {}
