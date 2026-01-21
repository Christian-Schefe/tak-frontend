import { Component, computed, input, OnInit, signal } from '@angular/core';
import { TakUIPiece } from '../../../../tak-core/ui';
import { TakGameSettings } from '../../../../tak-core';
import { BoardSettings } from '../board-native-component/board-native-component';

@Component({
  selector: 'app-board-piece',
  imports: [],
  templateUrl: './board-piece.html',
  styleUrl: './board-piece.css',
  host: {
    '[style.zIndex]': 'transformData().zIndex',
    '[style.width.%]': 'transformData().width',
    '[style.height.%]': 'transformData().height',
    '[style.transform]':
      '`translate(${transformData().xTransform}%,${transformData().yTransform}%)`',
    '[style.opacity]': 'this.show() ? 1 : 0',
  },
})
export class BoardPiece implements OnInit {
  data = input.required<TakUIPiece>();
  settings = input.required<TakGameSettings>();
  boardSettings = input.required<BoardSettings>();

  private hasTickedOnce = signal(false);
  show = computed(() => this.hasTickedOnce() && !this.transformData().hidden);

  ngOnInit() {
    setTimeout(() => {
      this.hasTickedOnce.set(true);
    });
  }

  transformData = computed(() => {
    const data = this.data();
    const settings = this.settings();
    const effectiveHeight = data.canBePicked ? data.height - data.buriedPieceCount : data.height;
    const height = data.isFloating ? effectiveHeight + 2 : effectiveHeight;

    const buriedLimit = 12;
    const buriedHeightOffset = Math.max(0, data.buriedPieceCount - (buriedLimit - 1));

    const actualHeight = data.canBePicked ? height : height - buriedHeightOffset;

    const zIndex =
      data.zPriority !== null
        ? data.zPriority + 50
        : data.canBePicked
          ? actualHeight + 30
          : Math.max(-12, actualHeight + 12);

    const xTransform = data.pos.x * 100 + (data.canBePicked ? 0 : 35);
    const yTransform =
      (settings.boardSize - 1 - data.pos.y) * 100 - actualHeight * 7 + (data.canBePicked ? 0 : 35);

    const hidden =
      data.deleted || (!data.canBePicked && data.buriedPieceCount - height >= buriedLimit);

    console.log('recompute');

    return {
      zIndex,
      xTransform,
      yTransform,
      hidden,
      width: 100 / settings.boardSize,
      height: 100 / settings.boardSize,
    };
  });

  styleData = computed(() => {
    const data = this.data();
    const boardTheme = this.boardSettings().theme;
    const pieceSize = 0.5;
    const wallWidthRatio = 2 / 5;
    const roundedPercent = boardTheme.pieces.rounded;
    const buriedSizeFactor = 0.25;
    const colors = data.player === 'white' ? boardTheme.piece1 : boardTheme.piece2;
    return {
      width: data.canBePicked ? pieceSize : pieceSize * buriedSizeFactor,
      height: data.canBePicked
        ? data.variant === 'standing'
          ? pieceSize * wallWidthRatio
          : pieceSize
        : pieceSize * buriedSizeFactor,
      borderRadius:
        data.variant === 'standing'
          ? `${roundedPercent.toString()}% ${(roundedPercent / wallWidthRatio).toString()}%`
          : data.variant === 'capstone'
            ? '100%'
            : `${roundedPercent.toString()}%`,
      rotation: data.variant === 'standing' ? -45 : 0,
      outlineColor:
        data.variant === 'capstone' && colors.capstoneOverride
          ? colors.capstoneOverride.border
          : colors.border,
      backgroundColor:
        data.variant === 'capstone' && colors.capstoneOverride
          ? colors.capstoneOverride.background
          : colors.background,
      outlineWidth: boardTheme.pieces.border,
    };
  });
}
