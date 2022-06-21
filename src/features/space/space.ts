
export enum SpaceType {
  FRAME = 'FRAME',
  FOCUS = 'FOCUS',
};
export type ScrollState = {
  left: number;
  top: number;
};

export type DragState = {
  isScreen: boolean;
  twigId: string;
  dx: number;
  dy: number;
  targetTwigId: string;
};