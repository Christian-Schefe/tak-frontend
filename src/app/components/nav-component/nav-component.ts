import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MenubarModule } from 'primeng/menubar';

@Component({
  selector: 'app-nav-component',
  imports: [RouterLink, MenubarModule],
  templateUrl: './nav-component.html',
  styleUrl: './nav-component.css',
})
export class NavComponent {}
