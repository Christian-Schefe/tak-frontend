import { Component, inject } from '@angular/core';
import { CardModule } from 'primeng/card';
import { SeekService } from '../../services/seek-service/seek-service';
import { SeeksTableComponent } from '../../components/seeks-table-component/seeks-table-component';

@Component({
  selector: 'app-seeks-route',
  imports: [SeeksTableComponent, CardModule],
  templateUrl: './seeks-route.html',
  styleUrl: './seeks-route.css',
})
export class SeeksRoute {
  private seekService = inject(SeekService);
  seeks = this.seekService.seeks;

  onAcceptSeek(seekId: number) {
    this.seekService.acceptSeek(seekId).subscribe(() => {
      console.log('Seek accepted:', seekId);
    });
  }

  onCancelSeek(seekId: number) {
    this.seekService.cancelSeek(seekId).subscribe(() => {
      console.log('Seek canceled:', seekId);
    });
  }
}
