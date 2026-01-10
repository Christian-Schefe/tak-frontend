import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IdentityService } from '../../services/identity-service/identity-service';
import { RatingService } from '../../services/rating-service/rating-service';

@Component({
  selector: 'app-app-nav-component',
  imports: [RouterLink],
  templateUrl: './app-nav-component.html',
  styleUrl: './app-nav-component.css',
})
export class AppNavComponent {
  identityService = inject(IdentityService);
  ratingService = inject(RatingService);
  private playerRatingResource = this.ratingService.getPlayerRatingResource(
    () => this.identityService.identity()?.playerId,
  );
  playerRating = computed(() => {
    if (this.playerRatingResource.hasValue()) {
      return this.playerRatingResource.value();
    }
    return null;
  });
}
