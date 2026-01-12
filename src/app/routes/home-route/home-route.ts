import { Component } from '@angular/core';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-home-route',
  imports: [TableModule],
  templateUrl: './home-route.html',
  styleUrl: './home-route.css',
})
export class HomeRoute {}
