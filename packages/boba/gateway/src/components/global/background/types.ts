export enum BackgroundPosition {
  TOP = 'top',
  CENTER = 'center',
}

export interface BackgroundProps {
  position: BackgroundPosition
}

export const RoutesWithBackgroundPositionAtTop = ['/bridge', '/']
